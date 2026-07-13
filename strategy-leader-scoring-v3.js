'use strict';

const LEADER_SCORING_V3_SCHEMA_VERSION = 1;
const LEADER_SCORING_V3_SCORE_VERSION = 'leader-scoring-v3-shadow-v3';
const LEADER_SCORING_V3_EVENT_WINDOW_DAYS = 10;
const LEADER_SCORING_V3_HISTORY_DAYS = LEADER_SCORING_V3_EVENT_WINDOW_DAYS - 1;
const LEADER_SCORING_V3_TREND_RULE = 'target-day-inclusive-positive-gain10-1x-plus-positive-gain30-0.25x-shadow';
const LEADER_SCORING_V3_EVENT_RULE_VERSION_V1 = 'leader-scoring-v3-events-v1';
const LEADER_SCORING_V3_EVENT_RULE_VERSION = 'leader-scoring-v3-events-v2';

const DAILY_EVENT_POINTS = Object.freeze({
  'star-limit-up': 20,
  'ordinary-limit-up': 15,
  'confirmed-mainline-big-gain': 8,
  none: 0,
});

function text(value) {
  return String(value || '').trim();
}

function codeOf(value) {
  return text(value).replace(/^(?:sh|sz|bj)/i, '');
}

function finiteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value) {
  return Number(Number(value || 0).toFixed(2));
}

function validDay(value) {
  const day = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : '';
}

function recordsByDay(records) {
  const map = new Map();
  for (const record of (Array.isArray(records) ? records : [])) {
    const day = validDay(record?.day);
    if (day) map.set(day, record);
  }
  return map;
}

function eventPoints(event) {
  return Object.prototype.hasOwnProperty.call(DAILY_EVENT_POINTS, event)
    ? DAILY_EVENT_POINTS[event]
    : null;
}

function isLimitUpEvent(value) {
  return ['star-limit-up', 'ordinary-limit-up'].includes(text(value));
}

function recordRowsForCode(record, code) {
  return (Array.isArray(record?.stockEvents?.events) ? record.stockEvents.events : [])
    .filter(row => codeOf(row?.code) === code);
}

function recordCanProveFamilyLimit(record) {
  const ruleVersion = text(record?.ruleVersion);
  if (ruleVersion === LEADER_SCORING_V3_EVENT_RULE_VERSION_V1) {
    return record?.complete === true && record?.stockEvents?.complete === true;
  }
  if (ruleVersion === LEADER_SCORING_V3_EVENT_RULE_VERSION) {
    return record?.stockEvents?.rowsAuthoritative === true;
  }
  return false;
}

function hasConfirmedFamilyLimit(record, code, familyKey) {
  if (!recordCanProveFamilyLimit(record)) return false;
  return recordRowsForCode(record, code).some(row =>
    text(row?.familyKey) === familyKey &&
    isLimitUpEvent(row?.event) &&
    row?.status !== 'dataMissing' &&
    row?.historyEligible !== false);
}

function eventEvidence(record, row, points) {
  return {
    ruleVersion: text(record?.ruleVersion),
    storedPoints: finiteNumber(row?.points),
    storedPointsMatch: finiteNumber(row?.points) === points,
    sourceStatus: text(row?.status),
    historyEligible: row?.historyEligible === true,
    starEvidenceStatus: text(row?.starEvidenceStatus) || null,
    starEvidenceSource: text(row?.starEvidenceSource) || null,
    familyEvidenceStatus: text(row?.familyEvidenceStatus) || null,
    sourceReason: row?.sourceReason && typeof row.sourceReason === 'object'
      ? JSON.parse(JSON.stringify(row.sourceReason)) : null,
    closeGainPct: finiteNumber(row?.closeGainPct),
  };
}

function pickStoredEvent(record, rows, day, evidenceExtra = null) {
  const scored = rows
    .map(row => ({ row, points: eventPoints(text(row?.event)) }))
    .filter(item => item.points !== null)
    .sort((a, b) => b.points - a.points || text(a.row?.event).localeCompare(text(b.row?.event)));
  if (rows.length && !scored.length) {
    return {
      day, complete: false, status: 'dataMissing', event: null, points: null,
      dataMissing: ['unknownDailyEvent'],
    };
  }
  if (!scored.length) return null;
  const picked = scored[0];
  return {
    day,
    complete: true,
    status: 'confirmed',
    event: text(picked.row?.event),
    points: picked.points,
    dataMissing: [],
    evidence: {
      ...eventEvidence(record, picked.row, picked.points),
      recordedFamilyKey: text(picked.row?.familyKey) || null,
      ...(evidenceExtra || {}),
    },
    duplicateRowsIgnored: Math.max(0, scored.length - 1),
  };
}

function pickQualifiedLimitUp(record, rows, day, familyKey) {
  const recorded = rows.filter(row =>
    isLimitUpEvent(row?.event) &&
    row?.status !== 'dataMissing' &&
    row?.historyEligible !== false);
  const picked = pickStoredEvent(record, recorded, day, {
    countedBy: 'rolling-window-family-qualified-limit-up',
    qualifiedFamilyKey: familyKey,
  });
  if (picked) return { ...picked, countedBy: 'rolling-window-family-qualified-limit-up' };

  // event-v2 keeps a reliable limit-up row even when only its daily reason family is missing.
  // Once another day in the same rolling window proves the stock belongs to this family,
  // that reliable limit-up still earns the ordinary 15-point lower bound.
  if (text(record?.ruleVersion) !== LEADER_SCORING_V3_EVENT_RULE_VERSION ||
      record?.stockEvents?.rowsAuthoritative !== true) return null;
  const unresolved = rows.find(row =>
    row?.status === 'dataMissing' &&
    row?.historyEligible === false &&
    Array.isArray(row?.dataMissing) &&
    row.dataMissing.length > 0 &&
    row.dataMissing.every(item => item === 'mainReasonFamily'));
  if (!unresolved) return null;
  return {
    day,
    complete: true,
    status: 'confirmed',
    event: 'ordinary-limit-up',
    points: DAILY_EVENT_POINTS['ordinary-limit-up'],
    dataMissing: [],
    countedBy: 'rolling-window-family-qualified-limit-up',
    evidence: {
      ruleVersion: text(record?.ruleVersion),
      storedPoints: finiteNumber(unresolved?.points),
      storedPointsMatch: false,
      sourceStatus: 'confirmed-limit-up-family-qualified',
      historyEligible: true,
      starEvidenceStatus: text(unresolved?.starEvidenceStatus) || null,
      starEvidenceSource: text(unresolved?.starEvidenceSource) || null,
      familyEvidenceStatus: 'qualified-by-window',
      sourceReason: unresolved?.sourceReason && typeof unresolved.sourceReason === 'object'
        ? JSON.parse(JSON.stringify(unresolved.sourceReason)) : null,
      closeGainPct: finiteNumber(unresolved?.closeGainPct),
      recordedFamilyKey: text(unresolved?.familyKey) || null,
      countedBy: 'rolling-window-family-qualified-limit-up',
      qualifiedFamilyKey: familyKey,
      recoveredFrom: ['mainReasonFamily'],
    },
    duplicateRowsIgnored: 0,
  };
}

function eventForCodeV1(record, code, familyKey, day, options = {}) {
  if (record.complete !== true || record?.stockEvents?.complete !== true) {
    return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventIncomplete'] };
  }
  const rows = recordRowsForCode(record, code);
  if (options.familyQualified) {
    const qualifiedLimit = pickQualifiedLimitUp(record, rows, day, familyKey);
    if (qualifiedLimit) return qualifiedLimit;
  }
  if (rows.some(row => row?.status === 'dataMissing' || row?.historyEligible === false)) {
    return {
      day,
      complete: false,
      status: 'dataMissing',
      event: null,
      points: null,
      dataMissing: [...new Set(rows.flatMap(row => Array.isArray(row?.dataMissing) ? row.dataMissing : ['stockEvent']))],
    };
  }
  const sameFamily = rows.filter(row => text(row?.familyKey) === familyKey);
  const picked = pickStoredEvent(record, sameFamily, day);
  if (picked) return picked;
  return {
    day,
    complete: true,
    status: 'confirmed',
    event: 'none',
    points: 0,
    dataMissing: [],
    otherFamilyEvents: rows.filter(row => text(row?.familyKey) !== familyKey)
      .map(row => ({ familyKey: text(row?.familyKey), event: text(row?.event) })),
  };
}

function eventForCodeV2(record, code, familyKey, day, options = {}) {
  const stockEvents = record?.stockEvents || {};
  if (stockEvents.rowsAuthoritative !== true) {
    return {
      day, complete: false, status: 'dataMissing', event: null, points: null,
      dataMissing: ['limitUpDbUnreliable'],
    };
  }
  const rows = recordRowsForCode(record, code);
  if (options.familyQualified) {
    const qualifiedLimit = pickQualifiedLimitUp(record, rows, day, familyKey);
    if (qualifiedLimit) return qualifiedLimit;
  }
  const blocked = rows.filter(row => row?.status === 'dataMissing' || row?.historyEligible === false);
  if (blocked.length) {
    return {
      day,
      complete: false,
      status: 'dataMissing',
      event: null,
      points: null,
      dataMissing: [...new Set(blocked.flatMap(row =>
        Array.isArray(row?.dataMissing) && row.dataMissing.length ? row.dataMissing : ['stockEvent']))],
      evidence: blocked.map(row => ({
        familyKey: text(row?.familyKey) || null,
        sourceStatus: text(row?.status),
        sourceReason: row?.sourceReason || null,
        closeGainPct: finiteNumber(row?.closeGainPct),
      })),
    };
  }
  const sameFamily = rows.filter(row => text(row?.familyKey) === familyKey);
  const picked = pickStoredEvent(record, sameFamily, day);
  if (picked) return picked;
  if (stockEvents.noneDeterminable === true) {
    return {
      day,
      complete: true,
      status: 'confirmed',
      event: 'none',
      points: 0,
      dataMissing: [],
      otherFamilyEvents: rows.filter(row => text(row?.familyKey) !== familyKey)
        .map(row => ({ familyKey: text(row?.familyKey), event: text(row?.event) })),
    };
  }
  return {
    day,
    complete: false,
    status: 'dataMissing',
    event: null,
    points: null,
    dataMissing: ['closePrice', 'confirmedMainlineUnknown'],
  };
}

function eventForCode(record, code, familyKey, options = {}) {
  const day = validDay(record?.day);
  if (!record) {
    return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventRecord'] };
  }
  const ruleVersion = text(record?.ruleVersion);
  if (ruleVersion === LEADER_SCORING_V3_EVENT_RULE_VERSION_V1) {
    return eventForCodeV1(record, code, familyKey, day, options);
  }
  if (ruleVersion === LEADER_SCORING_V3_EVENT_RULE_VERSION) {
    return eventForCodeV2(record, code, familyKey, day, options);
  }
  return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventRuleVersion'] };
}

function normalizeHistoryDays(targetDay, tradingDays, count = LEADER_SCORING_V3_HISTORY_DAYS) {
  if (count <= 0) return [];
  return [...new Set((Array.isArray(tradingDays) ? tradingDays : [])
    .map(validDay)
    .filter(day => day && day < targetDay))]
    .sort()
    .slice(-count);
}

function scoreHistoryWindow(input) {
  const targetDay = validDay(input?.targetDay);
  const code = codeOf(input?.code);
  const familyKey = text(input?.familyKey);
  const requestedWindowDays = finiteNumber(input?.windowDays);
  const windowConfigValid = requestedWindowDays === null || requestedWindowDays === LEADER_SCORING_V3_EVENT_WINDOW_DAYS;
  const eventWindowDays = LEADER_SCORING_V3_EVENT_WINDOW_DAYS;
  const expectedCount = Math.max(0, eventWindowDays - 1);
  const days = normalizeHistoryDays(targetDay, input?.tradingDays, expectedCount);
  const byDay = recordsByDay(input?.dailyRecords);
  const evidence = days.map(day => {
    const result = eventForCode(byDay.get(day), code, familyKey, {
      familyQualified: input?.familyQualified === true,
    });
    return result.day ? result : { ...result, day };
  });
  const missingDays = evidence.filter(row => !row.complete).map(row => row.day || 'unknown');
  const windowShortfall = Math.max(0, expectedCount - days.length);
  const knownPoints = evidence.reduce((sum, row) => sum + (row.points || 0), 0);
  const eventCounts = {};
  for (const row of evidence) {
    if (row.complete && row.event && row.event !== 'none') eventCounts[row.event] = (eventCounts[row.event] || 0) + 1;
  }
  const complete = windowConfigValid && windowShortfall === 0 && missingDays.length === 0;
  const familyLimitEvidenceCount = days.filter(day =>
    hasConfirmedFamilyLimit(byDay.get(day), code, familyKey)).length;
  const limitUpEventCount = (eventCounts['star-limit-up'] || 0) + (eventCounts['ordinary-limit-up'] || 0);
  return {
    complete,
    anchorRule: 'previous-9-trading-days-plus-separate-target-day',
    targetDay,
    windowDays: expectedCount,
    eventWindowDays,
    requestedWindowDays,
    windowConfigValid,
    tradingDays: days,
    points: complete ? knownPoints : null,
    knownPoints,
    eventCounts,
    familyLimitEventCount: familyLimitEvidenceCount,
    familyLimitEvidenceCount,
    limitUpEventCount,
    missingDays,
    dataMissing: windowConfigValid ? [] : ['eventWindowDays'],
    windowShortfall,
    evidence,
  };
}

function scoreToday(input) {
  const targetDay = validDay(input?.targetDay);
  const code = codeOf(input?.code);
  const familyKey = text(input?.familyKey);
  if (input?.todayRecord) {
    if (validDay(input.todayRecord.day) !== targetDay) {
      return { complete: false, status: 'dataMissing', points: null, event: null, dataMissing: ['todayRecordDayMismatch'] };
    }
    return {
      ...eventForCode(input.todayRecord, code, familyKey, {
        familyQualified: input?.familyQualified === true,
      }),
      source: 'persisted-post-close-daily-event',
    };
  }

  const projection = input?.todayProjection;
  if (!projection || projection.persisted !== true) {
    return {
      complete: false,
      status: 'dataMissing',
      event: null,
      points: null,
      source: 'persisted-intraday-projection',
      dataMissing: ['todayProjection'],
    };
  }
  const event = text(projection.event) || 'none';
  const points = eventPoints(event);
  if (points === null || projection.status === 'dataMissing') {
    return {
      complete: false,
      status: 'dataMissing',
      event: null,
      points: null,
      source: 'persisted-intraday-projection',
      dataMissing: Array.isArray(projection.dataMissing) ? projection.dataMissing.slice() : ['todayProjectionEvent'],
    };
  }
  return {
    complete: true,
    status: text(projection.status) || 'provisional',
    event,
    points,
    source: 'persisted-intraday-projection',
    observedAt: text(projection.observedAt),
    dataMissing: [],
  };
}

function scoreTrend(input) {
  const targetDay = validDay(input?.targetDay);
  const anchorDay = validDay(input?.gainAnchorDay);
  const expectedAnchorDay = validDay(input?.expectedAnchorDay);
  const gain10 = finiteNumber(input?.gain10);
  const gain30 = finiteNumber(input?.gain30);
  const priceState = text(input?.gainPriceState);
  const asOf = text(input?.gainAsOf);
  const asOfDay = validDay(asOf.slice(0, 10));
  const dataMissing = [];
  if (!anchorDay) dataMissing.push('gainAnchorDay');
  else if (targetDay && anchorDay !== targetDay) dataMissing.push('gainAnchorNotTargetDay');
  else if (expectedAnchorDay && anchorDay !== expectedAnchorDay) dataMissing.push('gainAnchorNotTargetDay');
  if (!['intraday-live', 'post-close-final'].includes(priceState)) dataMissing.push('gainPriceState');
  if (!asOf) dataMissing.push('gainAsOf');
  else if (!asOfDay || (targetDay && asOfDay !== targetDay)) dataMissing.push('gainAsOfNotTargetDay');
  if (gain10 === null) dataMissing.push('gain10');
  if (gain30 === null) dataMissing.push('gain30');
  const complete = dataMissing.length === 0;
  const gain10Points = gain10 === null ? null : round2(Math.max(0, gain10));
  const gain30Points = gain30 === null ? null : round2(Math.max(0, gain30) * 0.25);
  return {
    complete,
    rule: LEADER_SCORING_V3_TREND_RULE,
    anchorDay: anchorDay || null,
    expectedAnchorDay: expectedAnchorDay || null,
    priceState: priceState || null,
    asOf: asOf || null,
    gain10,
    gain30,
    gain10Points,
    gain30Points,
    points: complete ? round2(gain10Points + gain30Points) : null,
    dataMissing,
  };
}

function scoreLeaderV3(input = {}) {
  const code = codeOf(input.code);
  const familyKey = text(input.familyKey);
  const targetDay = validDay(input.targetDay);
  const eventWindowDays = LEADER_SCORING_V3_EVENT_WINDOW_DAYS;
  const priorDays = normalizeHistoryDays(targetDay, input?.tradingDays, Math.max(0, eventWindowDays - 1));
  const byDay = recordsByDay(input?.dailyRecords);
  const priorFamilyLimitEvidenceCount = priorDays.filter(day =>
    hasConfirmedFamilyLimit(byDay.get(day), code, familyKey)).length;
  const todayConfirmedFamilyLimitGate = !!(input?.todayRecord &&
    validDay(input.todayRecord.day) === targetDay &&
    hasConfirmedFamilyLimit(input.todayRecord, code, familyKey));
  const familyQualified = priorFamilyLimitEvidenceCount >= 1 || todayConfirmedFamilyLimitGate;
  const history = scoreHistoryWindow({ ...input, code, familyKey, targetDay, familyQualified });
  const today = scoreToday({ ...input, code, familyKey, targetDay, familyQualified });
  const expectedAnchorDay = targetDay;
  const trend = scoreTrend({ ...input, targetDay, expectedAnchorDay });
  const complete = !!(code && familyKey && targetDay && history.complete && today.complete && trend.complete);
  const dataMissing = [
    ...(!code ? ['code'] : []),
    ...(!familyKey ? ['familyKey'] : []),
    ...(!targetDay ? ['targetDay'] : []),
    ...history.missingDays.map(day => `history:${day}`),
    ...(history.windowShortfall ? [`historyWindow:${history.windowShortfall}`] : []),
    ...history.dataMissing.map(item => `history:${item}`),
    ...today.dataMissing.map(item => `today:${item}`),
    ...trend.dataMissing.map(item => `trend:${item}`),
  ];
  const priorFamilyLimitGate = history.complete ? priorFamilyLimitEvidenceCount >= 1 : null;
  const formalEligibilityGate = history.complete && today.complete
    ? !!(priorFamilyLimitGate || todayConfirmedFamilyLimitGate)
    : null;
  const raw = complete ? round2(history.points + today.points + trend.points) : null;
  const todayLimitUpEventCount = today.complete && isLimitUpEvent(today.event) ? 1 : 0;
  const todayFamilyLimitEvidenceCount = todayConfirmedFamilyLimitGate ? 1 : 0;
  const eventWindow = {
    complete: history.complete && today.complete,
    anchorRule: 'previous-9-trading-days-plus-target-day',
    windowDays: eventWindowDays,
    tradingDays: [...history.tradingDays, targetDay].filter(Boolean),
    points: history.complete && today.complete ? round2(history.points + today.points) : null,
    knownPoints: round2(history.knownPoints + (today.points || 0)),
    limitUpEventCount: history.limitUpEventCount + todayLimitUpEventCount,
    familyLimitEvidenceCount: history.familyLimitEvidenceCount + todayFamilyLimitEvidenceCount,
    familyQualified,
  };
  const legacySignals = input.legacySignals && typeof input.legacySignals === 'object'
    ? Object.keys(input.legacySignals).sort() : [];
  return {
    schemaVersion: LEADER_SCORING_V3_SCHEMA_VERSION,
    scoreVersion: LEADER_SCORING_V3_SCORE_VERSION,
    targetDay,
    code,
    name: text(input.name),
    familyKey,
    complete,
    dataMissing: [...new Set(dataMissing)],
    historyGate: priorFamilyLimitGate,
    priorFamilyLimitGate,
    todayConfirmedFamilyLimitGate,
    formalEligibilityGate,
    formalEligibilityBasis: priorFamilyLimitGate
      ? 'prior-family-limit-up'
      : todayConfirmedFamilyLimitGate
        ? 'confirmed-target-day-family-limit-up'
        : null,
    leadScoreV3Raw: raw,
    formalScore: complete && formalEligibilityGate ? raw : null,
    components: { eventWindow, history, today, trend },
    tieBreakers: {
      freshDist: finiteNumber(input?.tieBreakers?.freshDist),
      todayGain: finiteNumber(input?.tieBreakers?.todayGain),
      firstLimitTime: text(input?.tieBreakers?.firstLimitTime),
      streak: finiteNumber(input?.tieBreakers?.streak),
    },
    ignoredLegacyScoreSignals: legacySignals,
  };
}

function rankLeaderPoolV3(input = {}) {
  const sharedDefaults = {
    targetDay: input.targetDay,
    familyKey: input.familyKey,
    tradingDays: input.tradingDays,
    dailyRecords: input.dailyRecords,
    todayRecord: input.todayRecord,
    gainPriceState: input.gainPriceState,
    gainAsOf: input.gainAsOf,
  };
  const candidates = (Array.isArray(input.candidates) ? input.candidates : [])
    .map(candidate => scoreLeaderV3({
      ...sharedDefaults,
      ...candidate,
      dailyRecords: candidate.dailyRecords || sharedDefaults.dailyRecords,
      tradingDays: candidate.tradingDays || sharedDefaults.tradingDays,
      todayRecord: candidate.todayRecord || sharedDefaults.todayRecord,
    }));
  const familyKeys = [...new Set(candidates.map(row => row.familyKey).filter(Boolean))];
  if (familyKeys.length > 1) throw new Error('rankLeaderPoolV3 requires one mainline family per full-pool replay');
  const codes = candidates.map(row => row.code).filter(Boolean);
  if (new Set(codes).size !== codes.length) throw new Error('rankLeaderPoolV3 requires unique candidate codes');
  const eligible = candidates.filter(row => row.complete && row.formalEligibilityGate && row.formalScore !== null)
    .sort((a, b) =>
      b.formalScore - a.formalScore ||
      (b.components.eventWindow.limitUpEventCount - a.components.eventWindow.limitUpEventCount) ||
      ((b.tieBreakers.todayGain ?? -Infinity) - (a.tieBreakers.todayGain ?? -Infinity)) ||
      ((a.tieBreakers.freshDist ?? Infinity) - (b.tieBreakers.freshDist ?? Infinity)) ||
      a.code.localeCompare(b.code));
  const rankByCode = new Map(eligible.map((row, index) => [row.code, index + 1]));
  const fullLeaderCount = eligible.length;
  const results = candidates.map(row => {
    const originalRank = rankByCode.get(row.code) || null;
    return {
      ...row,
      originalRank,
      rankPercentile: originalRank && fullLeaderCount
        ? round2((fullLeaderCount - originalRank + 1) / fullLeaderCount * 100)
        : null,
      poolSize: candidates.length,
      fullLeaderCount,
    };
  }).sort((a, b) =>
    (a.originalRank ?? Infinity) - (b.originalRank ?? Infinity) ||
    a.code.localeCompare(b.code));
  return {
    schemaVersion: LEADER_SCORING_V3_SCHEMA_VERSION,
    scoreVersion: LEADER_SCORING_V3_SCORE_VERSION,
    targetDay: validDay(input.targetDay),
    familyKey: familyKeys[0] || text(input.familyKey),
    resultScope: 'full-input-pool',
    poolSize: candidates.length,
    fullLeaderCount,
    complete: candidates.every(row => row.complete),
    results,
  };
}

module.exports = {
  DAILY_EVENT_POINTS,
  LEADER_SCORING_V3_EVENT_WINDOW_DAYS,
  LEADER_SCORING_V3_HISTORY_DAYS,
  LEADER_SCORING_V3_EVENT_RULE_VERSION,
  LEADER_SCORING_V3_EVENT_RULE_VERSION_V1,
  LEADER_SCORING_V3_SCHEMA_VERSION,
  LEADER_SCORING_V3_SCORE_VERSION,
  LEADER_SCORING_V3_TREND_RULE,
  eventForCode,
  rankLeaderPoolV3,
  scoreHistoryWindow,
  scoreLeaderV3,
  scoreToday,
  scoreTrend,
};
