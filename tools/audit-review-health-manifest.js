#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const {
  REVIEW_HEALTH_MANIFEST_RULE_VERSION,
  buildLegacyReviewHealthProjection,
  buildReviewHealthManifest,
  compareReviewHealthProjection,
  isExcludedReviewStock,
} = require('../review-source-health-manifest');

const SOURCE_PATHS = [
  { group: 'kaipanla', label: '复盘啦', directory: 'kaipanla-fupanla' },
  { group: 'jiuyangongshe', label: '韭研', directory: 'jiuyangongshe-structured' },
  { group: 'xuangubao', label: '选股宝', directory: 'xuangubao-limit-up' },
  { group: 'tgb', label: '淘股吧', directory: 'tgb-hunan-structured' },
];
const CLOSED_RANGES_2026 = [
  ['2026-01-01', '2026-01-03'],
  ['2026-02-15', '2026-02-23'],
  ['2026-04-04', '2026-04-06'],
  ['2026-05-01', '2026-05-05'],
  ['2026-06-19', '2026-06-21'],
  ['2026-09-25', '2026-09-27'],
  ['2026-10-01', '2026-10-07'],
];

function argValue(name, fallback = '') {
  const prefix = `--${name}=`;
  const found = process.argv.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function normalizeDay(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 8
    ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    : '';
}

function chinaNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const value = type => parts.find(part => part.type === type)?.value || '';
  return {
    day: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour') || 0),
  };
}

function isTradingDay(day) {
  const parsed = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return false;
  const weekday = parsed.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  return !CLOSED_RANGES_2026.some(([start, end]) => day >= start && day <= end);
}

function afterMarketClose(day) {
  const now = chinaNow();
  return day < now.day || (day === now.day && now.hour >= 15);
}

async function readObservation(root, relativeFile) {
  const filePath = path.join(root, relativeFile);
  try {
    const [body, stat] = await Promise.all([
      fs.readFile(filePath, 'utf8'),
      fs.stat(filePath),
    ]);
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return {
        exists: true,
        payload: null,
        error: 'invalid JSON',
        file: relativeFile.replace(/\\/g, '/'),
        byteSize: Number(stat.size || Buffer.byteLength(body)),
        modifiedAt: stat.mtime.toISOString(),
        contentHash: crypto.createHash('sha256').update(body).digest('hex'),
      };
    }
    return {
      exists: true,
      payload,
      error: '',
      file: relativeFile.replace(/\\/g, '/'),
      byteSize: Number(stat.size || Buffer.byteLength(body)),
      modifiedAt: stat.mtime.toISOString(),
      contentHash: crypto.createHash('sha256').update(body).digest('hex'),
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        payload: null,
        error: '',
        file: relativeFile.replace(/\\/g, '/'),
        byteSize: 0,
        modifiedAt: '',
        contentHash: '',
      };
    }
    return {
      exists: true,
      payload: null,
      error: `${error.code || 'read-error'}: read failed`,
      file: relativeFile.replace(/\\/g, '/'),
      byteSize: 0,
      modifiedAt: '',
      contentHash: '',
    };
  }
}

function shiftDay(day, offset) {
  const parsed = new Date(`${day}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return parsed.toISOString().slice(0, 10);
}

function recentTradingDays(endDay, count) {
  const days = [];
  for (let offset = 0; offset < 120 && days.length < count; offset += 1) {
    const candidate = shiftDay(endDay, -offset);
    if (isTradingDay(candidate)) days.unshift(candidate);
  }
  return days.slice(-count);
}

async function buildDay(root, day) {
  const [terminal, combined, sources] = await Promise.all([
    readObservation(root, path.join('kpl-limitup-db', `${day}.json`)),
    readObservation(root, path.join('kpl-limitup-main-reason-db', `${day}.json`)),
    Promise.all(SOURCE_PATHS.map(async source => ({
      ...source,
      ...await readObservation(
        root,
        path.join('kpl-limitup-main-reason-sources', source.directory, `${day}.json`),
      ),
    }))),
  ]);
  const manifest = buildReviewHealthManifest({
    day,
    generatedAt: new Date().toISOString(),
    isTradingDay: isTradingDay(day),
    afterMarketClose: afterMarketClose(day),
    terminal,
    combined,
    sources,
  }, {
    excludeRow: row => isExcludedReviewStock(row?.code, row?.name),
  });
  const legacy = buildLegacyReviewHealthProjection(manifest);
  return {
    day,
    legacy,
    manifest,
    comparison: compareReviewHealthProjection(legacy, manifest),
  };
}

async function main() {
  const root = path.resolve(argValue('root', process.cwd()));
  const endDay = normalizeDay(argValue('end-day', chinaNow().day)) || chinaNow().day;
  const requestedDays = Number(argValue('days', '30'));
  const dayCount = Math.max(1, Math.min(
    30,
    Number.isFinite(requestedDays) ? Math.floor(requestedDays) : 30,
  ));
  const selectedDays = recentTradingDays(endDay, dayCount);
  const rows = [];
  for (const day of selectedDays) rows.push(await buildDay(root, day));
  const statusCounts = rows.reduce((counts, row) => {
    const status = row.manifest.status;
    counts[status] = Number(counts[status] || 0) + 1;
    return counts;
  }, {});
  const output = {
    ok: true,
    mode: 'shadow-read-only',
    writesAllowed: false,
    ruleVersion: REVIEW_HEALTH_MANIFEST_RULE_VERSION,
    rootLabel: path.basename(root),
    daySelection: 'recent-trading-days',
    endDay,
    requestedDays: dayCount,
    scanned: rows.length,
    statusCounts,
    changedStatusDays: rows.filter(row => row.comparison.statusChanged).map(row => row.day),
    changedCountDays: rows
      .filter(row => row.comparison.changedGroups.length)
      .map(row => ({ day: row.day, groups: row.comparison.changedGroups })),
    poolDifferenceDays: rows
      .filter(row => row.comparison.poolDifferenceGroups.length)
      .map(row => ({ day: row.day, groups: row.comparison.poolDifferenceGroups })),
    identityMismatchDays: rows
      .filter(row => row.comparison.identityMismatchGroups.length)
      .map(row => ({ day: row.day, groups: row.comparison.identityMismatchGroups })),
    rows,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message || String(error)}\n`);
  process.exitCode = 1;
});
