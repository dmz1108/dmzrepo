'use strict';

const crypto = require('crypto');

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_THRESHOLDS = [500000, 3000000, 5000000, 8000000, 10000000];
const PICK_SIGNAL_MIN_AMOUNT = 500000;

function isExcludedL2StockCode(code) {
  const text = String(code || '').replace(/\D/g, '').slice(0, 6);
  return /^688/.test(text) || /^[489]\d{5}$/.test(text);
}

function normalizeStock(stock, index = 0) {
  const code = String(stock?.code || stock?.dm || stock?.symbol || '').replace(/\D/g, '').slice(0, 6);
  if (!code || isExcludedL2StockCode(code)) return null;
  return {
    code,
    name: String(stock?.name || stock?.mc || stock?.stockName || '').trim(),
    gainPct: numOrNull(stock?.gainPct ?? stock?.gain ?? stock?.todayGain ?? stock?.zf ?? stock?.changePct),
    sourceIndex: index,
  };
}

function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fixed(value, digits = 2) {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(digits)) : null;
}

function summarizeThreshold(row, minAmount) {
  const t = row?.thresholds?.[String(minAmount)];
  if (t) return {
    activeBuy: Number(t.activeBuy || 0),
    passiveBuy: Number(t.passiveBuy || 0),
    activeSell: Number(t.activeSell || 0),
    passiveSell: Number(t.passiveSell || 0),
  };
  return {
    activeBuy: Number(row?.activeBuy || 0),
    passiveBuy: Number(row?.passiveBuy || 0),
    activeSell: Number(row?.activeSell || 0),
    passiveSell: Number(row?.passiveSell || 0),
  };
}

function addPickSignals(row, threshold, minAmount) {
  const selected = summarizeThreshold(row, minAmount);
  const activeBuy = selected.activeBuy;
  const passiveBuy = selected.passiveBuy;
  const activeSell = selected.activeSell;
  const passiveSell = selected.passiveSell;
  const activeRatio = activeSell > 0 ? activeBuy / Math.max(1, activeSell) : (activeBuy > 0 ? Infinity : 0);
  const passiveRatio = passiveSell > 0 ? passiveBuy / Math.max(1, passiveSell) : (passiveBuy > 0 ? Infinity : 0);
  const buySupport = activeBuy + passiveBuy;
  const sellPressure = activeSell + passiveSell;
  const supportRatio = sellPressure > 0 ? buySupport / Math.max(1, sellPressure) : (buySupport > 0 ? Infinity : 0);
  const pickSignals = {
    active: activeRatio >= threshold,
    passive: passiveRatio >= threshold,
    support: supportRatio >= threshold,
  };
  const pickSignalCount = Object.values(pickSignals).filter(Boolean).length;
  const pickReason = pickSignalCount >= 2 ? 'two-of-three' : '';
  return {
    ...row,
    activeBuy,
    passiveBuy,
    activeSell,
    passiveSell,
    netActive: activeBuy - activeSell,
    activeRatio: Number.isFinite(activeRatio) ? fixed(activeRatio, 2) : null,
    passiveRatio: Number.isFinite(passiveRatio) ? fixed(passiveRatio, 2) : null,
    supportRatio: Number.isFinite(supportRatio) ? fixed(supportRatio, 2) : null,
    buySupport: Math.round(buySupport),
    sellPressure: Math.round(sellPressure),
    pickSignals,
    pickSignalCount,
    pickReason,
  };
}

function publicJob(job) {
  if (!job) return null;
  const safe = { ...job };
  delete safe.stocks;
  delete safe.claimedBy;
  return safe;
}

function latestJobKey(plateId, day) {
  return `${String(day || '')}:${String(plateId || '')}`;
}

function workerJob(job) {
  return {
    jobId: job.jobId,
    plateId: job.plateId,
    boardName: job.boardName,
    day: job.day,
    createdAt: job.createdAt,
    sortSnapshotAt: job.sortSnapshotAt,
    threshold: job.threshold,
    minAmount: job.minAmount,
    thresholds: job.thresholds,
    total: job.total,
    batchSize: job.batchSize,
    stocks: job.stocks,
  };
}

function constantTimeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  if (!left.length || left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

class LocalL2TaskQueue {
  constructor(options = {}) {
    this.token = String(options.token || process.env.PANDA_LOCAL_L2_WORKER_TOKEN || '').trim();
    this.batchSize = Number(options.batchSize || DEFAULT_BATCH_SIZE);
    this.jobs = new Map();
    this.latestByPlate = new Map();
    this.queue = [];
    this.worker = {
      lastSeenAt: '',
      id: '',
      version: '',
      host: '',
    };
  }

  configured() {
    return this.token.length >= 16;
  }

  assertToken(token) {
    if (!this.configured() || !constantTimeEqual(token, this.token)) {
      const err = new Error('unauthorized worker');
      err.status = 403;
      throw err;
    }
  }

  status() {
    const now = Date.now();
    const lastSeenMs = this.worker.lastSeenAt ? Date.parse(this.worker.lastSeenAt) : 0;
    return {
      available: this.configured(),
      configured: this.configured(),
      dependencyReady: true,
      mode: 'local-worker',
      note: this.configured() ? '本机计算助手队列已启用' : '本机计算助手Token未配置',
      workerOnline: !!lastSeenMs && now - lastSeenMs < 45000,
      worker: this.worker,
      pending: this.queue.length,
      totalJobs: this.jobs.size,
    };
  }

  start(payload = {}) {
    const lastSeenMs = this.worker.lastSeenAt ? Date.parse(this.worker.lastSeenAt) : 0;
    const workerOnline = !!lastSeenMs && Date.now() - lastSeenMs < 45000;
    const limitStocks = Math.max(0, Math.floor(Number(payload.limitStocks || payload.maxStocks || 0)));
    const rawStocks = Array.isArray(payload.stocks) ? payload.stocks : [];
    const normalizedStocks = rawStocks
      .map((stock, index) => normalizeStock(stock, index))
      .filter(Boolean);
    const stocks = normalizedStocks
      .sort((a, b) => {
        const ag = Number.isFinite(a.gainPct) ? a.gainPct : -Infinity;
        const bg = Number.isFinite(b.gainPct) ? b.gainPct : -Infinity;
        return bg - ag || a.sourceIndex - b.sourceIndex || a.code.localeCompare(b.code);
      })
      .slice(0, limitStocks > 0 ? limitStocks : undefined)
      .map((stock, index) => ({
        ...stock,
        rank: index + 1,
        batch: Math.floor(index / this.batchSize) + 1,
      }));
    const id = crypto.randomBytes(8).toString('hex');
    const excludedStockCount = rawStocks.length - normalizedStocks.length;
    const job = {
      jobId: id,
      plateId: String(payload.plateId || ''),
      boardName: String(payload.boardName || ''),
      day: String(payload.day || ''),
      status: this.configured() ? 'queued' : 'done',
      available: this.configured(),
      mode: 'local-worker',
      note: this.configured()
        ? (workerOnline ? '等待本机计算助手领取任务' : 'L2本机计算助手未在线，任务已排队，启动助手后会继续计算')
        : '本机计算助手Token未配置',
      createdAt: new Date().toISOString(),
      startedAt: '',
      endedAt: '',
      updatedAt: new Date().toISOString(),
      sortSnapshotAt: payload.sortSnapshotAt || new Date().toISOString(),
      sortBy: '实时涨幅快照',
      total: stocks.length,
      excludedStockCount,
      scanned: 0,
      batchSize: this.batchSize,
      currentBatch: 0,
      batchCount: Math.ceil(stocks.length / this.batchSize),
      minAmount: PICK_SIGNAL_MIN_AMOUNT,
      threshold: Number(payload.threshold || 1.5),
      thresholds: DEFAULT_THRESHOLDS.slice(),
      stocks,
      picked: [],
      pickedCount: 0,
      results: [],
      error: '',
      claimedBy: '',
    };
    this.jobs.set(id, job);
    this.latestByPlate.set(latestJobKey(job.plateId, job.day), id);
    if (job.available && stocks.length) this.queue.push(id);
    if (job.available && !stocks.length) {
      job.status = 'done';
      job.note = excludedStockCount ? '板块成分股已排除688和北交所，剩余没有可扫描股票' : '板块没有可扫描成分股';
      job.endedAt = new Date().toISOString();
    }
    return publicJob(job);
  }

  get(jobId) {
    return publicJob(this.jobs.get(String(jobId || '')));
  }

  latest(plateId, day) {
    const id = this.latestByPlate.get(latestJobKey(plateId, day));
    if (id) return publicJob(this.jobs.get(id));
    let latest = null;
    for (const job of this.jobs.values()) {
      if (String(job.plateId) !== String(plateId || '')) continue;
      if (day && String(job.day) !== String(day)) continue;
      if (!latest || String(job.createdAt || '') > String(latest.createdAt || '')) latest = job;
    }
    return publicJob(latest);
  }

  claim(body = {}) {
    this.assertToken(body.token || body.workerToken);
    this.worker = {
      lastSeenAt: new Date().toISOString(),
      id: String(body.workerId || body.id || ''),
      version: String(body.version || ''),
      host: String(body.host || ''),
    };
    while (this.queue.length) {
      const jobId = this.queue.shift();
      const job = this.jobs.get(jobId);
      if (!job || job.status !== 'queued') continue;
      job.status = 'running';
      job.startedAt = new Date().toISOString();
      job.updatedAt = job.startedAt;
      job.note = '本机计算助手已领取任务';
      job.claimedBy = this.worker.id || this.worker.host || 'local-worker';
      return { ok: true, job: workerJob(job) };
    }
    return { ok: true, job: null, worker: this.worker };
  }

  update(body = {}) {
    this.assertToken(body.token || body.workerToken);
    const job = this.jobs.get(String(body.jobId || ''));
    if (!job) {
      const err = new Error('job not found');
      err.status = 404;
      throw err;
    }
    job.updatedAt = new Date().toISOString();
    if (Number.isFinite(Number(body.scanned))) job.scanned = Number(body.scanned);
    if (Number.isFinite(Number(body.currentBatch))) job.currentBatch = Number(body.currentBatch);
    if (body.note) job.note = String(body.note);
    if (Array.isArray(body.results)) {
      const threshold = Number(job.threshold || 1.5);
      const minAmount = PICK_SIGNAL_MIN_AMOUNT;
      const withSignals = body.results.map(row => addPickSignals(row, threshold, minAmount));
      job.results = withSignals;
      job.picked = withSignals
        .filter(row => row.pickReason)
        .sort((a, b) => b.buySupport - a.buySupport || b.netActive - a.netActive || b.activeBuy - a.activeBuy || a.rank - b.rank);
      job.pickedCount = job.picked.length;
    }
    if (body.status === 'error') {
      job.status = 'error';
      job.error = String(body.error || body.note || 'worker failed');
      job.note = job.error;
      job.endedAt = new Date().toISOString();
    } else if (body.status === 'done') {
      job.status = 'done';
      job.scanned = Number.isFinite(Number(body.scanned)) ? Number(body.scanned) : job.total;
      job.note = body.note ? String(body.note) : '本机计算完成';
      job.endedAt = new Date().toISOString();
    } else {
      job.status = 'running';
    }
    return { ok: true, job: publicJob(job) };
  }
}

function createLocalL2TaskQueue(options = {}) {
  return new LocalL2TaskQueue(options);
}

module.exports = { createLocalL2TaskQueue, DEFAULT_THRESHOLDS };
