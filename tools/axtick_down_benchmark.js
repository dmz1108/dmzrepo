#!/usr/bin/env node
'use strict';

const http = require('http');
const zlib = require('zlib');

const BASE_URL = process.env.AXTICK_DOWN_URL || 'http://down.l2api.cn:9090';
const USER = process.env.AXTICK_USER || '';
const PWD = process.env.AXTICK_PWD || '';
const STOCK = (process.env.AXTICK_STOCK || argValue('--stock') || '002185.SZ').toUpperCase();
const USE_GZIP = String(process.env.AXTICK_GZIP || argValue('--gzip') || 'false').toLowerCase() === 'true';
const SUMMARY_ONLY = process.argv.includes('--summary') || String(process.env.AXTICK_SUMMARY || '').toLowerCase() === 'true';
const THRESHOLDS = [500000, 3000000, 5000000, 8000000, 10000000];

function argValue(name) {
  const exact = process.argv.find((arg) => arg.startsWith(name + '='));
  if (exact) return exact.slice(name.length + 1);
  const idx = process.argv.indexOf(name);
  if (idx >= 0) return process.argv[idx + 1] || '';
  return '';
}

function nowMs() {
  return Number(process.hrtime.bigint() / 1000000n);
}

function requestJson(pathname, payload, headers = {}) {
  const url = new URL(pathname, BASE_URL);
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'User-Agent': 'Panda-Axtick-Benchmark/1.0',
        ...headers,
      },
      timeout: 120000,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const text = buffer.toString('utf8');
        let json = null;
        try {
          json = JSON.parse(text);
        } catch (err) {
          return reject(new Error(`JSON parse failed: ${err.message}; prefix=${text.slice(0, 200)}`));
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          bytes: buffer.length,
          json,
        });
      });
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function pickData(json) {
  const root = json && (json.Data || json.data || json);
  if (!root) return '';
  return root.data || root.Data || root.result || root.Result || '';
}

function csvTextFromResponse(json) {
  const root = json && (json.Data || json.data || json);
  let data = pickData(json);
  if (data == null) data = '';
  if (Array.isArray(data)) data = data.join('\n');
  data = String(data);
  if (!USE_GZIP) return data;
  const buffer = Buffer.from(data, 'base64');
  const unzipped = zlib.gunzipSync(buffer);
  return unzipped.toString('utf8');
}

function splitCsvLine(line) {
  return String(line || '').split(',').map((value) => value.trim());
}

function fieldIndex(header, names, fallback) {
  for (const name of names) {
    const idx = header.indexOf(name);
    if (idx >= 0) return idx;
  }
  return fallback;
}

function asNumber(value) {
  const text = String(value || '').replace(/"/g, '').trim();
  if (!text) return 0;
  const out = Number(text);
  return Number.isFinite(out) ? out : 0;
}

function normalizeSide(value) {
  const text = String(value || '').replace(/"/g, '').trim().toUpperCase();
  if (text === '1' || text === 'B' || text === 'BUY') return 'B';
  if (text === '2' || text === 'S' || text === 'SELL') return 'S';
  return '';
}

function addAmount(map, key, amount) {
  const cleanKey = String(key || '').replace(/"/g, '').trim();
  if (!cleanKey || cleanKey === '0') return;
  map.set(cleanKey, (map.get(cleanKey) || 0) + amount);
}

function sumThreshold(map, threshold) {
  let amount = 0;
  let count = 0;
  for (const value of map.values()) {
    if (value >= threshold) {
      amount += value;
      count += 1;
    }
  }
  return { amount, count };
}

function parseAndAggregate(csvText) {
  const lines = String(csvText || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { rows: 0, usedRows: 0, fields: [], thresholds: {} };

  const header = splitCsvLine(lines[0]);
  const fieldNames = {
    time: ['\u65f6\u95f4', 'business_time', 'time'],
    amount: ['\u6210\u4ea4\u91d1\u989d', 'business_amount', 'amount'],
    side: ['\u4e70\u5356\u65b9\u5411', 'business_direction', 'bs_flag', 'direction'],
    buyNo: ['\u53eb\u4e70\u65b9\u59d4\u6258\u5e8f\u53f7', '\u4e70\u65b9\u59d4\u6258\u5e8f\u53f7', 'buy_no', 'bid_order_seq'],
    sellNo: ['\u53eb\u5356\u65b9\u59d4\u6258\u5e8f\u53f7', '\u5356\u65b9\u59d4\u6258\u5e8f\u53f7', 'sell_no', 'ask_order_seq'],
  };
  const idx = {
    time: fieldIndex(header, fieldNames.time, 0),
    amount: fieldIndex(header, fieldNames.amount, 3),
    side: fieldIndex(header, fieldNames.side, 4),
    buyNo: fieldIndex(header, fieldNames.buyNo, 6),
    sellNo: fieldIndex(header, fieldNames.sellNo, 7),
  };

  const groups = {
    activeBuy: new Map(),
    activeSell: new Map(),
    passiveBuy: new Map(),
    passiveSell: new Map(),
  };
  let usedRows = 0;
  let skippedRows = 0;
  let firstTime = null;
  let lastTime = null;
  let totalAmount = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const row = splitCsvLine(lines[i]);
    const timeValue = asNumber(row[idx.time]);
    if (timeValue && timeValue < 93000000) {
      skippedRows += 1;
      continue;
    }
    const amountRaw = asNumber(row[idx.amount]);
    const amount = amountRaw / 10000;
    const side = normalizeSide(row[idx.side]);
    if (!amount || !side) {
      skippedRows += 1;
      continue;
    }
    usedRows += 1;
    totalAmount += amount;
    if (timeValue) {
      if (firstTime == null || timeValue < firstTime) firstTime = timeValue;
      if (lastTime == null || timeValue > lastTime) lastTime = timeValue;
    }

    const buyNo = row[idx.buyNo];
    const sellNo = row[idx.sellNo];
    if (side === 'B') {
      addAmount(groups.activeBuy, buyNo, amount);
      addAmount(groups.passiveSell, sellNo, amount);
    } else if (side === 'S') {
      addAmount(groups.activeSell, sellNo, amount);
      addAmount(groups.passiveBuy, buyNo, amount);
    }
  }

  const thresholds = {};
  for (const threshold of THRESHOLDS) {
    thresholds[String(threshold)] = {
      activeBuy: sumThreshold(groups.activeBuy, threshold),
      passiveBuy: sumThreshold(groups.passiveBuy, threshold),
      activeSell: sumThreshold(groups.activeSell, threshold),
      passiveSell: sumThreshold(groups.passiveSell, threshold),
    };
  }

  return {
    rows: Math.max(0, lines.length - 1),
    usedRows,
    skippedRows,
    fields: header,
    fieldIndex: idx,
    firstTime,
    lastTime,
    totalAmount,
    groupCounts: {
      activeBuy: groups.activeBuy.size,
      passiveBuy: groups.passiveBuy.size,
      activeSell: groups.activeSell.size,
      passiveSell: groups.passiveSell.size,
    },
    thresholds,
  };
}

function workerThresholdsFromAggregate(aggregate) {
  return Object.fromEntries(THRESHOLDS.map((threshold) => {
    const source = aggregate?.thresholds?.[String(threshold)] || {};
    const bucket = {};
    for (const key of ['activeBuy', 'activeSell', 'passiveBuy', 'passiveSell']) {
      bucket[key] = Math.round(Number(source?.[key]?.amount || 0));
      bucket[`${key}Count`] = Math.max(0, Math.floor(Number(source?.[key]?.count || 0)));
    }
    return [String(threshold), bucket];
  }));
}

async function main() {
  if (!USER || !PWD) {
    throw new Error('Set AXTICK_USER and AXTICK_PWD before running this benchmark.');
  }
  const started = nowMs();
  const loginStart = nowMs();
  const login = await requestJson('/Login', { userName: USER, userPwd: PWD });
  const loginMs = nowMs() - loginStart;
  const cookie = (login.headers['set-cookie'] || []).map((item) => String(item).split(';')[0]).join('; ');
  if (!cookie) throw new Error('Login did not return a cookie.');

  const fetchStart = nowMs();
  const dataResp = await requestJson('/GetData', { type: 'Tran', stock: STOCK, gzip: USE_GZIP }, { Cookie: cookie });
  const downloadMs = nowMs() - fetchStart;

  const parseStart = nowMs();
  const csvText = csvTextFromResponse(dataResp.json);
  const aggregate = parseAndAggregate(csvText);
  const parseMs = nowMs() - parseStart;

  const output = {
    ok: true,
    stock: STOCK,
    gzip: USE_GZIP,
    loginMs,
    downloadMs,
    parseMs,
    totalMs: nowMs() - started,
    responseBytes: dataResp.bytes,
    csvChars: csvText.length,
    rows: aggregate.rows,
    usedRows: aggregate.usedRows,
    skippedRows: aggregate.skippedRows,
    firstTime: aggregate.firstTime,
    lastTime: aggregate.lastTime,
    totalAmountWan: Number((aggregate.totalAmount / 10000).toFixed(2)),
    groupCounts: aggregate.groupCounts,
    thresholds: Object.fromEntries(Object.entries(aggregate.thresholds).map(([threshold, data]) => [
      threshold,
      Object.fromEntries(Object.entries(data).map(([key, value]) => [
        key,
        {
          count: value.count,
          amountWan: Number((value.amount / 10000).toFixed(2)),
        },
      ])),
    ])),
    fieldIndex: aggregate.fieldIndex,
    fields: aggregate.fields,
  };
  if (SUMMARY_ONLY) {
    delete output.thresholds;
    delete output.fieldIndex;
    delete output.fields;
    delete output.groupCounts;
  }
  console.log(JSON.stringify(output, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(1);
  });
}

module.exports = {
  THRESHOLDS,
  parseAndAggregate,
  workerThresholdsFromAggregate,
};
