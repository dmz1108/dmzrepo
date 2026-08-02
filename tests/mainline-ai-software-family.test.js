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

const normalizeReasonSourceCode = value => String(value || '').trim();
const isFiniteNumeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
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

const appOnly = strategyMergeMainlineFamilies([
  candidate('AI应用', ['300058'], 50, 'AI应用'),
  candidate('算力', ['603629'], 40, '算力'),
]);
assert(appOnly.some(row => row.familyKey === 'theme:AI应用')
  && appOnly.some(row => row.familyKey === 'group:算力AI'),
  '没有 AI视频/短剧佐证时，AI应用与算力仍分开展示');

if (!process.exitCode) console.log('ALL CHECKS PASSED');
