// 同花顺 DDE 大单金额接入测试(node tests/strategy-ths-dde-netinflow.test.js)——Owner 2026-07-16 定稿。
// 口径:策略页同花顺侧资金 = d.10jqka realhead 字段 527198(DDE 大单金额,单位元);
// 校准:2026-07-16 收盘 国资云 10.415亿/智慧政务 20.375亿 与 Owner APP 读数一致(zjjlr 为 1.79亿/0亿)。
// 红线:只针对策略页(显式 zsTypes 且不含 KPL 的调用);历史日绝不覆盖(数据穿越);
// DDE 拿不到的板保持 zjjlr 且 metric 如实(不冒充 DDE);两口径绝不混同一列。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
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

const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const THS_DDE_AMOUNT_FIELD = '527198';
eval(extractFn('thsParseRealheadQuote'));
eval(extractFn('thsParseRealheadField'));
eval(extractFn('strategyBoardFundFlowForSource'));

// ---- 1. realhead 载荷解析:527198 提取(真实载荷形态) ----
const sample = 'quotebridge_v6_realhead_bk_885977_defer_last({"items":{"10":"1403.886","527198":"1041518380.000","19":"49883399000.000"},"other":1})';
A(thsParseRealheadField(sample, '527198') === 1041518380, '解析:从 quotebridge 载荷提取 527198=10.415亿(元)');
A(thsParseRealheadQuote('cb({"items":{"527198":"719048250","time":"2026-07-20 10:28:00 北京时间","name":"国资云"}})', '527198').sourceDay === '2026-07-20',
  '解析:从 realhead 源时间提取 sourceDay,供跨日污染校验');
A(thsParseRealheadQuote('cb({"items":{"527198":"719048250","199112":"2.01","time":"2026-07-20 09:35:00 北京时间"}})', '527198').gainPct === 2.01,
  '解析:同一次 realhead 响应提取当前板块涨幅,供 DDE 补选避免旧排名');
A(thsParseRealheadField(sample, '999999') === null, '解析:不存在的字段返回 null');
A(thsParseRealheadField('garbage', '527198') === null, '解析:非法载荷返回 null(不抛错)');

// ---- 2. 资金口径选择器:同花顺分支 DDE 优先,未覆盖回退 zjjlr 且 metric 如实 ----
const withDde = strategyBoardFundFlowForSource({ ddeBigOrderAmount: 11.92e8, netInflow: 1.79e8 }, 5);
A(withDde.value === 11.92e8 && withDde.metric === 'ths-dde-big-order-amount' && withDde.legacy === false,
  '选择器:有 DDE 时同花顺资金=DDE 大单金额(metric 可溯)');
const noDde = strategyBoardFundFlowForSource({ netInflow: 1.79e8 }, 5);
A(noDde.value === 1.79e8 && noDde.metric === 'ths-net-inflow', '选择器:无 DDE 回退 zjjlr,metric=ths-net-inflow(不冒充 DDE)');
// 东财分支不受影响
const east = strategyBoardFundFlowForSource({ superLargeNetInflow: 3e8, netInflow: 8e8, ddeBigOrderAmount: 99e8 }, 6);
A(east.value === 3e8 && east.metric === 'eastmoney-super-large-net-inflow', '选择器:东财仍走超大单口径,不受 DDE 字段影响');

// ---- 3. 覆盖行为:贯穿真实 strategyApplyThsDdeFundFlow(stub 目录映射与 realhead 抓取) ----
const isoFromCompactDate = d => String(d);
const chinaNowParts = () => ({ day: '2026-07-16' });
const strategyMainlineDiagNoteRead = () => {};
async function mapLimit(items, limit, fn) { for (const it of items) await fn(it); }
const DDE = { '885977': 10.415e8, '885956': 20.375e8 };   // indexCode -> DDE;'885999' 模拟失败
const thsDdeIndexCodeMap = async () => new Map([['308874', '885977'], ['308606', '885956'], ['308999', '885999']]);
let ddeFetchImpl = async (idx) => { if (idx === '885999') throw new Error('503'); return DDE[idx] ?? null; };
const fetchThsBoardDdeAmount = (idx) => ddeFetchImpl(idx);
let ddeQuoteSourceDay = '2026-07-16';
const fetchThsBoardDdeQuote = async (idx) => {
  const value = await ddeFetchImpl(idx);
  return value == null ? null : {
    value,
    gainPct: idx === '885977' ? 2.01 : 1.25,
    sourceDay: ddeQuoteSourceDay,
    asOf: `${ddeQuoteSourceDay} 10:30:00 北京时间`,
    sourceName: idx,
  };
};
const THS_DDE_OVERLAY_BUDGET_MS = 250;   // 测试用小预算(生产 8000ms),验证预算机制本身
eval(extractFn('thsDdeRaceBudget'));
eval(extractFn('applyThsDdeFundFlowToRealtimeBoards'));
eval(extractFn('strategyApplyThsDdeFundFlow'));

(async () => {
  // 3a. 今日:zsType5 主板覆盖 + zjjlr 留档;塌板 bySource[5] 同步覆盖;东财板不动
  const b5 = { zsType: 5, plateId: '308874', netInflow: 1.79e8, netInflowMetric: 'ths-net-inflow' };
  const b6 = { zsType: 6, plateId: 'BK1146', netInflow: 3e8, netInflowMetric: 'eastmoney-super-large-net-inflow',
    bySource: { 5: { zsType: 5, plateId: '308606', netInflow: 0, netInflowMetric: 'ths-net-inflow' } } };
  await strategyApplyThsDdeFundFlow([b5, b6], '2026-07-16');
  A(b5.netInflow === 10.415e8 && b5.netInflowMetric === 'ths-dde-big-order-amount', '今日:同花顺主板 netInflow 覆盖为 DDE(10.415亿)');
  A(b5.netInflowZjjlr === 1.79e8 && b5.ddeBigOrderAmount === 10.415e8, '今日:原 zjjlr 留档 netInflowZjjlr,DDE 存 ddeBigOrderAmount');
  A(b5.gainPct === 2.01, '今日:策略 DDE 覆盖复用 realhead 当前涨幅,用于 DDE 候选补选');
  A(b6.netInflow === 3e8 && b6.netInflowMetric === 'eastmoney-super-large-net-inflow', '今日:东财主板不受同花顺覆盖影响');
  A(b6.bySource[5].netInflow === 20.375e8 && b6.bySource[5].netInflowMetric === 'ths-dde-big-order-amount',
    '今日:塌板后的 bySource[5](智慧政务)同步覆盖为 DDE(20.375亿)——R2 同源配对吃到 DDE 口径');

  // 3b. DDE 抓取失败的板:保持 zjjlr、metric 不变(不冒充、不清零)
  const bFail = { zsType: 5, plateId: '308999', netInflow: 2.2e8, netInflowMetric: 'ths-net-inflow' };
  await strategyApplyThsDdeFundFlow([bFail], '2026-07-16');
  A(bFail.netInflow === 2.2e8 && bFail.netInflowMetric === 'ths-net-inflow' && bFail.ddeBigOrderAmount === undefined,
    '失败板:保持 zjjlr 与原 metric(可辨别未覆盖,不冒充 DDE)');

  // 3c. 历史日:绝不覆盖(realhead 是"现在"的值,回填历史=数据穿越)
  const bHist = { zsType: 5, plateId: '308874', netInflow: 5e8, netInflowMetric: 'ths-net-inflow' };
  await strategyApplyThsDdeFundFlow([bHist], '2026-07-15');
  A(bHist.netInflow === 5e8 && bHist.ddeBigOrderAmount === undefined, '历史日:不覆盖(拒绝数据穿越)');

  // 3d. 今日实时严格口径:当前日用 DDE；跨日/失败置空，绝不把 zjjlr 混回同一列。
  const rtOk = { plateId: '308874', thsPlateCode: '885977', netInflow: -48.61e8 };
  const rtSummary = await applyThsDdeFundFlowToRealtimeBoards([rtOk], '2026-07-16');
  A(rtSummary.applied === 1 && rtOk.netInflow === 10.415e8 && rtOk.netInflowZjjlr === -48.61e8,
    '今日实时:展示当前日 DDE,原 zjjlr 仅留审计字段');
  A(rtOk.gain === 2.01 && rtOk.gainPct === 2.01, '今日实时:DDE 同请求刷新板块涨幅,不沿用掉出涨幅榜前的旧值');
  ddeQuoteSourceDay = '2026-07-15';
  const rtStale = { plateId: '308874', thsPlateCode: '885977', netInflow: 9e8 };
  const staleSummary = await applyThsDdeFundFlowToRealtimeBoards([rtStale], '2026-07-16');
  A(staleSummary.stale === 1 && rtStale.netInflow === null && rtStale.netInflowState === 'stale-source-day',
    '今日实时:跨日 DDE 置空并标 stale,不让昨日值冒充今日');
  const rtNoCurrentCache = { plateId: '308874', thsPlateCode: '885977', netInflow: 6e8 };
  await applyThsDdeFundFlowToRealtimeBoards([rtNoCurrentCache], '2026-07-15');
  A(rtNoCurrentCache.netInflow === null && rtNoCurrentCache.netInflowZjjlr === 6e8
    && rtNoCurrentCache.netInflowState === 'not-current-day',
    '今日实时:只有旧目录/旧缓存时同样置空,不展示旧 zjjlr');
  ddeQuoteSourceDay = '2026-07-16';

  // 3e. [Codex P1] 悬挂请求:overlay 必须在总预算内回退,绝不卡住策略构建
  ddeFetchImpl = () => new Promise(() => {});   // 永不 resolve(模拟 realhead 悬挂)
  const bHang = { zsType: 5, plateId: '308874', netInflow: 1.5e8, netInflowMetric: 'ths-net-inflow' };
  const t0 = Date.now();
  const keepAlive = setTimeout(() => {}, 5000);   // 预算定时器是 unref 的(生产不阻退出),测试进程需自持保活
  await strategyApplyThsDdeFundFlow([bHang], '2026-07-16');
  clearTimeout(keepAlive);
  const hangMs = Date.now() - t0;
  A(hangMs < 2000, `悬挂:overlay 在总预算内返回(${hangMs}ms,预算 250ms)——不卡 getDayBoardsWithMembers`);
  A(bHang.netInflow === 1.5e8 && bHang.netInflowMetric === 'ths-net-inflow' && bHang.ddeBigOrderAmount === undefined,
    '悬挂:该板按已定规则保持 zjjlr 与原 metric(不冒充、不清零)');
  ddeFetchImpl = async (idx) => { if (idx === '885999') throw new Error('503'); return DDE[idx] ?? null; };

  // ---- 4. 静态:策略接线仍只在显式策略口径生效；今日实时使用独立严格覆盖函数 ----
  A(/strategyScopedZs = Array\.isArray\(options\.zsTypes\) && options\.zsTypes\.length\s*&& !options\.zsTypes\.map\(Number\)\.includes\(7\)/.test(src),
    '静态:策略覆盖仍仅由显式策略口径(不含 KPL)触发');
  A(/if \(strategyScopedZs && zsTypes\.map\(Number\)\.includes\(5\)\)/.test(src), '静态:仅含同花顺来源时触发');
  A(/async function applyThsDdeFundFlowToRealtimeBoards\(/.test(src)
    && /board\.netInflowState = 'stale-source-day'/.test(src),
    '静态:今日实时走独立严格 DDE 覆盖,跨日值不回退 zjjlr');
  A(/strategyMainlineDiagNoteRead\(`ths-dde bk \$\{plateId\}`/.test(src), '静态:单板失败记入诊断上下文(不吞)');
  A(/THS_DDE_AMOUNT_FIELD = '527198'/.test(src), '静态:字段号 527198 常量化(校准记录见合同文档)');
  A(/signal: AbortSignal\.timeout\(THS_DDE_FETCH_TIMEOUT_MS\)/.test(src), '静态:realhead 单请求带 AbortSignal 截止(悬挂请求被真正中止,不留后台占用)');
  A(/const deadline = Date\.now\(\) \+ THS_DDE_OVERLAY_BUDGET_MS/.test(src), '静态:overlay 设总预算截止线,超预算板保持 zjjlr');
  const realFetchSource = extractFn('fetchThsBoardDdeAmount');
  A(!realFetchSource.includes('await getThsCookieV') && !realFetchSource.includes('Cookie:'), '静态:DDE realhead 直连,不依赖云端可能超时的 GitHub Cookie 脚本');

  // ---- 4b. 候选覆盖:原涨幅前排不变，同时补入涨幅榜截断外的 DDE 强板 ----
  const MIN_BOARD_GAIN_PCT = -0.5;
  const STRATEGY_MAINLINE_LIVE_BOARD_POOL = 5;
  eval(extractFn('strategyThsDdeCandidateUnion'));
  const candidateRows = [
    { plateId: 'gain-1', name: '涨幅一', gainPct: 5.2, ddeBigOrderAmount: 1e8 },
    { plateId: 'gain-2', name: '涨幅二', gainPct: 4.8, ddeBigOrderAmount: 2e8 },
    { plateId: 'gain-3', name: '涨幅三', gainPct: 4.2, ddeBigOrderAmount: 3e8 },
    { plateId: 'data-center', name: '数据中心(AIDC)', gainPct: 2.01, ddeBigOrderAmount: 7.1e9 },
    { plateId: 'weak-dde', name: '弱势大单', gainPct: -1.2, ddeBigOrderAmount: 9e9 },
  ];
  const candidateUnion = strategyThsDdeCandidateUnion(candidateRows, 3);
  A(candidateUnion.slice(0, 3).map(row => row.plateId).join(',') === 'gain-1,gain-2,gain-3',
    'DDE补选:原涨幅前排与顺序保持不变');
  A(candidateUnion.some(row => row.plateId === 'data-center'),
    'DDE补选:约2%但DDE居前的数据中心不会在成分股/L2验证前被裁掉');
  A(!candidateUnion.some(row => row.plateId === 'weak-dde'),
    'DDE补选:负涨幅板块不因绝对大单金额直接进入候选');

  // ---- 5. [Codex P1] 真实 fetchThsBoardDdeAmount:in-flight 去重 / 失败可重试(独立作用域,不与上方 stub 冲突) ----
  await (async function realFetchScope() {
    const THS_DDE_AMOUNT_FIELD = '527198';
    const THS_DDE_CACHE_MS = 90 * 1000;
    const THS_DDE_FETCH_TIMEOUT_MS = 4000;
    const thsDdeAmountCache = new Map();
    const thsDdeMetaCache = new Map();
    const thsDdePendingFetch = new Map();
    let fetchCalls = 0;
    let failNext = false;
    let missingNext = false;
    const payload = 'quotebridge_v6_realhead_bk_885977_defer_last({"items":{"527198":"1041518380.000","time":"2026-07-16 15:01:00 北京时间","name":"国资云"},"o":1})';
    const fetch = async () => {
      fetchCalls++;
      await new Promise((r) => setTimeout(r, 20));   // 模拟网络延迟,让并发窗口真实存在
      if (failNext) { failNext = false; throw new Error('socket hang up'); }
      if (missingNext) { missingNext = false; return { ok: true, text: async () => 'callback({"items":{"10":"1.0"}})' }; }
      return { ok: true, text: async () => payload };
    };
    eval(extractFn('fetchThsBoardDdeAmount'));
    // 并发同 code 只发一次网络请求(in-flight Promise 去重)
    const [r1, r2] = await Promise.all([fetchThsBoardDdeAmount('885977'), fetchThsBoardDdeAmount('885977')]);
    A(fetchCalls === 1 && r1 === 1041518380 && r2 === 1041518380, '并发去重:两个并发同板调用只发 1 次网络请求,结果一致');
    const r3 = await fetchThsBoardDdeAmount('885977');
    A(fetchCalls === 1 && r3 === 1041518380, '结果缓存:90s 内再次调用直接命中缓存(仍只 1 次请求)');
    // 失败不污染:不写缓存、pending 清理,下一次真正重新发请求
    failNext = true;
    let firstErr = null;
    await fetchThsBoardDdeAmount('885956').catch((e) => { firstErr = e; });
    A(firstErr != null && fetchCalls === 2, '失败:异常如实上抛,失败结果不写缓存');
    const r4 = await fetchThsBoardDdeAmount('885956');
    A(fetchCalls === 3 && r4 === 1041518380, '失败后重试:pending 已清理,下一次重新发请求并成功(失败不污染重试)');
    // HTTP 200 但字段缺失也不能缓存 null；下一次应重新请求。
    missingNext = true;
    const missing = await fetchThsBoardDdeAmount('885955');
    const callsAfterMissing = fetchCalls;
    const recovered = await fetchThsBoardDdeAmount('885955');
    A(missing === null && fetchCalls === callsAfterMissing + 1 && recovered === 1041518380, '字段缺失不缓存 null,下一次可重新请求并恢复');
  })();

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-THS-DDE-NETINFLOW CHECKS PASSED');
})();
