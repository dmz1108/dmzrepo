// 策略明星股主因归属测试(node tests/strategy-star-attribution.test.js)。
// L2 板块成员关系只负责发现候选；当日涨停原因或历史四源主因已经明确指向其他家族时，
// 不得把候选继续挂到静态概念板并据此生成预期/确认明星。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
  if (!match) throw new Error(`not found: ${name}`);
  const bodyBrace = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let index = bodyBrace;
  for (; index < src.length; index++) {
    if (src[index] === '{') depth++;
    else if (src[index] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, index + 1);
}
function extractArr(name) {
  const declaration = src.indexOf(`const ${name} = [`);
  const start = src.indexOf('[', declaration);
  let depth = 0;
  let index = start;
  for (; index < src.length; index++) {
    if (src[index] === '[') depth++;
    else if (src[index] === ']') {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(declaration, index + 2).replace('const ', 'var ');
}

const A = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

const numOrNull = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const isFiniteNumeric = value => value !== null && value !== '' && Number.isFinite(Number(value));
const isoFromCompactDate = value => {
  const text = String(value || '').trim();
  return /^\d{8}$/.test(text)
    ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
    : text.slice(0, 10);
};
const STRATEGY_MAINLINE_STAR_LEVEL_ORDER = { confirmed: 0, expected: 1, active: 2 };

const THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'theme-taxonomy.json'), 'utf8'));
const THEME_NONBROAD = (THEME_TAXONOMY.taxonomy || []).filter(item => !item.broad);
const THEME_BROAD = (THEME_TAXONOMY.taxonomy || []).filter(item => item.broad);
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
eval(src.match(/const THS_EVENT_NOISE = [^\n]+/)[0].replace('const ', 'var '));
eval(extractFn('thsReasonTokens'));
eval(extractFn('strategyMainlineReasonFamilyEvidence'));
eval(extractFn('strategyMainlineBuildStarAttributionContext'));
eval(extractFn('strategyMainlineCompatEntryKey'));
eval(extractFn('strategyMainlineFamilyCompat'));
eval(extractFn('strategyMainlineStarAttributionDecision'));
eval(extractFn('strategyMainlineFilterAttributedStars'));
eval(extractFn('strategyMainlineMainReasonDbAttribution'));
eval(extractFn('strategyMainlineMergeCurrentAttributionReasons'));
eval(extractFn('strategyPredictCandidateKey'));
eval(extractFn('strategyMainlineExpectedTransitionMap'));
eval(extractFn('strategyMainlineResolveExpectedHistory'));

const priorByCode = new Map([
  ['600667', {
    code: '600667',
    theme: '半导体',
    topics: [{ theme: '存储芯片' }, { theme: '先进封装' }],
  }],
  ['002409', {
    code: '002409',
    theme: '半导体',
    topics: [{ theme: '电子气体' }, { theme: '存储芯片' }],
  }],
]);
const liveByCode = new Map([
  ['600667', {
    code: '600667',
    reason: '存储芯片+先进封装+SK海力士+无锡国资',
  }],
]);
const attribution = strategyMainlineBuildStarAttributionContext(priorByCode, liveByCode);

const taiJi = { code: '600667', name: '太极实业', level: 'confirmed' };
const yaKe = { code: '002409', name: '雅克科技', level: 'expected' };
const photovoltaic = { theme: '光伏', familyKey: 'theme:光伏' };
const electric = { theme: '电力', familyKey: 'group:电力' };   // PR B: 发电侧合族
const semiconductor = { theme: '半导体', familyKey: 'group:半导体' };

const taiJiWrong = strategyMainlineStarAttributionDecision(photovoltaic, taiJi, attribution);
A(!taiJiWrong.allowed && taiJiWrong.basis === 'current-limit-reason-conflict',
  '太极实业当日涨停原因明确为半导体时，不得因静态成员关系挂到光伏');
const yaKeWrong = strategyMainlineStarAttributionDecision(electric, yaKe, attribution);
A(!yaKeWrong.allowed && yaKeWrong.basis === 'prior-main-reason-conflict',
  '雅克科技历史四源主因明确为半导体时，不得因特高压成员关系挂到电力');
A(strategyMainlineStarAttributionDecision(semiconductor, taiJi, attribution).allowed,
  '太极实业在半导体家族通过当日主因归属');
A(strategyMainlineStarAttributionDecision(semiconductor, yaKe, attribution).allowed,
  '雅克科技在半导体家族通过历史四源主因归属');

const huaDian = { code: '600396', name: '华电辽能', level: 'confirmed' };
const huaDianCurrent = strategyMainlineBuildStarAttributionContext(new Map(), new Map([
  ['600396', {
    code: '600396',
    reason: '火电+用电负荷新高+央企',
    source: 'ths-limit-up-pool',
  }],
]));
const huaDianPower = strategyMainlineStarAttributionDecision(electric, huaDian, huaDianCurrent);
A(huaDianPower.allowed && huaDianPower.basis === 'current-limit-reason',
  '华电辽能当日火电主因与电力候选同族,精确匹配放行(PR B 合族)');
const huaDianGreen = strategyMainlineStarAttributionDecision(
  { theme: '绿色电力', familyKey: strategyMainlineFamilyInfo({ theme: '绿电' }).key }, huaDian, huaDianCurrent,
);
A(huaDianGreen.allowed && huaDianGreen.basis === 'current-limit-reason',
  '发电侧同族互认:火电明星可支撑绿色电力候选(PR B 合族的目标行为)');
A(!strategyMainlineStarAttributionDecision(
  electric,
  { code: '601700', name: '风范股份', level: 'confirmed' },
  strategyMainlineBuildStarAttributionContext(new Map(), new Map([
    ['601700', { code: '601700', reason: '特高压+电网设备', source: 'ths-limit-up-pool' }],
  ])),
).allowed, '电网设备明星不得借父子兼容规则计入发电侧电力主线');
const huaDianPrior = strategyMainlineBuildStarAttributionContext(new Map([
  ['600396', {
    code: '600396',
    theme: '电力',
    topics: [{ theme: '绿色电力' }],
  }],
]), new Map());
A(strategyMainlineStarAttributionDecision(electric, huaDian, huaDianPrior).basis
  === 'prior-main-reason',
'华电辽能历史绿色电力主因在盘中尚无当日主因时仍支撑电力主线(同族精确匹配)');

const shortDramaFamily = strategyMainlineFamilyInfo({ theme: '短剧游戏' }).key;
A(shortDramaFamily === 'theme:短剧游戏'
  && strategyMainlineFamilyInfo({ theme: '快手概念' }).key === shortDramaFamily
  && strategyMainlineFamilyInfo({ theme: '小红书概念' }).key === shortDramaFamily
  && strategyMainlineFamilyInfo({ theme: '文化传媒概念' }).key === shortDramaFamily
  && strategyMainlineFamilyInfo({ theme: 'AI视频' }).key === shortDramaFamily,
'AI视频、快手、小红书与文化传媒统一归入短剧游戏细分家族');
A(strategyMainlineFamilyInfo({ theme: 'AI应用' }).key === 'group:AI软件应用'
  && strategyMainlineFamilyInfo({ theme: 'AI应用' }).key !== strategyMainlineFamilyInfo({ theme: '算力AI' }).key,
'AI应用落 AI软件应用族,与算力硬件族分家(PR B)');
const blueFocusAttribution = strategyMainlineBuildStarAttributionContext(new Map(), new Map([
  ['300058', {
    code: '300058',
    reason: 'AI应用+出海广告+一季报增长',
    source: 'ths-limit-up-pool',
  }],
]));
const blueFocus = { code: '300058', name: '蓝色光标', level: 'confirmed', boardName: '快手概念' };
const blueShortDrama = strategyMainlineStarAttributionDecision(
  { theme: '短剧游戏', familyKey: shortDramaFamily },
  blueFocus,
  blueFocusAttribution,
);
A(blueShortDrama.allowed && blueShortDrama.basis === 'current-limit-reason',
'蓝色光标“AI应用+出海广告”采用更具体的出海广告证据，封板后确认归属短剧游戏');
const blueCompute = strategyMainlineStarAttributionDecision(
  { theme: '算力AI', familyKey: 'group:算力硬件' },
  blueFocus,
  blueFocusAttribution,
);
A(!blueCompute.allowed && blueCompute.basis === 'current-limit-reason-conflict',
'宽口径AI应用不得再把蓝色光标排他归入算力硬件族');
const blueBroadOnlyAttribution = strategyMainlineBuildStarAttributionContext(new Map(), new Map([
  ['300058', {
    code: '300058',
    reason: 'AI应用',
    source: 'four-source-main-reason-db',
  }],
]));
const blueBroadShortDrama = strategyMainlineStarAttributionDecision(
  { theme: '短剧游戏', familyKey: shortDramaFamily },
  blueFocus,
  blueBroadOnlyAttribution,
);
A(blueBroadShortDrama.allowed && blueBroadShortDrama.basis === 'current-main-reason-broad-compatible',
'四源仅给宽口径AI应用时，不得否决同日AI视频板块提供的更具体短剧游戏归属');
A(!strategyMainlineStarAttributionDecision(
  { theme: '算力AI', familyKey: 'group:算力硬件' }, blueFocus, blueBroadOnlyAttribution,
).allowed, 'AI应用宽口径兼容不向算力硬件族放开，避免蓝色光标重新被错挂');
A(!strategyMainlineStarAttributionDecision(
  { theme: '电力', familyKey: 'group:电力' }, blueFocus, blueBroadOnlyAttribution,
).allowed, 'AI应用宽口径兼容不向无关家族放开');
const bluePriorBroadOnlyAttribution = strategyMainlineBuildStarAttributionContext(new Map([
  ['300058', {
    code: '300058',
    theme: 'AI应用',
    topics: [],
  }],
]), new Map());
A(strategyMainlineStarAttributionDecision(
  { theme: '短剧游戏', familyKey: shortDramaFamily }, blueFocus, bluePriorBroadOnlyAttribution,
).basis === 'prior-main-reason-broad-compatible',
'盘中尚无当日主因时，历史宽口径AI应用也不得错杀同日短剧游戏板块候选');
A(!strategyMainlineStarAttributionDecision(
  { theme: '算力AI', familyKey: 'group:算力硬件' }, blueFocus, bluePriorBroadOnlyAttribution,
).allowed, '历史宽口径AI应用兼容同样不向算力硬件族放开');

const rotatedLive = strategyMainlineBuildStarAttributionContext(priorByCode, new Map([
  ['002409', { code: '002409', reason: '光伏' }],
]));
const rotatedDecision = strategyMainlineStarAttributionDecision(photovoltaic, yaKe, rotatedLive);
A(rotatedDecision.allowed && rotatedDecision.basis === 'current-limit-reason',
  '当日正式涨停原因确认题材切换时，当日证据优先于历史主因');

const newTheme = strategyMainlineStarAttributionDecision(
  { theme: '首日新题材', familyKey: 'theme:首日新题材' },
  { code: '000001' },
  new Map(),
);
A(newTheme.allowed && newTheme.basis === 'board-membership-only',
  '完全没有主因证据时保留板块候选能力，避免错杀首日新题材');

const historicalSameDay = strategyMainlineMainReasonDbAttribution('2026-07-27', {
  day: '2026-07-27',
  stocks: [{ code: '002409', finalBoardTopic: '半导体' }],
}, ['002409']);
const historicalAttribution = strategyMainlineBuildStarAttributionContext(new Map(), historicalSameDay);
const historicalWrong = strategyMainlineStarAttributionDecision(electric, yaKe, historicalAttribution);
A(!historicalWrong.allowed && historicalWrong.basis === 'current-main-reason-conflict',
  '历史回看使用目标日四源综合主因，不拿更早主题臆测目标日归属');
A(strategyMainlineMainReasonDbAttribution('2026-07-27', {
  day: '2026-07-24',
  stocks: [{ code: '002409', finalBoardTopic: '电力' }],
}, ['002409']).size === 0, '跨日主因文件不能参与目标日明星归属');
const mergedCurrentReasons = strategyMainlineMergeCurrentAttributionReasons(
  new Map([['002409', { code: '002409', reason: '半导体', source: 'four-source-main-reason-db' }]]),
  new Map([['002409', { code: '002409', reason: '', source: 'ths-limit-up-pool' }]]),
);
A(mergedCurrentReasons.get('002409')?.reason === '半导体',
  '实时涨停池空主因不得覆盖当天四源综合主因证据');
const mergedPublishedReason = strategyMainlineMergeCurrentAttributionReasons(
  mergedCurrentReasons,
  new Map([['002409', { code: '002409', reason: '光伏', source: 'ths-limit-up-pool' }]]),
);
A(mergedPublishedReason.get('002409')?.reason === '光伏',
  '实时来源发布非空主因后仍可按当日证据覆盖综合库旧值');

const filtered = strategyMainlineFilterAttributedStars({
  theme: '电力',
  familyKey: 'group:电力',
  starStocks: [yaKe],
  expectedStarHistory: [yaKe],
  hadExpectedStarToday: true,
  l2VerificationStatus: 'qi',
  l2ScanState: 'qi',
  l2QualifiedBy: 'expected-star',
  scoreParts: { base: 20, star: 8 },
  score: 28,
  predictScore: 24,
}, attribution);
A(filtered.starStocks.length === 0 && filtered.expectedStarHistory.length === 0,
  '旧缓存中的错误当前明星和粘性历史同时被清除');
A(filtered.l2VerificationStatus === 'scanned-no-star' && filtered.score === 20,
  '移除错误明星后同步撤销 QI 状态和明星加分');
A(filtered.predictScore === 16, '移除错误明星后同步扣除预判分中的明星加分');
A(filtered.l2ScanDetail.attributionRejected[0]?.code === '002409',
  '错误归属留下可审计的拒绝明细');

const historyOnly = strategyMainlineFilterAttributedStars({
  theme: '电力',
  familyKey: 'group:电力',
  starStocks: [],
  expectedStarHistory: [yaKe],
  hadExpectedStarToday: true,
  l2VerificationStatus: 'qi',
  l2ScanState: 'qi',
}, attribution);
A(historyOnly.expectedStarHistory.length === 0 && historyOnly.hadExpectedStarToday === false,
  '只有历史预期明星、没有当前明星的旧快照也会清除错误归属');

const transitionMap = strategyMainlineExpectedTransitionMap({
  starTransitions: [{
    mainlineKey: 'group:电力',
    mainlineTheme: '电力',
    code: '002409',
    name: '雅克科技',
    firstExpectedAt: '2026-07-27T02:00:00.000Z',
  }],
});
A(strategyMainlineResolveExpectedHistory(electric, transitionMap, { attributionByCode: attribution }).length === 0,
  '同日预测轨迹也不能把雅克科技重新粘回电力');
A(strategyMainlineResolveExpectedHistory(electric, transitionMap).length === 1,
  '未提供归属上下文时保持旧函数兼容性');

console.log(process.exitCode
  ? 'SOME CHECKS FAILED'
  : 'ALL STRATEGY-STAR-ATTRIBUTION CHECKS PASSED');
