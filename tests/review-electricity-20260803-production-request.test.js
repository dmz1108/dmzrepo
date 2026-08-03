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
  '2026-08-03-review-electricity-mainline-backfill.ps1',
);
const request = fs.readFileSync(requestPath, 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(request.includes("const TARGET_DAY = '2026-08-03'"), 'operation must be bound to the audited day');
assert(request.includes("const TARGET_STAR_CODE = '600396'"), 'operation must pin the audited confirmed star');
for (const code of ['000595', '600396', '600644']) {
  assert(request.includes(`'${code}'`), `operation must pin same-family limit-up ${code}`);
}
assert(request.includes("String(row?.familyKey || '') === TARGET_FAMILY"), 'frozen exclusion must be validated by family');
assert(request.includes("String(electricity.l2ScanState || '') !== 'scanned-no-star'"), 'operation must prove the original L2 false negative');
assert(request.includes("result?.thresholds?.['500000']"), 'confirmed-star validation must include the 50w bucket');
assert(request.includes("result?.thresholds?.['10000000']"), 'confirmed-star validation must include the stock maximum bucket');
assert(request.includes('Number(maximum.activeBuy || 0) > 150000000'), 'active-buy amount gate must remain strict');
assert(request.includes('Number(maximum.passiveBuy || 0) > 200000000'), 'passive-buy amount gate must remain strict');
assert(request.includes('confirmedPassed < 2'), 'confirmed ratio gate must require two of three checks');
assert(request.includes("[['eastmoney', 6], ['ths', 5]]"), 'both board sources must independently provide L2 evidence');
assert(request.includes("'eastmoney', leader, buildStar(l2Evidence.eastmoney, confirmedAt)"),
  'root compatibility block must remain the Eastmoney source rather than a cross-source union');
assert(request.includes('no prior Electricity main-reason for the star'), 'qualified leader must require prior same-family evidence');
assert(request.includes("String(reasonRow.finalBoardTopic || '') !== TARGET_THEME"), 'three current combined main reasons must match Electricity exactly');
assert(request.includes('Electricity main-reason set drifted'),
  'operation must reject source changes that add or remove formal Electricity rows');
assert(request.includes('frozenSnapshotPreserved: true'), 'correction metadata must preserve the frozen snapshot');
assert(request.includes("next.sessionPhase = '\\u5df2\\u6536\\u76d8'"),
  'post-close correction must not enter intraday prediction statistics');
assert(request.includes('excludedFromPredictionStats: true'),
  'correction metadata must explicitly document statistics exclusion');
assert(request.includes('fs.copyFileSync(predictionPath'), 'prediction must be backed up before replacement');
assert(request.includes('atomicWriteJson(predictionPath, readJson(backup))'),
  'verification failure must restore the backup atomically');
assert(!request.includes('kpl-limitup-main-reason-overrides'), 'correction must not change main-reason overrides');
assert(request.includes('public review formal qualification is not satisfied'), 'public review must pass the formal qualification gate');
assert(request.includes('post-close correction was not excluded from prediction statistics'),
  'public verification must prove the correction is excluded from prediction statistics');
assert(request.includes('required cloud operation log is missing'), 'both cloud logs must exist before writing');
assert(request.includes('serviceRestarted: false'), 'runtime correction must not claim a service restart');

console.log('2026-08-03 Electricity review correction request tests passed');
