// R2 同源配对 + KPL 剔除测试(node tests/strategy-source-pairs.test.js)——Owner 定稿 2026-07-15。
// 校验:strategyMainlineSourcePairs 按源(东财6/同花顺5)各取净流入最大板,净流入与涨幅同板一一对应;
//       KPL(7)在策略取板层剔除(STRATEGY_ZS_TYPES=[6,5]);前端卡片渲染两组同源配对。
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
const isFiniteNumeric = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
eval(extractFn('strategyMainlineSourcePairs'));

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. 按源各取净流入最大板,净流入与涨幅取自同一板
const boards = [
  { name: '东财板A', zsType: 6, netInflow: 8e8, gainPct: 3.1 },
  { name: '东财板B', zsType: 6, netInflow: 14e8, gainPct: 2.2 },   // 东财净流入最大 → 应取它,涨幅 2.2(它自己的)
  { name: '同花顺板X', zsType: 5, netInflow: 5e8, gainPct: 6.6 },
  { name: '同花顺板Y', zsType: 5, netInflow: 9e8, gainPct: 4.4 },   // 同花顺净流入最大 → 取它,涨幅 4.4
  { name: 'KPL板Z', zsType: 7, netInflow: 99e8, gainPct: 9.9 },     // KPL 不参与,即便钱最大也不出现
];
const sp = strategyMainlineSourcePairs(boards);
A(sp.eastmoney && sp.eastmoney.board === '东财板B' && sp.eastmoney.netInflow === 14e8 && sp.eastmoney.gainPct === 2.2,
  '东财组=净流入最大的东财板,净流入与涨幅同板(14亿/2.2%,不取涨幅更高的东财板A)');
A(sp.ths && sp.ths.board === '同花顺板Y' && sp.ths.netInflow === 9e8 && sp.ths.gainPct === 4.4,
  '同花顺组=净流入最大的同花顺板,净流入与涨幅同板(9亿/4.4%)');

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
A(html.includes("one('东财', sp.eastmoney)") && html.includes("one('同花顺', sp.ths)"), '前端渲染东财与同花顺两组');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-SOURCE-PAIRS CHECKS PASSED');
