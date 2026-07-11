// 当日综合主因权威归属机制测试(node tests/mainline-attribution.test.js)。
// 复现 7-08 星网锐捷问题:涨停股当日综合主因=算力,却因板块共成分被记进网络安全、算力AI 缺席。
// 走真实 strategyMainlineApplyCurrentReasonAttribution + 生产 canonicalTopicName / 题材簇 / 家族判定,
// 只构造 seedByKey 与当日主因库夹具(不 stub 任何归属逻辑,归属完全由生产族判定自动得出)。
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
const isExcludedFromReview = () => false;  // 夹具代码均为主板正常股(与 leader-pool-debug 测试一致)
function isDroppedThemeWord(raw) { return false; }  // 本测试夹具不含 dropped 词;真实实现见源码
eval(extractFn('strategyCreateMainlineSeed'));
eval(extractFn('strategyEnsureMainlineSeedShape'));
eval(extractFn('strategyMainlineEnsureSeed'));
eval(extractFn('strategyMainlineApplyCurrentReasonAttribution'));

// ---- 家族前置断言:证明 7-08 场景的族缺口/族一致真实成立(不靠 stub 伪造)----
A(strategyMainlineFamilyInfo({ theme: '算力' }).key === 'group:算力AI', '生产:算力 → 算力AI 家族');
A(strategyMainlineFamilyInfo({ theme: '云计算' }).key === 'group:算力AI', '生产:云计算 → 算力AI 家族(与算力同族)');
A(strategyMainlineFamilyInfo({ theme: '网络安全' }).key !== 'group:算力AI', '生产:网络安全 ≠ 算力AI 家族(跨族)');
A(strategyMainlineFamilyInfo({ theme: '数字货币' }).key !== 'group:算力AI', '生产:数字货币 ≠ 算力AI 家族(跨族)');

// ---- 构造 7-08 前置 seeds:星网(002396)因板块共成分落在网络安全/数字货币/液冷,算力 seed 只有别的成分 ----
// 注:算力/云计算/算力概念 经 standardTheme 归一到同一 topicKey='算力',同属一个 seed;
//     液冷 topicKey='液冷' 但家族仍是 group:算力AI —— 用它检验「同族不同 key」不被跨族剔除。
function buildSeeds() {
  const seedByKey = new Map();
  const seedOf = (theme, codes) => {
    const seed = strategyMainlineEnsureSeed(seedByKey, theme);
    for (const c of codes) { seed.codeSet.add(c); seed.realtimeCodeSet.add(c); }
    return seed;
  };
  seedOf('网络安全', ['002396']);   // 星网被网络安全板块携带(噪声归属)
  seedOf('数字货币', ['002396']);   // 同一只股又被数字货币板块携带
  seedOf('液冷', ['002396']);       // 星网又是液冷板块成分(同属算力AI 家族,不同 key)
  seedOf('算力', ['600588']);       // 算力 seed 已有别的涨停成分(板块支撑的算力AI 家族 seed)
  return seedByKey;
}
A(strategyMainlineFamilyInfo({ theme: '液冷' }).key === 'group:算力AI', '生产:液冷 → 算力AI 家族(同族不同 key)');

// 场景1:星网当日综合主因=算力(涨停),权威归属应把它并入算力 seed、移出跨族板块、保留同族。
(() => {
  const seedByKey = buildSeeds();
  const currentReasonDb = { stocks: [
    { code: '002396', name: '星网锐捷', finalBoardTopic: '算力', limitUpCount: '首板' },  // 涨停,主因=算力
    { code: '000938', name: '紫光股份', finalBoardTopic: '算力', limitUpCount: '首板' },  // 主因=算力但当日未涨停
  ] };
  const todayLimit = new Set(['002396', '600588']);  // 星网+另一算力成分当日涨停
  const fam = strategyMainlineApplyCurrentReasonAttribution(seedByKey, currentReasonDb, todayLimit);

  const seedCompute = seedByKey.get(strategyMainlineTopicKey('算力'));
  A(!!seedCompute && seedCompute.codeSet.has('002396'), '星网(002396)被并入算力 seed(算力AI 族)');
  A(!seedByKey.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), '星网已从网络安全 seed 剔除(跨族)');
  A(!seedByKey.get(strategyMainlineTopicKey('数字货币')).codeSet.has('002396'), '星网已从数字货币 seed 剔除(跨族)');
  A(seedByKey.get(strategyMainlineTopicKey('液冷')).codeSet.has('002396'), '星网保留在液冷 seed(同属算力AI 家族,不跨族剔除)');
  A(fam.get('002396') === 'group:算力AI', '返回 familyByCode 记录星网归属算力AI 家族');

  // 紫光当日未涨停 → 不受权威归属影响(仍作历史龙头由池子补全,不在此并入 todayCodes)
  A(!seedCompute.codeSet.has('000938'), '紫光(未涨停)不被当日综合主因归属并入 todayCodes');
  A(seedCompute.codeSet.has('600588'), '算力 seed 原有涨停成分 600588 不受影响');
  A(fam.size === 1, 'familyByCode 仅含当日涨停且有综合主因的股(600588 不在主因库故不计)');
})();

// 场景3:综合主因缺失/为空/未在涨停集合 → 完全不改动 seeds(行为不变)。
(() => {
  const before = buildSeeds();
  const beforeNet = new Set(before.get(strategyMainlineTopicKey('网络安全')).codeSet);
  // 3a:currentReasonDb=null(盘中当天尚无盘后主因)
  const s1 = buildSeeds();
  const fam1 = strategyMainlineApplyCurrentReasonAttribution(s1, null, new Set(['002396']));
  A(fam1.size === 0, 'null 主因库:familyByCode 为空');
  A([...s1.get(strategyMainlineTopicKey('网络安全')).codeSet].join() === [...beforeNet].join(), 'null 主因库:网络安全 seed 不变(行为不变)');
  // 3b:股票不在当日涨停集合(未涨停)→ 不归属
  const s2 = buildSeeds();
  const db = { stocks: [{ code: '002396', name: '星网锐捷', finalBoardTopic: '算力' }] };
  const fam2 = strategyMainlineApplyCurrentReasonAttribution(s2, db, new Set());  // 空涨停集合
  A(fam2.size === 0, '空涨停集合:无股被归属');
  A(s2.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), '空涨停集合:网络安全 seed 保持原样(不误删)');
})();

if (process.exitCode) console.error('\nSOME MAINLINE-ATTRIBUTION CHECKS FAILED');
else console.log('\nALL MAINLINE-ATTRIBUTION CHECKS PASSED');
