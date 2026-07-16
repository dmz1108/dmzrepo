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
eval(extractFn('thsParseRealheadField'));
eval(extractFn('strategyBoardFundFlowForSource'));

// ---- 1. realhead 载荷解析:527198 提取(真实载荷形态) ----
const sample = 'quotebridge_v6_realhead_bk_885977_defer_last({"items":{"10":"1403.886","527198":"1041518380.000","19":"49883399000.000"},"other":1})';
A(thsParseRealheadField(sample, '527198') === 1041518380, '解析:从 quotebridge 载荷提取 527198=10.415亿(元)');
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
const THS_DDE_OVERLAY_BUDGET_MS = 250;   // 测试用小预算(生产 8000ms),验证预算机制本身
eval(extractFn('thsDdeRaceBudget'));
eval(extractFn('strategyApplyThsDdeFundFlow'));

(async () => {
  // 3a. 今日:zsType5 主板覆盖 + zjjlr 留档;塌板 bySource[5] 同步覆盖;东财板不动
  const b5 = { zsType: 5, plateId: '308874', netInflow: 1.79e8, netInflowMetric: 'ths-net-inflow' };
  const b6 = { zsType: 6, plateId: 'BK1146', netInflow: 3e8, netInflowMetric: 'eastmoney-super-large-net-inflow',
    bySource: { 5: { zsType: 5, plateId: '308606', netInflow: 0, netInflowMetric: 'ths-net-inflow' } } };
  await strategyApplyThsDdeFundFlow([b5, b6], '2026-07-16');
  A(b5.netInflow === 10.415e8 && b5.netInflowMetric === 'ths-dde-big-order-amount', '今日:同花顺主板 netInflow 覆盖为 DDE(10.415亿)');
  A(b5.netInflowZjjlr === 1.79e8 && b5.ddeBigOrderAmount === 10.415e8, '今日:原 zjjlr 留档 netInflowZjjlr,DDE 存 ddeBigOrderAmount');
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

  // 3d. [Codex P1] 悬挂请求:overlay 必须在总预算内回退,绝不卡住策略构建
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

  // ---- 4. 静态:接线只在策略口径(显式 zsTypes 且不含 7)且含同花顺时生效;失败可观测 ----
  A(/strategyScopedZs = Array\.isArray\(options\.zsTypes\) && options\.zsTypes\.length\s*&& !options\.zsTypes\.map\(Number\)\.includes\(7\)/.test(src),
    '静态:仅显式策略口径(不含 KPL)触发覆盖——复盘/看板默认三源调用不受影响');
  A(/if \(strategyScopedZs && zsTypes\.map\(Number\)\.includes\(5\)\)/.test(src), '静态:仅含同花顺来源时触发');
  A(/strategyMainlineDiagNoteRead\(`ths-dde bk \$\{plateId\}`/.test(src), '静态:单板失败记入诊断上下文(不吞)');
  A(/THS_DDE_AMOUNT_FIELD = '527198'/.test(src), '静态:字段号 527198 常量化(校准记录见合同文档)');
  A(/signal: AbortSignal\.timeout\(THS_DDE_FETCH_TIMEOUT_MS\)/.test(src), '静态:realhead 单请求带 AbortSignal 截止(悬挂请求被真正中止,不留后台占用)');
  A(/const deadline = Date\.now\(\) \+ THS_DDE_OVERLAY_BUDGET_MS/.test(src), '静态:overlay 设总预算截止线,超预算板保持 zjjlr');

  // ---- 5. [Codex P1] 真实 fetchThsBoardDdeAmount:in-flight 去重 / 失败可重试(独立作用域,不与上方 stub 冲突) ----
  await (async function realFetchScope() {
    const THS_DDE_AMOUNT_FIELD = '527198';
    const THS_DDE_CACHE_MS = 90 * 1000;
    const THS_DDE_FETCH_TIMEOUT_MS = 4000;
    const thsDdeAmountCache = new Map();
    const thsDdePendingFetch = new Map();
    const getThsCookieV = async () => 'test-v';
    let fetchCalls = 0;
    let failNext = false;
    const payload = 'quotebridge_v6_realhead_bk_885977_defer_last({"items":{"527198":"1041518380.000"},"o":1})';
    const fetch = async () => {
      fetchCalls++;
      await new Promise((r) => setTimeout(r, 20));   // 模拟网络延迟,让并发窗口真实存在
      if (failNext) { failNext = false; throw new Error('socket hang up'); }
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
  })();

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-THS-DDE-NETINFLOW CHECKS PASSED');
})();
