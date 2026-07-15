'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_THRESHOLDS = [500000, 3000000, 5000000, 8000000, 10000000];
const PICK_SIGNAL_MIN_AMOUNT = 500000;
const DEFAULT_PERSIST_DAYS = 30;

function isExcludedL2StockCode(code) {
  const text = String(code || '').replace(/\D/g, '').slice(0, 6);
  return /^688/.test(text) || /^[489]\d{5}$/.test(text);
}

function normalizeStock(stock, index = 0) {
  const code = String(stock?.code || stock?.dm || stock?.symbol || '').replace(/\D/g, '').slice(0, 6);
  if (!code || isExcludedL2StockCode(code)) return null;
  const price = numOrNull(stock?.price ?? stock?.close ?? stock?.lastPrice);
  return {
    code,
    name: String(stock?.name || stock?.mc || stock?.stockName || '').trim(),
    gainPct: numOrNull(stock?.gainPct ?? stock?.gain ?? stock?.todayGain ?? stock?.zf ?? stock?.changePct),
    price: price != null && price > 0 ? price : null,
    priceSource: price != null && price > 0 ? String(stock?.priceSource || 'board-realtime') : '',
    priceAsOf: price != null && price > 0 ? String(stock?.priceAsOf || stock?.asOf || '') : '',
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

function safePathPart(value) {
  const text = String(value || '').trim().replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 96);
  return text || 'unknown';
}

function timestampPathPart(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function isIsoDay(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function normalizeRestoredJob(job) {
  if (!job || !job.jobId || !job.day) return null;
  const copy = { ...job };
  copy.stocks = Array.isArray(copy.stocks) ? copy.stocks : [];
  copy.picked = Array.isArray(copy.picked) ? copy.picked : [];
  copy.results = Array.isArray(copy.results) ? copy.results : [];
  copy.thresholds = Array.isArray(copy.thresholds) && copy.thresholds.length ? copy.thresholds : DEFAULT_THRESHOLDS.slice();
  copy.batchSize = Number(copy.batchSize || DEFAULT_BATCH_SIZE);
  copy.total = Number(copy.total || copy.stocks.length || 0);
  copy.scanned = Number(copy.scanned || 0);
  copy.pickedCount = Number(copy.pickedCount || copy.picked.length || 0);
  copy.available = copy.available !== false;
  copy.mode = copy.mode || 'local-worker';
  copy.trigger = String(copy.trigger || 'legacy');
  copy.familyKey = String(copy.familyKey || '');
  copy.scanChannel = String(copy.scanChannel || '');
  copy.claimedBy = '';
  return copy;
}

function hasCompletePersistedResult(job) {
  const total = Number(job?.total || 0);
  const scanned = Number(job?.scanned || 0);
  const expectedCodes = new Set((Array.isArray(job?.stocks) ? job.stocks : [])
    .map(stock => String(stock?.code || '').replace(/\D/g, '').slice(0, 6))
    .filter(Boolean));
  const results = Array.isArray(job?.results) ? job.results : [];
  const resultCodes = new Set(results
    .map(row => String(row?.code || row?.dm || row?.symbol || '').replace(/\D/g, '').slice(0, 6))
    .filter(Boolean));
  const metrics = job?.metrics || {};
  return total > 0 &&
    scanned >= total &&
    expectedCodes.size >= total &&
    [...expectedCodes].every(code => resultCodes.has(code)) &&
    results.length >= total &&
    Number(metrics.resultRows || 0) >= total &&
    Number(metrics.rowsWithPrice || 0) >= total &&
    Number(metrics.rowsWithAllBuckets || 0) >= total;
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
    priorityCodes: Array.isArray(job.priorityCodes) ? job.priorityCodes : [],
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
    this.persistDir = String(options.persistDir || options.dataDir || '').trim();
    this.persistDays = Math.max(1, Number(options.persistDays || options.cleanupDays || DEFAULT_PERSIST_DAYS));
    this.persistence = {
      enabled: !!this.persistDir,
      dir: this.persistDir,
      days: this.persistDays,
      restoredJobs: 0,
      lastPersistAt: '',
      lastPersistError: '',
    };
    this.worker = {
      lastSeenAt: '',
      id: '',
      version: '',
      host: '',
    };
    this.cleanupPersistedJobs();
    this.restorePersistedJobs();
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
      persistence: {
        enabled: this.persistence.enabled,
        dir: this.persistence.dir,
        days: this.persistence.days,
        restoredJobs: this.persistence.restoredJobs,
        lastPersistAt: this.persistence.lastPersistAt,
        lastPersistError: this.persistence.lastPersistError,
      },
    };
  }

  listDay(day) {
    const targetDay = String(day || '').trim();
    return [...this.jobs.values()]
      .filter(job => !targetDay || String(job?.day || '') === targetDay)
      .sort((a, b) =>
        String(b?.createdAt || b?.updatedAt || '').localeCompare(String(a?.createdAt || a?.updatedAt || '')) ||
        String(b?.jobId || '').localeCompare(String(a?.jobId || ''))
      )
      .map(publicJob);
  }

  latestSuccessful(plateId, day) {
    const targetPlate = String(plateId || '');
    return this.listDay(day).find(job =>
      String(job?.plateId || '') === targetPlate &&
      String(job?.status || '') === 'done' &&
      Array.isArray(job?.results) && job.results.length > 0
    ) || null;
  }

  persistJob(job, options = {}) {
    if (!this.persistence.enabled || !job?.jobId || !job?.day) return;
    const savedAt = new Date().toISOString();
    const payload = {
      version: 1,
      savedAt,
      job: {
        ...job,
        claimedBy: '',
      },
    };
    const jobDir = path.join(this.persistDir, safePathPart(job.day), safePathPart(job.jobId));
    try {
      atomicWriteJson(path.join(jobDir, 'latest.json'), payload);
      if (options.sample) {
        const suffix = crypto.randomBytes(3).toString('hex');
        atomicWriteJson(path.join(jobDir, 'samples', `${timestampPathPart(new Date(savedAt))}-${suffix}.json`), payload);
      }
      this.persistence.lastPersistAt = savedAt;
      this.persistence.lastPersistError = '';
    } catch (err) {
      this.persistence.lastPersistError = err?.message || String(err);
    }
  }

  restorePersistedJobs() {
    if (!this.persistence.enabled) return;
    let restored = 0;
    try {
      if (!fs.existsSync(this.persistDir)) return;
      const dayDirs = fs.readdirSync(this.persistDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && isIsoDay(d.name))
        .map(d => d.name)
        .sort();
      for (const day of dayDirs) {
        const dayDir = path.join(this.persistDir, day);
        const jobDirs = fs.readdirSync(dayDir, { withFileTypes: true }).filter(d => d.isDirectory());
        for (const jobEntry of jobDirs) {
          const latestFile = path.join(dayDir, jobEntry.name, 'latest.json');
          if (!fs.existsSync(latestFile)) continue;
          let payload = null;
          try {
            payload = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
          } catch {
            continue;
          }
          const job = normalizeRestoredJob(payload?.job || payload);
          if (!job) continue;
          const existing = this.jobs.get(job.jobId);
          if (existing && String(existing.updatedAt || '') > String(job.updatedAt || '')) continue;
          const unfinished = job.status === 'queued' || job.status === 'running';
          if (unfinished && hasCompletePersistedResult(job)) {
            job.status = 'done';
            job.scanned = job.total;
            job.endedAt = job.endedAt || job.updatedAt || payload?.savedAt || new Date().toISOString();
            job.error = '';
            job.note = '本机计算结果已完整落盘；服务重启时自动恢复为完成';
          } else if (unfinished) {
            job.status = 'queued';
            job.startedAt = '';
            job.endedAt = '';
            job.error = '';
            job.note = '服务重启后已从落盘结果恢复并重新排队';
          }
          this.jobs.set(job.jobId, job);
          const key = latestJobKey(job.plateId, job.day);
          const existingLatest = this.jobs.get(this.latestByPlate.get(key));
          if (!existingLatest || String(job.createdAt || job.updatedAt || '') >= String(existingLatest.createdAt || existingLatest.updatedAt || '')) {
            this.latestByPlate.set(key, job.jobId);
          }
          if (unfinished) {
            if (job.status === 'queued' && !this.queue.includes(job.jobId)) this.queue.push(job.jobId);
            this.persistJob(job);
          }
          restored += 1;
        }
      }
      this.persistence.restoredJobs = restored;
      this.persistence.lastPersistError = '';
    } catch (err) {
      this.persistence.lastPersistError = err?.message || String(err);
    }
  }

  cleanupPersistedJobs() {
    if (!this.persistence.enabled) return;
    try {
      if (!fs.existsSync(this.persistDir)) return;
      const cutoff = Date.now() - this.persistDays * 24 * 60 * 60 * 1000;
      for (const entry of fs.readdirSync(this.persistDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || !isIsoDay(entry.name)) continue;
        const dayMs = Date.parse(`${entry.name}T00:00:00Z`);
        if (Number.isFinite(dayMs) && dayMs < cutoff) {
          fs.rmSync(path.join(this.persistDir, entry.name), { recursive: true, force: true });
        }
      }
    } catch (err) {
      this.persistence.lastPersistError = err?.message || String(err);
    }
  }

  start(payload = {}) {
    const lastSeenMs = this.worker.lastSeenAt ? Date.parse(this.worker.lastSeenAt) : 0;
    const workerOnline = !!lastSeenMs && Date.now() - lastSeenMs < 45000;
    const sortSnapshotAt = payload.sortSnapshotAt || new Date().toISOString();
    const limitStocks = Math.max(0, Math.floor(Number(payload.limitStocks || payload.maxStocks || 0)));
    const rawStocks = Array.isArray(payload.stocks) ? payload.stocks : [];
    const normalizedStocks = rawStocks
      .map((stock, index) => normalizeStock(stock, index))
      .filter(Boolean);
    // 优先扫描股票列表(SD v1 第5条,评审修正):先"优先组+普通组"分组排序,再统一截断——
    // 保证截断范围外的优先股不被丢弃;组内均保持涨幅序。job.priorityCodes 只记录最终任务中真实存在的代码。
    const prioritySet = new Set((Array.isArray(payload.priorityCodes) ? payload.priorityCodes : [])
      .map(code => String(code || '').trim()).filter(Boolean));
    const sortedAll = normalizedStocks
      .sort((a, b) => {
        const ag = Number.isFinite(a.gainPct) ? a.gainPct : -Infinity;
        const bg = Number.isFinite(b.gainPct) ? b.gainPct : -Infinity;
        return bg - ag || a.sourceIndex - b.sourceIndex || a.code.localeCompare(b.code);
      });
    const grouped = prioritySet.size
      ? [...sortedAll.filter(st => prioritySet.has(st.code)), ...sortedAll.filter(st => !prioritySet.has(st.code))]
      : sortedAll;
    const stocks = grouped
      .slice(0, limitStocks > 0 ? limitStocks : undefined)
      .map((stock, index) => ({
        ...stock,
        priceAsOf: stock.price != null ? (stock.priceAsOf || sortSnapshotAt) : '',
        rank: index + 1,
        batch: Math.floor(index / this.batchSize) + 1,
      }));
    const effectivePriorityCodes = stocks.filter(st => prioritySet.has(st.code)).map(st => st.code);
    const id = crypto.randomBytes(8).toString('hex');
    const excludedStockCount = rawStocks.length - normalizedStocks.length;
    const job = {
      jobId: id,
      plateId: String(payload.plateId || ''),
      boardName: String(payload.boardName || ''),
      day: String(payload.day || ''),
      trigger: String(payload.trigger || 'manual'),
      familyKey: String(payload.familyKey || ''),
      scanChannel: String(payload.scanChannel || ''),
      zsType: payload.zsType ?? null,
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
      sortSnapshotAt,
      sortBy: '实时涨幅快照',
      total: stocks.length,
      priorityCodes: effectivePriorityCodes,
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
    this.persistJob(job);
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
      job.workerVersion = this.worker.version || '';
      this.persistJob(job);
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
    if (body.version) {
      this.worker.version = String(body.version);
      job.workerVersion = String(body.version);
    }
    if (Array.isArray(body.results)) {
      const threshold = Number(job.threshold || 1.5);
      const minAmount = PICK_SIGNAL_MIN_AMOUNT;
      const stockByCode = new Map(job.stocks.map(stock => [String(stock?.code || ''), stock]));
      const withSignals = body.results.map(row => {
        const code = String(row?.code || row?.dm || row?.symbol || '').replace(/\D/g, '').slice(0, 6);
        const taskStock = stockByCode.get(code);
        const workerPrice = numOrNull(row?.price ?? row?.close ?? row?.lastPrice);
        const taskPrice = numOrNull(taskStock?.price);
        const enriched = { ...row };
        if (workerPrice != null && workerPrice > 0) {
          enriched.price = workerPrice;
          enriched.priceSource = String(row?.priceSource || 'worker-result');
          enriched.priceAsOf = String(row?.priceAsOf || row?.asOf || body?.asOf || job.updatedAt);
        } else if (taskPrice != null && taskPrice > 0) {
          enriched.price = taskPrice;
          enriched.priceSource = String(taskStock?.priceSource || 'task-realtime-snapshot');
          enriched.priceAsOf = String(taskStock?.priceAsOf || job.sortSnapshotAt);
        }
        return addPickSignals(enriched, threshold, minAmount);
      });
      if (withSignals.length && !job.firstResultAt) job.firstResultAt = job.updatedAt;
      job.metrics = {
        resultRows: withSignals.length,
        rowsWithPrice: withSignals.filter(r => Number(r?.price ?? r?.close ?? r?.lastPrice) > 0).length,   // 与策略取价口径一致(price ?? close ?? lastPrice)
        rowsWithAllBuckets: withSignals.filter(r => DEFAULT_THRESHOLDS.every(t => {
          const b = r?.thresholds?.[String(t)];
          return b && ['activeBuy', 'activeSell', 'passiveBuy', 'passiveSell']
            .every(k => Number.isFinite(Number(b[k])) && b[k] !== null && b[k] !== '');
        })).length,
      };
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
    this.persistJob(job, { sample: Array.isArray(body.results) });
    return { ok: true, job: publicJob(job) };
  }
}

function createLocalL2TaskQueue(options = {}) {
  return new LocalL2TaskQueue(options);
}

module.exports = { createLocalL2TaskQueue, DEFAULT_THRESHOLDS, isExcludedL2StockCode };
