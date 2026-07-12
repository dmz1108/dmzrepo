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

let TODAY = '2026-07-12';           // 周日:全部历史交易日都算已收盘
let TODAY_CLOSED = true;            // 仅当 day===TODAY 时用
const readSavedApiKey = async () => 'k';
const chinaNowParts = () => ({ day: TODAY, hour: 16, minute: 0 });
const isoFromCompactDate = d => String(d);
const isAfterMarketClose = (day) => day < TODAY ? true : (day > TODAY ? false : TODAY_CLOSED);
let TRADING_DAYS = ['2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'];
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
// 完整性检查 stub(语义保真:收盘后保存 + 可靠 + ruleVersion 兼容)
const isSavedAfterMarketClose = (payload) => payload?.savedAtOK === true;
const isReliableLimitUpDbPayload = (payload) => Array.isArray(payload?.stocks) && payload.stocks.length > 0 && payload.reliable !== false;
const isCompatibleMainReasonDb = (payload) => !!payload?.stocks?.length && String(payload?.ruleVersion || '') === 'vOK';

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
  //                   数据完整、预判算力、实际第一=算力AI → top1 命中。
  PREDICTS['2026-07-06'] = { sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: '算力', theme: '算力', star: { code: '600001', name: '老股' }, leader: null }] };
  LIMIT_UP['2026-07-06'] = finalLimitDb(['600001', '600003']);
  MAIN_REASON['2026-07-06'] = reasonDb([
    { code: '600001', name: 'A', finalBoardTopic: '算力' },
    { code: '600003', name: 'C', finalBoardTopic: '算力' }]);

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
  CLOSE['2026-07-09'] = { '002396': 10, '000938': 20 };
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

  const out = await getStrategyMainlineReview(10);
  const byDay = new Map(out.days.map(r => [r.day, r]));
  A(out.ok === true && out.days.length === 7, '七天预判记录全部入列(含最新收盘日与无效样本日)');

  const d2 = byDay.get('2026-07-02'), d3 = byDay.get('2026-07-03'), d6 = byDay.get('2026-07-06');
  const d7 = byDay.get('2026-07-07'), d8 = byDay.get('2026-07-08'), d9 = byDay.get('2026-07-09'), d10 = byDay.get('2026-07-10');

  // ① 最新收盘日无次日
  A(!!d10 && d10.nextDay === null, '①最新收盘日(07-10)无次日仍入回看,nextDay=null');
  A(d10.leader && d10.leader.nextCloseGain === null && d10.leader.win === null, '①无次日数据 → nextCloseGain=null 不装有数据');
  A(d10.mainlineHitTop1 === false && d10.mainlineHitTop3 === false, '①无次日不影响当日主线命中评判(照常=脱靶)');

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

  // ⑤ 并列第一
  A(d7.actualFirstTied === true, '⑤网络安全2=数字货币2 → 并列第一标记');
  A(d7.mainlineHitTop1 === true, '⑤预判命中任意并列第一家族 → top1 命中');
  A(d7.actualTop.filter(t => t.rankTier === 1).length === 2, '⑤actualTop 完整包含两个并列第一家族');
  A(d7.actualTop.some(t => t.rankTier === 2), '⑤Top3 按名次层级(半导体进第二层级),非数组截断');

  // ⑥ 主因库不完整覆盖
  A(d3.mainlineHitTop1 === null && d3.mainReasonMissingCount === 1, '⑥主因库缺 1 只涨停股 → 命中 null + 返回缺失数(830001 剔除后不计缺)');
  A(d2.mainlineHitTop1 === null && d2.mainReasonMissingCount === null, '⑥涨停库缺失无法验证覆盖 → 命中 null');

  // ⑦ 真实镜像统计:有效分母 = 07-06(命中)+07-07(命中)+07-09(命中)+07-10(脱靶)=4;
  //    07-08(已收盘)/07-02/07-03(数据不完整)不计。
  const s = out.stats;
  A(s.mainlineTotal === 4 && s.mainlineTop1Hits === 3, '⑦分母只含有效盘中样本:4 天,top1=3(已收盘/不完整均剔除)');
  A(s.expectedSealTotal === 2 && s.expectedSealWins === 1 && s.expectedSealRate === 50, '⑦预期明星封板统计:仅 expected 计入 = 1/2(confirmed/active/无level 不计)');
  // 明星/龙头次日胜率也只计有效样本:d9 star +10% 胜、d9 leader -5% 败;d8(已收盘)有次日数据但不计
  A(s.starTotal === 1 && s.starWins === 1, '⑦明星次日胜率分母剔除已收盘样本');
  A(s.leaderTotal === 1 && s.leaderWins === 0, '⑦龙头次日胜率分母剔除已收盘样本');

  // ---------- 当日盘中:待盘后验证 ----------
  TODAY = '2026-07-10'; TODAY_CLOSED = false;
  TRADING_DAYS = ['2026-07-08', '2026-07-09', '2026-07-10'];
  const out2 = await getStrategyMainlineReview(10);
  const t10 = out2.days.find(r => r.day === '2026-07-10');
  A(!!t10 && t10.pendingReview === true, '①当日盘中 → pendingReview=true(待盘后验证)');
  A(t10.star.sealStatus === 'pending' && t10.star.sealedSameDay === null, '①当日盘中明星封板 → pending/null');
  A(out2.stats.mainlineTotal === 1, '①当日盘中不计命中分母(仅 07-09 计入)');

  if (process.exitCode) console.error('\nSOME MAINLINE-REVIEW CHECKS FAILED');
  else console.log('\nALL MAINLINE-REVIEW CHECKS PASSED');
})().catch(e => { console.error(e); process.exitCode = 1; });
