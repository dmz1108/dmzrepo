'use strict';

const STRATEGY_DAILY_EVENT_SCHEMA_VERSION = 2;
const STRATEGY_DAILY_EVENT_RULE_VERSION = 'leader-scoring-v3-events-v2';
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
  const positiveByCode = new Map();
  const familyStatus = new Map();
  const noteFamily = (familyKey, status) => {
    const key = text(familyKey);
    if (!key) return;
    const current = familyStatus.get(key) || {
      observed: false, positiveCodes: new Set(), scannedCodes: new Set(), coversAllCandidates: false,
    };
    current.observed = true;
    current.l2VerificationStatus = text(status) || current.l2VerificationStatus || '';
    familyStatus.set(key, current);
  };
  const notePositive = (familyKey, rawCode, source) => {
    const code = codeOf(rawCode);
    const key = text(familyKey);
    if (!code) return;
    // 明星等级取自股票自身盘中证据,盘后家族归属可变化;不能把正证据锁死在盘中家族。
    positiveByCode.set(code, { status: 'positive', source, observedFamilyKey: key || null });
    noteFamily(key, 'qi');
    const family = familyStatus.get(key);
    if (family) family.positiveCodes.add(code);
  };
  const noteCoverage = (candidate, familyKey) => {
    const family = familyStatus.get(familyKey);
    if (!family) return;
    const coverage = candidate?.scanCoverage || candidate?.l2Coverage || {};
    const covered = [
      ...(Array.isArray(candidate?.scannedCodes) ? candidate.scannedCodes : []),
      ...(Array.isArray(candidate?.l2ScannedCodes) ? candidate.l2ScannedCodes : []),
      ...(Array.isArray(candidate?.completedCoveredCodes) ? candidate.completedCoveredCodes : []),
      ...(Array.isArray(coverage?.codes) ? coverage.codes : []),
    ].map(codeOf).filter(Boolean);
    for (const code of covered) family.scannedCodes.add(code);
    family.coversAllCandidates = family.coversAllCandidates || candidate?.allCandidatesScanned === true ||
      candidate?.scanCoverageAllCandidates === true || coverage?.coversAllCandidates === true;
  };

  for (const candidate of (Array.isArray(predict?.candidates) ? predict.candidates : [])) {
    const familyKey = text(candidate?.familyKey || candidate?.key);
    noteFamily(familyKey, text(candidate?.l2VerificationStatus));
    noteCoverage(candidate, familyKey);
    for (const star of (Array.isArray(candidate?.stars) ? candidate.stars : [])) {
      const level = text(star?.level);
      if (['expected', 'confirmed'].includes(level)) notePositive(familyKey, star?.code, 'predict-candidate-star');
    }
  }
  for (const row of (Array.isArray(predict?.top) ? predict.top : [])) {
    const level = text(row?.star?.level);
    if (['expected', 'confirmed'].includes(level)) {
      notePositive(text(row?.familyKey || row?.key), row?.star?.code, 'predict-top-star');
    }
  }
  for (const row of (Array.isArray(predict?.starTransitions) ? predict.starTransitions : [])) {
    if (text(row?.firstExpectedAt)) {
      notePositive(text(row?.mainlineKey || row?.familyKey), row?.code, 'predict-star-transition');
    }
  }
  // 冻结快照中的 expected/confirmed 是持久化正证据;active 不是。
  for (const mainline of (Array.isArray(snapshot?.mainlines) ? snapshot.mainlines : [])) {
    const familyKey = text(mainline?.familyKey || mainline?.key);
    noteFamily(familyKey, text(mainline?.l2VerificationStatus));
    noteCoverage(mainline, familyKey);
    for (const star of (Array.isArray(mainline?.starStocks) ? mainline.starStocks : [])) {
      const level = text(star?.level);
      if (['expected', 'confirmed'].includes(level)) notePositive(familyKey, star?.code, 'frozen-snapshot-star');
    }
  }

  const statusForStock = (rawCode, familyKey) => {
    const code = codeOf(rawCode);
    const positive = positiveByCode.get(code);
    if (positive?.status === 'positive') return positive;
    const family = familyStatus.get(text(familyKey));
    const l2Status = text(family?.l2VerificationStatus);
    const explicitlyCovered = family?.scannedCodes?.has(code) || family?.coversAllCandidates === true;
    if (explicitlyCovered && ['qi', 'scanned-no-star'].includes(l2Status)) {
      return { status: 'scanned-no-star', source: family?.coversAllCandidates ? 'family-full-coverage' : 'stock-scan-coverage' };
    }
    return { status: 'unscanned', source: 'no-explicit-stock-coverage' };
  };
  return { positiveByCode, familyStatus, statusForStock };
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
    if (starEvidence.statusForStock(code, family.key).status === 'positive') {
      byFamily.get(family.key).starCodes.push(code);
    }
  }

  return [...byFamily.values()].map(row => {
    const status = starEvidence.familyStatus.get(row.familyKey);
    const starEvidenceStatus = row.starCodes.length
      ? 'confirmed'
      : (status?.coversAllCandidates && ['qi', 'scanned-no-star'].includes(text(status?.l2VerificationStatus))
          ? 'scanned-no-star' : 'unscanned');
    const missingFields = [];
    const failReasons = [];
    if (!input.quality?.limitUpComplete) missingFields.push('limitUpDb');
    if (!input.quality?.mainReasonComplete) missingFields.push('mainReasonDb');
    if (input.quality?.snapshotStatus !== 'ok' || input.quality?.snapshotUsable !== true) missingFields.push('snapshot');
    if (row.netInflow == null) missingFields.push('netInflow');
    if (starEvidenceStatus === 'unscanned') missingFields.push('starEvidence');
    if (row.netInflow != null && row.netInflow <= 0) failReasons.push('net-inflow-not-positive');
    if (row.starCodes.length < 1) failReasons.push('no-confirmed-star');
    if (row.limitUpCodes.length < 2) failReasons.push('family-limit-up-count-below-2');
    const eligible = missingFields.length === 0 && failReasons.length === 0;
    const reconstructedEligible = input.quality?.snapshotReconstructed === true &&
      missingFields.every(field => field === 'snapshot') && failReasons.length === 0;
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
        sourceDataComplete: !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete &&
          input.quality?.snapshotStatus === 'ok' && input.quality?.snapshotUsable === true),
      },
      missingFields,
      failReasons,
      eligible,
      reconstructedEligible,
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
  const rowsAuthoritative = input.quality?.limitUpComplete === true;
  const snapshotUsable = input.quality?.snapshotStatus === 'ok' && input.quality?.snapshotUsable === true;
  const mainlineKnowable = rowsAuthoritative && input.quality?.mainReasonComplete === true && snapshotUsable;
  const closeComplete = input.quality?.closeComplete === true;
  const missingReasonSet = new Set((Array.isArray(input.quality?.missingMainReasonCodes)
    ? input.quality.missingMainReasonCodes : []).map(codeOf).filter(Boolean));

  if (rowsAuthoritative) {
    for (const row of limitRows) {
      const code = codeOf(row?.code);
      if (!code || input.isExcluded?.(row)) continue;
      const reason = reasonByCode.get(code);
      const family = !missingReasonSet.has(code) && reason
        ? familyForTheme(reason.finalBoardTopic, input.familyInfo) : null;
      if (!family?.key) {
        missingReasonCodes.push(code);
        events.push({
          code,
          name: text(row?.name || reason?.name),
          familyKey: null,
          theme: null,
          event: 'data-missing',
          points: null,
          status: 'dataMissing',
          historyEligible: false,
          familyEvidenceStatus: 'missing',
          dataMissing: ['mainReasonFamily'],
        });
        continue;
      }
      const starStatus = starEvidence.statusForStock(code, family.key);
      const isStar = starStatus.status === 'positive';
      events.push({
        code,
        name: text(row?.name || reason?.name),
        familyKey: family.key,
        theme: family.label,
        event: isStar ? 'star-limit-up' : 'ordinary-limit-up',
        points: isStar ? 20 : 15,
        status: 'confirmed',
        historyEligible: true,
        familyEvidenceStatus: 'reliable',
        starEvidenceStatus: isStar ? 'confirmed'
          : (starStatus.status === 'scanned-no-star' ? 'not-confirmed' : 'unscanned'),
        starEvidenceSource: starStatus.source,
        dataMissing: [],
        sourceReason: {
          finalBoardTopic: text(reason?.finalBoardTopic),
          finalDetailReason: text(reason?.finalDetailReason),
        },
      });
    }
  }

  const closeByCode = new Map((Array.isArray(input.closeDb?.stocks) ? input.closeDb.stocks : [])
    .map(row => [codeOf(row?.code), row]).filter(([code]) => code));
  const familyMembers = new Map(confirmedFamilies.map(family => [
    family.familyKey,
    familyEvidenceCodes(family.sourceMainline || {}),
  ]));

  if (rowsAuthoritative && mainlineKnowable && closeComplete) {
    for (const family of confirmedFamilies) {
      for (const code of (familyMembers.get(family.familyKey) || [])) {
        if (limitCodes.has(code)) continue;
        const closeRow = closeByCode.get(code);
        if (input.isExcluded?.(closeRow || reasonByCode.get(code) || { code })) continue;
        const gain = num(closeRow?.gain);
        if (gain == null || gain <= 5) continue;
        events.push({
          code,
          name: text(closeRow?.name),
          familyKey: family.familyKey,
          theme: family.theme,
          event: 'confirmed-mainline-big-gain',
          points: 8,
          closeGainPct: gain,
          status: 'confirmed',
          historyEligible: true,
          dataMissing: [],
          sourceReason: { confirmedMainline: true, snapshotStatus: 'ok' },
        });
      }
    }
  } else if (rowsAuthoritative && mainlineKnowable && !closeComplete) {
    // R5b:主线归属已知但收盘价不可用,只阻断该主线的成员股;非成员仍可确定为 none 0。
    for (const family of confirmedFamilies) {
      for (const code of (familyMembers.get(family.familyKey) || [])) {
        if (limitCodes.has(code)) continue;
        if (input.isExcluded?.(closeByCode.get(code) || reasonByCode.get(code) || { code })) continue;
        events.push({
          code,
          name: text(reasonByCode.get(code)?.name),
          familyKey: family.familyKey,
          theme: family.theme,
          event: 'data-missing',
          points: null,
          status: 'dataMissing',
          historyEligible: false,
          dataMissing: ['closePrice'],
          sourceReason: { confirmedMainlineMember: true, snapshotStatus: 'ok' },
        });
      }
    }
  } else if (rowsAuthoritative && !mainlineKnowable && closeComplete) {
    // R5:主线不可确认时,所有收盘涨幅>5%的未板股都显式阻断,不能把未知归属写成 none 0。
    for (const [code, closeRow] of closeByCode) {
      if (limitCodes.has(code) || input.isExcluded?.(closeRow)) continue;
      const gain = num(closeRow?.gain);
      if (gain == null || gain <= 5) continue;
      events.push({
        code,
        name: text(closeRow?.name),
        familyKey: null,
        theme: null,
        event: 'data-missing',
        points: null,
        closeGainPct: gain,
        status: 'dataMissing',
        historyEligible: false,
        dataMissing: ['confirmedMainlineUnknown'],
      });
    }
  }

  const order = { 'star-limit-up': 0, 'ordinary-limit-up': 1, 'confirmed-mainline-big-gain': 2, 'data-missing': 3 };
  events.sort((a, b) => (order[a.event] ?? 9) - (order[b.event] ?? 9) || a.code.localeCompare(b.code));
  const unresolvedFamilyCount = events.filter(row => row.dataMissing?.includes('mainReasonFamily')).length;
  const attributedLimitUpCount = events.filter(row =>
    row.event === 'star-limit-up' || row.event === 'ordinary-limit-up').length;
  const starEvidenceStatusByFamily = {};
  for (const row of events.filter(event => event.familyKey && event.starEvidenceStatus)) {
    const bucket = starEvidenceStatusByFamily[row.familyKey] || { confirmed: 0, notConfirmed: 0, unscanned: 0 };
    if (row.starEvidenceStatus === 'confirmed') bucket.confirmed += 1;
    else if (row.starEvidenceStatus === 'not-confirmed') bucket.notConfirmed += 1;
    else bucket.unscanned += 1;
    starEvidenceStatusByFamily[row.familyKey] = bucket;
  }
  const noneDeterminable = rowsAuthoritative && (mainlineKnowable || closeComplete);
  return {
    // 保持 v1 既有语义:complete 只表示三库来源完整;逐股归属缺口由 coverageComplete/dataMissing 表达。
    complete: !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete && input.quality?.closeComplete),
    rowsAuthoritative,
    noneDeterminable,
    mainlineKnowable,
    snapshotStatus: text(input.quality?.snapshotStatus) || 'missing',
    snapshotEvidence: Array.isArray(input.quality?.snapshotEvidence)
      ? input.quality.snapshotEvidence.slice() : [],
    starEvidenceStatusByFamily,
    coverageComplete: unresolvedFamilyCount === 0,
    attributedLimitUpCount,
    unresolvedFamilyCount,
    familyCoveragePct: limitRows.length
      ? Number((attributedLimitUpCount / limitRows.length * 100).toFixed(2))
      : null,
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
  const sortFamilies = rows => rows
    .sort((a, b) =>
      b.limitUpCount - a.limitUpCount ||
      b.starCount - a.starCount ||
      (b.boardGainPct ?? -Infinity) - (a.boardGainPct ?? -Infinity) ||
      (b.netInflow ?? -Infinity) - (a.netInflow ?? -Infinity) ||
      (b.snapshotScore ?? -Infinity) - (a.snapshotScore ?? -Infinity) ||
      a.familyKey.localeCompare(b.familyKey))
    .slice(0, 2);
  const confirmedFamilies = sortFamilies(familyEvidence.filter(row => row.eligible));
  const snapshotStatus = text(input.quality?.snapshotStatus) || 'missing';
  const snapshotUsable = snapshotStatus === 'ok' && input.quality?.snapshotUsable === true;
  // A usable frozen snapshot with zero rows is a complete "no qualified
  // mainline" conclusion, not missing data. The snapshot loader already owns
  // contamination/readability checks, so row count must not redefine quality.
  const sourceComplete = !!(input.quality?.limitUpComplete && input.quality?.mainReasonComplete &&
    snapshotUsable && Array.isArray(input.snapshot?.mainlines));
  const reconstructed = input.quality?.snapshotReconstructed === true;
  const displayFamilies = reconstructed
    ? sortFamilies(familyEvidence.filter(row => row.reconstructedEligible))
    : confirmedFamilies;
  base.schemaVersion = STRATEGY_DAILY_EVENT_SCHEMA_VERSION;
  base.ruleVersion = STRATEGY_DAILY_EVENT_RULE_VERSION;
  base.updatedAt = generatedAt;
  base.postCloseConfirmed = {
    generatedAt,
    status: reconstructed ? 'reconstructed'
      : (sourceComplete ? (confirmedFamilies.length ? 'confirmed' : 'no-qualified-mainline') : 'dataMissing'),
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
      snapshot: snapshotUsable,
      snapshotStatus,
      snapshotEvidence: Array.isArray(input.quality?.snapshotEvidence)
        ? input.quality.snapshotEvidence.slice() : [],
      limitUpDb: !!input.quality?.limitUpComplete,
      mainReasonDb: !!input.quality?.mainReasonComplete,
      closeDb: !!input.quality?.closeComplete,
      missingMainReasonCodes: Array.isArray(input.quality?.missingMainReasonCodes)
        ? input.quality.missingMainReasonCodes.slice() : [],
    },
    confirmedMainlines: displayFamilies.map((row, index) => ({
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
  base.eventCoverageComplete = !!base.stockEvents.coverageComplete;
  return base;
}

module.exports = {
  STRATEGY_DAILY_EVENT_SCHEMA_VERSION,
  STRATEGY_DAILY_EVENT_RULE_VERSION,
  STRATEGY_DAILY_EVENT_MAX_SAMPLES,
  mergeIntradayObservation,
  buildPostCloseRecord,
};
