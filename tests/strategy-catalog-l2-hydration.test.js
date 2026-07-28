// 实时 catalog 板块补水到统一 L2 派单池回归。
// 线上缺陷:宽口径题材能从实时目录补到高资金板，但 catalog 行没有 memberRows/zt，
// 精确涨停回填已在它挂载前结束，外层 __autoScanBoards 又只带旧板块池，导致永远不派单。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  return src.slice(m.index, i + 1);
}

const A = (cond, msg) => {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exitCode = 1;
  } else {
    console.log('ok: ' + msg);
  }
};

const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_RISING_FETCH_TIMEOUT_MS = 1500;
const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const THS_ZS_TYPE = 5;
const isoFromCompactDate = value => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : String(value || '');
};
const chinaNowParts = () => ({ day: '20260727' });
const normalizeReasonSourceCode = value => String(value || '').replace(/\D/g, '').slice(0, 6);
const numOrNull = value => {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const strategyMainlineBoardIdentity = board => `${Number(board?.zsType)}:${String(board?.plateId || '')}`;
const strategyMainlineIsStyleBoard = () => false;
const strategyMainlineCatalogBoardScore = (board, seed) =>
  String(seed?.theme || '') === '电力' && String(board?.name || '') === '绿色电力' ? 120 : 0;
const strategyApplyThsDdeFundFlow = async () => {};
const mapLimit = async (items, _limit, fn) => Promise.all(items.map(fn));
let memberFetchCount = 0;
let membersByPlate = new Map();
const getStrategyBoardRealtimeStocks = async plateId => {
  memberFetchCount += 1;
  return membersByPlate.get(String(plateId)) || [];
};
const strategyMainlineWithTimeout = async promise => promise;
const strategyMainlineNormalizeRisingStock = row => {
  const code = normalizeReasonSourceCode(row?.code);
  const gain = numOrNull(row?.gain);
  return code && gain != null ? { code, name: String(row?.name || ''), gain } : null;
};
const strategyMainlineIsNearLimitStock = () => false;
const strategyMainlineBoardBreadth = rows => ({ memberCount: rows.length });
const strategyEnsureMainlineSeedShape = seed => seed;
const strategyMainlineBoardRisingStocks = board => board?.risingStocks || [];
const strategyMainlineBoardNearLimitStocks = board => board?.nearLimitStocks || [];
const strategyMainlineAbsorbRisingStocks = () => {};
const strategyMainlineRecordNetInflow = (seed, board, value) => {
  if (value != null && (seed.netInflow == null || value > seed.netInflow)) {
    seed.netInflow = value;
    seed.netInflowZsType = Number(board?.zsType);
  }
};

eval(extractFn('isFiniteNumeric'));
eval(extractFn('limitUpThreshold'));
eval(extractFn('strategyMainlineBackfillBoardZt'));
eval(extractFn('strategyMainlinePickBestCatalogBoard'));
eval(extractFn('strategyMainlineHydrateCatalogBoardsForScan'));
eval(extractFn('strategyMainlineAttachRealtimeBoardToSeed'));
eval(extractFn('strategyMainlineAttachBestCatalogBoard'));
eval(extractFn('strategyMainlineThsCompositeEligibility'));
eval(extractFn('strategyMainlineBoardAutoScanEligibility'));

function makeSeed(codes) {
  return {
    theme: '电力',
    key: '电力',
    codeSet: new Set(codes),
    boardKeySet: new Set(),
    boards: [],
    realtimeCodeSet: new Set(),
    maxGainPct: null,
    netInflow: null,
  };
}

(async () => {
  const limitUpByCode = new Map([['000001', {}], ['000002', {}]]);
  const seed = makeSeed(['000001', '000002']);
  const catalog = [{
    plateId: 'BK1024',
    name: '绿色电力',
    zsType: 6,
    netInflow: 20.6e8,
    gainPct: 3.5,
    zt: null,
  }];
  membersByPlate = new Map([['BK1024', [
    { code: '000001', name: 'A', gain: 10.01 },
    { code: '000002', name: 'B', gain: 9.98 },
    { code: '000003', name: 'C', gain: 5.2 },
  ]]]);

  const hydrated = await strategyMainlineHydrateCatalogBoardsForScan(
    new Map([['电力', seed]]),
    catalog,
    '2026-07-27',
    limitUpByCode
  );
  A(hydrated.length === 1 && hydrated[0].plateId === 'BK1024', '高资金且有 2 个当日信号股的目录板完成成员补水');
  A(hydrated[0].memberRows.length === 3, '补水板保留可派发成分股');
  A(hydrated[0].zt === 2 && hydrated[0].ztSource === 'member-join', '用成分股与当日涨停库精确回填 zt=2');
  A(hydrated[0].scanChannel === 'catalog', '补水板标记 catalog 派单通道');
  const dispatchEligibility = strategyMainlineBoardAutoScanEligibility(hydrated[0], { requireMembers: true });
  A(dispatchEligibility.eligible === true, '真实派单板必须携带 memberRows 才能通过执行前置条件');

  strategyMainlineAttachBestCatalogBoard(seed, catalog);
  const compact = seed.boards[0];
  A(compact?.ztCount === 2 && compact?.hasMembers === true, '题材卡紧凑板记录 zt 与成员已就绪状态');
  const eligibility = strategyMainlineBoardAutoScanEligibility(compact);
  A(eligibility.eligible === true && eligibility.hasMembers === true, '紧凑板健康状态与真实派单资格一致');
  A(strategyMainlineBoardAutoScanEligibility(compact, { requireMembers: true }).eligible === false,
    '紧凑展示板不能冒充带 memberRows 的实际派单载荷');

  const lowSignalSeed = makeSeed(['000001']);
  memberFetchCount = 0;
  const lowSignalCatalog = [{
    plateId: 'BK1024',
    name: '绿色电力',
    zsType: 6,
    netInflow: 4.9e8,
    gainPct: 3.5,
    zt: null,
  }];
  const lowSignal = await strategyMainlineHydrateCatalogBoardsForScan(
    new Map([['电力', lowSignalSeed]]),
    lowSignalCatalog,
    '2026-07-27',
    limitUpByCode
  );
  A(lowSignal.length === 0 && memberFetchCount === 0, 'seed 少于 2 个信号且 catalog 资金未过门槛时不拉成分、不勉强扫描');

  const directCatalog = [{
    plateId: 'BK0884',
    name: '光刻机(胶)',
    zsType: 6,
    netInflow: 5.52e8,
    gainPct: 0.87,
    zt: null,
  }];
  membersByPlate = new Map([['BK0884', [
    { code: '000001', name: 'A', gain: 10.01 },
    { code: '000002', name: 'B', gain: 9.98 },
    { code: '000003', name: 'C', gain: 2.1 },
  ]]]);
  const direct = await strategyMainlineHydrateCatalogBoardsForScan(
    new Map(),
    directCatalog,
    '2026-07-27',
    limitUpByCode
  );
  A(direct.length === 1 && direct[0].catalogDiscovery === 'eastmoney-fund-threshold',
    '无既有 seed 的东财 catalog 板可按正式资金门槛独立补水');
  A(direct[0].zt === 2 && direct[0].codes.join(',') === '000001,000002',
    '独立补水板只用实时涨停成员交集回填 codes/zt，不靠历史 seed 猜测');
  A(strategyMainlineBoardAutoScanEligibility(direct[0], { requireMembers: true }).eligible === true,
    '独立发现板仍须真实成分、5 亿资金和至少 2 只涨停后才能派单');

  const missingSeed = makeSeed(['000001', '000002']);
  membersByPlate = new Map();
  const missingCatalog = [{
    plateId: 'BK1024',
    name: '绿色电力',
    zsType: 6,
    netInflow: 20.6e8,
    gainPct: 3.5,
    zt: null,
  }];
  const missing = await strategyMainlineHydrateCatalogBoardsForScan(
    new Map([['电力', missingSeed]]),
    missingCatalog,
    '2026-07-27',
    limitUpByCode
  );
  A(missing.length === 0 && missingCatalog[0].zt === null, '成分接口无数据时保持 zt=null，不伪造 0 或派单');

  A(/\.\.\.\(catalogScanBoards \|\| \[\]\)/.test(src), '静态:直接派单与 deferAutoScan 返回都并入 catalog 补水板');
  A(src.includes("catalogDiscovery !== 'eastmoney-fund-threshold'"), '静态:仅独立发现板新建 seed，匹配既有 seed 的 catalog 板不重复建族');
  A(/if \(!code\) continue;\s*byCode\.set\(code, \{ code, reason, source: 'ths-limit-up-pool' \}\)/.test(src),
    '静态:实时涨停池即使主因文本暂空也保留 code 供板级涨停交集');
  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-CATALOG-L2-HYDRATION CHECKS PASSED');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
