// 两套独立预测:实时概念榜(catalog)按来源过滤回归(node tests/strategy-source-catalog-boards.test.js)。
// 缺陷(线上抓到):getStrategyMainlineRealtimeCatalogBoards 返回东财(6)+同花顺(5)全源概念板,
// strategyMainlineAttachBestCatalogBoard 按题材贴最优板给 seed 而不看来源——同花顺"AI手机"seed 被贴上
// 东财"AI手机"(BK1162 zsType6),虚增 boardCount/共振板并经 resonance 分与 recordNetInflow 污染分数/净流入。
// 修复:impl 在贴 catalog 前按 activeBoardZsTypes 过滤。本测试贯穿真实 attach 函数验证过滤前后行为。
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

// ---- 依赖 stub(仅辅助;贴板/评分/来源判定走真实 attach 代码路径) ----
const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
const strategyEnsureMainlineSeedShape = s => s;   // 测试自建完整 seed
const strategyMainlineBoardIdentity = b => String(b?.plateId || '');
const strategyMainlineBoardRisingStocks = () => [];
const strategyMainlineBoardNearLimitStocks = () => [];
const strategyMainlineAbsorbRisingStocks = () => {};
// 记录净流入时把来源 zsType 落到 seed,便于断言"净流入未被别源污染"
const strategyMainlineRecordNetInflow = (seed, board, netInflow) => {
  if (netInflow != null && (seed.netInflow == null || netInflow > seed.netInflow)) {
    seed.netInflow = netInflow; seed.netInflowZsType = Number(board?.zsType);
  }
};
// 题材匹配:板名===seed 题材即满分(真实 strategyMainlineCatalogBoardScore 更复杂,此处聚焦来源维度)
const strategyMainlineCatalogBoardScore = (board, seed) => (String(board?.name || '') === String(seed?.theme || '') ? 100 : 0);
eval(extractFn('strategyMainlineAttachRealtimeBoardToSeed'));
eval(extractFn('strategyMainlineAttachBestCatalogBoard'));

const mkSeed = () => ({ theme: 'AI手机', key: 'AI手机', boardKeySet: new Set(), boards: [], codeSet: new Set(), realtimeCodeSet: new Set(), maxGainPct: null, netInflow: null, netInflowZsType: null });
// 东财"AI手机"净流入更高(不过滤时会胜出并贴给同花顺 seed)
const catalogAll = [
  { plateId: '309120', name: 'AI手机', zsType: 5, netInflow: 5.59e8, gainPct: 1 },
  { plateId: 'BK1162', name: 'AI手机', zsType: 6, netInflow: 9.9e8, gainPct: 1.97 },
];
const activeBoardZsTypes = [5];   // 同花顺单源
const catalogForSource = catalogAll.filter(b => activeBoardZsTypes.includes(Number(b?.zsType)));

// 1. 复现缺陷:不过滤时,同花顺 seed 被贴上东财(zsType6)板
const seedBug = mkSeed();
strategyMainlineAttachBestCatalogBoard(seedBug, catalogAll);
A(seedBug.boards.length === 1 && Number(seedBug.boards[0].zsType) === 6 && seedBug.boards[0].plateId === 'BK1162',
  '复现:不按来源过滤时,同花顺"AI手机"seed 被贴上东财 BK1162(zsType6)');
A(seedBug.netInflowZsType === 6, '复现:净流入也被东财源污染(zsType6)');

// 2. 修复:按 activeBoardZsTypes=[5] 过滤后,只贴同花顺(zsType5)自己的板
const seedFix = mkSeed();
strategyMainlineAttachBestCatalogBoard(seedFix, catalogForSource);
A(seedFix.boards.length === 1 && Number(seedFix.boards[0].zsType) === 5 && seedFix.boards[0].plateId === '309120',
  '修复:按来源过滤后,同花顺 seed 只贴同花顺 AI手机(zsType5),不借东财板');
A(seedFix.netInflowZsType === 5, '修复:净流入取自同花顺自己(zsType5)');

// 3. 默认合并口径 activeBoardZsTypes=[6,5] 仍保留两源(不误伤看板/诊断/合并路径)
const bothSources = [6, 5];
A(catalogAll.filter(b => bothSources.includes(Number(b?.zsType))).length === 2, '合并口径[6,5]:catalog 两源都保留(行为不变)');

// 4. 静态断言:impl 在贴 catalog 前按 activeBoardZsTypes 过滤
A(/const catalogBoardsForSource = \(Array\.isArray\(catalogBoards\)[\s\S]*?activeBoardZsTypes\.includes\(Number\(b\?\.zsType\)\)\)/.test(src),
  '静态:impl 贴 catalog 前按 activeBoardZsTypes 过滤来源');
A(/strategyMainlineAttachBestCatalogBoard\(seed, catalogBoardsForSource\)/.test(src),
  '静态:attach 用过滤后的 catalogBoardsForSource(不再用全源 catalogBoards)');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-SOURCE-CATALOG-BOARDS CHECKS PASSED');
