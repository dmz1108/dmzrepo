const crypto = require('crypto');

const EVIDENCE_SCHEMA_VERSION = 1;
const SNAPSHOT_TABLES = ['ztList', 'zt10', 'gain10', 'gain30'];

function finiteNumber(value) {
  if (value === null || value === '' || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeEvidenceCode(value) {
  const text = String(value || '').trim().replace(/^(?:sh|sz|bj)[.:_-]?/i, '');
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 6 ? digits.slice(-6) : digits.padStart(6, '0');
}

function parseBoundedList(value, normalizer, limit) {
  const input = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  const output = [];
  for (const raw of input) {
    const item = normalizer(raw);
    if (!item || seen.has(item)) continue;
    seen.add(item);
    output.push(item);
    if (output.length >= limit) break;
  }
  return output;
}

function normalizeEvidenceCodes(value, limit = 20) {
  return parseBoundedList(value, normalizeEvidenceCode, limit);
}

function normalizeEvidenceThemes(value, limit = 12) {
  return parseBoundedList(value, item => String(item || '').trim().slice(0, 40), limit);
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]));
}

function hashEvidence(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function evidenceBundleHashInput(bundle) {
  const { integrity, ...payload } = bundle && typeof bundle === 'object' ? bundle : {};
  return payload;
}

function cleanString(value, max = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function cleanDays(value) {
  return (Array.isArray(value) ? value : [])
    .map(day => cleanString(day, 16))
    .filter(Boolean)
    .slice(0, 40);
}

function cleanScalar(value, max = 80) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return cleanString(value, max);
}

function sanitizeSnapshotRow(row) {
  if (row === null || row === undefined) return null;
  const source = row && typeof row === 'object' ? row : { code: row };
  const code = normalizeEvidenceCode(source.code ?? source.stockCode ?? source.dm);
  if (!code) return null;
  return {
    code,
    name: cleanString(source.name ?? source.stockName ?? source.mc, 80),
    gain: finiteNumber(source.gain ?? source.gainPct ?? source.zf ?? source.changePct),
    todayGain: finiteNumber(source.todayGain),
    price: finiteNumber(source.price ?? source.close),
    totalCount: finiteNumber(source.totalCount ?? source.count),
    ztCount: finiteNumber(source.ztCount),
    limitUpCount: cleanScalar(source.limitUpCount ?? source.lianban),
    firstLimitTime: cleanString(source.firstLimitTime, 20),
    days: cleanDays(source.days),
  };
}

function sanitizeSnapshotBoard(board, zsType) {
  return {
    plateId: cleanString(board?.plateId ?? board?.id ?? board?.code, 80),
    name: cleanString(board?.name ?? board?.plateName, 120),
    zsType: Number(zsType),
    memberCount: finiteNumber(board?.memberCount ?? board?.stockCount),
    gainPct: finiteNumber(board?.gainPct ?? board?.gain ?? board?.zf ?? board?.changePct),
    ztCount: finiteNumber(board?.ztCount ?? board?.zt),
    netInflow: finiteNumber(board?.netInflow ?? board?.mainInflow ?? board?.inflow),
  };
}

function buildSnapshotEvidence(payload, zsType, day, codes) {
  const codeSet = new Set(normalizeEvidenceCodes(codes));
  const boards = Array.isArray(payload?.boards) ? payload.boards : [];
  const boardById = new Map(boards.map(board => [
    cleanString(board?.plateId ?? board?.id ?? board?.code, 80),
    board,
  ]));
  const matchedCards = [];
  for (const [plateId, rawCard] of Object.entries(payload?.cardData || {})) {
    const tables = {};
    for (const table of SNAPSHOT_TABLES) {
      const rows = (Array.isArray(rawCard?.[table]) ? rawCard[table] : [])
        .map(sanitizeSnapshotRow)
        .filter(row => row && codeSet.has(row.code));
      if (rows.length) tables[table] = rows;
    }
    if (!Object.keys(tables).length) continue;
    matchedCards.push({
      plateId: cleanString(plateId, 80),
      board: sanitizeSnapshotBoard(boardById.get(String(plateId)) || { plateId }, zsType),
      tables,
    });
  }
  const evidence = {
    day: cleanString(payload?.day || day, 16),
    zsType: Number(zsType),
    available: !!payload,
    savedAt: cleanString(payload?.savedAt ?? payload?.generatedAt, 40),
    boardCount: boards.length,
    matchedCardCount: matchedCards.length,
    matchedCards,
  };
  return { ...evidence, sha256: hashEvidence(evidence) };
}

function sanitizeLimitUpStock(stock) {
  const code = normalizeEvidenceCode(stock?.code ?? stock?.stockCode ?? stock?.dm);
  if (!code) return null;
  return {
    code,
    name: cleanString(stock?.name ?? stock?.stockName, 80),
    gain: finiteNumber(stock?.gain ?? stock?.gainPct ?? stock?.zf),
    limitUpCount: cleanScalar(stock?.limitUpCount ?? stock?.lianban),
    firstLimitTime: cleanString(stock?.firstLimitTime, 20),
    sealAmount: finiteNumber(stock?.sealAmount ?? stock?.封单额),
    reason: cleanString(stock?.reason ?? stock?.finalDetailReason ?? stock?.ztReason, 500),
  };
}

function sanitizeReasonCandidate(candidate) {
  return {
    source: cleanString(candidate?.source, 100),
    group: cleanString(candidate?.group, 100),
    boardTopic: cleanString(candidate?.boardTopic ?? candidate?.topic, 160),
    detailReason: cleanString(candidate?.detailReason ?? candidate?.reason, 500),
  };
}

function sanitizeMainReasonStock(stock) {
  const code = normalizeEvidenceCode(stock?.code ?? stock?.stockCode ?? stock?.dm);
  if (!code) return null;
  return {
    code,
    name: cleanString(stock?.name ?? stock?.stockName, 80),
    finalBoardTopic: cleanString(stock?.finalBoardTopic, 160),
    finalDetailReason: cleanString(stock?.finalDetailReason ?? stock?.reasonHeadline ?? stock?.reason, 800),
    primaryTopic: cleanString(stock?.primaryTopic, 160),
    agreeCount: finiteNumber(stock?.agreeCount),
    consensusTier: cleanString(stock?.consensusTier, 80),
    limitUpCount: cleanScalar(stock?.limitUpCount ?? stock?.lianban),
    firstLimitTime: cleanString(stock?.firstLimitTime, 20),
    candidates: (Array.isArray(stock?.sourceEvidence?.candidates) ? stock.sourceEvidence.candidates : [])
      .map(sanitizeReasonCandidate)
      .filter(candidate => candidate.source || candidate.boardTopic || candidate.detailReason)
      .slice(0, 12),
  };
}

function sanitizeCloseStock(stock) {
  const code = normalizeEvidenceCode(stock?.code ?? stock?.stockCode ?? stock?.dm);
  if (!code) return null;
  return {
    code,
    name: cleanString(stock?.name ?? stock?.stockName, 80),
    close: finiteNumber(stock?.close ?? stock?.price),
    gain: finiteNumber(stock?.gain ?? stock?.gainPct),
  };
}

function buildFilteredDayEvidence(payload, day, codes, sanitizer) {
  const codeSet = new Set(normalizeEvidenceCodes(codes));
  const stocks = (Array.isArray(payload?.stocks) ? payload.stocks : [])
    .map(sanitizer)
    .filter(stock => stock && codeSet.has(stock.code));
  const evidence = {
    day: cleanString(payload?.day || day, 16),
    available: !!payload,
    sourceCount: Number(payload?.count ?? payload?.stocks?.length ?? 0),
    savedAt: cleanString(payload?.savedAt ?? payload?.generatedAt, 40),
    stocks,
  };
  return { ...evidence, sha256: hashEvidence(evidence) };
}

function buildEvidenceCoverage(options = {}) {
  const day = String(options.day || '');
  const dataDays = Array.isArray(options.dataDays) ? options.dataDays.map(String) : [];
  const eventDays = Array.isArray(options.eventDays) ? options.eventDays.map(String) : [];
  const historicalOrClosed = options.historicalOrClosed === true;
  const requiredEventDays = new Set(eventDays.filter(evidenceDay => historicalOrClosed || evidenceDay !== day));
  const requiredCloseDays = new Set(dataDays.filter(evidenceDay => historicalOrClosed || evidenceDay !== day));
  const limitUpDays = Array.isArray(options.limitUpDays) ? options.limitUpDays : [];
  const mainReasonDays = Array.isArray(options.mainReasonDays) ? options.mainReasonDays : [];
  const closeDays = Array.isArray(options.closeDays) ? options.closeDays : [];
  const snapshots = Array.isArray(options.snapshots) ? options.snapshots : [];
  const neededTradingDays = Math.max(0, Number(options.neededTradingDays) || 0);
  const missingSources = [
    ...((dataDays.length < neededTradingDays) ? [`trading-days:${dataDays.length}/${neededTradingDays}`] : []),
    ...snapshots.filter(item => !item?.available).map(item => `snapshot-zs${item?.zsType}`),
    ...limitUpDays.filter(item => requiredEventDays.has(String(item?.day || '')) && !item?.available).map(item => `limit-up:${item.day}`),
    ...mainReasonDays.filter(item => requiredEventDays.has(String(item?.day || '')) && !item?.available).map(item => `main-reason:${item.day}`),
    ...closeDays.filter(item => requiredCloseDays.has(String(item?.day || '')) && !item?.available).map(item => `close:${item.day}`),
    ...((historicalOrClosed && !options.strategySnapshotAvailable) ? ['strategy-snapshot'] : []),
  ];
  return {
    missingSources: [...new Set(missingSources)],
    coverage: {
      requestedTradingDays: neededTradingDays,
      returnedTradingDays: dataDays.length,
      requiredEventDays: [...requiredEventDays],
      requiredCloseDays: [...requiredCloseDays],
      availableLimitUpDays: limitUpDays.filter(item => item?.available).map(item => String(item.day || '')),
      availableMainReasonDays: mainReasonDays.filter(item => item?.available).map(item => String(item.day || '')),
      availableCloseDays: closeDays.filter(item => item?.available).map(item => String(item.day || '')),
    },
  };
}

function sanitizeStrategyStock(stock) {
  if (!stock) return null;
  const code = normalizeEvidenceCode(stock.code);
  if (!code) return null;
  return {
    code,
    name: cleanString(stock.name, 80),
    gain: finiteNumber(stock.gain ?? stock.gainPct ?? stock.todayGain),
    gain10: finiteNumber(stock.gain10),
    gain30: finiteNumber(stock.gain30),
    zt10Count: finiteNumber(stock.zt10Count ?? stock.zt10),
    mainZt10Count: finiteNumber(stock.mainZt10Count),
    leadScore: finiteNumber(stock.leadScore),
    basis: (Array.isArray(stock.basis) ? stock.basis : []).map(item => cleanString(item, 200)).slice(0, 12),
  };
}

function sanitizeStrategyPayload(payload, codes) {
  if (!payload) return null;
  const codeSet = new Set(normalizeEvidenceCodes(codes));
  return {
    ok: payload.ok !== false,
    day: cleanString(payload.day ?? payload.requestedDay, 16),
    generatedAt: cleanString(payload.generatedAt ?? payload.savedAt, 40),
    snapshot: !!payload.snapshot,
    frozen: !!payload.frozen,
    mode: cleanString(payload.mode, 100),
    mainlines: (Array.isArray(payload.mainlines) ? payload.mainlines : []).slice(0, 20).map(mainline => {
      const todayCodes = (Array.isArray(mainline.todayCodes) ? mainline.todayCodes : [])
        .map(normalizeEvidenceCode)
        .filter(code => code && codeSet.has(code))
        .slice(0, 20);
      const leaders = (Array.isArray(mainline.leaders) ? mainline.leaders : [])
        .map(sanitizeStrategyStock)
        .filter(stock => stock && codeSet.has(stock.code))
        .slice(0, 20);
      const mainLeader = sanitizeStrategyStock(mainline.mainLeader);
      const filteredMainLeader = mainLeader && codeSet.has(mainLeader.code) ? mainLeader : null;
      return {
        rank: finiteNumber(mainline.rank),
        theme: cleanString(mainline.theme, 160),
        key: cleanString(mainline.familyKey ?? mainline.key, 160),
        mergedThemes: (Array.isArray(mainline.mergedThemes) ? mainline.mergedThemes : []).map(item => cleanString(item, 160)).slice(0, 20),
        score: finiteNumber(mainline.score),
        predictScore: finiteNumber(mainline.predictScore),
        count: finiteNumber(mainline.count),
        netInflow: finiteNumber(mainline.netInflow),
        boardGainPct: finiteNumber(mainline.boardGainPct),
        todayCodes,
        mainLeader: filteredMainLeader,
        leaders,
        tracedCodes: [...new Set([
          ...todayCodes,
          ...leaders.map(stock => stock.code),
          ...(filteredMainLeader ? [filteredMainLeader.code] : []),
        ])],
      };
    }),
  };
}

function addIntegrity(bundle) {
  const evidence = bundle?.evidence || {};
  const sections = Object.fromEntries(Object.entries(evidence).map(([key, value]) => [key, hashEvidence(value)]));
  const payload = evidenceBundleHashInput(bundle);
  return {
    ...bundle,
    integrity: {
      algorithm: 'sha256-stable-json',
      sections,
      bundle: hashEvidence(payload),
    },
  };
}

function verifyEvidenceBundle(bundle) {
  const errors = [];
  if (!bundle || typeof bundle !== 'object') return { ok: false, errors: ['bundle is not an object'] };
  if (Number(bundle.schemaVersion) !== EVIDENCE_SCHEMA_VERSION) errors.push(`unsupported schemaVersion: ${bundle.schemaVersion}`);
  const expectedSections = bundle?.integrity?.sections || {};
  for (const [key, value] of Object.entries(bundle.evidence || {})) {
    if (expectedSections[key] !== hashEvidence(value)) errors.push(`section hash mismatch: ${key}`);
  }
  const expectedBundle = hashEvidence(evidenceBundleHashInput(bundle));
  if (bundle?.integrity?.bundle !== expectedBundle) errors.push('bundle hash mismatch');
  return { ok: errors.length === 0, errors };
}

function snapshotTodayGain(row, table) {
  const direct = finiteNumber(row?.todayGain);
  if (direct !== null) return direct;
  return table === 'ztList' ? finiteNumber(row?.gain) : null;
}

function windowGain(closeRows, period) {
  const rows = closeRows.filter(row => finiteNumber(row.close) !== null).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  if (rows.length <= period) return null;
  const latest = finiteNumber(rows[rows.length - 1].close);
  const base = finiteNumber(rows[rows.length - 1 - period].close);
  if (latest === null || base === null || base <= 0) return null;
  return Number(((latest / base - 1) * 100).toFixed(2));
}

function buildCodeAudits(bundle) {
  const codes = normalizeEvidenceCodes(bundle?.request?.codes || []);
  return codes.map(code => {
    const snapshotMatches = [];
    const todayGains = [];
    for (const source of bundle?.evidence?.snapshots || []) {
      for (const card of source?.matchedCards || []) {
        const tables = {};
        for (const [table, rows] of Object.entries(card?.tables || {})) {
          const matched = rows.filter(row => normalizeEvidenceCode(row?.code) === code);
          if (!matched.length) continue;
          tables[table] = matched;
          for (const row of matched) {
            const gain = snapshotTodayGain(row, table);
            if (gain !== null) todayGains.push(gain);
          }
        }
        if (Object.keys(tables).length) snapshotMatches.push({
          zsType: source.zsType,
          plateId: card.plateId,
          boardName: card?.board?.name || '',
          tables,
        });
      }
    }

    const limitUpDays = [];
    for (const day of bundle?.evidence?.limitUpDays || []) {
      if ((day?.stocks || []).some(stock => normalizeEvidenceCode(stock?.code) === code)) limitUpDays.push(day.day);
    }
    const reasonHits = [];
    for (const day of bundle?.evidence?.mainReasonDays || []) {
      for (const stock of day?.stocks || []) {
        if (normalizeEvidenceCode(stock?.code) !== code) continue;
        reasonHits.push({ day: day.day, topic: stock.finalBoardTopic || '', detail: stock.finalDetailReason || '' });
      }
    }
    const closeRows = [];
    for (const day of bundle?.evidence?.closeDays || []) {
      const stock = (day?.stocks || []).find(row => normalizeEvidenceCode(row?.code) === code);
      if (stock) closeRows.push({ day: day.day, close: stock.close, gain: stock.gain });
    }
    const strategyMembership = [];
    for (const [kind, payload] of Object.entries(bundle?.evidence?.strategy || {})) {
      for (const mainline of payload?.mainlines || []) {
        if ((mainline.todayCodes || []).includes(code) || (mainline.leaders || []).some(stock => stock.code === code)) {
          strategyMembership.push({
            kind,
            theme: mainline.theme,
            rank: mainline.rank,
            inTodayCodes: (mainline.todayCodes || []).includes(code),
            leader: (mainline.leaders || []).find(stock => stock.code === code) || null,
          });
        }
      }
    }
    return {
      code,
      snapshotTodayGain: todayGains.length ? Math.max(...todayGains) : null,
      snapshotMatches,
      limitUpDays,
      limitUpCount: limitUpDays.length,
      mainReasonHits: reasonHits,
      closeGain10: windowGain(closeRows, 10),
      closeGain30: windowGain(closeRows, 30),
      closeRows,
      strategyMembership,
    };
  });
}

module.exports = {
  EVIDENCE_SCHEMA_VERSION,
  SNAPSHOT_TABLES,
  addIntegrity,
  buildCodeAudits,
  buildEvidenceCoverage,
  buildFilteredDayEvidence,
  buildSnapshotEvidence,
  hashEvidence,
  normalizeEvidenceCode,
  normalizeEvidenceCodes,
  normalizeEvidenceThemes,
  sanitizeCloseStock,
  sanitizeLimitUpStock,
  sanitizeMainReasonStock,
  sanitizeStrategyPayload,
  verifyEvidenceBundle,
};
