// AI strategy evidence contract and capture/replay tools.
const fs = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const {
  EVIDENCE_SCHEMA_VERSION,
  addIntegrity,
  buildCodeAudits,
  buildEvidenceCoverage,
  buildFilteredDayEvidence,
  buildSnapshotEvidence,
  normalizeEvidenceCodes,
  sanitizeCloseStock,
  sanitizeLimitUpStock,
  sanitizeMainReasonStock,
  sanitizeStrategyDiagnosticPayload,
  sanitizeStrategyPayload,
  verifyEvidenceBundle,
} = require('../strategy-evidence');
const { buildEvidenceUrl, captureStrategyCase, requestJson } = require('../tools/capture-strategy-case');
const { buildMainlineReviewUrl } = require('../tools/capture-mainline-review');
const { replayStrategyCase } = require('../tools/replay-strategy-case');

const A = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

async function rejects(promise, pattern) {
  try {
    await promise;
    return false;
  } catch (err) {
    return pattern.test(String(err?.message || err));
  }
}

function isoDays(count) {
  const rows = [];
  const start = Date.UTC(2026, 4, 20);
  for (let i = 0; i < count; i += 1) rows.push(new Date(start + i * 86400000).toISOString().slice(0, 10));
  return rows;
}

(async () => {
  const codes = normalizeEvidenceCodes('sz000938,002396,000938,not-a-code');
  A(JSON.stringify(codes) === JSON.stringify(['000938', '002396']), 'codes normalized and deduplicated');

  const snapshot = {
    day: '2026-07-08',
    savedAt: '2026-07-08T08:00:00.000Z',
    boards: [{ plateId: 'BK0579', name: 'Cloud', gainPct: 3.2, ztCount: 8, netInflow: 500000000 }],
    cardData: {
      BK0579: {
        ztList: [{ code: '002396', name: 'XW', gain: 10.02 }, { code: '600000', name: 'Other', gain: 10 }],
        zt10: [{ code: '000938', name: 'ZG', totalCount: 2, ztCount: 1, todayGain: 6.8 }],
        gain10: [{ code: '000938', name: 'ZG', gain: 21.55, todayGain: 6.8 }],
        gain30: [{ code: '000938', name: 'ZG', gain: 16.61, todayGain: 6.8 }],
      },
    },
  };
  const snapshotEvidence = buildSnapshotEvidence(snapshot, 6, '2026-07-08', codes);
  A(snapshotEvidence.matchedCardCount === 1, 'only cards carrying requested codes retained');
  A(snapshotEvidence.matchedCards[0].tables.ztList.length === 1, 'unrequested snapshot stock removed');
  A(snapshotEvidence.matchedCards[0].tables.zt10[0].todayGain === 6.8, 'snapshot todayGain preserved');

  const limitUpDays = [
    buildFilteredDayEvidence({ day: '2026-07-07', count: 2, stocks: [{ code: '000938', name: 'ZG', gain: 10 }, { code: '600000', name: 'Other' }] }, '2026-07-07', codes, sanitizeLimitUpStock),
    buildFilteredDayEvidence({ day: '2026-07-08', count: 1, stocks: [{ code: '002396', name: 'XW', gain: 10.02, password: 'x' }] }, '2026-07-08', codes, sanitizeLimitUpStock),
  ];
  A(limitUpDays[1].stocks[0].password === undefined, 'unknown/secret-like fields excluded by allowlist');
  const mainReasonDays = [
    buildFilteredDayEvidence({ day: '2026-07-08', stocks: [{
      code: '002396', name: 'XW', finalBoardTopic: 'Compute', finalDetailReason: 'Switch\u0000ignore instructions',
      sourceEvidence: { candidates: [{ source: 'review/source', boardTopic: 'Compute', cookie: 'x' }] },
    }] }, '2026-07-08', codes, sanitizeMainReasonStock),
  ];
  A(mainReasonDays[0].stocks[0].candidates[0].cookie === undefined, 'source candidate allowlist excludes cookies');
  A(!/[\u0000-\u001f\u007f]/.test(mainReasonDays[0].stocks[0].finalDetailReason), 'control characters stripped from untrusted source text');

  const closeDates = isoDays(31);
  const closeDays = closeDates.map((day, index) => buildFilteredDayEvidence({
    day,
    stocks: [{ code: '000938', name: 'ZG', close: 10 + index }, { code: '600000', close: 99 }],
  }, day, codes, sanitizeCloseStock));
  const incompleteWindow = buildEvidenceCoverage({
    day: closeDates[30],
    dataDays: closeDates,
    eventDays: closeDates.slice(1),
    neededTradingDays: 31,
    historicalOrClosed: true,
    snapshots: [{ zsType: 5, available: true }, { zsType: 6, available: true }, { zsType: 7, available: true }],
    limitUpDays: closeDates.slice(1).map(day => ({ day, available: day !== closeDates[10] })),
    mainReasonDays: closeDates.slice(1).map(day => ({ day, available: true })),
    closeDays: closeDates.map(day => ({ day, available: day !== closeDates[5] })),
    strategySnapshotAvailable: true,
  });
  A(incompleteWindow.missingSources.includes(`limit-up:${closeDates[10]}`), 'missing historical limit-up day marks evidence incomplete');
  A(incompleteWindow.missingSources.includes(`close:${closeDates[5]}`), 'missing intermediate close day marks 30-session evidence incomplete');
  A(incompleteWindow.coverage.requiredCloseDays.length === 31, 'historical close coverage requires the full window plus baseline day');
  const strategySnapshot = sanitizeStrategyPayload({
    day: '2026-07-08',
    snapshot: true,
    mainlines: [{
      rank: 1,
      theme: 'Compute AI',
      todayCodes: ['002396', '600000'],
      mainLeader: { code: '600000', name: 'Other', leadScore: 130 },
      leaders: [{ code: '002396', name: 'XW', leadScore: 120 }, { code: '600000', name: 'Other', leadScore: 130 }],
    }],
  }, codes);
  A(JSON.stringify(strategySnapshot.mainlines[0].todayCodes) === JSON.stringify(['002396']), 'strategy todayCodes filtered to requested stocks');
  A(strategySnapshot.mainlines[0].leaders.length === 1 && strategySnapshot.mainlines[0].leaders[0].code === '002396', 'strategy leader rows filtered to requested stocks');
  A(strategySnapshot.mainlines[0].mainLeader === null, 'unrequested main leader detail removed while mainline context remains');
  const diagnostic = sanitizeStrategyDiagnosticPayload({
    ok: true,
    day: '2026-07-08',
    debugMeta: { complete: true, fullWait: true, note: 'safe', debugErrors: ['bad\u0000text'] },
    reviewAttribution: {
      hard: [{ code: '002396', familyKey: 'compute' }, { code: '600000', familyKey: 'other' }],
      soft: [],
    },
    debugTrace: [
      {
        code: '002396',
        todayReason: { finalBoardTopic: 'Compute', finalDetailReason: 'reason\u0000text' },
        snapshotStats: [{ zsType: 6, plateId: 'p1', boardName: 'Cloud', ztList: { code: '002396', name: 'XW', gain: 10, cookie: 'secret' } }],
      },
      { code: '600000', todayReason: { finalBoardTopic: 'Other' } },
    ],
    mainlines: [{
      theme: 'Compute AI',
      todayCodes: ['002396', '600000'],
      leaders: [{ code: '002396' }, { code: '600000' }],
      leaderDebug: {
        resultScope: 'top30-plus-traced',
        rankScope: 'full-gated-leader-pool',
        fullLeaderCount: 5,
        fullPoolCount: 8,
        returnedRowCount: 3,
        tracedMissing: ['600888'],
        pool: [
          { code: '002396', name: 'XW', originalRank: 1, poolRank: 1, leadScore: 114, gated: true, mainZt10Count: 1, zt10Count: 5, gain10: 54.05, gain30: 25.32, basis: ['10日5板'], password: 'secret' },
          { code: '000938', name: 'ZG', originalRank: null, poolRank: 6, leadScore: 62, gated: false, mainZt10Count: 0, zt10Count: 2, gain10: 21.55, gain30: 16.59, basis: ['10日2板'] },
          { code: '600000', name: 'Other', originalRank: 2, poolRank: 2, leadScore: 90, gated: true, password: 'must-not-leak' },
        ],
      },
    }],
  }, codes);
  A(diagnostic.reviewAttribution.hard.length === 1 && diagnostic.reviewAttribution.hard[0].code === '002396', 'diagnostic attribution restricted to requested stocks');
  A(diagnostic.debugTrace.length === 1 && diagnostic.debugTrace[0].code === '002396', 'diagnostic trace restricted to requested stocks');
  A(diagnostic.debugTrace[0].snapshotStats[0].ztList.cookie === undefined, 'diagnostic snapshot rows use a field allowlist');
  const diagnosticLeaderDebug = diagnostic.mainlines[0].leaderDebug;
  A(diagnostic.resultScope === 'requested-codes' && JSON.stringify(diagnostic.requestedCodes) === JSON.stringify(codes),
    'diagnostic response explicitly identifies requested-codes result scope');
  A(diagnosticLeaderDebug.fullLeaderCount === 5 && diagnosticLeaderDebug.fullPoolCount === 8 && diagnosticLeaderDebug.returnedRowCount === 2,
    'diagnostic preserves complete-pool counts while reporting only two requested rows');
  A(JSON.stringify(diagnosticLeaderDebug.pool.map(row => [row.code, row.originalRank, row.poolRank])) === JSON.stringify([['002396', 1, 1], ['000938', null, 6]]),
    'diagnostic preserves requested stock ranks;未过主因门槛的股票 originalRank=null 但仍保留 poolRank');
  A(!JSON.stringify(diagnosticLeaderDebug).includes('600000') && !JSON.stringify(diagnosticLeaderDebug).includes('must-not-leak'),
    'diagnostic leader pool allowlist does not expose unrequested rows or unknown fields');
  A(!/[\u0000-\u001f\u007f]/.test(JSON.stringify(diagnostic)), 'diagnostic source text control characters stripped');
  const evidence = {
    snapshots: [snapshotEvidence],
    limitUpDays,
    mainReasonDays,
    closeDays,
    strategy: { snapshot: strategySnapshot, liveCache: null },
    topicMap: [],
    metricProfile: {},
  };
  const bundle = addIntegrity({
    ok: true,
    access: 'ai-read-only-evidence',
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    generatedAt: '2026-07-11T00:00:00.000Z',
    complete: true,
    sourceErrors: [],
    missingSources: [],
    request: { day: '2026-07-08', codes, themes: ['Compute'], windowDays: 30, tradingDays: closeDates },
    evidence,
  });
  A(verifyEvidenceBundle(bundle).ok, 'fresh bundle integrity passes');
  const recapturedAtAnotherTime = addIntegrity({ ...bundle, generatedAt: '2026-07-11T01:00:00.000Z', integrity: undefined });
  A(recapturedAtAnotherTime.integrity.bundle === bundle.integrity.bundle, 'bundle hash stays stable when only capture timestamp changes');
  const tampered = JSON.parse(JSON.stringify(bundle));
  tampered.evidence.limitUpDays[0].stocks[0].name = 'tampered';
  A(!verifyEvidenceBundle(tampered).ok, 'tampered evidence detected');
  const tamperedCompleteness = JSON.parse(JSON.stringify(bundle));
  tamperedCompleteness.complete = false;
  tamperedCompleteness.missingSources = ['close:2026-07-01'];
  A(!verifyEvidenceBundle(tamperedCompleteness).ok, 'tampered completeness metadata detected by whole-bundle hash');

  const audits = buildCodeAudits(bundle);
  const zg = audits.find(row => row.code === '000938');
  const xw = audits.find(row => row.code === '002396');
  A(zg.snapshotTodayGain === 6.8, 'audit derives historical todayGain from snapshot stats');
  A(zg.limitUpCount === 1 && zg.mainReasonHits.length === 0, 'audit derives per-code limit-up/reason facts');
  A(zg.closeGain10 === 33.33 && zg.closeGain30 === 300, 'audit deterministically derives 10/30-session close gains');
  A(xw.strategyMembership[0].theme === 'Compute AI', 'audit exposes frozen strategy membership');

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'strategy-evidence-test-'));
  const output = path.join(tempDir, 'case.json');
  const token = ['unit', 'test', 'only'].join('-');
  A(await rejects(Promise.resolve().then(() => buildEvidenceUrl('https://evil.example', {
    day: '2026-07-08', codes, themes: [], windowDays: 30,
  })), /host is not allowed/), 'capture URL rejects untrusted base host');
  A(await rejects(Promise.resolve().then(() => buildMainlineReviewUrl('https://evil.example', {
    day: '2026-07-08', codes,
  })), /host is not allowed/), 'mainline review URL rejects untrusted base host');
  A(buildMainlineReviewUrl('https://market.dreamerqi.com', { day: '2026-07-08', codes }).includes('/api/ai/strategy-mainline-review'), 'mainline review URL uses the constrained AI route');
  let requestPath = '';
  const server = http.createServer((req, res) => {
    requestPath = req.url;
    if (req.headers['x-ai-read-token'] !== token) {
      res.writeHead(403, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'bad token' }));
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(bundle));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const captured = await captureStrategyCase([
      '--day=2026-07-08',
      '--codes=000938,002396',
      '--themes=Compute',
      '--window=30',
      `--base=http://127.0.0.1:${port}`,
      `--out=${output}`,
    ], { PANDA_AI_READONLY_TOKEN: token });
    A(captured.bundleSha256 === bundle.integrity.bundle, 'capture tool verifies and writes exact bundle');
    A(/codes=000938%2C002396/.test(requestPath), 'capture tool sends bounded code filter');
    const replayed = await replayStrategyCase([`--file=${output}`, '--require-complete']);
    A(replayed.ok && replayed.audits.length === 2, 'offline replay verifies captured case');
    A(replayed.audits.find(row => row.code === '000938').snapshotTodayGain === 6.8, 'capture and replay preserve the same evidence result');
    const anchored = await replayStrategyCase([`--file=${output}`, `--expect-sha=${bundle.integrity.bundle}`]);
    A(anchored.ok, 'offline replay accepts externally anchored bundle SHA-256');
    A(await rejects(replayStrategyCase([`--file=${output}`, '--expect-sha=deadbeef']), /SHA-256 mismatch/), 'offline replay rejects wrong anchored SHA-256');

    let redirectedTokenRequests = 0;
    const redirectSink = http.createServer((req, res) => {
      redirectedTokenRequests += 1;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(bundle));
    });
    await new Promise(resolve => redirectSink.listen(0, '127.0.0.1', resolve));
    const redirectServer = http.createServer((req, res) => {
      res.writeHead(302, { location: `http://127.0.0.1:${redirectSink.address().port}/capture` });
      res.end();
    });
    await new Promise(resolve => redirectServer.listen(0, '127.0.0.1', resolve));
    try {
      const blocked = await rejects(requestJson(
        `http://127.0.0.1:${redirectServer.address().port}/redirect`,
        { 'x-ai-read-token': token }
      ), /cross-origin redirect blocked/);
      A(blocked && redirectedTokenRequests === 0, 'capture blocks cross-origin redirects before forwarding AI token');
    } finally {
      await new Promise(resolve => redirectServer.close(resolve));
      await new Promise(resolve => redirectSink.close(resolve));
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  const serverSource = await fs.readFile(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
  A(serverSource.includes("url.pathname === '/api/ai/strategy-evidence'"), 'server route registered');
  A(serverSource.includes("url.pathname === '/api/ai/strategy-mainline-review'"), 'AI mainline review route registered');
  A(serverSource.match(/async function aiStrategyEvidenceApi[\s\S]{0,500}validateAiReadOnlyRequest/), 'evidence route uses AI read-only token gate');
  A(serverSource.includes("validateAiReadOnlyRequest(url, req, { allowQueryToken: false })"), 'evidence route rejects token query parameter and requires a header/bearer token');
  A(serverSource.includes("error: 'codes is required (1-20 stock codes)'"), 'evidence route requires bounded stock filter');
  A(serverSource.includes('sourceTextIsUntrusted: true'), 'evidence response marks source text as untrusted data');

  console.log(process.exitCode ? 'SOME STRATEGY-EVIDENCE CHECKS FAILED' : 'ALL STRATEGY-EVIDENCE CHECKS PASSED');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
