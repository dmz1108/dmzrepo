# DreamerQi production operation: write the manually transcribed 2026-10-29
# official @TGB Hunan table and rebuild the same-day combined reason database.
#
# The 39 formal rows are supplied through a temporary date-bound payload file.
# This script pins the payload and official-image hashes, re-runs every quality
# gate, backs up all touched runtime files, writes atomically, rolls back on a
# failed rebuild/verification, appends safe receipts, and never restarts service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$payloadFile = [string]$env:DREAMERQI_TGB_MANUAL_PAYLOAD_FILE
$expectedPayloadSha256 = '233fd151d7bf098e1ccff18a68776953530e7243ecab96cebb93d44dabe916fe'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-tgb-hunan-write-' + [Guid]::NewGuid().ToString('N') + '.js')

if (-not $payloadFile -or -not (Test-Path -LiteralPath $payloadFile -PathType Leaf)) {
  throw 'Date-bound TGB payload file is missing.'
}
$js = @'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const projectRoot = process.argv[2];
const payloadFile = process.argv[3];
const expectedPayloadSha256 = process.argv[4].toLowerCase();
const day = '2026-10-29';
const articleUrl = 'https://www.tgb.cn/a/2wi4VQpNgkB';
const articleTitle = '10.29\u6e56\u5357\u4eba\u6da8\u505c\u590d\u76d8+\u665a\u95f4\u6d88\u606f\u6c47\u603b';
const imageFile = 'image-01-06.png';
const imageUrl = 'https://image.tgb.cn/img/2026/10/29/y5mb20sidzyn.png_760w.png';
const expectedImageLength = 561006;
const expectedImageSha256 = '5e7eea7efab725f31b7c559b1390769321053270769589dfd5ae4debda27a481';
const expectedCount = 39;
const expectedRawCount = 39;
const expectedExcludedCodes = [];
const expectedCodeSetSha256 = '6609bf9dfde9c80301d7801fcf560036f5b1548d69ef992283c59af259a2ba33';
const operationId = 'tgb-hunan-manual-20261029';
const fixedSource = 'review/tgb-hunan-structured';
const fixedQualityNote = 'Manual transcription from @TGB\u6e56\u5357\u4eba official table image; source-faithful board block and stock detail reason.';
const expectedManualBlocks = [
  ['\u4e1a\u7ee9\u589e\u957f', 10],
  ['\u5546\u4e1a\u822a\u5929', 9],
  ['\u673a\u5668\u4eba', 7],
  ['\u5927\u6d88\u8d39', 6],
  ['\u51b0\u96ea\u7ecf\u6d4e', 3],
  ['AI\u5f71\u89c6', 2],
  ['\u5176\u4ed6\u4e2a\u80a1', 2],
];
const expectedNameDifferences = [];

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
const touchedRels = [formalRel, combinedRel, evidenceRel, qualityRel, autoRel,
  kaipanlaRel, xuangubaoRel, jiuyangongsheRel, ...logRels];
const backupRels = [...new Set([baselineRel, ...touchedRels, rawManifestRel, rawImageRel])];

const shaBuffer = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const shaFile = file => shaBuffer(fs.readFileSync(file));
const asText = value => String(value == null ? '' : value).trim();
const normalizeCode = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? digits.slice(-6).padStart(6, '0') : '';
};
const normalizeName = value => asText(value).normalize('NFKC').replace(/\s+/g, '');
const toSet = values => new Set(values);
const setDiff = (left, right) => [...left].filter(value => !right.has(value)).sort();

function excludedFromReview(code, name) {
  return /^[489]/.test(code) || /(?:\*?ST|\u9000)/i.test(name) || /^[NC]/i.test(name);
}

function fileState(relative) {
  const file = path.join(projectRoot, relative);
  return fs.existsSync(file) ? { exists: true, sha256: shaFile(file) } : { exists: false, sha256: '' };
}

function copyRelative(relative, destinationRoot) {
  const source = path.join(projectRoot, relative);
  if (!fs.existsSync(source)) return false;
  const destination = path.join(destinationRoot, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

function restore(relativePaths, backupDir, beforeStates) {
  const failures = [];
  for (const relative of relativePaths) {
    try {
      const live = path.join(projectRoot, relative);
      const backup = path.join(backupDir, relative);
      const before = beforeStates.get(relative);
      if (before.exists) {
        if (!fs.existsSync(backup)) throw new Error('backup missing');
        fs.mkdirSync(path.dirname(live), { recursive: true });
        fs.copyFileSync(backup, live);
      } else if (fs.existsSync(live)) {
        fs.rmSync(live, { force: true });
      }
      const after = fileState(relative);
      if (after.exists !== before.exists || after.sha256 !== before.sha256) throw new Error('state mismatch');
    } catch (error) {
      failures.push({ relative, error: error.message });
    }
  }
  return failures;
}

function atomicWriteJson(file, value) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function validateBaseline(payload) {
  const rawRows = (Array.isArray(payload?.stocks) ? payload.stocks : [])
    .map(row => ({ code: normalizeCode(row.code), name: asText(row.name) }))
    .filter(row => row.code && row.name);
  const rawCodes = toSet(rawRows.map(row => row.code));
  const excludedRows = rawRows.filter(row => excludedFromReview(row.code, row.name));
  const excludedCodes = excludedRows.map(row => row.code).sort();
  const eligibleRows = rawRows.filter(row => !excludedFromReview(row.code, row.name));
  const eligibleCodes = toSet(eligibleRows.map(row => row.code));
  const sortedCodes = [...eligibleCodes].sort();
  const codeSetSha256 = shaBuffer(Buffer.from(sortedCodes.join('\n'), 'utf8'));
  if (payload.day !== day || rawRows.length !== expectedRawCount || rawCodes.size !== expectedRawCount
      || eligibleRows.length !== expectedCount || eligibleCodes.size !== expectedCount
      || JSON.stringify(excludedCodes) !== JSON.stringify(expectedExcludedCodes)
      || codeSetSha256 !== expectedCodeSetSha256) {
    throw new Error(`terminal pool gate failed: ${JSON.stringify({
      day: payload.day, rawCount: rawRows.length, rawUniqueCount: rawCodes.size,
      eligibleCount: eligibleRows.length, eligibleUniqueCount: eligibleCodes.size,
      excludedRows, excludedCodes, codeSetSha256,
    })}`);
  }
  return { rows: eligibleRows, codes: eligibleCodes, rawCount: rawRows.length,
    excludedRows, excludedCodes, codeSetSha256 };
}

function validatePayload(payload, baseline) {
  if (payload.day !== day || payload.source !== fixedSource || payload.url !== articleUrl
      || payload.title !== articleTitle || payload.method !== 'manual-hunan-table') {
    throw new Error('payload identity mismatch');
  }
  if (payload.evidence?.imageFile !== imageFile || payload.evidence?.imageUrl !== imageUrl
      || Number(payload.evidence?.imageLength) !== expectedImageLength
      || payload.evidence?.imageSha256 !== expectedImageSha256) {
    throw new Error('payload evidence mismatch');
  }
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const codes = rows.map(row => normalizeCode(row.code));
  const codeSet = toSet(codes);
  const duplicateCodes = [...new Set(codes.filter((code, index) => codes.indexOf(code) !== index))].sort();
  const missingCodes = setDiff(baseline.codes, codeSet);
  const extraCodes = setDiff(codeSet, baseline.codes);
  const weakRows = rows.filter(row => ![row.code, row.name, row.boardTopic, row.detailReason,
    row.firstLimitTime, row.limitUpCount].every(value => asText(value))
    || row.source !== fixedSource || row.matchType !== 'manual-hunan-table'
    || row.reasonQuality !== 'clear' || Number(row.confidence) !== 0.99
    || row.qualityNote !== fixedQualityNote);
  const baselineByCode = new Map(baseline.rows.map(row => [row.code, row.name]));
  const nameDifferences = rows.filter(row => baselineByCode.get(normalizeCode(row.code)) !== asText(row.name))
    .map(row => {
      const code = normalizeCode(row.code);
      const sourceName = asText(row.name);
      const baselineName = asText(baselineByCode.get(code));
      return { code, sourceName, baselineName, normalization:
        normalizeName(sourceName) === normalizeName(baselineName)
          ? 'NFKC+remove-whitespace' : 'explicit-source-alias' };
    }).sort((a, b) => a.code.localeCompare(b.code));
  const topicCounts = rows.reduce((result, row) => {
    result[row.boardTopic] = (result[row.boardTopic] || 0) + 1;
    return result;
  }, {});
  const topicTotal = Object.values(topicCounts).reduce((sum, count) => sum + count, 0);
  const manualBlocks = Array.isArray(payload.manualBlocks) ? payload.manualBlocks : [];
  const manualBlockTotal = manualBlocks.reduce((sum, block) => sum + Number(block.manualRowCount || 0), 0);
  const blocksMatch = expectedManualBlocks.every(([topic, count], index) =>
    Number(manualBlocks[index]?.sequence) === index + 1
      && manualBlocks[index]?.boardTopic === topic
      && Number(manualBlocks[index]?.manualRowCount) === count
      && topicCounts[topic] === count);
  const namesMatch = JSON.stringify(nameDifferences) === JSON.stringify(expectedNameDifferences);
  const gate = { expectedCount, actualCount: rows.length, uniqueCount: codeSet.size,
    missingCodes, extraCodes, duplicateCodes, weakCount: weakRows.length,
    nameDifferences, topicCounts, topicTotal, manualBlockTotal };
  if (Number(payload.count) !== expectedCount || rows.length !== expectedCount
      || codeSet.size !== expectedCount || missingCodes.length || extraCodes.length
      || duplicateCodes.length || weakRows.length || !namesMatch || !blocksMatch
      || manualBlocks.length !== expectedManualBlocks.length
      || topicTotal !== expectedCount || manualBlockTotal !== expectedCount) {
    throw new Error(`formal quality gate failed: ${JSON.stringify(gate)}`);
  }
  return gate;
}

function validateOutput(label, payload, expectedCodes) {
  const rows = Array.isArray(payload?.stocks) ? payload.stocks : [];
  const codes = toSet(rows.map(row => normalizeCode(row.code)));
  const missingCodes = setDiff(expectedCodes, codes);
  const extraCodes = setDiff(codes, expectedCodes);
  if (rows.length !== expectedCount || codes.size !== expectedCount || missingCodes.length || extraCodes.length) {
    throw new Error(`${label} code-set gate failed: ${JSON.stringify({ count: rows.length,
      uniqueCount: codes.size, missingCodes, extraCodes })}`);
  }
  return { count: rows.length, uniqueCount: codes.size, missingCodes, extraCodes };
}

function validateTgbHealth(label, payload) {
  const stats = payload?.sourceCoverage?.reviewAutoSources || payload?.sourceStats || [];
  const errors = payload?.sourceCoverage?.sourceErrors || payload?.sourceErrors || [];
  const stat = stats.find(item => item.source === fixedSource);
  if (Number(stat?.rowCount) !== expectedCount || Number(stat?.stockCount) !== expectedCount
      || Number(stat?.coveragePct) !== 100 || Number(stat?.mainReasonCoveragePct) !== 100
      || Number(stat?.lowConfidenceStockCount || 0) !== 0 || errors.length !== 0) {
    throw new Error(`${label} TGB health failed: ${JSON.stringify({ stat, errors })}`);
  }
  return stat;
}

(async () => {
  const encoded = fs.readFileSync(payloadFile, 'utf8').trim();
  const payloadBytes = zlib.gunzipSync(Buffer.from(encoded, 'base64'));
  const payloadSha256 = shaBuffer(payloadBytes);
  if (payloadSha256 !== expectedPayloadSha256) throw new Error('manual payload SHA-256 mismatch');
  const payload = JSON.parse(payloadBytes.toString('utf8'));

  const baselineFile = path.join(projectRoot, baselineRel);
  const formalFile = path.join(projectRoot, formalRel);
  const manifestFile = path.join(projectRoot, rawManifestRel);
  const imagePath = path.join(projectRoot, rawImageRel);
  if (!fs.existsSync(baselineFile) || !fs.existsSync(manifestFile) || !fs.existsSync(imagePath)) {
    throw new Error('required baseline/raw evidence is missing');
  }
  if (fs.existsSync(formalFile)) throw new Error('protected formal TGB file already exists');
  for (const relative of logRels) {
    if (!fs.existsSync(path.join(projectRoot, relative))) throw new Error(`cloud log missing: ${relative}`);
  }

  const baseline = validateBaseline(JSON.parse(fs.readFileSync(baselineFile, 'utf8')));
  const gate = validatePayload(payload, baseline);
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const article = (manifest.articles || []).find(item => item.url === articleUrl && item.title === articleTitle);
  const image = (article?.images || []).find(item => item.file === imageFile && item.url === imageUrl
    && item.saved === true && Number(item.length) === expectedImageLength && !item.error);
  if (manifest.day !== day || manifest.status !== 'raw-evidence-saved' || !article || !image
      || fs.statSync(imagePath).size !== expectedImageLength || shaFile(imagePath) !== expectedImageSha256) {
    throw new Error('official article/image evidence gate failed');
  }

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

  try {
    const finalPayload = JSON.parse(JSON.stringify(payload));
    finalPayload.generatedAt = completedAt;
    finalPayload.savedAt = completedAt;
    finalPayload.validation = { ...gate, rawPoolCount: baseline.rawCount,
      eligiblePoolCount: baseline.rows.length, excludedRawPoolRows: baseline.excludedRows,
      manualSecondPassReviewed: true };
    atomicWriteJson(formalFile, finalPayload);

    const rebuild = spawnSync(process.execPath, [path.join(projectRoot, 'kpl-stats-server.js'),
      '--main-reason-backfill', `--day=${day}`, '--days=1', '--force'], {
      cwd: projectRoot, encoding: 'utf8', timeout: 10 * 60 * 1000,
    });
    if (rebuild.error) throw rebuild.error;
    if (rebuild.status !== 0) throw new Error(`main-reason backfill failed: ${asText(rebuild.stderr || rebuild.stdout).slice(-1200)}`);

    const storedPayload = JSON.parse(fs.readFileSync(formalFile, 'utf8'));
    const storedBaseline = validateBaseline(JSON.parse(fs.readFileSync(baselineFile, 'utf8')));
    const storedGate = validatePayload(storedPayload, storedBaseline);
    const combinedFile = path.join(projectRoot, combinedRel);
    const combined = JSON.parse(fs.readFileSync(combinedFile, 'utf8'));
    const combinedSet = validateOutput('combined main-reason', combined, baseline.codes);
    const combinedTgbStat = validateTgbHealth('combined main-reason', combined);
    const quality = JSON.parse(fs.readFileSync(path.join(projectRoot, qualityRel), 'utf8'));
    if (Number(quality.total) !== expectedCount || Number(quality.reviewCoveragePct) !== 100
        || Number(quality.reviewMainReasonCoveragePct) !== 100 || (quality.sourceErrors || []).length !== 0) {
      throw new Error('quality database gate failed');
    }

    const formalSha256 = shaFile(formalFile);
    const combinedSha256 = shaFile(combinedFile);
    const receiptKey = `${operationId}-${formalSha256.slice(0, 16)}`;
    const logEntry = ['', `## ${day} - ${operationId}`, `- Receipt: ${receiptKey}`,
      `- Article: ${articleUrl}`, `- Official image: ${imageFile}; length=${expectedImageLength}; sha256=${expectedImageSha256}`,
      `- Manual payload: count=${expectedCount}; sha256=${payloadSha256}; second-pass-reviewed=true`,
      `- Gate: missing=0; extra=0; duplicates=0; weak=0; name-differences=${gate.nameDifferences.length}; topic-total=${gate.topicTotal}; manual-block-total=${gate.manualBlockTotal}`,
      `- Backup: ${backupDir}`, `- Formal TGB sha256: ${formalSha256}`,
      `- Combined main-reason sha256: ${combinedSha256}`, '- Combined main-reason rebuilt: yes',
      '- Application deployment: none; service restart: none', ''].join('\r\n');
    for (const relative of logRels) fs.appendFileSync(path.join(projectRoot, relative), logEntry, 'utf8');

    const receiptCounts = Object.fromEntries(logRels.map(relative => {
      const text = fs.readFileSync(path.join(projectRoot, relative), 'utf8');
      return [relative, text.split(receiptKey).length - 1];
    }));
    if (Object.values(receiptCounts).some(count => count !== 1)) throw new Error('cloud-log receipt gate failed');

    console.log(JSON.stringify({ ok: true, operation: operationId, day, completedAt,
      articleUrl, imageFile, imageLength: expectedImageLength, imageSha256: expectedImageSha256,
      payloadSha256, gate, storedGate, combinedSet, combinedTgbStat, backupDir,
      formalSha256, combinedSha256, receiptKey, receiptCounts,
      combinedReasonRebuilt: true, applicationDeployed: false, serviceRestarted: false }, null, 2));
  } catch (error) {
    const rollbackFailures = restore(touchedRels, backupDir, beforeStates);
    throw new Error(`${error.message}; rollbackFailures=${JSON.stringify(rollbackFailures)}`);
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
'@

try {
  [System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
  & node $nodeScript $project $payloadFile $expectedPayloadSha256
  if ($LASTEXITCODE -ne 0) { throw ('TGB manual write exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
