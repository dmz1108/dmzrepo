'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const requestPath = path.join(
  root,
  'ops',
  'production',
  'requests',
  '2026-08-13-review-electricity-timeout-recovery.ps1',
);
const request = fs.readFileSync(requestPath, 'utf8');
const manifestPath = path.join(
  root,
  'ops',
  'production',
  'manifests',
  'strategy-electricity-review-timeout-recovery-20260813.json',
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

for (const value of [
  "const TARGET_DAY = '2026-08-13'",
  "const OPERATION_ID = 'review-electricity-timeout-recovery-20260813-v1'",
  "const ORIGINAL_SAVED_AT = '2026-08-13T06:59:24.116Z'",
  "const OBSERVATION_AT = '2026-08-13T06:57:54.992Z'",
  'const EXPECTED_RANK = 2',
  'const EXPECTED_SCORE = 252',
  'const EXPECTED_PREDICT_SCORE = 202',
  'const EXPECTED_BOARD_GAIN_PCT = -0.34',
  "const EXPECTED_PREDICTION_SHA256 = '6f7163558d764b7248fc604ae2cf1013293a612e241be2454897e6e516a754e7'",
  "const EXPECTED_EVENTS_SHA256 = 'd6b5ff4b741206e16045a8cb1a02f014434c96df40370c7afc74944157097cf9'",
  "correctionType: 'intraday-technical-timeout-recovery'",
  'originalPredictionPreserved: true',
  "String(block?.reason || '') !== 'leader-rework-incomplete'",
  "String(candidate?.qiTier || '') !== 'reserve'",
  "(candidate?.reserveReasons || []).join(',') !== 'no-qualified-leader'",
  "Number(family?.limitUpCount) !== EXPECTED_LIMIT_UP_COUNT",
  "Number(family?.netInflow) !== EXPECTED_NET_INFLOW",
  'Number(family?.rank) !== EXPECTED_RANK',
  'Number(family?.score) !== EXPECTED_SCORE',
  'Number(family?.predictScore) !== EXPECTED_PREDICT_SCORE',
  'Number(family?.boardGainPct) !== EXPECTED_BOARD_GAIN_PCT',
  "east?.technicalRecovery?.basis !== 'audited-same-day-intraday-timeout-correction'",
  'fs.copyFileSync(predictionPath, backup)',
  'atomicWriteBytes(predictionPath, fs.readFileSync(backup))',
  'sourceDatabasesChanged: false',
  'frozenSnapshotChanged: false',
  'serviceRestarted: false',
  'correction.evidence.dailyEventsOriginalSha256 = EXPECTED_EVENTS_SHA256',
  'correction.evidence.dailyEventsReadbackSha256 = currentEventsHash',
]) {
  assert(request.includes(value), `production request must include guard: ${value}`);
}

assert(!request.includes('kpl-limitup-main-reason-overrides'), 'operation must not change main-reason overrides');
assert(!request.includes('mainline-predict-${TARGET_DAY}.json`);\n  const frozenPath'), 'operation must not write a frozen snapshot');
assert(!request.includes("sha256(eventsPath) !== EXPECTED_EVENTS_SHA256"),
  'daily-events envelope hash must not block an exact sample match after a legitimate service rebuild');
assert.deepStrictEqual(manifest, {
  files: [
    { source: 'kpl-stats-server.js', destination: 'kpl-stats-server.js' },
    { source: 'strategy-daily-events.js', destination: 'strategy-daily-events.js' },
  ],
  restart: 'main',
}, 'server and daily-events module must deploy and roll back atomically with one main-service restart');

console.log('2026-08-13 Electricity timeout recovery request tests passed');
