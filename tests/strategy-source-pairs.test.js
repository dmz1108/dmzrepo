// R2 同源配对 + KPL 剔除测试(node tests/strategy-source-pairs.test.js)——Owner 定稿 2026-07-15。
// 校验:strategyMainlineSourcePairs 按源(东财6/同花顺5)各取净流入最大板,净流入与涨幅同板一一对应;
//       KPL(7)在策略取板层剔除(STRATEGY_ZS_TYPES=[6,5]);前端卡片渲染两组同源配对。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFnFrom(text, name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = text.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = text.indexOf('{', text.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < text.length; i++) { if (text[i] === '{') depth++; else if (text[i] === '}') { depth--; if (depth === 0) break; } }
  return text.slice(m.index, i + 1);
}
const extractFn = name => extractFnFrom(src, name);
const extractHtmlFn = name => extractFnFrom(html, name);
const isFiniteNumeric = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
const numOrNull = v => isFiniteNumeric(v) ? Number(v) : null;
eval(extractFn('strategyMainlineSourcePairs'));

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. 按源各取净流入最大板,净流入与涨幅取自同一板
const boards = [
  { name: '东财板A', zsType: 6, netInflow: 8e8, netInflowMetric: 'eastmoney-super-large-net-inflow', gainPct: 3.1 },
  { name: '东财板B', zsType: 6, netInflow: 14e8, netInflowMetric: 'eastmoney-super-large-net-inflow', gainPct: 2.2 },   // 东财超大单净流入最大 → 应取它,涨幅 2.2(它自己的)
  { name: '同花顺板X', zsType: 5, netInflow: 5e8, netInflowZjjlr: -1e8, netInflowMetric: 'ths-dde-big-order-amount', gainPct: 6.6 },
  { name: '同花顺板Y', zsType: 5, netInflow: 9e8, netInflowZjjlr: 2e8, netInflowMetric: 'ths-dde-big-order-amount', gainPct: 4.4 },   // 同花顺 DDE 最大 → 取它,方向与涨幅也取它自己的
  { name: 'KPL板Z', zsType: 7, netInflow: 99e8, gainPct: 9.9 },     // KPL 不参与,即便钱最大也不出现
];
const sp = strategyMainlineSourcePairs(boards);
A(sp.eastmoney && sp.eastmoney.board === '东财板B' && sp.eastmoney.netInflow === 14e8 && sp.eastmoney.gainPct === 2.2,
  '东财组=超大单净流入最大的东财板,资金与涨幅同板(14亿/2.2%,不取涨幅更高的东财板A)');
A(sp.eastmoney.metric === 'eastmoney-super-large-net-inflow' && sp.eastmoney.legacy === false,
  '东财组向接口保留超大单资金口径元数据');
A(sp.ths && sp.ths.board === '同花顺板Y' && sp.ths.netInflow === 9e8 && sp.ths.gainPct === 4.4,
  '同花顺组=DDE 活跃度最大的同花顺板,DDE 与涨幅同板(9亿/4.4%)');
A(sp.ths.directionNetInflow === 2e8 && sp.ths.directionMetric === 'ths-net-inflow-zjjlr',
  '同花顺组另行携带同一代表板块的 zjjlr 方向，不与 DDE 金额混列');

// 2. 缺某源 → 该组为 null;KPL 永不成组
const onlyEm = strategyMainlineSourcePairs([{ name: 'E', zsType: 6, netInflow: 3e8, gainPct: 1 }, { name: 'K', zsType: 7, netInflow: 50e8, gainPct: 9 }]);
A(onlyEm.eastmoney && onlyEm.ths === null, '只有东财板 → 同花顺组 null;KPL 板不成组');
A(strategyMainlineSourcePairs([]).eastmoney === null && strategyMainlineSourcePairs([]).ths === null, '空板 → 两组均 null');
A(strategyMainlineSourcePairs([{ name: 'K', zsType: 7, netInflow: 50e8, gainPct: 9 }]).eastmoney === null, '仅 KPL 板 → 东财组仍 null(KPL 完全不计)');

// 3. 净流入缺失的板不参与选取
const noInflow = strategyMainlineSourcePairs([
  { name: '东财无钱', zsType: 6, gainPct: 8 },
  { name: '东财有钱', zsType: 6, netInflow: 2e8, gainPct: 1 },
]);
A(noInflow.eastmoney.board === '东财有钱', '净流入缺失的板不作代表(按有净流入的板选)');

// 4. 静态:KPL 剔除口径
A(src.includes('const STRATEGY_ZS_TYPES = [6, 5];'), 'STRATEGY_ZS_TYPES=[6,5] 定义存在(剔除 KPL 7)');
A(!/for \(const zsType of \[6, 5, 7\]\)/.test(extractFn('getStrategyBoardsForDay')), 'getStrategyBoardsForDay 不再遍历 [6,5,7]');
A(!/for \(const zsType of \[6, 5, 7\]\)/.test(extractFn('collectStrategyQiCodes')), 'collectStrategyQiCodes 不再遍历 [6,5,7]');
A((src.match(/for \(const zsType of STRATEGY_ZS_TYPES\)/g) || []).length >= 3, '策略取板与 QI 基线均改用 STRATEGY_ZS_TYPES');

// 5. 静态:后端主线对象与 AI 证据携带 sourcePairs
A((src.match(/sourcePairs: strategyMainlineSourcePairs\(/g) || []).length >= 2, '合并路径与 seeds 路径均输出 sourcePairs');
A(src.includes('sourcePairs: mainline.sourcePairs || null'), 'AI 只读证据携带 sourcePairs');

// 6. 静态:前端渲染两组同源配对
A(html.includes('function strategyMainlineSourcePairsHTML(m)'), '前端存在 sourcePairs 渲染函数');
A(html.includes('${strategyMainlineSourcePairsHTML(m)}'), '卡片模板调用 sourcePairs 渲染');
A(html.includes("one(eastmoneyLabel, sp.eastmoney)") && html.includes("one('同花顺·DDE活跃', sp.ths, true)"), '前端渲染东财与同花顺两组');
A(html.includes("'东财·超大单'") && html.includes("'东财·旧主力'"), '前端区分东财超大单新口径与旧主力快照');
A(html.includes("headMetric('全量方向'") && html.includes('strategyThsDirectionMeta'), '策略卡片把 DDE 活跃度与 zjjlr 全量方向分开显示');

// 7. 执行前端格式化函数，确保接口字段在真实 HTML 中仍保持“活跃度/方向”分列。
const escapeHTML = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmtInflow = value => `${(Number(value) / 1e8).toFixed(2)}亿`;
eval(extractHtmlFn('strategyThsDirectionMeta'));
eval(extractHtmlFn('strategyMainlineSourcePairsHTML'));
eval(extractHtmlFn('strategyMainlineDisplayInflow'));
const renderedPairs = strategyMainlineSourcePairsHTML({ sourcePairs: sp });
A(renderedPairs.includes('同花顺·DDE活跃') && renderedPairs.includes('9.00亿') && renderedPairs.includes('方向 2.00亿'),
  '前端 sourcePairs 实际渲染同时包含 DDE 活跃度与同板 zjjlr 方向');
const renderedOutflow = strategyMainlineSourcePairsHTML({
  sourcePairs: { eastmoney: null, ths: { board: '同花顺板X', netInflow: 9e8, directionNetInflow: -2e8, gainPct: 1 } },
});
A(renderedOutflow.includes('方向已转负 -2.00亿'), '同花顺负方向在前端明确显示“方向已转负”警示');
const displayInflow = strategyMainlineDisplayInflow({
  resonanceBoards: [{ name: '同花顺板Y', zsType: 5, netInflow: 9e8, netInflowZjjlr: 2e8, netInflowMetric: 'ths-dde-big-order-amount' }],
});
A(displayInflow.value === 9e8 && displayInflow.directionNetInflow === 2e8,
  '策略卡片代表板格式化不会把 DDE 活跃度覆盖成方向金额');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-SOURCE-PAIRS CHECKS PASSED');
