'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  buildBoardFundFlowPayload,
  verifyBoardFundFlowPayload,
  createBoardFundFlowStore,
  buildStrategyRealtimeContext,
  compactRealtimeContextQuality,
  parseEastmoneyHistoricalFundFlow,
  reconstructEastmoneyBoardFundFlowDay,
} = require('../strategy-realtime-data');

const DAY = '2026-07-17';
const AS_OF = '2026-07-17T06:58:00.000Z';
const ok = message => console.log(`ok: ${message}`);

(async () => {
  const clean = buildBoardFundFlowPayload({
    day: DAY,
    source: 'eastmoney',
    sourceDay: DAY,
    sourceDayBasis: 'payload-date',
    asOf: AS_OF,
    fetchedAt: AS_OF,
    minExpectedRows: 1,
    rows: [
      { plateId: 'BK001', name: '算力概念', gainPct: 2.5, netInflow: 2e8, netInflowMetric: 'eastmoney-f66', sourceDay: DAY },
      { plateId: 'BK001', name: '算力概念', gainPct: 2.6, netInflow: 2.1e8, netInflowMetric: 'eastmoney-f66', sourceDay: DAY },
      { plateId: 'BK999', name: '昨日污染', gainPct: 9, netInflow: 9e9, sourceDay: '2026-07-16' },
      { name: '无编号', sourceDay: DAY },
    ],
  });
  assert.strictEqual(clean.rowCount, 1);
  assert.strictEqual(clean.dropped.duplicate, 1);
  assert.strictEqual(clean.dropped.foreignDay, 1);
  assert.strictEqual(clean.dropped.invalid, 1);
  assert.strictEqual(clean.stale, true);
  assert.strictEqual(clean.complete, false);
  assert.strictEqual(clean.rows[0].netInflow, 2.1e8);
  ok('跨日、无编号与重复板块被如实剔除且质量降级');

  const valid = buildBoardFundFlowPayload({
    day: DAY,
    source: 'eastmoney',
    sourceDay: DAY,
    asOf: AS_OF,
    fetchedAt: AS_OF,
    rows: [{ plateId: 'BK001', name: '算力', gainPct: 2.5, netInflow: 2e8, sourceDay: DAY }],
  });
  assert.strictEqual(valid.complete, true);
  assert.strictEqual(valid.scoreEligible, true);
  assert.strictEqual(verifyBoardFundFlowPayload(valid).ok, true);
  const tampered = JSON.parse(JSON.stringify(valid));
  tampered.rows[0].netInflow = 999;
  assert(verifyBoardFundFlowPayload(tampered).errors.includes('content-hash-mismatch'));
  ok('完整事实可计分且内容哈希能识别篡改');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-realtime-'));
  const store = createBoardFundFlowStore({
    rootDir: path.join(dir, 'facts'),
    reconstructedRootDir: path.join(dir, 'reconstructed'),
    isTradingDay: day => day !== '2026-07-18',
  });
  const first = await store.write(valid);
  assert.strictEqual(first.written, true);
  const older = buildBoardFundFlowPayload({
    day: DAY, source: 'eastmoney', sourceDay: DAY,
    asOf: '2026-07-17T06:30:00.000Z', fetchedAt: '2026-07-17T06:30:00.000Z',
    rows: [{ plateId: 'BK001', name: '算力', gainPct: 1, netInflow: 1, sourceDay: DAY }],
  });
  assert.strictEqual((await store.write(older)).reason, 'older-as-of');
  const degraded = buildBoardFundFlowPayload({
    day: DAY, source: 'eastmoney', sourceDay: DAY,
    asOf: '2026-07-17T07:00:00.000Z', fetchedAt: '2026-07-17T07:00:00.000Z',
    complete: false, rows: [],
  });
  assert.strictEqual((await store.write(degraded)).reason, 'quality-regression');
  await assert.rejects(() => store.write(buildBoardFundFlowPayload({
    day: '2026-07-18', source: 'eastmoney', sourceDay: '2026-07-18',
    asOf: '2026-07-18T07:00:00.000Z', rows: [{ plateId: 'BK1', name: '休市', sourceDay: '2026-07-18', gainPct: 1 }],
  })), /non-trading day/);
  ok('事实库拒绝旧时点、质量倒退和休市日写入');

  const ths = buildBoardFundFlowPayload({
    day: DAY, source: 'ths', sourceDay: DAY, asOf: AS_OF, fetchedAt: AS_OF,
    rows: [{ plateId: '885001', name: '算力概念', gainPct: 3, netInflow: -4e8, netInflowMetric: 'ths-dde', sourceDay: DAY }],
  });
  const kpl = buildBoardFundFlowPayload({
    day: DAY, source: 'kpl', sourceDay: DAY, asOf: AS_OF, fetchedAt: AS_OF,
    rows: [{ plateId: 'k1', name: '算力板块', gainPct: 2, netInflow: 5e8, sourceDay: DAY }],
  });
  const context = buildStrategyRealtimeContext({
    day: DAY,
    asOf: AS_OF,
    sourceFacts: { eastmoney: valid, ths, kpl },
    limitUpStocks: [{ code: '000001' }, { code: '000002' }],
    mainReasonStocks: [{ code: '000001' }],
    closeStocks: [{ code: '000001' }, { code: '000002' }],
    l2Jobs: [{ status: 'done', plateId: 'BK001' }],
    membersByBoard: {
      '6:BK001': { source: 'eastmoney', zsType: 6, plateId: 'BK001', name: '算力', codes: ['000001', '000002', '000003'] },
    },
  });
  assert.strictEqual(context.canonicalBoards[0].netInflow, 2e8);
  assert.notStrictEqual(context.canonicalBoards[0].netInflow, 2e8 - 4e8 + 5e8);
  assert.strictEqual(context.sourcePolicy.aggregation, 'never-sum-cross-source-fund-flow');
  assert.strictEqual(context.canonicalBoards[0].agreement.direction, 'mixed');
  assert.deepStrictEqual(context.missingReasonCodes, ['000002']);
  assert.deepStrictEqual(context.boardEvidence['6:BK001'].limitUpCodes, ['000001', '000002']);
  assert.strictEqual(context.boardEvidence['6:BK001'].l2DoneJobCount, 1);
  assert.strictEqual(context.readyFor.intradayRanking, true);
  const compact = compactRealtimeContextQuality(context);
  assert.strictEqual(compact.sourceStatus.eastmoney.rowCount, 1);
  assert.strictEqual(compact.sourceStatus.ths.complete, true);
  ok('统一上下文以东财为规范值，跨源只做方向佐证而不相加');

  const historicalPayload = {
    data: {
      code: 'BK0711',
      name: '券商概念',
      klines: [`${DAY},1,2,3,4,500000000,6,7,8,9,10,1000,2.35`],
    },
  };
  const parsed = parseEastmoneyHistoricalFundFlow(historicalPayload, DAY, { plateId: 'BK0711', name: '券商' });
  assert.strictEqual(parsed.netInflow, 500000000);
  assert.strictEqual(parsed.gainPct, 2.35);
  assert.strictEqual(parsed.netInflowMetric, 'eastmoney-super-large-net-inflow-historical');
  const fakeFetch = async () => ({ ok: true, json: async () => historicalPayload });
  const rebuilt = await reconstructEastmoneyBoardFundFlowDay({
    day: DAY,
    boards: [{ plateId: 'BK0711', name: '券商' }],
    store,
    fetchImpl: fakeFetch,
    fetchedAt: '2026-07-19T00:00:00.000Z',
    force: true,
  });
  assert.strictEqual(rebuilt.payload.reconstructed, true);
  assert.strictEqual(rebuilt.payload.scoreEligible, false);
  assert.strictEqual(rebuilt.payload.complete, true);
  assert(fs.existsSync(path.join(dir, 'reconstructed', 'eastmoney', `${DAY}.json`)));
  assert(fs.existsSync(path.join(dir, 'facts', 'eastmoney', `${DAY}.json`)));
  ok('东财历史重建独立落盘且默认不进入计分');

  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
  assert(serverSource.includes("require('./strategy-realtime-data')"));
  assert(serverSource.includes("require('./strategy-observation-report')"));
  assert(serverSource.includes("url.pathname === '/api/admin/strategy-realtime-context'"));
  assert(/async function getStrategyRealtimeContextApi[\s\S]{0,160}requireAdmin\(req, res\)/.test(serverSource));
  assert(serverSource.includes('runAutoStrategyRealtimeObservationIfDue().catch'));
  assert(serverSource.includes("'strategy-realtime-data.js',") && serverSource.includes("'strategy-observation-report.js',"));
  const officialBuild = serverSource.slice(
    serverSource.indexOf('async function buildStrategyMainlinesLiveImpl'),
    serverSource.indexOf('function strategyMainlineHasQiStarEvidence')
  );
  assert(!officialBuild.includes('buildStrategyRealtimeContextForDay'));
  assert(!officialBuild.includes('captureStrategyBoardFundFlowFacts'));
  ok('新数据层只接管理员诊断和旁路观察，正式 v2 构建函数未改用新上下文');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ALL STRATEGY REALTIME DATA TESTS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
