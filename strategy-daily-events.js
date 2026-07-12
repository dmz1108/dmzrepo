'use strict';

const STRATEGY_DAILY_EVENT_SCHEMA_VERSION = 1;
const STRATEGY_DAILY_EVENT_RULE_VERSION = 'leader-scoring-v3-events-v1';
const STRATEGY_DAILY_EVENT_MAX_SAMPLES = 160;
const INTRADAY_PHASES = new Set(['早盘', '上午盘', '午间休市', '午后', '尾盘']);

function text(value) {
  return String(value || '').trim();
}

function codeOf(value) {
  return text(value).replace(/^(?:sh|sz|bj)/i, '');
}

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function familyForTheme(theme, familyInfo) {
  const raw = text(theme);
  if (!raw || typeof familyInfo !== 'function') return null;
  const info = familyInfo(raw);
  const key = text(info?.key);
  if (!key) return null;
  return { key, label: text(info?.label) || raw };
}

function familyForMainline(mainline, familyInfo) {
  const theme = text(mainline?.theme);
  const resolved = familyForTheme(theme, familyInfo);
  const storedKey = text(mainline?.familyKey || mainline?.key);
  return {
    key: resolved?.key || storedKey,
    label: resolved?.label || theme || storedKey,
  };
}

function compactStar(star) {
  const code = codeOf(star?.code);
  if (!code) return null;
  return {
    code,
    name: text(star?.name),
    level: text(star?.level),
  };
}

function compactIntradayFamily(mainline, familyInfo) {
  const family = familyForMainline(mainline, familyInfo);
  if (!family.key) return null;
  const stars = (Array.isArray(mainline?.starStocks) ? mainline.starStocks : [])
    .map(compactStar)
    .filter(Boolean)
    .slice(0, 4);
  const netInflow = num(mainline?.netInflow);
  const limitUpCount = Math.max(0, Number(mainline?.count) || 0);
  const bigGainCount = Math.max(0, Number(mainline?.bigGainCount) || 0);
  const nearLimitCount = Math.max(0, Number(mainline?.nearLimitCount) || 0);
  return {
    familyKey: family.key,
    theme: family.label,
    displayTheme: text(mainline?.theme) || family.label,
    rank: Math.max(0, Number(mainline?.rank) || 0),
    score: num(mainline?.score),
    predictScore: num(mainline?.predictScore),
    netInflow,
    boardGainPct: num(mainline?.boardGainPct),
    boardCount: Math.max(0, Number(mainline?.boardCount) || 0),
    limitUpCount,
    bigGainCount,
    nearLimitCount,
    l2VerificationStatus: text(mainline?.l2VerificationStatus),
    stars,
    leaderCodes: (Array.isArray(mainline?.leaders) ? mainline.leaders : [])
      .map(row => codeOf(row?.code)).filter(Boolean).slice(0, 3),
    resonanceSignal: netInflow != null && netInflow > 0 &&
      (limitUpCount > 0 || bigGainCount >= 2 || nearLimitCount > 0),
  };
}

function emptyDailyRecord(day, generatedAt) {
  return {
    schemaVersion: STRATEGY_DAILY_EVENT_SCHEMA_VERSION,
    ruleVersion: STRATEGY_DAILY_EVENT_RULE_VERSION,
    day: text(day),
    createdAt: generatedAt,
    updatedAt: generatedAt,
    intradayObservation: {
      status: 'not-recorded',
      firstObservedAt: null,
      lastObservedAt: null,
      sampleCount: 0,
      samples: [],
      families: [],
    },
    postCloseConfirmed: null,
    stockEvents: null,
    complete: false,
    historyUsableFrom: 'next-trading-day',
  };
}

function mergeIntradayObservation(existing, input = {}) {
  const day = text(input.day);
  const observedAt = text(input.observedAt) || new Date().toISOString();
  const phase = text(input.sessionPhase);
  const base = existing && existing.day === day
    ? JSON.parse(JSON.stringify(existing))
    : emptyDailyRecord(day, observedAt);
  base.schemaVersion = STRATEGY_DAILY_EVENT_SCHEMA_VERSION;
  base.ruleVersion = STRATEGY_DAILY_EVENT_RULE_VERSION;
  base.updatedAt = observedAt;
  if (!INTRADAY_PHASES.has(phase)) return base;

  const families = (Array.isArray(input.mainlines) ? input.mainlines : [])
    .map(row => compactIntradayFamily(row, input.familyInfo))
    .filter(Boolean)
    .slice(0, 10);
  if (!families.length) return base;

  const observation = base.intradayObservation || emptyDailyRecord(day, observedAt).intradayObservation;
  const samples = Array.isArray(observation.samples) ? observation.samples : [];
  if (!samples.some(sample => sample.observedAt === observedAt)) {
    samples.push({ observedAt, sessionPhase: phase, families });
  }
  observation.samples = samples.slice(-STRATEGY_DAILY_EVENT_MAX_SAMPLES);
  observation.status = 'observed';
  observation.firstObservedAt = observation.firstObservedAt || observedAt;
  observation.lastObservedAt = observedAt;
  observation.sampleCount = observation.samples.length;

  const summaries = new Map((Array.isArray(observation.families) ? observation.families : [])
    .map(row => [text(row?.familyKey), { ...row }]).filter(([key]) => key));
  for (const family of families) {
    const current = summaries.get(family.familyKey) || {
      familyKey: family.familyKey,
      theme: family.theme,
      firstSeenAt: observedAt,
      firstResonanceAt: null,
      firstExpectedStarAt: null,
      firstConfirmedStarAt: null,
      lastSeenAt: observedAt,
      sampleCount: 0,
      bestRank: null,
      maxScore: null,
      last: null,
    };
    current.theme = family.theme || current.theme;
    current.lastSeenAt = observedAt;
    current.sampleCount = Number(current.sampleCount || 0) + 1;
    current.bestRank = family.rank > 0
      ? (current.bestRank == null ? family.rank : Math.min(current.bestRank, family.rank))
      : current.bestRank;
    current.maxScore = family.score == null
      ? current.maxScore
      : (current.maxScore == null ? family.score : Math.max(current.maxScore, family.score));
    if (family.resonanceSignal && !current.firstResonanceAt) current.firstResonanceAt = observedAt;
    if (family.stars.some(star => star.level === 'expected') && !current.firstExpectedStarAt) {
      current.firstExpectedStarAt = observedAt;
    }
    if (family.stars.some(star => star.level === 'confirmed') && !current.firstConfirmedStarAt) {
      current.firstConfirmedStarAt = observedAt;
    }
    current.last = family;
    summaries.set(family.familyKey, current);
  }
  observation.families = [...summaries.values()].sort((a, b) =>
    String(a.firstSeenAt).localeCompare(String(b.firstSeenAt)) || a.familyKey.localeCompare(b.familyKey));
  base.intradayObservation = observation;
  return base;
}

function collectStarEvidence(predict, snapshot) {
  const starCodes = new Set();
  const familyStatus = new Map();
  const noteFamily = (familyKey, status) => {
    const key = text(familyKey);
    if (!key) return;
    const current = familyStatus.get(key) || { observed: false, scanned: false, positive: false };
    current.observed = true;
    if (['qi', 'scanned-no-star'].includes(status)) current.scanned = true;
    familyStatus.set(key, current);
  };
  for (const candidate of (Array.isArray(predict?.candidates) ? predict.candidates : [])) {
    const familyKey = text(candidate?.familyKey || candidate?.key);
    noteFamily(familyKey, text(candidate?.l2VerificationStatus));
    for (const star of (Array.isArray(candidate?.stars) ? candidate.stars : [])) {
      const level = text(star?.level);
      const code = codeOf(star?.code);
      if (!code || !['expected', 'confirmed'].includes(level)) continue;
      starCodes.add(code);
      const status = familyStatus.get(familyKey) || { observed: true, scanned: false, positive: false };
      status.positive = true;
      status.scanned = true;
      familyStatus.set(familyKey, status);
    }
  }
  for (const row of (Array.isArray(predict?.top) ? predict.top : [])) {
    const level = text(row?.star?.level);
    const code = codeOf(row?.star?.code);
    if (code && ['expected', 'confirmed'].includes(level)) starCodes.add(code);
  }
  for (const row of (Array.isArray(predict?.starTransitions) ? predict.starTransitions : [])) {
    const code = codeOf(row?.code);
    if (code && text(row?.firstExpectedAt)) starCodes.add(code);
  }
  // 盘后冻结快照本身也是持久化证据。服务若在尾盘重启导致 predict 缺失,
  // 仍可使用快照中的 expected/confirmed 正证据;active 依旧不算明星。
  for (const mainline of (Array.isArray(snapshot?.mainlines) ? snapshot.mainlines : [])) {
    const familyKey = text(mainline?.familyKey || mainline?.key);
    noteFamily(familyKey, text(mainline?.l2VerificationStatus));
    for (const star of (Array.isArray(mainline?.starStocks) ? mainline.starStocks : [])) {
      const level = text(star?.level);
      const code = codeOf(star?.code);
      if (!code || !['expected', 'confirmed'].includes(level)) continue;
      starCodes.add(code);
      const status = familyStatus.get(familyKey) || { observed: true, scanned: false, positive: false };
      status.positive = true;
      status.scanned = true;
      familyStatus.set(familyKey, status);
    }
  }
  return { starCodes, familyStatus };
}

function buildFamilyEvidence(input, reasonByCode, limitCodes, starEvidence) {
  const byFamily = new Map();
  const familyInfo = input.familyInfo;
  for (const mainline of (Array.isArray(input.snapshot?.mainlines) ? input.snapshot.mainlines : [])) {
    const family = familyForMainline(mainline, familyInfo);
    if (!family.key) continue;
    const current = byFamily.get(family.key);
    const score = num(mainline?.score);
    if (!current || (score ?? -Infinity) > (current.snapshotScore ?? -Infinity)) {
      const resonanceBoards = Array.isArray(mainline?.resonanceBoards) ? mainline.resonanceBoards : [];
      const bestBreadth = resonanceBoards.map(board => board?.breadth).find(Boolean) || null;
      byFamily.set(family.key, {
        familyKey: family.key,
        theme: family.label,
        displayTheme: text(mainline?.theme) || family.label,
        snapshotScore: score,
        netInflow: num(mainline?.netInflow),
        boardGainPct: num(mainline?.boardGainPct),
        boardCount: Math.max(0, Number(mainline?.boardCount) || 0),
        bigGainCount: Math.max(0, Number(mainline?.bigGainCount) || 0),
        nearLimitCount: Math.max(0, Number(mainline?.nearLimitCount) || 0),
        breadth: bestBreadth,
        sourceMainline: mainline,
        limitUpCodes: [],
        starCodes: [],
      });
    }
  }

  for (const code of limitCodes) {
    const reason = reasonByCode.get(code);
    const family = reason ? familyForTheme(reason.finalBoardTopic, familyInfo) : null;
    if (!family?.key) continue;
    // 当日主因库出现、但盘中快照从未识别到的家族也必须出现在诊断中。
    // 它没有盘中资金/广度证据,因此会明确 dataMissing,不会被静默漏掉或误确认。
    if (!byFamily.has(family.key)) {
      byFamily.set(family.key, {
        familyKey: family.key,
        theme: family.label,
        displayTheme: family.label,
        snapshotScore: null,
        netInflow: null,
        boardGainPct: null,
        boardCount: 0,
        bigGainCount: 0,
        nearLimitCount: 0,
        breadth: null,
        sourceMainline: null,
        limitUpCodes: [],
        starCodes: [],
      });
    }
    byFamily.get(family.key).limitUpCodes.push(code);
    if (starEvidence.starCodes.has(code)) byFamily.get(family.key).starCodes.push(code);
  }

  return [...byFamily.values()].map(row => {
    const status = starEvidence.familyStatus.get(row.familyKey);
    const starEvidenceStatus = row.starCodes.length
      ? 'confirmed'
      : (status?.scanned ? 'scanned-no-star' : 'unscanned');
    const missingFields = [];
    const failReasons = [];
    if (!input.quality?.limitUpComplete) missingFields.push('limitUpDb');
    if (!input.quality?.mainReasonComplete) missingFields.push('mainReasonDb');
    if (row.netInflow == null) missingFields.push('netInflow');
    if (starEvidenceStatus === 'unscanned') missingFields.push('starEvidence');
    if (row.netInflow != null && row.netInflow <= 0) failReasons.push('net-inflow-not-positive');
    if (row.starCodes.length < 1) failReasons.push('no-confirmed-star');
    if (row.limitUpCodes.length < 2) failReasons.push('family-limit-up-count-below-2');
    const eligible = missingFields.length === 0 && failReasons.length === 0;
    return {
      familyKey: row.familyKey,
      theme: row.theme,
      displayTheme: row.displayTheme,
      snapshotScore: row.snapshotScore,
      netInflow: row.netInflow,
      boardGainPct: row.boardGainPct,
      boardCount: row.boardCount,
      bigGainCount: row.bigGainCount,
      nearLimitCount: row.nearLimitCount,
      breadth: row.breadth,
      limitUpCount: row.limitUpCodes.length,
      limitUpCodes: [...new Set(row.limitUpCodes)].sort(),
      starCount: [...new Set(row.starCodes)].length,
      starCodes: [...new Set(row.starCodes)].sort(),
      starEvidenceStatus,
      gates: {
        netInflowPositive: row.netInflow != null ? row.netInflow > 0 : null,
        hasStar: row.starCodes.length >= 1,
        familyLimitUpsAtLeast2: row.limitUpCodes.length >= 2,
        sourceDataComplete: !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete),
      },
      missingFields,
      failReasons,
      eligible,
      sourceMainline: row.sourceMainline,
    };
  });
}

function familyEvidenceCodes(mainline) {
  const codes = new Set();
  for (const code of (Array.isArray(mainline?.priorReasonCodes) ? mainline.priorReasonCodes : [])) {
    const normalized = codeOf(code);
    if (normalized) codes.add(normalized);
  }
  for (const row of (Array.isArray(mainline?.priorReasonStocks) ? mainline.priorReasonStocks : [])) {
    const normalized = codeOf(row?.code);
    if (normalized) codes.add(normalized);
  }
  for (const row of (Array.isArray(mainline?.leaders) ? mainline.leaders : [])) {
    const normalized = codeOf(row?.code);
    if (normalized && Number(row?.mainZt10Count) > 0) codes.add(normalized);
  }
  for (const row of (Array.isArray(mainline?.risingStocks) ? mainline.risingStocks : [])) {
    const normalized = codeOf(row?.code);
    if (normalized && row?.priorReason) codes.add(normalized);
  }
  return codes;
}

function buildStockEvents(input, confirmedFamilies, reasonByCode, limitCodes, starEvidence) {
  const events = [];
  const missingReasonCodes = [];
  const limitRows = Array.isArray(input.limitDb?.stocks) ? input.limitDb.stocks : [];
  for (const row of limitRows) {
    const code = codeOf(row?.code);
    if (!code || input.isExcluded?.(row)) continue;
    const reason = reasonByCode.get(code);
    const family = reason ? familyForTheme(reason.finalBoardTopic, input.familyInfo) : null;
    if (!family?.key) {
      missingReasonCodes.push(code);
      events.push({
        code,
        name: text(row?.name),
        familyKey: null,
        theme: null,
        event: 'data-missing',
        points: null,
        status: 'dataMissing',
        historyEligible: false,
        dataMissing: ['mainReasonFamily'],
      });
      continue;
    }
    const isStar = starEvidence.starCodes.has(code);
    const sourceComplete = !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete);
    events.push({
      code,
      name: text(row?.name || reason?.name),
      familyKey: family.key,
      theme: family.label,
      event: isStar ? 'star-limit-up' : 'ordinary-limit-up',
      points: isStar ? 20 : 15,
      status: sourceComplete ? 'confirmed' : 'provisional',
      historyEligible: sourceComplete,
      starEvidenceStatus: isStar ? 'confirmed' : 'not-confirmed',
      dataMissing: sourceComplete ? [] : [
        ...(!input.quality?.limitUpComplete ? ['limitUpDb'] : []),
        ...(!input.quality?.mainReasonComplete ? ['mainReasonDb'] : []),
      ],
      sourceReason: {
        finalBoardTopic: text(reason?.finalBoardTopic),
        finalDetailReason: text(reason?.finalDetailReason),
      },
    });
  }

  const closeByCode = new Map((Array.isArray(input.closeDb?.stocks) ? input.closeDb.stocks : [])
    .map(row => [codeOf(row?.code), row]).filter(([code]) => code));
  for (const family of confirmedFamilies) {
    const source = family.sourceMainline || {};
    for (const code of familyEvidenceCodes(source)) {
      if (limitCodes.has(code) || events.some(event => event.code === code)) continue;
      const closeRow = closeByCode.get(code);
      const gain = num(closeRow?.gain);
      if (gain == null || gain <= 5) continue;
      const complete = !!input.quality?.closeComplete;
      events.push({
        code,
        name: text(closeRow?.name),
        familyKey: family.familyKey,
        theme: family.theme,
        event: 'confirmed-mainline-big-gain',
        points: 8,
        closeGainPct: gain,
        status: complete ? 'confirmed' : 'provisional',
        historyEligible: complete,
        dataMissing: complete ? [] : ['closeDb'],
      });
    }
  }

  const order = { 'star-limit-up': 0, 'ordinary-limit-up': 1, 'confirmed-mainline-big-gain': 2, 'data-missing': 3 };
  events.sort((a, b) => (order[a.event] ?? 9) - (order[b.event] ?? 9) || a.code.localeCompare(b.code));
  return {
    complete: !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete && input.quality?.closeComplete),
    counts: {
      starLimitUp: events.filter(row => row.event === 'star-limit-up').length,
      ordinaryLimitUp: events.filter(row => row.event === 'ordinary-limit-up').length,
      confirmedMainlineBigGain: events.filter(row => row.event === 'confirmed-mainline-big-gain').length,
      dataMissing: events.filter(row => row.status === 'dataMissing').length,
    },
    missingReasonCodes: [...new Set(missingReasonCodes)].sort(),
    events,
  };
}

function buildPostCloseRecord(existing, input = {}) {
  const generatedAt = text(input.generatedAt) || new Date().toISOString();
  const day = text(input.day);
  const base = existing && existing.day === day
    ? JSON.parse(JSON.stringify(existing))
    : emptyDailyRecord(day, generatedAt);
  const limitRows = (Array.isArray(input.limitDb?.stocks) ? input.limitDb.stocks : [])
    .filter(row => !input.isExcluded?.(row));
  const limitCodes = new Set(limitRows.map(row => codeOf(row?.code)).filter(Boolean));
  const reasonByCode = new Map((Array.isArray(input.mainReasonDb?.stocks) ? input.mainReasonDb.stocks : [])
    .map(row => [codeOf(row?.code), row]).filter(([code]) => code));
  const starEvidence = collectStarEvidence(input.predict, input.snapshot);
  const familyEvidence = buildFamilyEvidence(input, reasonByCode, limitCodes, starEvidence);
  const confirmedFamilies = familyEvidence
    .filter(row => row.eligible)
    .sort((a, b) =>
      b.limitUpCount - a.limitUpCount ||
      b.starCount - a.starCount ||
      (b.boardGainPct ?? -Infinity) - (a.boardGainPct ?? -Infinity) ||
      (b.netInflow ?? -Infinity) - (a.netInflow ?? -Infinity) ||
      (b.snapshotScore ?? -Infinity) - (a.snapshotScore ?? -Infinity) ||
      a.familyKey.localeCompare(b.familyKey))
    .slice(0, 2);
  const sourceComplete = !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete && input.snapshot?.mainlines?.length);
  base.schemaVersion = STRATEGY_DAILY_EVENT_SCHEMA_VERSION;
  base.ruleVersion = STRATEGY_DAILY_EVENT_RULE_VERSION;
  base.updatedAt = generatedAt;
  base.postCloseConfirmed = {
    generatedAt,
    status: sourceComplete ? (confirmedFamilies.length ? 'confirmed' : 'no-qualified-mainline') : 'dataMissing',
    complete: sourceComplete,
    historyUsableFrom: 'next-trading-day',
    rule: {
      maxMainlines: 2,
      netInflow: '>0',
      minStars: 1,
      minFamilyLimitUps: 2,
      requireCompleteLimitUpAndMainReason: true,
      strengthBreadth: 'persisted-for-calibration-no-extra-threshold',
    },
    sourceStatus: {
      snapshot: !!input.snapshot?.mainlines?.length,
      limitUpDb: !!input.quality?.limitUpComplete,
      mainReasonDb: !!input.quality?.mainReasonComplete,
      closeDb: !!input.quality?.closeComplete,
      missingMainReasonCodes: Array.isArray(input.quality?.missingMainReasonCodes)
        ? input.quality.missingMainReasonCodes.slice() : [],
    },
    confirmedMainlines: confirmedFamilies.map((row, index) => ({
      rank: index + 1,
      familyKey: row.familyKey,
      theme: row.theme,
      displayTheme: row.displayTheme,
      netInflow: row.netInflow,
      boardGainPct: row.boardGainPct,
      boardCount: row.boardCount,
      bigGainCount: row.bigGainCount,
      nearLimitCount: row.nearLimitCount,
      breadth: row.breadth,
      limitUpCount: row.limitUpCount,
      limitUpCodes: row.limitUpCodes,
      starCount: row.starCount,
      starCodes: row.starCodes,
    })),
    familyEvidence: familyEvidence.map(({ sourceMainline, ...row }) => row),
  };
  base.stockEvents = buildStockEvents(input, confirmedFamilies, reasonByCode, limitCodes, starEvidence);
  base.complete = !!(base.postCloseConfirmed.complete && base.stockEvents.complete);
  return base;
}

module.exports = {
  STRATEGY_DAILY_EVENT_SCHEMA_VERSION,
  STRATEGY_DAILY_EVENT_RULE_VERSION,
  STRATEGY_DAILY_EVENT_MAX_SAMPLES,
  mergeIntradayObservation,
  buildPostCloseRecord,
};
