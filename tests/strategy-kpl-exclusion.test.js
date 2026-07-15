// KPL 剔除行为测试(node tests/strategy-kpl-exclusion.test.js)——贯穿真实主线取板函数 getDayBoardsWithMembers。
// Codex 复核 P1:主线真实链路 buildStrategyMainlinesLiveImpl → getDayBoardsWithMembers 之前固定遍历 [6,5,7];
// 本测试执行真实函数(仅 stub 磁盘 IO),断言 zsTypes=[6,5] 时 KPL(7) 不进候选,默认 [6,5,7] 仍保留 KPL(不误伤其它页面)。
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

// ---- stub 真实函数的依赖(仅替换磁盘 IO 与无关辅助;合并/归一逻辑走真实代码) ----
const isoFromCompactDate = d => d;
const resolveStrategySnapshotDay = async d => d;
const getPermanentHiddenSet = async () => new Set();
const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
const strategyMainlineDiagNoteRead = () => {};
const isChinaMarketTradingDay = () => false;   // 快照存在时不会走实时回退
const snapshotPath = (day, z) => `${day}|${z}`;
// 每源快照:zs7(KPL)有独有板 + 一个和东财同名但涨停更高的“医药”(旧逻辑按名去重会让它顶掉东财医药)
const SNAP = {
  '2026-07-15|6': { boards: [
    { name: '医药', plateId: 'BK6M', ztCount: 2, netInflow: 8e8, gainPct: 3 },
    { name: '东财独有板', plateId: 'BKE', ztCount: 1, netInflow: 5e8, gainPct: 2 },
  ] },
  '2026-07-15|5': { boards: [
    { name: '医药', plateId: 'TH5M', ztCount: 1, netInflow: 6e8, gainPct: 4 },
  ] },
  '2026-07-15|7': { boards: [
    { name: 'KPL独有板', plateId: 'BK7', ztCount: 9, netInflow: 99e8, gainPct: 9 },
    { name: '医药', plateId: 'BK7M', ztCount: 20, netInflow: 50e8, gainPct: 8 },  // 涨停最高,旧按名去重会顶掉别源
  ] },
};
const fsStub = { readFile: async (p) => { if (SNAP[p]) return JSON.stringify(SNAP[p]); throw new Error('ENOENT ' + p); } };
// 在 eval 作用域内把标识符 fs 指向 stub(getDayBoardsWithMembers 内部用 fs.readFile)
const fs2 = fsStub; // eslint 占位
eval(extractFn('getDayBoardsWithMembers').replace(/\bfs\.readFile\b/g, 'fsStub.readFile'));
// R2 同源配对(点2):真实 strategyMainlineSourcePairs + isFiniteNumeric,验证塌板后仍能同源拿两组。
eval(extractFn('isFiniteNumeric'));
eval(extractFn('strategyMainlineSourcePairs'));

(async () => {
  // 1. 策略口径 zsTypes=[6,5]:KPL(7) 完全不进候选
  const strat = await getDayBoardsWithMembers('2026-07-15', { zsTypes: [6, 5], allowFallback: false });
  const names = strat.boards.map(b => b.name);
  A(!strat.boards.some(b => Number(b.zsType) === 7), '策略口径:结果中无任何 zsType=7 的板');
  A(!names.includes('KPL独有板'), '策略口径:KPL 独有板不进候选');
  const yy = strat.boards.find(b => b.name === '医药');
  A(yy && Number(yy.zsType) === 6, '策略口径:同名“医药”取自东财(zt2>同花顺zt1),不被 KPL(zt20)顶掉');
  A(names.includes('东财独有板'), '策略口径:东财独有板保留');

  // 点2:塌板后 bySource 仍分别保留东财(6)与同花顺(5),且不含 KPL(7)
  A(yy && yy.bySource && yy.bySource[6] && yy.bySource[5], '点2:同名“医药”塌板后 bySource 同时保留东财(6)与同花顺(5)');
  A(yy && yy.bySource && !yy.bySource[7], '点2:策略口径下 bySource 不含 KPL(7)');
  A(yy.bySource[6].netInflow === 8e8 && Number(yy.bySource[6].gainPct) === 3, '点2:bySource[6] 是东财自己的净流入/涨幅(8亿/3%)');
  A(yy.bySource[5].netInflow === 6e8 && Number(yy.bySource[5].gainPct) === 4, '点2:bySource[5] 是同花顺自己的净流入/涨幅(6亿/4%)');

  // 点2 端到端:strategyMainlineSourcePairs 从塌成一条的“医药”里同源还原东财/同花顺两组
  const pairs = strategyMainlineSourcePairs(strat.boards);
  A(pairs.eastmoney && pairs.eastmoney.netInflow === 8e8 && Number(pairs.eastmoney.gainPct) === 3, '点2:sourcePairs 东财组=8亿/3%(取自 bySource[6],非跨源拼)');
  A(pairs.ths && pairs.ths.netInflow === 6e8 && Number(pairs.ths.gainPct) === 4, '点2:sourcePairs 同花顺组=6亿/4%(取自 bySource[5],非跨源拼)');
  A(pairs.eastmoney.board === '医药' && pairs.ths.board === '医药', '点2:两组均落在“医药”板(塌板后仍成对)');

  // 2. 默认(不传 zsTypes)仍遍历 [6,5,7]:KPL 保留,不误伤看板/复盘等页面
  const all = await getDayBoardsWithMembers('2026-07-15', { allowFallback: false });
  A(all.boards.some(b => b.name === 'KPL独有板' && Number(b.zsType) === 7), '默认口径:KPL 独有板仍在(三源不误伤)');
  const yyAll = all.boards.find(b => b.name === '医药');
  A(yyAll && Number(yyAll.zsType) === 7, '默认口径:同名“医药”按旧行为被 KPL(zt20)顶掉——证明默认确实吃 KPL');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-KPL-EXCLUSION CHECKS PASSED');
})();
