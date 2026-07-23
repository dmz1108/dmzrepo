'use strict';

// One-time production correction for the 2026-07-23 review record.
//
// PR #231 changed the star rule after the final intraday prediction had already
// been frozen. The original prediction file therefore records no mainline even
// though the same persisted L2 evidence qualifies China XD under the new rule.
//
// This script:
// - reruns the current read-only admin diagnosis for the target day;
// - requires Electric Grid + confirmed China XD and the exact amount/ratio gates;
// - backs up and atomically replaces only the persisted prediction record;
// - does not touch the frozen snapshot, L2 jobs, source databases, or code;
// - verifies the public review response and rolls back on failure;
// - appends both production operation logs.

const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = 'C:\\PandaDashboard';
const TARGET_DAY = '2026-07-23';
const TARGET_THEME = '\u7535\u7f51\u8bbe\u5907';
const TARGET_CODE = '601179';
const TARGET_NAME = '\u4e2d\u56fd\u897f\u7535';
const OPERATION_ID = 'review-grid-star-backfill-20260723';
const RULE_COMMIT = '6355887fbbeda7615714ec59ba37a7c00a8968cb';
const ACTOR = process.env.DREAMERQI_OPS_ACTOR || 'Codex-home';
const OPERATION_COMMIT = process.env.DREAMERQI_OPS_COMMIT || '';
const correctedAt = new Date().toISOString();

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function clone(value) {
  return value == null ? null : JSON.parse(JSON.stringify(value));
}

function normalizeCode(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(-6);
  return digits ? digits.padStart(6, '0') : '';
}

function finiteNumber(value) {
  return value !== null && value !== undefined && value !== ''
    && Number.isFinite(Number(value))
    ? Number(value)
    : null;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function atomicWrite(file, text) {
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

function validAdminToken() {
  const file = path.join(PROJECT_ROOT, 'panda-auth-sessions.json');
  const payload = readJson(file);
  const rows = Array.isArray(payload?.sessions)
    ? payload.sessions
    : Array.isArray(payload)
      ? payload
      : Object.values(payload || {});
  const now = Date.now();
  const session = rows
    .filter(row => row && row.role === 'admin'
      && String(row.token || '').length >= 16
      && Number(row.expiresAtMs || 0) > now)
    .sort((a, b) => Number(b.expiresAtMs || 0) - Number(a.expiresAtMs || 0))[0];
  if (!session) throw new Error('no valid admin session is available for read-only diagnosis');
  return String(session.token);
}

function requestJson(requestPath, token = '') {
  return new Promise((resolve, reject) => {
    const request = http.get({
      host: '127.0.0.1',
      port: 8765,
      path: requestPath,
      headers: token ? { 'X-Admin-Token': token } : {},
      timeout: 120000,
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${body.slice(0, 160)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`invalid JSON response: ${error.message}`));
        }
      });
    });
    request.on('timeout', () => request.destroy(new Error('HTTP request timed out')));
    request.on('error', reject);
  });
}

function conciseStock(stock) {
  return stock ? {
    code: normalizeCode(stock.code),
    name: String(stock.name || ''),
    gain: finiteNumber(stock.gain),
  } : null;
}

function buildTop(mainline, star) {
  const leaders = (Array.isArray(mainline.leaders) && mainline.leaders.length
    ? mainline.leaders
    : (mainline.mainLeader ? [mainline.mainLeader] : []))
    .slice(0, 2)
    .map(stock => ({
      code: normalizeCode(stock.code),
      name: String(stock.name || ''),
      leadScore: finiteNumber(stock.leadScore),
    }));
  return {
    key: String(mainline.familyKey || mainline.key || ''),
    theme: String(mainline.theme || ''),
    rank: Number(mainline.rank || 0),
    score: finiteNumber(mainline.score),
    predictScore: finiteNumber(mainline.predictScore),
    stage: String(mainline.stage?.label || ''),
    certainty: String(mainline.certainty?.label || ''),
    l2VerificationStatus: 'qi',
    l2ScanState: 'qi',
    leader: leaders[0] ? { code: leaders[0].code, name: leaders[0].name } : null,
    leaders,
    star: {
      code: TARGET_CODE,
      name: TARGET_NAME,
      level: 'confirmed',
    },
  };
}

function buildCandidate(mainline, star) {
  const stock = conciseStock;
  return {
    key: String(mainline.familyKey || mainline.key || ''),
    familyKey: String(mainline.familyKey || ''),
    theme: String(mainline.theme || ''),
    mergedThemes: Array.isArray(mainline.mergedThemes) ? mainline.mergedThemes.slice(0, 8) : [],
    rank: Number(mainline.rank || 0),
    score: finiteNumber(mainline.score),
    predictScore: finiteNumber(mainline.predictScore),
    stage: String(mainline.stage?.label || ''),
    certainty: String(mainline.certainty?.label || ''),
    isNewTheme: !!mainline.isNewTheme,
    l2VerificationStatus: 'qi',
    l2ScanState: 'qi',
    qiTier: 'formal',
    reserveReasons: [],
    lowConfidence: null,
    netInflow: finiteNumber(mainline.netInflow),
    boardCount: Number(mainline.boardCount || 0),
    limitUpCount: Number(mainline.count || 0),
    bigGainCount: Number(mainline.bigGainCount || 0),
    nearLimitCount: Number(mainline.nearLimitCount || 0),
    leaderBasisMode: String(mainline.leaderBasisMode || ''),
    leaderNote: String(mainline.leaderNote || ''),
    leaders: (Array.isArray(mainline.leaders) ? mainline.leaders : [])
      .slice(0, 3)
      .map(row => ({
        ...stock(row),
        leadScore: finiteNumber(row.leadScore),
        basis: Array.isArray(row.basis) ? row.basis.slice(0, 6) : [],
        todayLimit: !!row.todayLimit,
        lianban: Number(row.lianban || 0),
        zt10Count: Number(row.zt10Count || 0),
        mainZt10Count: Number(row.mainZt10Count || 0),
        gain10: finiteNumber(row.gain10),
        gain30: finiteNumber(row.gain30),
      })),
    stars: [{
      ...stock(star),
      level: 'confirmed',
      label: '\u660e\u661f\u786e\u8ba4',
    }],
    focusStocks: (Array.isArray(mainline.focusStocks) ? mainline.focusStocks : [])
      .slice(0, 6)
      .map(row => ({
        ...stock(row),
        basis: Array.isArray(row.basis) ? row.basis.slice(0, 4) : [],
      })),
    todayLimitCodes: (Array.isArray(mainline.todayCodes) ? mainline.todayCodes : [])
      .map(normalizeCode)
      .filter(Boolean)
      .slice(0, 16),
    reviewCorrection: {
      operationId: OPERATION_ID,
      correctedAt,
      basis: 'same-day-l2-evidence-replayed-under-pr231-rule',
    },
  };
}

function assertDiagnosis(diagnostic) {
  if (!diagnostic?.ok || !diagnostic?.live?.ok) throw new Error('read-only diagnosis did not complete');
  if (diagnostic.live?.debugMeta?.complete !== true) throw new Error('read-only diagnosis is incomplete');
  const mainline = (diagnostic.live.mainlines || [])
    .find(row => String(row?.theme || '') === TARGET_THEME);
  if (!mainline) throw new Error('Electric Grid mainline is absent from current-rule diagnosis');
  if (mainline.l2VerificationStatus !== 'qi' || mainline.l2ScanState !== 'qi') {
    throw new Error('Electric Grid is not QI-qualified in current-rule diagnosis');
  }
  if (!mainline.mainLeader?.code) throw new Error('Electric Grid has no qualified leader');
  const star = (mainline.starStocks || [])
    .find(row => normalizeCode(row?.code) === TARGET_CODE);
  if (!star || star.level !== 'confirmed') throw new Error('China XD is not a confirmed star');
  const amountGate = star?.maxBucket?.amountGate;
  const confirmedGate = star?.maxBucket?.ratioGates?.confirmed;
  if (!amountGate?.passed || amountGate?.checks?.passiveBuy !== true) {
    throw new Error('China XD did not pass the passive-buy amount gate');
  }
  if (Number(confirmedGate?.passed || 0) < 2 || Number(confirmedGate?.threshold || 0) !== 2) {
    throw new Error('China XD did not pass at least two confirmed ratio checks');
  }
  const sourceTypes = new Set((mainline.resonanceBoards || []).map(row => Number(row?.zsType)));
  if (!sourceTypes.has(5) || !sourceTypes.has(6)) {
    throw new Error('Electric Grid lacks both THS and Eastmoney board evidence');
  }
  return { mainline, star };
}

function correctionAlreadyApplied(payload) {
  return (payload.reviewCorrections || [])
    .some(row => row?.operationId === OPERATION_ID && row?.day === TARGET_DAY);
}

function buildCorrectedPrediction(original, mainline, star, diagnostic) {
  if (String(original?.day || '') !== TARGET_DAY) throw new Error('prediction day mismatch');
  if (Number(original?.schemaVersion || 0) !== 3) throw new Error('prediction schema is not v3');
  if (original.hasMainlines !== false || original.recordState !== 'no-mainline') {
    throw new Error('prediction is no longer the expected no-mainline record');
  }
  if ((original.top || []).length || (original.candidates || []).length) {
    throw new Error('top-level prediction is no longer empty');
  }
  for (const source of ['eastmoney', 'ths']) {
    const block = original?.bySource?.[source];
    if (!block || block.available !== true || block.hasMainlines !== false) {
      throw new Error(`${source} source block is not the expected resolved no-mainline record`);
    }
    if ((block.top || []).length || (block.candidates || []).length) {
      throw new Error(`${source} source block is no longer empty`);
    }
  }

  const next = clone(original);
  const top = buildTop(mainline, star);
  const candidate = buildCandidate(mainline, star);
  for (const source of ['eastmoney', 'ths']) {
    const block = next.bySource[source];
    block.top = [clone(top)];
    block.candidates = [clone(candidate)];
    block.starTransitions = Array.isArray(block.starTransitions) ? block.starTransitions : [];
    block.available = true;
    block.hasMainlines = true;
    block.reason = '';
    block.message = '';
    block.correctionBasis = 'same-day-l2-evidence-replayed-under-pr231-rule';
  }
  next.top = clone(next.bySource.eastmoney.top);
  next.candidates = clone(next.bySource.eastmoney.candidates);
  next.starTransitions = clone(next.bySource.eastmoney.starTransitions);
  next.hasMainlines = true;
  next.recordState = 'mainline';
  next.reviewCorrections = [
    ...(Array.isArray(next.reviewCorrections) ? next.reviewCorrections : []),
    {
      operationId: OPERATION_ID,
      day: TARGET_DAY,
      correctedAt,
      actor: ACTOR,
      operationCommit: OPERATION_COMMIT,
      ruleCommit: RULE_COMMIT,
      correctionType: 'post-close-rule-replay',
      originalSavedAt: String(original.savedAt || ''),
      theme: TARGET_THEME,
      star: {
        code: TARGET_CODE,
        name: TARGET_NAME,
        level: 'confirmed',
        maxBucket: Number(star?.maxBucket?.amount || 0),
        maxActiveBuy: Number(star?.maxBucket?.activeBuy || 0),
        maxPassiveBuy: Number(star?.maxBucket?.passiveBuy || 0),
        amountGateType: String(star?.maxBucket?.amountGate?.type || ''),
        confirmedRatioChecksPassed: Number(star?.maxBucket?.ratioGates?.confirmed?.passed || 0),
      },
      leader: {
        code: normalizeCode(mainline.mainLeader?.code),
        name: String(mainline.mainLeader?.name || ''),
      },
      diagnosticGeneratedAt: String(diagnostic?.live?.generatedAt || ''),
      note: 'Retrospective replay of the same-day L2 evidence under PR #231; original savedAt and sessionPhase retained.',
    },
  ];
  return next;
}

function appendCloudLogs(backupDir, beforeHash, afterHash, verification) {
  const lines = [
    '',
    `## ${correctedAt.slice(0, 10)} - ${OPERATION_ID}`,
    `- Actor: ${ACTOR}`,
    `- Operation commit: ${OPERATION_COMMIT || 'not-provided'}`,
    `- Rule commit: ${RULE_COMMIT}`,
    `- Target day: ${TARGET_DAY}`,
    `- Runtime change: prediction review record now contains ${TARGET_THEME} with confirmed star ${TARGET_CODE} ${TARGET_NAME}.`,
    '- Evidence: same-day persisted L2 data replayed under PR #231; passive-buy amount gate passed and 2/3 confirmed ratio checks passed.',
    '- Scope: prediction record only; frozen snapshot, L2 jobs, source databases, scoring code, and services unchanged.',
    `- Backup: ${backupDir}`,
    `- SHA-256: ${beforeHash} -> ${afterHash}`,
    `- Verification: theme=${verification.theme}, star=${verification.star?.code || ''}, level=${verification.star?.predictLevel || ''}.`,
    '- Service restart: none',
    '',
  ].join('\r\n');
  for (const name of ['panda-cloud-ops-2026-06-19.md', '_cloud-change-log-20260705.md']) {
    const file = path.join(PROJECT_ROOT, name);
    if (fs.existsSync(file)) fs.appendFileSync(file, lines, 'utf8');
  }
}

async function main() {
  const target = path.join(PROJECT_ROOT, 'strategy-data', `mainline-predict-${TARGET_DAY}.json`);
  if (!fs.existsSync(target)) throw new Error('target prediction file is missing');
  const original = readJson(target);
  if (correctionAlreadyApplied(original)) {
    console.log(JSON.stringify({ ok: true, noOp: true, operationId: OPERATION_ID, day: TARGET_DAY }));
    return;
  }

  const token = validAdminToken();
  const diagnostic = await requestJson(
    `/api/strategy-mainline-leader-debug?day=${TARGET_DAY}&review=1&codes=${TARGET_CODE}`,
    token
  );
  const { mainline, star } = assertDiagnosis(diagnostic);
  const corrected = buildCorrectedPrediction(original, mainline, star, diagnostic);

  const beforeHash = sha256(target);
  const stamp = correctedAt.replace(/[-:TZ.]/g, '').slice(0, 14);
  const backupDir = path.join(PROJECT_ROOT, '_deploy-backups', `${OPERATION_ID}-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, path.basename(target));
  fs.copyFileSync(target, backup);

  try {
    atomicWrite(target, `${JSON.stringify(corrected, null, 2)}\n`);
    const review = await requestJson('/api/strategy-mainline-review?days=10');
    const row = (review?.days || []).find(item => item?.day === TARGET_DAY);
    if (!row || row.noMainline !== false || row.theme !== TARGET_THEME
      || normalizeCode(row?.star?.code) !== TARGET_CODE
      || row?.star?.predictLevel !== 'confirmed') {
      throw new Error(`public review verification failed: ${JSON.stringify({
        day: row?.day,
        noMainline: row?.noMainline,
        theme: row?.theme,
        star: row?.star?.code,
        level: row?.star?.predictLevel,
      })}`);
    }
    const sourceStates = ['eastmoney', 'ths'].map(source => ({
      source,
      status: row?.bySource?.[source]?.status,
      theme: row?.bySource?.[source]?.theme,
    }));
    if (sourceStates.some(item => item.status !== 'mainline' || item.theme !== TARGET_THEME)) {
      throw new Error(`source review verification failed: ${JSON.stringify(sourceStates)}`);
    }
    const afterHash = sha256(target);
    appendCloudLogs(backupDir, beforeHash, afterHash, row);
    console.log(JSON.stringify({
      ok: true,
      operationId: OPERATION_ID,
      day: TARGET_DAY,
      theme: row.theme,
      star: {
        code: row.star.code,
        name: row.star.name,
        level: row.star.predictLevel,
      },
      leader: row.leader,
      bySource: sourceStates,
      beforeHash,
      afterHash,
      backupDir,
      serviceRestart: false,
    }));
  } catch (error) {
    fs.copyFileSync(backup, target);
    throw error;
  }
}

main().catch(error => {
  console.error(String(error?.stack || error));
  process.exitCode = 1;
});
