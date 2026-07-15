// 扫描调度字典序优先队列测试(node tests/scan-priority.test.js)——Shared Decision v1 第5条 + PR#19 评审修正。
const fsReal = require('fs');
const pathReal = require('path');
const os = require('os');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const { createLocalL2TaskQueue } = require(pathReal.join(__dirname, '..', 'local-l2-task-queue.js'));

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const limitUpThreshold = (code) => /^(30|68)/.test(String(code || '')) ? 20 : 10;
const normalizeReasonSourceCode = c => String(c || '').trim();
const numOrNull = value => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
// 二审修正1:第三键只计与当前板块同题材的历史命中。题材匹配走真实 strategyMainlineBoardThemeRelated,
// 仅 stub 其依赖(topicKey 归一化、分类学查询返回空)。
const strategyMainlineTopicKey = t => String(t || '').trim().toLowerCase();
const strategyThemeTaxonomyInfo = () => null;
eval(extractFn('strategyMainlineBoardThemeRelated'));
eval(extractFn('strategyMainlineScanPriorityCodes'));
eval(extractFn('strategyNormRealtimeStocks'));

(async () => {
  // 1. 真实数据链路(评审修正2):主因命中次数从 buildStrategyMainlinePriorReasonContext 的 byCode 来,
  //    不手造 row.priorReason——stub 仅替换 IO(交易日/主因库读取),链路本身走真实代码。
  const strategyMainlinePrevTradingDay = () => '2026-07-09';
  const shiftDay = (d) => d;
  const readSavedApiKey = async () => 'k';
  const getRecentTradingDays = async () => ['2026-07-08', '2026-07-09'];
  const isExcludedFromReview = () => false;
  const isDroppedThemeWord = () => false;
  const strategyParseLianban = () => 1;
  const dbByDay = {
    '2026-07-08': { stocks: [
      { code: '600006', name: 'f', finalBoardTopic: '示例主题', finalDetailReason: '细分甲' },
      { code: '600001', name: 'a', finalBoardTopic: '示例主题' },
    ] },
    '2026-07-09': { stocks: [
      { code: '600006', name: 'f', finalBoardTopic: '示例主题', finalDetailReason: '细分甲' },
    ] },
  };
  const readLimitUpMainReasonDbDay = async (d) => dbByDay[d] || null;
  eval(extractFn('buildStrategyMainlinePriorReasonContext'));
  const ctx = await buildStrategyMainlinePriorReasonContext('2026-07-10', ['600001', '600006', '600002'], 30);
  A(ctx.byCode.get('600006')?.count === 2 && ctx.byCode.get('600001')?.count === 1, '真实链路:上下文统计主因命中次数(600006=2次,600001=1次)');

  const board = { name: '示例主题', memberRows: [
    { code: '600001', name: 'a', gain: 9.2 },   // 距板 0.8,主因1次
    { code: '600002', name: 'b', gain: 6.0 },   // 距板 4.0
    { code: '600003', name: 'c', gain: 10.0 },  // 已涨停,不进猎场
    { code: '600004', name: 'd', gain: 3.0 },   // 不足 5%,不进
    { code: '300005', name: 'e', gain: 12.0 },  // 创业板距板 8.0
    { code: '600006', name: 'f', gain: 9.2 },   // 与600001同距板,主因2次(来自真实上下文,行上无 priorReason)
  ] };
  const codes = strategyMainlineScanPriorityCodes(board, ctx.byCode);
  A(!codes.includes('600003') && !codes.includes('600004'), '猎场只收 5%~涨停之间');
  A(codes[0] === '600006' && codes[1] === '600001', '距板同为0.8:主因命中多者优先——第三键吃到真实上下文数据,行上无 priorReason');
  A(codes.indexOf('600002') < codes.indexOf('300005'), '距板 4.0 优先于 8.0');
  const codesNoCtx = strategyMainlineScanPriorityCodes(board, null);
  A(codesNoCtx[0] === '600001' && codesNoCtx[1] === '600006', '无上下文时第三键为0,同距板退回代码序(不抛错)');

  // 1b. 二审修正1:历史题材必须与当前板块一致才计数——无关题材10次不得压过相关题材1次。
  const priorMixed = new Map([
    ['600001', { code: '600001', theme: '无关题材', count: 10, topics: [{ theme: '无关题材', count: 10 }] }],
    ['600006', { code: '600006', theme: '示例主题', count: 1, topics: [{ theme: '示例主题', count: 1 }, { theme: '无关题材', count: 5 }] }],
  ]);
  const codesTheme = strategyMainlineScanPriorityCodes(board, priorMixed);
  A(codesTheme[0] === '600006' && codesTheme[1] === '600001', '无关题材10次计0,相关题材1次胜出;多题材只累计同题材次数(无关5次不叠加)');
  A(src.includes('strategyMainlineBoardThemeRelated(board?.name, t?.theme)'), '第三键题材过滤复用 strategyMainlineBoardThemeRelated');

  // 2. 板块级字典序与豁免 + 调用点接线(静态断言)
  A(src.includes("b?.scanChannel === 'supplement' || Number(b?.zt) >= STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT"), '补选板块豁免涨停>=2门槛');
  A(src.includes('Number(b?.netInflow) >= STRATEGY_MAINLINE_AUTO_SCAN_HIGH_INFLOW_OVERRIDE'), '高流入直通:净流入≥阈值无视涨停数');
  A(src.includes("((a?.scanChannel === 'supplement') ? 0 : 1) - ((b?.scanChannel === 'supplement') ? 0 : 1)"), '板块级第一键=补选来源');
  A(src.includes('bigGainOf(b) - bigGainOf(a)'), '板块级第三键=大涨数');
  A(src.includes('strategyMainlineScanPriorityCodes(board, priorByCode)'), '派发时传入真实主因上下文');
  A(src.includes('sessionPhaseNow, priorReason?.byCode)'), '调用点接线 priorReason.byCode');

  // 3. 队列:分组后截断(评审修正1)——limitStocks=2,优先股原排第4 也必须入选
  const tmp = fsReal.mkdtempSync(pathReal.join(os.tmpdir(), 'l2q-'));
  const q = createLocalL2TaskQueue({ token: 'x'.repeat(24), persistDir: tmp });
  const jobT = q.start({
    plateId: 'pt', boardName: '截断板', day: '2026-07-11',
    stocks: [
      { code: '600020', name: 'A', gainPct: 9 },
      { code: '600021', name: 'B', gainPct: 8 },
      { code: '600022', name: 'C', gainPct: 7 },
      { code: '600023', name: 'D', gainPct: 6 },   // 涨幅第4,但为优先股
    ],
    priorityCodes: ['600023', '600099'],   // 600099 不在成分内,不得进 job.priorityCodes
    limitStocks: 2,
  });
  A(JSON.stringify(jobT.priorityCodes) === JSON.stringify(['600023']), 'job.priorityCodes 只留最终任务中真实存在的代码(无效代码剔除)');
  const claimedT = q.claim({ token: 'x'.repeat(24), workerId: 'w1', version: 'p1w-test' });
  const orderT = claimedT.job.stocks.map(s => s.code);
  A(JSON.stringify(orderT) === JSON.stringify(['600023', '600020']), 'limitStocks=2:原排第4的优先股先入选,再补涨幅最高的普通股');
  A(JSON.stringify(claimedT.job.priorityCodes) === JSON.stringify(['600023']), 'workerJob 显式下发 priorityCodes(评审修正3,旧 worker 忽略亦兼容)');

  // 4. 无截断场景:优先组+普通组各自保持涨幅序
  const job2 = q.start({
    plateId: 'p2', boardName: '板二', day: '2026-07-11',
    stocks: [
      { code: '600010', name: 'A', gainPct: 9 },
      { code: '600011', name: 'B', gainPct: 8, price: 12.5, priceSource: 'eastmoney-board-realtime' },
      { code: '600012', name: 'C', gainPct: 7, price: 9.9, priceSource: 'eastmoney-board-realtime' },
      { code: '600013', name: 'D', gainPct: 6 },
    ],
    priorityCodes: ['600012', '600011'],
  });
  const claimed2 = q.claim({ token: 'x'.repeat(24), workerId: 'w1', version: 'p1w-test' });
  A(JSON.stringify(claimed2.job.stocks.map(s => s.code)) === JSON.stringify(['600011', '600012', '600010', '600013']), '优先组 B8>C7 在前,普通组 A9>D6 在后');
  A(claimed2.job.stocks[0].price === 12.5 && !!claimed2.job.stocks[0].priceAsOf, '任务向 worker 保留实时现价及快照时间');

  // 5. job 指标(评审修正4):五档齐全=每档四项金额均为有限数值,0 合法,空对象不算
  const fullBucket = (v = 0) => ({ activeBuy: v, activeSell: v, passiveBuy: v, passiveSell: v });
  const fiveFull = { '500000': fullBucket(1e6), '3000000': fullBucket(0), '5000000': fullBucket(2e6), '8000000': fullBucket(0), '10000000': fullBucket(0) };
  const fiveWithEmptyObj = { ...fiveFull, '10000000': {} };
  q.update({ token: 'x'.repeat(24), jobId: job2.jobId, results: [
    { code: '600011', name: 'B', thresholds: fiveFull },          // worker 缺价,从任务快照补 12.5
    { code: '600012', name: 'C', lastPrice: 8.8, thresholds: fiveWithEmptyObj },  // 只回传 lastPrice 也算有价格(二审修正2);空对象档 → 不齐全
    { code: '600010', name: 'A', thresholds: { '500000': fullBucket(1) } },    // 缺档 → 不齐全,且无任何价格字段
  ] });
  const after = q.get(job2.jobId);
  A(after.metrics.resultRows === 3 && after.metrics.rowsWithPrice === 2, 'job 指标:价格覆盖统一策略口径(price ?? close ?? lastPrice),lastPrice-only 行计入');
  const resultByCode = new Map(after.results.map(row => [row.code, row]));
  A(resultByCode.get('600011').price === 12.5 && resultByCode.get('600011').priceSource === 'eastmoney-board-realtime', 'worker 缺价时按 code 回填任务实时价及来源');
  A(resultByCode.get('600012').price === 8.8 && resultByCode.get('600012').priceSource === 'worker-result', 'worker 自带价格优先于任务快照价');
  A(after.metrics.rowsWithAllBuckets === 1, '五档齐全只认四项金额均有限数值(全零档合法,空对象与缺档不算)');
  A(!!after.firstResultAt && q.get(job2.jobId).workerVersion === 'p1w-test', '首批时间与版本盖章');
  q.update({ token: 'x'.repeat(24), jobId: job2.jobId, version: 'p1w-test2', results: [] });
  A(q.get(job2.jobId).workerVersion === 'p1w-test2', 'update 可更新 worker 版本');

  const normalizedPrice = strategyNormRealtimeStocks([{ code: '600100', name: '现价股', close: 18.6, gain: 3.2 }], 'eastmoney-board-realtime')[0];
  A(normalizedPrice.price === 18.6 && normalizedPrice.priceSource === 'eastmoney-board-realtime', '实时成分标准化保留现价与来源');
  A(src.includes("price: numOrNull(row?.[5])") && src.includes("priceSource: 'kpl-board-realtime'"), 'KPL 实时成分映射保留 row[5] 现价');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL SCAN-PRIORITY CHECKS PASSED');
})();
