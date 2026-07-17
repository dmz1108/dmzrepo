# DreamerQi production repair: backfill two Owner-confirmed historical review stars.
#
# Scope:
# - 2026-07-09 / 半导体: 长电科技 (600584) -> confirmed
# - 2026-07-08 / 算力AI: 紫光股份 (000938) -> confirmed
#
# This edits only the two persisted mainline prediction files used by the review
# endpoint. It does not modify frozen strategy snapshots, L2 jobs, score logic,
# source databases, or application code. Original files are copied to a timestamped
# rollback directory before replacement. The operation is idempotent and records
# the previous star in per-row audit metadata.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-review-star-backfill-' + [Guid]::NewGuid().ToString('N') + '.js')

$js = @'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = process.argv[2];
const actor = process.argv[3] || 'unknown';
const operationCommit = process.argv[4] || '';
const operationRunId = process.argv[5] || '';
const correctedAt = new Date().toISOString();
const operationId = 'review-star-backfill-20260708-09';
const targets = [
  { day: '2026-07-09', familyName: '半导体', code: '600584', name: '长电科技' },
  { day: '2026-07-08', familyName: '算力AI', code: '000938', name: '紫光股份' },
];

const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
const normalizeCode = value => String(value || '').replace(/\D/g, '').slice(-6).padStart(6, '0');

function setProperty(object, key, value) {
  object[key] = value;
}

function blockRows(payload) {
  const blocks = [{ label: 'compat', top: payload.top, candidates: payload.candidates }];
  for (const [source, block] of Object.entries(payload.bySource || {})) {
    if (!block || typeof block !== 'object') continue;
    blocks.push({ label: source, top: block.top, candidates: block.candidates });
  }
  return blocks;
}

function matchesFamily(row, target) {
  return [row?.theme, row?.key, row?.familyKey]
    .map(value => String(value || '').trim().replace(/^(?:group|theme):/i, ''))
    .some(value => value === target.familyName);
}

function upsertConfirmedStar(row, target) {
  const previousStar = clone(row.star);
  const alreadyCorrect = normalizeCode(row?.star?.code) === target.code
    && row?.star?.level === 'confirmed'
    && row?.star?.manualCorrection === true
    && row?.reviewCorrection?.operationId === operationId;
  if (alreadyCorrect) return false;
  setProperty(row, 'star', {
    ...(row.star && typeof row.star === 'object' ? row.star : {}),
    code: target.code,
    name: target.name,
    level: 'confirmed',
    manualCorrection: true,
    correctedAt,
    correctionReason: 'owner-confirmed-historical-review-star',
  });
  setProperty(row, 'l2VerificationStatus', 'qi');
  setProperty(row, 'l2ScanState', 'qi');
  setProperty(row, 'reviewCorrection', {
    operationId,
    correctedAt,
    actor,
    previousStar,
    confirmedStar: { code: target.code, name: target.name, level: 'confirmed' },
  });
  return !alreadyCorrect;
}

function upsertCandidateStar(candidate, target) {
  const stars = Array.isArray(candidate.stars) ? candidate.stars : [];
  const previous = stars.find(star => normalizeCode(star?.code) === target.code) || null;
  const alreadyCorrect = previous?.level === 'confirmed'
    && previous?.manualCorrection === true
    && candidate?.l2VerificationStatus === 'qi'
    && candidate?.l2ScanState === 'qi';
  if (alreadyCorrect) return false;
  const confirmed = {
    ...(previous && typeof previous === 'object' ? previous : {}),
    code: target.code,
    name: target.name,
    level: 'confirmed',
    label: '明星确认',
    manualCorrection: true,
    correctedAt,
  };
  candidate.stars = [confirmed, ...stars.filter(star => normalizeCode(star?.code) !== target.code)].slice(0, 4);
  candidate.l2VerificationStatus = 'qi';
  candidate.l2ScanState = 'qi';
  return true;
}

function prepareTarget(target) {
  const file = path.join(projectRoot, 'strategy-data', `mainline-predict-${target.day}.json`);
  if (!fs.existsSync(file)) throw new Error(`prediction file missing: ${target.day}`);
  const raw = fs.readFileSync(file, 'utf8');
  const payload = JSON.parse(raw);
  if (String(payload.day || '') !== target.day) throw new Error(`day mismatch in ${path.basename(file)}`);

  const matched = [];
  let needsWrite = false;
  for (const block of blockRows(payload)) {
    const rows = Array.isArray(block.top) ? block.top : [];
    for (const row of rows) {
      if (!matchesFamily(row, target)) continue;
      const before = clone(row.star);
      needsWrite = upsertConfirmedStar(row, target) || needsWrite;
      const key = String(row.key || row.familyKey || '');
      const candidates = Array.isArray(block.candidates) ? block.candidates : [];
      const candidate = candidates.find(item =>
        (key && String(item?.key || item?.familyKey || '') === key) || matchesFamily(item, target));
      if (candidate) needsWrite = upsertCandidateStar(candidate, target) || needsWrite;
      matched.push({ block: block.label, theme: String(row.theme || row.key || ''), before });
    }
  }
  if (!matched.length) throw new Error(`target family not found: ${target.day}`);

  const existingCorrections = Array.isArray(payload.reviewCorrections) ? payload.reviewCorrections : [];
  const existingCorrection = existingCorrections.find(item => item?.operationId === operationId && item?.day === target.day);
  if (!existingCorrection) needsWrite = true;
  if (needsWrite) payload.reviewCorrections = [
    ...existingCorrections.filter(item => item?.operationId !== operationId || item?.day !== target.day),
    {
      operationId,
      day: target.day,
      correctedAt,
      actor,
      operationCommit,
      operationRunId,
      star: { code: target.code, name: target.name, level: 'confirmed' },
      matchedBlocks: matched.map(item => item.block),
    },
  ];
  return { target, file, raw, payload, matched, needsWrite, beforeHash: sha256(file) };
}

function replaceWithRollback(file, text) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const swap = `${file}.${process.pid}.${Date.now()}.old`;
  fs.writeFileSync(temp, text, 'utf8');
  fs.renameSync(file, swap);
  try {
    fs.renameSync(temp, file);
    fs.rmSync(swap, { force: true });
  } catch (error) {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    if (fs.existsSync(swap)) fs.renameSync(swap, file);
    fs.rmSync(temp, { force: true });
    throw error;
  }
}

const prepared = targets.map(prepareTarget);
const writeItems = prepared.filter(item => item.needsWrite);
const stamp = correctedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
const backupDir = writeItems.length
  ? path.join(projectRoot, '_deploy-backups', `${operationId}-${stamp}`)
  : '';
if (writeItems.length) fs.mkdirSync(backupDir, { recursive: true });
for (const item of writeItems) fs.copyFileSync(item.file, path.join(backupDir, path.basename(item.file)));

try {
  for (const item of writeItems) replaceWithRollback(item.file, `${JSON.stringify(item.payload, null, 2)}\n`);
} catch (error) {
  for (const item of writeItems) {
    const backup = path.join(backupDir, path.basename(item.file));
    if (fs.existsSync(backup)) fs.copyFileSync(backup, item.file);
  }
  throw error;
}

for (const item of prepared) {
  const verify = JSON.parse(fs.readFileSync(item.file, 'utf8'));
  const confirmed = blockRows(verify).flatMap(block => Array.isArray(block.top) ? block.top : [])
    .filter(row => matchesFamily(row, item.target))
    .every(row => normalizeCode(row?.star?.code) === item.target.code && row?.star?.level === 'confirmed');
  if (!confirmed) throw new Error(`verification failed: ${item.target.day}`);
  console.log(JSON.stringify({
    day: item.target.day,
    star: `${item.target.code} ${item.target.name}`,
    level: 'confirmed',
    matched: item.matched,
    beforeHash: item.beforeHash,
    afterHash: sha256(item.file),
  }));
}

const logEntry = [
  '',
  `## ${correctedAt.slice(0, 10)} - ${operationId}`,
  `- Actor: ${actor}`,
  `- Commit: ${operationCommit}`,
  `- Run: ${operationRunId}`,
  '- Changed runtime prediction records only: 2026-07-09 600584 and 2026-07-08 000938 set to confirmed review stars.',
  `- Rollback backup: ${backupDir}`,
  '- Service restart: none',
  '',
].join('\r\n');
if (writeItems.length) {
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    const file = path.join(projectRoot, name);
    if (fs.existsSync(file)) fs.appendFileSync(file, logEntry, 'utf8');
  }
}
console.log(writeItems.length ? `backupDir=${backupDir}` : 'no-op: targets already corrected');
'@

[System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
try {
  Write-Output ('repair actor=' + $env:DREAMERQI_OPS_ACTOR + ' commit=' + $env:DREAMERQI_OPS_COMMIT + ' runId=' + $env:DREAMERQI_OPS_RUN_ID)
  & node $nodeScript $project $env:DREAMERQI_OPS_ACTOR $env:DREAMERQI_OPS_COMMIT $env:DREAMERQI_OPS_RUN_ID
  if ($LASTEXITCODE -ne 0) { throw ('node exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
