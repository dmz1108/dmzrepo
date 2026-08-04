// issue #375 PR A:词典声明式族字段与裁决泛化的行为等价测试。
// 基线 fixture 由改造前代码(main@5f004d8)对 taxonomy 全部词枚举生成;
// 本测试断言新实现对同一词表逐词产出完全相同的族键/标签/组。
// PR B(首批族划分)属有意行为变更,届时按对照要求更新 fixture 并在交接记录差异。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
function extractArr(name) {
  const d = src.indexOf('const ' + name + ' = [');
  const s = src.indexOf('[', d);
  let depth = 0, i = s;
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) break; }
  }
  return src.slice(d, i + 2).replace('const ', 'var ');
}
function extractSet(name) {
  const m = src.match(new RegExp(`const ${name} = new Set\\(\\[([\\s\\S]*?)\\]\\)`));
  if (!m) throw new Error('not found set: ' + name);
  return new Set(eval('[' + m[1] + ']'));
}
const A = (cond, msg) => {
  if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('ok: ' + msg);
};

const THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
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
eval(extractFn('strategyMainlineTopicKey'));
eval(extractFn('strategyThemeTaxonomyInfo'));
const STRATEGY_MAINLINE_MERGE_GROUPS = extractSet('STRATEGY_MAINLINE_MERGE_GROUPS');
const STRATEGY_MAINLINE_KEEP_FINE_THEMES = extractSet('STRATEGY_MAINLINE_KEEP_FINE_THEMES');
eval(extractFn('strategyMainlineFamilyInfo'));
eval(extractFn('strategyThemeTaxonomyValidateFamilyUnits'));
strategyThemeTaxonomyValidateFamilyUnits._ready = true;   // 生产中由字面集合声明后的显式调用置位
eval(extractFn('strategyMainlineFamilyCompat'));
eval(extractFn('normalizeReasonSourceCode'));
eval(extractFn('strategyMainlineStarAttributionDecision'));

// 1. 全词逐一等价:1102 词的族键/标签/组与改造前基线完全一致。
const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'family-key-baseline.json'), 'utf8'));
let mismatch = 0;
const samples = [];
for (const [word, expected] of Object.entries(baseline.families)) {
  const got = strategyMainlineFamilyInfo({ theme: word });
  if (got.key !== expected.key || got.label !== expected.label || String(got.group || '') !== expected.group) {
    mismatch += 1;
    if (samples.length < 5) samples.push(`${word}: ${expected.key} -> ${got.key}`);
  }
}
A(mismatch === 0, `声明式 familyUnit 与改造前行为逐词等价(${Object.keys(baseline.families).length} 词,差异 ${mismatch}${samples.length ? ': ' + samples.join(' | ') : ''})`);

// 2. 一致性校验:当前词典必须通过;人为制造漂移必须抛错。
let threw = false;
try { strategyThemeTaxonomyValidateFamilyUnits(); } catch { threw = true; }
A(!threw, '当前词典通过 familyUnit 与字面集合一致性校验');
const tampered = THEME_TAXONOMY.taxonomy.find(t => themeDisplayName(t.standard) === '火电热电');
const savedUnit = tampered.familyUnit;
tampered.familyUnit = 'group';
threw = false;
try { strategyThemeTaxonomyValidateFamilyUnits(); } catch { threw = true; }
if (savedUnit === undefined) delete tampered.familyUnit; else tampered.familyUnit = savedUnit;
A(threw, '词典字段与字面集合漂移时校验立即抛错(fail-fast)');
// 反向检查(#342 7b6dcf7 的真实失败形状):集合孤儿项必须抛错,不得静默空操作。
STRATEGY_MAINLINE_KEEP_FINE_THEMES.add('AI视频');
threw = false;
try { strategyThemeTaxonomyValidateFamilyUnits(); } catch (e) { threw = /孤儿项 'AI视频'/.test(String(e.message)); }
STRATEGY_MAINLINE_KEEP_FINE_THEMES.delete('AI视频');
A(threw, 'KEEP_FINE 孤儿项(词典无此 standard)被反向检查抛错');
STRATEGY_MAINLINE_MERGE_GROUPS.add('不存在的组');
threw = false;
try { strategyThemeTaxonomyValidateFamilyUnits(); } catch (e) { threw = /孤儿项 '不存在的组'/.test(String(e.message)); }
STRATEGY_MAINLINE_MERGE_GROUPS.delete('不存在的组');
A(threw, 'MERGE_GROUPS 孤儿项(词典无此 group)被反向检查抛错');

// 3. 兼容关系图:与被删除的 4 处硬编码语义一致。
const compat = strategyMainlineFamilyCompat();
A(compat.parentByChild.get('theme:火电热电')?.has('theme:电力')
  && compat.parentByChild.get('theme:绿电新能源运营')?.has('theme:电力')
  && compat.parentByChild.get('theme:水电')?.has('theme:电力')
  && compat.parentByChild.size === 3,
'发电侧三子族→电力父族关系由词典声明构建,无多余关系');
A(compat.broadFallback.get('theme:AI应用')?.has('theme:短剧游戏') && compat.broadFallback.size === 1,
  'AI应用宽词兜底→短剧游戏关系由词典声明构建');

// 4. 裁决行为回归:华电辽能父子兼容、蓝色光标宽兜底、兄弟与跨族拒绝全部保持原 basis。
const ctxOf = rows => {
  const out = new Map();
  for (const [code, families, broadOnly] of rows) {
    out.set(code, {
      currentFamilies: new Set(families), currentTopics: families, currentSource: 'ths-limit-up-pool',
      currentBroadOnly: broadOnly === true,
      priorFamilies: new Set(), priorTopics: [],
    });
  }
  return out;
};
const electric = { theme: '电力', familyKey: 'theme:电力' };
const d1 = strategyMainlineStarAttributionDecision(electric, { code: '600396' }, ctxOf([['600396', ['theme:火电热电'], false]]));
A(d1.allowed && d1.basis === 'current-limit-reason-child-compatible', '华电辽能:火电子族证据支撑电力父族(basis 不变)');
const d2 = strategyMainlineStarAttributionDecision({ theme: '绿色电力', familyKey: 'theme:绿电新能源运营' }, { code: '600396' }, ctxOf([['600396', ['theme:火电热电'], false]]));
A(!d2.allowed, '兄弟互借(火电证据→绿电候选)仍拒绝');
const d3 = strategyMainlineStarAttributionDecision(electric, { code: '601700' }, ctxOf([['601700', ['theme:电网设备/特高压', 'theme:电网设备'], false]]));
A(!d3.allowed, '电网设备证据不得支撑发电侧电力');
const d4 = strategyMainlineStarAttributionDecision({ theme: '短剧游戏', familyKey: 'theme:短剧游戏' }, { code: '300058' }, ctxOf([['300058', ['theme:AI应用'], true]]));
A(d4.allowed && d4.basis === 'current-limit-reason-broad-compatible', '蓝色光标:宽词AI应用兜底归短剧(basis 不变)');
const d5 = strategyMainlineStarAttributionDecision({ theme: '算力AI', familyKey: 'group:算力AI' }, { code: '300058' }, ctxOf([['300058', ['theme:AI应用'], true]]));
A(!d5.allowed, '宽词AI应用不得兜底进算力AI');
const d6 = strategyMainlineStarAttributionDecision({ theme: '短剧游戏', familyKey: 'theme:短剧游戏' }, { code: '300058' }, ctxOf([['300058', ['theme:AI应用', 'theme:算力/数据中心'], false]]));
A(!d6.allowed, '证据含具体词(非 broadOnly)时宽兜底不生效,维持冲突拒绝');

// 5. 静态:4 处硬编码已删除。
A(!src.includes('isPowerParentCompatible') && !src.includes("currentFamilies.has('theme:AI应用')")
  && !src.includes("priorFamilies.has('theme:AI应用')"),
'裁决函数中的电力父子/AI应用宽兜底硬编码已全部删除');

// 6. [Codex P1] 兼容引用校验:拼错/重复/自引用/宽词限制/空引用全部抛错,不得回退自由文本族键。
const cloneTax = () => JSON.parse(JSON.stringify(THEME_TAXONOMY));
const expectInvalid = (mutate, pattern, msg) => {
  const candidate = cloneTax();
  mutate(candidate.taxonomy.find(t => themeDisplayName(t.standard) === '火电热电'));
  let caught = '';
  try { strategyThemeTaxonomyValidateFamilyUnits(candidate); } catch (e) { caught = String(e.message); }
  A(pattern.test(caught), msg + '(实际: ' + (caught.slice(0, 80) || '未抛错') + ')');
};
expectInvalid(t => { t.compatibleParents = ['电历']; }, /引用不存在的 standard '电历'/, '拼错目标(电力→电历)交换前抛错');
expectInvalid(t => { t.compatibleParents = ['电力', '电力']; }, /重复边 '电力'/, '重复边抛错');
expectInvalid(t => { t.compatibleParents = ['火电热电']; }, /自引用/, '自引用抛错');
expectInvalid(t => { t.broadFallbackFamilies = ['短剧游戏']; }, /只能声明在 broad:true/, '非宽词条目声明 broadFallbackFamilies 抛错');
expectInvalid(t => { t.compatibleParents = ['']; }, /含空引用/, '空引用抛错');

// 7. [Codex P1] 构图层第二道网:即便绕过校验,FamilyCompat 构图遇幽灵目标也抛错。
const hotEntry = THEME_TAXONOMY.taxonomy.find(t => themeDisplayName(t.standard) === '火电热电');
const savedParents = hotEntry.compatibleParents;
hotEntry.compatibleParents = ['电历'];
strategyMainlineFamilyCompat._cache = null;
let ghostThrew = false;
try { strategyMainlineFamilyCompat(); } catch (e) { ghostThrew = /幽灵族边/.test(String(e.message)); }
hotEntry.compatibleParents = savedParents;
strategyMainlineFamilyCompat._cache = null;
A(ghostThrew, '构图遇不存在的引用目标抛错(幽灵族边),不静默生成');
A(strategyMainlineFamilyCompat().parentByChild.get('theme:火电热电')?.has('theme:电力'),
  '恢复后关系图重建正常');

// 8. [Codex P2] 热加载事务性:语义无效但 JSON 合法的候选 → 抛错且全部旧状态保持不变。
(function (THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, THEME_DROP_RE, fsSync, THEME_TAXONOMY_PATH) {
  eval(extractFn('loadThemeTaxonomy'));
  const invalid = cloneTax();
  invalid.taxonomy.find(t => themeDisplayName(t.standard) === '火电热电').familyUnit = 'group';
  fsSync.readFileSync = () => JSON.stringify(invalid);
  const beforeTax = THEME_TAXONOMY, beforeNb = THEME_NONBROAD, beforeB = THEME_BROAD;
  const sentinel = { sentinel: true };
  strategyMainlineFamilyCompat._cache = sentinel;
  let threwHot = false;
  try { loadThemeTaxonomy(); } catch (e) { threwHot = /词典声明校验失败/.test(String(e.message)); }
  A(threwHot, '热加载语义无效候选时在交换前抛错');
  A(THEME_TAXONOMY === beforeTax && THEME_NONBROAD === beforeNb && THEME_BROAD === beforeB,
    '抛错后 THEME_TAXONOMY/NONBROAD/BROAD 保持旧引用,进程内状态未被污染');
  A(strategyMainlineFamilyCompat._cache === sentinel, '抛错后 compat 缓存未被清空');
  strategyMainlineFamilyCompat._cache = null;
  const parseFail = (() => { fsSync.readFileSync = () => '{broken json'; const t0 = THEME_TAXONOMY; try { loadThemeTaxonomy(); } catch { return false; } return THEME_TAXONOMY === t0; })();
  A(parseFail, 'JSON 损坏时静默保留旧状态(不抛出到调用方,与旧行为一致)');
})(THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, null, { readFileSync: () => '{}' }, 'mem://candidate');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL FAMILY-DECLARATIVE-EQUIVALENCE CHECKS PASSED');
