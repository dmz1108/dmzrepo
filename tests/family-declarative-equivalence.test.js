// issue #375 PR B:首批交易族划分(电力发电侧合族;算力硬件/AI软件应用分家;核电、电网设备
// 独立观察;短剧游戏维持独立细族)。fixture 已按新行为重生成,旧→新逐词 diff(104 词)
// 记录于 docs/DAILY_HANDOFF.md 与 PR 描述。历史字面集合(MERGE_GROUPS/KEEP_FINE)与
// _ready 门闩已退役:词典声明式字段是唯一判定来源。
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
eval(extractFn('strategyMainlineFamilyInfo'));
eval(extractFn('strategyMainlineBoardThemeRelated'));
eval(extractFn('strategyThemeTaxonomyValidateFamilyUnits'));
eval(extractFn('strategyMainlineCompatEntryKey'));
eval(extractFn('strategyMainlineFamilyCompat'));
eval(extractFn('normalizeReasonSourceCode'));
eval(extractFn('strategyMainlineStarAttributionDecision'));

// 1. 全词逐一对照:1102 词的族键/标签/组与 PR B 重生成的基线完全一致。
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
A(mismatch === 0, `词典声明式族键与 PR B 基线逐词一致(${Object.keys(baseline.families).length} 词,差异 ${mismatch}${samples.length ? ': ' + samples.join(' | ') : ''})`);

// 2. PR B 族划分定稿(Owner 确认清单)逐条落地。
let threw = false;
try { strategyThemeTaxonomyValidateFamilyUnits(); } catch { threw = true; }
A(!threw, '当前词典通过声明校验(无参复检路径)');
const famKey = w => strategyMainlineFamilyInfo({ theme: w }).key;
A(famKey('电力') === 'group:电力' && famKey('火电') === 'group:电力'
  && famKey('绿电') === 'group:电力' && famKey('水电') === 'group:电力',
  '电力发电侧合族:电力/火电/绿电/水电全部落 group:电力');
A(famKey('液冷') === 'group:算力硬件' && famKey('算力') === 'group:算力硬件'
  && famKey('AI服务器') === 'group:算力硬件',
  '算力硬件族:液冷/算力/AI服务器落 group:算力硬件');
A(famKey('AI应用') === 'group:AI软件应用' && famKey('人工智能') === 'group:AI软件应用',
  'AI软件应用族:AI应用/人工智能落 group:AI软件应用(与算力硬件分家)');
A(famKey('核电') === 'theme:核电' && famKey('电网设备') !== 'group:电力',
  '核电、电网设备不并入电力发电族,保持独立观察');
A(famKey('短剧游戏') === 'theme:短剧游戏',
  '短剧游戏维持独立细族(familyUnit=standard)');

// 2b. [Codex PR #381 P1] 实时板块关联:双方已识别、异 standard 异 group → 拒绝,
// 不得走字符串包含兜底把"电力设备"并进发电侧。正反 6 例锁死。
A(!strategyMainlineBoardThemeRelated('电力设备', '电力'), '电力设备 ~ 电力 拒绝(不再因包含"电力"二字误并)');
A(!strategyMainlineBoardThemeRelated('电网设备', '电力'), '电网设备 ~ 电力 拒绝');
A(!strategyMainlineBoardThemeRelated('特高压', '电力'), '特高压 ~ 电力 拒绝');
A(strategyMainlineBoardThemeRelated('火电', '电力'), '火电 ~ 电力 同族放行');
A(strategyMainlineBoardThemeRelated('绿电', '电力'), '绿电 ~ 电力 同族放行');
A(strategyMainlineBoardThemeRelated('水电', '电力'), '水电 ~ 电力 同族放行');

// 3. 兼容关系图:发电侧 compatibleParents 已随合族移除;宽词兜底保留并随族键迁移。
const compat = strategyMainlineFamilyCompat();
A(compat.parentByChild.size === 0,
  '合族后无 compatibleParents 声明,parentByChild 为空(父子兼容被族内精确匹配取代)');
A(compat.broadFallback.get('group:AI软件应用')?.has('theme:短剧游戏') && compat.broadFallback.size === 1,
  'AI应用宽词兜底→短剧游戏保留,声明方族键迁移为 group:AI软件应用');

// 4. 裁决行为:合族后族内精确匹配取代父子兼容;跨族与硬/软分家仍拒绝;宽兜底保持。
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
const electric = { theme: '电力', familyKey: famKey('电力') };
const d1 = strategyMainlineStarAttributionDecision(electric, { code: '600396' }, ctxOf([['600396', [famKey('火电')], false]]));
A(d1.allowed && d1.basis === 'current-limit-reason', '华电辽能:火电证据与电力候选同族,精确匹配放行(不再需要 child-compatible 边)');
const d2 = strategyMainlineStarAttributionDecision({ theme: '绿色电力', familyKey: famKey('绿电') }, { code: '600396' }, ctxOf([['600396', [famKey('火电')], false]]));
A(d2.allowed && d2.basis === 'current-limit-reason', '发电侧同族互认:火电证据支撑绿电候选(PR B 合族的目标行为)');
const d3 = strategyMainlineStarAttributionDecision(electric, { code: '601700' }, ctxOf([['601700', [famKey('电网设备'), famKey('特高压')], false]]));
A(!d3.allowed, '电网设备证据不得支撑发电侧电力(独立观察)');
const dNuke = strategyMainlineStarAttributionDecision(electric, { code: '601985' }, ctxOf([['601985', [famKey('核电')], false]]));
A(!dNuke.allowed, '核电证据不得支撑发电侧电力(独立观察)');
const d4 = strategyMainlineStarAttributionDecision({ theme: '短剧游戏', familyKey: famKey('短剧游戏') }, { code: '300058' }, ctxOf([['300058', [famKey('AI应用')], true]]));
A(d4.allowed && d4.basis === 'current-limit-reason-broad-compatible', '蓝色光标:宽词AI应用兜底归短剧(basis 不变,族键已迁移)');
const d5 = strategyMainlineStarAttributionDecision({ theme: '算力', familyKey: famKey('算力') }, { code: '300058' }, ctxOf([['300058', [famKey('AI应用')], true]]));
A(!d5.allowed, '宽词AI应用不得兜底进算力硬件族(硬/软分家)');
const dHw = strategyMainlineStarAttributionDecision({ theme: 'AI应用', familyKey: famKey('AI应用') }, { code: '300442' }, ctxOf([['300442', [famKey('液冷')], false]]));
A(!dHw.allowed, '液冷(算力硬件)证据不得支撑AI软件应用候选(硬/软分家)');
const d6 = strategyMainlineStarAttributionDecision({ theme: '短剧游戏', familyKey: famKey('短剧游戏') }, { code: '300058' }, ctxOf([['300058', [famKey('AI应用'), famKey('算力')], false]]));
A(!d6.allowed, '证据含具体词(非 broadOnly)时宽兜底不生效,维持冲突拒绝');

// 5. 静态:4 处硬编码与历史字面集合、_ready 门闩均已删除。
A(!src.includes('isPowerParentCompatible') && !src.includes("currentFamilies.has('theme:AI应用')")
  && !src.includes("priorFamilies.has('theme:AI应用')"),
'裁决函数中的电力父子/AI应用宽兜底硬编码已全部删除');
A(!src.includes('STRATEGY_MAINLINE_MERGE_GROUPS = new Set') && !src.includes('STRATEGY_MAINLINE_KEEP_FINE_THEMES = new Set')
  && !src.includes('strategyThemeTaxonomyValidateFamilyUnits._ready'),
'历史字面集合与 _ready 门闩已退役,词典为唯一判定来源');

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
hotEntry.compatibleParents = ['电历'];
strategyMainlineFamilyCompat._cache = null;
let ghostThrew = false;
try { strategyMainlineFamilyCompat(); } catch (e) { ghostThrew = /幽灵族边/.test(String(e.message)); }
delete hotEntry.compatibleParents;
strategyMainlineFamilyCompat._cache = null;
A(ghostThrew, '构图遇不存在的引用目标抛错(幽灵族边),不静默生成');
A(strategyMainlineFamilyCompat().parentByChild.size === 0
  && strategyMainlineFamilyCompat().broadFallback.get('group:AI软件应用')?.has('theme:短剧游戏'),
  '恢复后关系图重建正常(空父子边 + 保留宽兜底)');

// 8. [Codex P2] 热加载事务性:语义无效但 JSON 合法的候选 → 抛错且全部旧状态保持不变。
(function (THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, THEME_DROP_RE, fsSync, THEME_TAXONOMY_PATH) {
  eval(extractFn('loadThemeTaxonomy'));
  const invalid = cloneTax();
  invalid.taxonomy.find(t => themeDisplayName(t.standard) === '火电热电').compatibleParents = ['电历'];
  fsSync.readFileSync = () => JSON.stringify(invalid);
  const beforeTax = THEME_TAXONOMY, beforeNb = THEME_NONBROAD, beforeB = THEME_BROAD;
  const sentinel = { sentinel: true };
  strategyMainlineFamilyCompat._cache = sentinel;
  let threwHot = false;
  try { loadThemeTaxonomy(); } catch (e) { threwHot = /词典声明校验失败/.test(String(e.message)); }
  A(threwHot, '热加载语义无效候选(幽灵引用)时在交换前抛错');
  A(THEME_TAXONOMY === beforeTax && THEME_NONBROAD === beforeNb && THEME_BROAD === beforeB,
    '抛错后 THEME_TAXONOMY/NONBROAD/BROAD 保持旧引用,进程内状态未被污染');
  A(strategyMainlineFamilyCompat._cache === sentinel, '抛错后 compat 缓存未被清空');
  strategyMainlineFamilyCompat._cache = null;
  const parseFail = (() => { fsSync.readFileSync = () => '{broken json'; const t0 = THEME_TAXONOMY; try { loadThemeTaxonomy(); } catch { return false; } return THEME_TAXONOMY === t0; })();
  A(parseFail, 'JSON 损坏时静默保留旧状态(不抛出到调用方,与旧行为一致)');
})(THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, null, { readFileSync: () => '{}' }, 'mem://candidate');

// 9. [Codex 二轮 P1] 遮蔽 standard 不得作为兼容参与方:关键词抢先命中与 topicKey 折叠均拒绝。
expectInvalid(t => { t.compatibleParents = ['光伏玻璃']; }, /被关键词匹配遮蔽\(命中 '光伏'\)/,
  '引用目标被关键词抢先命中(光伏玻璃→光伏)交换前抛错');
expectInvalid(t => { t.compatibleParents = ['氢能燃料电池']; }, /被关键词匹配遮蔽\(命中 '锂电池'\)/,
  '引用目标被关键词抢先命中(氢能燃料电池→锂电池)交换前抛错');
expectInvalid(t => { t.compatibleParents = ['工业气体电子特气']; }, /被关键词匹配遮蔽/,
  '引用目标为遮蔽的 group 单位条目(工业气体电子特气)同样拒绝');
// 构图层同样拒绝(第二道网,直接派生不回退模糊匹配)。
hotEntry.compatibleParents = ['氢能燃料电池'];
strategyMainlineFamilyCompat._cache = null;
let shadowThrew = false;
try { strategyMainlineFamilyCompat(); } catch (e) { shadowThrew = /被关键词匹配遮蔽|topicKey 折叠/.test(String(e.message)); }
delete hotEntry.compatibleParents;
strategyMainlineFamilyCompat._cache = null;
A(shadowThrew, '构图遇遮蔽目标抛错,不再送回关键词匹配器连错族');
A(strategyMainlineFamilyCompat().parentByChild.size === 0,
  '遮蔽用例恢复后关系图重建正常');

// 10. [Codex 二轮 P1] 结构校验覆盖缺失/非数组/重复 standard/空词典(无门闩,始终执行)。
const expectStructural = (candidate, pattern, msg) => {
  let caught = '';
  try { strategyThemeTaxonomyValidateFamilyUnits(candidate); } catch (e) { caught = String(e.message); }
  A(pattern.test(caught), msg + '(实际: ' + (caught.slice(0, 70) || '未抛错') + ')');
};
expectStructural({}, /缺少非空 taxonomy 数组/, '候选完全没有 taxonomy 键 → 抛错');
expectStructural({ taxonomy: null }, /缺少非空 taxonomy 数组/, 'taxonomy:null → 抛错');
expectStructural({ dropped: [] }, /缺少非空 taxonomy 数组/, '只有 dropped 的候选 → 抛错(Codex 回放形状)');
expectStructural({ taxonomy: [] }, /缺少非空 taxonomy 数组/, '空 taxonomy 数组 → 抛错');
expectStructural([], /普通对象/, '数组形态候选 → 抛错');
expectStructural({ taxonomy: [{ standard: 'X' }], dropped: {} }, /dropped 若存在必须是数组/, 'dropped 非数组 → 抛错');
const dupCandidate = cloneTax();
dupCandidate.taxonomy.push(JSON.parse(JSON.stringify(dupCandidate.taxonomy[0])));
expectStructural(dupCandidate, /standard 显示名重复/, '重复 standard → 抛错');
const badKw = cloneTax();
badKw.taxonomy[0].keywords = 'not-array';
expectStructural(badKw, /keywords 必须是数组/, 'keywords 非数组 → 抛错');
// [Codex PR #381 P1] familyUnit 白名单:拼错值/缺 group 均 fail-fast,不得静默降级整族。
const badUnit = cloneTax();
badUnit.taxonomy.find(t => String(t.standard).startsWith('算力')).familyUnit = 'groups';
expectStructural(badUnit, /familyUnit 非法值 'groups'/, "familyUnit 拼错值 'groups' → 抛错(不静默降为细键)");
const badUnit2 = cloneTax();
badUnit2.taxonomy.find(t => String(t.standard).startsWith('算力')).familyUnit = 'GROUP';
expectStructural(badUnit2, /familyUnit 非法值 'GROUP'/, "familyUnit 大小写错值 'GROUP' → 抛错");
const noGroup = cloneTax();
const ngEntry = noGroup.taxonomy.find(t => String(t.standard).startsWith('算力'));
ngEntry.familyUnit = 'group';
ngEntry.group = '';
expectStructural(noGroup, /familyUnit='group' 但缺少非空 group/, "familyUnit='group' 而 group 为空 → 抛错");

// 11. [Codex 二轮 P1] 热加载 Codex 回放形状 {"dropped":[]}:必须抛错且不交换。
(function (THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, THEME_DROP_RE, fsSync, THEME_TAXONOMY_PATH) {
  eval(extractFn('loadThemeTaxonomy'));
  fsSync.readFileSync = () => '{"dropped":[]}';
  const beforeTax = THEME_TAXONOMY;
  const sentinel = { sentinel: true };
  strategyMainlineFamilyCompat._cache = sentinel;
  let threwShape = false;
  try { loadThemeTaxonomy(); } catch (e) { threwShape = /缺少非空 taxonomy 数组/.test(String(e.message)); }
  A(threwShape && THEME_TAXONOMY === beforeTax && strategyMainlineFamilyCompat._cache === sentinel,
    'Codex 回放形状 {\"dropped\":[]} 热加载:抛错、不交换、缓存不清');
  strategyMainlineFamilyCompat._cache = null;
})(THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, null, { readFileSync: () => '{}' }, 'mem://candidate');

// 12. [Codex PR #381 P1] familyUnit 拼错值的候选热加载:抛错、不交换、缓存不清。
(function (THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, THEME_DROP_RE, fsSync, THEME_TAXONOMY_PATH) {
  eval(extractFn('loadThemeTaxonomy'));
  const typo = cloneTax();
  typo.taxonomy.find(t => String(t.standard).startsWith('算力')).familyUnit = 'groups';
  fsSync.readFileSync = () => JSON.stringify(typo);
  const beforeTax = THEME_TAXONOMY;
  const sentinel = { sentinel: true };
  strategyMainlineFamilyCompat._cache = sentinel;
  let threwTypo = false;
  try { loadThemeTaxonomy(); } catch (e) { threwTypo = /familyUnit 非法值/.test(String(e.message)); }
  A(threwTypo && THEME_TAXONOMY === beforeTax && strategyMainlineFamilyCompat._cache === sentinel,
    'familyUnit 拼错值候选热加载:交换前抛错、旧状态与缓存均保持');
  strategyMainlineFamilyCompat._cache = null;
})(THEME_TAXONOMY, THEME_NONBROAD, THEME_BROAD, null, { readFileSync: () => '{}' }, 'mem://candidate');

// 13. [Owner 裁定 2026-08-04 / Codex PR #381 P1-3] 历史族口径冻结:
// 生效日前的日子在旧词典纪元内解析族键与兼容关系,旧日主线结论不被新词典倒溯改变;
// 退出纪元后当前词典立即恢复。整链(FamilyInfo/FamilyCompat/裁决)在纪元内重放旧语义。
(function () {
  const effDay = (src.match(/STRATEGY_FAMILY_RECUT_EFFECTIVE_DAY = '(\d{4}-\d{2}-\d{2})'/) || [])[1];
  A(!!effDay, `生效日常量 STRATEGY_FAMILY_RECUT_EFFECTIVE_DAY 存在(${effDay || '缺失'})`);
  const legacyRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.legacy-preB.json'), 'utf8'));
  A(Array.isArray(legacyRaw.taxonomy) && legacyRaw.taxonomy.length > 0, '旧词典快照 theme-taxonomy.legacy-preB.json 存在且非空');
  // 本 IIFE 内重建整条族链,使其闭包指向可变的 THEME_* 绑定(顶层是 const,无法被纪元交换)。
  let THEME_TAXONOMY = JSON.parse(fs.readFileSync(path.join(ROOT, 'theme-taxonomy.json'), 'utf8'));
  let THEME_NONBROAD = THEME_TAXONOMY.taxonomy.filter(t => !t.broad);
  let THEME_BROAD = THEME_TAXONOMY.taxonomy.filter(t => t.broad);
  let THEME_DROP_RE = null;
  const STRATEGY_FAMILY_RECUT_EFFECTIVE_DAY = effDay;
  const LEGACY_FAMILY_ERA = {
    taxonomy: legacyRaw,
    nonbroad: legacyRaw.taxonomy.filter(t => !t.broad),
    broad: legacyRaw.taxonomy.filter(t => t.broad),
    dropRe: null,
  };
  eval(extractFn('compactDate'));
  eval(extractFn('isoFromCompactDate'));
  eval(extractFn('themeDisplayName'));
  eval(extractFn('themeKeywordMatches'));
  eval(extractFn('standardTheme'));
  eval(extractFn('topicAliasSet'));
  eval(extractFn('canonicalTopicName'));
  eval(extractFn('consensusKey'));
  eval(extractFn('strategyResonanceTopicKey'));
  eval(extractFn('strategyMainlineTopicKey'));
  eval(extractFn('strategyThemeTaxonomyInfo'));
  eval(extractFn('strategyMainlineFamilyInfo'));
  eval(extractFn('strategyMainlineCompatEntryKey'));
  eval(extractFn('strategyMainlineFamilyCompat'));
  eval(extractFn('normalizeReasonSourceCode'));
  eval(extractFn('strategyMainlineStarAttributionDecision'));
  eval(extractFn('strategyFamilyEraEnterForDay'));
  const fam = w => strategyMainlineFamilyInfo({ theme: w }).key;
  A(fam('火电') === 'group:电力' && fam('AI应用') === 'group:AI软件应用', '进入纪元前:当前词典为新口径');
  const exit = strategyFamilyEraEnterForDay('2026-08-03');
  A(fam('火电') === 'theme:火电热电' && fam('绿电') === 'theme:绿电新能源运营'
    && fam('AI应用') === 'theme:AI应用' && fam('算力') === 'group:算力AI',
    '生效日前进入纪元:族键完全按旧词典解析(火电/绿电细族、AI应用独立、算力AI 旧组)');
  A(strategyMainlineFamilyCompat().parentByChild.get('theme:火电热电')?.has('theme:电力')
    && strategyMainlineFamilyCompat().parentByChild.size === 3,
    '纪元内兼容关系图重建为旧口径(发电侧三条父子边恢复)');
  const oldDecision = strategyMainlineStarAttributionDecision(
    { theme: '电力', familyKey: 'theme:电力' }, { code: '600396' },
    new Map([['600396', { currentFamilies: new Set(['theme:火电热电']), currentTopics: ['火电热电'], currentSource: 'ths-limit-up-pool', currentBroadOnly: false, priorFamilies: new Set(), priorTopics: [] }]]),
  );
  A(oldDecision.allowed && oldDecision.basis === 'current-limit-reason-child-compatible',
    '纪元内裁决重放旧语义:华电辽能旧日按 child-compatible 放行(旧日结论不变)');
  exit();
  A(fam('火电') === 'group:电力' && fam('AI应用') === 'group:AI软件应用'
    && strategyMainlineFamilyCompat().parentByChild.size === 0,
    '退出纪元:当前词典与兼容图立即恢复新口径');
  const noop = strategyFamilyEraEnterForDay(effDay);
  A(fam('火电') === 'group:电力', '生效日当天及之后:纪元进入为空操作,直接用新口径');
  noop();
})();

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL FAMILY-DECLARATIVE-EQUIVALENCE CHECKS PASSED');
