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
  // 点3:仅有 KPL(7) 快照的日期——对策略页是空板日,不应被判为可用
  '2026-07-14|7': { boards: [ { name: 'KPL独有板', plateId: 'BK7B', ztCount: 3, netInflow: 20e8, gainPct: 6 } ] },
  // 二审 P1:强势板块共振榜——KPL 强板即使涨停/净流入最高也不能进榜(仅 stub 每源快照,带 cardData 成员码)
  '2026-07-11|6': { boards: [ { name: '东财强板', plateId: 'E1', ztCount: 3, netInflow: 10e8, gainPct: 5 } ],
    cardData: { E1: { ztList: [{ code: '600001' }, { code: '600002' }] } } },
  '2026-07-11|7': { boards: [ { name: 'KPL强板', plateId: 'K1', ztCount: 9, netInflow: 99e8, gainPct: 9 } ],
    cardData: { K1: { ztList: [{ code: '600003' }, { code: '600004' }] } } },
};
const STRATEGY_ZS_TYPES = [6, 5];   // strategySnapshotDayHasSnap 内部引用该常量
const fsStub = {
  readFile: async (p) => { if (SNAP[p]) return JSON.stringify(SNAP[p]); throw new Error('ENOENT ' + p); },
  access: async (p) => { if (SNAP[p]) return; throw new Error('ENOENT ' + p); },
};
// 在 eval 作用域内把标识符 fs 指向 stub(getDayBoardsWithMembers 内部用 fs.readFile)
const fs2 = fsStub; // eslint 占位
eval(extractFn('getDayBoardsWithMembers').replace(/\bfs\.readFile\b/g, 'fsStub.readFile'));
// R2 同源配对(点2):真实 strategyMainlineSourcePairs + isFiniteNumeric,验证塌板后仍能同源拿两组。
eval(extractFn('isFiniteNumeric'));
eval(extractFn('strategyMainlineSourcePairs'));
// 点3:策略日可用性按策略来源集判断——真实 strategySnapshotDayHasSnap(fs.access→stub)。
eval(extractFn('strategySnapshotDayHasSnap').replace(/\bfs\.access\b/g, 'fsStub.access'));
// 二审 P1:强势板块共振榜——真实 getStrategyStrongResonance,仅 stub 共识/题材对齐依赖。
const STRATEGY_STRONG_RESONANCE_MIN_STOCKS = 1;
const strategyBoardTopicAligned = () => true;             // 对齐判断放开,聚焦「来源剔除」这一维
const strategyResonanceTopicKey = t => String(t || '').trim();
const CONSENSUS_ROWS = {
  '2026-07-11': [
    { code: '600001', name: 'a', finalBoardTopic: '东财强板', consensusTier: 'strong', agreeCount: 3, limitUpCount: 1, gain: 10 },
    { code: '600002', name: 'b', finalBoardTopic: '东财强板', consensusTier: 'strong', agreeCount: 3, limitUpCount: 1, gain: 10 },
    { code: '600003', name: 'c', finalBoardTopic: 'KPL强板', consensusTier: 'strong', agreeCount: 3, limitUpCount: 1, gain: 10 },
    { code: '600004', name: 'd', finalBoardTopic: 'KPL强板', consensusTier: 'strong', agreeCount: 3, limitUpCount: 1, gain: 10 },
  ],
};
const buildDaySourceViewWithConsensus = async (useDay) => ({ payload: { tabs: [{ key: 'final', rows: CONSENSUS_ROWS[useDay] || [] }] } });
eval(extractFn('getStrategyStrongResonance'));

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

  // 点3:策略日可用性按策略来源集判断——有东财/同花顺快照的日算可用,仅 KPL 的日算空板日
  A((await strategySnapshotDayHasSnap('2026-07-15')) === true, '点3:2026-07-15 有东财/同花顺快照→策略日可用');
  A((await strategySnapshotDayHasSnap('2026-07-14')) === false, '点3:2026-07-14 仅有 KPL(7) 快照→策略日不可用(不会选到空板日)');
  A((await strategySnapshotDayHasSnap('2026-07-13')) === false, '点3:无任何快照的日→不可用');

  // 二审 P1:强势板块共振榜(/api/strong-board-resonance)——贯穿真实 getStrategyStrongResonance
  const reso = await getStrategyStrongResonance('2026-07-11');
  const resoNames = (reso.boards || []).map(b => b.name);
  A(resoNames.includes('东财强板'), '二审P1:东财强板(zt3/10亿)进共振榜——证明测试口径能正常surface强板');
  A(!resoNames.includes('KPL强板'), '二审P1:KPL强板即便 zt9/99亿(最高)也不进共振榜——策略页按来源剔除');
  A(!(reso.boards || []).some(b => Number(b.netInflow) === 99e8), '二审P1:共振榜净流入不含 KPL 的 99亿(未被 KPL 值污染)');

  // 2. 默认(不传 zsTypes)仍遍历 [6,5,7]:KPL 保留,不误伤看板/复盘等页面
  const all = await getDayBoardsWithMembers('2026-07-15', { allowFallback: false });
  A(all.boards.some(b => b.name === 'KPL独有板' && Number(b.zsType) === 7), '默认口径:KPL 独有板仍在(三源不误伤)');
  const yyAll = all.boards.find(b => b.name === '医药');
  A(yyAll && Number(yyAll.zsType) === 7, '默认口径:同名“医药”按旧行为被 KPL(zt20)顶掉——证明默认确实吃 KPL');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-KPL-EXCLUSION CHECKS PASSED');
})();
