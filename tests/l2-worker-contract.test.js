'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { createLocalL2TaskQueue, DEFAULT_THRESHOLDS } = require('../local-l2-task-queue');
const {
  THRESHOLDS,
  parseAndAggregate,
  workerThresholdsFromAggregate,
} = require('../tools/axtick_down_benchmark');
const { validateWorkerOutput } = require('../tools/validate-l2-worker-output');

const fixtureDir = path.join(__dirname, 'fixtures');
const claimPath = path.join(fixtureDir, 'l2-worker-claim.example.json');
const resultPath = path.join(fixtureDir, 'l2-worker-result.example.json');
const claimFixture = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
const resultFixture = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function check(condition, message) {
  assert.ok(condition, message);
  console.log(`ok: ${message}`);
}

function expectInvalid(mutator, expectedText, message) {
  const payload = clone(resultFixture);
  mutator(payload);
  const report = validateWorkerOutput(payload, { claim: claimFixture });
  check(!report.ok && report.errors.some((entry) => `${entry.path} ${entry.message}`.includes(expectedText)), message);
}

// 1. 下载参考工具与云端使用完全相同的五档。
check(JSON.stringify(THRESHOLDS) === JSON.stringify(DEFAULT_THRESHOLDS), '下载聚合工具与云端五档完全一致');

// 2. 同一委托拆成 40万 + 20万，必须先按委托号累计成 60万，再进入 50万档。
const csv = [
  '时间,unused1,unused2,成交金额,买卖方向,unused5,叫买方委托序号,叫卖方委托序号',
  '92500000,,,999000000000,B,,PREB,PRES',
  '93000001,,,4000000000,B,,B1,S1',
  '93000002,,,2000000000,B,,B1,S1',
  '93000003,,,35000000000,B,,B2,S2',
  '93000004,,,55000000000,B,,B3,S3',
  '93000005,,,85000000000,B,,B4,S4',
  '93000006,,,105000000000,B,,B5,S5',
  '93000007,,,6000000000,S,,PB1,AS1',
  '93000008,,,35000000000,S,,PB2,AS2',
  '93000009,,,85000000000,S,,PB3,AS3',
  '93000010,,,105000000000,S,,PB4,AS4',
].join('\n');
const aggregate = parseAndAggregate(csv);
check(aggregate.skippedRows === 1, '盘前成交按现行口径排除');
check(aggregate.thresholds['500000'].activeBuy.count === 5, '拆分委托累计越过50万后计入且不按成交笔重复计数');
check(aggregate.thresholds['500000'].activeBuy.amount === 28600000, '50万档主动买金额按委托累计后求和');
check(aggregate.thresholds['3000000'].activeBuy.amount === 28000000, '300万档主动买金额正确');
check(aggregate.thresholds['5000000'].activeBuy.amount === 24500000, '500万档主动买金额正确');
check(aggregate.thresholds['8000000'].activeBuy.amount === 19000000, '800万档主动买金额正确');
check(aggregate.thresholds['10000000'].activeBuy.amount === 10500000, '1000万档主动买金额正确');
const converted = workerThresholdsFromAggregate(aggregate);
check(DEFAULT_THRESHOLDS.every((threshold) => converted[String(threshold)]), '聚合结果可以生成完整五档 worker 字段');
check(converted['500000'].activeBuyCount === 5 && converted['500000'].passiveSellCount === 5, '主动买与对应被动卖委托笔数成对归集');

// 3. 正式样例必须通过模块与命令行两种验收。
const validReport = validateWorkerOutput(resultFixture, { claim: claimFixture });
check(validReport.ok && validReport.errors.length === 0, '正式五档结果样例通过契约校验');
check(validReport.metrics.resultRows === 2 && validReport.metrics.rowsWithPrice === 2 && validReport.metrics.rowsWithAllBuckets === 2, '本地契约指标达到满覆盖');
const cli = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'validate-l2-worker-output.js'), resultPath, '--job', claimPath], { encoding: 'utf8' });
check(cli.status === 0 && JSON.parse(cli.stdout).ok === true, '公司端可直接运行命令行校验器');

// 4. 五档必须全部存在；真实无大单用零，不能缺档、空对象或数字字符串。
expectInvalid((payload) => { delete payload.results[0].thresholds['8000000']; }, 'results[0].thresholds.8000000', '缺少800万档会失败');
expectInvalid((payload) => { payload.results[0].thresholds['10000000'] = {}; }, 'results[0].thresholds.10000000.activeBuy', '空档位对象会失败');
expectInvalid((payload) => { payload.results[0].thresholds['500000'].activeBuy = '450000000'; }, 'JSON 数字', '数字字符串会失败');
const zeroRowReport = validateWorkerOutput(resultFixture, { claim: claimFixture });
check(zeroRowReport.ok && resultFixture.results[1].thresholds['10000000'].activeBuy === 0, '高档真实无大单时四项零值合法');

// 5. 高档金额只能是低档的子集；违反单调性通常代表单位或重复累计错误。
expectInvalid((payload) => { payload.results[0].thresholds['10000000'].activeBuy = 400000000; }, '随档位升高不能增加', '档位金额非单调会失败');
expectInvalid((payload) => { delete payload.results[0].price; }, '必须回传以人民币元计', '缺少现价会失败');
expectInvalid((payload) => { payload.results[0].price = 100000; }, '疑似把万分之一元', '疑似未换算的原始现价会失败');

// 6. 云端 results 是累计快照替换，不是增量追加；第二批不能只回第二只股票。
expectInvalid((payload) => {
  payload.status = 'running';
  payload.results = [payload.results[1]];
  payload.scanned = 1;
}, '保持领取任务 stocks 的顺序', '只上报新增批次而丢掉累计前缀会失败');
expectInvalid((payload) => {
  payload.results = payload.results.slice(0, 1);
  payload.scanned = 1;
}, 'done 状态必须覆盖全部', 'done 状态未覆盖全部股票会失败');

const errorReport = validateWorkerOutput({
  jobId: claimFixture.job.jobId,
  version: resultFixture.version,
  status: 'error',
  error: 'source response was incomplete',
}, { claim: claimFixture });
check(errorReport.ok && errorReport.metrics.resultRows === 0, '真实下载或解析失败可明确报错且不伪造零值结果');
expectInvalid((payload) => {
  payload.status = 'error';
  payload.error = 'source failed';
}, '不得用伪造的零值结果', 'error 状态携带结果行会失败');

// 7. 用真实云端队列类做一次领取、校验、回传，确认观测指标与 workerVersion 都能落下。
const persistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-l2-worker-contract-'));
try {
  const queue = createLocalL2TaskQueue({ token: 'x'.repeat(32), persistDir });
  queue.start({
    plateId: claimFixture.job.plateId,
    boardName: claimFixture.job.boardName,
    day: claimFixture.job.day,
    stocks: claimFixture.job.stocks,
    priorityCodes: claimFixture.job.priorityCodes,
  });
  const claimed = queue.claim({ token: 'x'.repeat(32), workerId: 'company-worker-test', version: resultFixture.version });
  check(claimed.job.stocks[0].code === claimFixture.job.priorityCodes[0], '领取任务中优先股票位于 stocks 前部');
  const update = { ...clone(resultFixture), jobId: claimed.job.jobId };
  const integrationReport = validateWorkerOutput(update, { claim: claimed });
  check(integrationReport.ok, '正式样例与真实队列领取结果兼容');
  queue.update({ token: 'x'.repeat(32), ...update });
  const saved = queue.get(claimed.job.jobId);
  check(saved.status === 'done' && saved.workerVersion === resultFixture.version, '云端队列保存完成状态与 workerVersion');
  check(saved.metrics.resultRows === 2 && saved.metrics.rowsWithPrice === 2 && saved.metrics.rowsWithAllBuckets === 2, '云端队列三项验收指标满覆盖');
  check(!!saved.firstResultAt, '云端队列记录首批结果时间');
} finally {
  fs.rmSync(persistDir, { recursive: true, force: true });
}

console.log('ALL L2-WORKER-CONTRACT CHECKS PASSED');
