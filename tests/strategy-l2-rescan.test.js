// 三段式 L2 自动复扫测试(node tests/strategy-l2-rescan.test.js)
// Owner 2026-07-23:
//   首次满足门槛扫描；完成后涨停数、净流入或板块涨幅任一增强即可复扫；
//   预期明星封板时优先确认扫描；同板块不设日扫描轮次上限。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const { createLocalL2TaskQueue } = require(path.join(__dirname, '..', 'local-l2-task-queue.js'));

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
  if (!match) throw new Error(`not found: ${name}`);
  const brace = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let end = brace;
  for (; end < src.length; end += 1) {
    if (src[end] === '{') depth += 1;
    else if (src[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, end + 1);
}

const A = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_WINDOW_MS = 5 * 60 * 1000;
const STRATEGY_MAINLINE_AUTO_SCAN_MAX_PER_WINDOW = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
const STRATEGY_MAINLINE_AUTO_RESCAN_MIN_INFLOW_DELTA = 1e8;
const STRATEGY_MAINLINE_AUTO_RESCAN_MIN_GAIN_DELTA = 0.5;
const STRATEGY_MAINLINE_AUTO_SCAN_LIMIT_STOCKS = 50;
const strategyMainlineAutoScanState = { windowStart: 0, dispatched: 0, lastJobId: '' };
const numOrNull = value => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const normalizeReasonSourceCode = value => String(value || '').replace(/\D/g, '').slice(0, 6);
const limitUpThreshold = code => /^(30|68)/.test(String(code || '')) ? 19.5 : 9.75;
const strategyMainlineStarStatus = row => row?.mockLevel ? { level: row.mockLevel } : null;
const strategyMainlineFamilyInfo = item => ({ key: `group:${String(item?.theme || '')}` });
const strategyMainlineScanPriorityCodes = () => ['600099'];
const strategyMainlineBoardAutoScanEligibility = board => ({
  eligible: Number(board?.netInflow) >= 5e8 && Number(board?.zt) >= 2 && Array.isArray(board?.memberRows) && board.memberRows.length > 0,
});

eval(extractFn('strategyMainlineBoardScanStrength'));
eval(extractFn('strategyMainlineAutoScanDecision'));

const baseBoard = {
  plateId: 'BK001',
  name: '测试主线',
  netInflow: 6e8,
  gainPct: 2,
  zt: 2,
  memberRows: [{ code: '600001', name: '测试股', gain: 6 }],
};
const baselineJob = {
  jobId: 'J1',
  status: 'done',
  scanSequence: 1,
  strengthSnapshot: { netInflow: 6e8, gainPct: 2, zt: 2 },
  results: [],
};

const first = strategyMainlineAutoScanDecision(baseBoard, null);
A(first.dispatch && first.scanStage === 'discovery' && first.scanSequence === 1,
  '首次满足门槛 → discovery 扫描');
A(!strategyMainlineAutoScanDecision(baseBoard, { ...baselineJob, status: 'queued' }).dispatch
  && !strategyMainlineAutoScanDecision(baseBoard, { ...baselineJob, status: 'running' }).dispatch,
  '同板任务排队或运行时不重复派发');
A(strategyMainlineAutoScanDecision(baseBoard, { ...baselineJob, status: 'error' }).scanStage === 'retry',
  '前一任务失败 → retry');
A(!strategyMainlineAutoScanDecision(baseBoard, baselineJob).dispatch,
  '完成后板块没有增强 → 不复扫');

const ztUp = strategyMainlineAutoScanDecision({ ...baseBoard, zt: 3 }, baselineJob);
A(ztUp.dispatch && ztUp.scanStage === 'strengthening'
  && ztUp.scanReasons.includes('limit-up-count-increased'), '涨停数增加1只 → 单条件触发增强复扫');
const inflowUp = strategyMainlineAutoScanDecision({ ...baseBoard, netInflow: 7e8 }, baselineJob);
A(inflowUp.dispatch && inflowUp.scanReasons.includes('net-inflow-increased'),
  '净流入较上次增加1亿元 → 单条件触发增强复扫');
const gainUp = strategyMainlineAutoScanDecision({ ...baseBoard, gainPct: 2.5 }, baselineJob);
A(gainUp.dispatch && gainUp.scanReasons.includes('board-gain-increased'),
  '板块涨幅较上次增加0.5个百分点 → 单条件触发增强复扫');
A(!strategyMainlineAutoScanDecision({ ...baseBoard, netInflow: 6.99e8, gainPct: 2.49 }, baselineJob).dispatch,
  '资金与涨幅微小抖动未到增强台阶 → 不占用worker');

let rollingJob = baselineJob;
for (let round = 2; round <= 8; round += 1) {
  const board = { ...baseBoard, netInflow: (5 + round) * 1e8 };
  const decision = strategyMainlineAutoScanDecision(board, rollingJob);
  A(decision.dispatch && decision.scanSequence === round,
    `同板第${round}轮仍可由新增强事件触发(无日轮次上限)`);
  rollingJob = {
    jobId: `J${round}`,
    status: 'done',
    scanSequence: round,
    strengthSnapshot: decision.strengthSnapshot,
    results: [],
  };
}

const expectedJob = {
  ...baselineJob,
  results: [{ code: '600001', mockLevel: 'expected' }],
};
const confirmation = strategyMainlineAutoScanDecision({
  ...baseBoard,
  memberRows: [{ code: '600001', name: '测试股', gain: 9.8 }],
}, expectedJob);
A(confirmation.dispatch && confirmation.scanStage === 'confirmation'
  && confirmation.confirmationCodes[0] === '600001',
  '预期明星触及涨停 → 立即进入 confirmation 扫描且该股优先');
A(!strategyMainlineAutoScanDecision(baseBoard, {
  ...baselineJob,
  results: [{ code: '600001', mockLevel: 'confirmed' }],
}).dispatch, '已有确认明星 → 停止该板块后续自动复扫');
A(strategyMainlineAutoScanDecision(baseBoard, {
  ...baselineJob,
  strengthSnapshot: null,
}).scanReasons.includes('legacy-baseline-missing'), '旧任务无强度基线 → 允许补一次新口径基线扫描');

const dispatched = [];
let latestJob = baselineJob;
const localL2TaskQueue = {
  configured: () => true,
  get: () => null,
  latest: () => latestJob,
  start: payload => {
    const job = { ...payload, jobId: `AUTO${dispatched.length + 1}`, status: 'queued' };
    dispatched.push(job);
    return job;
  },
};
eval(extractFn('strategyMainlineMaybeAutoScan'));
strategyMainlineMaybeAutoScan([{ ...baseBoard, zt: 3 }], '2026-07-23', true, '上午盘', null);
A(dispatched.length === 1 && dispatched[0].scanStage === 'strengthening'
  && dispatched[0].scanSequence === 2
  && dispatched[0].strengthSnapshot.zt === 3,
  '自动派发器把增强阶段、轮次和强度快照写入任务');

strategyMainlineAutoScanState.windowStart = 0;
strategyMainlineAutoScanState.dispatched = 0;
strategyMainlineAutoScanState.lastJobId = '';
dispatched.length = 0;
latestJob = expectedJob;
strategyMainlineMaybeAutoScan([{
  ...baseBoard,
  netInflow: 1e8,
  memberRows: [
    { code: '600001', name: '测试股', gain: 9.8 },
    { code: '600099', name: '普通候选', gain: 7 },
  ],
}], '2026-07-23', true, '午后', null);
A(dispatched.length === 1 && dispatched[0].scanStage === 'confirmation'
  && dispatched[0].priorityCodes[0] === '600001',
  '确认扫描优先预期明星封板股，且不被板块资金瞬时回落阻断');

const queue = createLocalL2TaskQueue({ token: '0123456789abcdef', batchSize: 5 });
const queued = queue.start({
  plateId: 'BK001',
  day: '2026-07-23',
  stocks: [{ code: '600001', name: '测试股', gainPct: 6, price: 10 }],
  scanStage: 'strengthening',
  scanReasons: ['net-inflow-increased'],
  scanSequence: 6,
  previousJobId: 'J5',
  strengthSnapshot: { netInflow: 12e8, gainPct: 3.5, zt: 4 },
});
const claimed = queue.claim({ token: '0123456789abcdef', workerId: 'test-worker' });
A(queued.scanSequence === 6 && queued.scanReasons[0] === 'net-inflow-increased'
  && claimed.job.scanStage === 'strengthening'
  && claimed.job.previousJobId === 'J5'
  && claimed.job.strengthSnapshot.zt === 4,
  '复扫元数据从队列公开态完整传递到公司端worker任务');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-L2-RESCAN CHECKS PASSED');
