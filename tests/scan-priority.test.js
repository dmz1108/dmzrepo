// 扫描调度字典序优先队列测试(node tests/scan-priority.test.js)——Shared Decision v1 第5条。
const fsReal = require('fs');
const pathReal = require('path');
const os = require('os');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const { createLocalL2TaskQueue } = require(pathReal.join(__dirname, '..', 'local-l2-task-queue.js'));

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. 个股猎场优先列表:5%~涨停区间,距板近优先
const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const limitUpThreshold = (code) => /^(30|68)/.test(String(code || '')) ? 20 : 10;
const normalizeReasonSourceCode = c => String(c || '').trim();
eval(extractFn('strategyMainlineScanPriorityCodes'));
const board = { memberRows: [
  { code: '600001', name: 'a', gain: 9.2 },   // 距板 0.8
  { code: '600002', name: 'b', gain: 6.0 },   // 距板 4.0
  { code: '600003', name: 'c', gain: 10.0 },  // 已涨停,不进猎场
  { code: '600004', name: 'd', gain: 3.0 },   // 不足 5%,不进
  { code: '300005', name: 'e', gain: 12.0 },  // 创业板距板 8.0
  { code: '600006', name: 'f', gain: 9.2, priorReason: { count: 2 } },  // 与600001同距板,主因命中多
] };
const codes = strategyMainlineScanPriorityCodes(board);
A(!codes.includes('600003') && !codes.includes('600004'), '猎场只收 5%~涨停之间(涨停与<5%排除)');
A(codes[0] === '600006' && codes[1] === '600001', '距板同为0.8:历史主因命中多者优先(第三键)');
A(codes.indexOf('600002') < codes.indexOf('300005'), '距板 4.0 优先于 8.0(第一键距板距离)');

// 2. 板块级字典序与豁免(静态断言,比较器内联在 auto-scan 中)
A(src.includes("(b?.scanChannel === 'supplement' || Number(b?.zt) >= STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT)"), '补选板块豁免涨停>=2门槛');
A(src.includes("((a?.scanChannel === 'supplement') ? 0 : 1) - ((b?.scanChannel === 'supplement') ? 0 : 1)"), '板块级第一键=补选来源');
A(src.includes('bigGainOf(b) - bigGainOf(a)'), '板块级第三键=大涨数(第二键净流入)');
A(src.includes('priorityCodes: strategyMainlineScanPriorityCodes(board)'), '派发任务携带猎场优先列表');

// 3. 队列行为:优先股排最前、组内保持涨幅序;claim/update 盖版本;job 指标
const tmp = fsReal.mkdtempSync(pathReal.join(os.tmpdir(), 'l2q-'));
const q = createLocalL2TaskQueue ? createLocalL2TaskQueue({ token: 'x'.repeat(24), persistDir: tmp }) : null;
A(!!q, '队列可实例化');
const job = q.start({
  plateId: 'p1', boardName: '板一', day: '2026-07-11',
  stocks: [
    { code: '600010', name: 'A', gainPct: 9 },
    { code: '600011', name: 'B', gainPct: 8 },
    { code: '600012', name: 'C', gainPct: 7 },
    { code: '600013', name: 'D', gainPct: 6 },
  ],
  priorityCodes: ['600012', '600011'],
});
A(JSON.stringify((job.priorityCodes || []).slice().sort()) === JSON.stringify(['600011', '600012']), 'job 记录 priorityCodes');
const claimed = q.claim({ token: 'x'.repeat(24), workerId: 'w1', version: 'p1w-test' });
A(claimed.job && claimed.job.jobId === job.jobId, 'worker 领取任务');
const order = claimed.job.stocks.map(s => s.code);
A(JSON.stringify(order) === JSON.stringify(['600011', '600012', '600010', '600013']), '优先股排最前且组内保持涨幅序(优先组 B8>C7,非优先组 A9>D6)');
A(q.get(job.jobId).workerVersion === 'p1w-test', 'claim 盖 worker 版本');
q.update({ token: 'x'.repeat(24), jobId: job.jobId, results: [
  { code: '600011', name: 'B', price: 12.5, thresholds: { '500000': {}, '3000000': {}, '5000000': {}, '8000000': {}, '10000000': {} } },
  { code: '600012', name: 'C', thresholds: { '500000': {} } },
] });
const after = q.get(job.jobId);
A(!!after.firstResultAt, '首批结果时间已记录');
A(after.metrics.resultRows === 2 && after.metrics.rowsWithPrice === 1 && after.metrics.rowsWithAllBuckets === 1, 'job 指标:行数/价格覆盖/五档齐全');
q.update({ token: 'x'.repeat(24), jobId: job.jobId, version: 'p1w-test2', results: [] });
A(q.get(job.jobId).workerVersion === 'p1w-test2', 'update 可更新 worker 版本');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL SCAN-PRIORITY CHECKS PASSED');
