// 龙头指标的主线家族回归测试(node tests/leader-family-metrics.test.js)。
// 验证同一股票出现在多个主线卡片时,mainZt10Count 按「股票 + 家族」独立累计。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') { depth -= 1; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
function extractArr(name) {
  const i = src.indexOf('const ' + name + ' = [');
  const start = src.indexOf('[', i);
  let depth = 0, j = start;
  for (; j < src.length; j += 1) {
    if (src[j] === '[') depth += 1;
    else if (src[j] === ']') { depth -= 1; if (depth === 0) break; }
  }
  return src.slice(i, j + 2).replace('const ', 'var ');
}
function extractSet(name) {
  const m = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) throw new Error('not found set: ' + name);
  return new Set(eval('[' + m[1] + ']'));
}
const A = (condition, message) => {
  if (!condition) { console.error('FAIL: ' + message); process.exitCode = 1; }
  else console.log('ok: ' + message);
};

const THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
const THEME_NONBROAD = (THEME_TAXONOMY.taxonomy || []).filter(t => !t.broad);
const THEME_BROAD = (THEME_TAXONOMY.taxonomy || []).filter(t => t.broad);
eval(extractArr('PRIMARY_TOPIC_CLUSTERS'));
eval(extractFn('themeDisplayName'));
eval(extractFn('themeKeywordMatches'));
eval(extractFn('standardTheme'));
eval(extractFn('topicAliasSet'));
eval(extractFn('canonicalTopicName'));
eval(extractFn('consensusKey'));
eval(extractFn('strategyResonanceTopicKey'));
eval(extractFn('strategyThemeTaxonomyInfo'));
eval(extractFn('strategyMainlineTopicKey'));
const STRATEGY_MAINLINE_MERGE_GROUPS = extractSet('STRATEGY_MAINLINE_MERGE_GROUPS');
const STRATEGY_MAINLINE_KEEP_FINE_THEMES = extractSet('STRATEGY_MAINLINE_KEEP_FINE_THEMES');
eval(extractFn('strategyMainlineFamilyInfo'));

const normalizeReasonSourceCode = value => String(value || '').trim();
const TD31 = Array.from({ length: 31 }, (_, i) => `d${String(i).padStart(2, '0')}`);
TD31[30] = '2026-07-10';
const getRecentTradingDays = async () => TD31;
const closeRows = {
  '2026-07-10': [{ code: '000001', close: 11 }, { code: '000002', close: 22 }],
  [TD31[20]]: [{ code: '000001', close: 10 }, { code: '000002', close: 20 }],
  [TD31[0]]: [{ code: '000001', close: 8 }, { code: '000002', close: 16 }],
};
const readEastmoneyCloseDbDay = async day => ({ stocks: closeRows[day] || [] });
const reasonRows = {
  [TD31[28]]: [{ code: '000001', finalBoardTopic: '云计算' }],
  [TD31[29]]: [{ code: '000001', finalBoardTopic: '数据中心' }],
  '2026-07-10': [
    { code: '000001', finalBoardTopic: '网络安全' },
    { code: '000002', finalBoardTopic: '光模块' },
  ],
};
const readLimitUpMainReasonDbDay = async day => ({ stocks: reasonRows[day] || [] });
const readLimitUpDbDay = async day => ({
  stocks: reasonRows[day] || [],
});
eval(extractFn('enrichReviewLeaderMetrics'));

(async () => {
  const rows = [
    { code: '000001', finalBoardTopic: '算力AI' },
    { code: '000001', finalBoardTopic: '网络安全' },
    { code: '000002', finalBoardTopic: '光模块' },
  ];
  await enrichReviewLeaderMetrics(rows, '2026-07-10', 'key');
  A(rows[0].mainZt10Count === 2, '算力AI 行累计同族的云计算+数据中心两次主因');
  A(rows[1].mainZt10Count === 1, '同一股票的网络安全行只累计网络安全一次,不被算力行覆盖');
  A(rows[2].mainZt10Count === 1, '光模块按独立光通信家族累计一次');
  A(rows[0].zt10Count === 3 && rows[1].zt10Count === 3, '同一股票总涨停次数仍按股票累计,与主线家族无关');
  A(rows[0].gain10 === 10 && rows[0].gain30 === 37.5, '10日/30日收盘涨幅口径保持不变');
  if (!process.exitCode) console.log('ALL CHECKS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
