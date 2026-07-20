// 预期/确认明星"粘性保留"抗题材漂移测试(node tests/strategy-expected-star-sticky.test.js)。
// 生产证据(2026-07-20):上午两源"算力AI"主线的浪潮信息已明星确认(11:15 快照),午后家族
// 并组命名漂移为"算力",familyKey 由 group:算力AI 变 theme:算力,轨迹精确匹配失败 →
// 主线卡消失,违反 Owner「当日出过明星永久保留」规则(#123)。
// 修复:轨迹行记录当时成分板 plateId(mainlineBoardIds);匹配回退两级——
// 题材经当前归类重新规范化同族,或成分板 plateId 有交集。绝不跨来源、绝不模糊字符串匹配。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) break; } }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
const STRATEGY_MAINLINE_STAR_LEVEL_ORDER = { confirmed: 0, expected: 1, active: 2 };
// 题材归类 stub:模拟生产漂移场景——"算力AI"与"算力"同归 group:算力AI;"白酒"独立;未知词原样。
const strategyMainlineFamilyInfo = (x) => {
  const theme = String(x?.theme || '').trim();
  if (theme === '算力AI' || theme === '算力') return { key: 'group:算力AI' };
  return { key: `theme:${theme}` };
};
eval(extractFn('strategyPredictStarTransitions'));
eval(extractFn('strategyMainlineExpectedTransitionMap'));
eval(extractFn('strategyMainlineResolveExpectedHistory'));
eval(extractFn('strategyMainlineAttachExpectedHistory'));

// ---- 1. 轨迹落库携带当时成分板 plateId ----
const morning = strategyPredictStarTransitions([], [{
  familyKey: 'group:算力AI', theme: '算力AI',
  resonanceBoards: [{ plateId: '885728', name: '算力租赁' }, { plateId: 'BK1134', name: '算力概念' }],
  starStocks: [{ code: '000977', name: '浪潮信息', level: 'expected', gain: 6.2 }],
}], '2026-07-20T02:00:00.000Z');
A(morning.length === 1 && morning[0].mainlineBoardIds.join(',') === '885728,BK1134',
  '落库:轨迹行记录主线当时的成分板 plateId(漂移锚点)');
// 再次观测(已确认)保留 boardIds 并集
const confirmedRows = strategyPredictStarTransitions(morning, [{
  familyKey: 'group:算力AI', theme: '算力AI',
  resonanceBoards: [{ plateId: '885728', name: '算力租赁' }],
  starStocks: [{ code: '000977', name: '浪潮信息', level: 'confirmed', gain: 10.01 }],
}], '2026-07-20T03:15:00.000Z');
A(confirmedRows[0].confirmedAt === '2026-07-20T03:15:00.000Z' && confirmedRows[0].mainlineBoardIds.includes('BK1134'),
  '落库:晋级确认后 boardIds 保留历史并集(不因单次观测缩板而丢锚)');

// ---- 2. 直接命中不受影响 ----
const map = strategyMainlineExpectedTransitionMap({ starTransitions: confirmedRows });
A(strategyMainlineResolveExpectedHistory({ familyKey: 'group:算力AI', theme: '算力AI' }, map).length === 1,
  '匹配:familyKey 精确命中(原路径不变)');

// ---- 3. 生产复现:家族漂移 group:算力AI → theme:算力,归类回退命中 ----
const drifted = { familyKey: 'theme:算力', theme: '算力', l2VerificationStatus: 'unscanned', l2ScanState: 'not-eligible',
  starStocks: [], resonanceBoards: [{ plateId: '885728', name: '算力租赁' }] };
const hist = strategyMainlineResolveExpectedHistory(drifted, map);
A(hist.length === 1 && hist[0].code === '000977', '匹配:题材归类规范化后同族("算力"→group:算力AI)命中轨迹');
const attached = strategyMainlineAttachExpectedHistory(drifted, map, '尾盘');
A(attached.hadExpectedStarToday === true && attached.l2VerificationStatus === 'qi'
  && attached.starStocks[0].level === 'confirmed' && attached.starStocks[0].name === '浪潮信息',
  '粘性:漂移后的"算力"候选恢复 QI 资格并保留浪潮信息明星确认——2026-07-20 实盘缺陷回归');

// ---- 4. 归类也失效时,成分板 plateId 交集兜底 ----
const mapNoTaxonomy = strategyMainlineExpectedTransitionMap({ starTransitions: confirmedRows.map(r => ({ ...r, mainlineTheme: '' })) });
const boardOnly = strategyMainlineResolveExpectedHistory(
  { familyKey: 'theme:云算力', theme: '云算力', resonanceBoards: [{ plateId: '885728' }] }, mapNoTaxonomy);
A(boardOnly.length === 1, '匹配:主题信息缺失时,成分板 plateId 交集兜底命中');

// ---- 5. 不相干题材绝不误粘 ----
A(strategyMainlineResolveExpectedHistory(
  { familyKey: 'theme:白酒', theme: '白酒', resonanceBoards: [{ plateId: 'BK0477' }] }, map).length === 0,
  '防误粘:白酒(无共板、非同族)不借用算力的明星轨迹');
// 缺 resonanceBoards 的候选:仅靠归类,同样不误粘
A(strategyMainlineResolveExpectedHistory({ familyKey: 'theme:机器人', theme: '机器人' }, map).length === 0,
  '防误粘:无成分板信息的不相干候选返回空');

// ---- 6. 静态:Map 形状契约保持(既有调用按 key 直查仍有效),rows 仅为附加索引 ----
A(map instanceof Map && map.has('group:算力AI') && Array.isArray(map.rows),
  '契约:TransitionMap 仍是 Map(附加 rows 索引,不破坏既有直查)');
A(/history = strategyMainlineResolveExpectedHistory\(item, transitionMap\)/.test(src),
  '静态:attach 走漂移安全解析器');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-EXPECTED-STAR-STICKY CHECKS PASSED');
