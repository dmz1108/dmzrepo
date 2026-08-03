// AI 软件/硬件主线家族回归测试。
// 复现 2026-07-31：AI应用 + AI视频应合并为软件方向，不得污染算力硬件。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
  if (!match) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let index = bodyBrace;
  for (; index < src.length; index += 1) {
    if (src[index] === '{') depth += 1;
    else if (src[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, index + 1);
}

function extractArr(name) {
  const declaration = src.indexOf('const ' + name + ' = [');
  const start = src.indexOf('[', declaration);
  let depth = 0;
  let index = start;
  for (; index < src.length; index += 1) {
    if (src[index] === '[') depth += 1;
    else if (src[index] === ']') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(declaration, index + 2).replace('const ', 'var ');
}

function extractSet(name) {
  const match = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!match) throw new Error('not found set: ' + name);
  return new Set(eval('[' + match[1] + ']'));
}

const assert = (condition, message) => {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exitCode = 1;
  } else {
    console.log('ok: ' + message);
  }
};

const THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
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
eval(extractFn('strategyMainlineTopicKey'));
eval(extractFn('strategyThemeTaxonomyInfo'));
const STRATEGY_MAINLINE_MERGE_GROUPS = extractSet('STRATEGY_MAINLINE_MERGE_GROUPS');
const STRATEGY_MAINLINE_KEEP_FINE_THEMES = extractSet('STRATEGY_MAINLINE_KEEP_FINE_THEMES');
eval(extractFn('strategyMainlineFamilyInfo'));
eval(extractFn('strategyMainlineBoardThemeRelated'));
eval(extractFn('strategyMainlineStarAttributionDecision'));
eval(extractFn('strategyMainlineReviewFamilyKeys'));
eval(extractFn('strategyMainlineReviewActualFamilyCount'));

const limitUpThreshold = () => 9.75;
eval(extractFn('strategyMainlineBackfillBoardZt'));

const normalizeReasonSourceCode = value => String(value || '').trim();
const isFiniteNumeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const STRATEGY_MAINLINE_FORMAL_MIN_ZT = 3;
const strategyMainlineExpectedStarTransitions = () => [];
eval(extractFn('strategyMainlineReviewStarCandidates'));
eval(extractFn('strategyMainlineReviewQualification'));
const strategyDedupeByCode = rows => [...new Map((rows || []).map(row => [normalizeReasonSourceCode(row?.code), row])).values()];
const strategyMainlineRepresentativeBoardInflow = boards => ({
  value: boards?.[0]?.netInflow ?? null,
  boardName: boards?.[0]?.name || '',
  zsType: boards?.[0]?.zsType ?? null,
  netInflowZjjlr: boards?.[0]?.netInflowZjjlr ?? null,
  metric: boards?.[0]?.netInflowMetric || '',
  legacy: false,
});
const strategyMergeScoreParts = rows => ({
  limitUps: rows.reduce((sum, row) => sum + (Number(row?.scoreParts?.limitUps) || 0), 0),
});
const strategyMainlineRealtimeInflowScore = () => 0;
const strategyMergeMainlineRoles = () => ({});
const strategyMainlineExplain = () => [];
const strategyMainlineSourcePairs = () => [];
const strategyMainlineMergeAutoScanEligibility = () => ({});
eval(extractFn('strategyMergeMainlineFamilies'));

function candidate(theme, codes, score, boardName) {
  return {
    theme,
    key: theme,
    score,
    scoreParts: { limitUps: codes.length * 10 },
    count: codes.length,
    todayCodes: codes,
    realtimeCodes: codes,
    priorReasonCodes: [],
    risingStocks: [],
    nearLimitStocks: [],
    resonanceBoards: [{ name: boardName, plateId: boardName, netInflow: score * 1000000, gainPct: score / 100 }],
    roles: {},
    leaders: [],
  };
}

assert(strategyMainlineFamilyInfo({ theme: 'AI应用' }).key === 'theme:AI应用',
  'AI应用保持软件细分族，不落入算力AI');
assert(strategyMainlineFamilyInfo({ theme: '人工智能' }).key === 'theme:人工智能',
  '宽口径人工智能保持独立，不落入硬件算力族');
assert(strategyMainlineFamilyInfo({ theme: '算力' }).key === 'group:算力AI'
  && strategyMainlineFamilyInfo({ theme: '液冷' }).key === 'group:算力AI',
  '算力与液冷仍属硬件算力族');
assert(!strategyMainlineBoardThemeRelated('AI应用', '算力')
  && !strategyMainlineBoardThemeRelated('ChatGPT概念', '液冷')
  && !strategyMainlineBoardThemeRelated('智谱AI', 'AI硬件'),
  'AI 软件板块不得仅凭旧 taxonomy group 给算力硬件贡献资金和涨幅');
assert(strategyMainlineBoardThemeRelated('AI应用', 'ChatGPT概念')
  && strategyMainlineBoardThemeRelated('算力概念', '液冷'),
  '同一 AI 应用 standard 与同一硬件大组仍保持既有匹配');

const merged = strategyMergeMainlineFamilies([
  candidate('AI应用', ['300058', '300418', '002354'], 120, 'AI应用'),
  candidate('AI视频', ['300058', '300063', '300182'], 110, 'AI视频'),
  candidate('算力', ['603629', '000967'], 100, '算力'),
  candidate('液冷', ['000967', '002837'], 90, '液冷'),
]);

const software = merged.find(row => row.familyKey === 'theme:短剧游戏');
const hardware = merged.find(row => row.familyKey === 'group:算力AI');
assert(software && software.theme === '短剧游戏',
  'AI应用 + AI视频同时出现时归并为软件方向');
assert(software?.mergedThemes.includes('AI应用') && software?.mergedThemes.includes('AI视频'),
  '软件方向保留 AI应用与 AI视频两类主因证据');
const softwareLeaderFamilies = new Set([
  software?.theme,
  ...(software?.mergedThemes || []),
].map(theme => strategyMainlineFamilyInfo({ theme }).key));
assert(softwareLeaderFamilies.has('theme:AI应用') && softwareLeaderFamilies.has('theme:短剧游戏'),
  '龙头池同时消费 AI应用与 AI视频/短剧两族历史主因');
assert(software?.todayCodes.length === 5 && software.todayCodes.includes('300058'),
  '软件方向按股票去重，蓝色光标只计一次');
assert(hardware?.mergedThemes.includes('算力') && hardware?.mergedThemes.includes('液冷')
  && !hardware?.mergedThemes.includes('AI应用'),
  '硬件算力只合并算力/液冷，不再混入 AI应用');
assert(!software?.todayCodes.includes('603629') && !hardware?.todayCodes.includes('300058'),
  '软件与硬件成分不串族');

const priorAttribution = new Map([
  ['002929', {
    currentFamilies: new Set(),
    currentTopics: [],
    currentBroadOnly: false,
    priorFamilies: new Set(['group:算力AI']),
    priorTopics: ['算力'],
    priorBroadOnly: false,
  }],
  ['300058', {
    currentFamilies: new Set(),
    currentTopics: [],
    currentBroadOnly: false,
    priorFamilies: new Set(['theme:短剧游戏']),
    priorTopics: ['短剧游戏'],
    priorBroadOnly: false,
  }],
]);
const softwareScanBoard = {
  name: 'AI视频',
  zt: null,
  codes: ['002929', '300058'],
  memberRows: [
    { code: '002929', name: '润建股份', gain: 10 },
    { code: '300058', name: '蓝色光标', gain: 20 },
  ],
};
strategyMainlineBackfillBoardZt(
  [softwareScanBoard],
  new Map([['002929', {}], ['300058', {}]]),
  priorAttribution,
);
assert(softwareScanBoard.ztRaw === 2 && softwareScanBoard.zt === 1,
  '硬件主因涨停股不得替 AI视频 软件板凑满至少2只涨停的扫描门槛');
assert(softwareScanBoard.ztQualifiedCodes.join(',') === '300058'
  && softwareScanBoard.ztRejectedByAttribution[0]?.code === '002929'
  && softwareScanBoard.ztRejectedByAttribution[0]?.conflict === '算力',
  '软件板保留蓝色光标并记录被剔除硬件股的代码与主因冲突');

const sourceCountBoard = {
  name: 'AI视频',
  zt: 3,
  codes: ['002929', '300058', '300418'],
  memberRows: [
    { code: '002929', name: '润建股份', gain: 10 },
    { code: '300058', name: '蓝色光标', gain: 20 },
    { code: '300418', name: '软件股', gain: 20 },
  ],
};
strategyMainlineBackfillBoardZt(
  [sourceCountBoard],
  new Map([['002929', {}], ['300058', {}], ['300418', {}]]),
  priorAttribution,
);
assert(sourceCountBoard.ztRaw === 3 && sourceCountBoard.zt === 2
  && sourceCountBoard.ztSource === 'source+main-reason-attribution',
  '来源自带涨停数也必须扣除明确跨族股票，同时保留原始数量供审计');

const mismatchedSourceBoard = {
  name: 'AI视频',
  zt: 2,
  codes: ['002929', '000032', '300058', '300418'],
  memberRows: [
    { code: '002929', name: '润建股份', gain: 10 },
    { code: '000032', name: '深桑达A', gain: 10 },
    { code: '300058', name: '蓝色光标', gain: 20 },
    { code: '300418', name: '软件股', gain: 20 },
  ],
};
const mismatchedAttribution = new Map([
  ...priorAttribution,
  ['000032', {
    currentFamilies: new Set(), currentTopics: [], currentBroadOnly: false,
    priorFamilies: new Set(['theme:半导体']), priorTopics: ['半导体'], priorBroadOnly: false,
  }],
]);
strategyMainlineBackfillBoardZt(
  [mismatchedSourceBoard],
  new Map(mismatchedSourceBoard.codes.map(code => [code, {}])),
  mismatchedAttribution,
);
assert(mismatchedSourceBoard.ztReported === 2 && mismatchedSourceBoard.ztRaw === 4
  && mismatchedSourceBoard.zt === 2
  && mismatchedSourceBoard.ztQualifiedCodes.join(',') === '300058,300418',
  '来源标量小于逐股总体时按同一代码总体裁决，不得出现合格2只但zt=0');

const partialCoverageBoard = {
  name: 'AI视频',
  zt: 4,
  codes: ['002929', '300058'],
  memberRows: [],
};
strategyMainlineBackfillBoardZt([partialCoverageBoard], new Map(), priorAttribution);
assert(partialCoverageBoard.zt === 3 && partialCoverageBoard.ztUnidentifiedCount === 2
  && partialCoverageBoard.ztAttributionCoverage === 'partial'
  && partialCoverageBoard.ztQualifiedCodes.join(',') === '300058',
  '来源标量大于可见代码时只剔除明确冲突，未识别差额保留且标记partial');

const appOnly = strategyMergeMainlineFamilies([
  candidate('AI应用', ['300058'], 50, 'AI应用'),
  candidate('算力', ['603629'], 40, '算力'),
]);
assert(appOnly.some(row => row.familyKey === 'theme:AI应用')
  && appOnly.some(row => row.familyKey === 'group:算力AI'),
  '没有 AI视频/短剧佐证时，AI应用与算力仍分开展示');

const softwarePredict = {
  candidates: [{
    key: 'theme:短剧游戏',
    familyKey: 'theme:短剧游戏',
    theme: '短剧游戏',
    mergedThemes: ['AI应用', 'AI视频', '短剧游戏'],
    stars: [{ code: '300058', name: '蓝色光标', level: 'confirmed' }],
  }],
};
const softwareTop = {
  key: 'theme:短剧游戏',
  theme: '短剧游戏',
  star: { code: '300058', name: '蓝色光标', level: 'confirmed' },
};
const reviewKeys = strategyMainlineReviewFamilyKeys(softwarePredict, softwareTop);
const reviewCount = strategyMainlineReviewActualFamilyCount(softwarePredict, softwareTop, [
  { familyKey: 'theme:AI应用', count: 28 },
  { familyKey: 'group:算力AI', count: 18 },
]);
assert(reviewKeys.has('theme:AI应用') && reviewKeys.has('theme:短剧游戏')
  && !reviewKeys.has('group:算力AI'),
  '回看只在预测档明确合并时把 AI应用 与 AI视频/短剧视为同一软件族');
assert(reviewCount.count === 28
  && reviewCount.familyKeys.length === 1
  && reviewCount.familyKeys[0] === 'theme:AI应用',
  '7月31日盘后 AI应用 28 家可验证软件主线，但算力 18 家不混入');
const qualification = strategyMainlineReviewQualification(
  softwarePredict,
  softwareTop,
  [
    { familyKey: 'theme:AI应用', count: 28 },
    { familyKey: 'group:算力AI', count: 18 },
  ],
  new Set(['300058']),
  true,
);
assert(qualification.qualified === true
  && qualification.limitUpCount === 28
  && qualification.confirmedStar?.code === '300058',
  '蓝色光标确认 + AI应用 28 家涨停使软件方向通过正式主线资格');

const shortOnlyPredict = {
  candidates: [{
    key: 'theme:短剧游戏',
    familyKey: 'theme:短剧游戏',
    theme: '短剧游戏',
    mergedThemes: ['AI视频'],
  }],
};
assert(!strategyMainlineReviewFamilyKeys(shortOnlyPredict, softwareTop).has('theme:AI应用'),
  '只有 AI视频/短剧证据时不擅自吸收独立 AI应用 家族');

if (!process.exitCode) console.log('ALL CHECKS PASSED');
