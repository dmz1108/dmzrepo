# DreamerQi production operation: write the manually transcribed 2026-07-22
# official @TGB Hunan table, rebuild the same-day combined reason database,
# and verify the public source view.
#
# The 46 formal rows are supplied only through a date-bound encrypted GitHub
# production-environment secret. They are not tracked in Git or printed here.
# The script verifies the payload SHA-256, reconciles the 46 review-eligible
# rows against the current 46-row raw terminal pool with no
# ST/BSE/new-prefix row, repeats the complete quality gate, backs up every
# touched runtime artifact, writes atomically, rolls back on any failure, and
# never restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-22'
$payloadFile = [string]$env:DREAMERQI_TGB_MANUAL_PAYLOAD_FILE
$expectedPayloadSha256 = '1015192cf9a2c45b759273ee2041f9e3bd6dde291ef4dc65ba0c1eae4f4c8514'
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
const expectedPayloadSha256 = process.argv[4];
const actor = process.argv[5] || 'unknown';
const operationCommit = process.argv[6] || '';
const operationRunId = process.argv[7] || '';
const day = '2026-07-22';
const articleUrl = 'https://www.tgb.cn/a/2tDNd3zOTPi';
const articleTitle = '7.22\u6e56\u5357\u4eba\u6da8\u505c\u590d\u76d8+\u665a\u95f4\u6d88\u606f\u6c47\u603b';
const imageFile = 'image-01-06.png';
const imageUrl = 'https://image.tgb.cn/img/2026/07/22/sut9bns87hak.png_760w.png';
const expectedImageLength = 680572;
const expectedImageSha256 = '7f57aceb616fe744525793b6c2dc97471e3d277b3f69706c8f6504749426c3e8';
const operationId = 'tgb-hunan-manual-20260722';
const expectedCount = 46;
const expectedRawPoolCount = 46;
const publicRequestTimeoutMs = 25000;
const expectedInputSha256 = expectedPayloadSha256.toLowerCase();
const fixedSource = 'review/tgb-hunan-structured';
const fixedQualityNote = 'Manual transcription from @TGB\u6e56\u5357\u4eba official table image; source-faithful board block and stock detail reason.';
const expectedReviewSources = [
  { source: 'review/kaipanla-fupanla', group: 'kaipanla', label: '\u590d\u76d8\u5566' },
  { source: 'review/xuangubao-limit-up', group: 'xuangubao', label: '\u9009\u80a1\u5b9d' },
  { source: 'review/jiuyangongshe-structured', group: 'jiuyangongshe', label: '\u97ed\u7814' },
  { source: fixedSource, group: 'tgb', label: '\u6dd8\u80a1\u5427' },
];

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
const normalizeCode = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? digits.slice(-6).padStart(6, '0') : '';
};
const normalizeNameForMatch = value => String(value == null ? '' : value).trim().normalize('NFKC');
const toSet = values => new Set(values);
const setDiff = (left, right) => [...left].filter(value => !right.has(value)).sort();
const asText = value => String(value == null ? '' : value).trim();
const clone = value => JSON.parse(JSON.stringify(value));
const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
  }
  return value;
};
const stableJson = value => JSON.stringify(canonicalize(value));
const shaValue = value => shaBuffer(Buffer.from(stableJson(value), 'utf8'));

function excludedFromReview(code, name) {
  return /^[489]/.test(code) || /(?:\*?ST|\u9000)/i.test(name) || /^[NC]/i.test(name);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'user-agent': 'DreamerQi-protected-production-operation' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`public verification HTTP ${response.statusCode}: ${url}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.setTimeout(publicRequestTimeoutMs, () => {
      request.destroy(new Error(`public verification timed out after ${publicRequestTimeoutMs}ms: ${url}`));
    });
    request.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

function copyRelative(relative, destinationRoot) {
  const source = path.join(projectRoot, relative);
  if (!fs.existsSync(source)) return false;
  const destination = path.join(destinationRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

function fileState(relative) {
  const file = path.join(projectRoot, relative);
  return fs.existsSync(file)
    ? { exists: true, sha256: shaFile(file) }
    : { exists: false, sha256: '' };
}

function verifyFileStates(relativePaths, beforeStates) {
  const failures = [];
  for (const relative of relativePaths) {
    const expected = beforeStates.get(relative);
    const actual = fileState(relative);
    if (!expected || actual.exists !== expected.exists || actual.sha256 !== expected.sha256) {
      failures.push({ relative, expected: expected || null, actual });
    }
  }
  return failures;
}

function restoreFileStates(relativePaths, backupDir, beforeStates) {
  const failures = [];
  for (const relative of relativePaths) {
    try {
      const live = path.join(projectRoot, relative);
      const backup = path.join(backupDir, relative);
      const expected = beforeStates.get(relative);
      if (expected?.exists && fs.existsSync(backup)) {
        fs.mkdirSync(path.dirname(live), { recursive: true });
        fs.copyFileSync(backup, live);
      } else if (!expected?.exists && fs.existsSync(live)) {
        fs.rmSync(live, { force: true });
      } else if (expected?.exists) {
        throw new Error('rollback backup is missing');
      }
    } catch (error) {
      failures.push({ relative, error: error.message });
    }
  }
  return failures.concat(verifyFileStates(relativePaths, beforeStates)
    .map(item => ({ ...item, error: 'restored file SHA-256/state mismatch' })));
}

function mainReasonComparable(payload) {
  return {
    stocks: (Array.isArray(payload?.stocks) ? payload.stocks : [])
      .map(row => ({
        code: normalizeCode(row.code),
        name: asText(row.name),
        finalBoardTopic: asText(row.finalBoardTopic),
        finalDetailReason: asText(row.finalDetailReason),
      }))
      .sort((left, right) => left.code.localeCompare(right.code)),
    sourceCoverage: payload?.sourceCoverage || null,
  };
}

function tgbRowsComparable(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map(row => ({
      code: normalizeCode(row.code),
      name: asText(row.name),
      boardTopic: asText(row.boardTopic),
      detailReason: asText(row.detailReason),
      firstLimitTime: asText(row.firstLimitTime),
      limitUpCount: asText(row.limitUpCount),
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
}

function baselineRowsFromPayload(payload) {
  return (Array.isArray(payload?.stocks) ? payload.stocks : [])
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name && !excludedFromReview(row.code, row.name));
}

function validateRawBaseline(payload) {
  const rows = (Array.isArray(payload?.stocks) ? payload.stocks : [])
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name);
  const codes = toSet(rows.map(row => row.code));
  const excludedRows = rows.filter(row => excludedFromReview(row.code, row.name));
  if (rows.length !== expectedRawPoolCount || codes.size !== expectedRawPoolCount || excludedRows.length !== 0) {
    throw new Error(`raw terminal pool validation failed: ${JSON.stringify({
      count: rows.length,
      uniqueCount: codes.size,
      excludedRows,
    })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, excludedRows };
}

function validatePayload(payload, baselineRows) {
  if (payload.day !== day) throw new Error('payload day mismatch');
  if (payload.source !== fixedSource) throw new Error('payload source mismatch');
  if (payload.url !== articleUrl) throw new Error('payload article URL mismatch');
  if (payload.title !== articleTitle) throw new Error('payload article title mismatch');
  if (payload.method !== 'manual-hunan-table') throw new Error('payload method mismatch');
  if (payload.evidence?.imageFile !== imageFile) throw new Error('payload evidence image mismatch');
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  if (rows.length !== expectedCount || Number(payload.count) !== expectedCount) throw new Error('payload count mismatch');

  const codes = rows.map(row => normalizeCode(row.code));
  const codeSet = toSet(codes);
  const duplicateCodes = [...new Set(codes.filter((code, index) => codes.indexOf(code) !== index))];
  const weakRows = rows.filter(row => ![
    row.code,
    row.name,
    row.boardTopic,
    row.detailReason,
    row.firstLimitTime,
    row.limitUpCount,
  ].every(value => asText(value))
    || row.source !== fixedSource
    || row.reasonQuality !== 'clear'
    || row.matchType !== 'manual-hunan-table'
    || Number(row.confidence) !== 0.99
    || row.qualityNote !== fixedQualityNote);

  const baseline = baselineRows
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name && !excludedFromReview(row.code, row.name));
  const baselineByCode = new Map(baseline.map(row => [row.code, row.name]));
  const baselineCodes = toSet(baselineByCode.keys());
  const missingCodes = setDiff(baselineCodes, codeSet);
  const extraCodes = setDiff(codeSet, baselineCodes);
  const nameMismatches = rows
    .filter(row => normalizeNameForMatch(baselineByCode.get(normalizeCode(row.code))) !== normalizeNameForMatch(row.name))
    .map(row => normalizeCode(row.code));
  const nameNormalizationDifferences = rows
    .filter(row => {
      const baselineName = asText(baselineByCode.get(normalizeCode(row.code)));
      return baselineName && baselineName !== asText(row.name)
        && normalizeNameForMatch(baselineName) === normalizeNameForMatch(row.name);
    })
    .map(row => ({
      code: normalizeCode(row.code),
      sourceName: asText(row.name),
      baselineName: asText(baselineByCode.get(normalizeCode(row.code))),
      normalization: 'NFKC',
    }));
  const nameNormalizationOk = nameNormalizationDifferences.length === 0;

  const topicCounts = rows.reduce((result, row) => {
    const topic = asText(row.boardTopic);
    result[topic] = (result[topic] || 0) + 1;
    return result;
  }, {});
  const expectedTopics = {
    '\u7535\u529b': 12,
    '\u533b\u836f': 5,
    '\u534a\u5bfc\u4f53': 4,
    '\u7b97\u529b': 4,
    '\u8d85\u8282\u70b9': 3,
    '\u9ec4\u91d1': 3,
    '\u516c\u544a': 4,
    '\u5176\u4ed6\u70ed\u70b9': 4,
    '\u5176\u4ed6\u4e2a\u80a1': 7,
  };
  const topicCountTotal = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
  const topicCountsMatch = Object.keys(expectedTopics).length === Object.keys(topicCounts).length
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
    nameNormalizationOk,
    topicCounts,
    topicCountTotal,
  };
  if (baselineCodes.size !== expectedCount || codeSet.size !== expectedCount || missingCodes.length
      || extraCodes.length || duplicateCodes.length || weakRows.length || nameMismatches.length
      || topicCountTotal !== expectedCount || !topicCountsMatch || !nameNormalizationOk) {
    throw new Error(`formal quality gate failed: ${JSON.stringify(gate)}`);
  }
  return gate;
}

function validateStoredBaseline(payload, expectedCodes) {
  const rawGate = validateRawBaseline(payload);
  const rows = baselineRowsFromPayload(payload);
  const codes = toSet(rows.map(row => row.code));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  const ok = rows.length === expectedCount
    && codes.size === expectedCount
    && !missingCodes.length
    && !extraCodes.length;
  if (!ok) throw new Error(`terminal pool changed during rebuild: ${JSON.stringify({
    count: rows.length,
    uniqueCount: codes.size,
    missingCodes,
    extraCodes,
  })}`);
  return {
    count: rows.length,
    uniqueCount: codes.size,
    missingCodes,
    extraCodes,
    rawCount: rawGate.count,
    excludedRawPoolRows: rawGate.excludedRows,
  };
}

function validateExactStockSet(label, payload, expectedCodes) {
  const rows = Array.isArray(payload?.stocks) ? payload.stocks : [];
  const codes = toSet(rows.map(row => normalizeCode(row.code)));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  if (rows.length !== expectedCount || codes.size !== expectedCount || missingCodes.length || extraCodes.length) {
    throw new Error(`${label} code-set validation failed: ${JSON.stringify({
      count: rows.length,
      uniqueCount: codes.size,
      missingCodes,
      extraCodes,
    })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, missingCodes, extraCodes };
}

function validateTgbCoverage(label, stats, sourceErrors) {
  const stat = (Array.isArray(stats) ? stats : []).find(item => item.source === fixedSource);
  const allErrors = Array.isArray(sourceErrors) ? sourceErrors : [];
  const ok = Number(stat?.rowCount) === expectedCount
    && Number(stat?.stockCount) === expectedCount
    && Number(stat?.coveragePct) === 100
    && Number(stat?.mainReasonCoveragePct) === 100
    && Number(stat?.lowConfidenceStockCount || 0) === 0
    && allErrors.length === 0;
  if (!ok) throw new Error(`${label} TGB coverage validation failed: ${JSON.stringify({ stat, sourceErrors: allErrors })}`);
  return stat;
}

function validateAllReviewSourceHealth(label, stats, sourceErrors) {
  const allStats = Array.isArray(stats) ? stats : [];
  const allErrors = Array.isArray(sourceErrors) ? sourceErrors : [];
  const sourceHealth = expectedReviewSources.map(expected => {
    const stat = allStats.find(item => item.source === expected.source);
    return {
      source: expected.source,
      group: expected.group,
      rowCount: Number(stat?.rowCount || 0),
      stockCount: Number(stat?.stockCount || 0),
      coveragePct: Number(stat?.coveragePct || 0),
      mainReasonCoveragePct: Number(stat?.mainReasonCoveragePct || 0),
      lowConfidenceStockCount: Number(stat?.lowConfidenceStockCount || 0),
      ok: Number(stat?.rowCount) === expectedCount
        && Number(stat?.stockCount) === expectedCount
        && Number(stat?.coveragePct) === 100
        && Number(stat?.mainReasonCoveragePct) === 100
        && Number(stat?.lowConfidenceStockCount || 0) === 0,
    };
  });
  if (allErrors.length || sourceHealth.some(item => !item.ok)) {
    throw new Error(`${label} all-source health validation failed: ${JSON.stringify({ sourceHealth, sourceErrors: allErrors })}`);
  }
  return sourceHealth;
}

function validateAutoTgbRows(payload, expectedCodes) {
  const rows = (Array.isArray(payload?.rawRows) ? payload.rawRows : [])
    .filter(row => row.source === fixedSource);
  const codes = toSet(rows.map(row => normalizeCode(row.code)));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  if (rows.length !== expectedCount || codes.size !== expectedCount || missingCodes.length || extraCodes.length) {
    throw new Error(`auto source TGB code-set validation failed: ${JSON.stringify({
      count: rows.length,
      uniqueCount: codes.size,
      missingCodes,
      extraCodes,
    })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, missingCodes, extraCodes };
}

async function verifyPublic(expectedCodes) {
  let last = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const cacheBust = Date.now();
    const [sourceView, mainDay, limitStatus, health] = await Promise.all([
      getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=${day}&force=1&t=${cacheBust}`),
      getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/day?day=${day}&force=1&t=${cacheBust}`),
      getJson(`https://market.dreamerqi.com/api/limit-up-db/status?day=${day}&t=${cacheBust}`),
      getJson(`https://market.dreamerqi.com/health?t=${cacheBust}`),
    ]);
    last = { sourceView, mainDay, limitStatus, health };
    const tabs = Array.isArray(sourceView.tabs) ? sourceView.tabs : [];
    const tgbTab = tabs.find(tab => tab.label === '\u6dd8\u80a1\u5427');
    const combinedTab = tabs.find(tab => tab.label === '\u7efc\u5408\u5f52\u7eb3');
    const tgbRows = Array.isArray(tgbTab?.rows) ? tgbTab.rows : [];
    const combinedRows = Array.isArray(combinedTab?.rows) ? combinedTab.rows : [];
    const publicCodes = toSet(tgbRows.map(row => normalizeCode(row.code)));
    const combinedCodes = toSet(combinedRows.map(row => normalizeCode(row.code)));
    const stat = (sourceView.sourceStats || []).find(item => item.source === fixedSource);
    const reviewTabs = expectedReviewSources.map(expected => {
      const tab = tabs.find(item => item.label === expected.label);
      const rows = Array.isArray(tab?.rows) ? tab.rows : [];
      const codes = toSet(rows.map(row => normalizeCode(row.code)));
      return {
        source: expected.source,
        label: expected.label,
        count: rows.length,
        uniqueCount: codes.size,
        missingCodes: setDiff(expectedCodes, codes),
        extraCodes: setDiff(codes, expectedCodes),
      };
    });
    const sourceHealth = expectedReviewSources.map(expected => {
      const sourceStat = (sourceView.sourceStats || []).find(item => item.source === expected.source);
      return {
        source: expected.source,
        rowCount: Number(sourceStat?.rowCount || 0),
        stockCount: Number(sourceStat?.stockCount || 0),
        coveragePct: Number(sourceStat?.coveragePct || 0),
        mainReasonCoveragePct: Number(sourceStat?.mainReasonCoveragePct || 0),
        lowConfidenceStockCount: Number(sourceStat?.lowConfidenceStockCount || 0),
      };
    });
    const mainRows = Array.isArray(mainDay.stocks) ? mainDay.stocks : [];
    const mainCodes = toSet(mainRows.map(row => normalizeCode(row.code)));
    const mainTgbStat = (mainDay.sourceCoverage?.reviewAutoSources || []).find(item => item.source === fixedSource);
    const mainSourceHealth = expectedReviewSources.map(expected => {
      const sourceStat = (mainDay.sourceCoverage?.reviewAutoSources || []).find(item => item.source === expected.source);
      return {
        source: expected.source,
        rowCount: Number(sourceStat?.rowCount || 0),
        stockCount: Number(sourceStat?.stockCount || 0),
        coveragePct: Number(sourceStat?.coveragePct || 0),
        mainReasonCoveragePct: Number(sourceStat?.mainReasonCoveragePct || 0),
        lowConfidenceStockCount: Number(sourceStat?.lowConfidenceStockCount || 0),
      };
    });
    const statusDay = (limitStatus.days || []).find(item => item.day === day);
    const ok = tgbRows.length === expectedCount
      && publicCodes.size === expectedCount
      && setDiff(expectedCodes, publicCodes).length === 0
      && setDiff(publicCodes, expectedCodes).length === 0
      && combinedRows.length === expectedCount
      && combinedCodes.size === expectedCount
      && setDiff(expectedCodes, combinedCodes).length === 0
      && setDiff(combinedCodes, expectedCodes).length === 0
      && mainRows.length === expectedCount
      && mainCodes.size === expectedCount
      && setDiff(expectedCodes, mainCodes).length === 0
      && setDiff(mainCodes, expectedCodes).length === 0
      && Number(stat?.rowCount) === expectedCount
      && Number(stat?.stockCount) === expectedCount
      && Number(stat?.coveragePct) === 100
      && Number(stat?.mainReasonCoveragePct) === 100
      && Number(stat?.lowConfidenceStockCount || 0) === 0
      && Number(mainTgbStat?.rowCount) === expectedCount
      && Number(mainTgbStat?.stockCount) === expectedCount
      && Number(mainTgbStat?.coveragePct) === 100
      && Number(mainTgbStat?.mainReasonCoveragePct) === 100
      && Number(mainTgbStat?.lowConfidenceStockCount || 0) === 0
      && Number(statusDay?.count) === expectedRawPoolCount
      && reviewTabs.every(item => item.count === expectedCount
        && item.uniqueCount === expectedCount
        && item.missingCodes.length === 0
        && item.extraCodes.length === 0)
      && sourceHealth.every(item => item.rowCount === expectedCount
        && item.stockCount === expectedCount
        && item.coveragePct === 100
        && item.mainReasonCoveragePct === 100
        && item.lowConfidenceStockCount === 0)
      && mainSourceHealth.every(item => item.rowCount === expectedCount
        && item.stockCount === expectedCount
        && item.coveragePct === 100
        && item.mainReasonCoveragePct === 100
        && item.lowConfidenceStockCount === 0)
      && (sourceView.sourceErrors || []).length === 0
      && (mainDay.sourceCoverage?.sourceErrors || []).length === 0
      && health?.ok === true;
    if (ok) {
      return {
        combinedCount: combinedRows.length,
        tgbCount: tgbRows.length,
        sourceStat: stat,
        mainReasonSourceStat: mainTgbStat,
        allSourceHealth: sourceHealth,
        allMainReasonSourceHealth: mainSourceHealth,
        sourceErrors: sourceView.sourceErrors || [],
        limitUpDb: statusDay,
        health,
        tabCounts: tabs.map(tab => ({ label: tab.label, count: tab.rows?.length || 0 })),
      };
    }
    if (attempt < 6) await sleep(2000);
  }
  throw new Error(`public verification failed: ${JSON.stringify({
    sourceStats: last?.sourceView?.sourceStats || [],
    sourceErrors: last?.sourceView?.sourceErrors || [],
    sourceStats: last?.sourceView?.sourceStats || [],
    tabs: (last?.sourceView?.tabs || []).map(tab => ({ label: tab.label, count: tab.rows?.length || 0 })),
    limitDays: (last?.limitStatus?.days || []).slice(-2),
    mainReason: {
      count: last?.mainDay?.count || 0,
      reviewAutoSources: last?.mainDay?.sourceCoverage?.reviewAutoSources || [],
      sourceErrors: last?.mainDay?.sourceCoverage?.sourceErrors || [],
    },
    health: last?.health || null,
  })}`);
}

(async () => {
  const payloadB64 = fs.readFileSync(payloadFile, 'utf8').trim();
  const compressedPayloadBytes = Buffer.from(payloadB64, 'base64');
  const payloadBytes = zlib.gunzipSync(compressedPayloadBytes);
  const inputSha256 = shaBuffer(payloadBytes);
  if (inputSha256 !== expectedInputSha256) throw new Error('manual payload SHA-256 mismatch');
  const payload = JSON.parse(payloadBytes.toString('utf8'));

  const baselineFile = path.join(projectRoot, baselineRel);
  if (!fs.existsSync(baselineFile)) throw new Error('same-day terminal limit-up pool is missing');
  const baselinePayload = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const rawBaselineGate = validateRawBaseline(baselinePayload);
  const baselineRows = baselineRowsFromPayload(baselinePayload);
  const gate = validatePayload(payload, baselineRows);

  const rawManifestFile = path.join(projectRoot, rawManifestRel);
  const rawImageFile = path.join(projectRoot, rawImageRel);
  if (!fs.existsSync(rawManifestFile) || !fs.existsSync(rawImageFile)) throw new Error('official raw manifest/image evidence is missing');
  const rawManifest = JSON.parse(fs.readFileSync(rawManifestFile, 'utf8'));
  if (rawManifest.day !== day || rawManifest.status !== 'raw-evidence-saved') throw new Error('raw manifest status/day mismatch');
  const officialArticle = (rawManifest.articles || []).find(article => article.url === articleUrl);
  const officialImage = (officialArticle?.images || []).find(image => image.file === imageFile
    && image.url === imageUrl
    && image.saved === true
    && Number(image.length) === expectedImageLength
    && !image.error);
  if (!officialArticle || !officialImage) throw new Error('selected official article/image is absent from raw manifest');
  if (officialArticle.title !== articleTitle) throw new Error('official article title mismatch');
  if (fs.statSync(rawImageFile).size !== expectedImageLength) throw new Error('official image length mismatch');
  if (shaFile(rawImageFile) !== expectedImageSha256) throw new Error('official image SHA-256 mismatch');

  for (const relative of logRels) {
    const file = path.join(projectRoot, relative);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`required cloud operation log is missing: ${relative}`);
    }
  }

  const formalFile = path.join(projectRoot, formalRel);
  const combinedFile = path.join(projectRoot, combinedRel);
  const preFormalPayload = fs.existsSync(formalFile)
    ? JSON.parse(fs.readFileSync(formalFile, 'utf8'))
    : { rows: [] };
  const preCombinedPayload = fs.existsSync(combinedFile)
    ? JSON.parse(fs.readFileSync(combinedFile, 'utf8'))
    : { stocks: [], sourceCoverage: null };
  const preMainReasonState = mainReasonComparable(preCombinedPayload);
  const preTgbRowsState = tgbRowsComparable(preFormalPayload.rows);

  const preOperationState = {
    baselineCount: baselineRows.length,
    formalCount: preTgbRowsState.length,
    combinedCount: preMainReasonState.stocks.length,
    mainReasonStateSha256: shaValue(preMainReasonState),
    tgbRowsStateSha256: shaValue(preTgbRowsState),
  };

  const completedAt = new Date().toISOString();
  const stamp = completedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(projectRoot, 'backups', `${operationId}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const beforeStates = new Map();
  for (const relative of backupRels) {
    const state = fileState(relative);
    beforeStates.set(relative, state);
    const existed = copyRelative(relative, backupDir);
    if (existed !== state.exists) throw new Error(`backup existence mismatch: ${relative}`);
    if (state.exists && shaFile(path.join(backupDir, relative)) !== state.sha256) {
      throw new Error(`backup SHA-256 mismatch: ${relative}`);
    }
  }

  const finalPayload = clone(payload);
  finalPayload.generatedAt = completedAt;
  finalPayload.savedAt = completedAt;
  finalPayload.validation = {
    ...gate,
    rawPoolCount: rawBaselineGate.count,
    excludedRawPoolRows: rawBaselineGate.excludedRows,
    manualSecondPassReviewed: true,
  };

  try {
    atomicWriteJson(formalFile, finalPayload);
    const rebuild = spawnSync(process.execPath, [
      path.join(projectRoot, 'kpl-stats-server.js'),
      '--main-reason-backfill',
      `--day=${day}`,
      '--days=1',
      '--force',
    ], { cwd: projectRoot, encoding: 'utf8', timeout: 10 * 60 * 1000 });
    if (rebuild.error) throw rebuild.error;
    if (rebuild.status !== 0) throw new Error(`main-reason backfill failed: ${String(rebuild.stderr || rebuild.stdout || '').slice(-1000)}`);

    const storedBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    const expectedCodes = toSet(finalPayload.rows.map(row => normalizeCode(row.code)));
    const storedBaselineGate = validateStoredBaseline(storedBaseline, expectedCodes);
    const storedFormal = JSON.parse(fs.readFileSync(formalFile, 'utf8'));
    const storedGate = validatePayload(storedFormal, baselineRowsFromPayload(storedBaseline));
    if (!fs.existsSync(combinedFile)) throw new Error('combined reason database was not rebuilt');
    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    const combinedSetGate = validateExactStockSet('combined reason database', combined, expectedCodes);
    const combinedTgbStat = validateTgbCoverage(
      'combined reason database',
      combined.sourceCoverage?.reviewAutoSources,
      combined.sourceCoverage?.sourceErrors,
    );
    const combinedAllSourceHealth = validateAllReviewSourceHealth(
      'combined reason database',
      combined.sourceCoverage?.reviewAutoSources,
      combined.sourceCoverage?.sourceErrors,
    );
    const evidence = JSON.parse(fs.readFileSync(path.join(projectRoot, evidenceRel), 'utf8'));
    const evidenceSetGate = validateExactStockSet('main-reason evidence', evidence, expectedCodes);
    const evidenceTgbStat = validateTgbCoverage('main-reason evidence', evidence.sourceStats, evidence.sourceErrors);
    const evidenceAllSourceHealth = validateAllReviewSourceHealth(
      'main-reason evidence',
      evidence.sourceStats,
      evidence.sourceErrors,
    );
    const quality = JSON.parse(fs.readFileSync(path.join(projectRoot, qualityRel), 'utf8'));
    if (Number(quality.total) !== expectedCount
        || Number(quality.reviewCoveragePct) !== 100
        || Number(quality.reviewMainReasonCoveragePct) !== 100
        || (quality.sourceErrors || []).length !== 0) {
      throw new Error(`main-reason quality validation failed: ${JSON.stringify({
        total: quality.total,
        reviewCoveragePct: quality.reviewCoveragePct,
        reviewMainReasonCoveragePct: quality.reviewMainReasonCoveragePct,
        sourceErrors: quality.sourceErrors || [],
      })}`);
    }
    const combinedCount = combinedSetGate.count;

    const publicView = await verifyPublic(expectedCodes);
    const postPublicBaseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    const postPublicBaselineGate = validateStoredBaseline(postPublicBaseline, expectedCodes);
    const postPublicCombined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    const postPublicCombinedGate = validateExactStockSet('post-public combined reason database', postPublicCombined, expectedCodes);
    const postPublicCombinedTgbStat = validateTgbCoverage(
      'post-public combined reason database',
      postPublicCombined.sourceCoverage?.reviewAutoSources,
      postPublicCombined.sourceCoverage?.sourceErrors,
    );
    const postPublicCombinedAllSourceHealth = validateAllReviewSourceHealth(
      'post-public combined reason database',
      postPublicCombined.sourceCoverage?.reviewAutoSources,
      postPublicCombined.sourceCoverage?.sourceErrors,
    );
    const postPublicAuto = JSON.parse(fs.readFileSync(path.join(projectRoot, autoRel), 'utf8'));
    const postPublicAutoTgbGate = validateAutoTgbRows(postPublicAuto, expectedCodes);
    const postPublicAutoTgbStat = validateTgbCoverage('post-public auto source', postPublicAuto.sourceStats, postPublicAuto.sourceErrors);
    const postPublicAutoAllSourceHealth = validateAllReviewSourceHealth(
      'post-public auto source',
      postPublicAuto.sourceStats,
      postPublicAuto.sourceErrors,
    );
    const postPublicEvidence = JSON.parse(fs.readFileSync(path.join(projectRoot, evidenceRel), 'utf8'));
    const postPublicEvidenceGate = validateExactStockSet('post-public main-reason evidence', postPublicEvidence, expectedCodes);
    const postPublicEvidenceTgbStat = validateTgbCoverage(
      'post-public main-reason evidence',
      postPublicEvidence.sourceStats,
      postPublicEvidence.sourceErrors,
    );
    const postPublicEvidenceAllSourceHealth = validateAllReviewSourceHealth(
      'post-public main-reason evidence',
      postPublicEvidence.sourceStats,
      postPublicEvidence.sourceErrors,
    );
    const postPublicQuality = JSON.parse(fs.readFileSync(path.join(projectRoot, qualityRel), 'utf8'));
    if (Number(postPublicQuality.total) !== expectedCount
        || Number(postPublicQuality.reviewCoveragePct) !== 100
        || Number(postPublicQuality.reviewMainReasonCoveragePct) !== 100
        || (postPublicQuality.sourceErrors || []).length !== 0) {
      throw new Error('post-public main-reason quality validation failed');
    }
    const baselineSha256 = shaFile(baselineFile);
    const formalSha256 = shaFile(formalFile);
    const combinedSha256 = shaFile(combinedFile);
    const logEntry = [
      '',
      `## ${day} - ${operationId}`,
      `- Actor: ${actor}`,
      `- Commit: ${operationCommit}`,
      `- Run: ${operationRunId}`,
      `- Official article: ${articleUrl}`,
      `- Official image: ${imageFile}`,
      `- Formal rows: ${expectedCount}; missing/extra/duplicate/weak/name mismatch: 0/0/0/0/0.`,
      `- Raw terminal pool: ${rawBaselineGate.count}; excluded ST/BSE/new-prefix rows: ${rawBaselineGate.excludedRows.length}.`,
      `- Topic counts: 12 + 5 + 4 + 4 + 3 + 3 + 4 + 4 + 7 = ${expectedCount}.`,
      `- Name normalization differences: ${storedGate.nameNormalizationDifferences.length}.`,
      `- Limit-up pool SHA-256: ${baselineSha256}`,
      `- Formal SHA-256: ${formalSha256}`,
      `- Combined reason SHA-256: ${combinedSha256}`,
      `- Public source-view combined/TGB: ${publicView.combinedCount}/${publicView.tgbCount}; TGB low confidence: ${publicView.sourceStat.lowConfidenceStockCount || 0}.`,
      `- Rollback backup: ${backupDir}`,
      '- Combined main-reason database rebuilt: yes',
      '- Service restart: none',
      '',
    ].join('\r\n');
    for (const relative of logRels) {
      const file = path.join(projectRoot, relative);
      fs.appendFileSync(file, logEntry, 'utf8');
    }

    console.log(JSON.stringify({
      ok: true,
      operation: operationId,
      day,
      articleUrl,
      imageFile,
      inputPayloadSha256: inputSha256,
      baselineSha256,
      formalSha256,
      combinedSha256,
      formalCount: storedFormal.rows.length,
      combinedCount,
      baselineGate: storedBaselineGate,
      combinedSetGate,
      combinedTgbStat,
      combinedAllSourceHealth,
      evidenceSetGate,
      evidenceTgbStat,
      evidenceAllSourceHealth,
      gate: storedGate,
      publicView,
      postPublicBaselineGate,
      postPublicCombinedGate,
      postPublicCombinedTgbStat,
      postPublicCombinedAllSourceHealth,
      postPublicAutoTgbGate,
      postPublicAutoTgbStat,
      postPublicAutoAllSourceHealth,
      postPublicEvidenceGate,
      postPublicEvidenceTgbStat,
      postPublicEvidenceAllSourceHealth,
      backupDir,
      combinedReasonRebuilt: true,
      serviceRestarted: false,
    }, null, 2));
  } catch (error) {
    const rollbackFailures = restoreFileStates(touchedRels, backupDir, beforeStates);
    let rollbackRefreshError = '';
    if (!rollbackFailures.length) {
      try {
        const cacheBust = Date.now();
        const rollbackMain = await getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/day?day=${day}&force=1&rollback=${cacheBust}`);
        const rollbackMainReasonState = mainReasonComparable(rollbackMain);
        const rollbackMainReasonStateSha256 = shaValue(rollbackMainReasonState);
        if (rollbackMainReasonStateSha256 !== preOperationState.mainReasonStateSha256) {
          throw new Error(`rollback public main-reason state mismatch: ${JSON.stringify({
            expectedCount: preOperationState.combinedCount,
            actualCount: rollbackMainReasonState.stocks.length,
            expectedSha256: preOperationState.mainReasonStateSha256,
            actualSha256: rollbackMainReasonStateSha256,
          })}`);
        }

        const rollbackView = await getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=${day}&rollback=${cacheBust}`);
        const rollbackTgb = (rollbackView.tabs || []).find(tab => tab.label === '\u6dd8\u80a1\u5427');
        const rollbackCombined = (rollbackView.tabs || []).find(tab => tab.label === '\u7efc\u5408\u5f52\u7eb3');
        const rollbackTgbRowsState = tgbRowsComparable(rollbackTgb?.rows);
        const rollbackCombinedState = mainReasonComparable({
          stocks: rollbackCombined?.rows,
          sourceCoverage: rollbackMain.sourceCoverage || null,
        });
        const rollbackTgbRowsStateSha256 = shaValue(rollbackTgbRowsState);
        const rollbackCombinedStateSha256 = shaValue(rollbackCombinedState);
        if (rollbackTgbRowsStateSha256 !== preOperationState.tgbRowsStateSha256
            || rollbackCombinedStateSha256 !== preOperationState.mainReasonStateSha256) {
          throw new Error(`rollback public state mismatch: ${JSON.stringify({
            expectedTgbCount: preOperationState.formalCount,
            tgbCount: rollbackTgb?.rows?.length || 0,
            expectedCombinedCount: preOperationState.combinedCount,
            combinedCount: rollbackCombined?.rows?.length || 0,
            expectedTgbSha256: preOperationState.tgbRowsStateSha256,
            tgbSha256: rollbackTgbRowsStateSha256,
            expectedCombinedSha256: preOperationState.mainReasonStateSha256,
            combinedSha256: rollbackCombinedStateSha256,
          })}`);
        }
        const rollbackHealth = await getJson(`https://market.dreamerqi.com/health?rollback=${Date.now()}`);
        if (rollbackHealth?.ok !== true) throw new Error('rollback health verification failed');
      } catch (refreshError) {
        rollbackRefreshError = refreshError.message;
      } finally {
        const publicVerificationDrift = verifyFileStates(touchedRels, beforeStates);
        if (publicVerificationDrift.length) {
          const repairFailures = restoreFileStates(touchedRels, backupDir, beforeStates);
          rollbackFailures.push(...repairFailures);
          const driftMessage = `rollback public verification changed restored files: ${JSON.stringify(publicVerificationDrift)}`;
          rollbackRefreshError = [rollbackRefreshError, driftMessage].filter(Boolean).join('; ');
        }
      }
    }
    throw new Error(`${error.stack || error.message || String(error)}\nrollbackFailures=${JSON.stringify(rollbackFailures)}\nrollbackRefreshError=${rollbackRefreshError || 'none'}`);
  }
})().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
'@

[System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
try {
  & node $nodeScript $project $payloadFile $expectedPayloadSha256 $env:DREAMERQI_OPS_ACTOR $env:DREAMERQI_OPS_COMMIT $env:DREAMERQI_OPS_RUN_ID
  if ($LASTEXITCODE -ne 0) { throw ('node exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}

