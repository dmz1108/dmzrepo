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
const numOrNull = value => value === null || value === undefined || value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
const isoFromCompactDate = value => String(value || '');
const isCompleteCloseDbPayload = payload => payload?.complete !== false;
const isSavedAfterMarketClose = (payload, day) => payload?.day === day && payload?.final !== false;
const isSavedAtOrAfterMarketCloseForDay = (payload, day) => payload?.day === day && payload?.final !== false;
let currentDay = '2026-07-10';
const chinaNowParts = () => ({ day: currentDay });
const TD31 = Array.from({ length: 31 }, (_, i) => `d${String(i).padStart(2, '0')}`);
TD31[30] = '2026-07-10';
let requestedTradingDayCount = 0;
const getRecentTradingDays = async (_day, _key, needed) => { requestedTradingDayCount = needed; return TD31; };
const closeRows = {
  '2026-07-10': [{ code: '000001', close: 11, gain: 6.8 }, { code: '000002', close: 22, gain: 5.1 }],
  [TD31[29]]: [{ code: '000001', close: 10.5 }, { code: '000002', close: 21 }],
  [TD31[20]]: [{ code: '000001', close: 10 }, { code: '000002', close: 20 }],
  [TD31[0]]: [{ code: '000001', close: 8 }, { code: '000002', close: 16 }],
};
let targetCloseEnabled = true;
const readEastmoneyCloseDbDay = async day => {
  if (day === '2026-07-10' && !targetCloseEnabled) return null;
  return { day, savedAt: `${day}T15:30:00+08:00`, complete: true, final: true, stocks: closeRows[day] || [] };
};
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
eval(extractFn('strategyLeaderTargetDayGain'));
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
  A(requestedTradingDayCount === 31 &&
    rows[0].gain10WindowStartDay === TD31[21] && rows[0].gain30WindowStartDay === TD31[1] &&
    rows[0].gain10BaseDay === TD31[20] && rows[0].gain30BaseDay === TD31[0],
    '10/30日窗口为前9/29个交易日加目标日,累计收益基准为各窗口首日前一日收盘');
  A(rows[0].gain10 === 10 && rows[0].gain30 === 37.5 && rows[0].targetDayGain === 6.8,
    '盘后使用目标日最终收盘价并保留目标日涨幅');
  A(rows[0].targetPriceState === 'post-close-final' && rows[0].gainWindowEndDay === '2026-07-10',
    '盘后价格状态与窗口锚日显式记录');

  targetCloseEnabled = false;
  const intradayRows = [{ code: '000001', finalBoardTopic: '算力AI', gain: 6.8 }];
  await enrichReviewLeaderMetrics(intradayRows, '2026-07-10', 'key');
  A(intradayRows[0].targetPriceState === 'intraday-live' && intradayRows[0].targetDayGain === 6.8,
    '目标日收盘库未形成时只在今天使用实时涨幅');
  A(intradayRows[0].gain10 === 12.14 && intradayRows[0].gain30 === 40.18,
    '盘中用昨收和目标日实时涨幅推导目标价,10/30日涨幅均包含目标日');

  currentDay = '2026-07-11';
  const historicalMissingRows = [{ code: '000001', finalBoardTopic: '算力AI', gain: 6.8 }];
  await enrichReviewLeaderMetrics(historicalMissingRows, '2026-07-10', 'key');
  A(historicalMissingRows[0].targetDayGain === null && strategyLeaderTargetDayGain(historicalMissingRows[0]) === null &&
    historicalMissingRows[0].gain10 === null && historicalMissingRows[0].targetPriceState === 'missing',
    '历史日缺合格收盘证据时保持缺失,不把残留gain冒充目标日数据');
  if (!process.exitCode) console.log('ALL CHECKS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
