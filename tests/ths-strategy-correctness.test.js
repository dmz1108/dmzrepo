// 同花顺实时策略口径回归测试(node tests/ths-strategy-correctness.test.js)。
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

const THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
const THEME_NONBROAD = (THEME_TAXONOMY.taxonomy || []).filter(item => !item.broad);
const THEME_BROAD = (THEME_TAXONOMY.taxonomy || []).filter(item => item.broad);
const numOrNull = value => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const isFiniteNumeric = value => value != null && value !== '' && Number.isFinite(Number(value));

eval(extractFn('themeDisplayName'));
eval(extractFn('themeKeywordMatches'));
eval(extractFn('strategyThemeTaxonomyInfo'));
eval(extractFn('strategyMainlineRealtimeThemeName'));
eval(extractFn('strategyCreateMainlineSeed'));
eval(extractFn('strategyEnsureMainlineSeedShape'));
eval(extractFn('strategyMainlineRecordNetInflow'));
eval(extractFn('strategyMainlineRepresentativeBoardInflow'));

assert(strategyMainlineRealtimeThemeName('医药电商') === '医药电商', '细分板块医药电商不再泛化成医药');
assert(strategyMainlineRealtimeThemeName('创新药') === '创新药', '明确细分题材创新药保持原名');
assert(strategyMainlineRealtimeThemeName('医药概念') === '医药', '纯宽口径医药概念仍规范为医药');

const seed = strategyCreateMainlineSeed('医药电商', '医药电商');
strategyMainlineRecordNetInflow(seed, { name: '创新药', zsType: 5 }, 5e8);
strategyMainlineRecordNetInflow(seed, { name: '医药电商', zsType: 5 }, 18.91e8);
strategyMainlineRecordNetInflow(seed, { name: '特色药', zsType: 5 }, 3e8);
assert(seed.netInflowTotal === 18.91e8, '重叠同花顺概念资金采用最大单板值而非相加');
assert(seed.netInflowBoard === '医药电商' && seed.netInflowZsType === 5, '代表板块名称与来源随资金值保留');

const representative = strategyMainlineRepresentativeBoardInflow([
  { name: '创新药', zsType: 5, netInflow: 5e8 },
  { name: '医药电商', zsType: 5, netInflow: 18.91e8 },
  { name: '特色药', zsType: 5, netInflow: 3e8 },
]);
assert(representative.value === 18.91e8, '家族合并同样采用单一代表板块资金');
assert(representative.boardName === '医药电商' && representative.zsType === 5, '家族合并保留代表板块来源');

const fetchStocksStart = src.indexOf('async function fetchThsConceptStocks');
const persistedRead = src.indexOf('const persisted = await readThsConceptBoard(code)', fetchStocksStart);
const webFallback = src.indexOf('const members = await fetchThsConceptMembers(code)', fetchStocksStart);
assert(fetchStocksStart >= 0 && persistedRead > fetchStocksStart && webFallback > persistedRead,
  '同花顺成分股先读持久化成员库，再回退慢速网页抓取');
assert(src.includes("netInflowAggregation: 'representative-board-max'"), '接口声明代表单板资金聚合口径');
assert(src.includes('netInflowZsType: mainline.netInflowZsType ?? null'), 'AI只读证据接口保留资金来源');
assert(!src.includes('netItems.reduce((sum, item) => sum + Number(item.netInflow), 0)'), '家族资金不再相加');

assert(html.includes('资金口径') && html.includes('同花顺') && html.includes('（单板）'), '前端明确展示资金板块、来源和单板口径');
let scriptsCompile = true;
for (const match of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try {
    new Function(match[1]);
  } catch (error) {
    scriptsCompile = false;
    console.error(`inline script compile failed: ${error.message}`);
  }
}
assert(scriptsCompile, '行情页内联脚本可编译');

console.log(process.exitCode ? 'SOME THS STRATEGY CHECKS FAILED' : 'ALL THS STRATEGY CHECKS PASSED');
