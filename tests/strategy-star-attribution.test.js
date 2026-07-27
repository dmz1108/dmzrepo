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
function extractSet(name) {
  const match = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!match) throw new Error(`not found set: ${name}`);
  return new Set(eval(`[${match[1]}]`));
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
const STRATEGY_MAINLINE_MERGE_GROUPS = extractSet('STRATEGY_MAINLINE_MERGE_GROUPS');
const STRATEGY_MAINLINE_KEEP_FINE_THEMES = extractSet('STRATEGY_MAINLINE_KEEP_FINE_THEMES');
eval(extractFn('strategyMainlineFamilyInfo'));
eval(extractFn('normalizeReasonSourceCode'));
eval(src.match(/const THS_EVENT_NOISE = [^\n]+/)[0].replace('const ', 'var '));
eval(extractFn('thsReasonTokens'));
eval(extractFn('strategyMainlineReasonFamilyEvidence'));
eval(extractFn('strategyMainlineBuildStarAttributionContext'));
eval(extractFn('strategyMainlineStarAttributionDecision'));
eval(extractFn('strategyMainlineFilterAttributedStars'));
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
const electric = { theme: '电力', familyKey: 'theme:电力' };
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

const filtered = strategyMainlineFilterAttributedStars({
  theme: '电力',
  familyKey: 'theme:电力',
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
  familyKey: 'theme:电力',
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
    mainlineKey: 'theme:电力',
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
