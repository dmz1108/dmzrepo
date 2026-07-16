// 板级涨停数精确回填测试(node tests/strategy-board-zt-backfill.test.js)——Owner 2026-07-16 定稿。
// 背景:盘中实时板块榜 ztCount 常为 null,旧行为 Number(null)=0 使自动扫描「涨停≥2」腿盘中
// 形同虚设,5~10亿 区间主线板(如医药 9.67亿)永远不被 L2 验证。
// Owner 口径:不是把 unknown 当 0 或绕过门槛,而是用成份股逐只精确统计——
// 成份 ∩ 当日涨停底库(权威)为主,底库没有该股时用实时涨幅 ≥ limitUpThreshold 兜底。
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

const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
eval(extractFn('limitUpThreshold'));          // 真实阈值:主板9.75/创业板科创北交19.5/ST 4.75
eval(extractFn('strategyMainlineBackfillBoardZt'));

// ---- 1. 底库为主:成份 ∩ 当日涨停底库精确计数 ----
const dbCodes = new Map([['600001', {}], ['600002', {}]]);
const b1 = { zt: null, netInflow: 9.67e8, memberRows: [
  { code: '600001', name: 'A', gain: 10.02 },
  { code: '600002', name: 'B', gain: 9.99 },
  { code: '600003', name: 'C', gain: 5.1 },
] };
strategyMainlineBackfillBoardZt([b1], dbCodes);
A(b1.zt === 2 && b1.ztSource === 'member-join', '底库为主:成份∩涨停底库=2 → zt=2(打 member-join 标)');

// ---- 2. 底库缺该股:实时涨幅 ≥ limitUpThreshold 兜底(主板9.75/创业板19.5,精确不含未板) ----
const b2 = { zt: null, memberRows: [
  { code: '600010', name: '主板股', gain: 9.8 },    // ≥9.75 → 涨停
  { code: '300011', name: '创业股', gain: 19.6 },   // ≥19.5 → 涨停
  { code: '300012', name: '创业未板', gain: 9.8 },  // 创业板 9.8 < 19.5 → 不算
  { code: '600013', name: '未板', gain: 9.5 },      // < 9.75 → 不算
] };
strategyMainlineBackfillBoardZt([b2], new Map());
A(b2.zt === 2, '阈值兜底:主板9.8/创业19.6 计涨停,创业9.8/主板9.5 不计 → zt=2(精确按各自阈值)');

// ---- 3. ST 阈值 4.75 ----
const b3 = { zt: null, memberRows: [{ code: '600020', name: 'ST某某', gain: 4.9 }] };
strategyMainlineBackfillBoardZt([b3], new Map());
A(b3.zt === 1, 'ST 股 4.9% ≥ 4.75 阈值 → 计涨停');

// ---- 4. 底库+阈值并集去重(同一股不重复计) ----
const b4 = { zt: null, memberRows: [{ code: '600001', name: 'A', gain: 10.02 }] };
strategyMainlineBackfillBoardZt([b4], dbCodes);
A(b4.zt === 1, '同一股既在底库又过阈值 → 只计 1 次(Set 去重)');

// ---- 5. 已知 zt 绝不覆盖;无成份行不伪造 0 ----
const b5 = { zt: 3, memberRows: [{ code: '600001', name: 'A', gain: 10.02 }] };
const b6 = { zt: null, memberRows: [] };
const b7 = { zt: 0, memberRows: [{ code: '600001', name: 'A', gain: 10.02 }] };
strategyMainlineBackfillBoardZt([b5, b6, b7], dbCodes);
A(b5.zt === 3 && !b5.ztSource, '快照/来源自带的 zt=3 不被覆盖');
A(b6.zt === null && !b6.ztSource, '无成份行 → 保持 null(不伪造 0,不装有数据)');
A(b7.zt === 0 && !b7.ztSource, 'zt=0 是已知值(真没涨停),不回填');

// ---- 6. 端到端:9.67亿 + zt unknown 的板,回填后进自动扫描门槛(真实 strategyMainlineMaybeAutoScan) ----
const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_WINDOW_MS = 5 * 60 * 1000;
const STRATEGY_MAINLINE_AUTO_SCAN_MAX_PER_WINDOW = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_LIMIT_STOCKS = 50;
const strategyMainlineAutoScanState = { windowStart: 0, dispatched: 0, lastJobId: '' };
const strategyMainlineFamilyInfo = (x) => ({ key: 'group:' + String(x && x.theme || '') });
const strategyMainlineScanPriorityCodes = () => [];
const dispatched = [];
const localL2TaskQueue = {
  configured: () => true, get: () => null, latest: () => null,
  start: (job) => { const rec = { jobId: 'J' + (dispatched.length + 1), ...job, status: 'queued' }; dispatched.push(rec); return rec; },
};
eval(extractFn('strategyMainlineMaybeAutoScan'));
// 复现今日医药场景:9.67亿、zt=null(旧行为 Number(null)=0 → 不派发)
const medBoard = { plateId: 'BK1146', name: '减肥药', netInflow: 9.67e8, zt: null, zsType: 6, scanChannel: '', memberRows: [
  { code: '600001', name: 'A', gain: 10.02 },
  { code: '600002', name: 'B', gain: 9.99 },
  { code: '600003', name: 'C', gain: 6.0 },
] };
strategyMainlineMaybeAutoScan([medBoard], '2026-07-16', true, '午后', null);
A(dispatched.length === 0, '复现:zt=null 未回填时,9.67亿不派发——今日医药待验证的根因');
// Owner 2026-07-16:无任何豁免——99亿高流入但涨停<2 不派发;补选板同样过涨停门槛
const noExempt1 = { plateId: 'BKHI', name: '高流入板', netInflow: 99e8, zt: 1, zsType: 6, scanChannel: '', memberRows: [{ code: '600030', name: 'H', gain: 6 }] };
const noExempt2 = { plateId: 'BKSU', name: '补选板', netInflow: 6e8, zt: 1, zsType: 6, scanChannel: 'supplement', memberRows: [{ code: '600031', name: 'S', gain: 6 }] };
strategyMainlineMaybeAutoScan([noExempt1, noExempt2], '2026-07-16', true, '午后', null);
A(dispatched.length === 0, '无豁免:99亿高流入 zt=1 不派发;补选板 zt=1 也不派发(门槛=5亿 且 涨停≥2)');
// 回填(两只在底库)后 → zt=2 → 过门槛派发
strategyMainlineBackfillBoardZt([medBoard], new Map([['600001', {}], ['600002', {}]]));
strategyMainlineAutoScanState.windowStart = 0; strategyMainlineAutoScanState.dispatched = 0; strategyMainlineAutoScanState.lastJobId = '';
strategyMainlineMaybeAutoScan([medBoard], '2026-07-16', true, '午后', null);
A(medBoard.zt === 2 && dispatched.length === 1 && dispatched[0].plateId === 'BK1146', '回填后:zt=2 → 9.67亿+涨停≥2 过门槛,减肥药被派发扫描');

// ---- 7. 静态:impl 在涨停底库建好后、种子/扫描前调用回填 ----
A(/strategyMainlineBackfillBoardZt\(boardPayload\?\.boards \|\| \[\], limitUpByCode\)/.test(src), '静态:impl 用当日涨停底库回填板级 zt(enrich 后、种子/扫描前)');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-BOARD-ZT-BACKFILL CHECKS PASSED');
