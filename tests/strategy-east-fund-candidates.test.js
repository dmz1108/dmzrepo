// 东财资金前排补选测试(node tests/strategy-east-fund-candidates.test.js)——与 #186 同花顺 DDE 补选对称。
// 生产证据(2026-07-20):东财国资云概念 rank9/云计算 rank26,板内紫光股份 +7.29% 领涨,
// 但涨幅榜前5截断使其全天未被 L2 验证。补入「正涨幅 + f66 超大单净流入为正」的资金前排;
// f66 带符号,净流出板不入补选;后续 5亿+涨停≥2 门槛与 L2 明星验证一概不放松。
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
const MIN_BOARD_GAIN_PCT = -0.5;
const STRATEGY_MAINLINE_LIVE_BOARD_POOL = 5;
const boardGainNumber = b => Number(b?.gainPct ?? b?.gain);
eval(extractFn('isBoardGainAllowed'));
eval(extractFn('strategyEastFundCandidateUnion'));

// 2026-07-20 实盘形态:涨幅榜前5 与 f66 前排交错;国资云概念 rank9(f66 大)在涨幅池外。
const feed = [
  { plateId: 'BK1', name: '涨1', gainPct: 4.0, superLargeNetInflow: 1e8 },
  { plateId: 'BK2', name: '涨2', gainPct: 3.8, superLargeNetInflow: -2e8 },
  { plateId: 'BK3', name: '涨3', gainPct: 3.5, superLargeNetInflow: 9e8 },
  { plateId: 'BK4', name: '涨4', gainPct: 3.2, superLargeNetInflow: null },
  { plateId: 'BK5', name: '涨5', gainPct: 3.0, superLargeNetInflow: 2e8 },
  { plateId: 'BK1008', name: '国资云概念', gainPct: 2.76, superLargeNetInflow: 24e8 },   // rank9:涨幅池外,f66 前排
  { plateId: 'BK0579', name: '云计算', gainPct: 2.34, superLargeNetInflow: 16e8 },       // rank26:同上
  { plateId: 'BKOUT', name: '流出板', gainPct: 2.5, superLargeNetInflow: -30e8 },        // f66 净流出:不得入补选
  { plateId: 'BKNEG', name: '跌板', gainPct: -1.2, superLargeNetInflow: 50e8 },          // 跌破 -0.5:整体过滤
];
const out = strategyEastFundCandidateUnion(feed, 5);
const ids = out.map(b => b.plateId);
A(ids.slice(0, 5).join(',') === 'BK1,BK2,BK3,BK4,BK5', '涨幅前5原样保留且顺序不变(老行为零回归)');
A(ids.includes('BK1008') && ids.includes('BK0579'), '补入 f66 正流入前排:国资云概念/云计算 不再被涨幅榜截断——紫光案例修复');
A(!ids.includes('BKOUT'), 'f66 为净流出(带符号)的板不入资金补选——方向语义与东财口径一致');
A(!ids.includes('BKNEG'), '涨幅低于 MIN_BOARD_GAIN_PCT 的板仍被整体过滤');
A(new Set(ids).size === ids.length && ids.length <= 10, '去重且候选总量 ≤ 2×池(涨幅5+资金5)');
// f66 缺失的板只走涨幅通道,不因 null 误入资金前排
A(ids.includes('BK4') && out.filter(b => b.plateId === 'BK4').length === 1, 'f66 缺失(null)的板仅出现在涨幅通道');

// 静态:接线只对东财 zsType 生效,同花顺仍走 DDE 补选,KPL 不受影响
A(/Number\(z\) === Number\(EASTMONEY_ZS_TYPE\)\s*\?\s*strategyEastFundCandidateUnion\(visibleBoards, boardPool\)/.test(src),
  '静态:仅东财实时取板走资金补选;同花顺 DDE 补选与其他来源行为不变');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-EAST-FUND-CANDIDATES CHECKS PASSED');
