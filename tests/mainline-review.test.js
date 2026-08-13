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
eval(extractFn('strategyMainlineFamilyInfo'));
eval(extractFn('strategyMainlineReasonFamilyInfo'));
eval(extractFn('normalizeReasonSourceCode'));
const isExcludedFromReview = (code) => String(code || '').startsWith('8');  // 夹具:8 开头视作北交所剔除
function isDroppedThemeWord(raw) { return /测试剔除词/.test(String(raw || '')); }
const STRATEGY_MAINLINE_INTRADAY_PHASES = extractSet('STRATEGY_MAINLINE_INTRADAY_PHASES');
const STRATEGY_MAINLINE_FORMAL_MIN_ZT = 3;
eval(extractFn('strategyMainlineIsTradingSessionObservation'));
eval(extractFn('strategyMainlineReviewFrozenFamilyEvidence'));
eval(extractFn('strategyMainlineReviewSampleStatus'));
// 历史族口径纪元在本测试中置为空操作:本文件验证回看机制本身(资格/领先/时段),
// 纪元冻结的旧词典行为由 family-declarative-equivalence.test.js §13 专项覆盖。
const strategyFamilyEraEnterForDay = () => () => {};

// ---- 待测函数 + 可控 IO/时钟 stub ----
eval(extractFn('strategyMainlineActualFamilyRanking'));
eval(extractFn('strategyMainlineReviewStarCandidates'));
eval(extractFn('strategyMainlineReviewFamilyKeys'));
eval(extractFn('strategyMainlineReviewActualFamilyCount'));
eval(extractFn('strategyMainlineReviewQualification'));
eval(extractFn('normalizeReviewFirstLimitTime'));
eval(extractFn('strategyMainlineExpectedStarTransitions'));
eval(extractFn('strategyMainlineChinaEventTimeMs'));
eval(extractFn('strategyMainlineTradingMinutesBetween'));
eval(extractFn('strategyMainlineLeadAssessment'));
eval(extractFn('strategyMainlineLeadSample'));
eval(extractFn('strategyMedianNumber'));
eval(extractFn('strategyMainlineReserveStarOutcomes'));   // 三要件预备层盘后结果(#201)
eval(extractFn('strategyMainlineReviewReserveSummaries'));
eval(extractFn('strategyMainlineReviewFormalTop'));
eval(extractFn('strategyMainlineReviewFormalConclusions'));
eval(extractFn('strategyMainlineReviewPlanFormalEvidence'));
eval(extractFn('strategyMainlineReviewEnrichFormalConclusions'));
eval(extractFn('strategyMainlineReviewAggregateQualification'));
eval(extractFn('strategyMainlineReviewHasRecord'));
eval(extractFn('strategyPredictCandidateKey'));
eval(extractFn('strategyPredictCandidateHasConfirmedStar'));
eval(extractFn('strategyPredictTopFromCandidate'));
eval(extractFn('strategyMainlineStarAttributionDecision'));
eval(extractFn('strategyMainlineReviewPredictionStarCodes'));
eval(extractFn('strategyMainlineReviewFilterAttributionBlock'));
eval(extractFn('strategyMainlineReviewFilterPredictionAttribution'));
eval(extractFn('strategyMainlineMatchesConfirm'));
eval(extractFn('strategyMainlineReviewConfirmedConclusion'));
eval(extractFn('strategyMainlineReviewFinalQualification'));

let TODAY = '2026-07-14';           // 次日:全部夹具交易日都算已收盘
let TODAY_CLOSED = true;            // 仅当 day===TODAY 时用
const readSavedApiKey = async () => 'k';
const chinaNowParts = (date) => {
  if (date instanceof Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(date);
    const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { day: `${map.year}-${map.month}-${map.day}`, hour: Number(map.hour), minute: Number(map.minute) };
  }
  return { day: TODAY, hour: 16, minute: 0 };
};
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
const SNAPSHOTS = {};
const readStrategyMainlineSnapshot = async d => SNAPSHOTS[d] || null;
const CONFIRMS = {};
const readMainlineConfirm = async d => CONFIRMS[d] || null;
const DAILY_EVENTS = {};
const readStrategyDailyEvents = async d => DAILY_EVENTS[d] || null;
const VISIBLE_MAINLINES = {};
const getStrategyMainlinesVisible = async d => VISIBLE_MAINLINES[d] || null;
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
let ATTRIBUTION_CONTEXT = new Map();
const strategyMainlineAttributionContextForCodes = async () => ATTRIBUTION_CONTEXT;

eval(extractFn('strategyKlineBarForDay'));
eval(extractFn('strategyKlineCoversDay'));
eval(extractFn('strategyMainlineReviewPredictionAttribution'));
eval(extractFn('strategyMainlineTechnicalTimeoutRecoveryCorrection'));
eval(extractFn('strategyMainlineRecoverTechnicalTimeoutPrediction'));
eval(extractFn('getStrategyMainlineReview'));

const finalLimitDb = (codes) => ({
  savedAtOK: true,
  reliable: true,
  stocks: codes.map(item => typeof item === 'object'
    ? { ...item, name: item.name || ('N' + item.code) }
    : { code: item, name: 'N' + item }),
});
const reasonDb = (rows) => ({ ruleVersion: 'vOK', stocks: rows });

(async () => {
  const powerFamily = strategyMainlineFamilyInfo({ theme: '电力' }).key;
  const equipmentFamily = strategyMainlineFamilyInfo({ theme: '电网设备' }).key;
  const huaDianReason = {
    code: '600726', name: '华电能源', finalBoardTopic: '电网设备', fallbackReason: '电力',
    allTopics: ['绿色电力', '煤炭', '电力', '电网设备'],
    finalDetailReason: '黑龙江区域发电、供热运营企业',
    sourceEvidence: { candidates: [{ source: 'kpl-zt-reason', primaryRawTopic: '绿色电力' }] },
  };
  const daTangReason = {
    code: '601991', name: '大唐发电', finalBoardTopic: '电网设备', fallbackReason: '电力',
    allTopics: ['电力(火电)', '火电', '电力', '电网设备'], finalDetailReason: '水力发电和火力发电运营',
    sourceEvidence: { candidates: [{ source: 'multi-source-consensus', primaryRawTopic: '火电' }] },
  };
  const windEquipmentReason = {
    code: '601026', name: '道生天合', finalBoardTopic: '电网设备', fallbackReason: '风电设备',
    allTopics: ['次新', '风电', '风电设备', '电网设备'], finalDetailReason: '风电设备制造',
  };
  const generationEquipmentReason = {
    code: '600001', name: '发电设备样本', finalBoardTopic: '电网设备', fallbackReason: '电网设备',
    allTopics: ['绿色电力', '发电设备', '电网设备'], finalDetailReason: '公司主营发电设备及控制系统制造',
    sourceEvidence: { candidates: [{ source: 'kpl-zt-reason', primaryTopic: '绿色电力' }] },
  };
  A(strategyMainlineReasonFamilyInfo(huaDianReason).key === powerFamily
    && strategyMainlineReasonFamilyInfo(daTangReason).key === powerFamily,
  '明确发电运营证据把华电能源/大唐发电归入发电侧电力族，不改底层原始主因');
  A(strategyMainlineReasonFamilyInfo(windEquipmentReason).key === equipmentFamily,
    '风电设备制造不被宽泛“电力”词误并入发电侧，仍属于电力设备族');
  A(strategyMainlineReasonFamilyInfo(generationEquipmentReason).key === equipmentFamily,
    '只有绿色电力概念但主营发电设备制造的公司仍属于设备族，运营证据闸不误放');
  const powerRanking = strategyMainlineActualFamilyRanking(reasonDb([
    huaDianReason,
    daTangReason,
    { code: '000692', name: '惠天热电', finalBoardTopic: '电网设备', fallbackReason: '电力',
      allTopics: ['热力', '电力', '电网设备'], finalDetailReason: '热电联产及供热运营' },
    windEquipmentReason,
  ]));
  const rankedPower = powerRanking.find(row => row.familyKey === powerFamily);
  A(rankedPower?.count === 3 && rankedPower.codes.includes('601991')
    && powerRanking.find(row => row.familyKey === equipmentFamily)?.count === 1,
  '盘后主线资格按策略族得到电力3家、电力设备1家，达到正式主线涨停下限且不混制造股');

  const timeoutPredict = {
    day: '2026-08-13', savedAt: '2026-08-13T06:59:24.116Z', sessionPhase: '尾盘', schemaVersion: 3,
    hasMainlines: false, recordState: 'no-mainline',
    bySource: {
      eastmoney: {
        available: true, hasMainlines: false, reason: 'leader-rework-incomplete', top: [], qualifiedMainlines: [],
        candidates: [{ key: powerFamily, familyKey: powerFamily, theme: '电力', rank: 4, score: 162,
          predictScore: 122, netInflow: null, boardGainPct: null, boardCount: 0, limitUpCount: 4,
          l2VerificationStatus: 'qi', qiTier: 'reserve', reserveReasons: ['no-qualified-leader'],
          stars: [{ code: '600726', name: '华电能源', level: 'confirmed' },
            { code: '601991', name: '大唐发电', level: 'confirmed' }],
          leaders: [{ code: '000595', name: '参考龙头', leadScore: 88 },
            { code: '001258', name: '次龙头', leadScore: 77 },
            { code: '000692', name: '候选龙头', leadScore: 66 }] }],
        starTransitions: [],
      },
      ths: { available: true, hasMainlines: false, reason: 'no-qualified-mainline', top: [], qualifiedMainlines: [], candidates: [], starTransitions: [] },
    },
    top: [], qualifiedMainlines: [], candidates: [], starTransitions: [],
  };
  const timeoutEvents = {
    day: '2026-08-13', intradayObservation: { samples: [{
      observedAt: '2026-08-13T06:57:54.992Z', sessionPhase: '尾盘',
      realtimeData: { readyFor: { intradayRanking: true }, sourceStatus: { eastmoney: {
        scoreEligible: true, stale: false, sourceDay: '2026-08-13',
      } } },
      families: [{ familyKey: powerFamily, theme: '电力', displayTheme: '电力', rank: 2,
        source: 'eastmoney', qiTier: 'formal', reserveReasons: [],
        score: 252, predictScore: 202, netInflow: 2735110656, boardGainPct: -0.34,
        boardCount: 1, limitUpCount: 5, bigGainCount: 0, nearLimitCount: 0,
        l2VerificationStatus: 'qi', resonanceSignal: true,
        stars: [{ code: '600726', name: '华电能源', level: 'confirmed' },
          { code: '601991', name: '大唐发电', level: 'confirmed' }],
        leaderCodes: ['605286', '000595', '000692'] }],
    }] },
  };
  const recoveredTimeout = strategyMainlineRecoverTechnicalTimeoutPrediction(
    '2026-08-13', timeoutPredict, timeoutEvents,
  );
  A(recoveredTimeout.recovered.includes(powerFamily)
    && recoveredTimeout.predict.bySource.eastmoney.top[0].theme === '电力'
    && recoveredTimeout.predict.bySource.eastmoney.top[0].star.code === '600726',
  '尾盘技术超时可从5分钟内同日来源可计分盘中观测恢复电力正式主线和确认明星');
  A(recoveredTimeout.predict.bySource.eastmoney.top[0].leaders[0].code === '000595'
    && recoveredTimeout.predict.bySource.eastmoney.technicalRecovery?.originalPredictionPreserved !== false,
  '技术恢复必须有候选龙头交集，仅保留交集候选并记录透明恢复元数据');
  const staleRecovery = strategyMainlineRecoverTechnicalTimeoutPrediction('2026-08-13', timeoutPredict, {
    ...timeoutEvents,
    intradayObservation: { samples: [{ ...timeoutEvents.intradayObservation.samples[0], observedAt: '2026-08-13T06:40:00.000Z' }] },
  });
  A(staleRecovery.recovered.length === 0,
    '超过5分钟的旧观测不得恢复，防止盘后用陈旧状态伪造预判');

  const legacyEvents = JSON.parse(JSON.stringify(timeoutEvents));
  delete legacyEvents.intradayObservation.samples[0].families[0].source;
  delete legacyEvents.intradayObservation.samples[0].families[0].qiTier;
  delete legacyEvents.intradayObservation.samples[0].families[0].reserveReasons;
  A(strategyMainlineRecoverTechnicalTimeoutPrediction(
    '2026-08-13', timeoutPredict, legacyEvents,
  ).recovered.length === 0,
  '旧盘中样本没有显式 formal/source 层级时不得自动猜成正式主线');
  const correctedTimeoutPredict = JSON.parse(JSON.stringify(timeoutPredict));
  correctedTimeoutPredict.reviewCorrections = [{
    operationId: 'review-electricity-timeout-recovery-20260813-v1',
    day: '2026-08-13', correctionType: 'intraday-technical-timeout-recovery',
    source: 'eastmoney', originalSavedAt: timeoutPredict.savedAt,
    failureReason: 'leader-rework-incomplete', familyKey: powerFamily, theme: '电力',
    observationAt: '2026-08-13T06:57:54.992Z', originalPredictionPreserved: true,
    evidence: {
      limitUpCount: 5, netInflow: 2735110656,
      confirmedStarCodes: ['600726', '601991'],
      leaderCodes: ['605286', '000595', '000692'],
    },
  }];
  const correctedLegacyRecovery = strategyMainlineRecoverTechnicalTimeoutPrediction(
    '2026-08-13', correctedTimeoutPredict, legacyEvents,
  );
  A(correctedLegacyRecovery.recovered.includes(powerFamily)
    && correctedLegacyRecovery.predict.bySource.eastmoney.technicalRecovery?.basis
      === 'audited-same-day-intraday-timeout-correction'
    && correctedLegacyRecovery.predict.bySource.eastmoney.technicalRecovery?.correctionOperationId
      === 'review-electricity-timeout-recovery-20260813-v1',
  '层级字段上线前的旧样本仅在审计纠正逐字段绑定原始证据后恢复');

  const multiFormal = strategyMainlineReviewFormalTop({
    schemaVersion: 3,
    top: [
      { key: 'theme:A', theme: 'A', rank: 1 },
      { key: 'theme:B', theme: 'B', rank: 2 },
      { key: 'theme:C', theme: 'C', rank: 3 },
    ],
    candidates: [
      { key: 'theme:A', theme: 'A', rank: 1, qiTier: 'formal', stars: [{ code: '600001', level: 'confirmed' }] },
      { key: 'theme:B', theme: 'B', rank: 2, qiTier: 'formal', stars: [{ code: '600002', level: 'confirmed' }] },
      { key: 'theme:C', theme: 'C', rank: 3, qiTier: 'formal', stars: [{ code: '600003', level: 'confirmed' }] },
      { key: 'theme:医药', theme: '医药', rank: 4, qiTier: 'formal', intradaySticky: false, stars: [{ code: '600004', level: 'confirmed' }] },
    ],
    starTransitions: [],
  });
  A(multiFormal.map(row => row.theme).join(',') === 'A,B,C,医药',
    '旧预测档从显式 formal candidates 恢复第4名正式主线，top3统计不截断事实集合');
  const moreThanTenFormal = strategyMainlineReviewFormalConclusions(
    { candidates: [], starTransitions: [] },
    Array.from({ length: 12 }, (_, index) => ({
      key: `theme:T${index + 1}`,
      theme: `T${index + 1}`,
      rank: index + 1,
    })),
    [],
    new Set(),
    false,
    true,
  );
  A(moreThanTenFormal.length === 12,
    '正式主线事实集不受 top10 截断，排名只决定顺序');
  A(strategyMainlineReviewAggregateQualification([
    { rank: 1, mainlineQualified: false },
    { rank: 4, mainlineQualified: true },
  ]) === true,
  '来源第1名盘后未成立时，第4名独立过门槛仍使该来源存在正式主线');

  const absoluteMainline = strategyMainlineReviewQualification(
    {
      schemaVersion: 3,
      candidates: [{ key: 'theme:PCB', theme: 'PCB', stars: [{ code: '002141', name: '贤丰控股', level: 'confirmed' }] }],
      starTransitions: [],
    },
    { key: 'theme:PCB', theme: 'PCB', star: { code: '002141', name: '贤丰控股', level: 'confirmed' } },
    [
      { familyKey: strategyMainlineFamilyInfo({ theme: '机器人' }).key, label: '机器人', count: 20 },
      { familyKey: strategyMainlineFamilyInfo({ theme: 'PCB' }).key, label: 'PCB', count: 10 },
    ],
    new Set(['002141']),
    true
  );
  A(absoluteMainline.qualified === true && absoluteMainline.limitUpCount === 10,
    '新口径:PCB虽少于机器人20只，但有确认明星且自身10只涨停，仍是正式主线');
  const noConfirmedFinal = strategyMainlineReviewFinalQualification({
    available: true,
    key: 'theme:PCB',
    theme: 'PCB',
    stars: [{ code: '002141', name: '贤丰控股', level: 'expected' }],
  }, [{ familyKey: strategyMainlineFamilyInfo({ theme: 'PCB' }).key, label: 'PCB', count: 10 }], true);
  A(noConfirmedFinal.formalQualified === false
    && noConfirmedFinal.formalQualificationReasons.includes('no-confirmed-star'),
  '最终复核只有预期明星、没有确认明星时，即使同家族涨停很多也不是正式主线');
  const incompleteFinal = strategyMainlineReviewFinalQualification({
    available: true,
    key: 'theme:PCB',
    theme: 'PCB',
    stars: [{ code: '002141', name: '贤丰控股', level: 'confirmed' }],
  }, [], false);
  A(incompleteFinal.formalQualified === null
    && incompleteFinal.sameFamilyLimitUpCount === null
    && incompleteFinal.formalQualificationReasons.includes('post-close-evidence-incomplete'),
  '有确认明星但盘后主因证据不完整时保持待核验，不把缺数据误判成无主线');

  const legacyTransitions = strategyMainlineExpectedStarTransitions(
    { savedAt: '2026-07-09T01:40:00.000Z', starTransitions: [] },
    { key: '算力', theme: '算力', star: { code: '002396', name: '星网', level: 'expected' } }
  );
  A(legacyTransitions[0]?.transitionEvidence === 'legacy-snapshot'
    && strategyMainlineLeadSample('2026-07-09', legacyTransitions,
      finalLimitDb([{ code: '002396', firstLimitTime: 131000 }])) === null,
  '领先时长不采信仅从旧最终快照反推的 expected，必须有首次事件轨迹');
  const eventMs = value => strategyMainlineChinaEventTimeMs('2026-07-09', value);
  A(strategyMainlineTradingMinutesBetween('2026-07-09', eventMs('09:40:00'), eventMs('11:10:00')) === 90,
    '领先时长同在上午时等于自然分钟');
  A(strategyMainlineTradingMinutesBetween('2026-07-09', eventMs('13:10:00'), eventMs('14:40:00')) === 90,
    '领先时长同在下午时等于自然分钟');
  A(strategyMainlineTradingMinutesBetween('2026-07-09', eventMs('11:00:00'), eventMs('13:30:00')) === 60,
    '领先时长跨午休只累计可交易60分钟，不虚增90分钟');
  A(strategyMainlineTradingMinutesBetween('2026-07-09', eventMs('09:20:00'), eventMs('09:30:00')) === 0,
    '开盘前至一字板首次封板按可交易时间收敛为0分钟');

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
      firstExpectedAt: '2026-07-09T01:40:00.000Z', confirmedAt: '2026-07-09T07:30:00.000Z',
      confirmedBy: 'final-limit-up-db', lastLevel: 'confirmed' }] };
  LIMIT_UP['2026-07-09'] = finalLimitDb([{ code: '002396', firstLimitTime: 131000 }, '600009', '600019']);
  MAIN_REASON['2026-07-09'] = reasonDb([
    { code: '002396', name: '星网', finalBoardTopic: '算力' },
    { code: '600009', name: 'I', finalBoardTopic: '算力' },
    { code: '600019', name: 'I2', finalBoardTopic: '算力' }]);
  CLOSE['2026-07-09'] = { ...CLOSE['2026-07-09'], '002396': 10, '000938': 20 };
  CLOSE['2026-07-10'] = { '002396': 11, '000938': 19 };

  // 07-10(尾盘,⑦真实镜像·脱靶 + ①最新收盘日无次日):预判医药,实际第一=商业航天 →
  //        top1/top3 都脱靶;无次日收盘价 → nextCloseGain=null 但主线命中与封板照常;
  //        明星 confirmed → 只展示"当时已确认",不进封板统计(③)。
  PREDICTS['2026-07-10'] = { sessionPhase: '尾盘', confirmedKey: '', top: [
    { key: '医药', theme: '医药', star: { code: '600010', name: '已封星', level: 'confirmed' }, leader: { code: '600011', name: '医药龙' } }] };
  // 管理员收盘后修正最终主线为半导体：回看应保留原“医药”预测用于命中审计，
  // 同时独立返回修正后的最终主线与明星，不得用盘后答案覆盖预测或改变统计。
  CONFIRMS['2026-07-10'] = {
    key: 'group:半导体', theme: '半导体', at: '2026-07-10T08:10:00.000Z',
  };
  VISIBLE_MAINLINES['2026-07-10'] = {
    mainlines: [{
      familyKey: 'group:半导体', theme: '半导体', source: 'eastmoney',
      starStocks: [
        { code: '600667', name: '太极实业', level: 'confirmed', label: '明星确认', attributionBasis: 'current-main-reason' },
        { code: '002409', name: '雅克科技', level: 'confirmed', label: '明星确认', attributionBasis: 'current-main-reason' },
      ],
      leaders: [{ code: '000938', name: '紫光股份', leadScore: 88 }],
    }],
    mainlinesBySource: {
      eastmoney: { mainlines: [{ familyKey: 'group:半导体', theme: '半导体', starStocks: [] }] },
      ths: { mainlines: [] },
    },
  };
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
  A(d10.theme === '医药' && d10.finalConfirmedMainline?.theme === '半导体',
    '①盘中预测保持医药，收盘后最终确认半导体以独立字段叠加');
  A(d10.finalConfirmedMainline?.correctedFromPrediction === true
    && d10.finalConfirmedMainline?.excludedFromPredictionStats === true,
  '①最终确认明确标记口径修正且不进入盘中预测统计');
  A(d10.finalConfirmedMainline?.stars?.map(row => row.code).join(',') === '600667,002409',
    '①最终确认携带修正后主线的两只确认明星');
  A(d10.finalConfirmedMainline?.formalQualified === false
    && d10.finalConfirmedMainline?.sameFamilyLimitUpCount === 0
    && d10.finalConfirmedMainline?.formalQualificationReasons?.includes('insufficient-limit-up-count'),
  '①最终确认主题不在完整主因库中达到3只涨停时，不得因全市场主因分布或人工确认冒充正式主线');

  // ② 已收盘不计样本(7-08 真实镜像)
  A(d8.sampleValid === false && d8.sampleInvalidReason === 'phase:已收盘', '②07-08 已收盘 → sampleValid=false + 明确原因');
  A(d8.mainlineHitTop1 === true, '②07-08 命中照常展示(只是不计分母)');

  // ③ 四种明星等级
  A(d9.star.predictLevel === 'confirmed' && d9.mainlineStarQualified === true,
    '③命中真实第一家族的最终快照允许显示 confirmed 明星');
  A(d9.expectedStars.length === 1 && d9.expectedStars[0].sealStatus === 'sealed'
    && d9.expectedStars[0].confirmedBy === 'final-limit-up-db', '③expected→confirmed 轨迹保留确认依据并计封板成功');
  A(d9.mainlineLead?.leadMinutes === 120 && d9.mainlineLead.firstLimitTime === '13:10:00'
    && d9.mainlineLead.confirmedAt === '2026-07-09T05:10:00.000Z',
  '③领先时长使用同股真实首次封板并剔除午休，不使用盘后15:30入库时间');
  A(d3.star.predictLevel === 'expected' && d3.star.sealStatus === 'notSealed' && d3.star.sealedSameDay === false
    && d3.mainlineStarQualified === null,
    '③expected+未封且主因不完整 → notSealed 计败，正式主线明星资格保持未知');
  A(d10.star.predictLevel === 'confirmed' && d10.mainlineStarQualified === false,
    '③盘中 confirmed 但主线脱靶 → 保留候选证据，同时明确不得作为正式主线明星');
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
  A(s.mainlineLeadSamples === 1 && s.mainlineLeadMedianMinutes === 120,
    '⑦领先时长一来源/一日一个样本，近窗统计取中位数');
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
             candidates: [
               { key: '算力', l2VerificationStatus: 'qi' },
               { key: 'theme:短剧游戏', theme: '短剧游戏', qiTier: 'reserve', reserveReasons: ['no-qualified-leader'],
                 stars: [{ code: '300058', name: '蓝色光标', level: 'confirmed' }] },
             ], starTransitions: [] },
    } };
  LIMIT_UP['2026-07-13'] = finalLimitDb(['600020']);
  MAIN_REASON['2026-07-13'] = reasonDb([{ code: '600020', name: 'X', finalBoardTopic: '算力' }]);
  const out3 = await getStrategyMainlineReview(10);
  const r13 = out3.days.find(r => r.day === '2026-07-13');
  A(!!r13, '三审P1:东财空+同花顺有预测,该日仍进入回看(不被顶层空 top 跳过)');
  A(!!(r13 && r13.bySource) && r13.bySource.eastmoney.noMainline === true, '三审P1:东财该日无主线(noMainline)');
  A(!!(r13 && r13.bySource) && r13.bySource.ths.mainlineHitTop1 === true, '三审P1:同花顺预判算力=当日实际第一 → top1 命中');
  A(r13.bySource.ths.hasReserveMainlines === true
    && r13.bySource.ths.reserveMainlines?.[0]?.theme === '短剧游戏'
    && r13.bySource.ths.reserveMainlines?.[0]?.confirmedStarCount === 1,
  '三审P1:同一来源有正式主线时仍显式返回预备短剧游戏及确认明星,不再藏于展开层');
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

  // ---------- Owner 2026-07-24:明星必须挂在同源命中的真实第一主因家族 ----------
  TODAY = '2026-07-23'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-07-21', '2026-07-22'];
  PREDICTS['2026-07-21'] = {
    schemaVersion: 3, sessionPhase: '尾盘', confirmedKey: '', top: [
      { key: 'theme:半导体', theme: '半导体', star: { code: '603986', name: '兆易创新', level: 'expected' } },
    ],
    starTransitions: [{ mainlineKey: 'theme:半导体', mainlineTheme: '半导体', code: '603986', name: '兆易创新',
      firstExpectedAt: '2026-07-21T03:04:29.468Z', confirmedAt: '2026-07-21T07:30:00.000Z',
      confirmedBy: 'final-limit-up-db', lastLevel: 'confirmed' }],
    bySource: {
      eastmoney: { available: true, hasMainlines: true, top: [
        { key: 'theme:半导体', theme: '半导体', star: { code: '603986', name: '兆易创新', level: 'expected' } },
      ], candidates: [], starTransitions: [
        { mainlineKey: 'theme:半导体', mainlineTheme: '半导体', code: '603986', name: '兆易创新',
          firstExpectedAt: '2026-07-21T03:04:29.468Z', confirmedAt: '2026-07-21T07:30:00.000Z',
          confirmedBy: 'final-limit-up-db', lastLevel: 'confirmed' },
      ] },
      ths: { available: true, hasMainlines: true, top: [
        { key: 'theme:消费电子', theme: '消费电子', l2VerificationStatus: 'qi', star: null },
      ], candidates: [{ key: 'theme:消费电子', l2VerificationStatus: 'qi' }], starTransitions: [] },
    },
  };
  LIMIT_UP['2026-07-21'] = finalLimitDb([{ code: '603986', firstLimitTime: 140805 }, '600021', '600023']);
  MAIN_REASON['2026-07-21'] = reasonDb([
    { code: '603986', name: '兆易创新', finalBoardTopic: '半导体' },
    { code: '600021', name: 'A', finalBoardTopic: '半导体' },
    { code: '600023', name: 'A2', finalBoardTopic: '半导体' },
  ]);
  PREDICTS['2026-07-22'] = {
    schemaVersion: 3, sessionPhase: '尾盘', confirmedKey: '', top: [
      { key: 'group:算力AI', theme: '算力', star: { code: '000034', name: '神州数码', level: 'confirmed' } },
    ],
    bySource: {
      eastmoney: { available: true, hasMainlines: true, top: [
        { key: 'group:算力AI', theme: '算力', star: { code: '000034', name: '神州数码', level: 'confirmed' } },
      ], candidates: [], starTransitions: [] },
      ths: { available: true, hasMainlines: false, top: [], candidates: [], starTransitions: [] },
    },
  };
  LIMIT_UP['2026-07-22'] = finalLimitDb(['600022']);
  MAIN_REASON['2026-07-22'] = reasonDb([{ code: '600022', name: 'B', finalBoardTopic: '电力' }]);
  const out7 = await getStrategyMainlineReview(10);
  const owner21 = out7.days.find(r => r.day === '2026-07-21');
  const owner22 = out7.days.find(r => r.day === '2026-07-22');
  A(owner21?.bySource?.eastmoney?.mainlineHitTop1 === true && owner21.mainlineStarQualified === true,
    'Owner:7月21日东财同源命中半导体且有明星 → 正式主线明星资格成立');
  A(owner21?.bySource?.eastmoney?.mainlineLead?.leadMinutes === 93.6
    && out7.stats.bySource.eastmoney.mainlineLeadSamples === 1
    && out7.stats.bySource.eastmoney.mainlineLeadMedianMinutes === 93.6,
  'Owner:东财独立统计可交易领先时长，7月21日兆易创新为93.6分钟');
  A(out7.stats.bySource.ths.mainlineLeadSamples === 0
    && out7.stats.bySource.ths.mainlineLeadMedianMinutes === null,
  'Owner:同花顺未命中且无可核验轨迹时保持零样本/null，不借东财数据');
  A(owner22?.bySource?.eastmoney?.mainlineHitTop1 === false && owner22.mainlineStarQualified === false,
    'Owner:7月22日东财算力未命中且同花顺无主线 → 正式主线明星资格不成立');
  A(owner22?.star?.predictLevel === 'confirmed',
    'Owner:7月22日原始L2确认候选仍保留用于审计，不因正式资格失败而丢证据');

  // ---------- Local Claude #295 阻断修正:首次封板后才出现预期的命中日单独计数 ----------
  TODAY = '2026-07-24'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-07-23'];
  const lateTransition = {
    mainlineKey: 'group:算力AI', mainlineTheme: '算力', code: '002396', name: '星网',
    firstExpectedAt: '2026-07-23T02:00:00.000Z', confirmedAt: '2026-07-23T07:30:00.000Z',
    confirmedBy: 'final-limit-up-db', lastLevel: 'confirmed',
  };
  PREDICTS['2026-07-23'] = {
    schemaVersion: 3, sessionPhase: '上午盘', confirmedKey: '',
    top: [{ key: 'group:算力AI', theme: '算力', star: { code: '002396', name: '星网', level: 'expected' } }],
    starTransitions: [lateTransition],
    bySource: {
      eastmoney: {
        available: true, hasMainlines: true,
        top: [{ key: 'group:算力AI', theme: '算力', star: { code: '002396', name: '星网', level: 'expected' } }],
        candidates: [], starTransitions: [lateTransition],
      },
      ths: { available: true, hasMainlines: false, top: [], candidates: [], starTransitions: [] },
    },
  };
  LIMIT_UP['2026-07-23'] = finalLimitDb([{ code: '002396', firstLimitTime: 93000 }, '600031', '600032']);
  MAIN_REASON['2026-07-23'] = reasonDb([
    { code: '002396', name: '星网', finalBoardTopic: '算力' },
    { code: '600031', name: '算力A', finalBoardTopic: '算力' },
    { code: '600032', name: '算力B', finalBoardTopic: '算力' },
  ]);
  const out8 = await getStrategyMainlineReview(10);
  const late23 = out8.days.find(row => row.day === '2026-07-23');
  A(late23?.mainlineHitTop1 === true && late23.mainlineLead === null
    && late23.mainlineLeadStatus === 'after-first-limit',
  '封板后才出现预期的命中日不伪造负数或正数领先时长');
  A(out8.stats.mainlineLeadSamples === 0 && out8.stats.mainlineLeadMedianMinutes === null
    && out8.stats.mainlineLeadAfterFirstLimitSamples === 1,
  '整体统计将封板后识别单独计数，不混入领先中位数');
  A(out8.stats.bySource.eastmoney.mainlineLeadSamples === 0
    && out8.stats.bySource.eastmoney.mainlineLeadAfterFirstLimitSamples === 1,
  '分源统计同样披露封板后识别日，不借另一来源或静默丢弃');

  // ---------- PR #304 回看补口:只在内存中剔除明确归因冲突，不改历史预测档 ----------
  TODAY = '2026-07-28'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-07-27'];
  const wrongStar = { code: '002409', name: '雅克科技', level: 'confirmed' };
  const wrongTransition = {
    mainlineKey: 'theme:电力', mainlineTheme: '电力', code: '002409', name: '雅克科技',
    firstExpectedAt: '2026-07-27T02:00:00.000Z', confirmedAt: '2026-07-27T07:30:00.000Z',
    confirmedBy: 'final-limit-up-db', lastLevel: 'confirmed',
  };
  PREDICTS['2026-07-27'] = {
    schemaVersion: 3, sessionPhase: '上午盘', confirmedKey: '',
    top: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', star: wrongStar }],
    candidates: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', stars: [wrongStar] }],
    starTransitions: [wrongTransition],
    bySource: {
      eastmoney: {
        available: true, hasMainlines: true,
        top: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', star: wrongStar }],
        candidates: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', stars: [wrongStar] }],
        starTransitions: [wrongTransition],
      },
      ths: {
        available: true, hasMainlines: true,
        top: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', star: wrongStar }],
        candidates: [{ key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi', stars: [wrongStar] }],
        starTransitions: [wrongTransition],
      },
    },
  };
  LIMIT_UP['2026-07-27'] = finalLimitDb(['002409', '600041', '600042', '600043']);
  MAIN_REASON['2026-07-27'] = reasonDb([
    { code: '002409', name: '雅克科技', finalBoardTopic: '半导体' },
    { code: '600041', name: '电力A', finalBoardTopic: '电力' },
    { code: '600042', name: '电力B', finalBoardTopic: '电力' },
    { code: '600043', name: '电力C', finalBoardTopic: '电力' },
  ]);
  const originalWrongPredict = JSON.stringify(PREDICTS['2026-07-27']);
  ATTRIBUTION_CONTEXT = new Map([[
    '002409',
    {
      currentReason: '半导体',
      currentSource: 'four-source-main-reason-db',
      currentFamilies: new Set([strategyMainlineFamilyInfo({ theme: '半导体' }).key]),
      currentTopics: ['半导体'],
      priorFamilies: new Set(),
      priorTopics: [],
    },
  ]]);
  const filteredReview = await getStrategyMainlineReview(10);
  const filtered27 = filteredReview.days.find(row => row.day === '2026-07-27');
  A(filtered27?.noMainline === true && filtered27?.bySource?.eastmoney?.noMainline === true
    && filtered27?.bySource?.ths?.noMainline === true,
  '明确主因归因冲突时，根预测、东财与同花顺都不再把错误明星当正式主线');
  A(filtered27?.expectedStars?.length === 0
    && filtered27?.attributionReview?.rejectedCount === 9,
  '冲突明星从 top、候选和事件轨迹全部剔除，并返回可审计的拒绝计数');
  A(filteredReview.stats.mainlineQualifiedTotal === 0
    && filteredReview.stats.expectedSealTotal === 0
    && filteredReview.stats.mainlineLeadSamples === 0,
  '被拒绝的错误归因不进入成立率、封板率或领先时长统计');
  A(JSON.stringify(PREDICTS['2026-07-27']) === originalWrongPredict,
    '回看归因过滤只操作内存副本，不改写历史预测档案');

  ATTRIBUTION_CONTEXT = new Map();
  const unknownReview = await getStrategyMainlineReview(10);
  const unknown27 = unknownReview.days.find(row => row.day === '2026-07-27');
  A(unknown27?.theme === '电力' && unknown27?.star?.code === '002409'
    && !unknown27?.attributionReview,
  '没有主因归因证据时保留旧记录，不把未知误删成冲突');

  // ---------- 下一交易日盘中:实时日 K 的 close/high 不是终值 ----------
  TODAY = '2026-07-13'; TODAY_CLOSED = false;
  TRADING_DAYS = ['2026-07-10', '2026-07-13'];
  CLOSE['2026-07-10'] = { '600010': 10, '600011': 20 };
  // 即使收盘库被错误提前写入，盘中也不得消费。
  CLOSE['2026-07-13'] = { '600010': 10.8, '600011': 22 };
  KLINE['600010'] = { x: ['2026-07-10', '2026-07-13'], y: [[9.8, 10, 10.2, 9.7], [10.2, 10.8, 11.2, 10.1]] };
  KLINE['600011'] = { x: ['2026-07-10', '2026-07-13'], y: [[19.5, 20, 20.4, 19.2], [20.5, 22, 23, 20.1]] };
  const intradayFollowup = await getStrategyMainlineReview(10);
  const followup10 = intradayFollowup.days.find(row => row.day === '2026-07-10');
  A(followup10?.nextDay === '2026-07-13' && followup10.nextDayFinal === false,
    '下一交易日存在但尚未收盘时，回看明确标记 nextDayFinal=false');
  A(followup10?.star?.nextCloseGain === null && followup10?.star?.nextHighGain === null
    && followup10?.star?.win === null && followup10?.star?.nextPerformancePending === true,
  '下一交易日盘中，明星的次收/次高/胜负保持待收盘，不消费实时日K');
  A(followup10?.leader?.nextCloseGain === null && followup10?.leader?.nextHighGain === null
    && followup10?.leader?.win === null && followup10?.leader?.nextPerformancePending === true,
  '下一交易日盘中，龙头的次收/次高/胜负同样保持待收盘');

  // ---------- Owner 2026-08-04:收盘后修正但存在真实盘中 L2 明星确认证据 ----------
  TODAY = '2026-08-04'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-08-03'];
  const l2GateEvidence = (jobId, savedAt, boardName) => ({
    jobId, plateId: jobId === 'ths-job' ? '308969' : 'BK1024', boardName, savedAt,
    gain: 10,
    maxBucket: {
      amount: 10000000, empty: false, dataMissing: false, priceMissing: false,
      amountGate: { passed: true, type: 'passive' },
      ratioGate: { required: 2, passed: 3 },
      ratioGates: { confirmed: { required: 2, passed: 3 } },
    },
  });
  const correctedCandidate = (jobId, boardName) => ({
    key: 'theme:电力', familyKey: 'theme:电力', theme: '电力', qiTier: 'formal',
    l2VerificationStatus: 'qi', intradaySticky: false,
    stars: [{ code: '600396', name: '华电辽能', level: 'confirmed' }],
    correctionEvidence: { l2Jobs: [jobId] },
    resonanceBoards: [{ name: boardName, evidenceJobId: jobId }],
  });
  const correctedTop = {
    key: 'theme:电力', theme: '电力', l2VerificationStatus: 'qi',
    star: { code: '600396', name: '华电辽能', level: 'confirmed' },
    leader: { code: '600396', name: '华电辽能' },
  };
  const reconstructedPredict = {
    day: '2026-08-03', schemaVersion: 3, sessionPhase: '已收盘',
    savedAt: '2026-08-03T08:20:00.000Z', hasMainlines: true, recordState: 'mainline',
    top: [correctedTop], candidates: [correctedCandidate('east-job', '绿色电力')], starTransitions: [],
    bySource: {
      eastmoney: {
        available: true, hasMainlines: true, top: [correctedTop],
        candidates: [correctedCandidate('east-job', '绿色电力')], starTransitions: [],
      },
      ths: {
        available: true, hasMainlines: true, top: [correctedTop],
        candidates: [correctedCandidate('ths-job', '超超临界发电')], starTransitions: [],
      },
    },
    reviewCorrections: [{
      operationId: 'review-electricity-mainline-backfill-20260803-v2',
      day: '2026-08-03', correctionType: 'post-close-evidence-reconstruction',
      excludedFromPredictionStats: true, frozenSnapshotPreserved: true,
      originalSessionPhase: '尾盘', originalSavedAt: '2026-08-03T06:59:26.033Z',
      theme: '电力', familyKey: 'theme:电力',
      star: { code: '600396', name: '华电辽能', level: 'confirmed' },
      l2Evidence: {
        // 15:11 才生成：可作盘后证据，不得计东财盘中样本。
        eastmoney: l2GateEvidence('east-job', '2026-08-03T07:11:00.000Z', '绿色电力'),
        // 10:23 完成：真实盘中自动扫描且明星确认门槛全部通过。
        ths: l2GateEvidence('ths-job', '2026-08-03T02:23:44.000Z', '超超临界发电'),
      },
    }],
  };
  PREDICTS['2026-08-03'] = reconstructedPredict;
  SNAPSHOTS['2026-08-03'] = {
    day: '2026-08-03', frozen: true,
    l2Gate: { excluded: [{
      theme: '电力', familyKey: 'theme:电力', count: 5, boardCount: 4,
      l2VerificationStatus: 'scanned-no-star', l2ScanState: 'scanned-no-star',
    }] },
  };
  LIMIT_UP['2026-08-03'] = finalLimitDb(['600396', '000595', '600644']);
  MAIN_REASON['2026-08-03'] = reasonDb([
    { code: '600396', name: '华电辽能', finalBoardTopic: '电力' },
    { code: '000595', name: '电力A', finalBoardTopic: '电力' },
    { code: '600644', name: '电力B', finalBoardTopic: '电力' },
  ]);
  const reconstructedReview = await getStrategyMainlineReview(10);
  const reconstructed03 = reconstructedReview.days.find(row => row.day === '2026-08-03');
  A(reconstructed03?.sampleValid === true
    && reconstructed03?.sampleBasis === 'intraday-l2-reconstructed'
    && reconstructed03?.sampleEvidenceSources?.join(',') === 'ths',
  '8月3日收盘修正有同花顺盘中L2真证，恢复为有效样本');
  A(reconstructed03?.bySource?.ths?.sampleValid === true
    && reconstructed03?.bySource?.ths?.sampleBasis === 'intraday-l2-reconstructed',
  '同花顺10:23证据单独计入来源样本');
  A(reconstructed03?.bySource?.eastmoney?.sampleValid === false
    && reconstructed03?.bySource?.eastmoney?.sampleInvalidReason === 'phase:已收盘',
  '东财15:11证据不得冒充东财盘中样本');
  A(reconstructedReview.stats.mainlineQualifiedTotal === 1
    && reconstructedReview.stats.mainlineQualifiedHits === 1,
  '经盘中L2补证的8月3日电力正式主线计入整体成立率');
  A(reconstructedReview.stats.bySource.ths.mainlineQualifiedTotal === 1
    && reconstructedReview.stats.bySource.ths.mainlineQualifiedHits === 1
    && reconstructedReview.stats.bySource.eastmoney.mainlineQualifiedTotal === 0,
  '分来源统计只计有真实盘中L2证据的同花顺');

  const detachedEvidence = JSON.parse(JSON.stringify(reconstructedPredict));
  detachedEvidence.bySource.ths.candidates[0].correctionEvidence.l2Jobs = ['other-job'];
  A(strategyMainlineReviewSampleStatus('2026-08-03', detachedEvidence, 'ths', SNAPSHOTS['2026-08-03']).valid === false,
    '未与来源候选精确绑定的L2元数据不得恢复样本资格');
  A(strategyMainlineReviewSampleStatus('2026-08-03', reconstructedPredict, 'ths', null).valid === false,
    '只有frozenSnapshotPreserved自述、没有实读冻结快照时不得恢复样本资格');
  const unrelatedFrozen = JSON.parse(JSON.stringify(SNAPSHOTS['2026-08-03']));
  unrelatedFrozen.l2Gate.excluded[0] = {
    theme: '医药', familyKey: 'group:医药', count: 8, l2ScanState: 'scanned-no-star',
  };
  A(strategyMainlineReviewSampleStatus('2026-08-03', reconstructedPredict, 'ths', unrelatedFrozen).valid === false,
    '冻结快照中没有该主线方向时，不得用盘后修正档伪造盘中预判');

  // ---------- 2026-08-04 结构回归：多来源、多正式主线逐条携带自己的回看证据 ----------
  TODAY = '2026-08-05'; TODAY_CLOSED = true;
  TRADING_DAYS = ['2026-08-04', '2026-08-05'];
  const lightMain = {
    key: 'group:光通信', theme: '光模块', rank: 1, l2VerificationStatus: 'qi',
    star: { code: '600101', name: '光明星', level: 'confirmed' },
    leaders: [{ code: '600102', name: '光龙头', leadScore: 72 }],
  };
  const aiMain = {
    key: 'group:算力AI', theme: '算力AI', rank: 2, l2VerificationStatus: 'qi',
    star: { code: '600201', name: '算力明星', level: 'confirmed' },
    leaders: [{ code: '600202', name: '算力龙头', leadScore: 81 }],
  };
  const formalCandidate = main => ({
    ...main, qiTier: 'formal', intradaySticky: false,
    stars: [main.star], leaders: main.leaders,
  });
  const aiTransition = {
    mainlineKey: 'group:算力AI', mainlineTheme: '算力AI', code: '600201', name: '算力明星',
    firstExpectedAt: '2026-08-04T01:45:00.000Z', confirmedAt: '2026-08-04T02:10:00.000Z',
    confirmedBy: 'live-l2-scan', lastLevel: 'confirmed',
  };
  PREDICTS['2026-08-04'] = {
    schemaVersion: 3, sessionPhase: '尾盘', savedAt: '2026-08-04T07:00:00.000Z',
    top: [lightMain, aiMain], qualifiedMainlines: [lightMain, aiMain],
    candidates: [formalCandidate(lightMain), formalCandidate(aiMain)], starTransitions: [aiTransition],
    bySource: {
      eastmoney: {
        available: true, hasMainlines: true, top: [lightMain, aiMain], qualifiedMainlines: [lightMain, aiMain],
        candidates: [formalCandidate(lightMain), formalCandidate(aiMain)], starTransitions: [aiTransition],
      },
      ths: {
        available: true, hasMainlines: true, top: [aiMain], qualifiedMainlines: [aiMain],
        candidates: [formalCandidate(aiMain)], starTransitions: [aiTransition],
      },
    },
  };
  LIMIT_UP['2026-08-04'] = finalLimitDb([
    { code: '600101', firstLimitTime: 100000 }, '600103', '600104',
    { code: '600201', firstLimitTime: 101000 }, '600203', '600204',
  ]);
  MAIN_REASON['2026-08-04'] = reasonDb([
    { code: '600101', name: '光明星', finalBoardTopic: '光模块' },
    { code: '600103', name: '光A', finalBoardTopic: '光通信' },
    { code: '600104', name: '光B', finalBoardTopic: '光模块' },
    { code: '600201', name: '算力明星', finalBoardTopic: '算力AI' },
    { code: '600203', name: '算力A', finalBoardTopic: '算力' },
    { code: '600204', name: '算力B', finalBoardTopic: '算力AI' },
  ]);
  CLOSE['2026-08-04'] = { '600101': 10, '600102': 20, '600201': 30, '600202': 40 };
  CLOSE['2026-08-05'] = { '600101': 10.5, '600102': 19, '600201': 33, '600202': 42 };
  KLINE['600101'] = { x: ['2026-08-04', '2026-08-05'], y: [[9.8, 10, 10.2, 9.7], [10.1, 10.5, 11, 10]] };
  KLINE['600102'] = { x: ['2026-08-04', '2026-08-05'], y: [[19.8, 20, 20.2, 19.5], [20, 19, 20.5, 18.8]] };
  KLINE['600201'] = { x: ['2026-08-04', '2026-08-05'], y: [[29.5, 30, 30.2, 29], [30.5, 33, 34.5, 30.2]] };
  KLINE['600202'] = { x: ['2026-08-04', '2026-08-05'], y: [[39.5, 40, 40.3, 39], [40.5, 42, 43, 40]] };
  const multiLineReview = await getStrategyMainlineReview(10);
  const multi04 = multiLineReview.days.find(row => row.day === '2026-08-04');
  const eastLight = multi04?.bySource?.eastmoney?.formalMainlines?.find(row => row.familyKey === 'group:光通信');
  // 夹具沿用旧档案键 group:算力AI(真实历史档就是这样存的);PR B 后它解析为 group:算力硬件,
  // 这里按解析后的族键取行,顺带验证旧键档案在新词典下仍能正确落族。
  const aiFamilyKey = strategyMainlineFamilyInfo({ key: 'group:算力AI', theme: '算力AI' }).key;
  const eastAi = multi04?.bySource?.eastmoney?.formalMainlines?.find(row => row.familyKey === aiFamilyKey);
  const thsAi = multi04?.bySource?.ths?.formalMainlines?.find(row => row.familyKey === aiFamilyKey);
  A(eastLight?.stars?.[0]?.code === '600101' && eastLight.stars[0].nextCloseGain === 5
    && eastLight?.leaders?.[0]?.code === '600102' && eastLight.leaders[0].nextCloseGain === -5,
  '8月4日东财光通信逐条保留自己的明星、龙头和次日表现');
  A(eastAi?.stars?.[0]?.code === '600201' && eastAi.stars[0].nextCloseGain === 10
    && thsAi?.stars?.[0]?.code === '600201' && thsAi.stars[0].nextHighGain === 15,
  '8月4日算力AI在东财/同花顺各自保留同源明星表现，不再借第一条光通信数据');
  A(eastAi?.mainlineLead?.code === '600201' && eastAi.mainlineLeadStatus === 'measured',
    '每条正式主线独立计算自己的预期明星领先时长');
  A(eastAi?.reviewCompleteness?.followupStatus === 'awaiting-third-trading-day'
    && eastAi.stars[0].threeDayPerformancePending === true
    && eastAi.stars[0].threeDayPerformanceStatus === 'awaiting-trading-day',
  '第三个后续交易日尚未到来时明确标为等待，不再以空白伪装数据缺失');
  A(multi04?.star?.code === '600101' && multi04?.mainlineLeadStatus !== undefined,
    '兼容层第一主线字段保持不变，既有统计口径不被多主线明细改写');
  // 不变量:逐源结论(分母)在纪元段内用 conclusions 计算,必须与用异步补全后的行计算等值。
  // 一旦 enrich 覆盖了 mainlineQualified,这条会立刻失败——分母与展示明细就此绑死。
  for (const skey of ['eastmoney', 'ths']) {
    const blk = multi04?.bySource?.[skey];
    if (!blk || blk.status !== 'mainline') continue;
    A(blk.mainlineQualified === strategyMainlineReviewAggregateQualification(blk.formalMainlines)
      && blk.formalMainlineCount === (blk.formalMainlines || []).length,
    `${skey}:来源资格分母与逐条明细聚合值一致,条数与明细长度一致(拆分不改分母)`);
  }

  const ambiguousFamilyRows = [
    { key: 'theme:光模块', theme: '光模块', leaders: [{ code: '600301', name: '光模块龙头' }] },
    { key: 'theme:光通信', theme: '光通信', leaders: [{ code: '600302', name: '光通信龙头' }] },
  ];
  const ambiguousFamilyPredict = {
    candidates: ambiguousFamilyRows.map(row => ({ ...row, stars: [] })),
    starTransitions: [],
  };
  // 逐条证据分两段(issue #375 PR B 纪元接缝):Plan 同步定绑定(读词典,须在纪元内),
  // Enrich 异步补收益(不读词典,须在纪元外)。歧义 fail closed 属于 Plan 段职责。
  const ambiguousFamilyPlans = strategyMainlineReviewPlanFormalEvidence(
    ambiguousFamilyPredict,
    ambiguousFamilyRows,
    [{ key: 'theme:CPO', theme: 'CPO', mainlineQualified: true }],
  );
  const ambiguousFamilyReview = await strategyMainlineReviewEnrichFormalConclusions(
    ambiguousFamilyPlans,
    async row => ({ ...row, nextCloseGain: 0, nextHighGain: 0, threeDayGain: 0 }),
  );
  A(strategyMainlineFamilyInfo({ theme: '光模块' }).key === strategyMainlineFamilyInfo({ theme: 'CPO' }).key
    && ambiguousFamilyPlans[0]?.rawLeaders?.length === 0
    && ambiguousFamilyReview[0]?.leaders?.length === 0,
  '精确键缺失且同家族存在多条主线时拒绝猜测龙头归属，不再取第一条');
  A(ambiguousFamilyReview[0]?.mainlineQualified === true && ambiguousFamilyReview[0]?.key === 'theme:CPO',
    '拆分后 conclusion 原字段(资格/键)仍被完整回填,不因分两段而丢失');
  // 静态:纪元段内不得出现 await(段内让出会把旧词典快照暴露给并发请求)。
  const eraStart = src.indexOf('const familyEraExit = strategyFamilyEraEnterForDay(day);');
  const eraEnd = src.indexOf('} finally { familyEraExit(); }');
  const eraBody = eraStart >= 0 && eraEnd > eraStart ? src.slice(eraStart, eraEnd) : '';
  A(!!eraBody && !/\bawait\b/.test(eraBody.replace(/\/\/[^\n]*/g, '')),
    '族口径纪元段内无 await:逐条证据的异步补全已移出段外回填');

  if (process.exitCode) console.error('\nSOME MAINLINE-REVIEW CHECKS FAILED');
  else console.log('\nALL MAINLINE-REVIEW CHECKS PASSED');
})().catch(e => { console.error(e); process.exitCode = 1; });
