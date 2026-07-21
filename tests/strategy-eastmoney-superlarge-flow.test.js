// 策略页东财资金口径回归测试(node tests/strategy-eastmoney-superlarge-flow.test.js)。
// 今日实时继续保留 f62 主力净流入；策略页只使用 f66 超大单净流入。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFn(name) {
  const match = src.match(new RegExp(`(?:async )?function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let end = bodyStart;
  for (; end < src.length; end += 1) {
    if (src[end] === '{') depth += 1;
    else if (src[end] === '}' && --depth === 0) break;
  }
  return src.slice(match.index, end + 1);
}

const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

const numOrNull = value => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

eval(extractFn('normalizeEastmoneyConceptBoard'));
eval(extractFn('strategyBoardFundFlowForSource'));

const normalized = normalizeEastmoneyConceptBoard({
  f12: 'BK0579',
  f14: '云计算',
  f3: 1.25,
  f62: 17e8,
  f66: 3e8,
  f69: 0.72,
  f72: 14e8,
  f75: 3.36,
});
assert(normalized.netInflow === 17e8, '东财板块模型继续保留 f62 主力净流入，供今日实时使用');
assert(normalized.superLargeNetInflow === 3e8, '东财板块模型新增 f66 超大单净流入');
assert(normalized.largeNetInflow === 14e8, '东财板块模型新增 f72 大单净流入');
assert(normalized.superLargeNetInflowRatio === 0.72 && normalized.largeNetInflowRatio === 3.36,
  '东财板块模型保留 f69/f75 分档占比');

const strategyEastmoney = strategyBoardFundFlowForSource(normalized, 6);
assert(strategyEastmoney.value === 3e8, '策略页东财资金选择 f66，不选择 f62');
assert(strategyEastmoney.metric === 'eastmoney-super-large-net-inflow' && strategyEastmoney.legacy === false,
  '策略页东财新数据携带超大单口径元数据');

const strategyThs = strategyBoardFundFlowForSource({ netInflow: 9e8 }, 5);
assert(strategyThs.value === 9e8 && strategyThs.metric === 'ths-net-inflow', '同花顺策略资金口径保持不变');

const legacySnapshot = strategyBoardFundFlowForSource({ netInflow: 12e8 }, 6, { allowLegacyEastmoney: true });
assert(legacySnapshot.value === 12e8 && legacySnapshot.metric === 'eastmoney-main-net-inflow-legacy' && legacySnapshot.legacy,
  '旧东财快照可读取 f62，但必须明确标记为旧主力口径');

const liveMissingF66 = strategyBoardFundFlowForSource({ netInflow: 12e8 }, 6);
assert(liveMissingF66.value === null && liveMissingF66.metric === 'eastmoney-super-large-net-inflow',
  '实时东财缺少 f66 时保持缺失，不静默拿 f62 冒充超大单');

assert(src.includes("const fields = 'f12,f14,f3,f62,f66,f69,f72,f75,f104,f105,f128,f140,f141';"),
  '东财实时请求包含 f66/f69/f72/f75');
assert(src.includes('netInflow: numOrNull(view.netInflow)') && src.includes('superLargeNetInflow: numOrNull(view.superLargeNetInflow)'),
  '看板快照同时保存 f62 与 f66，今日实时原口径不被替换');
assert(html.includes('东财超大单/同花顺 DDE 活跃度+方向'), '策略页标题明确两源不同资金口径');
assert(html.includes('function strategyMainlineFundLabel'), '策略卡片存在资金口径标签函数');
assert(html.includes("return negative ? '超大单净流出' : '超大单净流入';"), '东财新口径显示超大单净流入/流出');
assert(html.includes("return negative ? '旧主力净流出' : '旧主力净流入';"), '旧快照不会被误标成超大单');

console.log(process.exitCode ? 'SOME EASTMONEY SUPER-LARGE FLOW CHECKS FAILED' : 'ALL EASTMONEY SUPER-LARGE FLOW CHECKS PASSED');
