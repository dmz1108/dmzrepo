// 预判回看统计口径测试(node tests/mainline-review.test.js)——Codex 复审 PR#25 六项修复的回归。
// 覆盖:①最新收盘日无次日仍入回看/当日盘中待验证;②仅真实盘中阶段计分母(已收盘剔除);
// ③预期明星四种等级(expected/confirmed/active/旧记录无level);④涨停库缺失→null 不冒充 false;
// ⑤并列第一;⑥主因库不完整覆盖不计分母;⑦真实镜像:7-08已收盘剔除/7-09命中/7-10脱靶=1/2。
// 家族判定走生产 strategyMainlineFamilyInfo 全链(不 stub),只 stub 数据库 IO 与时钟。
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
const STRATEGY_MAINLINE_INTRADAY_PHASES = extractSet('STRATEGY_MAINLINE_INTRADAY_PHASES');

// ---- 待测函数 + 可控 IO/时钟 stub ----
eval(extractFn('strategyMainlineActualFamilyRanking'));
eval(extractFn('strategyMainlineExpectedStarTransitions'));
eval(extractFn('strategyMainlineReserveStarOutcomes'));   // 三要件预备层盘后结果(#201)
eval(extractFn('strategyMainlineReviewFormalTop'));
eval(extractFn('strategyMainlineReviewHasRecord'));

let TODAY = '2026-07-14';           // 次日:全部夹具交易日都算已收盘
let TODAY_CLOSED = true;            // 仅当 day===TODAY 时用
const readSavedApiKey = async () => 'k';
const chinaNowParts = () => ({ day: TODAY, hour: 16, minute: 0 });
const isoFromCompactDate = d => String(d);
const isAfterMarketClose = (day) => day < TODAY ? true : (day > TODAY ? false : TODAY_CLOSED);
let TRADING_DAYS = ['2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-13', '2026-07-14'];
const getRecentTradingDays = async () => TRADING_DAYS.slice();
const CLOSE = {};
const readEastmoneyCloseDbDay = async d => CLOSE[d]
  ? { stocks: Object.entries(CLOSE[d]).map(([code, close]) => ({ code, name: 'N' + code, close })) }
  : null;
const PREDICTS = {};
const readMainlinePredict = async d => PREDICTS[d] || null;
const MAIN_REASON = {};
const readLimitUpMainReasonDbDay = async d => MAIN_REASON[d] || null;
const LIMIT_UP = {};
const readLimitUpDbDay = async d => LIMIT_UP[d] || null;
const KLINE = {};
const KLINE_CALLS = [];
const fetchEastmoneyKline = async (code, options = {}) => {
  KLINE_CALLS.push({ code, requiredThroughDay: options.requiredThroughDay || '' });
  return KLINE[code] || null;
};
const compactDate = value => String(value || '').replace(/\D/g, '').slice(0, 8);
const numOrNull = value => (value == null || value === '' || !Number.isFinite(Number(value))) ? null : Number(value);
const isFiniteNumeric = value => value != null && value !== '' && Number.isFinite(Number(value));
// 完整性检查 stub(语义保真:收盘后保存 + 可靠 + ruleVersion 兼容)
const isSavedAfterMarketClose = (payload) => payload?.savedAtOK === true;
const isReliableLimitUpDbPayload = (payload) => Array.isArray(payload?.stocks) && payload.stocks.length > 0 && payload.reliable !== false;
const isCompatibleMainReasonDb = (payload) => !!payload?.stocks?.length && String(payload?.ruleVersion || '') === 'vOK';

eval(extractFn('strategyKlineBarForDay'));
eval(extractFn('strategyKlineCoversDay'));
eval(extractFn('getStrategyMainlineReview'));

const finalLimitDb = (codes) => ({ savedAtOK: true, reliable: true, stocks: codes.map(code => ({ code, name: 'N' + code })) });
const reasonDb = (rows) => ({ ruleVersion: 'vOK', stocks: rows });

(async () => {
  // ---------- 夹具时间线(TODAY=07-12 周日,全部为已收盘历史日) ----------
  // 07-02(午后,有效):明星 expected,终盘涨停库【缺失】→ sealStatus=noData、sealedSameDay=null(④);
  //                   主因覆盖也因涨停库缺失无法验证 → 命中 null 不计分母。
  PREDICTS['2026-07-02'] = { sessionPhase: '午后', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '002396', name: '星网', level: 'expected' }, leader: null }] };

  // 07-03(早盘,有效):涨停库完整=[600001,600002,830001];主因库只覆盖 600001 →
  //                   缺 600002(830001 剔除后不算)→ mainReasonMissingCount=1、命中 null 不计分母(⑥);
  //                   明星 expected 且不在涨停库 → notSealed,计入封板统计为败(③)。
  PREDICTS['2026-07-03'] = { sessionPhase: '早盘', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '002396', name: '星网', level: 'expected' }, leader: null }] };
  LIMIT_UP['2026-07-03'] = finalLimitDb(['600001', '600002', '830001']);
  MAIN_REASON['2026-07-03'] = reasonDb([{ code: '600001', name: 'A', finalBoardTopic: '算力' }]);

  // 07-06(尾盘,有效):旧记录明星【无 level】→ 等级未知,不进封板统计(③);
  //                   数据完整、预判算力、实际第一=算力AI → top1 命中；保存两个龙头并回看三项收益。
  PREDICTS['2026-07-06'] = { sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '600001', name: '老股' },
      leader: { code: '600014', name: '龙一' },
      leaders: [{ code: '600014', name: '龙一', leadScore: 88 }, { code: '600015', name: '龙二', leadScore: 77 }] }] };
  LIMIT_UP['2026-07-06'] = finalLimitDb(['600001', '600003']);
  MAIN_REASON['2026-07-06'] = reasonDb([
    { code: '600001', name: 'A', finalBoardTopic: '算力' },
    { code: '600003', name: 'C', finalBoardTopic: '算力' }]);
  CLOSE['2026-07-06'] = { '600014': 10, '600015': 20 };
  CLOSE['2026-07-07'] = { '600014': 11 };   // 600015 次收故意缺失，必须由精确日 K 补齐。
  CLOSE['2026-07-09'] = {};                 // 两只股的 3 日收盘均由精确日 K 补齐。
  KLINE['600014'] = { x: ['2026-07-06', '2026-07-07', '2026-07-09'],
    y: [[9.5, 10, 10.2, 9.4], [10.5, 11, 12, 10.4], [12.5, 13, 13.2, 12.4]] };
  KLINE['600015'] = { x: ['2026-07-06', '2026-07-07', '2026-07-09'],
    y: [[19.5, 20, 20.2, 19.2], [20, 18, 21, 17.8], [21, 22, 22.3, 20.8]] };

  // 07-07(上午盘,有效):并列第一(⑤)——网络安全2 vs 数字货币2 vs 半导体1;预判数字货币 →
  //                     命中任意并列第一 = top1 命中;明星 active → 不进封板统计(③)。
  PREDICTS['2026-07-07'] = { sessionPhase: '上午盘', confirmedKey: '', top: [
    { key: '数字货币', theme: '数字货币', star: { code: '600004', name: '活跃股', level: 'active' }, leader: null }] };
  LIMIT_UP['2026-07-07'] = finalLimitDb(['600004', '600005', '600006', '600007', '600008']);
  MAIN_REASON['2026-07-07'] = reasonDb([
    { code: '600004', name: 'D', finalBoardTopic: '网络安全' },
    { code: '600005', name: 'E', finalBoardTopic: '网络安全' },
    { code: '600006', name: 'F', finalBoardTopic: '数字货币' },
    { code: '600007', name: 'G', finalBoardTopic: '数字货币' },
    { code: '600008', name: 'H', finalBoardTopic: '半导体' }]);

  // 07-08(已收盘,②真实镜像):预判算力且"命中",但 sessionPhase=已收盘 → sampleValid=false,
  //                          展示不计任何分母。
  PREDICTS['2026-07-08'] = { sessionPhase: '已收盘', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '002396', name: '星网', level: 'confirmed' }, leader: { code: '000938', name: '紫光' } }] };
  LIMIT_UP['2026-07-08'] = finalLimitDb(['002396']);
  MAIN_REASON['2026-07-08'] = reasonDb([{ code: '002396', name: '星网', finalBoardTopic: '算力' }]);

  // 07-09(尾盘,⑦真实镜像·命中):星网早盘 expected、尾盘已 confirmed；最终 star 状态虽然是 confirmed，
  //        但累计轨迹保留 firstExpectedAt，盘后仍应计为“预期后封板”成功。
  PREDICTS['2026-07-09'] = { sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '002396', name: '星网', level: 'confirmed' }, leader: { code: '000938', name: '紫光' } }],
    starTransitions: [{ mainlineKey: '算力', mainlineTheme: '算力', code: '002396', name: '星网',
      firstExpectedAt: '2026-07-09T01:40:00.000Z', confirmedAt: '2026-07-09T05:10:00.000Z', lastLevel: 'confirmed' }] };
  LIMIT_UP['2026-07-09'] = finalLimitDb(['002396', '600009']);
  MAIN_REASON['2026-07-09'] = reasonDb([
    { code: '002396', name: '星网', finalBoardTopic: '算力' },
    { code: '600009', name: 'I', finalBoardTopic: '算力' }]);
  CLOSE['2026-07-09'] = { ...CLOSE['2026-07-09'], '002396': 10, '000938': 20 };
  CLOSE['2026-07-10'] = { '002396': 11, '000938': 19 };

  // 07-10(尾盘,⑦真实镜像·脱靶 + ①最新收盘日无次日):预判医药,实际第一=商业航天 →
  //        top1/top3 都脱靶;无次日收盘价 → nextCloseGain=null 但主线命中与封板照常;
  //        明星 confirmed → 只展示"当时已确认",不进封板统计(③)。
  PREDICTS['2026-07-10'] = { sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: '医药', theme: '医药', star: { code: '600010', name: '已封星', level: 'confirmed' }, leader: { code: '600011', name: '医药龙' } }] };
  LIMIT_UP['2026-07-10'] = finalLimitDb(['600010', '600012', '600013']);
  MAIN_REASON['2026-07-10'] = reasonDb([
    { code: '600010', name: 'J', finalBoardTopic: '商业航天' },
    { code: '600012', name: 'K', finalBoardTopic: '商业航天' },
    { code: '600013', name: 'L', finalBoardTopic: '医药' }]);

  // 07-13(schema v2):医药盘面候选排名第一,但候选状态为 unscanned 且无明星正证据。
  // 回看必须显示“今日无主线”,不得拿医药参与正式主线命中率。
  PREDICTS['2026-07-13'] = { schemaVersion: 2, sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: 'group:医药', theme: '医药', star: null, leader: { code: '603538', name: '美诺华' } },
    { key: 'theme:特色药', theme: '特色药', star: null, leader: null }],
    candidates: [
      { key: 'group:医药', theme: '医药', l2VerificationStatus: 'unscanned', stars: [] },
      { key: 'theme:特色药', theme: '特色药', l2VerificationStatus: 'unscanned', stars: [] }],
    starTransitions: [] };

  // 07-14(schema v3):两源都正常完成，但均没有通过 L2 明星验证的正式主线。
  // 即使 top 全空，也必须保留日期并显示“今日无主线”。
  PREDICTS['2026-07-14'] = { schemaVersion: 3, sessionPhase: '尾盘', confirmedKey: '',
    hasMainlines: false, recordState: 'no-mainline', top: [], candidates: [], starTransitions: [],
    bySource: {
      eastmoney: { available: true, hasMainlines: false, top: [], candidates: [], starTransitions: [] },
      ths: { available: true, hasMainlines: false, top: [], candidates: [], starTransitions: [] },
    } };
  A(strategyMainlineReviewHasRecord({ schemaVersion: 3, top: [], bySource: {
    eastmoney: { available: false, hasMainlines: false, top: [] },
    ths: { available: false, hasMainlines: false, top: [] },
  } }) === false, '⓪两源都不可用的空档案不得冒充今日无主线');
  A(strategyKlineCoversDay({ x: ['2026-07-23'] }, '2026-07-24') === false,
    '⓪日K最后日期早于目标交易日时不得视为已覆盖');
  A(strategyKlineCoversDay({ x: ['2026-07-23', '2026-07-24'] }, '2026-07-24') === true,
    '⓪日K包含目标交易日时才视为已覆盖');
  A(strategyMainlineFamilyInfo({ key: 'theme:电网设备', theme: '电网设备' }).key
    === strategyMainlineFamilyInfo({ theme: '电网设备' }).key,
    '⓪已有 theme: 前缀的细分题材键保持幂等，不重复生成 theme:theme:');

  const out = await getStrategyMainlineReview(10);
  const byDay = new Map(out.days.map(r => [r.day, r]));
  A(out.ok === true && out.days.length === 9, '九天预判记录全部入列(含双源空 top 的明确无主线日)');

  const d2 = byDay.get('2026-07-02'), d3 = byDay.get('2026-07-03'), d6 = byDay.get('2026-07-06');
  const d7 = byDay.get('2026-07-07'), d8 = byDay.get('2026-07-08'), d9 = byDay.get('2026-07-09'), d10 = byDay.get('2026-07-10');
  const d13 = byDay.get('2026-07-13'), d14 = byDay.get('2026-07-14');

  // ⓪ schema v2 无明星正证据:保留日期行,但不产生正式主线、明星或龙头。
  A(d13?.noMainline === true && d13.theme === '' && d13.noMainlineReason === 'no-l2-star-evidence', '⓪07-13 医药未通过L2明星验证 → 今日无主线');
  A(d13.star === null && d13.leader === null && d13.leaders.length === 0, '⓪无正式主线不回看候选明星/龙头');
  A(d13.mainlineHitTop1 === null && d13.mainlineHitTop3 === null, '⓪无正式主线不进入命中判断');
  A(d14?.noMainline === true && d14.theme === '' && d14.bySource?.eastmoney?.noMainline === true
    && d14.bySource?.ths?.noMainline === true, '⓪双源有效零结果即使 top 全空也保留为今日无主线');

  // ① 下一交易日已知但收盘价尚缺
  A(!!d10 && d10.nextDay === '2026-07-13', '①07-10 正确锚定下一交易日 07-13');
  A(d10.leader && d10.leader.nextCloseGain === null && d10.leader.win === null, '①次日收盘数据缺失 → nextCloseGain=null 不装有数据');
  A(d10.mainlineHitTop1 === false && d10.mainlineHitTop3 === false, '①次日数据缺失不影响当日主线命中评判(照常=脱靶)');

  // ② 已收盘不计样本(7-08 真实镜像)
  A(d8.sampleValid === false && d8.sampleInvalidReason === 'phase:已收盘', '②07-08 已收盘 → sampleValid=false + 明确原因');
  A(d8.mainlineHitTop1 === true, '②07-08 命中照常展示(只是不计分母)');

  // ③ 四种明星等级
  A(d9.star.predictLevel === 'confirmed', '③最终快照允许显示 confirmed');
  A(d9.expectedStars.length === 1 && d9.expectedStars[0].sealStatus === 'sealed'
    && !!d9.expectedStars[0].confirmedAt, '③expected→confirmed 轨迹保留并计封板成功');
  A(d3.star.predictLevel === 'expected' && d3.star.sealStatus === 'notSealed' && d3.star.sealedSameDay === false, '③expected+未封 → notSealed 计败');
  A(d10.star.predictLevel === 'confirmed', '③confirmed → 只展示"当时已确认"');
  A(d7.star.predictLevel === 'active', '③active → 不进封板统计');
  A(d6.star.predictLevel === null, '③旧记录无 level → predictLevel=null(等级未知)');

  // ④ 涨停库缺失 → null 不冒充 false
  A(d2.star.sealedSameDay === null && d2.star.sealStatus === 'noData', '④终盘涨停库缺失 → sealedSameDay=null(数据不足,不是 false)');

  // ⑤ 回看两名龙头:次日最高、次日收盘、第三个后续交易日收盘。
  A(d6.thirdDay === '2026-07-09' && d6.leaders.length === 2, '⑤龙头前两名均入回看且第三个后续交易日锚定正确');
  A(d6.leaders[0].leadScore === 88 && d6.leaders[0].nextHighGain === 20
    && d6.leaders[0].nextCloseGain === 10 && d6.leaders[0].threeDayGain === 30, '⑤龙头1三项收益计算正确');
  A(d6.leaders[1].leadScore === 77 && d6.leaders[1].nextHighGain === 5
    && d6.leaders[1].nextCloseGain === -10 && d6.leaders[1].threeDayGain === 10, '⑤龙头2三项收益计算正确');
  A(KLINE_CALLS.some(call => call.code === '600014' && call.requiredThroughDay === '2026-07-09'),
    '⑤回看日K请求显式要求覆盖第三个后续交易日');

  // ⑥ 并列第一
  A(d7.actualFirstTied === true, '⑤网络安全2=数字货币2 → 并列第一标记');
  A(d7.mainlineHitTop1 === true, '⑤预判命中任意并列第一家族 → top1 命中');
  A(d7.actualTop.filter(t => t.rankTier === 1).length === 2, '⑤actualTop 完整包含两个并列第一家族');
  A(d7.actualTop.some(t => t.rankTier === 2), '⑤Top3 按名次层级(半导体进第二层级),非数组截断');

  // ⑦ 主因库不完整覆盖
  A(d3.mainlineHitTop1 === null && d3.mainReasonMissingCount === 1, '⑥主因库缺 1 只涨停股 → 命中 null + 返回缺失数(830001 剔除后不计缺)');
  A(d2.mainlineHitTop1 === null && d2.mainReasonMissingCount === null, '⑥涨停库缺失无法验证覆盖 → 命中 null');

  // ⑧ 真实镜像统计:有效分母 = 07-06(命中)+07-07(命中)+07-09(命中)+07-10(脱靶)=4;
  //    07-08(已收盘)/07-02/07-03(数据不完整)不计。
  const s = out.stats;
  A(s.mainlineTotal === 4 && s.mainlineTop1Hits === 3, '⑦分母只含有效盘中样本:4 天,top1=3(已收盘/不完整均剔除)');
  A(s.expectedSealTotal === 2 && s.expectedSealWins === 1 && s.expectedSealRate === 50, '⑦预期明星封板统计:仅 expected 计入 = 1/2(confirmed/active/无level 不计)');
  // 明星/龙头次日胜率也只计有效样本:d6 leader +10% 胜,d9 star +10% 胜,d9 leader -5% 败;
  // d8(已收盘)有次日数据但不计。
  A(s.starTotal === 1 && s.starWins === 1, '⑦明星次日胜率分母剔除已收盘样本');
  A(s.leaderTotal === 2 && s.leaderWins === 1 && s.leaderWinRate === 50, '⑦龙头1次日胜率按有效样本统计且剔除已收盘样本');

  // ---------- 当日盘中:待盘后验证 ----------
  TODAY = '2026-07-10'; TODAY_CLOSED = false;
  TRADING_DAYS = ['2026-07-08', '2026-07-09', '2026-07-10'];
  const out2 = await getStrategyMainlineReview(10);
  const t10 = out2.days.find(r => r.day === '2026-07-10');
  A(!!t10 && t10.pendingReview === true, '①当日盘中 → pendingReview=true(待盘后验证)');
  A(t10.star.sealStatus === 'pending' && t10.star.sealedSameDay === null, '①当日盘中明星封板 → pending/null');
  A(out2.stats.mainlineTotal === 1, '①当日盘中不计命中分母(仅 07-09 计入)');

  // ---------- 三审 P1:东财空 + 同花顺有预测 → 该日不被跳过,同花顺分母/命中被统计 ----------
  TODAY = '2026-07-14'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-07-10', '2026-07-13'];
  PREDICTS['2026-07-13'] = { sessionPhase: '早盘', confirmedKey: '', schemaVersion: 3, top: [], candidates: [], starTransitions: [],
    bySource: {
      eastmoney: { available: true, hasMainlines: false, top: [], candidates: [], starTransitions: [] },   // 东财当日有效零结果:顶层兼容 top 也为空
      ths: { available: true, hasMainlines: true, top: [{ key: '算力', theme: '算力', l2VerificationStatus: 'qi', star: null, leader: null }],
             candidates: [{ key: '算力', l2VerificationStatus: 'qi' }], starTransitions: [] },
    } };
  LIMIT_UP['2026-07-13'] = finalLimitDb(['600020']);
  MAIN_REASON['2026-07-13'] = reasonDb([{ code: '600020', name: 'X', finalBoardTopic: '算力' }]);
  const out3 = await getStrategyMainlineReview(10);
  const r13 = out3.days.find(r => r.day === '2026-07-13');
  A(!!r13, '三审P1:东财空+同花顺有预测,该日仍进入回看(不被顶层空 top 跳过)');
  A(!!(r13 && r13.bySource) && r13.bySource.eastmoney.noMainline === true, '三审P1:东财该日无主线(noMainline)');
  A(!!(r13 && r13.bySource) && r13.bySource.ths.mainlineHitTop1 === true, '三审P1:同花顺预判算力=当日实际第一 → top1 命中');
  A(out3.stats.bySource.ths.mainlineTotal >= 1 && out3.stats.bySource.ths.mainlineTop1Hits >= 1, '三审P1:同花顺命中进入 stats.bySource 分母/命中(不系统性漏样本)');
  A(out3.stats.bySource.eastmoney.mainlineTotal === 0, '三审P1:东财该日无主线,不计东财分母(不借同花顺凑数)');

  // ---------- 四审 P2:盘后主因不完整时仍返回两源主题,仅命中保持 null ----------
  MAIN_REASON['2026-07-13'] = reasonDb([]);
  const out4 = await getStrategyMainlineReview(10);
  const incomplete13 = out4.days.find(r => r.day === '2026-07-13');
  A(!!incomplete13?.bySource, '四审P2:主因库不完整时仍返回 row.bySource,前端不退回东财兼容字段');
  A(incomplete13.bySource.eastmoney.noMainline === true && incomplete13.bySource.ths.theme === '算力', '四审P2:东财无主线/同花顺算力的两源状态均保留');
  A(incomplete13.bySource.ths.mainlineHitTop1 === null && incomplete13.bySource.ths.mainlineHitTop3 === null, '四审P2:真实家族不完整时同花顺命中保持 null,不伪造结果');

  // ---------- 四审终审 P2:来源暂缺与有效无主线不能混写；早期 v3 空块诚实标未知 ----------
  PREDICTS['2026-07-13'].bySource.eastmoney = {
    available: false, hasMainlines: false, reason: 'source-unavailable', message: '东财当时暂不可用',
    top: [], candidates: [], starTransitions: [],
  };
  const out5 = await getStrategyMainlineReview(10);
  const unavailable13 = out5.days.find(r => r.day === '2026-07-13');
  A(unavailable13.bySource.eastmoney.status === 'unavailable' && unavailable13.bySource.eastmoney.available === false, '终审P2:来源暂缺返回 unavailable/available=false');
  A(unavailable13.bySource.eastmoney.noMainline === false && unavailable13.bySource.eastmoney.reason === 'source-unavailable', '终审P2:来源暂缺不冒充“无主线”，并保留原因');
  A(unavailable13.bySource.ths.status === 'mainline' && unavailable13.bySource.ths.theme === '算力', '终审P2:另一来源继续独立返回主线');

  delete PREDICTS['2026-07-13'].bySource.eastmoney.available;
  delete PREDICTS['2026-07-13'].bySource.eastmoney.hasMainlines;
  const out6 = await getStrategyMainlineReview(10);
  const oldV3 = out6.days.find(r => r.day === '2026-07-13');
  A(oldV3.bySource.eastmoney.status === 'unknown' && oldV3.bySource.eastmoney.noMainline === false, '终审P2:早期 v3 空块缺可用性元数据时标 unknown，不猜成无主线/暂缺');

  if (process.exitCode) console.error('\nSOME MAINLINE-REVIEW CHECKS FAILED');
  else console.log('\nALL MAINLINE-REVIEW CHECKS PASSED');
})().catch(e => { console.error(e); process.exitCode = 1; });
