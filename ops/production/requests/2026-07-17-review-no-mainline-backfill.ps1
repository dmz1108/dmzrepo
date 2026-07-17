# DreamerQi production repair: restore the missing 2026-07-16 no-mainline review row.
#
# The source of truth is the frozen 2026-07-16 strategy snapshot. The operation
# proceeds only when both Eastmoney and THS are explicitly available and both
# explicitly report zero qualified mainlines. It never invents an intraday phase:
# the restored row remains "after close" and is excluded from prediction-rate stats.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-no-mainline-backfill-' + [Guid]::NewGuid().ToString('N') + '.js')

$js = @'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2];
const actor = process.argv[3] || 'unknown';
const operationCommit = process.argv[4] || '';
const operationRunId = process.argv[5] || '';
const day = '2026-07-16';
const operationId = 'review-no-mainline-backfill-20260716';
const sourceFile = path.join(projectRoot, 'strategy-data', `strategy-mainline-snapshot-${day}.json`);
const targetFile = path.join(projectRoot, 'strategy-data', `mainline-predict-${day}.json`);
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

if (!fs.existsSync(sourceFile)) throw new Error(`frozen snapshot missing: ${day}`);
const snapshot = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
if (String(snapshot.day || '') !== day) throw new Error('snapshot day mismatch');
if (snapshot.frozen !== true || snapshot.snapshotState !== 'frozen') throw new Error('snapshot is not frozen');
if (!Array.isArray(snapshot.mainlines) || snapshot.mainlines.length !== 0) {
  throw new Error('snapshot contains formal mainlines; refusing no-mainline backfill');
}

function sourceBlock(key, zsType) {
  const source = snapshot?.mainlinesBySource?.[key];
  if (!source || source.available !== true || source.hasMainlines !== false) {
    throw new Error(`${key} is not an explicit available no-mainline source`);
  }
  if (!Array.isArray(source.mainlines) || source.mainlines.length !== 0) {
    throw new Error(`${key} contains mainlines; refusing backfill`);
  }
  return {
    top: [],
    candidates: [],
    starTransitions: [],
    available: true,
    hasMainlines: false,
    reason: String(source.reason || 'no-qualified-mainline'),
    message: String(source.message || ''),
    zsType,
  };
}

const eastmoney = sourceBlock('eastmoney', 6);
const ths = sourceBlock('ths', 5);
const existing = fs.existsSync(targetFile) ? JSON.parse(fs.readFileSync(targetFile, 'utf8')) : null;
if (existing) {
  const alreadyCorrect = existing.recordState === 'no-mainline'
    && existing.hasMainlines === false
    && existing?.bySource?.eastmoney?.available === true
    && existing?.bySource?.eastmoney?.hasMainlines === false
    && existing?.bySource?.ths?.available === true
    && existing?.bySource?.ths?.hasMainlines === false;
  if (!alreadyCorrect) throw new Error('prediction file already exists and is not the approved no-mainline record');
  console.log(JSON.stringify({ ok: true, day, changed: false, reason: 'already-correct', hash: sha256(targetFile) }));
  process.exit(0);
}

const savedAt = String(snapshot.snapshotSavedAt || snapshot.generatedAt || snapshot.savedAt || '');
if (!savedAt || !Number.isFinite(Date.parse(savedAt))) throw new Error('snapshot savedAt is invalid');
const payload = {
  day,
  savedAt,
  sessionPhase: '\u5df2\u6536\u76d8',
  confirmedKey: '',
  schemaVersion: 3,
  hasMainlines: false,
  recordState: 'no-mainline',
  recordOrigin: 'frozen-no-mainline-backfill',
  sourceSnapshot: {
    file: path.basename(sourceFile),
    snapshotSavedAt: savedAt,
    snapshotReason: String(snapshot.snapshotReason || ''),
    sourceDay: snapshot.sourceDay || null,
  },
  bySource: { eastmoney, ths },
  top: [],
  candidates: [],
  starTransitions: [],
};

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const backupDir = path.join(projectRoot, '_deploy-backups', `${operationId}-${stamp}`);
fs.mkdirSync(backupDir, { recursive: true });
fs.copyFileSync(sourceFile, path.join(backupDir, path.basename(sourceFile)));

const tempFile = `${targetFile}.${process.pid}.${Date.now()}.tmp`;
fs.writeFileSync(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
if (fs.existsSync(targetFile)) {
  fs.rmSync(tempFile, { force: true });
  throw new Error('prediction file appeared during backfill; refusing overwrite');
}
fs.renameSync(tempFile, targetFile);

const verify = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
if (verify.day !== day || verify.recordState !== 'no-mainline' || verify.hasMainlines !== false
  || verify.bySource?.eastmoney?.hasMainlines !== false || verify.bySource?.ths?.hasMainlines !== false) {
  fs.rmSync(targetFile, { force: true });
  throw new Error('post-write verification failed');
}

const logEntry = [
  '',
  `## ${new Date().toISOString().slice(0, 10)} - ${operationId}`,
  `- Actor: ${actor}`,
  `- Commit: ${operationCommit}`,
  `- Run: ${operationRunId}`,
  '- Restored the missing 2026-07-16 review row as an explicit two-source no-mainline record.',
  '- Evidence: frozen snapshot; both sources available=true and hasMainlines=false.',
  '- Session phase remains after-close, so the row is visible but excluded from prediction-rate statistics.',
  `- Rollback: remove ${targetFile}; evidence backup: ${backupDir}`,
  '- Service restart: none',
  '',
].join('\r\n');
for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
  const file = path.join(projectRoot, name);
  if (fs.existsSync(file)) fs.appendFileSync(file, logEntry, 'utf8');
}

console.log(JSON.stringify({
  ok: true,
  day,
  changed: true,
  targetHash: sha256(targetFile),
  sourceHash: sha256(sourceFile),
  backupDir,
}));
'@

[System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
try {
  & node $nodeScript $project $env:DREAMERQI_OPS_ACTOR $env:DREAMERQI_OPS_COMMIT $env:DREAMERQI_OPS_RUN_ID
  if ($LASTEXITCODE -ne 0) { throw ('node exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
