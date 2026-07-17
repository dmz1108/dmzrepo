# DreamerQi production operation: write the manually transcribed 2026-07-17
# official @TGB Hunan table, rebuild the same-day combined reason database,
# and verify the public source view.
#
# The 32 formal rows are supplied only through a date-bound encrypted GitHub
# production-environment secret. They are not tracked in Git or printed here.
# The script verifies the payload SHA-256, repeats the full limit-up-pool gate,
# backs up every touched runtime artifact, writes atomically, rolls back on any
# failure, and never restarts a service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-17'
$payloadFile = [string]$env:DREAMERQI_TGB_MANUAL_PAYLOAD_FILE
$expectedPayloadSha256 = 'be54199bb1b5d1931b0b67b198684f122a0eb16c40faac4b460552934099dd80'
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
const { spawnSync } = require('child_process');

const projectRoot = process.argv[2];
const payloadFile = process.argv[3];
const expectedPayloadSha256 = process.argv[4];
const actor = process.argv[5] || 'unknown';
const operationCommit = process.argv[6] || '';
const operationRunId = process.argv[7] || '';
const day = '2026-07-17';
const articleUrl = 'https://www.tgb.cn/a/2tvqJaeEJcg';
const imageFile = 'image-01-06.png';
const operationId = 'tgb-hunan-manual-20260717';
const expectedCount = 32;
const expectedInputSha256 = expectedPayloadSha256.toLowerCase();

const formalRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-structured', `${day}.json`);
const combinedRel = path.join('kpl-limitup-main-reason-db', `${day}.json`);
const evidenceRel = path.join('kpl-limitup-main-reason-evidence', `${day}.json`);
const qualityRel = path.join('kpl-limitup-main-reason-quality', `${day}.json`);
const autoRel = path.join('kpl-limitup-main-reason-sources', 'auto', `${day}.json`);
const rawManifestRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-raw', day, 'manifest.json');
const rawImageRel = path.join('kpl-limitup-main-reason-sources', 'tgb-hunan-raw', day, imageFile);
const logRels = ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md'];
const touchedRels = [formalRel, combinedRel, evidenceRel, qualityRel, autoRel, ...logRels];
const backupRels = [...new Set([...touchedRels, rawManifestRel, rawImageRel])];

const shaBuffer = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const shaFile = file => shaBuffer(fs.readFileSync(file));
const normalizeCode = value => String(value || '').replace(/\D/g, '').slice(-6).padStart(6, '0');
const toSet = values => new Set(values);
const setDiff = (left, right) => [...left].filter(value => !right.has(value)).sort();
const asText = value => String(value == null ? '' : value).trim();
const clone = value => JSON.parse(JSON.stringify(value));

function excludedFromReview(code, name) {
  return /^[489]/.test(code) || /(?:\*?ST|\u9000)/i.test(name) || /^[NC]/i.test(name);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'user-agent': 'DreamerQi-protected-production-operation' } }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`public source-view HTTP ${response.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
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

function validatePayload(payload, baselineRows) {
  if (payload.day !== day) throw new Error('payload day mismatch');
  if (payload.source !== 'review/tgb-hunan-structured') throw new Error('payload source mismatch');
  if (payload.url !== articleUrl) throw new Error('payload article URL mismatch');
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
  ].every(value => asText(value)) || row.reasonQuality !== 'clear' || row.matchType !== 'manual-hunan-table' || Number(row.confidence) !== 0.99);

  const baseline = baselineRows
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name && !excludedFromReview(row.code, row.name));
  const baselineByCode = new Map(baseline.map(row => [row.code, row.name]));
  const baselineCodes = toSet(baselineByCode.keys());
  const missingCodes = setDiff(baselineCodes, codeSet);
  const extraCodes = setDiff(codeSet, baselineCodes);
  const nameMismatches = rows
    .filter(row => baselineByCode.get(normalizeCode(row.code)) !== asText(row.name))
    .map(row => normalizeCode(row.code));

  const topicCounts = rows.reduce((result, row) => {
    const topic = asText(row.boardTopic);
    result[topic] = (result[topic] || 0) + 1;
    return result;
  }, {});
  const expectedTopics = {
    '\u7535\u529b': 9,
    '\u7b97\u529b': 5,
    '\u5176\u4ed6\u70ed\u70b9': 8,
    '\u5176\u4ed6\u4e2a\u80a1': 10,
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
    topicCounts,
    topicCountTotal,
  };
  if (baselineCodes.size !== expectedCount || codeSet.size !== expectedCount || missingCodes.length
      || extraCodes.length || duplicateCodes.length || weakRows.length || nameMismatches.length
      || topicCountTotal !== expectedCount || !topicCountsMatch) {
    throw new Error(`formal quality gate failed: ${JSON.stringify(gate)}`);
  }
  return gate;
}

async function verifyPublic(expectedCodes) {
  let last = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    last = await getJson(`https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=${day}&force=1&t=${Date.now()}`);
    const tabs = Array.isArray(last.tabs) ? last.tabs : [];
    const tgbTab = tabs.find(tab => tab.label === '\u6dd8\u80a1\u5427');
    const combinedTab = tabs.find(tab => tab.label === '\u7efc\u5408\u5f52\u7eb3');
    const tgbRows = Array.isArray(tgbTab?.rows) ? tgbTab.rows : [];
    const publicCodes = toSet(tgbRows.map(row => normalizeCode(row.code)));
    const stat = (last.sourceStats || []).find(item => item.source === 'review/tgb-hunan-structured');
    const tgbErrors = (last.sourceErrors || []).filter(item => String(item?.source || '').includes('tgb'));
    const ok = tgbRows.length === expectedCount
      && publicCodes.size === expectedCount
      && setDiff(expectedCodes, publicCodes).length === 0
      && setDiff(publicCodes, expectedCodes).length === 0
      && Number(stat?.rowCount) === expectedCount
      && Number(stat?.stockCount) === expectedCount
      && Number(stat?.lowConfidenceStockCount || 0) === 0
      && Number(combinedTab?.rows?.length || 0) === expectedCount
      && tgbErrors.length === 0;
    if (ok) {
      return {
        combinedCount: combinedTab.rows.length,
        tgbCount: tgbRows.length,
        sourceStat: stat,
        sourceErrors: last.sourceErrors || [],
      };
    }
    if (attempt < 5) await sleep(2000);
  }
  throw new Error(`public source-view validation failed: ${JSON.stringify({
    sourceStats: last?.sourceStats || [],
    sourceErrors: last?.sourceErrors || [],
    tabs: (last?.tabs || []).map(tab => ({ label: tab.label, count: tab.rows?.length || 0 })),
  })}`);
}

(async () => {
  const payloadB64 = fs.readFileSync(payloadFile, 'utf8').trim();
  const payloadBytes = Buffer.from(payloadB64, 'base64');
  const inputSha256 = shaBuffer(payloadBytes);
  if (inputSha256 !== expectedInputSha256) throw new Error('manual payload SHA-256 mismatch');
  const payload = JSON.parse(payloadBytes.toString('utf8'));

  const baselineFile = path.join(projectRoot, 'kpl-limitup-db', `${day}.json`);
  if (!fs.existsSync(baselineFile)) throw new Error('same-day final limit-up pool is missing');
  const baselinePayload = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const baselineRows = Array.isArray(baselinePayload.stocks) ? baselinePayload.stocks : [];
  const gate = validatePayload(payload, baselineRows);

  const rawManifestFile = path.join(projectRoot, rawManifestRel);
  const rawImageFile = path.join(projectRoot, rawImageRel);
  if (!fs.existsSync(rawManifestFile) || !fs.existsSync(rawImageFile)) throw new Error('official raw manifest/image evidence is missing');
  const rawManifest = JSON.parse(fs.readFileSync(rawManifestFile, 'utf8'));
  if (rawManifest.day !== day || rawManifest.status !== 'raw-evidence-saved') throw new Error('raw manifest status/day mismatch');
  const officialArticle = (rawManifest.articles || []).find(article => article.url === articleUrl);
  const officialImage = (officialArticle?.images || []).find(image => image.file === imageFile && image.saved === true && !image.error);
  if (!officialArticle || !officialImage) throw new Error('selected official article/image is absent from raw manifest');

  const completedAt = new Date().toISOString();
  const stamp = completedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(projectRoot, 'backups', `${operationId}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const existedBefore = new Map();
  for (const relative of backupRels) {
    const existed = copyRelative(relative, backupDir);
    existedBefore.set(relative, existed);
  }

  const formalFile = path.join(projectRoot, formalRel);
  const combinedFile = path.join(projectRoot, combinedRel);
  const finalPayload = clone(payload);
  finalPayload.generatedAt = completedAt;
  finalPayload.savedAt = completedAt;
  finalPayload.validation = { ...gate, manualSecondPassReviewed: true };

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

    const storedFormal = JSON.parse(fs.readFileSync(formalFile, 'utf8'));
    const storedGate = validatePayload(storedFormal, baselineRows);
    if (!fs.existsSync(combinedFile)) throw new Error('combined reason database was not rebuilt');
    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    const combinedCount = Array.isArray(combined.stocks) ? combined.stocks.length : 0;
    if (combinedCount !== expectedCount) throw new Error(`combined reason count mismatch: ${combinedCount}`);

    const expectedCodes = toSet(storedFormal.rows.map(row => normalizeCode(row.code)));
    const publicView = await verifyPublic(expectedCodes);
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
      `- Topic counts: 9 + 5 + 8 + 10 = ${expectedCount}.`,
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
      if (fs.existsSync(file)) fs.appendFileSync(file, logEntry, 'utf8');
    }

    console.log(JSON.stringify({
      ok: true,
      operation: operationId,
      day,
      articleUrl,
      imageFile,
      inputPayloadSha256: inputSha256,
      formalSha256,
      combinedSha256,
      formalCount: storedFormal.rows.length,
      combinedCount,
      gate: storedGate,
      publicView,
      backupDir,
      combinedReasonRebuilt: true,
      serviceRestarted: false,
    }, null, 2));
  } catch (error) {
    for (const relative of touchedRels) {
      const live = path.join(projectRoot, relative);
      const backup = path.join(backupDir, relative);
      if (existedBefore.get(relative) && fs.existsSync(backup)) {
        fs.mkdirSync(path.dirname(live), { recursive: true });
        fs.copyFileSync(backup, live);
      } else if (!existedBefore.get(relative) && fs.existsSync(live)) {
        fs.rmSync(live, { force: true });
      }
    }
    throw error;
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
