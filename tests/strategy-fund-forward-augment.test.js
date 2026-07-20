// 资金前排补水·快照非空控制流测试(node tests/strategy-fund-forward-augment.test.js)。
// Codex 复核 PR#190 P1:补选若只接在「!bmap.size 才执行」的实时回退块,生产常态(当日快照
// 已存在)永远不会运行——2026-07-20 云端核验 zs6 快照 7 块且无 BK1008/BK0579,真实案例修不到。
// 本测试贯穿真实 getDayBoardsWithMembers(仅 stub IO):预置非空 zs6 当日快照(无国资云/云计算),
// 实时榜含二者 → 最终板池必须包含二者且带 fundForward 标记;快照文件绝不回写。
const fsMod = require('fs');
const path = require('path');
const src = fsMod.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
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

// ---- 环境与 IO stub(仅 IO;候选并集/取数主体走真实代码) ----
const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
const isoFromCompactDate = d => String(d);
const chinaNowParts = () => ({ day: '2026-07-20' });
const isChinaMarketTradingDay = () => true;
const resolveStrategySnapshotDay = async d => d;
const strategyMainlineDiagNoteRead = () => {};
async function mapLimit(items, limit, fn) { for (const it of items) await fn(it); }
const MIN_BOARD_GAIN_PCT = -0.5;
const BOARD_RANK_FETCH_STEP = 80;
const STRATEGY_MAINLINE_RISING_BOARD_LIMIT = 30;
const STRATEGY_MAINLINE_LIVE_BOARD_POOL = 5;
const THS_ZS_TYPE = '5';
const EASTMONEY_ZS_TYPE = '6';
const boardGainNumber = b => Number(b?.gainPct ?? b?.gain);
const getPermanentHiddenSet = async () => new Set();
const readSavedApiKey = async () => 'test-key';
const strategyApplyThsDdeFundFlow = async () => {};
const snapshotPath = (day, z) => `snap:${z}:${day}`;
// zs6 当日快照:7 块涨幅前排,不含 BK1008/BK0579(2026-07-20 云端实况)
const zs6Snapshot = { boards: [1, 2, 3, 4, 5, 6, 7].map(i => ({
  plateId: `BKS${i}`, name: `快照板${i}`, gain: 4 - i * 0.2, ztCount: 1, netInflow: 1e8, superLargeNetInflow: 1e8,
})), cardData: {} };
const fsWrites = [];
const fs = {
  readFile: async (p) => {
    // 当日与历史日快照都存在(历史日用例要证明:快照命中时补水也因"非当日"拒绝,
    // 而不是落into既有的无快照实时回退块——那是另一条既有路径,不在本修复范围)
    if (String(p) === 'snap:6:2026-07-20' || String(p) === 'snap:6:2026-07-17') return JSON.stringify(zs6Snapshot);
    const err = new Error('ENOENT'); err.code = 'ENOENT'; throw err;
  },
  writeFile: async (p) => { fsWrites.push(String(p)); },
};
let rankFetches = 0;
const fetchBoardRankingForSnapshot = async (z) => {
  rankFetches += 1;
  if (String(z) !== '6') return [];
  // 涨幅前5 = 快照板1..5(与快照重合);国资云/云计算/流出板都在涨幅池外,只可能走资金通道
  return [
    { plateId: 'BKS1', name: '快照板1', gainPct: 4.0, superLargeNetInflow: 1e8 },
    { plateId: 'BKS2', name: '快照板2', gainPct: 3.8, superLargeNetInflow: 2e8 },
    { plateId: 'BKS3', name: '快照板3', gainPct: 3.6, superLargeNetInflow: 1e8 },
    { plateId: 'BKS4', name: '快照板4', gainPct: 3.4, superLargeNetInflow: 1e8 },
    { plateId: 'BKS5', name: '快照板5', gainPct: 3.2, superLargeNetInflow: 1e8 },
    { plateId: 'BK1008', name: '国资云概念', gainPct: 2.76, superLargeNetInflow: 24e8 },
    { plateId: 'BK0579', name: '云计算', gainPct: 2.34, superLargeNetInflow: 16e8 },
    { plateId: 'BKOUT', name: '流出板', gainPct: 2.5, superLargeNetInflow: -30e8 },
  ];
};
let hydrated = [];
const hydrateStrategyLiveBoardsForMembers = async (boards) => {
  hydrated = boards.map(b => ({ ...b }));
  return { boards: hydrated, cardData: {} };
};
const strategyPrepareThsLiveCandidates = async () => [];
eval(extractFn('isBoardGainAllowed'));
eval(extractFn('strategyBoardFundFlowForSource'));
eval(extractFn('strategyEastFundCandidateUnion'));
eval(extractFn('getDayBoardsWithMembers'));

(async () => {
  // ---- 1. 生产常态复现:快照非空,资金前排板仍被合并进策略板池 ----
  const out = await getDayBoardsWithMembers('2026-07-20', {
    allowFallback: false, liveIfMissing: true, zsTypes: [6], boardPool: 5, liveRankCount: 80,
  });
  const names = out.boards.map(b => b.name);
  A(out.source === 'snapshot', '快照已读入(source=snapshot),实时回退块未触发——旧缺陷的前提条件成立');
  A(names.includes('国资云概念') && names.includes('云计算'),
    '快照非空时,f66 前排的国资云概念/云计算仍被补进策略板池——Codex P1 核心场景');
  A([1, 2, 3, 4, 5, 6, 7].every(i => names.includes(`快照板${i}`)), '快照原有 7 块全部保留');
  const gzy = out.boards.find(b => b.name === '国资云概念');
  A(gzy.fundForward === true && out.boards.find(b => b.name === '快照板1').fundForward !== true,
    '补进的板带 fundForward 标记;快照原有板不带(供补选通道与诊断区分)');
  A(!names.includes('流出板'), 'f66 净流出板不入资金补选(带符号语义)');
  A(hydrated.length === 2, '仅对缺失的 2 块做成分补水(不重复拉快照已有板)');
  A(fsWrites.length === 0, '绝不回写快照文件(只补内存板池)');

  // ---- 2. 看板/复盘默认三源调用:不触发补水(不改非策略页行为) ----
  rankFetches = 0;
  const kanban = await getDayBoardsWithMembers('2026-07-20', { allowFallback: false, liveIfMissing: true });
  A(rankFetches === 0 && !kanban.boards.some(b => b.name === '国资云概念'),
    '默认三源(含KPL)调用不做资金补水——看板行为零变化');

  // ---- 3. 历史日:快照命中但非当日 → 补水拒绝(实时榜是当前值,禁止数据穿越) ----
  rankFetches = 0;
  const hist = await getDayBoardsWithMembers('2026-07-17', { allowFallback: false, liveIfMissing: true, zsTypes: [6] });
  A(hist.source === 'snapshot' && rankFetches === 0 && !hist.boards.some(b => b.fundForward),
    '历史日:快照命中路径上补水因"非当日"拒绝,不把今天的实时榜混进历史');

  // ---- 4. 静态:补水块在快照路径(source===snapshot)上,回退块的接线保持 ----
  A(/fundForwardEligible = strategyScopedZs && options\.liveIfMissing && source === 'snapshot'/.test(src),
    '静态:补水显式挂在快照命中路径,不再依赖"无快照"回退');
  A(/strategyMainlineDiagNoteRead\(`fund-forward zs\$\{z\}/.test(src), '静态:补水失败记诊断上下文(不吞)');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-FUND-FORWARD-AUGMENT CHECKS PASSED');
})();
