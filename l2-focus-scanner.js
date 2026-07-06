'use strict';

const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_HOST = 'lv2.base32.cn';
const DEFAULT_PORT = 1883;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_SCAN_MS = 45000;
const DEFAULT_MIN_AMOUNT = 500000;
const DEFAULT_MAX_SUBSCRIBE_PER_MINUTE = 3;
const DETAIL_MIN_AMOUNT = 500000;
const SUMMARY_THRESHOLDS = [500000, 5000000];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function numOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCode(code) {
  const match = String(code || '').trim().match(/\d{6}/);
  return match ? match[0] : '';
}

function stockName(stock) {
  return String(stock?.name || stock?.mc || stock?.stockName || '').trim();
}

function stockGain(stock) {
  return numOrNull(stock?.gainPct ?? stock?.gain ?? stock?.todayGain ?? stock?.zf ?? stock?.changePct);
}

function normalizeStock(stock, index = 0) {
  const code = normalizeCode(stock?.code ?? stock?.dm ?? stock?.stockCode ?? stock);
  if (!code) return null;
  return {
    code,
    name: stockName(stock),
    gainPct: stockGain(stock),
    sourceIndex: index,
  };
}

function fixed(n, digits = 2) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const m = 10 ** digits;
  return Math.round(v * m) / m;
}

function loadMqtt() {
  try {
    return require('mqtt');
  } catch {
    return null;
  }
}

async function readJsonIfExists(file) {
  try {
    return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  } catch {
    return null;
  }
}

async function loadConfig(baseDir) {
  const fileConfig = await readJsonIfExists(path.join(baseDir || __dirname, 'panda-l2-config.json'));
  const env = process.env;
  const cfg = {
    host: env.PANDA_L2_HOST || fileConfig?.host || fileConfig?.broker || DEFAULT_HOST,
    port: Number(env.PANDA_L2_PORT || fileConfig?.port || DEFAULT_PORT),
    username: env.PANDA_L2_USERNAME || fileConfig?.username || fileConfig?.user || '',
    password: env.PANDA_L2_PASSWORD || fileConfig?.password || fileConfig?.pass || '',
    clientId: env.PANDA_L2_CLIENT_ID || fileConfig?.clientId || fileConfig?.client_id || fileConfig?.username || '',
    batchSize: Number(env.PANDA_L2_BATCH_SIZE || fileConfig?.batchSize || DEFAULT_BATCH_SIZE),
    scanMs: Number(env.PANDA_L2_SCAN_MS || fileConfig?.scanMs || DEFAULT_SCAN_MS),
    minAmount: Number(env.PANDA_L2_MIN_AMOUNT || fileConfig?.minAmount || DEFAULT_MIN_AMOUNT),
    maxSubscribePerMinute: Number(env.PANDA_L2_MAX_SUBSCRIBE_PER_MINUTE || fileConfig?.maxSubscribePerMinute || DEFAULT_MAX_SUBSCRIBE_PER_MINUTE),
    cleanSession: env.PANDA_L2_CLEAN_SESSION
      ? env.PANDA_L2_CLEAN_SESSION !== '0'
      : fileConfig?.cleanSession !== false,
    protocol: env.PANDA_L2_PROTOCOL || fileConfig?.protocol || 'mqtt',
  };
  cfg.clientId = cfg.clientId || cfg.username;
  cfg.batchSize = Math.max(1, Math.min(50, Number.isFinite(cfg.batchSize) ? cfg.batchSize : DEFAULT_BATCH_SIZE));
  cfg.scanMs = Math.max(5000, Math.min(180000, Number.isFinite(cfg.scanMs) ? cfg.scanMs : DEFAULT_SCAN_MS));
  cfg.minAmount = Math.max(1, Number.isFinite(cfg.minAmount) ? cfg.minAmount : DEFAULT_MIN_AMOUNT);
  cfg.maxSubscribePerMinute = Math.max(1, Math.min(3, Number.isFinite(cfg.maxSubscribePerMinute) ? cfg.maxSubscribePerMinute : DEFAULT_MAX_SUBSCRIBE_PER_MINUTE));
  return cfg;
}

function maskConfig(cfg) {
  return {
    host: cfg.host,
    port: cfg.port,
    clientId: cfg.clientId ? `${String(cfg.clientId).slice(0, 3)}***` : '',
    batchSize: cfg.batchSize,
    scanMs: cfg.scanMs,
    minAmount: cfg.minAmount,
    maxSubscribePerMinute: cfg.maxSubscribePerMinute,
    cleanSession: cfg.cleanSession !== false,
    configured: !!(cfg.username && cfg.password && cfg.clientId),
  };
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
  }
  return undefined;
}

function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function normalizePrice(value) {
  const raw = toNumber(value);
  if (!raw) return 0;
  return Math.abs(raw) > 1000 ? raw / 10000 : raw;
}

function amountFromTrade(row) {
  const explicit = toNumber(pick(row, [
    'amount', 'amt', 'turnover', 'tradeAmount', 'money',
    '成交额', '成交金额',
  ]));
  if (explicit > 0) return explicit;
  const price = normalizePrice(pick(row, ['price', 'tradePrice', 'lastPrice', '成交价', '价格']));
  const volume = toNumber(pick(row, ['volume', 'vol', 'tradeVolume', 'qty', '成交量', '数量']));
  if (!price || !volume) return 0;
  return price * volume;
}

function directionFromTrade(row) {
  const raw = pick(row, [
    'bs', 'BS', 'side', 'direction', 'dir', 'tradeFlag', 'tradeType', 'type',
    '买卖方向', '方向', '性质',
  ]);
  const text = String(raw == null ? '' : raw).trim().toLowerCase();
  if (!text) return 'unknown';
  if (text === 'c' || text.includes('cancel') || text.includes('撤')) return 'cancel';
  if (text === '1' || text === '66' || text === 'b' || text.includes('buy') || text.includes('bid') || text.includes('买')) return 'buy';
  if (text === '2' || text === '83' || text === 's' || text.includes('sell') || text.includes('ask') || text.includes('卖')) return 'sell';
  return 'unknown';
}

function parsePayload(payload) {
  const text = Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload || '');
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.data)) return parsed.data;
    if (Array.isArray(parsed?.list)) return parsed.list;
    if (Array.isArray(parsed?.rows)) return parsed.rows;
    if (parsed && typeof parsed === 'object') return [parsed];
  } catch {
    // Some providers send CSV-like payloads. Keep a minimal fallback for probing.
  }

  const parts = trimmed.split(/[,|\t]/).map(item => item.trim());
  if (parts.length >= 8 && /\d{6}\.(SH|SZ)$/i.test(parts[0])) {
    const price = normalizePrice(parts[4]);
    const volume = toNumber(parts[5]);
    return [{
      code: parts[0],
      direction: parts[1],
      time: parts[2],
      seq: parts[3],
      price: parts[4],
      volume: parts[5],
      amount: price > 0 && volume > 0 ? price * volume : 0,
      buyNo: parts[6],
      sellNo: parts[7],
      raw: trimmed,
    }];
  }
  if (parts.length >= 4) {
    return [{
      time: parts[0],
      price: parts[1],
      volume: parts[2],
      amount: parts[3],
      direction: parts[4] || '',
      raw: trimmed,
    }];
  }
  return [{ raw: trimmed }];
}

function emptyStats(stock) {
  return {
    code: stock.code,
    name: stock.name || '',
    rank: stock.rank,
    batch: stock.batch,
    gainPct: stock.gainPct,
    activeBuy: 0,
    passiveBuy: 0,
    activeSell: 0,
    passiveSell: 0,
    netActive: 0,
    unknownAmount: 0,
    ratio: null,
    largeTradeCount: 0,
    activeBuyCount: 0,
    activeSellCount: 0,
    passiveBuyCount: 0,
    passiveSellCount: 0,
    ignoredTradeCount: 0,
    cancelCount: 0,
    tradeCount: 0,
    messageCount: 0,
    l2Rows: 0,
    thresholds: {},
    _activeBuyOrders: new Map(),
    _activeSellOrders: new Map(),
    _passiveBuyOrders: new Map(),
    _passiveSellOrders: new Map(),
  };
}

function addOrderAmount(map, orderNo, amount) {
  const key = String(orderNo || '').trim();
  if (!key || key === '0' || amount <= 0) return;
  map.set(key, (map.get(key) || 0) + amount);
}

function applyTrade(stats, row, minAmount) {
  const dir = directionFromTrade(row);
  if (dir === 'cancel') {
    stats.cancelCount += 1;
    return;
  }
  const amount = amountFromTrade(row);
  stats.tradeCount += 1;
  if (amount <= 0) {
    stats.unknownAmount += 0;
    return;
  }
  if (dir === 'buy') {
    addOrderAmount(stats._activeBuyOrders, row.buyNo, amount);
    addOrderAmount(stats._passiveSellOrders, row.sellNo, amount);
  } else if (dir === 'sell') {
    addOrderAmount(stats._activeSellOrders, row.sellNo, amount);
    addOrderAmount(stats._passiveBuyOrders, row.buyNo, amount);
  } else {
    stats.unknownAmount += amount;
  }
}

function summarizeOrderMap(map, threshold) {
  const summary = { amount: 0, count: 0 };
  for (const amount of (map || new Map()).values()) {
    if (amount >= threshold) {
      summary.amount += amount;
      summary.count += 1;
    }
  }
  summary.amount = Math.round(summary.amount);
  return summary;
}

function summarizeThreshold(stats, threshold) {
  const activeBuy = summarizeOrderMap(stats._activeBuyOrders, threshold);
  const passiveBuy = summarizeOrderMap(stats._passiveBuyOrders, threshold);
  const activeSell = summarizeOrderMap(stats._activeSellOrders, threshold);
  const passiveSell = summarizeOrderMap(stats._passiveSellOrders, threshold);
  const summary = {
    minAmount: threshold,
    activeBuy: activeBuy.amount,
    passiveBuy: passiveBuy.amount,
    activeSell: activeSell.amount,
    passiveSell: passiveSell.amount,
    activeBuyCount: activeBuy.count,
    passiveBuyCount: passiveBuy.count,
    activeSellCount: activeSell.count,
    passiveSellCount: passiveSell.count,
  };
  return summary;
}

function finishStats(stats, minAmount = DEFAULT_MIN_AMOUNT) {
  stats.thresholds = {};
  for (const threshold of [...new Set([minAmount, ...SUMMARY_THRESHOLDS])].sort((a, b) => a - b)) {
    stats.thresholds[String(threshold)] = summarizeThreshold(stats, threshold);
  }
  const selectedSummary = stats.thresholds[String(minAmount)] || summarizeThreshold(stats, minAmount);
  stats.activeBuy = selectedSummary.activeBuy;
  stats.passiveBuy = selectedSummary.passiveBuy;
  stats.activeSell = selectedSummary.activeSell;
  stats.passiveSell = selectedSummary.passiveSell;
  stats.activeBuyCount = selectedSummary.activeBuyCount;
  stats.passiveBuyCount = selectedSummary.passiveBuyCount;
  stats.activeSellCount = selectedSummary.activeSellCount;
  stats.passiveSellCount = selectedSummary.passiveSellCount;
  stats.largeTradeCount = selectedSummary.activeBuyCount + selectedSummary.activeSellCount;
  stats.unknownAmount = Math.round(stats.unknownAmount);
  stats.netActive = stats.activeBuy - stats.activeSell;
  stats.ratio = stats.activeSell > 0 ? fixed(stats.activeBuy / stats.activeSell, 2) : (stats.activeBuy > 0 ? null : 0);
  delete stats._activeBuyOrders;
  delete stats._activeSellOrders;
  delete stats._passiveBuyOrders;
  delete stats._passiveSellOrders;
  return stats;
}

function addPickSignals(row, threshold) {
  const activeRatio = row.activeSell > 0
    ? row.activeBuy / Math.max(1, row.activeSell)
    : (row.activeBuy > 0 ? Infinity : 0);
  const passiveRatio = row.passiveSell > 0
    ? row.passiveBuy / Math.max(1, row.passiveSell)
    : (row.passiveBuy > 0 ? Infinity : 0);
  const buySupport = row.activeBuy + row.passiveBuy;
  const sellPressure = row.activeSell + row.passiveSell;
  const supportRatio = sellPressure > 0
    ? buySupport / Math.max(1, sellPressure)
    : (buySupport > 0 ? Infinity : 0);
  const pickReason = activeRatio >= threshold
    ? 'active-buy'
    : (passiveRatio >= threshold ? 'passive-buy' : '');
  return {
    ...row,
    activeRatio: Number.isFinite(activeRatio) ? fixed(activeRatio, 2) : null,
    passiveRatio: Number.isFinite(passiveRatio) ? fixed(passiveRatio, 2) : null,
    supportRatio: Number.isFinite(supportRatio) ? fixed(supportRatio, 2) : null,
    buySupport: Math.round(buySupport),
    sellPressure: Math.round(sellPressure),
    pickReason,
  };
}

function publicJob(job) {
  const safe = { ...job };
  delete safe._resolve;
  delete safe._reject;
  delete safe._promise;
  return safe;
}

class L2FocusScanner {
  constructor(options = {}) {
    this.baseDir = options.baseDir || __dirname;
    this.jobs = new Map();
    this.queue = [];
    this.running = false;
    this.subscribeMarks = [];
  }

  async status() {
    const cfg = await loadConfig(this.baseDir);
    const mqtt = loadMqtt();
    return {
      available: !!mqtt && !!(cfg.username && cfg.password && cfg.clientId),
      dependencyReady: !!mqtt,
      configured: !!(cfg.username && cfg.password && cfg.clientId),
      config: maskConfig(cfg),
    };
  }

  start(payload = {}) {
    const stocks = (payload.stocks || [])
      .map(normalizeStock)
      .filter(Boolean)
      .sort((a, b) => {
        const ag = Number.isFinite(a.gainPct) ? a.gainPct : -Infinity;
        const bg = Number.isFinite(b.gainPct) ? b.gainPct : -Infinity;
        return bg - ag || a.sourceIndex - b.sourceIndex || a.code.localeCompare(b.code);
      })
      .map((stock, index) => ({ ...stock, rank: index + 1, batch: Math.floor(index / DEFAULT_BATCH_SIZE) + 1 }));
    const id = crypto.randomBytes(8).toString('hex');
    const job = {
      jobId: id,
      plateId: String(payload.plateId || ''),
      boardName: String(payload.boardName || ''),
      day: String(payload.day || ''),
      status: 'queued',
      available: true,
      note: '',
      createdAt: new Date().toISOString(),
      startedAt: '',
      endedAt: '',
      sortSnapshotAt: payload.sortSnapshotAt || new Date().toISOString(),
      sortBy: 'L1实时涨幅快照',
      total: stocks.length,
      scanned: 0,
      batchSize: DEFAULT_BATCH_SIZE,
      currentBatch: 0,
      batchCount: Math.ceil(stocks.length / DEFAULT_BATCH_SIZE),
      minAmount: Number(payload.minAmount || DEFAULT_MIN_AMOUNT),
      threshold: Number(payload.threshold || 1.5),
      stocks,
      batches: [],
      picked: [],
      results: [],
      error: '',
    };
    this.jobs.set(id, job);
    this.queue.push(job);
    this.pump().catch(err => {
      job.status = 'error';
      job.error = err.message;
      job.endedAt = new Date().toISOString();
    });
    return publicJob(job);
  }

  get(jobId) {
    const job = this.jobs.get(String(jobId || ''));
    return job ? publicJob(job) : null;
  }

  async pump() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length) {
        const job = this.queue.shift();
        await this.runJob(job);
      }
    } finally {
      this.running = false;
    }
  }

  async waitForSubscribeSlot(maxPerMinute) {
    const now = Date.now();
    this.subscribeMarks = this.subscribeMarks.filter(t => now - t < 60000);
    if (this.subscribeMarks.length >= maxPerMinute) {
      const wait = 60000 - (now - this.subscribeMarks[0]) + 250;
      await sleep(Math.max(0, wait));
    }
    this.subscribeMarks.push(Date.now());
  }

  async runJob(job) {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    const cfg = await loadConfig(this.baseDir);
    const mqtt = loadMqtt();
    job.config = maskConfig(cfg);
    if (!mqtt) {
      job.status = 'done';
      job.available = false;
      job.note = 'L2 MQTT客户端未安装';
      job.endedAt = new Date().toISOString();
      return;
    }
    if (!cfg.username || !cfg.password || !cfg.clientId) {
      job.status = 'done';
      job.available = false;
      job.note = 'L2账号未配置';
      job.endedAt = new Date().toISOString();
      return;
    }
    if (!job.stocks.length) {
      job.status = 'done';
      job.note = '板块没有可扫描成分股';
      job.endedAt = new Date().toISOString();
      return;
    }
    job.batchSize = cfg.batchSize;
    job.minAmount = Number(job.minAmount || cfg.minAmount || DEFAULT_MIN_AMOUNT);
    const chunks = [];
    for (let i = 0; i < job.stocks.length; i += cfg.batchSize) {
      chunks.push(job.stocks.slice(i, i + cfg.batchSize).map(stock => ({
        ...stock,
        batch: Math.floor(i / cfg.batchSize) + 1,
      })));
    }
    job.batchCount = chunks.length;
    const allStats = [];
    for (let i = 0; i < chunks.length; i += 1) {
      job.currentBatch = i + 1;
      job.note = `正在扫描第${i + 1}批`;
      await this.waitForSubscribeSlot(cfg.maxSubscribePerMinute);
      const batch = await this.runChunk(mqtt, cfg, chunks[i], job);
      job.batches.push(batch);
      allStats.push(...batch.results);
      job.results = allStats.slice();
      job.scanned = allStats.length;
    }
    const threshold = Number(job.threshold || 1.5);
    const withSignals = allStats.map(row => addPickSignals(row, threshold));
    job.results = withSignals.slice();
    job.picked = withSignals
      .filter(row => row.pickReason)
      .sort((a, b) => b.buySupport - a.buySupport || b.netActive - a.netActive || b.activeBuy - a.activeBuy || a.rank - b.rank);
    job.status = 'done';
    job.note = 'L2扫描完成';
    job.endedAt = new Date().toISOString();
  }

  runChunk(mqtt, cfg, stocks, job) {
    return new Promise((resolve) => {
      const batchNo = stocks[0]?.batch || job.currentBatch || 1;
      const startedAt = new Date().toISOString();
      const topics = stocks.map(stock => `trans/${stock.code}`);
      const byCode = new Map(stocks.map(stock => [stock.code, emptyStats(stock)]));
      let client = null;
      let settled = false;
      let subscribedAt = '';
      let error = '';
      const done = () => {
        if (settled) return;
        settled = true;
        const endedAt = new Date().toISOString();
        try {
          if (client) client.end(true);
        } catch {}
        const results = stocks.map(stock => finishStats(byCode.get(stock.code) || emptyStats(stock), job.minAmount));
        resolve({
          batch: batchNo,
          fromRank: stocks[0]?.rank || 0,
          toRank: stocks[stocks.length - 1]?.rank || 0,
          size: stocks.length,
          topics,
          startedAt,
          subscribedAt,
          endedAt,
          cleanSession: cfg.cleanSession !== false,
          error,
          results,
        });
      };
      const timer = setTimeout(done, cfg.scanMs);
      try {
        client = mqtt.connect(`${cfg.protocol}://${cfg.host}:${cfg.port}`, {
          clientId: cfg.clientId,
          username: cfg.username,
          password: cfg.password,
          clean: cfg.cleanSession !== false,
          reconnectPeriod: 0,
          connectTimeout: 15000,
          keepalive: 30,
        });
        client.on('connect', () => {
          subscribedAt = new Date().toISOString();
          client.subscribe(topics, { qos: 0 }, (err) => {
            if (err) {
              error = err.message || String(err);
              clearTimeout(timer);
              done();
            }
          });
        });
        client.on('message', (topic, payload) => {
          const code = normalizeCode(String(topic || '').split('/').pop());
          const stats = byCode.get(code);
          if (!stats) return;
          stats.messageCount += 1;
          const rows = parsePayload(payload);
          stats.l2Rows += rows.length;
          for (const row of rows) applyTrade(stats, row, job.minAmount);
        });
        client.on('error', (err) => {
          error = err?.message || String(err || '');
          clearTimeout(timer);
          done();
        });
        client.on('close', () => {
          if (!settled && !subscribedAt) {
            error = error || 'L2连接关闭';
            clearTimeout(timer);
            done();
          }
        });
      } catch (err) {
        error = err?.message || String(err || '');
        clearTimeout(timer);
        done();
      }
    });
  }
}

function createL2FocusScanner(options = {}) {
  return new L2FocusScanner(options);
}

module.exports = {
  createL2FocusScanner,
  normalizeCode,
};
