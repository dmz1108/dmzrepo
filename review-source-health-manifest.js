'use strict';

const REVIEW_HEALTH_MANIFEST_SCHEMA_VERSION = 1;
const REVIEW_HEALTH_MANIFEST_RULE_VERSION = 'review-health-shadow-v1';

function normalizeReviewHealthDay(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const day = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : '';
}

function normalizeReviewHealthCode(value) {
  return String(value || '').replace(/\D/g, '').trim();
}

function isExcludedReviewStock(code, name) {
  const normalizedCode = normalizeReviewHealthCode(code);
  const normalizedName = String(name || '').trim();
  return /^[489]/.test(normalizedCode)
    || /(^|\W)\*?ST/i.test(normalizedName)
    || /退市|退$/.test(normalizedName)
    || /^[NC][\u4e00-\u9fa5A-Z0-9]/i.test(normalizedName);
}

function reviewHealthPayloadDay(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return normalizeReviewHealthDay(
    payload.day
    || payload.sourceDay
    || payload.tradeDay
    || payload.tradeDate
    || payload.targetDay
    || '',
  );
}

function reviewSourceRows(group, payload) {
  if (!payload || typeof payload !== 'object') return [];
  if (group === 'kaipanla') {
    return (Array.isArray(payload.boards) ? payload.boards : [])
      .flatMap(board => (Array.isArray(board?.rows) ? board.rows : []));
  }
  return Array.isArray(payload.rows) ? payload.rows : [];
}

function reviewReasonText(row) {
  return [
    row?.primaryRawTopic,
    row?.primaryTopic,
    row?.boardTopic,
    row?.finalBoardTopic,
    row?.detailReason,
    row?.reasonText,
    row?.reasonHeadline,
    row?.reason,
  ].map(value => String(value || '').trim()).filter(Boolean).join('|');
}

function summarizeReviewSourceRows(rows, options = {}) {
  const normalizeCode = typeof options.normalizeCode === 'function'
    ? options.normalizeCode
    : normalizeReviewHealthCode;
  const excludeRow = typeof options.excludeRow === 'function'
    ? options.excludeRow
    : row => isExcludedReviewStock(row?.code, row?.name);
  const inputRows = Array.isArray(rows) ? rows : [];
  const keptRows = [];
  const codeCounts = new Map();
  const identityByCode = new Map();
  const emptyReasonCodes = new Set();
  const lowConfidenceCodes = new Set();
  let excludedRowCount = 0;

  for (const row of inputRows) {
    if (excludeRow(row)) {
      excludedRowCount += 1;
      continue;
    }
    keptRows.push(row);
    const code = normalizeCode(row?.code);
    if (!code) continue;
    codeCounts.set(code, Number(codeCounts.get(code) || 0) + 1);
    if (!identityByCode.has(code)) {
      identityByCode.set(code, {
        code,
        name: String(row?.name || '').trim(),
      });
    }
    if (!reviewReasonText(row)) emptyReasonCodes.add(code);
    const quality = String(row?.reasonQuality || '').toLowerCase();
    const confidence = Number(row?.confidence || 0);
    if (
      quality === 'fallback'
      || !!row?.ocrFallback
      || confidence < 0.8
    ) {
      lowConfidenceCodes.add(code);
    }
  }

  const codes = [...codeCounts.keys()].sort();
  const duplicateCodes = [...codeCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => a.code.localeCompare(b.code));
  return {
    rows: keptRows,
    rawRowCount: inputRows.length,
    excludedRowCount,
    rowCount: keptRows.length,
    uniqueCodeCount: codes.length,
    codes,
    identities: [...identityByCode.values()].sort((a, b) => a.code.localeCompare(b.code)),
    duplicateCodes,
    duplicateCodeCount: duplicateCodes.length,
    emptyReasonCodes: [...emptyReasonCodes].sort(),
    emptyReasonCodeCount: emptyReasonCodes.size,
    lowConfidenceCodes: [...lowConfidenceCodes].sort(),
    lowConfidenceCodeCount: lowConfidenceCodes.size,
  };
}

function compactSummary(summary) {
  return {
    rawRowCount: Number(summary?.rawRowCount || 0),
    excludedRowCount: Number(summary?.excludedRowCount || 0),
    rowCount: Number(summary?.rowCount || 0),
    uniqueCodeCount: Number(summary?.uniqueCodeCount || 0),
    duplicateCodeCount: Number(summary?.duplicateCodeCount || 0),
    duplicateCodes: summary?.duplicateCodes || [],
    emptyReasonCodeCount: Number(summary?.emptyReasonCodeCount || 0),
    emptyReasonCodes: summary?.emptyReasonCodes || [],
    lowConfidenceCodeCount: Number(summary?.lowConfidenceCodeCount || 0),
  };
}

function observationErrorText(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return String(error.message || error.code || error);
}

function buildObservationRecord(observation = {}, options = {}) {
  const targetDay = normalizeReviewHealthDay(options.day);
  const isTradingDay = options.isTradingDay !== false;
  const afterMarketClose = options.afterMarketClose === true;
  const payload = observation.payload;
  const rows = Array.isArray(options.rows) ? options.rows : [];
  const summary = summarizeReviewSourceRows(rows, options);
  const sourceDay = reviewHealthPayloadDay(payload);
  const error = observationErrorText(observation.error);
  let status = 'healthy';
  let reasonCode = 'same-day-non-empty';

  if (!isTradingDay) {
    status = 'not-required';
    reasonCode = 'market-closed';
  } else if (error) {
    status = 'invalid';
    reasonCode = 'artifact-json-invalid';
  } else if (!observation.exists) {
    status = afterMarketClose ? 'missing' : 'pending';
    reasonCode = afterMarketClose ? 'artifact-missing' : 'publication-window';
  } else if (!sourceDay) {
    status = 'invalid';
    reasonCode = 'artifact-day-missing';
  } else if (sourceDay !== targetDay) {
    status = 'stale';
    reasonCode = 'cross-day-artifact';
  } else if (!summary.uniqueCodeCount) {
    status = afterMarketClose ? 'invalid' : 'pending';
    reasonCode = afterMarketClose ? 'artifact-empty' : 'publication-window';
  }

  const suppressActual = ['invalid', 'stale', 'missing', 'pending', 'not-required'].includes(status)
    && reasonCode !== 'artifact-empty';
  return {
    kind: options.kind || 'source',
    group: options.group || '',
    label: options.label || options.group || '',
    targetDay,
    sourceDay,
    dayMatch: !!sourceDay && sourceDay === targetDay,
    status,
    reasonCode,
    exists: !!observation.exists,
    actual: suppressActual ? null : summary.uniqueCodeCount,
    rowCount: suppressActual ? null : summary.rowCount,
    rawActual: suppressActual ? null : summary.rawRowCount,
    observed: compactSummary(summary),
    asOf: payload?.savedAt || payload?.generatedAt || payload?.asOf || '',
    fetchedAt: payload?.fetchedAt || '',
    source: payload?.source || '',
    file: observation.file || '',
    byteSize: Number(observation.byteSize || 0),
    modifiedAt: observation.modifiedAt || '',
    contentHash: observation.contentHash || '',
    error,
  };
}

function normalizedIdentityName(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, '').trim();
}

function compareReviewSummaries(referenceSummary = {}, actualSummary = {}) {
  const reference = new Set(referenceSummary.codes || []);
  const actual = new Set(actualSummary.codes || []);
  const missingCodes = [...reference].filter(code => !actual.has(code)).sort();
  const extraCodes = [...actual].filter(code => !reference.has(code)).sort();
  const referenceCodesByName = new Map();
  for (const identity of referenceSummary.identities || []) {
    const name = normalizedIdentityName(identity?.name);
    if (!name || !identity?.code) continue;
    const codes = referenceCodesByName.get(name) || new Set();
    codes.add(identity.code);
    referenceCodesByName.set(name, codes);
  }
  const identityMismatches = [];
  for (const identity of actualSummary.identities || []) {
    const code = String(identity?.code || '');
    const name = normalizedIdentityName(identity?.name);
    if (!code || !name) continue;
    const referenceCodes = referenceCodesByName.get(name);
    const expectedCode = referenceCodes?.size === 1 ? [...referenceCodes][0] : '';
    if (expectedCode && expectedCode !== code) {
      identityMismatches.push({
        code,
        name: identity.name,
        expectedCode,
        reasonCode: 'name-maps-to-different-pool-code',
      });
    }
  }
  return {
    referenceCount: reference.size,
    actualCount: actual.size,
    missingCount: missingCodes.length,
    missingCodes,
    extraCount: extraCodes.length,
    extraCodes,
    identityMismatchCount: identityMismatches.length,
    identityMismatches,
    coveragePct: reference.size
      ? Number(((actual.size / reference.size) * 100).toFixed(2))
      : null,
    exact: reference.size > 0
      && missingCodes.length === 0
      && extraCodes.length === 0
      && identityMismatches.length === 0,
  };
}

function stateCounts(items) {
  return (items || []).reduce((counts, item) => {
    counts[item.status] = Number(counts[item.status] || 0) + 1;
    return counts;
  }, {});
}

function buildReviewHealthManifest(input = {}, options = {}) {
  const day = normalizeReviewHealthDay(input.day);
  const isTradingDay = input.isTradingDay !== false;
  const afterMarketClose = input.afterMarketClose === true;
  const common = {
    day,
    isTradingDay,
    afterMarketClose,
    normalizeCode: options.normalizeCode,
    excludeRow: options.excludeRow,
  };
  const terminalRows = Array.isArray(input.terminal?.payload?.stocks)
    ? input.terminal.payload.stocks
    : [];
  const combinedRows = Array.isArray(input.combined?.payload?.stocks)
    ? input.combined.payload.stocks
    : [];
  const terminalSummary = summarizeReviewSourceRows(terminalRows, common);
  const combinedSummary = summarizeReviewSourceRows(combinedRows, common);
  const terminal = buildObservationRecord(input.terminal, {
    ...common,
    kind: 'terminal-limit-up-pool',
    group: 'limit-up',
    label: '终盘涨停池',
    rows: terminalRows,
  });
  const combined = buildObservationRecord(input.combined, {
    ...common,
    kind: 'combined-main-reason',
    group: 'combined',
    label: '四源综合主因库',
    rows: combinedRows,
  });

  const sources = (Array.isArray(input.sources) ? input.sources : []).map(source => {
    const rows = reviewSourceRows(source.group, source.payload);
    const summary = summarizeReviewSourceRows(rows, common);
    const record = buildObservationRecord(source, {
      ...common,
      kind: 'formal-review-source',
      group: source.group,
      label: source.label,
      rows,
    });
    const canCompare = terminal.status === 'healthy' && record.status === 'healthy';
    const poolComparison = canCompare
      ? compareReviewSummaries(terminalSummary, summary)
      : null;
    return {
      ...record,
      expected: source.group === 'tgb'
        ? null
        : (canCompare ? terminalSummary.uniqueCodeCount : null),
      expectedBasis: source.group === 'tgb'
        ? 'source-faithful-diagnostic'
        : 'terminal-limit-up-pool',
      reconciliationMode: 'shadow-only',
      poolComparison,
    };
  });

  const combinedComparison = terminal.status === 'healthy' && combined.status === 'healthy'
    ? compareReviewSummaries(terminalSummary, combinedSummary)
    : null;
  const requiredItems = [terminal, combined, ...sources];
  const statuses = stateCounts(requiredItems);
  let status = 'healthy';
  let reasonCode = 'all-required-artifacts-valid';
  if (!isTradingDay) {
    status = 'not-required';
    reasonCode = 'market-closed';
  } else if (requiredItems.some(item => item.status === 'invalid' || item.status === 'stale')) {
    status = 'invalid';
    reasonCode = 'required-artifact-invalid';
  } else if (requiredItems.some(item => item.status === 'missing')) {
    status = 'missing';
    reasonCode = 'required-artifact-missing';
  } else if (requiredItems.some(item => item.status === 'pending')) {
    status = 'pending';
    reasonCode = 'publication-window';
  } else if (!combinedComparison?.exact) {
    status = 'invalid';
    reasonCode = 'combined-pool-mismatch';
  }

  const countDifferences = sources
    .filter(source => (
      source.observed.rawRowCount !== source.observed.rowCount
      || source.observed.rowCount !== source.observed.uniqueCodeCount
    ))
    .map(source => ({
      group: source.group,
      rawRowCount: source.observed.rawRowCount,
      filteredRowCount: source.observed.rowCount,
      uniqueCodeCount: source.observed.uniqueCodeCount,
    }));
  const poolDifferenceGroups = sources
    .filter(source => source.poolComparison && !source.poolComparison.exact)
    .map(source => ({
      group: source.group,
      missingCount: source.poolComparison.missingCount,
      extraCount: source.poolComparison.extraCount,
      identityMismatchCount: source.poolComparison.identityMismatchCount,
    }));

  return {
    schemaVersion: REVIEW_HEALTH_MANIFEST_SCHEMA_VERSION,
    ruleVersion: REVIEW_HEALTH_MANIFEST_RULE_VERSION,
    mode: 'shadow-read-only',
    writesAllowed: false,
    day,
    generatedAt: input.generatedAt || '',
    isTradingDay,
    afterMarketClose,
    status,
    reasonCode,
    blockingOk: status === 'healthy' || status === 'not-required',
    terminal,
    combined: {
      ...combined,
      expected: terminal.status === 'healthy' ? terminalSummary.uniqueCodeCount : null,
      expectedBasis: 'terminal-limit-up-pool',
      poolComparison: combinedComparison,
    },
    sources,
    summary: {
      statuses,
      requiredCount: requiredItems.length,
      healthyCount: Number(statuses.healthy || 0),
      sourceHealthyCount: sources.filter(source => source.status === 'healthy').length,
      countDifferenceGroups: countDifferences,
      poolDifferenceGroups,
    },
  };
}

function buildLegacyReviewHealthProjection(manifest = {}, options = {}) {
  const sources = (manifest.sources || []).map(source => {
    const observedCount = Number(source?.observed?.rawRowCount || 0);
    return {
      group: source.group,
      ok: source.exists && source.dayMatch && observedCount > 0 && !source.error,
      exists: !!source.exists,
      count: source.dayMatch ? observedCount : 0,
      observedCount,
    };
  });
  const terminalCount = Number(manifest.terminal?.observed?.uniqueCodeCount || 0);
  const combinedCount = Number(manifest.combined?.observed?.uniqueCodeCount || 0);
  const combinedComparison = manifest.combined?.poolComparison;
  const artifactsComplete = sources.length > 0 && sources.every(source => source.ok);
  const combinedComplete = terminalCount > 0 && artifactsComplete && combinedComparison?.exact === true;
  let status = 'healthy';
  if (!manifest.isTradingDay) status = 'not-required';
  else if (combinedComplete) status = 'healthy';
  else if (!manifest.afterMarketClose || options.reasonReady !== true) status = 'pending';
  else if (!terminalCount) status = 'missing';
  else if (
    ['invalid', 'stale'].includes(manifest.combined?.status)
    || sources.some(source => source.exists && !source.ok)
    || combinedComparison?.exact === false
  ) status = 'invalid';
  else status = 'missing';
  return {
    status,
    limitUpCount: terminalCount,
    mainReasonCount: combinedCount,
    sourceArtifactStats: sources,
  };
}

function compareReviewHealthProjection(legacy = {}, manifest = {}) {
  const manifestSources = new Map((manifest.sources || []).map(source => [source.group, source]));
  const sourceDiffs = (legacy.sourceArtifactStats || []).map(source => {
    const current = manifestSources.get(source.group);
    return {
      group: source.group,
      legacyCount: Number(source.count || 0),
      normalizedCount: current?.actual,
      filteredRowCount: current?.rowCount,
      status: current?.status || 'missing',
      countChanged: current?.actual != null && Number(source.count || 0) !== Number(current.actual),
      validityChanged: !!source.ok !== (current?.status === 'healthy'),
      poolMembershipDifferent: current?.poolComparison?.exact === false,
      identityMismatchCount: Number(current?.poolComparison?.identityMismatchCount || 0),
    };
  });
  return {
    statusChanged: legacy.status !== manifest.status,
    legacyStatus: legacy.status,
    manifestStatus: manifest.status,
    sourceDiffs,
    changedGroups: sourceDiffs
      .filter(item => item.countChanged || item.validityChanged)
      .map(item => item.group),
    poolDifferenceGroups: sourceDiffs
      .filter(item => item.poolMembershipDifferent)
      .map(item => item.group),
    identityMismatchGroups: sourceDiffs
      .filter(item => item.identityMismatchCount > 0)
      .map(item => item.group),
  };
}

module.exports = {
  REVIEW_HEALTH_MANIFEST_RULE_VERSION,
  REVIEW_HEALTH_MANIFEST_SCHEMA_VERSION,
  buildLegacyReviewHealthProjection,
  buildReviewHealthManifest,
  compareReviewHealthProjection,
  isExcludedReviewStock,
  normalizeReviewHealthCode,
  normalizeReviewHealthDay,
  reviewHealthPayloadDay,
  reviewSourceRows,
  summarizeReviewSourceRows,
};
