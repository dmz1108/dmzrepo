# DreamerQi production operation: write the manually transcribed 2026-07-24
# official @TGB Hunan table, rebuild the same-day combined reason database,
# and verify the public source view.
#
# The 40 formal rows are supplied only through a date-bound encrypted GitHub
# production-environment secret. They are not tracked in Git or printed here.
# The script verifies the payload and official-image SHA-256 values, reconciles
# all 40 review-eligible terminal-pool rows, backs up every touched artifact,
# writes atomically, rolls back on failure, and never restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$payloadFile = [string]$env:DREAMERQI_TGB_MANUAL_PAYLOAD_FILE
$expectedPayloadSha256 = 'e8ec18efa6f7dc81f6be0ff89d8c2049f776f5541b4deee0a10f57a549e55915'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-tgb-hunan-write-' + [Guid]::NewGuid().ToString('N') + '.js')

if (-not $payloadFile -or -not (Test-Path -LiteralPath $payloadFile)) {
  throw 'Date-bound encrypted TGB payload file is missing.'
}

$js = @'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const projectRoot = process.argv[2];
const payloadFile = process.argv[3];
const expectedPayloadSha256 = process.argv[4].toLowerCase();
const actor = process.argv[5] || 'unknown';
const operationCommit = process.argv[6] || '';
const operationRunId = process.argv[7] || '';
const day = '2026-07-24';
const articleUrl = 'https://www.tgb.cn/a/2tH73JZqkpi';
const articleTitle = '7.24\u6e56\u5357\u4eba\u6da8\u505c\u590d\u76d8+\u665a\u95f4\u6d88\u606f\u6c47\u603b';
const imageFile = 'image-01-07.png';
const imageUrl = 'https://image.tgb.cn/img/2026/07/24/p4wrmyze8ckl.png_760w.png';
const expectedImageLength = 530066;
const expectedImageSha256 = '60347f3fcbe837df5007852f8d257b20e0a2375cd60d5386b0c1f5a61b54b88c';
const expectedCount = 40;
const expectedRawPoolCount = 40;
const operationId = 'tgb-hunan-manual-20260724';
const fixedSource = 'review/tgb-hunan-structured';
const fixedQualityNote = 'Manual transcription from @TGB\u6e56\u5357\u4eba official table image; source-faithful board block and stock detail reason.';
const publicRequestTimeoutMs = 25000;

const baselineRel = path.join('kpl-limitup-db', `${day}.json`);
const formalRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-structured', `${day}.json`);
const combinedRel = path.join('kpl-limitup-main-reason-db', `${day}.json`);
const evidenceRel = path.join('kpl-limitup-main-reason-evidence', `${day}.json`);
const qualityRel = path.join('kpl-limitup-main-reason-quality', `${day}.json`);
const autoRel = path.join('kpl-limitup-main-reason-sources', 'auto', `${day}.json`);
const kaipanlaRel = path.join('kpl-limitup-main-reason-sources', 'kaipanla-fupanla', `${day}.json`);
const xuangubaoRel = path.join('kpl-limitup-main-reason-sources', 'xuangubao-limit-up', `${day}.json`);
const jiuyangongsheRel = path.join('kpl-limitup-main-reason-sources', 'jiuyangongshe-structured', `${day}.json`);
const rawManifestRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-raw', day, 'manifest.json');
const rawImageRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-raw', day, imageFile);
const logRels = ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md'];
const touchedRels = [
  baselineRel,
  formalRel,
  combinedRel,
  evidenceRel,
  qualityRel,
  autoRel,
  kaipanlaRel,
  xuangubaoRel,
  jiuyangongsheRel,
  ...logRels,
];
const backupRels = [...new Set([...touchedRels, rawManifestRel, rawImageRel])];

const shaBuffer = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const shaFile = file => shaBuffer(fs.readFileSync(file));
const asText = value => String(value == null ? '' : value).trim();
const normalizeCode = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? digits.slice(-6).padStart(6, '0') : '';
};
const normalizeName = value => asText(value).normalize('NFKC');
const toSet = values => new Set(values);
const setDiff = (left, right) => [...left].filter(value => !right.has(value)).sort();

function excludedFromReview(code, name) {
  return /^[489]/.test(code) || /(?:\*?ST|\u9000)/i.test(name) || /^[NC]/i.test(name);
}

function fileState(relative) {
  const file = path.join(projectRoot, relative);
  return fs.existsSync(file)
    ? { exists: true, sha256: shaFile(file) }
    : { exists: false, sha256: '' };
}

function copyRelative(relative, destinationRoot) {
  const source = path.join(projectRoot, relative);
  if (!fs.existsSync(source)) return false;
  const destination = path.join(destinationRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

function restoreFileStates(relativePaths, backupDir, beforeStates) {
  const failures = [];
  for (const relative of relativePaths) {
    try {
      const live = path.join(projectRoot, relative);
      const backup = path.join(backupDir, relative);
      const before = beforeStates.get(relative);
      if (before.exists) {
        if (!fs.existsSync(backup)) throw new Error('rollback backup missing');
        fs.mkdirSync(path.dirname(live), { recursive: true });
        fs.copyFileSync(backup, live);
      } else if (fs.existsSync(live)) {
        fs.rmSync(live, { force: true });
      }
      const after = fileState(relative);
      if (after.exists !== before.exists || after.sha256 !== before.sha256) {
        throw new Error('rollback state/hash mismatch');
      }
    } catch (error) {
      failures.push({ relative, error: error.message });
    }
  }
  return failures;
}

function atomicWriteJson(file, payload) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const old = `${file}.${process.pid}.${Date.now()}.old`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  const existed = fs.existsSync(file);
  if (existed) fs.renameSync(file, old);
  try {
    fs.renameSync(temp, file);
    if (existed) fs.rmSync(old, { force: true });
  } catch (error) {
    fs.rmSync(temp, { force: true });
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    if (existed && fs.existsSync(old)) fs.renameSync(old, file);
    throw error;
  }
}

function baselineRows(payload) {
  return (Array.isArray(payload?.stocks) ? payload.stocks : [])
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name);
}

function validateBaseline(payload) {
  const rawRows = baselineRows(payload);
  const rawCodes = toSet(rawRows.map(row => row.code));
  const excludedRows = rawRows.filter(row => excludedFromReview(row.code, row.name));
  if (rawRows.length !== expectedRawPoolCount
      || rawCodes.size !== expectedRawPoolCount
      || excludedRows.length !== 0) {
    throw new Error(`terminal pool gate failed: ${JSON.stringify({
      count: rawRows.length,
      uniqueCount: rawCodes.size,
      excludedRows,
    })}`);
  }
  return { rows: rawRows, count: rawRows.length, uniqueCount: rawCodes.size, excludedRows };
}

function validatePayload(payload, baselineGate) {
  if (payload.day !== day) throw new Error('payload day mismatch');
  if (payload.source !== fixedSource) throw new Error('payload source mismatch');
  if (payload.url !== articleUrl || payload.title !== articleTitle) throw new Error('payload article mismatch');
  if (payload.method !== 'manual-hunan-table') throw new Error('payload method mismatch');
  if (payload.evidence?.imageFile !== imageFile
      || payload.evidence?.imageUrl !== imageUrl
      || Number(payload.evidence?.imageLength) !== expectedImageLength
      || payload.evidence?.imageSha256 !== expectedImageSha256) {
    throw new Error('payload image evidence mismatch');
  }
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (rows.length !== expectedCount || Number(payload.count) !== expectedCount) {
    throw new Error('payload count mismatch');
  }

  const codes = rows.map(row => normalizeCode(row.code));
  const codeSet = toSet(codes);
  const duplicateCodes = [...new Set(codes.filter((code, index) => codes.indexOf(code) !== index))].sort();
  const weakRows = rows.filter(row => ![
    row.code,
    row.name,
    row.boardTopic,
    row.detailReason,
    row.firstLimitTime,
    row.limitUpCount,
  ].every(value => asText(value))
    || row.source !== fixedSource
    || row.matchType !== 'manual-hunan-table'
    || row.reasonQuality !== 'clear'
    || Number(row.confidence) !== 0.99
    || row.qualityNote !== fixedQualityNote);

  const baselineByCode = new Map(baselineGate.rows.map(row => [row.code, row.name]));
  const baselineCodes = toSet(baselineByCode.keys());
  const missingCodes = setDiff(baselineCodes, codeSet);
  const extraCodes = setDiff(codeSet, baselineCodes);
  const nameMismatches = rows
    .filter(row => normalizeName(baselineByCode.get(normalizeCode(row.code))) !== normalizeName(row.name))
    .map(row => normalizeCode(row.code));
  const nameNormalizationDifferences = rows
    .filter(row => {
      const baselineName = asText(baselineByCode.get(normalizeCode(row.code)));
      return baselineName && baselineName !== asText(row.name)
        && normalizeName(baselineName) === normalizeName(row.name);
    })
    .map(row => normalizeCode(row.code));
  const topicCounts = rows.reduce((result, row) => {
    const topic = asText(row.boardTopic);
    result[topic] = (result[topic] || 0) + 1;
    return result;
  }, {});
  const expectedTopics = {
    '\u534a\u5bfc\u4f53': 8,
    '\u519b\u5de5': 7,
    '\u667a\u80fd\u7535\u7f51': 6,
    '\u8d44\u4ea7\u91cd\u7ec4': 3,
    '\u5176\u4ed6\u70ed\u70b9': 6,
    '\u5176\u4ed6\u4e2a\u80a1': 10,
  };
  const topicCountTotal = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
  const topicCountsMatch = Object.keys(topicCounts).length === Object.keys(expectedTopics).length
    && Object.entries(expectedTopics).every(([topic, count]) => topicCounts[topic] === count);
  const gate = {
    expectedCount: baselineCodes.size,
    actualCount: rows.length,
    uniqueCount: codeSet.size,
    missingCodes,
    extraCodes,
    duplicateCodes,
    weakCount: weakRows.length,
    nameMismatches,
    nameNormalizationDifferences,
    topicCounts,
    topicCountTotal,
  };
  if (baselineCodes.size !== expectedCount
      || codeSet.size !== expectedCount
      || missingCodes.length
      || extraCodes.length
      || duplicateCodes.length
      || weakRows.length
      || nameMismatches.length
      || nameNormalizationDifferences.length
      || topicCountTotal !== expectedCount
      || !topicCountsMatch) {
    throw new Error(`formal quality gate failed: ${JSON.stringify(gate)}`);
  }
  return gate;
}

function validateExactStockSet(label, payload, expectedCodes) {
  const rows = Array.isArray(payload?.stocks) ? payload.stocks : [];
  const codes = toSet(rows.map(row => normalizeCode(row.code)));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  if (rows.length !== expectedCount || codes.size !== expectedCount
      || missingCodes.length || extraCodes.length) {
    throw new Error(`${label} code-set gate failed: ${JSON.stringify({
      count: rows.length,
      uniqueCount: codes.size,
      missingCodes,
      extraCodes,
    })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, missingCodes, extraCodes };
}

function validateTgbStat(label, stats, sourceErrors) {
  const stat = (Array.isArray(stats) ? stats : []).find(item => item.source === fixedSource);
  const errors = Array.isArray(sourceErrors) ? sourceErrors : [];
  if (Number(stat?.rowCount) !== expectedCount
      || Number(stat?.stockCount) !== expectedCount
      || Number(stat?.coveragePct) !== 100
      || Number(stat?.mainReasonCoveragePct) !== 100
      || Number(stat?.lowConfidenceStockCount || 0) !== 0
      || errors.length !== 0) {
    throw new Error(`${label} TGB health gate failed: ${JSON.stringify({ stat, sourceErrors: errors })}`);
  }
  return stat;
}

function validatePreviouslyHealthySources(label, stats, previouslyHealthySources) {
  const all = Array.isArray(stats) ? stats : [];
  const result = previouslyHealthySources.map(expected => {
    const stat = all.find(item => item.source === expected.source);
    return {
      source: expected.source,
      rowCount: Number(stat?.rowCount || 0),
      stockCount: Number(stat?.stockCount || 0),
      coveragePct: Number(stat?.coveragePct || 0),
      mainReasonCoveragePct: Number(stat?.mainReasonCoveragePct || 0),
      lowConfidenceStockCount: Number(stat?.lowConfidenceStockCount || 0),
    };
  });
  if (result.some(item => item.rowCount !== expectedCount
      || item.stockCount !== expectedCount
      || item.coveragePct !== 100
      || item.mainReasonCoveragePct !== 100
      || item.lowConfidenceStockCount !== 0)) {
    throw new Error(`${label} pre-existing source health regressed: ${JSON.stringify(result)}`);
  }
  return result;
}

function validateAutoTgb(payload, expectedCodes) {
  const rows = (Array.isArray(payload?.rawRows) ? payload.rawRows : [])
    .filter(row => row.source === fixedSource);
  const codes = toSet(rows.map(row => normalizeCode(row.code)));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  if (rows.length !== expectedCount || codes.size !== expectedCount
      || missingCodes.length || extraCodes.length) {
    throw new Error(`auto TGB gate failed: ${JSON.stringify({
      count: rows.length,
      uniqueCount: codes.size,
      missingCodes,
      extraCodes,
    })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, missingCodes, extraCodes };
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { 'user-agent': 'DreamerQi-protected-production-operation' },
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`public verification HTTP ${response.statusCode}: ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(publicRequestTimeoutMs, () => {
      request.destroy(new Error(`public verification timed out after ${publicRequestTimeoutMs}ms`));
    });
    request.on('error', reject);
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function verifyPublic(expectedCodes, previouslyHealthySources) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const t = Date.now();
    const [sourceView, mainDay, limitStatus, health] = await Promise.all([
      getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=${day}&force=1&t=${t}`),
      getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/day?day=${day}&force=1&t=${t}`),
      getJson(`https://market.dreamerqi.com/api/limit-up-db/status?day=${day}&t=${t}`),
      getJson(`https://market.dreamerqi.com/health?t=${t}`),
    ]);
    try {
      const tabs = Array.isArray(sourceView.tabs) ? sourceView.tabs : [];
      const tgbTab = tabs.find(tab => tab.label === '\u6dd8\u80a1\u5427');
      const combinedTab = tabs.find(tab => tab.label === '\u7efc\u5408\u5f52\u7eb3');
      const tgbRows = Array.isArray(tgbTab?.rows) ? tgbTab.rows : [];
      const combinedRows = Array.isArray(combinedTab?.rows) ? combinedTab.rows : [];
      const tgbCodes = toSet(tgbRows.map(row => normalizeCode(row.code)));
      const combinedCodes = toSet(combinedRows.map(row => normalizeCode(row.code)));
      if (tgbRows.length !== expectedCount || tgbCodes.size !== expectedCount
          || setDiff(expectedCodes, tgbCodes).length || setDiff(tgbCodes, expectedCodes).length
          || combinedRows.length !== expectedCount || combinedCodes.size !== expectedCount
          || setDiff(expectedCodes, combinedCodes).length || setDiff(combinedCodes, expectedCodes).length) {
        throw new Error('public tab code-set mismatch');
      }
      const sourceTgbStat = validateTgbStat('public source-view', sourceView.sourceStats, sourceView.sourceErrors);
      const mainTgbStat = validateTgbStat(
        'public main-reason day',
        mainDay.sourceCoverage?.reviewAutoSources,
        mainDay.sourceCoverage?.sourceErrors,
      );
      const sourcePreserved = validatePreviouslyHealthySources(
        'public source-view',
        sourceView.sourceStats,
        previouslyHealthySources,
      );
      const mainPreserved = validatePreviouslyHealthySources(
        'public main-reason day',
        mainDay.sourceCoverage?.reviewAutoSources,
        previouslyHealthySources,
      );
      validateExactStockSet('public main-reason day', mainDay, expectedCodes);
      const statusDay = (limitStatus.days || []).find(item => item.day === day);
      if (Number(statusDay?.count) !== expectedRawPoolCount || health?.ok !== true) {
        throw new Error('public baseline/health mismatch');
      }
      return {
        combinedCount: combinedRows.length,
        tgbCount: tgbRows.length,
        tabCounts: tabs.map(tab => ({ label: tab.label, count: tab.rows?.length || 0 })),
        sourceTgbStat,
        mainTgbStat,
        previouslyHealthySourceStats: sourcePreserved,
        previouslyHealthyMainStats: mainPreserved,
        sourceErrors: sourceView.sourceErrors || [],
        mainSourceErrors: mainDay.sourceCoverage?.sourceErrors || [],
        limitUpDb: statusDay,
        health,
      };
    } catch (error) {
      if (attempt === 6) throw error;
      await sleep(2000);
    }
  }
  throw new Error('public verification exhausted retries');
}

(async () => {
  const payloadB64 = fs.readFileSync(payloadFile, 'utf8').trim();
  const payloadBytes = zlib.gunzipSync(Buffer.from(payloadB64, 'base64'));
  const inputSha256 = shaBuffer(payloadBytes);
  if (inputSha256 !== expectedPayloadSha256) throw new Error('manual payload SHA-256 mismatch');
  const payload = JSON.parse(payloadBytes.toString('utf8'));

  const baselineFile = path.join(projectRoot, baselineRel);
  const rawManifestFile = path.join(projectRoot, rawManifestRel);
  const rawImageFile = path.join(projectRoot, rawImageRel);
  if (!fs.existsSync(baselineFile)) throw new Error('same-day terminal limit-up pool is missing');
  if (!fs.existsSync(rawManifestFile) || !fs.existsSync(rawImageFile)) {
    throw new Error('official raw manifest/image evidence is missing');
  }
  for (const relative of logRels) {
    const file = path.join(projectRoot, relative);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`required cloud operation log is missing: ${relative}`);
    }
  }

  const baselinePayload = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const baselineGate = validateBaseline(baselinePayload);
  const gate = validatePayload(payload, baselineGate);
  const expectedCodes = toSet(payload.rows.map(row => normalizeCode(row.code)));

  const rawManifest = JSON.parse(fs.readFileSync(rawManifestFile, 'utf8'));
  if (rawManifest.day !== day || rawManifest.status !== 'raw-evidence-saved') {
    throw new Error('raw manifest status/day mismatch');
  }
  const officialArticle = (rawManifest.articles || []).find(article => article.url === articleUrl);
  const officialImage = (officialArticle?.images || []).find(image => image.file === imageFile
    && image.url === imageUrl
    && image.saved === true
    && Number(image.length) === expectedImageLength
    && !image.error);
  if (!officialArticle || !officialImage || officialArticle.title !== articleTitle) {
    throw new Error('selected official article/image is absent from raw manifest');
  }
  if (fs.statSync(rawImageFile).size !== expectedImageLength
      || shaFile(rawImageFile) !== expectedImageSha256) {
    throw new Error('official image length/SHA-256 mismatch');
  }

  const combinedFile = path.join(projectRoot, combinedRel);
  const preCombined = fs.existsSync(combinedFile)
    ? JSON.parse(fs.readFileSync(combinedFile, 'utf8'))
    : {};
  const previouslyHealthySources = (preCombined.sourceCoverage?.reviewAutoSources || [])
    .filter(item => item.source !== fixedSource
      && Number(item.rowCount) === expectedCount
      && Number(item.stockCount) === expectedCount
      && Number(item.coveragePct) === 100
      && Number(item.mainReasonCoveragePct) === 100
      && Number(item.lowConfidenceStockCount || 0) === 0)
    .map(item => ({ source: item.source }));

  const completedAt = new Date().toISOString();
  const stamp = completedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(projectRoot, 'backups', `${operationId}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const beforeStates = new Map();
  for (const relative of backupRels) {
    const state = fileState(relative);
    beforeStates.set(relative, state);
    const copied = copyRelative(relative, backupDir);
    if (copied !== state.exists) throw new Error(`backup existence mismatch: ${relative}`);
    if (state.exists && shaFile(path.join(backupDir, relative)) !== state.sha256) {
      throw new Error(`backup SHA-256 mismatch: ${relative}`);
    }
  }

  const finalPayload = JSON.parse(JSON.stringify(payload));
  finalPayload.generatedAt = completedAt;
  finalPayload.savedAt = completedAt;
  finalPayload.validation = {
    ...gate,
    rawPoolCount: baselineGate.count,
    excludedRawPoolRows: baselineGate.excludedRows,
    manualSecondPassReviewed: true,
  };

  try {
    const formalFile = path.join(projectRoot, formalRel);
    atomicWriteJson(formalFile, finalPayload);
    const rebuild = spawnSync(process.execPath, [
      path.join(projectRoot, 'kpl-stats-server.js'),
      '--main-reason-backfill',
      `--day=${day}`,
      '--days=1',
      '--force',
    ], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 10 * 60 * 1000,
    });
    if (rebuild.error) throw rebuild.error;
    if (rebuild.status !== 0) {
      throw new Error(`main-reason backfill failed: ${asText(rebuild.stderr || rebuild.stdout).slice(-1000)}`);
    }

    const storedBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    const storedBaselineGate = validateBaseline(storedBaseline);
    const storedGate = validatePayload(
      JSON.parse(fs.readFileSync(formalFile, 'utf8')),
      storedBaselineGate,
    );
    if (setDiff(expectedCodes, toSet(storedBaselineGate.rows.map(row => row.code))).length
        || setDiff(toSet(storedBaselineGate.rows.map(row => row.code)), expectedCodes).length) {
      throw new Error('terminal pool changed during rebuild');
    }

    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    const combinedSetGate = validateExactStockSet('combined reason database', combined, expectedCodes);
    const combinedTgbStat = validateTgbStat(
      'combined reason database',
      combined.sourceCoverage?.reviewAutoSources,
      combined.sourceCoverage?.sourceErrors,
    );
    const combinedPreserved = validatePreviouslyHealthySources(
      'combined reason database',
      combined.sourceCoverage?.reviewAutoSources,
      previouslyHealthySources,
    );
    const evidence = JSON.parse(fs.readFileSync(path.join(projectRoot, evidenceRel), 'utf8'));
    const evidenceSetGate = validateExactStockSet('main-reason evidence', evidence, expectedCodes);
    const evidenceTgbStat = validateTgbStat(
      'main-reason evidence',
      evidence.sourceStats,
      evidence.sourceErrors,
    );
    const quality = JSON.parse(fs.readFileSync(path.join(projectRoot, qualityRel), 'utf8'));
    if (Number(quality.total) !== expectedCount
        || Number(quality.reviewCoveragePct) !== 100
        || Number(quality.reviewMainReasonCoveragePct) !== 100
        || (quality.sourceErrors || []).length !== 0) {
      throw new Error('main-reason quality gate failed');
    }
    const auto = JSON.parse(fs.readFileSync(path.join(projectRoot, autoRel), 'utf8'));
    const autoTgbGate = validateAutoTgb(auto, expectedCodes);
    const autoTgbStat = validateTgbStat('auto source', auto.sourceStats, auto.sourceErrors);
    const publicView = await verifyPublic(expectedCodes, previouslyHealthySources);

    const baselineSha256 = shaFile(baselineFile);
    const formalSha256 = shaFile(formalFile);
    const combinedSha256 = shaFile(combinedFile);
    const logEntry = [
      '',
      `## ${day} - ${operationId}`,
      `- Actor: ${actor}`,
      `- Commit: ${operationCommit}`,
      `- Run: ${operationRunId}`,
      `- Article: ${articleUrl}`,
      `- Official image: ${imageFile}; length=${expectedImageLength}; sha256=${expectedImageSha256}`,
      `- Manual payload: count=${expectedCount}; sha256=${inputSha256}; second-pass-reviewed=true`,
      `- Gate: missing=0; extra=0; duplicates=0; weak=0; name-mismatches=0; topic-total=${gate.topicCountTotal}`,
      `- Backup: ${backupDir}`,
      `- Formal TGB sha256: ${formalSha256}`,
      `- Combined main-reason sha256: ${combinedSha256}`,
      '- Combined main-reason rebuilt: yes',
      `- Public TGB count: ${publicView.tgbCount}; combined count: ${publicView.combinedCount}; source-errors=0`,
      '- Service restart: none',
      '',
    ].join('\r\n');
    for (const relative of logRels) {
      fs.appendFileSync(path.join(projectRoot, relative), logEntry, 'utf8');
    }

    console.log(JSON.stringify({
      ok: true,
      operation: operationId,
      day,
      completedAt,
      articleUrl,
      articleTitle,
      imageFile,
      imageUrl,
      imageLength: expectedImageLength,
      imageSha256: expectedImageSha256,
      inputSha256,
      count: expectedCount,
      gate,
      storedGate,
      combinedSetGate,
      evidenceSetGate,
      autoTgbGate,
      combinedTgbStat,
      evidenceTgbStat,
      autoTgbStat,
      previouslyHealthySources,
      combinedPreserved,
      publicView,
      baselineSha256,
      formalSha256,
      combinedSha256,
      backupDir,
      combinedReasonRebuilt: true,
      serviceRestarted: false,
    }, null, 2));
  } catch (error) {
    const rollbackFailures = restoreFileStates(touchedRels, backupDir, beforeStates);
    try {
      await getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/day?day=${day}&force=1&rollback=${Date.now()}`);
    } catch (rollbackError) {
      rollbackFailures.push({ relative: 'public-cache', error: rollbackError.message });
    }
    throw new Error(`${error.message}; rollbackFailures=${JSON.stringify(rollbackFailures)}`);
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
'@

try {
  [System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
  & node $nodeScript $project $payloadFile $expectedPayloadSha256 `
    ([string]$env:DREAMERQI_OPS_ACTOR) `
    ([string]$env:DREAMERQI_OPS_COMMIT) `
    ([string]$env:DREAMERQI_OPS_RUN_ID)
  if ($LASTEXITCODE -ne 0) {
    throw ('TGB manual write exited with ' + $LASTEXITCODE)
  }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
