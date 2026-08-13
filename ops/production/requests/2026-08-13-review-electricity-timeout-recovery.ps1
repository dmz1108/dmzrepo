# DreamerQi audited correction for the 2026-08-13 Electricity review record.
#
# The original intraday prediction and daily observation remain unchanged. This
# operation validates the exact 14:57 Electricity observation and the 14:59
# leader timeout, then appends only an auditable review correction. It is
# date-bound, idempotent, backed up, and restarts no service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-electricity-timeout-recovery-' + [Guid]::NewGuid().ToString('N') + '.js')

$js = @'
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = process.argv[2];
const HTTP_PORT = Number(process.argv[3] || 8765);
const ACTOR = process.argv[4] || 'unknown';
const OPERATION_COMMIT = process.argv[5] || '';
const OPERATION_RUN_ID = process.argv[6] || '';
const TARGET_DAY = '2026-08-13';
const TARGET_FAMILY = 'group:\u7535\u529b';
const TARGET_THEME = '\u7535\u529b';
const SOURCE = 'eastmoney';
const OPERATION_ID = 'review-electricity-timeout-recovery-20260813-v1';
const ORIGINAL_SAVED_AT = '2026-08-13T06:59:24.116Z';
const OBSERVATION_AT = '2026-08-13T06:57:54.992Z';
const EXPECTED_STARS = ['600726', '601991'];
const EXPECTED_LEADERS = ['000595', '000692', '605286'];
const EXPECTED_RANK = 2;
const EXPECTED_SCORE = 252;
const EXPECTED_PREDICT_SCORE = 202;
const EXPECTED_BOARD_GAIN_PCT = -0.34;
const EXPECTED_LIMIT_UP_COUNT = 5;
const EXPECTED_NET_INFLOW = 2735110656;
const EXPECTED_PREDICTION_SHA256 = '6f7163558d764b7248fc604ae2cf1013293a612e241be2454897e6e516a754e7';
const EXPECTED_EVENTS_SHA256 = 'd6b5ff4b741206e16045a8cb1a02f014434c96df40370c7afc74944157097cf9';
const correctedAt = new Date().toISOString();

function normalizeCode(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(-6);
  return digits ? digits.padStart(6, '0') : '';
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function atomicWriteJson(file, value) {
  atomicWriteBytes(file, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8'));
}

function atomicWriteBytes(file, bytes) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const swap = `${file}.${process.pid}.${Date.now()}.old`;
  fs.writeFileSync(temp, bytes);
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

function requestJson(requestPath) {
  return new Promise((resolve, reject) => {
    const request = http.get({ host: '127.0.0.1', port: HTTP_PORT, path: requestPath, timeout: 120000 }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) return reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(new Error(`invalid JSON response: ${error.message}`)); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('request timeout')));
    request.on('error', reject);
  });
}

function assertCloudLogs() {
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    if (!fs.existsSync(path.join(PROJECT_ROOT, name))) throw new Error(`required cloud operation log is missing: ${name}`);
  }
}

function findCorrection(payload) {
  return (Array.isArray(payload?.reviewCorrections) ? payload.reviewCorrections : [])
    .find(row => String(row?.operationId || '') === OPERATION_ID) || null;
}

function assertOriginalPrediction(payload) {
  if (String(payload?.day || '') !== TARGET_DAY || String(payload?.savedAt || '') !== ORIGINAL_SAVED_AT
    || String(payload?.sessionPhase || '') !== '\u5c3e\u76d8') {
    throw new Error('prediction identity drifted');
  }
  const block = payload?.bySource?.[SOURCE];
  const candidate = (block?.candidates || []).find(row => String(row?.familyKey || row?.key || '') === TARGET_FAMILY);
  const stars = (candidate?.stars || []).filter(row => String(row?.level || '') === 'confirmed')
    .map(row => normalizeCode(row?.code)).filter(Boolean).sort();
  if (String(block?.reason || '') !== 'leader-rework-incomplete' || (block?.top || []).length
    || String(candidate?.qiTier || '') !== 'reserve'
    || (candidate?.reserveReasons || []).join(',') !== 'no-qualified-leader'
    || stars.join(',') !== EXPECTED_STARS.slice().sort().join(',')) {
    throw new Error('audited timeout prediction shape drifted');
  }
}

function assertObservation(payload) {
  if (String(payload?.day || '') !== TARGET_DAY) throw new Error('daily-events day drifted');
  const sample = (payload?.intradayObservation?.samples || [])
    .find(row => String(row?.observedAt || '') === OBSERVATION_AT);
  const family = (sample?.families || []).find(row => String(row?.familyKey || '') === TARGET_FAMILY);
  const status = sample?.realtimeData?.sourceStatus?.[SOURCE];
  const stars = (family?.stars || []).filter(row => String(row?.level || '') === 'confirmed')
    .map(row => normalizeCode(row?.code)).filter(Boolean).sort();
  const leaders = (family?.leaderCodes || []).map(normalizeCode).filter(Boolean).sort();
  if (String(sample?.sessionPhase || '') !== '\u5c3e\u76d8'
    || sample?.realtimeData?.readyFor?.intradayRanking !== true
    || status?.scoreEligible !== true || status?.stale === true || String(status?.sourceDay || '') !== TARGET_DAY
    || String(family?.l2VerificationStatus || '') !== 'qi'
    || Number(family?.rank) !== EXPECTED_RANK || Number(family?.score) !== EXPECTED_SCORE
    || Number(family?.predictScore) !== EXPECTED_PREDICT_SCORE
    || Number(family?.boardGainPct) !== EXPECTED_BOARD_GAIN_PCT
    || Number(family?.limitUpCount) !== EXPECTED_LIMIT_UP_COUNT
    || Number(family?.netInflow) !== EXPECTED_NET_INFLOW || family?.resonanceSignal !== true
    || stars.join(',') !== EXPECTED_STARS.slice().sort().join(',')
    || leaders.join(',') !== EXPECTED_LEADERS.slice().sort().join(',')) {
    throw new Error('audited 14:57 Electricity observation drifted');
  }
  return { sample, family, stars, leaders };
}

function buildCorrection(observation) {
  return {
    operationId: OPERATION_ID,
    day: TARGET_DAY,
    correctedAt,
    actor: ACTOR,
    operationCommit: OPERATION_COMMIT,
    operationRunId: OPERATION_RUN_ID,
    correctionType: 'intraday-technical-timeout-recovery',
    source: SOURCE,
    originalSavedAt: ORIGINAL_SAVED_AT,
    failureReason: 'leader-rework-incomplete',
    familyKey: TARGET_FAMILY,
    theme: TARGET_THEME,
    observationAt: OBSERVATION_AT,
    originalPredictionPreserved: true,
    sourceDatabasesChanged: false,
    frozenSnapshotChanged: false,
    evidence: {
      limitUpCount: EXPECTED_LIMIT_UP_COUNT,
      netInflow: EXPECTED_NET_INFLOW,
      rank: EXPECTED_RANK,
      score: EXPECTED_SCORE,
      predictScore: EXPECTED_PREDICT_SCORE,
      boardGainPct: EXPECTED_BOARD_GAIN_PCT,
      confirmedStarCodes: observation.stars,
      leaderCodes: observation.leaders,
      predictionSha256: EXPECTED_PREDICTION_SHA256,
      dailyEventsSha256: EXPECTED_EVENTS_SHA256,
    },
    note: 'The 14:59 leader timeout overwrote the exact 14:57 eligible intraday observation; raw prediction and observation remain unchanged.',
  };
}

function assertCorrection(payload) {
  const correction = findCorrection(payload);
  if (!correction || correction.correctionType !== 'intraday-technical-timeout-recovery'
    || correction.originalPredictionPreserved !== true || correction.sourceDatabasesChanged !== false
    || correction.frozenSnapshotChanged !== false || correction.observationAt !== OBSERVATION_AT
    || correction.evidence?.confirmedStarCodes?.slice().sort().join(',') !== EXPECTED_STARS.slice().sort().join(',')
    || correction.evidence?.leaderCodes?.slice().sort().join(',') !== EXPECTED_LEADERS.slice().sort().join(',')) {
    throw new Error('persisted review correction is invalid');
  }
}

async function verifyPublic() {
  let latestError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const review = await requestJson('/api/strategy-mainline-review?days=10');
      const row = (review?.days || []).find(item => String(item?.day || '') === TARGET_DAY);
      const east = row?.bySource?.eastmoney;
      const starCodes = (east?.formalMainlines || []).flatMap(item => item?.stars || [])
        .map(item => normalizeCode(item?.code)).filter(Boolean);
      if (!review?.ok || !row || east?.status !== 'mainline' || east?.theme !== TARGET_THEME
        || east?.mainlineQualified !== true || Number(east?.mainlineQualification?.limitUpCount || 0) < 3
        || !starCodes.includes('601991') || east?.technicalRecovery?.basis !== 'audited-same-day-intraday-timeout-correction') {
        throw new Error('public review did not restore audited Electricity mainline');
      }
      return row;
    } catch (error) {
      latestError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw latestError;
}

function appendCloudLogs(backupDir, beforeHash, afterHash, row) {
  const entry = [
    '',
    `## ${correctedAt.slice(0, 10)} - ${OPERATION_ID}`,
    `- Actor: ${ACTOR}`,
    `- Commit: ${OPERATION_COMMIT || 'not-provided'}`,
    `- Run: ${OPERATION_RUN_ID || 'not-provided'}`,
    '- Repair: appended an audited review correction for the exact 14:57 Electricity intraday observation overwritten by the 14:59 leader timeout.',
    '- Raw prediction, daily observation, frozen snapshot, source databases, L2 jobs, and service state were not changed.',
    `- Backup: ${backupDir}`,
    `- Prediction SHA-256: ${beforeHash} -> ${afterHash}`,
    `- Verification: eastmoneyStatus=${row?.bySource?.eastmoney?.status}, qualified=${row?.bySource?.eastmoney?.mainlineQualified}, limitUpCount=${row?.bySource?.eastmoney?.mainlineQualification?.limitUpCount}.`,
    '- Service restart: none',
    '',
  ].join('\r\n');
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    fs.appendFileSync(path.join(PROJECT_ROOT, name), entry, 'utf8');
  }
}

async function main() {
  if (!PROJECT_ROOT) throw new Error('project root is required');
  assertCloudLogs();
  const predictionPath = path.join(PROJECT_ROOT, 'strategy-data', `mainline-predict-${TARGET_DAY}.json`);
  const eventsPath = path.join(PROJECT_ROOT, 'strategy-data', `strategy-daily-events-${TARGET_DAY}.json`);
  for (const file of [predictionPath, eventsPath]) {
    if (!fs.existsSync(file)) throw new Error(`required evidence file missing: ${path.basename(file)}`);
  }
  const prediction = readJson(predictionPath);
  assertOriginalPrediction(prediction);
  const existingCorrection = findCorrection(prediction);
  if (existingCorrection) {
    assertCorrection(prediction);
    const row = await verifyPublic();
    console.log(JSON.stringify({ ok: true, noOp: true, operationId: OPERATION_ID, day: TARGET_DAY, theme: row?.bySource?.eastmoney?.theme }));
    return;
  }
  if (sha256(predictionPath) !== EXPECTED_PREDICTION_SHA256) {
    throw new Error('production prediction SHA-256 drifted; refusing correction');
  }
  // A service restart can legitimately rebuild the daily-events envelope after
  // code deployment. Bind the correction to the exact sample fields below and
  // preserve both the originally audited hash and the current readback hash.
  const currentEventsHash = sha256(eventsPath);
  const observation = assertObservation(readJson(eventsPath));
  const next = clone(prediction);
  const correction = buildCorrection(observation);
  correction.evidence.dailyEventsOriginalSha256 = EXPECTED_EVENTS_SHA256;
  correction.evidence.dailyEventsReadbackSha256 = currentEventsHash;
  next.reviewCorrections = [
    ...(Array.isArray(prediction.reviewCorrections) ? prediction.reviewCorrections : []),
    correction,
  ];
  assertOriginalPrediction(next);
  assertCorrection(next);

  const stamp = correctedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(PROJECT_ROOT, '_deploy-backups', `${OPERATION_ID}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, path.basename(predictionPath));
  fs.copyFileSync(predictionPath, backup);
  const beforeHash = sha256(predictionPath);
  try {
    atomicWriteJson(predictionPath, next);
    const persisted = readJson(predictionPath);
    assertOriginalPrediction(persisted);
    assertCorrection(persisted);
    const row = await verifyPublic();
    const afterHash = sha256(predictionPath);
    appendCloudLogs(backupDir, beforeHash, afterHash, row);
    console.log(JSON.stringify({
      ok: true,
      operationId: OPERATION_ID,
      day: TARGET_DAY,
      theme: TARGET_THEME,
      observationAt: OBSERVATION_AT,
      confirmedStarCodes: EXPECTED_STARS,
      beforeHash,
      afterHash,
      backupDir,
      originalPredictionPreserved: true,
      sourceDatabasesChanged: false,
      frozenSnapshotChanged: false,
      serviceRestarted: false,
    }));
  } catch (error) {
    atomicWriteBytes(predictionPath, fs.readFileSync(backup));
    throw error;
  }
}

main().catch(error => {
  console.error(String(error?.stack || error));
  process.exitCode = 1;
});
'@

[System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
try {
  Write-Output ('correction actor=' + $env:DREAMERQI_OPS_ACTOR + ' commit=' + $env:DREAMERQI_OPS_COMMIT + ' runId=' + $env:DREAMERQI_OPS_RUN_ID)
  & node $nodeScript $project 8765 $env:DREAMERQI_OPS_ACTOR $env:DREAMERQI_OPS_COMMIT $env:DREAMERQI_OPS_RUN_ID
  if ($LASTEXITCODE -ne 0) { throw ('node exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
