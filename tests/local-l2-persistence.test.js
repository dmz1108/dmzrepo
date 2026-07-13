// L2 本机任务队列落盘测试(node tests/local-l2-persistence.test.js)
// 验证:worker 回传结果会保存 latest+samples,服务重启后能恢复,30 天外目录会清理。
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLocalL2TaskQueue } = require('../local-l2-task-queue');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-l2-persist-'));
const token = 'test-local-l2-token-20260710';

function th(activeBuy, activeSell, passiveBuy, passiveSell) {
  return { activeBuy, activeSell, passiveBuy, passiveSell };
}

function assertFile(file, message) {
  assert.ok(fs.existsSync(file), `${message}: ${file}`);
}

try {
  const oldDayDir = path.join(tempRoot, '2000-01-01', 'old-job');
  fs.mkdirSync(oldDayDir, { recursive: true });
  fs.writeFileSync(path.join(oldDayDir, 'latest.json'), JSON.stringify({
    version: 1,
    savedAt: '2000-01-01T00:00:00.000Z',
    job: { jobId: 'old-job', day: '2000-01-01', plateId: 'OLD', status: 'done' },
  }), 'utf8');

  const queue = createLocalL2TaskQueue({
    token,
    batchSize: 2,
    persistDir: tempRoot,
    persistDays: 30,
  });
  assert.ok(!fs.existsSync(path.join(tempRoot, '2000-01-01')), '30 天外的旧目录应被自动清理');

  const job = queue.start({
    plateId: 'BK_TEST',
    boardName: '测试板块',
    day: '2026-07-10',
    stocks: [
      { code: '600001', name: '测试一', gainPct: 6.8, price: 10.1, priceSource: 'board-realtime' },
      { code: '000002', name: '测试二', gainPct: 4.2, price: 4.8, priceSource: 'board-realtime' },
    ],
  });
  assert.equal(job.status, 'queued', '有 token 时任务应进入排队');

  const claimed = queue.claim({ token, workerId: 'worker-a', host: 'company-pc' });
  assert.equal(claimed.job.jobId, job.jobId, 'worker 应领取刚创建的任务');

  const updated = queue.update({
    token,
    jobId: job.jobId,
    status: 'done',
    scanned: 2,
    results: [
      {
        code: '600001',
        name: '测试一',
        rank: 1,
        gainPct: 8.6,
        price: 10.2,
        thresholds: {
          '500000': th(70000000, 20000000, 58000000, 18000000),
          '3000000': th(120000000, 50000000, 93000000, 40000000),
          '5000000': th(180000000, 80000000, 140000000, 65000000),
          '8000000': th(260000000, 110000000, 180000000, 90000000),
          '10000000': th(350000000, 150000000, 260000000, 120000000),
        },
      },
      {
        code: '000002',
        name: '测试二',
        rank: 2,
        gainPct: 4.2,
        thresholds: {
          '500000': th(10000000, 12000000, 8000000, 9000000),
          '3000000': th(20000000, 26000000, 18000000, 24000000),
        },
      },
    ],
  });
  assert.equal(updated.job.status, 'done', '更新后任务应完成');
  assert.equal(updated.job.pickedCount, 1, '强资金股票应进入 picked');

  const latestFile = path.join(tempRoot, '2026-07-10', job.jobId, 'latest.json');
  const samplesDir = path.join(tempRoot, '2026-07-10', job.jobId, 'samples');
  assertFile(latestFile, 'latest.json 应存在');
  assert.ok(fs.readdirSync(samplesDir).some(name => name.endsWith('.json')), '回传结果时应保存样本文件');

  const latestPayload = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
  assert.equal(latestPayload.job.results[0].price, 10.2, '现价字段应落盘');
  assert.equal(latestPayload.job.results[0].priceSource, 'worker-result', 'worker 自带现价应优先并记录来源');
  assert.equal(latestPayload.job.results[1].price, 4.8, 'worker 缺价时应从任务股票快照补回现价');
  assert.equal(latestPayload.job.results[1].priceSource, 'board-realtime', '任务快照补价应保留来源');
  assert.ok(latestPayload.job.results[0].thresholds['10000000'], '1000w 档应落盘');
  assert.equal(latestPayload.job.claimedBy, '', '落盘文件不保存 worker 标识');

  const restored = createLocalL2TaskQueue({
    token,
    batchSize: 2,
    persistDir: tempRoot,
    persistDays: 30,
  });
  const status = restored.status();
  assert.equal(status.totalJobs, 1, '重启后应恢复一个任务');
  assert.equal(status.pending, 0, '恢复任务只用于读回放,不重新排队');
  assert.equal(status.persistence.restoredJobs, 1, '恢复计数应正确');

  const restoredLatest = restored.latest('BK_TEST', '2026-07-10');
  assert.equal(restoredLatest.status, 'done', '恢复后的最新任务状态应保留');
  assert.equal(restoredLatest.results[0].thresholds['10000000'].activeBuy, 350000000, '恢复后五档资金应完整');
  assert.equal(restoredLatest.results[0].price, 10.2, '恢复后现价应完整');

  console.log('ALL LOCAL-L2-PERSISTENCE CHECKS PASSED');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
