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
const restoreNowMs = Date.parse('2026-07-15T02:00:00.000Z'); // 北京时间 10:00，自动 L2 领取窗口内

const chinaBoundaryQueue = createLocalL2TaskQueue({
  token,
  nowMs: Date.parse('2026-07-15T16:30:00.000Z'),
});
assert.equal(chinaBoundaryQueue.status().persistence.resumeDay, '2026-07-16', 'UTC 跨 16:00 后应按中国时区进入下一日');

function th(activeBuy, activeSell, passiveBuy, passiveSell) {
  return { activeBuy, activeSell, passiveBuy, passiveSell };
}

function assertFile(file, message) {
  assert.ok(fs.existsSync(file), `${message}: ${file}`);
}

try {
  let queueNow = restoreNowMs;
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
    nowMs: restoreNowMs,
    clock: () => queueNow,
  });
  assert.ok(!fs.existsSync(path.join(tempRoot, '2000-01-01')), '30 天外的旧目录应被自动清理');

  const job = queue.start({
    plateId: 'BK_TEST',
    boardName: '测试板块',
    day: '2026-07-15',
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

  const latestFile = path.join(tempRoot, '2026-07-15', job.jobId, 'latest.json');
  const samplesDir = path.join(tempRoot, '2026-07-15', job.jobId, 'samples');
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

  queueNow += 1000;
  const emptyRetry = queue.start({
    plateId: 'BK_TEST',
    boardName: '测试板块',
    day: '2026-07-15',
    trigger: 'manual',
    stocks: [],
  });
  assert.equal(emptyRetry.status, 'done', '后一次空任务应正常结束');
  assert.equal(queue.latest('BK_TEST', '2026-07-15').jobId, emptyRetry.jobId, 'latest 仍表示最后一次尝试');
  assert.equal(queue.latestSuccessful('BK_TEST', '2026-07-15').jobId, job.jobId, '空任务不得遮蔽前一次有效结果');
  assert.equal(queue.listDay('2026-07-15').length, 2, '按日任务列表应保留自动和手动历史');

  const restored = createLocalL2TaskQueue({
    token,
    batchSize: 2,
    persistDir: tempRoot,
    persistDays: 30,
    nowMs: restoreNowMs,
  });
  const status = restored.status();
  assert.equal(status.totalJobs, 2, '重启后应恢复两个任务');
  assert.equal(status.pending, 0, '恢复任务只用于读回放,不重新排队');
  assert.equal(status.persistence.restoredJobs, 2, '恢复计数应正确');

  const restoredLatest = restored.latest('BK_TEST', '2026-07-15');
  assert.equal(restoredLatest.status, 'done', '恢复后的最新任务状态应保留');
  assert.equal(restoredLatest.jobId, emptyRetry.jobId, '恢复后 latest 仍指向最后一次空任务');
  const restoredSuccessful = restored.latestSuccessful('BK_TEST', '2026-07-15');
  assert.equal(restoredSuccessful.results[0].thresholds['10000000'].activeBuy, 350000000, '恢复后有效任务五档资金应完整');
  assert.equal(restoredSuccessful.results[0].price, 10.2, '恢复后有效任务现价应完整');

  const recoverRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-l2-recover-'));
  try {
    const beforeRestart = createLocalL2TaskQueue({ token, batchSize: 2, persistDir: recoverRoot, persistDays: 30, nowMs: restoreNowMs });
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
    assert.equal(beforeRestart.get(completeRunning.jobId).status, 'done', 'worker 已回完整结果即使漏发 done，服务端也应自动完成');
    assert.match(beforeRestart.get(completeRunning.jobId).note, /自动确认完成/, '自动完成应保留可审计说明');

    const historicalIncomplete = beforeRestart.start({
      plateId: 'BK_STALE', boardName: '历史残缺板块', day: '2026-06-20',
      stocks: [{ code: '600012', name: '历史残缺股', gainPct: 5.2, price: 9, priceSource: 'board-realtime' }],
    });
    // 直接把落盘夹具改成历史 running，模拟旧版本在重启前留下的跨日残缺任务；
    // 新版本 claim 会拒绝使用当前盘口领取历史任务，因此不能再通过公开领取路径构造。
    const historicalFile = path.join(recoverRoot, '2026-06-20', historicalIncomplete.jobId, 'latest.json');
    const historicalPayload = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    historicalPayload.job.status = 'running';
    historicalPayload.job.startedAt = '2026-06-20T02:00:00.000Z';
    historicalPayload.job.updatedAt = '2026-06-20T02:00:00.000Z';
    fs.writeFileSync(historicalFile, JSON.stringify(historicalPayload, null, 2), 'utf8');

    const incompleteQueued = beforeRestart.start({
      plateId: 'BK_PENDING', boardName: '待续扫板块', day: '2026-07-15',
      stocks: [{ code: '600011', name: '待续扫股', gainPct: 5.5, price: 8, priceSource: 'board-realtime' }],
    });

    const afterRestart = createLocalL2TaskQueue({ token, batchSize: 2, persistDir: recoverRoot, persistDays: 30, nowMs: restoreNowMs });
    assert.equal(afterRestart.status().persistence.resumeDay, '2026-07-15', '恢复扫描日应按中国时区当天计算');
    assert.equal(afterRestart.get(completeRunning.jobId).status, 'done', '服务端自动完成的任务重启后应保持 done');
    assert.match(afterRestart.get(completeRunning.jobId).note, /自动确认完成/, '重启后应保留原始自动完成审计说明');
    assert.equal(afterRestart.status().pending, 1, '只有当天未完成任务应在重启后重新入队');
    assert.equal(afterRestart.get(historicalIncomplete.jobId).status, 'error', '历史未完成任务应终止，不得伪装成仍在排队');
    assert.match(afterRestart.get(historicalIncomplete.jobId).note, /仅恢复供查看/, '历史任务应保留不续扫的可审计说明');
    const reclaimed = afterRestart.claim({ token, workerId: 'worker-recover-2' });
    assert.equal(reclaimed.job.jobId, incompleteQueued.jobId, '重启后 worker 应能重新领取未完成任务');
    const noHistoricalClaim = afterRestart.claim({ token, workerId: 'worker-recover-2' });
    assert.equal(noHistoricalClaim.job, null, '当天任务领取后不得继续领取历史残缺任务');
  } finally {
    fs.rmSync(recoverRoot, { recursive: true, force: true });
  }

  let leaseNow = Date.parse('2026-08-12T02:00:00.000Z'); // 北京时间 10:00
  const leaseQueue = createLocalL2TaskQueue({
    token,
    clock: () => leaseNow,
    runningLeaseMs: 5 * 60 * 1000,
  });
  const runningTimeout = leaseQueue.start({
    plateId: 'BK_RUNNING_TIMEOUT', boardName: '运行超时板块', day: '2026-08-12',
    trigger: 'strategy-auto',
    stocks: [{ code: '600020', name: '运行超时股', gainPct: 6, price: 10 }],
  });
  leaseQueue.claim({ token, workerId: 'worker-timeout' });
  leaseNow += 5 * 60 * 1000 + 1;
  assert.equal(leaseQueue.get(runningTimeout.jobId).status, 'error', 'worker 超过运行租约未回传应自动失败并释放串行锁');
  assert.match(leaseQueue.get(runningTimeout.jobId).note, /超过5分钟未回传进度/, '运行租约失败应保留明确原因');
  assert.throws(() => leaseQueue.update({ token, jobId: runningTimeout.jobId, status: 'done' }), err => err?.status === 409,
    '租约失效后的迟到结果不得把失败任务改回完成');

  const autoComplete = leaseQueue.start({
    plateId: 'BK_AUTO_DONE', boardName: '自动确认完成板块', day: '2026-08-12',
    trigger: 'strategy-auto',
    stocks: [{ code: '600022', name: '自动完成股', gainPct: 7, price: 12 }],
  });
  leaseQueue.claim({ token, workerId: 'worker-auto-done' });
  const autoCompleted = leaseQueue.update({
    token,
    jobId: autoComplete.jobId,
    scanned: 1,
    results: [{
      code: '600022', name: '自动完成股', price: 12,
      thresholds: {
        '500000': th(1, 1, 1, 1),
        '3000000': th(1, 1, 1, 1),
        '5000000': th(1, 1, 1, 1),
        '8000000': th(1, 1, 1, 1),
        '10000000': th(1, 1, 1, 1),
      },
    }],
  });
  assert.equal(autoCompleted.job.status, 'done', '50/50 完整结果即使 worker 漏发 done，也应由服务端自动完成');
  assert.match(autoCompleted.job.note, /自动确认完成/, '服务端自动完成应可审计');

  const afterCloseRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'panda-l2-after-close-'));
  try {
    let beforeCloseNow = Date.parse('2026-08-12T06:50:00.000Z'); // 北京时间 14:50
    const beforeCloseQueue = createLocalL2TaskQueue({
      token, persistDir: afterCloseRoot, persistDays: 30, clock: () => beforeCloseNow, nowMs: beforeCloseNow,
    });
    const unfinishedAuto = beforeCloseQueue.start({
      plateId: 'BK_AFTER_CLOSE', boardName: '收盘恢复板块', day: '2026-08-12',
      trigger: 'strategy-auto',
      stocks: [{ code: '600023', name: '收盘恢复股', gainPct: 6, price: 13 }],
    });
    beforeCloseQueue.claim({ token, workerId: 'worker-before-close' });
    const afterCloseNow = Date.parse('2026-08-12T07:05:00.000Z'); // 北京时间 15:05
    const afterCloseQueue = createLocalL2TaskQueue({
      token, persistDir: afterCloseRoot, persistDays: 30, nowMs: afterCloseNow,
    });
    assert.equal(afterCloseQueue.get(unfinishedAuto.jobId).status, 'error', '收盘后重启不得把当日自动任务重新排队');
    assert.match(afterCloseQueue.get(unfinishedAuto.jobId).note, /收盘后恢复时终止/, '收盘后终止应说明未用盘后盘口补扫');
    assert.equal(afterCloseQueue.status().pending, 0, '收盘后恢复的自动任务不进入 worker 队列');
    assert.throws(() => afterCloseQueue.update({ token, jobId: unfinishedAuto.jobId, status: 'done' }), err => err?.status === 409,
      '收盘后终止任务的迟到回执不得改写历史结果');
  } finally {
    fs.rmSync(afterCloseRoot, { recursive: true, force: true });
  }

  console.log('ALL LOCAL-L2-PERSISTENCE CHECKS PASSED');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
