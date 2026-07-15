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
    trigger: 'strategy-auto',
    familyKey: 'group:测试',
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
  assert.equal(latestPayload.job.trigger, 'strategy-auto', '自动扫描来源应落盘');
  assert.equal(latestPayload.job.familyKey, 'group:测试', '主线家族键应落盘');

  const emptyRetry = queue.start({
    plateId: 'BK_TEST',
    boardName: '测试板块',
    day: '2026-07-10',
    trigger: 'manual',
    stocks: [],
  });
  assert.equal(emptyRetry.status, 'done', '后一次空任务应正常结束');
  assert.equal(queue.latest('BK_TEST', '2026-07-10').jobId, emptyRetry.jobId, 'latest 仍表示最后一次尝试');
  assert.equal(queue.latestSuccessful('BK_TEST', '2026-07-10').jobId, job.jobId, '空任务不得遮蔽前一次有效结果');
  assert.equal(queue.listDay('2026-07-10').length, 2, '按日任务列表应保留自动和手动历史');

  const restored = createLocalL2TaskQueue({
    token,
    batchSize: 2,
    persistDir: tempRoot,
    persistDays: 30,
  });
  const status = restored.status();
  assert.equal(status.totalJobs, 2, '重启后应恢复两个任务');
  assert.equal(status.pending, 0, '恢复任务只用于读回放,不重新排队');
  assert.equal(status.persistence.restoredJobs, 2, '恢复计数应正确');

  const restoredLatest = restored.latest('BK_TEST', '2026-07-10');
  assert.equal(restoredLatest.status, 'done', '恢复后的最新任务状态应保留');
  assert.equal(restoredLatest.jobId, emptyRetry.jobId, '恢复后 latest 仍指向最后一次空任务');
  const restoredSuccessful = restored.latestSuccessful('BK_TEST', '2026-07-10');
  assert.equal(restoredSuccessful.results[0].thresholds['10000000'].activeBuy, 350000000, '恢复后有效任务五档资金应完整');
  assert.equal(restoredSuccessful.results[0].price, 10.2, '恢复后有效任务现价应完整');

  const recoverRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-l2-recover-'));
  try {
    const beforeRestart = createLocalL2TaskQueue({ token, batchSize: 2, persistDir: recoverRoot, persistDays: 30 });
    const completeRunning = beforeRestart.start({
      plateId: 'BK_COMPLETE', boardName: '完整结果板块', day: '2026-07-15',
      stocks: [{ code: '600010', name: '完整结果股', gainPct: 6, price: 12, priceSource: 'board-realtime' }],
    });
    beforeRestart.claim({ token, workerId: 'worker-recover' });
    beforeRestart.update({
      token, jobId: completeRunning.jobId, scanned: 1,
      results: [{
        code: '600010', name: '完整结果股', gainPct: 6,
        thresholds: {
          '500000': th(1, 1, 1, 1),
          '3000000': th(1, 1, 1, 1),
          '5000000': th(1, 1, 1, 1),
          '8000000': th(1, 1, 1, 1),
          '10000000': th(1, 1, 1, 1),
        },
      }],
    });
    assert.equal(beforeRestart.get(completeRunning.jobId).status, 'running', '模拟 worker 已回完整结果但漏发 done');

    const incompleteQueued = beforeRestart.start({
      plateId: 'BK_PENDING', boardName: '待续扫板块', day: '2026-07-15',
      stocks: [{ code: '600011', name: '待续扫股', gainPct: 5.5, price: 8, priceSource: 'board-realtime' }],
    });

    const afterRestart = createLocalL2TaskQueue({ token, batchSize: 2, persistDir: recoverRoot, persistDays: 30 });
    assert.equal(afterRestart.get(completeRunning.jobId).status, 'done', '完整落盘的 running 任务应在重启时恢复为 done');
    assert.match(afterRestart.get(completeRunning.jobId).note, /自动恢复为完成/, '自动完成应保留可审计说明');
    assert.equal(afterRestart.status().pending, 1, '未完成任务应在重启后重新入队');
    const reclaimed = afterRestart.claim({ token, workerId: 'worker-recover-2' });
    assert.equal(reclaimed.job.jobId, incompleteQueued.jobId, '重启后 worker 应能重新领取未完成任务');
  } finally {
    fs.rmSync(recoverRoot, { recursive: true, force: true });
  }

  console.log('ALL LOCAL-L2-PERSISTENCE CHECKS PASSED');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
