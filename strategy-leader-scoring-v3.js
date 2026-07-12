'use strict';

const LEADER_SCORING_V3_SCHEMA_VERSION = 1;
const LEADER_SCORING_V3_SCORE_VERSION = 'leader-scoring-v3-shadow-v1';
const LEADER_SCORING_V3_HISTORY_DAYS = 10;
const LEADER_SCORING_V3_TREND_RULE = 'positive-gain10-1x-plus-positive-gain30-0.25x-shadow';
const LEADER_SCORING_V3_EVENT_RULE_VERSION = 'leader-scoring-v3-events-v1';

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

function eventForCode(record, code, familyKey) {
  const day = validDay(record?.day);
  if (!record) {
    return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventRecord'] };
  }
  if (record.complete !== true || record?.stockEvents?.complete !== true) {
    return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventIncomplete'] };
  }
  if (text(record?.ruleVersion) !== LEADER_SCORING_V3_EVENT_RULE_VERSION) {
    return { day, complete: false, status: 'dataMissing', event: null, points: null, dataMissing: ['dailyEventRuleVersion'] };
  }

  const rows = (Array.isArray(record?.stockEvents?.events) ? record.stockEvents.events : [])
    .filter(row => codeOf(row?.code) === code);
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
  const scored = sameFamily
    .map(row => ({ row, points: eventPoints(text(row?.event)) }))
    .filter(item => item.points !== null)
    .sort((a, b) => b.points - a.points || text(a.row?.event).localeCompare(text(b.row?.event)));
  if (sameFamily.length && !scored.length) {
    return {
      day,
      complete: false,
      status: 'dataMissing',
      event: null,
      points: null,
      dataMissing: ['unknownDailyEvent'],
    };
  }
  if (!scored.length) {
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

  const picked = scored[0];
  return {
    day,
    complete: true,
    status: 'confirmed',
    event: text(picked.row?.event),
    points: picked.points,
    dataMissing: [],
    evidence: {
      ruleVersion: text(record?.ruleVersion),
      storedPoints: finiteNumber(picked.row?.points),
      storedPointsMatch: finiteNumber(picked.row?.points) === picked.points,
      sourceStatus: text(picked.row?.status),
    },
    duplicateRowsIgnored: Math.max(0, scored.length - 1),
  };
}

function normalizeHistoryDays(targetDay, tradingDays, count = LEADER_SCORING_V3_HISTORY_DAYS) {
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
  const days = normalizeHistoryDays(targetDay, input?.tradingDays, input?.windowDays || LEADER_SCORING_V3_HISTORY_DAYS);
  const expectedCount = Math.max(1, Number(input?.windowDays) || LEADER_SCORING_V3_HISTORY_DAYS);
  const byDay = recordsByDay(input?.dailyRecords);
  const evidence = days.map(day => {
    const result = eventForCode(byDay.get(day), code, familyKey);
    return result.day ? result : { ...result, day };
  });
  const missingDays = evidence.filter(row => !row.complete).map(row => row.day || 'unknown');
  const windowShortfall = Math.max(0, expectedCount - days.length);
  const knownPoints = evidence.reduce((sum, row) => sum + (row.points || 0), 0);
  const eventCounts = {};
  for (const row of evidence) {
    if (row.complete && row.event && row.event !== 'none') eventCounts[row.event] = (eventCounts[row.event] || 0) + 1;
  }
  const complete = windowShortfall === 0 && missingDays.length === 0;
  return {
    complete,
    anchorRule: 'strictly-before-target-day',
    targetDay,
    windowDays: expectedCount,
    tradingDays: days,
    points: complete ? knownPoints : null,
    knownPoints,
    eventCounts,
    familyLimitEventCount: (eventCounts['star-limit-up'] || 0) + (eventCounts['ordinary-limit-up'] || 0),
    missingDays,
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
    return { ...eventForCode(input.todayRecord, code, familyKey), source: 'persisted-post-close-daily-event' };
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
  const dataMissing = [];
  if (!anchorDay) dataMissing.push('gainAnchorDay');
  else if (targetDay && anchorDay >= targetDay) dataMissing.push('gainAnchorIncludesTargetDay');
  else if (expectedAnchorDay && anchorDay !== expectedAnchorDay) dataMissing.push('gainAnchorNotPrevTradingDay');
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
  const history = scoreHistoryWindow({ ...input, code, familyKey, targetDay });
  const today = scoreToday({ ...input, code, familyKey, targetDay });
  const expectedAnchorDay = history.complete
    ? history.tradingDays[history.tradingDays.length - 1]
    : '';
  const trend = scoreTrend({ ...input, targetDay, expectedAnchorDay });
  const complete = !!(code && familyKey && targetDay && history.complete && today.complete && trend.complete);
  const dataMissing = [
    ...(!code ? ['code'] : []),
    ...(!familyKey ? ['familyKey'] : []),
    ...(!targetDay ? ['targetDay'] : []),
    ...history.missingDays.map(day => `history:${day}`),
    ...(history.windowShortfall ? [`historyWindow:${history.windowShortfall}`] : []),
    ...today.dataMissing.map(item => `today:${item}`),
    ...trend.dataMissing.map(item => `trend:${item}`),
  ];
  const historyGate = history.complete ? history.familyLimitEventCount >= 1 : null;
  const raw = complete ? round2(history.points + today.points + trend.points) : null;
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
    historyGate,
    leadScoreV3Raw: raw,
    formalScore: complete && historyGate ? raw : null,
    components: { history, today, trend },
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
  const eligible = candidates.filter(row => row.complete && row.historyGate && row.formalScore !== null)
    .sort((a, b) =>
      b.formalScore - a.formalScore ||
      (b.components.history.familyLimitEventCount - a.components.history.familyLimitEventCount) ||
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
  LEADER_SCORING_V3_HISTORY_DAYS,
  LEADER_SCORING_V3_EVENT_RULE_VERSION,
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
