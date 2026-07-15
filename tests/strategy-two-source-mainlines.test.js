// 两套独立主线预测行为测试(node tests/strategy-two-source-mainlines.test.js)——Owner 2026-07-15 v2。
// 东财只用东财数据、同花顺只用同花顺数据,各自独立候选/评分/排序/第1主线;两边绝不交叉借资金/涨幅/板块数;
// KPL(7) 不进任一边。贯穿真实 compose/assemble/slim 纯函数,另用静态断言锁定每源只用自己的 zsType。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) break; } }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 题材归一 key 的两个依赖 stub 成空,使 key 退回「题材名去『概念』后 trim」——按题材名精确匹配双源共振即可。
const consensusKey = () => '';
const canonicalTopicName = () => '';
eval(extractFn('strategyResonanceTopicKey'));
eval(extractFn('strategyMainlineSlimSourcePayload'));
eval(extractFn('strategyMainlineAssembleBySource'));
eval(extractFn('strategyMainlineComposeBySourcePayload'));

// 模拟两源各自独立跑出的 impl 结果(只保留 compose 关心的字段)。
const em = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', mainlines: [
  { theme: '算力AI', key: 'k-ai', score: 90, count: 5, netInflow: 30e8, boardGainPct: 6, rank: 1, todayCodes: ['600001'] },
  { theme: '医药',   key: 'k-yy', score: 40, count: 2, netInflow: 8e8,  boardGainPct: 2, rank: 2, todayCodes: ['600002'] },
] };
const th = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', mainlines: [
  { theme: '大消费', key: 'k-xf', score: 88, count: 4, netInflow: 20e8, boardGainPct: 5, rank: 1, todayCodes: ['600003'] },
  { theme: '算力AI', key: 'k-ai', score: 50, count: 3, netInflow: 12e8, boardGainPct: 4, rank: 2, todayCodes: ['600004'] },
] };

// ---- 1. 东财 A 第1、同花顺 B 第1:两边各自显示自己的第1主线,不被合并成同一排名 ----
const composed = strategyMainlineComposeBySourcePayload(em, th);
const bs = composed.mainlinesBySource;
A(bs.eastmoney.mainlines[0].theme === '算力AI' && bs.eastmoney.mainlines[0].source === 'eastmoney', '东财第1主线=算力AI(东财自己排序)');
A(bs.ths.mainlines[0].theme === '大消费' && bs.ths.mainlines[0].source === 'ths', '同花顺第1主线=大消费(同花顺自己排序)');
A(bs.eastmoney.mainLeaderTheme === '算力AI' && bs.ths.mainLeaderTheme === '大消费', '两边各自的 mainLeaderTheme 独立');
A(bs.eastmoney.zsType === 6 && bs.ths.zsType === 5, '两边来源标注:东财 zsType6 / 同花顺 zsType5');
// 顶层并集保留各自 rank 为 sourceRank(第1主线在各自源内 rank 都是 1)
const emAiUnion = composed.mainlines.find(m => m.source === 'eastmoney' && m.theme === '算力AI');
const thXfUnion = composed.mainlines.find(m => m.source === 'ths' && m.theme === '大消费');
A(emAiUnion.sourceRank === 1 && thXfUnion.sourceRank === 1, '并集里两个第1主线各自 sourceRank=1(未被合并成单一排名而丢失任一第1)');

// ---- 2. 只在东财的题材只出现在东财区;只在同花顺的只出现在同花顺区 ----
const emThemes = bs.eastmoney.mainlines.map(m => m.theme);
const thThemes = bs.ths.mainlines.map(m => m.theme);
A(emThemes.includes('医药') && !thThemes.includes('医药'), '「医药」只在东财区(东财独有)');
A(thThemes.includes('大消费') && !emThemes.includes('大消费'), '「大消费」只在同花顺区(同花顺独有)');

// ---- 3. 同名题材两源不同净流入/涨幅:两边各自保留自己的值,绝不交叉取值 ----
const emAi = bs.eastmoney.mainlines.find(m => m.theme === '算力AI');
const thAi = bs.ths.mainlines.find(m => m.theme === '算力AI');
A(emAi.netInflow === 30e8 && Number(emAi.boardGainPct) === 6 && emAi.count === 5, '东财「算力AI」保留东财自己的 30亿/6%/5涨停');
A(thAi.netInflow === 12e8 && Number(thAi.boardGainPct) === 4 && thAi.count === 3, '同花顺「算力AI」保留同花顺自己的 12亿/4%/3涨停');
A(emAi.score === 90 && thAi.score === 50, '同名题材两边各自保留自己的分数(不交叉)');

// ---- 双源共振:算力AI 两边都进前列 → 标记 dualResonance,但两边各留各的分/序,不塌成一张卡 ----
A(bs.dualResonanceThemes.length === 1, '双源共振题材集恰为1个(算力AI)');
A(emAi.dualResonance === true && thAi.dualResonance === true, '算力AI 在两边都打 dualResonance 标');
A(bs.eastmoney.mainlines.find(m => m.theme === '医药').dualResonance === false, '仅单源题材不打双源共振标');

// ---- 4. 某一源缺失:另一源正常,缺失源显示暂缺、绝不借值 ----
const composedMissTh = strategyMainlineComposeBySourcePayload(em, null);
A(composedMissTh.mainlinesBySource.eastmoney.available === true, '同花顺缺失时东财仍正常出结果');
A(composedMissTh.mainlinesBySource.ths.available === false, '同花顺缺失 → available=false(暂缺)');
A(composedMissTh.mainlinesBySource.ths.mainlines.length === 0, '缺失源没有任何主线(不借东财的值补)');
const composedMissEm = strategyMainlineComposeBySourcePayload({ ok: false, reason: 'today-realtime-not-ready' }, th);
A(composedMissEm.mainlinesBySource.eastmoney.available === false && composedMissEm.mainlinesBySource.eastmoney.reason === 'today-realtime-not-ready', '东财源不可用 → 暂缺并带原因');
A(composedMissEm.mainlinesBySource.ths.mainlines[0].theme === '大消费', '一源不可用时另一源照常输出自己的第1主线');

// ---- 4b. 有效零结果(ok=true, mainlines=[]):available=true 但 hasMainlines=false,不是"暂缺"(Codex 二审 P2) ----
const emZero = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', reason: 'no-net-inflow-mainline', message: '当前候选方向未满足资金净流入条件，今日暂不确认主线。', mainlines: [] };
const composedZeroEast = strategyMainlineComposeBySourcePayload(emZero, th);
A(composedZeroEast.mainlinesBySource.eastmoney.available === true, 'P2:东财有效零结果 available=true(源可用,已完成)');
A(composedZeroEast.mainlinesBySource.eastmoney.hasMainlines === false, 'P2:东财有效零结果 hasMainlines=false');
A(composedZeroEast.mainlinesBySource.eastmoney.reason === 'no-net-inflow-mainline', 'P2:有效零结果保留真实原因(资金闸),不是"源不可用"');
A(composedZeroEast.mainlinesBySource.eastmoney.message.includes('资金净流入'), 'P2:有效零结果带人类可读原因文案');
A(composedZeroEast.mainlinesBySource.ths.hasMainlines === true, 'P2:另一源仍正常出主线');
const composedBothZero = strategyMainlineComposeBySourcePayload(emZero, { ok: true, reason: 'no-l2-qualified-mainline', message: '已完成 L2 扫描，无预期明星或明星确认。', mainlines: [] });
A(composedBothZero.ok === true, 'P2:两边都有效零结果时载体 ok=true(页面不整体空白,双栏各自展示)');
A(composedBothZero.mainlinesBySource.eastmoney.available && composedBothZero.mainlinesBySource.ths.available, 'P2:两边均 available=true');
A(!composedBothZero.mainlinesBySource.eastmoney.hasMainlines && !composedBothZero.mainlinesBySource.ths.hasMainlines, 'P2:两边 hasMainlines=false,各带自己零结果原因');
A(composedBothZero.mainlinesBySource.ths.reason === 'no-l2-qualified-mainline', 'P2:同花顺零结果带自己的 L2 闸原因(不借东财原因)');
// 前端:有 mainlinesBySource 不走单列空态早退;双栏区分"无合格主线"与"暂缺"
A(html.includes('!lines.length && !(d && d.mainlinesBySource)'), 'P2 前端:有 mainlinesBySource 时不走单列空态早退(双栏仍展示)');
A(html.includes('src.available && src.hasMainlines') && html.includes('无合格主线') && html.includes('暂缺'), 'P2 前端:双栏三态区分(有主线/无合格主线/暂缺)');

// ---- 5. 静态锁定:每源只用自己的 zsType 取板;KPL(7) 不进任一边,也不进策略辅助指标 ----
A(/boardZsTypes:\s*\[6\]/.test(src) && /boardZsTypes:\s*\[5\]/.test(src), '正常路径按 boardZsTypes:[6] 与 [5] 各自独立跑引擎(从不传 7)');
A(!/boardZsTypes:\s*\[[^\]]*7[^\]]*\]/.test(src), 'KPL(7) 从不作为任一预测的板块来源');
A(/zsTypes:\s*activeBoardZsTypes/.test(src), 'impl 取板按 activeBoardZsTypes(来自 boardZsTypes,默认[6,5]剔除KPL)');
A(/async function getDayThemeBoardStats\([^)]*\)\s*\{[\s\S]*?getDayBoardsWithMembers\(day,\s*\{\s*zsTypes:\s*STRATEGY_ZS_TYPES\s*\}/.test(src), '今日热点榜资金/涨幅补充(策略辅助指标)剔除 KPL');
A(/async function getStrategyStrongResonance\([^)]*\)\s*\{[\s\S]*?getDayBoardsWithMembers\(day,\s*\{\s*zsTypes:\s*STRATEGY_ZS_TYPES\s*\}/.test(src), '强势板块共振榜(策略辅助指标)剔除 KPL');

// ---- 5b. 盘中动能采样按来源隔离:真实 strategyMainlineTrackTrend(Codex 二审 P1) ----
// 复现场景:东财"医药"先记录 76.56 亿基线,6 分钟后同花顺"医药"43.08 亿——加了 zs 前缀后两边键不同,
// 同花顺拿到的是自己的首个样本(trend=null),不会与东财基线算出 -33 亿的假动能。
const STRATEGY_MAINLINE_TREND_MIN_GAP_MS = 3 * 60 * 1000;
const STRATEGY_MAINLINE_TREND_WINDOW_MS = 45 * 60 * 1000;
const STRATEGY_MAINLINE_TREND_BASE_MIN_AGE_MS = 5 * 60 * 1000;
const strategyMainlineTrendSamples = new Map();
const isFiniteNumeric = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
eval(extractFn('strategyMainlineTrackTrend'));
const sixMinAgo = Date.now() - 6 * 60 * 1000;
// 东财"医药"6 分钟前的基线样本(净流入 76.56 亿,大涨 10)
strategyMainlineTrendSamples.set('zs6::group:医药', [{ ts: sixMinAgo, netInflow: 76.56e8, bigGainCount: 10, nearLimitCount: 0, count: 5 }]);
// 东财本次(有 6 分钟前基线)→ 应算出动能
const emTrend = strategyMainlineTrackTrend('zs6::group:医药', { netInflow: 80e8, bigGainCount: 11, nearLimitCount: 0, count: 5 });
A(emTrend && Number(emTrend.inflowDelta) > 0, '东财"医药"有自己 6 分钟前基线 → 算出正动能');
// 同花顺本次同题材(zs5 键无任何历史样本)→ 首个样本,trend=null,绝不借东财基线
const thTrend = strategyMainlineTrackTrend('zs5::group:医药', { netInflow: 43.08e8, bigGainCount: 2, nearLimitCount: 0, count: 8 });
A(thTrend === null, '同花顺"医药"首次采样返回 null(不与东财 76.56 亿基线算出 -33 亿假动能)');
A(strategyMainlineTrendSamples.has('zs5::group:医药') && strategyMainlineTrendSamples.get('zs5::group:医药').length === 1, '同花顺记录了自己独立的首个样本序列');
// 反证:若不加来源前缀(共用"group:医药"键),第二次采样就会拿到第一次的基线算出假 delta
strategyMainlineTrendSamples.set('group:医药', [{ ts: sixMinAgo, netInflow: 76.56e8, bigGainCount: 10, nearLimitCount: 0, count: 5 }]);
const sharedTrend = strategyMainlineTrackTrend('group:医药', { netInflow: 43.08e8, bigGainCount: 2, nearLimitCount: 0, count: 8 });
A(sharedTrend && Number(sharedTrend.inflowDelta) < 0, '反证:共用键时第二次采样确实会与前一基线算出负 delta(前缀正是为消除此串扰)');
// 调用点确实按来源前缀 zs+zsType 组装趋势键
A(/trendKeyPrefix = 'zs' \+ activeBoardZsTypes\.join\('-'\)/.test(src), '调用点按 zs+activeBoardZsTypes 组装来源前缀');
A(/strategyMainlineTrackTrend\(trendKey,/.test(src) && /trendKeyPrefix \? String\(trendKeyPrefix\) \+ '::'/.test(src), 'augmentPrediction 用来源前缀化的 trendKey 采样');

// ---- 5c. 统一 L2 自动扫描:两源合并候选按跨源字典序,高净流入源不被低净流入源抢先(Codex 三审 P1) ----
const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_WINDOW_MS = 5 * 60 * 1000;
const STRATEGY_MAINLINE_AUTO_SCAN_MAX_PER_WINDOW = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_HIGH_INFLOW_OVERRIDE = 10e8;
const STRATEGY_MAINLINE_AUTO_SCAN_LIMIT_STOCKS = 50;
const strategyMainlineAutoScanState = { windowStart: 0, dispatched: 0, lastJobId: '' };
const strategyMainlineFamilyInfo = (x) => ({ key: 'group:' + String(x && x.theme || '') });
const strategyMainlineScanPriorityCodes = () => [];
const l2jobs = {};
let l2seq = 0;
const dispatched = [];
const localL2TaskQueue = {
  configured: () => true,
  get: (id) => l2jobs[id] || null,
  latest: () => null,   // 无既有任务
  start: (job) => { const jobId = 'J' + (++l2seq); const rec = { jobId, ...job, status: 'queued' }; l2jobs[jobId] = rec; dispatched.push(rec); return rec; },
};
eval(extractFn('strategyMainlineMaybeAutoScan'));
// 东财板列在前(9亿),同花顺板在后(99亿);跨源字典序应让同花顺 99亿 先被派发
const scanBoards = [
  { plateId: 'E1', name: '东财板', netInflow: 9e8, zt: 2, zsType: 6, scanChannel: '', memberRows: [{ code: '600001', gain: 6 }] },
  { plateId: 'T1', name: '同花顺板', netInflow: 99e8, zt: 2, zsType: 5, scanChannel: '', memberRows: [{ code: '600002', gain: 6 }] },
];
strategyMainlineMaybeAutoScan(scanBoards, '2026-07-15', true, '早盘', null);
A(dispatched.length === 1, '统一扫描:一次只派发一个任务(限流不变)');
A(dispatched[0].plateId === 'T1' && Number(dispatched[0].zsType) === 5, '统一扫描:同花顺 99亿板先于东财 9亿板被派发(跨源按净流入排序,非完成顺序)');
// 再来一次:上一个任务仍 queued(单任务在飞)→ 不再派发,单一来源无法独占两个名额
strategyMainlineMaybeAutoScan(scanBoards, '2026-07-15', true, '早盘', null);
A(dispatched.length === 1 && strategyMainlineAutoScanState.dispatched === 1, '统一扫描:上一任务在飞时不再派发,五分钟两名额不被单源无意独占');
// 调用点接线:两 impl deferAutoScan,外层合并候选统一派发
A(/deferAutoScan: true/.test(src) && /!options\.leaderDebug && !options\.deferAutoScan/.test(src), 'impl 支持 deferAutoScan,两源配对时各自不派发');
A(/const scanBoards = \[\.\.\.\(\(em && em\.__autoScanBoards\)/.test(src) && /strategyMainlineMaybeAutoScan\(scanBoards, requestedDay, true/.test(src), '外层用两源合并候选统一派发一次');

// ---- 6. 性能优化:配对运行期「按日只读」缓存去重且结果一致(不改口径) ----
const { AsyncLocalStorage } = require('async_hooks');
const strategyMainlineReadCache = new AsyncLocalStorage();
eval(extractFn('strategyMainlineReadCachedCall'));
(async () => {
  let calls = 0;
  const loader = async (day) => { calls += 1; return { day, payload: 'DB-' + day }; };
  // 无作用域:每次都真读(其它调用者行为零变化)
  calls = 0;
  await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
  await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
  A(calls === 2, '无配对作用域:不缓存,每次都真读(不影响其它调用者)');
  // 作用域内:同一天只读一次,不同天各读一次,结果与真读一致
  await strategyMainlineReadCache.run(new Map(), async () => {
    calls = 0;
    const a1 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    const a2 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    const b1 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-14', undefined);
    A(calls === 2, '配对作用域:同一天(07-15)只读一次、不同天(07-14)另读一次 → 共 2 次真读');
    A(a1.payload === 'DB-2026-07-15' && a2.payload === 'DB-2026-07-15' && a1 === a2, '缓存命中返回同一份且内容一致(结果字节不变)');
    A(b1.payload === 'DB-2026-07-14', '不同天返回各自的内容');
    // 带非默认 options 不走缓存(可能改变返回)
    calls = 0;
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', { overrides: true });
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', { overrides: true });
    A(calls === 2, '带非默认 options 的读取绕过缓存(保守,不改带参返回)');
  });
  // 不同 kind 同一天互不串
  await strategyMainlineReadCache.run(new Map(), async () => {
    calls = 0;
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    await strategyMainlineReadCachedCall('limitUpDb', loader, '2026-07-15', undefined);
    A(calls === 2, '不同库(kind)同一天各自缓存,不串键');
  });

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-TWO-SOURCE-MAINLINES CHECKS PASSED');
})();
