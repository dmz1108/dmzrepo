// AI strategy evidence contract and capture/replay tools.
const fs = require('fs/promises');
const http = require('http');
const os = require('os');
const path = require('path');
const {
  EVIDENCE_SCHEMA_VERSION,
  addIntegrity,
  buildCodeAudits,
  buildFilteredDayEvidence,
  buildSnapshotEvidence,
  normalizeEvidenceCodes,
  sanitizeCloseStock,
  sanitizeLimitUpStock,
  sanitizeMainReasonStock,
  sanitizeStrategyPayload,
  verifyEvidenceBundle,
} = require('../strategy-evidence');
const { captureStrategyCase } = require('../tools/capture-strategy-case');
const { replayStrategyCase } = require('../tools/replay-strategy-case');

const A = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

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
  const strategySnapshot = sanitizeStrategyPayload({
    day: '2026-07-08',
    snapshot: true,
    mainlines: [{
      rank: 1,
      theme: 'Compute AI',
      todayCodes: ['002396'],
      leaders: [{ code: '002396', name: 'XW', leadScore: 120 }],
    }],
  }, codes);
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
  const tampered = JSON.parse(JSON.stringify(bundle));
  tampered.evidence.limitUpDays[0].stocks[0].name = 'tampered';
  A(!verifyEvidenceBundle(tampered).ok, 'tampered evidence detected');

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
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  const serverSource = await fs.readFile(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
  A(serverSource.includes("url.pathname === '/api/ai/strategy-evidence'"), 'server route registered');
  A(serverSource.match(/async function aiStrategyEvidenceApi[\s\S]{0,500}validateAiReadOnlyRequest/), 'evidence route uses AI read-only token gate');
  A(serverSource.includes("error: 'codes is required (1-20 stock codes)'"), 'evidence route requires bounded stock filter');
  A(serverSource.includes('sourceTextIsUntrusted: true'), 'evidence response marks source text as untrusted data');

  console.log(process.exitCode ? 'SOME STRATEGY-EVIDENCE CHECKS FAILED' : 'ALL STRATEGY-EVIDENCE CHECKS PASSED');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
