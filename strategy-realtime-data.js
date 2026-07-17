'use strict';

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const BOARD_FUND_FLOW_SCHEMA_VERSION = 1;
const STRATEGY_REALTIME_CONTEXT_SCHEMA_VERSION = 1;
const BOARD_FUND_FLOW_SOURCES = Object.freeze({
  eastmoney: Object.freeze({ source: 'eastmoney', zsType: 6, scoringRole: 'canonical' }),
  ths: Object.freeze({ source: 'ths', zsType: 5, scoringRole: 'corroborating' }),
  kpl: Object.freeze({ source: 'kpl', zsType: 7, scoringRole: 'corroborating' }),
});
const ACQUISITION_TYPES = new Set([
  'realtime',
  'snapshot-archive',
  'historical-api',
  'manual-import',
]);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isIsoDay(value) {
  return /^20\d{2}-\d{2}-\d{2}$/.test(text(value));
}

function normalizeSource(value) {
  const source = text(value).toLowerCase();
  return BOARD_FUND_FLOW_SOURCES[source] ? source : '';
}

function normalizeAcquisition(value) {
  const acquisition = text(value).toLowerCase();
  return ACQUISITION_TYPES.has(acquisition) ? acquisition : 'realtime';
}

function normalizeTimestamp(value, fallback = '') {
  const candidate = text(value || fallback);
  return Number.isFinite(Date.parse(candidate)) ? new Date(candidate).toISOString() : '';
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableJson(value)).digest('hex');
}

function boardIdentity(row) {
  return text(row?.plateId || row?.id || row?.code) || `name:${text(row?.name || row?.plateName)}`;
}

function normalizeBoardName(value) {
  return text(value)
    .normalize('NFKC')
    .replace(/[\s·•._-]+/g, '')
    .replace(/(?:概念|板块)$/u, '')
    .toLowerCase();
}

function normalizeStockCode(value) {
  const digits = text(value?.code ?? value).replace(/\D/g, '');
  return digits.length >= 6 ? digits.slice(-6) : digits;
}

function uniqueStockCodes(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeStockCode).filter(Boolean))].sort();
}

function normalizeBoardFundFlowRow(raw, input) {
  const plateId = text(raw?.plateId || raw?.id || raw?.code);
  const name = text(raw?.name || raw?.plateName);
  if (!plateId || !name) return null;
  const sourceDay = text(raw?.sourceDay || input.sourceDay);
  const asOf = normalizeTimestamp(raw?.asOf || input.asOf, input.fetchedAt);
  return {
    source: input.source,
    zsType: BOARD_FUND_FLOW_SOURCES[input.source].zsType,
    plateId,
    name,
    boardKey: normalizeBoardName(name),
    gainPct: numberOrNull(raw?.gainPct ?? raw?.gain ?? raw?.changePct),
    netInflow: numberOrNull(raw?.netInflow ?? raw?.fundFlow ?? raw?.inflow),
    netInflowMetric: text(raw?.netInflowMetric || raw?.metric || 'source-net-inflow'),
    ztCount: numberOrNull(raw?.ztCount ?? raw?.zt),
    memberCount: numberOrNull(raw?.memberCount ?? raw?.stockCount),
    sourceDay,
    asOf,
    complete: raw?.complete !== false,
    stale: raw?.stale === true,
  };
}

function factFingerprint(rows) {
  return rows.map(row => ({
    source: row.source,
    plateId: row.plateId,
    name: row.name,
    gainPct: row.gainPct,
    netInflow: row.netInflow,
    netInflowMetric: row.netInflowMetric,
    ztCount: row.ztCount,
    memberCount: row.memberCount,
  }));
}

function payloadWithoutContentHash(payload) {
  const copy = { ...payload };
  delete copy.contentHash;
  return copy;
}

function buildBoardFundFlowPayload(input = {}) {
  const day = text(input.targetDay || input.day);
  const source = normalizeSource(input.source);
  if (!isIsoDay(day)) throw new Error('board fund-flow targetDay must be YYYY-MM-DD');
  if (!source) throw new Error('unsupported board fund-flow source');

  const fetchedAt = normalizeTimestamp(input.fetchedAt, new Date().toISOString()) || new Date().toISOString();
  const asOf = normalizeTimestamp(input.asOf, fetchedAt) || fetchedAt;
  const sourceDay = text(input.sourceDay || day);
  const acquisition = normalizeAcquisition(input.acquisition);
  const reconstructed = input.reconstructed === true || acquisition === 'historical-api';
  const minExpectedRows = Math.max(1, Number(input.minExpectedRows || 1));
  const expectedRowCount = Math.max(0, Number(input.expectedRowCount || 0));
  const minCoveragePct = Math.max(0.5, Math.min(1, Number(input.minCoveragePct || 0.85)));
  const rawRows = Array.isArray(input.rows) ? input.rows : (Array.isArray(input.boards) ? input.boards : []);
  const dropped = { foreignDay: 0, unknownDay: 0, invalid: 0, duplicate: 0 };
  const byId = new Map();

  for (const raw of rawRows) {
    const row = normalizeBoardFundFlowRow(raw, { source, sourceDay, asOf, fetchedAt });
    if (!row) {
      dropped.invalid += 1;
      continue;
    }
    if (!isIsoDay(row.sourceDay)) {
      dropped.unknownDay += 1;
      continue;
    }
    if (row.sourceDay !== day) {
      dropped.foreignDay += 1;
      continue;
    }
    const key = boardIdentity(row);
    if (byId.has(key)) dropped.duplicate += 1;
    byId.set(key, row);
  }

  const rows = [...byId.values()].sort((a, b) =>
    a.plateId.localeCompare(b.plateId) || a.name.localeCompare(b.name));
  const rowMetricCount = rows.filter(row => row.gainPct != null || row.netInflow != null).length;
  const requiredRowCount = expectedRowCount
    ? Math.max(minExpectedRows, Math.ceil(expectedRowCount * minCoveragePct))
    : minExpectedRows;
  const coveragePct = expectedRowCount
    ? Number((Math.min(rows.length, expectedRowCount) / expectedRowCount * 100).toFixed(1))
    : null;
  const sourceMatchesTarget = sourceDay === day;
  const stale = input.stale === true || !sourceMatchesTarget || dropped.foreignDay > 0 || dropped.unknownDay > 0;
  const complete = input.complete !== false && !stale && rows.length >= requiredRowCount && rowMetricCount > 0;
  const payload = {
    schemaVersion: BOARD_FUND_FLOW_SCHEMA_VERSION,
    targetDay: day,
    day,
    source,
    zsType: BOARD_FUND_FLOW_SOURCES[source].zsType,
    scoringRole: BOARD_FUND_FLOW_SOURCES[source].scoringRole,
    sourceDay: sourceMatchesTarget ? day : (isIsoDay(sourceDay) ? sourceDay : null),
    sourceDayBasis: text(input.sourceDayBasis || 'payload-date'),
    asOf,
    fetchedAt,
    acquisition,
    reconstructed,
    scoreEligible: complete && !reconstructed,
    complete,
    stale,
    scope: text(input.scope || 'full-market'),
    rowCount: rows.length,
    rowMetricCount,
    minExpectedRows,
    expectedRowCount: expectedRowCount || null,
    minCoveragePct,
    requiredRowCount,
    coveragePct,
    dropped,
    rows,
    factHash: sha256(factFingerprint(rows)),
  };
  payload.contentHash = sha256(payloadWithoutContentHash(payload));
  return payload;
}

function verifyBoardFundFlowPayload(payload) {
  const errors = [];
  if (Number(payload?.schemaVersion) !== BOARD_FUND_FLOW_SCHEMA_VERSION) errors.push('unsupported-schema-version');
  if (!isIsoDay(payload?.targetDay)) errors.push('invalid-target-day');
  if (!normalizeSource(payload?.source)) errors.push('invalid-source');
  if (payload?.sourceDay !== payload?.targetDay) errors.push('source-day-mismatch');
  if (!Array.isArray(payload?.rows)) errors.push('rows-not-array');
  if (Array.isArray(payload?.rows) && payload.rows.some(row => row?.sourceDay !== payload?.targetDay)) {
    errors.push('row-source-day-mismatch');
  }
  const expectedFactHash = sha256(factFingerprint(Array.isArray(payload?.rows) ? payload.rows : []));
  if (!text(payload?.factHash) || payload.factHash !== expectedFactHash) errors.push('fact-hash-mismatch');
  const expectedHash = sha256(payloadWithoutContentHash(payload || {}));
  if (!text(payload?.contentHash) || payload.contentHash !== expectedHash) errors.push('content-hash-mismatch');
  return { ok: errors.length === 0, errors, expectedHash, expectedFactHash };
}

function defaultTradingDay(day) {
  if (!isIsoDay(day)) return false;
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

async function atomicWriteJson(file, payload) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(payload, null, 2), 'utf8');
  try {
    await fs.rename(temp, file);
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

function createBoardFundFlowStore(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, 'strategy-data', 'board-fund-flow'));
  const reconstructedRootDir = path.resolve(options.reconstructedRootDir ||
    path.join(path.dirname(rootDir), 'board-fund-flow-reconstructed'));
  const isTradingDay = options.isTradingDay || defaultTradingDay;
  const fileFor = (source, day, reconstructed = false) => {
    const normalizedSource = normalizeSource(source);
    if (!normalizedSource || !isIsoDay(day)) throw new Error('invalid board fund-flow path');
    return path.join(reconstructed ? reconstructedRootDir : rootDir, normalizedSource, `${day}.json`);
  };

  async function read(source, day, readOptions = {}) {
    const candidates = [fileFor(source, day, false)];
    if (readOptions.allowReconstructed) candidates.push(fileFor(source, day, true));
    for (const file of candidates) {
      try {
        const payload = JSON.parse(await fs.readFile(file, 'utf8'));
        const verification = verifyBoardFundFlowPayload(payload);
        return { payload, verification, file, reconstructed: file.startsWith(reconstructedRootDir) };
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    return null;
  }

  async function write(input, writeOptions = {}) {
    const payload = input?.schemaVersion === BOARD_FUND_FLOW_SCHEMA_VERSION && input?.contentHash
      ? input
      : buildBoardFundFlowPayload(input);
    if (!isTradingDay(payload.targetDay)) throw new Error(`refuse board fund-flow write on non-trading day: ${payload.targetDay}`);
    const reconstructed = writeOptions.reconstructed === true || payload.reconstructed === true;
    const file = fileFor(payload.source, payload.targetDay, reconstructed);
    const verification = verifyBoardFundFlowPayload(payload);
    if (!verification.ok) throw new Error(`invalid board fund-flow payload: ${verification.errors.join(',')}`);
    let current = null;
    try { current = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    if (current && !writeOptions.force) {
      if (current.complete === true && payload.complete !== true) {
        return { written: false, reason: 'quality-regression', payload: current, file };
      }
      const currentTime = Date.parse(current.asOf || current.fetchedAt || '');
      const nextTime = Date.parse(payload.asOf || payload.fetchedAt || '');
      if (Number.isFinite(currentTime) && Number.isFinite(nextTime) && currentTime > nextTime) {
        return { written: false, reason: 'older-as-of', payload: current, file };
      }
      if (current.contentHash === payload.contentHash) {
        return { written: false, reason: 'unchanged', payload: current, file };
      }
    }
    await atomicWriteJson(file, payload);
    return { written: true, reason: 'updated', payload, file };
  }

  async function listDays(source, listOptions = {}) {
    const dir = path.dirname(fileFor(source, '2000-01-03', listOptions.reconstructed === true));
    try {
      return (await fs.readdir(dir))
        .map(file => (/^(20\d{2}-\d{2}-\d{2})\.json$/.exec(file) || [])[1])
        .filter(Boolean)
        .sort();
    } catch (error) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  }

  return { rootDir, reconstructedRootDir, fileFor, read, write, listDays };
}

function sourceFactStatus(source, readResult) {
  const payload = readResult?.payload || readResult || null;
  const verification = readResult?.verification || (payload ? verifyBoardFundFlowPayload(payload) : null);
  return {
    source,
    available: !!payload,
    verified: !!verification?.ok,
    complete: !!(payload?.complete && verification?.ok),
    stale: payload ? payload.stale === true : null,
    reconstructed: !!payload?.reconstructed,
    scoreEligible: !!(payload?.scoreEligible && verification?.ok),
    sourceDay: payload?.sourceDay || null,
    asOf: payload?.asOf || null,
    rowCount: Number(payload?.rowCount || 0),
    expectedRowCount: numberOrNull(payload?.expectedRowCount),
    coveragePct: numberOrNull(payload?.coveragePct),
    metricFamilies: [...new Set((payload?.rows || []).map(row => text(row?.netInflowMetric)).filter(Boolean))].sort(),
    errors: verification?.errors || [],
  };
}

function signOf(value) {
  const number = numberOrNull(value);
  if (number == null || number === 0) return 0;
  return number > 0 ? 1 : -1;
}

function buildStrategyRealtimeContext(input = {}) {
  const day = text(input.day || input.targetDay);
  if (!isIsoDay(day)) throw new Error('strategy realtime context day must be YYYY-MM-DD');
  const rawFacts = input.sourceFacts || {};
  const facts = {};
  const sourceStatus = {};
  for (const source of Object.keys(BOARD_FUND_FLOW_SOURCES)) {
    const result = Array.isArray(rawFacts)
      ? rawFacts.find(item => (item?.payload || item)?.source === source)
      : rawFacts[source];
    const payload = result?.payload || result || null;
    sourceStatus[source] = sourceFactStatus(source, result);
    facts[source] = sourceStatus[source].verified ? payload : null;
  }

  const aliases = input.boardAliases && typeof input.boardAliases === 'object' ? input.boardAliases : {};
  const boardKey = row => normalizeBoardName(aliases[`${row.source}:${row.plateId}`] || aliases[row.name] || row.name);
  const rowsBySourceKey = {};
  for (const source of Object.keys(BOARD_FUND_FLOW_SOURCES)) {
    const map = new Map();
    for (const row of (facts[source]?.rows || [])) map.set(boardKey(row), row);
    rowsBySourceKey[source] = map;
  }

  const canonicalFact = facts.eastmoney;
  const canonicalBoards = (canonicalFact?.rows || []).map(row => {
    const key = boardKey(row);
    const sourceMetrics = {};
    const signs = [];
    for (const source of Object.keys(BOARD_FUND_FLOW_SOURCES)) {
      const match = rowsBySourceKey[source].get(key) || null;
      sourceMetrics[source] = match ? {
        plateId: match.plateId,
        name: match.name,
        gainPct: match.gainPct,
        netInflow: match.netInflow,
        netInflowMetric: match.netInflowMetric,
        ztCount: match.ztCount,
        asOf: match.asOf,
      } : null;
      const sign = signOf(match?.netInflow);
      if (sign) signs.push({ source, sign });
    }
    const positive = signs.filter(item => item.sign > 0).map(item => item.source);
    const negative = signs.filter(item => item.sign < 0).map(item => item.source);
    return {
      boardKey: key,
      plateId: row.plateId,
      name: row.name,
      canonicalSource: 'eastmoney',
      gainPct: row.gainPct,
      netInflow: row.netInflow,
      netInflowMetric: row.netInflowMetric,
      ztCount: row.ztCount,
      sourceMetrics,
      agreement: {
        observedSourceCount: signs.length,
        direction: !signs.length ? 'unknown'
          : (positive.length === signs.length ? 'positive'
            : (negative.length === signs.length ? 'negative' : 'mixed')),
        positiveSources: positive,
        negativeSources: negative,
      },
    };
  });

  const limitUpStocks = Array.isArray(input.limitUpStocks) ? input.limitUpStocks : [];
  const mainReasonStocks = Array.isArray(input.mainReasonStocks) ? input.mainReasonStocks : [];
  const closeStocks = Array.isArray(input.closeStocks) ? input.closeStocks : [];
  const l2Jobs = Array.isArray(input.l2Jobs) ? input.l2Jobs : [];
  const candidateMainlines = Array.isArray(input.candidateMainlines) ? input.candidateMainlines : [];
  const limitCodes = new Set(limitUpStocks.map(row => normalizeStockCode(row)).filter(Boolean));
  const reasonCodes = new Set(mainReasonStocks.map(row => normalizeStockCode(row)).filter(Boolean));
  const closeCodes = new Set(closeStocks.map(row => normalizeStockCode(row)).filter(Boolean));
  const missingReasonCodes = [...limitCodes].filter(code => !reasonCodes.has(code));
  const membersByBoard = input.membersByBoard && typeof input.membersByBoard === 'object' ? input.membersByBoard : {};
  const l2ByPlate = new Map();
  for (const job of l2Jobs) {
    const plateId = text(job?.plateId);
    if (!plateId) continue;
    if (!l2ByPlate.has(plateId)) l2ByPlate.set(plateId, []);
    l2ByPlate.get(plateId).push(job);
  }
  const boardEvidence = Object.fromEntries(Object.entries(membersByBoard).map(([key, membership]) => {
    const codes = uniqueStockCodes(membership?.codes);
    const limitUpCodes = codes.filter(code => limitCodes.has(code));
    const mainReasonCodes = codes.filter(code => reasonCodes.has(code));
    const closeAvailableCodes = codes.filter(code => closeCodes.has(code));
    const jobs = l2ByPlate.get(text(membership?.plateId)) || [];
    return [key, {
      source: text(membership?.source),
      zsType: numberOrNull(membership?.zsType),
      plateId: text(membership?.plateId),
      name: text(membership?.name),
      memberCount: codes.length,
      memberCodes: codes,
      limitUpCount: limitUpCodes.length,
      limitUpCodes,
      mainReasonCoveragePct: codes.length ? Number((mainReasonCodes.length / codes.length * 100).toFixed(1)) : null,
      closeCoveragePct: codes.length ? Number((closeAvailableCodes.length / codes.length * 100).toFixed(1)) : null,
      l2JobCount: jobs.length,
      l2DoneJobCount: jobs.filter(job => job?.status === 'done').length,
    }];
  }));
  const evidenceStatus = {
    limitUpDb: { available: limitUpStocks.length > 0, stockCount: limitCodes.size },
    mainReasonDb: {
      available: mainReasonStocks.length > 0,
      stockCount: reasonCodes.size,
      missingLimitUpCodeCount: missingReasonCodes.length,
    },
    closeDb: { available: closeStocks.length > 0, stockCount: closeCodes.size },
    l2: {
      available: l2Jobs.length > 0,
      jobCount: l2Jobs.length,
      doneJobs: l2Jobs.filter(job => job?.status === 'done').length,
    },
    memberships: {
      mode: 'source-specific-lazy',
      suppliedBoardCount: Object.keys(membersByBoard).length,
    },
    candidateMainlines: { count: candidateMainlines.length },
  };
  const readyFor = {
    intradayRanking: sourceStatus.eastmoney.scoreEligible && !sourceStatus.eastmoney.stale,
    historicalScoring: sourceStatus.eastmoney.scoreEligible && evidenceStatus.limitUpDb.available &&
      evidenceStatus.mainReasonDb.available && evidenceStatus.closeDb.available,
    l2StarValidation: evidenceStatus.l2.available,
  };
  const missingFields = [];
  if (!readyFor.intradayRanking) missingFields.push('eastmoneyBoardFacts');
  if (!evidenceStatus.limitUpDb.available) missingFields.push('limitUpDb');
  if (!evidenceStatus.mainReasonDb.available) missingFields.push('mainReasonDb');
  if (!evidenceStatus.closeDb.available) missingFields.push('closeDb');
  if (!evidenceStatus.l2.available) missingFields.push('l2Jobs');

  return {
    schemaVersion: STRATEGY_REALTIME_CONTEXT_SCHEMA_VERSION,
    day,
    targetDay: day,
    asOf: normalizeTimestamp(input.asOf, new Date().toISOString()) || new Date().toISOString(),
    sourcePolicy: {
      scoringCanonical: 'eastmoney',
      corroborating: ['ths', 'kpl'],
      aggregation: 'never-sum-cross-source-fund-flow',
      reconstructedScoringDefault: false,
      officialV2PathChanged: false,
    },
    sourceStatus,
    boardsBySource: Object.fromEntries(Object.keys(BOARD_FUND_FLOW_SOURCES).map(source => [source, facts[source]?.rows || []])),
    canonicalBoards,
    evidenceStatus,
    readyFor,
    complete: readyFor.intradayRanking && readyFor.historicalScoring,
    partial: !(readyFor.intradayRanking && readyFor.historicalScoring && readyFor.l2StarValidation),
    missingFields,
    missingReasonCodes,
    candidateMainlines,
    membersByBoard,
    boardEvidence,
  };
}

function compactRealtimeContextQuality(context) {
  const sourceStatus = {};
  for (const source of Object.keys(BOARD_FUND_FLOW_SOURCES)) {
    const status = context?.sourceStatus?.[source] || {};
    sourceStatus[source] = {
      available: !!status.available,
      complete: !!status.complete,
      stale: status.stale === true,
      reconstructed: !!status.reconstructed,
      scoreEligible: !!status.scoreEligible,
      sourceDay: status.sourceDay || null,
      asOf: status.asOf || null,
      rowCount: Number(status.rowCount || 0),
      expectedRowCount: numberOrNull(status.expectedRowCount),
      coveragePct: numberOrNull(status.coveragePct),
    };
  }
  return {
    schemaVersion: Number(context?.schemaVersion || STRATEGY_REALTIME_CONTEXT_SCHEMA_VERSION),
    day: context?.day || null,
    asOf: context?.asOf || null,
    complete: !!context?.complete,
    partial: !!context?.partial,
    readyFor: context?.readyFor || {},
    sourceStatus,
    evidenceStatus: context?.evidenceStatus || {},
    missingFields: Array.isArray(context?.missingFields) ? context.missingFields.slice() : [],
  };
}

function parseEastmoneyHistoricalFundFlow(payload, day, board = {}) {
  const lines = Array.isArray(payload?.data?.klines) ? payload.data.klines : [];
  const line = lines.find(item => String(item).startsWith(`${day},`));
  if (!line) return null;
  const parts = String(line).split(',');
  if (parts.length < 13) return null;
  return {
    source: 'eastmoney',
    plateId: text(board.plateId || payload?.data?.code),
    name: text(board.name || payload?.data?.name),
    sourceDay: parts[0],
    gainPct: numberOrNull(parts[12]),
    netInflow: numberOrNull(parts[5]),
    netInflowMetric: 'eastmoney-super-large-net-inflow-historical',
    mainNetInflow: numberOrNull(parts[1]),
    largeNetInflow: numberOrNull(parts[4]),
    complete: true,
    stale: false,
  };
}

async function fetchEastmoneyHistoricalBoardFundFlow(board, day, options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('fetch is required for Eastmoney historical reconstruction');
  const plateId = text(board?.plateId).toUpperCase();
  if (!/^BK\d+$/.test(plateId)) throw new Error(`invalid Eastmoney plateId: ${plateId}`);
  const url = new URL('https://push2his.eastmoney.com/api/qt/stock/fflow/daykline/get');
  url.searchParams.set('lmt', String(Math.max(40, Number(options.limit || 80))));
  url.searchParams.set('klt', '101');
  url.searchParams.set('secid', `90.${plateId}`);
  url.searchParams.set('fields1', 'f1,f2,f3,f7');
  url.searchParams.set('fields2', 'f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63');
  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Referer: 'https://data.eastmoney.com/bkzj/',
    },
    signal: options.signal || AbortSignal.timeout(Number(options.timeoutMs || 12000)),
  });
  if (!response.ok) throw new Error(`Eastmoney historical fund flow ${response.status}: ${plateId}`);
  return parseEastmoneyHistoricalFundFlow(await response.json(), day, board);
}

async function mapLimit(values, concurrency, worker) {
  const list = Array.isArray(values) ? values : [];
  const out = new Array(list.length);
  let index = 0;
  async function run() {
    while (index < list.length) {
      const current = index++;
      out[current] = await worker(list[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), list.length || 1) }, run));
  return out;
}

async function reconstructEastmoneyBoardFundFlowDay(options = {}) {
  const day = text(options.day);
  if (!isIsoDay(day)) throw new Error('reconstruction day must be YYYY-MM-DD');
  const boards = (Array.isArray(options.boards) ? options.boards : [])
    .filter(board => /^BK\d+$/i.test(text(board?.plateId)) && text(board?.name));
  if (!boards.length) throw new Error('Eastmoney reconstruction requires board metadata');
  if (!options.store?.write) throw new Error('reconstruction store is required');
  const errors = [];
  const rows = (await mapLimit(boards, Number(options.concurrency || 4), async board => {
    try {
      return await fetchEastmoneyHistoricalBoardFundFlow(board, day, options);
    } catch (error) {
      errors.push({ plateId: text(board?.plateId), error: text(error?.message || error).slice(0, 160) });
      return null;
    }
  })).filter(Boolean);
  if (!rows.length) throw new Error(`no Eastmoney historical board facts found for ${day}`);
  const fetchedAt = normalizeTimestamp(options.fetchedAt, new Date().toISOString()) || new Date().toISOString();
  const payload = buildBoardFundFlowPayload({
    day,
    source: 'eastmoney',
    sourceDay: day,
    asOf: `${day}T07:00:00.000Z`,
    fetchedAt,
    acquisition: 'historical-api',
    reconstructed: true,
    scope: options.scope || 'selected-boards',
    minExpectedRows: boards.length,
    complete: rows.length === boards.length,
    rows,
  });
  const result = await options.store.write(payload, { reconstructed: true, force: options.force === true });
  return {
    ...result,
    requestedBoardCount: boards.length,
    reconstructedBoardCount: rows.length,
    errorCount: errors.length,
    errors,
  };
}

module.exports = {
  BOARD_FUND_FLOW_SCHEMA_VERSION,
  STRATEGY_REALTIME_CONTEXT_SCHEMA_VERSION,
  BOARD_FUND_FLOW_SOURCES,
  buildBoardFundFlowPayload,
  verifyBoardFundFlowPayload,
  createBoardFundFlowStore,
  buildStrategyRealtimeContext,
  compactRealtimeContextQuality,
  parseEastmoneyHistoricalFundFlow,
  fetchEastmoneyHistoricalBoardFundFlow,
  reconstructEastmoneyBoardFundFlowDay,
  normalizeBoardName,
  stableJson,
  sha256,
};
