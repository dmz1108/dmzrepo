// 盘后归属复核机制测试(node tests/mainline-attribution.test.js)。
// 复现 7-08 星网锐捷:涨停股当日综合主因=算力,却因板块共成分被记进网络安全、算力AI 缺席。
// 走真实 strategyMainlineApplyCurrentReasonAttribution + DetachCodeFromSeed + 置信度门槛 +
// 生产 canonicalTopicName / 题材簇 / 家族判定,只构造 seedByKey 与当日主因库夹具(归属逻辑不 stub)。
// 注:本件只测「盘后归属复核」纯函数;它仅在 postCloseReview 模式调用,严禁进盘中预测(见 kpl-stats-server 注释)。
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
function isDroppedThemeWord(raw) { return false; }  // 夹具不含 dropped 词;真实实现见源码
eval(extractFn('strategyCreateMainlineSeed'));
eval(extractFn('strategyEnsureMainlineSeedShape'));
eval(extractFn('strategyMainlineAddRisingStock'));
eval(extractFn('strategyMainlineEnsureSeed'));
eval(extractFn('strategyMainlineDetachCodeFromSeed'));
eval(extractFn('strategyMainlineReasonAttributionConfidence'));
eval(extractFn('strategyMainlineApplyCurrentReasonAttribution'));

// ---- 生产家族前置断言:证明 7-08 场景的族缺口/族一致真实成立 ----
A(strategyMainlineFamilyInfo({ theme: '算力' }).key === 'group:算力AI', '生产:算力 → 算力AI 家族');
A(strategyMainlineFamilyInfo({ theme: '云计算' }).key === 'group:算力AI', '生产:云计算 → 算力AI 家族(与算力同族)');
A(strategyMainlineFamilyInfo({ theme: '液冷' }).key === 'group:算力AI', '生产:液冷 → 算力AI 家族(同族不同 key)');
A(strategyMainlineFamilyInfo({ theme: '网络安全' }).key !== 'group:算力AI', '生产:网络安全 ≠ 算力AI 家族(跨族)');
A(canonicalTopicName('数据中心') === '算力', '生产:数据中心 → 算力(候选源同族证据成立)');

// ---- 置信度门槛(Codex 第5点)----
(() => {
  const famCompute = strategyMainlineFamilyInfo({ theme: '算力' }).key;
  // 多源共识:候选≥2 且至少一源板块题材同族 → hard
  A(strategyMainlineReasonAttributionConfidence(
    { candidates: [{ source: 'review-auto-consensus', boardTopic: '数据中心' }, { source: 'kpl-zt-reason', boardTopic: '中报增长' }, { source: 'limit-up-db-reason', boardTopic: '通信设备' }] },
    famCompute) === 'hard', '多源+至少一源同族(数据中心)→ hard(星网真实记录口径)');
  // consensusTier 已挂 strong/majority → hard
  A(strategyMainlineReasonAttributionConfidence({ consensusTier: 'strong', candidates: [] }, famCompute) === 'hard', 'consensusTier=strong → hard');
  A(strategyMainlineReasonAttributionConfidence({ consensusTier: 'majority' }, famCompute) === 'hard', 'consensusTier=majority → hard');
  A(strategyMainlineReasonAttributionConfidence({ agreeCount: 2 }, famCompute) === 'hard', 'agreeCount≥2 → hard');
  // 孤源 / 来源不足 → soft
  A(strategyMainlineReasonAttributionConfidence({ candidates: [{ source: 'a', boardTopic: '数据中心' }] }, famCompute) === 'soft', '单一来源 → soft(来源不足)');
  A(strategyMainlineReasonAttributionConfidence({ candidates: [{ source: 'a', boardTopic: '网络安全' }, { source: 'b', boardTopic: '数字货币' }] }, famCompute) === 'soft', '多源但无一同族 → soft(低置信)');
  A(strategyMainlineReasonAttributionConfidence({}, famCompute) === 'soft', '无任何证据 → soft');
})();

// ---- 构造 7-08 前置 seeds ----
function buildSeeds() {
  const seedByKey = new Map();
  const seedOf = (theme, codes) => {
    const seed = strategyMainlineEnsureSeed(seedByKey, theme);
    for (const c of codes) { seed.codeSet.add(c); seed.realtimeCodeSet.add(c); seed.countFallback += 1; }
    return seed;
  };
  seedOf('网络安全', ['002396']);   // 星网被网络安全板块携带(噪声归属)
  seedOf('数字货币', ['002396']);   // 同一只股又被数字货币板块携带
  seedOf('液冷', ['002396']);       // 星网又是液冷板块成分(同属算力AI 家族,不同 key)
  seedOf('算力', ['600588']);       // 算力 seed 已有别的涨停成分(板块支撑的算力AI 家族 seed)
  return seedByKey;
}

// 强候选(hard)记录:多源 + 数据中心同族
const HARD = (code, name) => ({ code, name, finalBoardTopic: '算力', limitUpCount: 1,
  candidates: [{ source: 'review-auto-consensus', boardTopic: '数据中心' }, { source: 'kpl-zt-reason', boardTopic: '中报增长' }, { source: 'limit-up-db-reason', boardTopic: '通信设备' }] });

// 场景1:星网 hard 改判 → 并入算力、跨族剔除、同族保留;紫光未涨停不动。
(() => {
  const seedByKey = buildSeeds();
  const currentReasonDb = { stocks: [ HARD('002396', '星网锐捷'), HARD('000938', '紫光股份') ] };
  const todayLimit = new Set(['002396', '600588']);   // 星网+另一算力成分涨停;紫光未涨停
  const { hard, soft } = strategyMainlineApplyCurrentReasonAttribution(seedByKey, currentReasonDb, todayLimit);

  const seedCompute = seedByKey.get(strategyMainlineTopicKey('算力'));
  A(seedCompute.codeSet.has('002396'), '星网(002396)被并入算力 seed(算力AI 族)');
  A(!seedByKey.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), '星网已从网络安全 seed 剔除(跨族)');
  A(!seedByKey.get(strategyMainlineTopicKey('数字货币')).codeSet.has('002396'), '星网已从数字货币 seed 剔除(跨族)');
  A(seedByKey.get(strategyMainlineTopicKey('液冷')).codeSet.has('002396'), '星网保留在液冷 seed(同属算力AI 家族)');
  A(hard.get('002396') === 'group:算力AI', 'hard 映射记录星网归属算力AI 家族');
  A(!seedCompute.codeSet.has('000938'), '紫光(未涨停)不被归属并入 todayCodes');
  A(seedCompute.codeSet.has('600588'), '算力 seed 原有涨停成分 600588 不受影响');
  A(hard.size === 1 && soft.size === 0, 'hard 仅含当日涨停+有综合主因的星网,soft 为空');
})();

// 场景2:comprehensive detach(Codex 第4点)——六个集合 + countFallback 全部同步清理。
(() => {
  const seedByKey = new Map();
  const net = strategyMainlineEnsureSeed(seedByKey, '网络安全');
  // 让星网在网络安全 seed 的全部在场集合里都出现,并把 countFallback 记为 2
  net.codeSet.add('002396'); net.realtimeCodeSet.add('002396');
  net.risingCodeSet.add('002396'); net.nearLimitCodeSet.add('002396');
  strategyMainlineAddRisingStock(net.risingStockMap, { code: '002396', gain: 8 });
  strategyMainlineAddRisingStock(net.nearLimitStockMap, { code: '002396', gain: 9 });
  net.codeSet.add('600002'); net.realtimeCodeSet.add('600002');   // 一只真属网络安全的股
  net.countFallback = 2;

  const db = { stocks: [ HARD('002396', '星网锐捷') ] };
  strategyMainlineApplyCurrentReasonAttribution(seedByKey, db, new Set(['002396', '600002']));

  A(!net.codeSet.has('002396'), 'detach:codeSet 移除星网');
  A(!net.realtimeCodeSet.has('002396'), 'detach:realtimeCodeSet 移除星网');
  A(!net.risingCodeSet.has('002396'), 'detach:risingCodeSet 移除星网(bigGainCount 不再计)');
  A(!net.nearLimitCodeSet.has('002396'), 'detach:nearLimitCodeSet 移除星网');
  A(!net.risingStockMap.has('002396'), 'detach:risingStockMap 移除星网(risingStocks 不再含)');
  A(!net.nearLimitStockMap.has('002396'), 'detach:nearLimitStockMap 移除星网');
  A(net.countFallback === 1, 'detach:countFallback 从 2 减到 1(移走一个实时成分)');
  A(net.codeSet.has('600002'), '真属网络安全的 600002 不受影响');
})();

// 场景3:soft 证据(孤源/来源不足)绝不改写 seeds(Codex 第5点)。
(() => {
  const seedByKey = buildSeeds();
  const before = new Set(seedByKey.get(strategyMainlineTopicKey('网络安全')).codeSet);
  const db = { stocks: [ { code: '002396', name: '星网锐捷', finalBoardTopic: '算力', candidates: [{ source: 'only-one', boardTopic: '数据中心' }] } ] };
  const { hard, soft } = strategyMainlineApplyCurrentReasonAttribution(seedByKey, db, new Set(['002396']));
  A(hard.size === 0 && soft.has('002396'), 'soft:低置信记入 soft,不进 hard');
  A(seedByKey.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), 'soft:网络安全 seed 未被跨族删除(星网仍在)');
  A(!seedByKey.get(strategyMainlineTopicKey('算力')).codeSet.has('002396'), 'soft:未强行并入算力 seed');
  A([...seedByKey.get(strategyMainlineTopicKey('网络安全')).codeSet].join() === [...before].join(), 'soft:网络安全 seed 完全不变');
})();

// 场景4:null/空涨停集合 → 完全不改动(行为不变)。
(() => {
  const s1 = buildSeeds();
  const r1 = strategyMainlineApplyCurrentReasonAttribution(s1, null, new Set(['002396']));
  A(r1.hard.size === 0 && r1.soft.size === 0, 'null 主因库:hard/soft 均空');
  A(s1.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), 'null 主因库:seeds 不变');
  const s2 = buildSeeds();
  const r2 = strategyMainlineApplyCurrentReasonAttribution(s2, { stocks: [HARD('002396', '星网')] }, new Set());
  A(r2.hard.size === 0, '空涨停集合:无股被归属');
  A(s2.get(strategyMainlineTopicKey('网络安全')).codeSet.has('002396'), '空涨停集合:seeds 不变');
})();

if (process.exitCode) console.error('\nSOME MAINLINE-ATTRIBUTION CHECKS FAILED');
else console.log('\nALL MAINLINE-ATTRIBUTION CHECKS PASSED');
