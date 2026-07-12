// 预判回看扩展测试(node tests/mainline-review.test.js)。
// 覆盖:主线命中评估(当日盘后主因库家族格局 vs 盘中预判家族,top1/top3)、
// 预判明星当日封板确认、盘后主因库缺失不装有数据、旧字段/旧胜率完全兼容。
// 家族判定走生产 strategyMainlineFamilyInfo 全链(不 stub),只 stub 数据库 IO。
const fsReal = require('fs');
const pathReal = require('path');
const ROOT = pathReal.join(__dirname, '..');
const src = fsReal.readFileSync(pathReal.join(ROOT, 'kpl-stats-server.js'), 'utf8');

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
function extractArr(name) {
  const i = src.indexOf('const ' + name + ' = [');
  const start = src.indexOf('[', i);
  let d = 0, j = start;
  for (; j < src.length; j++) { if (src[j] === '[') d++; else if (src[j] === ']') { d--; if (d === 0) break; } }
  return src.slice(i, j + 2).replace('const ', 'var ');
}
function extractSet(name) {
  const m = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) throw new Error('not found set: ' + name);
  return new Set(eval('[' + m[1] + ']'));
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// ---- 生产题材/家族工具(不 stub)----
const THEME_TAXONOMY = JSON.parse(fsReal.readFileSync(pathReal.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
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
eval(extractFn('normalizeReasonSourceCode'));
const isExcludedFromReview = (code) => String(code || '').startsWith('8');  // 夹具:8 开头视作北交所剔除
function isDroppedThemeWord(raw) { return /测试剔除词/.test(String(raw || '')); }

// ---- 待测函数 + 可控 IO stub ----
eval(extractFn('strategyMainlineActualFamilyRanking'));

// stub 环境:交易日 07-06(周一)~07-09;当前"今天"=07-09
const TRADING_DAYS = ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09'];
const readSavedApiKey = async () => 'k';
const chinaNowParts = () => ({ day: '2026-07-09', hour: 16, minute: 0 });
const isoFromCompactDate = d => String(d);
const getRecentTradingDays = async () => TRADING_DAYS.slice();
const CLOSE = {   // day -> { code -> close }
  '2026-07-06': { '002396': 10, '000938': 20, '600588': 30 },
  '2026-07-07': { '002396': 11, '000938': 19, '600588': 30 },
  '2026-07-08': { '002396': 11, '000938': 19, '600588': 30 },
  '2026-07-09': { '002396': 12.1, '000938': 19 },
};
const readEastmoneyCloseDbDay = async d => CLOSE[d]
  ? { stocks: Object.entries(CLOSE[d]).map(([code, close]) => ({ code, name: 'N' + code, close })) }
  : null;
const PREDICTS = {};  // day -> predict payload
const readMainlinePredict = async d => PREDICTS[d] || null;
const MAIN_REASON = {};  // day -> mainReasonDb
const readLimitUpMainReasonDbDay = async d => MAIN_REASON[d] || null;
const LIMIT_UP = {};  // day -> {stocks:[{code}]}
const readLimitUpDbDay = async d => LIMIT_UP[d] || null;

eval(extractFn('getStrategyMainlineReview'));

// ---- 纯函数:实际家族格局 ----
(() => {
  const db = { stocks: [
    { code: '000001', name: 'A', finalBoardTopic: '算力' },
    { code: '000002', name: 'B', finalBoardTopic: '云计算' },     // 与算力同族(group:算力AI)
    { code: '000003', name: 'C', finalBoardTopic: '液冷' },       // 同族不同 key
    { code: '000004', name: 'D', finalBoardTopic: '网络安全' },
    { code: '000005', name: 'E', finalBoardTopic: '其他' },       // 过滤
    { code: '000006', name: 'F', finalBoardTopic: '测试剔除词' }, // dropped 过滤
    { code: '830001', name: 'G', finalBoardTopic: '算力' },       // 排除股过滤
  ] };
  const ranking = strategyMainlineActualFamilyRanking(db);
  A(ranking.length === 2, '实际格局:其他/dropped/排除股全过滤,只剩两个家族');
  A(ranking[0].familyKey === 'group:算力AI' && ranking[0].count === 3, '算力+云计算+液冷合并进算力AI 家族,count=3');
  A(ranking[1].count === 1 && /网络安全/.test(ranking[1].label), '网络安全家族 count=1 列第二');
  A(strategyMainlineActualFamilyRanking(null).length === 0, 'null 库 → 空格局');
})();

// ---- 场景:三天预判,分别命中/前三/脱靶+无库 ----
(async () => {
  // 07-06:预判主线=云计算(算力AI 族);实际第一=算力AI 族 → top1 命中(同族即命中,不要求字面同词)。
  PREDICTS['2026-07-06'] = {
    sessionPhase: '午后', confirmedKey: '',
    top: [
      { key: '算力', theme: '云计算', star: { code: '002396', name: '星网锐捷' }, leader: { code: '000938', name: '紫光股份' } },
    ],
  };
  MAIN_REASON['2026-07-06'] = { stocks: [
    { code: '000001', finalBoardTopic: '算力' }, { code: '000002', finalBoardTopic: '液冷' },
    { code: '000004', finalBoardTopic: '网络安全' },
  ] };
  LIMIT_UP['2026-07-06'] = { stocks: [{ code: '002396' }] };   // 预判明星当日封板 ✓

  // 07-07:预判主线=网络安全,top3 含算力;实际第一=算力AI → top1 ✗ / top3 ✓;明星未封板。
  PREDICTS['2026-07-07'] = {
    sessionPhase: '尾盘', confirmedKey: '',
    top: [
      { key: '网络安全', theme: '网络安全', star: { code: '002396', name: '星网锐捷' }, leader: { code: '600588', name: 'X' } },
      { key: '算力', theme: '算力' },
      { key: '数字货币', theme: '数字货币' },
    ],
  };
  MAIN_REASON['2026-07-07'] = { stocks: [
    { code: '000001', finalBoardTopic: '算力' }, { code: '000002', finalBoardTopic: '算力' },
    { code: '000004', finalBoardTopic: '网络安全' },
  ] };
  LIMIT_UP['2026-07-07'] = { stocks: [{ code: '999999' }] };   // 明星不在 → 未封

  // 07-08:预判主线=数字货币;盘后主因库缺失 → 命中记 null、不计分母。
  PREDICTS['2026-07-08'] = {
    sessionPhase: '上午盘', confirmedKey: '',
    top: [{ key: '数字货币', theme: '数字货币', star: null, leader: { code: '002396', name: '星网锐捷' } }],
  };
  // MAIN_REASON['2026-07-08'] 故意缺失;LIMIT_UP 也缺失

  const out = await getStrategyMainlineReview(10);
  A(out.ok === true && out.days.length === 3, '三天预判全部入列');
  const byDay = new Map(out.days.map(r => [r.day, r]));
  const d6 = byDay.get('2026-07-06'), d7 = byDay.get('2026-07-07'), d8 = byDay.get('2026-07-08');

  // 07-06:同族命中
  A(d6.mainlineHitTop1 === true && d6.mainlineHitTop3 === true, '07-06:预判云计算 vs 实际算力AI → 同族 top1 命中');
  A(d6.actualTop[0] && d6.actualTop[0].count === 2, '07-06:actualTop 第一家族 count=2(算力+液冷)');
  A(d6.phase === '午后', '07-06:带预判冻结时点 phase');
  A(d6.star && d6.star.sealedSameDay === true, '07-06:预判明星当日封板确认 sealedSameDay=true');
  // 旧字段兼容:次日收盘涨幅照旧(10→11 = +10%)
  A(d6.star.nextCloseGain === 10 && d6.star.win === true, '07-06:明星次日涨幅/胜负旧口径不变');
  A(d6.leader.nextCloseGain === -5 && d6.leader.win === false, '07-06:龙头次日涨幅旧口径不变');

  // 07-07:top1 脱靶 / top3 命中
  A(d7.mainlineHitTop1 === false && d7.mainlineHitTop3 === true, '07-07:主预判网络安全脱靶,但前三含算力 → top3 命中');
  A(d7.star.sealedSameDay === false, '07-07:预判明星当日未封板 sealedSameDay=false');

  // 07-08:无盘后主因库 → null,不装有数据
  A(d8.mainlineHitTop1 === null && d8.mainlineHitTop3 === null, '07-08:盘后主因库缺失 → 命中记 null');
  A(Array.isArray(d8.actualTop) && d8.actualTop.length === 0, '07-08:actualTop 为空');

  // stats:主线分母只算有实际格局的两天
  const s = out.stats;
  A(s.mainlineTotal === 2 && s.mainlineTop1Hits === 1 && s.mainlineTop3Hits === 2, 'stats:分母=2(缺库日不计),top1=1,top3=2');
  A(s.mainlineTop1Rate === 50 && s.mainlineTop3Rate === 100, 'stats:top1=50% / top3=100%');
  // 旧胜率字段仍在且口径不变
  A(typeof s.starWins === 'number' && typeof s.leaderWinRate !== 'undefined', 'stats:旧明星/龙头胜率字段保留');

  if (process.exitCode) console.error('\nSOME MAINLINE-REVIEW CHECKS FAILED');
  else console.log('\nALL MAINLINE-REVIEW CHECKS PASSED');
})().catch(e => { console.error(e); process.exitCode = 1; });
