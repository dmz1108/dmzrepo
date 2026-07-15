# DreamerQi production read-only evidence: 2026-07-15 medical L2 star-status audit
#
# Purpose: explain why the 2026-07-15 intraday mainline board shows only one theme.
# It loads the day's persisted Level2 job results and re-runs the EXACT production
# star-status logic (strategyMainlineStarStatus and helpers, extracted from
# kpl-stats-server.js the same way tests/star-l2-layers.test.js does) against every
# scanned stock, then prints, per board, the job state / coverage metrics and, for
# each sealed-or-big-gain stock, its maximum-observable bucket verdict:
#   picked max bucket, present/empty/dataMissing, activeBuy, three ratios, star level.
#
# This settles whether medical/创新药 got no star because of (a) a genuine no-star,
# (b) an empty max bucket, (c) an incomplete scan, or (d) a code mismatch bug.
#
# Safety: READ-ONLY. Reads project files under C:\PandaDashboard only. Writes a
# single temporary .js into the OS temp dir and deletes it in finally. It never
# writes, restarts, or mutates any production file, service, or runtime database,
# and it prints only aggregated per-stock bucket sums (the same evidence the admin
# leader-debug endpoint exposes), never raw tick data, tokens, or credentials.
# Idempotent and repeatable. Date-bound to 2026-07-15.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$day = '2026-07-15'

$nodeScript = Join-Path $env:TEMP ('dreamerqi-l2-star-evidence-' + [Guid]::NewGuid().ToString('N') + '.js')

$js = @'
// No 'use strict': the extract-and-eval pattern (same as tests/star-l2-layers.test.js)
// relies on a non-strict direct eval leaking the function declarations into this
// module scope. Strict mode would keep them inside eval and break the star calls.
const fs = require('fs');
const path = require('path');
const projectRoot = process.argv[2];
const day = process.argv[3];
const src = fs.readFileSync(path.join(projectRoot, 'kpl-stats-server.js'), 'utf8');

// Extract the exact production functions/consts (same technique as tests/star-l2-layers.test.js).
function extractFn(name) {
  const sig = new RegExp('(?:async )?function ' + name + '\\(');
  const m = src.match(sig);
  if (!m) throw new Error('fn not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
function extractConst(name) {
  const m = src.match(new RegExp('const ' + name + ' = [^;]+;'));
  if (!m) throw new Error('const not found: ' + name);
  return m[0];
}
const numOrNull = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);
const limitUpThreshold = (code) => /^(30|68)/.test(String(code || '')) ? 20 : 10;
eval([
  extractConst('STRATEGY_MAINLINE_STAR_BUCKETS'),
  extractConst('STRATEGY_MAINLINE_STAR_PRE_RATIO'),
  extractConst('STRATEGY_MAINLINE_STAR_SEAL_RATIO'),
  extractConst('STRATEGY_MAINLINE_BIG_GAIN_PCT'),
  extractConst('STRATEGY_MAINLINE_ALL_BUCKETS'),
  extractConst('STRATEGY_MAINLINE_STAR_MAX_PRE_RATIO'),
  extractConst('STRATEGY_MAINLINE_STAR_MAX_BUY_MIN'),
  extractFn('strategyMainlineBucketRatios'),
  extractFn('strategyMainlinePerOrderShareCap'),
  extractFn('strategyMainlineMaxObservableBucket'),
  extractFn('strategyMainlineStarStatus'),
].join('\n'));

const jobsDir = path.join(projectRoot, 'strategy-data', 'local-l2-jobs', day);
if (!fs.existsSync(jobsDir)) { console.log('NO_JOBS_DIR ' + jobsDir); process.exit(0); }

const out = [];
for (const jobId of fs.readdirSync(jobsDir)) {
  let p;
  try { p = JSON.parse(fs.readFileSync(path.join(jobsDir, jobId, 'latest.json'), 'utf8')); }
  catch (e) { continue; }
  const job = p.job || p;
  const rows = Array.isArray(job.results) ? job.results : [];
  const m = job.metrics || {};
  const levels = {};
  const stocks = [];
  for (const r of rows) {
    let st = null;
    try { st = strategyMainlineStarStatus(r); }
    catch (e) { st = { level: 'ERR', label: String(e && e.message) }; }
    const lv = st ? st.level : 'none';
    levels[lv] = (levels[lv] || 0) + 1;
    const gain = numOrNull(r.gainPct != null ? r.gainPct : r.gain);
    const sealed = gain != null && gain >= limitUpThreshold(r.code);
    if (sealed || (gain != null && gain >= 5)) {
      const mb = st && st.maxBucket;
      stocks.push({
        code: r.code, gain, sealed,
        price: numOrNull(r.price != null ? r.price : r.close), priceSrc: r.priceSource || '',
        lvl: lv, label: st && st.label,
        maxAmt: mb && mb.amount, empty: mb && mb.empty, dm: mb && mb.dataMissing, pm: mb && mb.priceMissing,
        activeBuy: mb && mb.activeBuy, ratios: mb && mb.ratios,
        thKeys: r.thresholds ? Object.keys(r.thresholds) : [],
      });
    }
  }
  out.push({
    board: String(job.boardName || ''), plateId: String(job.plateId || ''),
    status: String(job.status || ''), firstResultAt: job.firstResultAt || '',
    resultRows: m.resultRows != null ? m.resultRows : rows.length,
    rowsWithPrice: m.rowsWithPrice, rowsWithAllBuckets: m.rowsWithAllBuckets,
    levels, stocks,
  });
}
out.sort((a, b) => b.resultRows - a.resultRows);
console.log('=== L2 STAR EVIDENCE day=' + day + ' jobs=' + out.length + ' ===');
for (const j of out) {
  console.log('\n[' + j.board + '] (' + j.plateId + ') status=' + j.status
    + ' rows=' + j.resultRows + ' withPrice=' + j.rowsWithPrice + ' withAllBuckets=' + j.rowsWithAllBuckets
    + ' first=' + j.firstResultAt + ' levels=' + JSON.stringify(j.levels));
  let n = 0;
  for (const s of j.stocks) {
    if (n++ >= 25) { console.log('   ... (' + (j.stocks.length - 25) + ' more)'); break; }
    console.log('   ' + JSON.stringify(s));
  }
}
console.log('\n=== END ===');
'@

[System.IO.File]::WriteAllText($nodeScript, $js, [System.Text.UTF8Encoding]::new($false))
try {
  Write-Output ('evidence actor=' + $env:DREAMERQI_OPS_ACTOR + ' commit=' + $env:DREAMERQI_OPS_COMMIT + ' runId=' + $env:DREAMERQI_OPS_RUN_ID)
  Write-Output ('project=' + $project + ' day=' + $day)
  & node $nodeScript $project $day
  if ($LASTEXITCODE -ne 0) { throw ('node exited with ' + $LASTEXITCODE) }
} finally {
  Remove-Item -LiteralPath $nodeScript -Force -ErrorAction SilentlyContinue
}
