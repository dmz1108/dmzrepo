# DreamerQi production correction for the 2026-08-03 Electricity review record.
#
# The frozen snapshot remains immutable. This operation validates the current
# final limit-up pool, current combined main-reason database, persisted L2 jobs,
# and prior Electricity reasons. It then writes only the persisted prediction
# record used by historical strategy display. The original prediction is backed
# up and restored on any verification failure. The operation is date-bound and
# idempotent; it changes no source database and restarts no service.

$ErrorActionPreference = 'Stop'

$project = 'C:\PandaDashboard'
$nodeScript = Join-Path $env:TEMP ('dreamerqi-electricity-review-backfill-' + [Guid]::NewGuid().ToString('N') + '.js')

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
const TARGET_DAY = '2026-08-03';
const TARGET_THEME = '\u7535\u529b';
const TARGET_FAMILY = 'theme:\u7535\u529b';
const TARGET_STAR_CODE = '600396';
const TARGET_STAR_NAME = '\u534e\u7535\u8fbd\u80fd';
const V1_OPERATION_ID = 'review-electricity-mainline-backfill-20260803';
const OPERATION_ID = 'review-electricity-mainline-backfill-20260803-v2';
const REQUIRED_LIMIT_CODES = ['000595', '600396', '600644'];
const REQUIRED_L2_JOBS = {
  eastmoney: {
    zsType: 6,
    jobId: '2e697655678c20dc',
    plateId: 'BK1024',
    boardName: '\u7eff\u8272\u7535\u529b',
    familyKey: 'theme:\u7eff\u7535\u65b0\u80fd\u6e90\u8fd0\u8425',
  },
  ths: {
    zsType: 5,
    jobId: '415560b0b3211565',
    plateId: '308969',
    boardName: '\u8d85\u8d85\u4e34\u754c\u53d1\u7535',
    familyKey: 'theme:\u8d85\u8d85\u4e34\u754c\u53d1\u7535',
  },
};
const correctedAt = new Date().toISOString();

function normalizeCode(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(-6);
  return digits ? digits.padStart(6, '0') : '';
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clone(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function atomicWriteJson(file, value) {
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const swap = `${file}.${process.pid}.${Date.now()}.old`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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
    const request = http.get({
      host: '127.0.0.1',
      port: HTTP_PORT,
      path: requestPath,
      timeout: 120000,
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(body)); }
        catch (error) { reject(new Error(`invalid JSON response: ${error.message}`)); }
      });
    });
    request.on('timeout', () => request.destroy(new Error('HTTP request timed out')));
    request.on('error', reject);
  });
}

function ratio(buy, sell) {
  return Number(buy || 0) / Math.max(1, Number(sell || 0));
}

function totalRatio(bucket) {
  return ratio(
    Number(bucket?.activeBuy || 0) + Number(bucket?.passiveBuy || 0),
    Number(bucket?.activeSell || 0) + Number(bucket?.passiveSell || 0),
  );
}

function rounded(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}

function assertCloudLogs() {
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    if (!fs.existsSync(path.join(PROJECT_ROOT, name))) {
      throw new Error(`required cloud operation log is missing: ${name}`);
    }
  }
}

function reviewCorrection(payload, operationId) {
  return (payload?.reviewCorrections || []).find(row => row?.operationId === operationId) || null;
}

function assertV1Prediction(payload) {
  const correction = reviewCorrection(payload, V1_OPERATION_ID);
  if (!correction) throw new Error('v1 correction metadata is missing');
  if (payload.hasMainlines !== true || payload.recordState !== 'mainline'
    || String(payload.sessionPhase || '') !== '\u5df2\u6536\u76d8') {
    throw new Error('v1 correction is no longer the audited mainline record');
  }
  const root = payload?.candidates?.[0];
  const eastmoney = payload?.bySource?.eastmoney?.candidates?.[0];
  const ths = payload?.bySource?.ths?.candidates?.[0];
  if ((payload?.candidates || []).length !== 1 || (payload?.top || []).length !== 1
    || String(root?.familyKey || '') !== TARGET_FAMILY
    || String(root?.theme || '') !== TARGET_THEME
    || normalizeCode(root?.stars?.[0]?.code) !== TARGET_STAR_CODE
    || String(root?.stars?.[0]?.level || '') !== 'confirmed') {
    throw new Error('v1 root correction drifted from the audited Electricity result');
  }
  const currentCodes = [...new Set((root?.todayLimitCodes || []).map(normalizeCode).filter(Boolean))].sort();
  if (currentCodes.join(',') !== REQUIRED_LIMIT_CODES.slice().sort().join(',')) {
    throw new Error('v1 correction limit-up set drifted');
  }
  if (String(root?.correctionEvidence?.operationId || '') !== V1_OPERATION_ID
    || String(eastmoney?.correctionEvidence?.operationId || '') !== V1_OPERATION_ID
    || String(ths?.correctionEvidence?.operationId || '') !== V1_OPERATION_ID) {
    throw new Error('v1 correction evidence metadata drifted');
  }
  if ((eastmoney?.correctionEvidence?.l2Jobs || []).join(',') !== '71d4a6fba47e3d37'
    || (eastmoney?.mergedThemes || []).join(',') !== '\u98ce\u80fd') {
    throw new Error('v1 Eastmoney evidence is not the audited Wind mis-selection');
  }
  if ((ths?.correctionEvidence?.l2Jobs || []).join(',') !== REQUIRED_L2_JOBS.ths.jobId
    || (ths?.mergedThemes || []).join(',') !== REQUIRED_L2_JOBS.ths.boardName) {
    throw new Error('v1 THS evidence drifted from the audited source');
  }
  return { baseline: 'v1', correction };
}

function assertOriginalPrediction(payload) {
  if (String(payload?.day || '') !== TARGET_DAY) throw new Error('prediction day mismatch');
  if (Number(payload?.schemaVersion || 0) !== 3) throw new Error('prediction schema is not v3');
  if (reviewCorrection(payload, V1_OPERATION_ID)) return assertV1Prediction(payload);
  if (payload.hasMainlines !== false || payload.recordState !== 'no-mainline') {
    throw new Error('prediction is no longer the expected no-mainline record');
  }
  if ((payload.top || []).length || (payload.candidates || []).length) {
    throw new Error('top-level prediction is no longer empty');
  }
  for (const source of ['eastmoney', 'ths']) {
    const block = payload?.bySource?.[source];
    if (!block || block.available !== true || block.hasMainlines !== false
      || (block.top || []).length || (block.candidates || []).length) {
      throw new Error(`${source} prediction block changed from the audited baseline`);
    }
  }
  return { baseline: 'original', correction: null };
}

function assertFrozenExclusion(payload) {
  if (String(payload?.day || '') !== TARGET_DAY || payload?.frozen !== true) {
    throw new Error('frozen snapshot baseline is missing');
  }
  const rows = Array.isArray(payload?.l2Gate?.excluded) ? payload.l2Gate.excluded : [];
  const electricity = rows.find(row => String(row?.familyKey || '') === TARGET_FAMILY
    || String(row?.theme || '') === TARGET_THEME);
  if (!electricity || Number(electricity.count || 0) < 3
    || String(electricity.l2ScanState || '') !== 'scanned-no-star') {
    throw new Error('audited Electricity exclusion is absent from the frozen snapshot');
  }
  return {
    count: Number(electricity.count || 0),
    boardCount: Number(electricity.boardCount || 0),
    originalState: String(electricity.l2ScanState || ''),
  };
}

function assertDayEvidence(limitDb, mainReasonDb) {
  if (String(limitDb?.day || '') !== TARGET_DAY || String(mainReasonDb?.day || '') !== TARGET_DAY) {
    throw new Error('same-day evidence file mismatch');
  }
  const savedAt = Date.parse(String(limitDb?.savedAt || ''));
  const closeAt = Date.parse(`${TARGET_DAY}T15:00:00+08:00`);
  if (!Number.isFinite(savedAt) || savedAt < closeAt) throw new Error('limit-up pool is not final');
  const limitByCode = new Map((limitDb.stocks || []).map(row => [normalizeCode(row?.code), row]));
  const reasonByCode = new Map((mainReasonDb.stocks || []).map(row => [normalizeCode(row?.code), row]));
  const actualFamilyCodes = [...new Set((mainReasonDb.stocks || [])
    .filter(row => String(row?.finalBoardTopic || '') === TARGET_THEME)
    .map(row => normalizeCode(row?.code))
    .filter(Boolean))].sort();
  const expectedFamilyCodes = REQUIRED_LIMIT_CODES.slice().sort();
  if (actualFamilyCodes.join(',') !== expectedFamilyCodes.join(',')) {
    throw new Error(`Electricity main-reason set drifted: ${actualFamilyCodes.join(',')}`);
  }
  const rows = [];
  for (const code of REQUIRED_LIMIT_CODES) {
    const limitRow = limitByCode.get(code);
    const reasonRow = reasonByCode.get(code);
    if (!limitRow || finiteNumber(limitRow.gain) == null || Number(limitRow.gain) < 9.8) {
      throw new Error(`final limit-up evidence missing for ${code}`);
    }
    if (!reasonRow || String(reasonRow.finalBoardTopic || '') !== TARGET_THEME) {
      throw new Error(`current combined main-reason is not Electricity for ${code}`);
    }
    rows.push({
      code,
      name: String(reasonRow.name || limitRow.name || code),
      gain: Number(limitRow.gain),
      firstLimitTime: String(limitRow.firstLimitTime || ''),
      detailReason: String(reasonRow.finalDetailReason || ''),
    });
  }
  return rows;
}

function collectLatestL2Jobs() {
  const dayDir = path.join(PROJECT_ROOT, 'strategy-data', 'local-l2-jobs', TARGET_DAY);
  if (!fs.existsSync(dayDir)) throw new Error('same-day L2 job directory is missing');
  const jobs = [];
  for (const entry of fs.readdirSync(dayDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const latest = path.join(dayDir, entry.name, 'latest.json');
    if (!fs.existsSync(latest)) continue;
    let payload;
    try { payload = readJson(latest); } catch { continue; }
    const job = payload?.job && typeof payload.job === 'object' ? payload.job : payload;
    const result = (job.results || []).find(row => normalizeCode(row?.code) === TARGET_STAR_CODE);
    if (!result) continue;
    jobs.push({
      job,
      result,
      persistedSavedAt: String(payload.savedAt || job.savedAt || job.updatedAt || ''),
    });
  }
  return jobs;
}

function evaluateL2Job(item, expectedZsType) {
  const { job, result } = item;
  if (Number(job?.zsType) !== expectedZsType || String(job?.day || '') !== TARGET_DAY) return null;
  if (finiteNumber(result?.gainPct) == null || Number(result.gainPct) < 9.8) return null;
  if (!(Number(result?.price || 0) > 10)) return null;
  const fifty = result?.thresholds?.['500000'];
  const maximum = result?.thresholds?.['10000000'];
  if (!fifty || !maximum) return null;
  const amountChecks = {
    activeBuy: Number(maximum.activeBuy || 0) > 150000000,
    passiveBuy: Number(maximum.passiveBuy || 0) > 200000000,
  };
  const confirmedChecks = {
    maxActive: ratio(maximum.activeBuy, maximum.activeSell) > 2,
    fiftyActive: ratio(fifty.activeBuy, fifty.activeSell) > 2,
    maxSupport: totalRatio(maximum) > 2,
  };
  const expectedChecks = {
    maxActive: ratio(maximum.activeBuy, maximum.activeSell) > 1.65,
    fiftyActive: ratio(fifty.activeBuy, fifty.activeSell) > 1.65,
    maxSupport: totalRatio(maximum) > 1.65,
  };
  const confirmedPassed = Object.values(confirmedChecks).filter(Boolean).length;
  if (!(amountChecks.activeBuy || amountChecks.passiveBuy) || confirmedPassed < 2) return null;
  return {
    jobId: String(job.jobId || ''),
    plateId: String(job.plateId || ''),
    boardName: String(job.boardName || job.name || ''),
    familyKey: String(job.familyKey || ''),
    zsType: expectedZsType,
    savedAt: item.persistedSavedAt,
    gain: Number(result.gainPct),
    ratios: {
      activeRatio: rounded(ratio(fifty.activeBuy, fifty.activeSell)),
      passiveRatio: rounded(ratio(fifty.passiveBuy, fifty.passiveSell)),
      supportRatio: rounded(totalRatio(fifty)),
    },
    maxBucket: {
      amount: 10000000,
      activeBuy: Number(maximum.activeBuy || 0),
      passiveBuy: Number(maximum.passiveBuy || 0),
      empty: false,
      dataMissing: false,
      priceMissing: false,
      ratios: {
        activeRatio: rounded(ratio(maximum.activeBuy, maximum.activeSell)),
        passiveRatio: rounded(ratio(maximum.passiveBuy, maximum.passiveSell)),
        supportRatio: rounded(totalRatio(maximum)),
      },
      amountGate: {
        passed: true,
        type: amountChecks.activeBuy && amountChecks.passiveBuy
          ? 'active-passive'
          : (amountChecks.activeBuy ? 'active' : 'passive'),
        activeBuyMin: 150000000,
        passiveBuyMin: 200000000,
        checks: amountChecks,
      },
      ratioGate: {
        threshold: 2,
        required: 2,
        passed: confirmedPassed,
        values: {
          maxActiveRatio: rounded(ratio(maximum.activeBuy, maximum.activeSell)),
          fiftyActiveRatio: rounded(ratio(fifty.activeBuy, fifty.activeSell)),
          maxSupportRatio: rounded(totalRatio(maximum)),
        },
        checks: confirmedChecks,
      },
      ratioGates: {
        expected: {
          threshold: 1.65,
          required: 2,
          passed: Object.values(expectedChecks).filter(Boolean).length,
          checks: expectedChecks,
        },
        confirmed: {
          threshold: 2,
          required: 2,
          passed: confirmedPassed,
          checks: confirmedChecks,
        },
      },
    },
  };
}

function selectL2Evidence() {
  const jobs = collectLatestL2Jobs();
  const selected = {};
  for (const [source, required] of Object.entries(REQUIRED_L2_JOBS)) {
    const item = jobs.find(candidate => String(candidate.job?.jobId || '') === required.jobId);
    if (!item) throw new Error(`required L2 job missing for ${source}: ${required.jobId}`);
    for (const [field, expected] of Object.entries({
      zsType: required.zsType,
      plateId: required.plateId,
      boardName: required.boardName,
      familyKey: required.familyKey,
    })) {
      const actual = field === 'zsType' ? Number(item.job?.[field]) : String(item.job?.[field] || '');
      if (actual !== expected) {
        throw new Error(`${source} L2 ${field} drifted: expected ${expected}, got ${actual}`);
      }
    }
    const evidence = evaluateL2Job(item, required.zsType);
    if (!evidence) throw new Error(`required L2 job no longer satisfies confirmed-star rules for ${source}`);
    for (const field of ['jobId', 'plateId', 'boardName', 'familyKey']) {
      if (String(evidence[field] || '') !== String(required[field] || '')) {
        throw new Error(`${source} evaluated L2 ${field} mismatch`);
      }
    }
    selected[source] = evidence;
  }
  return selected;
}

function dayFiles(dir, includeTarget = true) {
  return fs.readdirSync(dir)
    .filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .map(name => name.slice(0, 10))
    .filter(day => includeTarget ? day <= TARGET_DAY : day < TARGET_DAY)
    .sort()
    .slice(-10);
}

function buildLeaderEvidence(todayLimitRow) {
  const reasonDir = path.join(PROJECT_ROOT, 'kpl-limitup-main-reason-db');
  const limitDir = path.join(PROJECT_ROOT, 'kpl-limitup-db');
  const priorReasonDays = [];
  for (const day of dayFiles(reasonDir, false)) {
    const row = (readJson(path.join(reasonDir, `${day}.json`)).stocks || [])
      .find(item => normalizeCode(item?.code) === TARGET_STAR_CODE);
    if (row && String(row.finalBoardTopic || '') === TARGET_THEME) priorReasonDays.push(day);
  }
  if (!priorReasonDays.length) {
    throw new Error('qualified leader gate failed: no prior Electricity main-reason for the star');
  }
  const limitDays = [];
  for (const day of dayFiles(limitDir, true)) {
    const found = (readJson(path.join(limitDir, `${day}.json`)).stocks || [])
      .some(item => normalizeCode(item?.code) === TARGET_STAR_CODE);
    if (found) limitDays.push(day);
  }
  return {
    code: TARGET_STAR_CODE,
    name: TARGET_STAR_NAME,
    gain: finiteNumber(todayLimitRow?.gain),
    leadScore: null,
    basis: [
      `10\u65e5${limitDays.length}\u677f`,
      `\u5386\u53f2\u7535\u529b\u4e3b\u56e0${priorReasonDays.length}\u6b21`,
      '\u4eca\u65e5\u6da8\u505c',
    ],
    todayLimit: true,
    lianban: 1,
    zt10Count: limitDays.length,
    mainZt10Count: priorReasonDays.length,
    gain10: null,
    gain30: null,
    evidenceDays: priorReasonDays,
  };
}

function buildStar(evidence, confirmedAt) {
  return {
    code: TARGET_STAR_CODE,
    name: TARGET_STAR_NAME,
    gain: evidence.gain,
    level: 'confirmed',
    label: '\u660e\u661f\u786e\u8ba4',
    observedAt: evidence.savedAt,
    confirmedAt,
    confirmedBy: 'same-day-persisted-l2-evidence',
    ratios: clone(evidence.ratios),
    maxBucket: clone(evidence.maxBucket),
  };
}

function buildTop(leader) {
  return {
    key: TARGET_FAMILY,
    theme: TARGET_THEME,
    rank: 1,
    score: null,
    predictScore: null,
    stage: '\u786e\u8ba4\u671f',
    certainty: '\u9ad8\u786e\u5b9a\u6027',
    l2VerificationStatus: 'qi',
    l2ScanState: 'qi',
    leader: { code: leader.code, name: leader.name },
    leaders: [{ code: leader.code, name: leader.name, leadScore: leader.leadScore }],
    star: { code: TARGET_STAR_CODE, name: TARGET_STAR_NAME, level: 'confirmed' },
  };
}

function buildCandidate(source, leader, star, l2Evidence, limitRows, frozenBaseline) {
  const sourceEvidence = source === 'eastmoney' ? l2Evidence.eastmoney : l2Evidence.ths;
  const evidenceRows = source === 'combined'
    ? [l2Evidence.eastmoney, l2Evidence.ths]
    : [sourceEvidence];
  return {
    key: TARGET_FAMILY,
    familyKey: TARGET_FAMILY,
    theme: TARGET_THEME,
    mergedThemes: [...new Set(evidenceRows.map(row => row.boardName).filter(Boolean))],
    rank: 1,
    score: null,
    predictScore: null,
    stage: '\u786e\u8ba4\u671f',
    certainty: '\u9ad8\u786e\u5b9a\u6027',
    isNewTheme: false,
    l2VerificationStatus: 'qi',
    l2ScanState: 'qi',
    qiTier: 'formal',
    reserveReasons: [],
    lowConfidence: null,
    netInflow: null,
    boardCount: source === 'combined' ? frozenBaseline.boardCount : 1,
    limitUpCount: REQUIRED_LIMIT_CODES.length,
    bigGainCount: 0,
    nearLimitCount: 0,
    leaderBasisMode: 'historical-main-reason-gate',
    leaderNote: '',
    leaders: [clone(leader)],
    stars: [clone(star)],
    focusStocks: [],
    todayLimitCodes: REQUIRED_LIMIT_CODES.slice(),
    resonanceBoards: evidenceRows.map(row => ({
      name: row.boardName,
      plateId: row.plateId,
      zsType: row.zsType,
      ztCount: null,
      gainPct: null,
      netInflow: null,
      evidenceJobId: row.jobId,
    })),
    firstObservedAt: evidenceRows.map(row => row.savedAt).filter(Boolean).sort()[0] || '',
    lastObservedAt: evidenceRows.map(row => row.savedAt).filter(Boolean).sort().slice(-1)[0] || '',
    intradaySticky: false,
    historicalEvidenceCorrection: true,
    correctionEvidence: {
      operationId: OPERATION_ID,
      finalLimitUps: limitRows,
      l2Jobs: evidenceRows.map(row => row.jobId),
    },
  };
}

function buildBlock(original, source, leader, l2Evidence, limitRows, frozenBaseline, confirmedAt) {
  const star = buildStar(l2Evidence[source], confirmedAt);
  return {
    ...clone(original),
    top: [buildTop(leader)],
    candidates: [buildCandidate(source, leader, star, l2Evidence, limitRows, frozenBaseline)],
    starTransitions: Array.isArray(original?.starTransitions) ? clone(original.starTransitions) : [],
    available: true,
    hasMainlines: true,
    reason: '',
    message: '',
    correctionBasis: 'same-day-final-limit-up-main-reason-and-l2-evidence',
  };
}

function buildCorrectedPrediction(original, leader, l2Evidence, limitRows, frozenBaseline) {
  const starLimit = limitRows.find(row => row.code === TARGET_STAR_CODE);
  const hhmmss = String(starLimit?.firstLimitTime || '').padStart(6, '0');
  const confirmedAt = /^\d{6}$/.test(hhmmss)
    ? `${TARGET_DAY}T${hhmmss.slice(0, 2)}:${hhmmss.slice(2, 4)}:${hhmmss.slice(4, 6)}+08:00`
    : '';
  const next = clone(original);
  next.bySource.eastmoney = buildBlock(
    original.bySource.eastmoney,
    'eastmoney', leader, l2Evidence, limitRows, frozenBaseline, confirmedAt,
  );
  next.bySource.ths = buildBlock(
    original.bySource.ths,
    'ths', leader, l2Evidence, limitRows, frozenBaseline, confirmedAt,
  );
  next.top = [buildTop(leader)];
  next.candidates = [buildCandidate(
    'eastmoney', leader, buildStar(l2Evidence.eastmoney, confirmedAt),
    l2Evidence, limitRows, frozenBaseline,
  )];
  next.starTransitions = Array.isArray(original.starTransitions) ? clone(original.starTransitions) : [];
  next.hasMainlines = true;
  next.recordState = 'mainline';
  // This is an Owner-directed post-close correction, not a recovered intraday
  // prediction sample. Mark it as settled so review statistics cannot count it.
  next.sessionPhase = '\u5df2\u6536\u76d8';
  const priorCorrection = reviewCorrection(original, V1_OPERATION_ID);
  next.reviewCorrections = [
    ...(Array.isArray(original.reviewCorrections) ? original.reviewCorrections : []),
    {
      operationId: OPERATION_ID,
      day: TARGET_DAY,
      correctedAt,
      actor: ACTOR,
      operationCommit: OPERATION_COMMIT,
      operationRunId: OPERATION_RUN_ID,
      correctionType: 'post-close-evidence-reconstruction',
      manualCorrection: true,
      excludedFromPredictionStats: true,
      originalSavedAt: String(original.savedAt || ''),
      originalSessionPhase: String(priorCorrection?.originalSessionPhase || original.sessionPhase || ''),
      frozenSnapshotPreserved: true,
      sourceDatabasesChanged: false,
      theme: TARGET_THEME,
      familyKey: TARGET_FAMILY,
      limitUpCodes: REQUIRED_LIMIT_CODES,
      star: { code: TARGET_STAR_CODE, name: TARGET_STAR_NAME, level: 'confirmed' },
      l2Evidence: clone(l2Evidence),
      leader: clone(leader),
      note: 'Original frozen snapshot is retained; the prediction was reconstructed only from same-day persisted evidence.',
    },
  ];
  return next;
}

function assertCorrectedCandidate(candidate, source) {
  const required = REQUIRED_L2_JOBS[source];
  if (!candidate || String(candidate.familyKey || '') !== TARGET_FAMILY
    || String(candidate.theme || '') !== TARGET_THEME) {
    throw new Error(`${source} corrected candidate is not Electricity`);
  }
  if ((candidate.mergedThemes || []).join(',') !== required.boardName) {
    throw new Error(`${source} corrected candidate board is not the pinned source board`);
  }
  const jobs = candidate?.correctionEvidence?.l2Jobs || [];
  if (String(candidate?.correctionEvidence?.operationId || '') !== OPERATION_ID
    || jobs.length !== 1 || String(jobs[0] || '') !== required.jobId) {
    throw new Error(`${source} corrected candidate does not cite the pinned L2 job`);
  }
  const board = (candidate.resonanceBoards || [])[0];
  if ((candidate.resonanceBoards || []).length !== 1
    || String(board?.name || '') !== required.boardName
    || String(board?.plateId || '') !== required.plateId
    || Number(board?.zsType) !== required.zsType
    || String(board?.evidenceJobId || '') !== required.jobId) {
    throw new Error(`${source} corrected resonance-board evidence drifted`);
  }
  const codes = [...new Set((candidate.todayLimitCodes || []).map(normalizeCode).filter(Boolean))].sort();
  if (codes.join(',') !== REQUIRED_LIMIT_CODES.slice().sort().join(',')) {
    throw new Error(`${source} corrected limit-up set drifted`);
  }
  const star = (candidate.stars || []).find(row => normalizeCode(row?.code) === TARGET_STAR_CODE);
  if (!star || String(star.level || '') !== 'confirmed') {
    throw new Error(`${source} corrected confirmed star is missing`);
  }
}

function assertCorrectedPrediction(payload, l2Evidence) {
  if (String(payload?.day || '') !== TARGET_DAY || Number(payload?.schemaVersion || 0) !== 3
    || payload.hasMainlines !== true || payload.recordState !== 'mainline'
    || String(payload.sessionPhase || '') !== '\u5df2\u6536\u76d8') {
    throw new Error('v2 corrected prediction metadata is invalid');
  }
  const correction = reviewCorrection(payload, OPERATION_ID);
  if (!correction || correction.excludedFromPredictionStats !== true
    || correction.frozenSnapshotPreserved !== true
    || correction.sourceDatabasesChanged !== false) {
    throw new Error('v2 correction audit metadata is invalid');
  }
  for (const source of ['eastmoney', 'ths']) {
    const block = payload?.bySource?.[source];
    if (!block || block.available !== true || block.hasMainlines !== true
      || (block.top || []).length !== 1 || (block.candidates || []).length !== 1) {
      throw new Error(`${source} corrected prediction block is invalid`);
    }
    assertCorrectedCandidate(block.candidates[0], source);
    const recorded = correction?.l2Evidence?.[source];
    const required = REQUIRED_L2_JOBS[source];
    if (String(recorded?.jobId || '') !== required.jobId
      || String(recorded?.plateId || '') !== required.plateId
      || String(recorded?.boardName || '') !== required.boardName
      || String(recorded?.familyKey || '') !== required.familyKey
      || String(l2Evidence?.[source]?.jobId || '') !== required.jobId) {
      throw new Error(`${source} correction audit does not preserve the pinned L2 evidence`);
    }
  }
  if ((payload.top || []).length !== 1 || (payload.candidates || []).length !== 1) {
    throw new Error('v2 root corrected prediction is invalid');
  }
  assertCorrectedCandidate(payload.candidates[0], 'eastmoney');
}

function hasOperation(payload) {
  return (payload?.reviewCorrections || []).some(row => row?.operationId === OPERATION_ID);
}

async function verifyPublic() {
  let latestError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const visible = await requestJson(`/api/strategy-mainlines?day=${TARGET_DAY}`);
      const visibleMain = (visible?.mainlines || []).find(row =>
        String(row?.familyKey || row?.key || '') === TARGET_FAMILY
        || String(row?.theme || '') === TARGET_THEME);
      if (!visible?.ok || !visibleMain) throw new Error('public strategy page did not restore Electricity');
      const visibleStar = (visibleMain.starStocks || [])
        .find(row => normalizeCode(row?.code) === TARGET_STAR_CODE);
      if (!visibleStar || visibleStar.level !== 'confirmed') {
        throw new Error('public strategy page did not restore the confirmed star');
      }
      if (!Array.isArray(visibleMain.leaders) || !visibleMain.leaders.length
        || Number(visibleMain.count || 0) < 3) {
        throw new Error('public strategy page does not satisfy leader/limit-up requirements');
      }

      const review = await requestJson('/api/strategy-mainline-review?days=10');
      const row = (review?.days || []).find(item => item?.day === TARGET_DAY);
      if (!row || row.noMainline !== false || String(row.theme || '') !== TARGET_THEME
        || normalizeCode(row?.star?.code) !== TARGET_STAR_CODE
        || row?.star?.predictLevel !== 'confirmed') {
        throw new Error('public review did not restore Electricity and its confirmed star');
      }
      if (row.sampleValid !== false || row.sampleInvalidReason !== 'phase:\u5df2\u6536\u76d8') {
        throw new Error('post-close correction was not excluded from prediction statistics');
      }
      if (row.mainlineQualified !== true
        || Number(row?.mainlineQualification?.limitUpCount || 0) < 3) {
        throw new Error('public review formal qualification is not satisfied');
      }
      for (const source of ['eastmoney', 'ths']) {
        const sourceRow = row?.bySource?.[source];
        if (sourceRow?.status !== 'mainline' || sourceRow?.theme !== TARGET_THEME
          || sourceRow?.mainlineQualified !== true) {
          throw new Error(`${source} review source was not restored`);
        }
      }
      return { visibleMain, row };
    } catch (error) {
      latestError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw latestError;
}

function appendCloudLogs(backupDir, beforeHash, afterHash, verification, evidence) {
  const logEntry = [
    '',
    `## ${correctedAt.slice(0, 10)} - ${OPERATION_ID}`,
    `- Actor: ${ACTOR}`,
    `- Commit: ${OPERATION_COMMIT || 'not-provided'}`,
    `- Run: ${OPERATION_RUN_ID || 'not-provided'}`,
    `- Target: ${TARGET_DAY} ${TARGET_THEME}; confirmed star ${TARGET_STAR_CODE} ${TARGET_STAR_NAME}.`,
    `- Repair: replaced the v1 time-based Eastmoney Wind evidence selection with the pinned audited Green Electricity job.`,
    `- Formal evidence: ${REQUIRED_LIMIT_CODES.length} same-family final limit-ups, exact two-source confirmed L2 jobs, and qualified leader.`,
    `- L2 jobs: eastmoney=${evidence.eastmoney.jobId}, ths=${evidence.ths.jobId}.`,
    '- Runtime change: persisted prediction record only.',
    '- Frozen strategy snapshot, main-reason database, source artifacts, final limit-up pool, L2 jobs, code, and service state were not changed.',
    `- Backup: ${backupDir}`,
    `- Prediction SHA-256: ${beforeHash} -> ${afterHash}`,
    `- Verification: reviewQualified=${verification.row?.mainlineQualified}, limitUpCount=${verification.row?.mainlineQualification?.limitUpCount}, predictionStatsExcluded=${verification.row?.sampleValid === false}.`,
    '- Service restart: none',
    '',
  ].join('\r\n');
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    fs.appendFileSync(path.join(PROJECT_ROOT, name), logEntry, 'utf8');
  }
}

async function main() {
  if (!PROJECT_ROOT) throw new Error('project root is required');
  assertCloudLogs();
  const predictionPath = path.join(PROJECT_ROOT, 'strategy-data', `mainline-predict-${TARGET_DAY}.json`);
  const frozenPath = path.join(PROJECT_ROOT, 'strategy-data', `strategy-mainline-snapshot-${TARGET_DAY}.json`);
  const limitPath = path.join(PROJECT_ROOT, 'kpl-limitup-db', `${TARGET_DAY}.json`);
  const mainReasonPath = path.join(PROJECT_ROOT, 'kpl-limitup-main-reason-db', `${TARGET_DAY}.json`);
  for (const file of [predictionPath, frozenPath, limitPath, mainReasonPath]) {
    if (!fs.existsSync(file)) throw new Error(`required evidence file missing: ${path.basename(file)}`);
  }

  const original = readJson(predictionPath);
  if (hasOperation(original)) {
    const l2Evidence = selectL2Evidence();
    assertCorrectedPrediction(original, l2Evidence);
    const verification = await verifyPublic();
    console.log(JSON.stringify({
      ok: true,
      noOp: true,
      operationId: OPERATION_ID,
      day: TARGET_DAY,
      theme: verification.row.theme,
    }));
    return;
  }

  const originalState = assertOriginalPrediction(original);
  const frozenBaseline = assertFrozenExclusion(readJson(frozenPath));
  const limitRows = assertDayEvidence(readJson(limitPath), readJson(mainReasonPath));
  const l2Evidence = selectL2Evidence();
  const leader = buildLeaderEvidence(limitRows.find(row => row.code === TARGET_STAR_CODE));
  const corrected = buildCorrectedPrediction(
    original, leader, l2Evidence, limitRows, frozenBaseline,
  );
  assertCorrectedPrediction(corrected, l2Evidence);

  const stamp = correctedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(PROJECT_ROOT, '_deploy-backups', `${OPERATION_ID}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, path.basename(predictionPath));
  fs.copyFileSync(predictionPath, backup);
  const beforeHash = sha256(predictionPath);

  try {
    atomicWriteJson(predictionPath, corrected);
    assertCorrectedPrediction(readJson(predictionPath), l2Evidence);
    const verification = await verifyPublic();
    const afterHash = sha256(predictionPath);
    appendCloudLogs(backupDir, beforeHash, afterHash, verification, l2Evidence);
    console.log(JSON.stringify({
      ok: true,
      operationId: OPERATION_ID,
      upgradedFrom: originalState.baseline,
      day: TARGET_DAY,
      theme: TARGET_THEME,
      star: { code: TARGET_STAR_CODE, name: TARGET_STAR_NAME, level: 'confirmed' },
      leader,
      limitUpCodes: REQUIRED_LIMIT_CODES,
      mainlineQualification: verification.row.mainlineQualification,
      l2Evidence,
      beforeHash,
      afterHash,
      backupDir,
      frozenSnapshotChanged: false,
      sourceDatabasesChanged: false,
      serviceRestarted: false,
    }));
  } catch (error) {
    atomicWriteJson(predictionPath, readJson(backup));
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
