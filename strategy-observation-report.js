'use strict';

const fs = require('fs/promises');
const path = require('path');

const STRATEGY_OBSERVATION_REPORT_SCHEMA_VERSION = 1;

function text(value) {
  return String(value == null ? '' : value).trim();
}

function codeOf(value) {
  return text(value?.code ?? value).replace(/\D/g, '').slice(0, 6);
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function minutesBetween(start, end) {
  const startMs = Date.parse(start || '');
  const endMs = Date.parse(end || '');
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  return Number(((endMs - startMs) / 60000).toFixed(1));
}

function marketOpenIso(day) {
  return /^20\d{2}-\d{2}-\d{2}$/.test(text(day)) ? `${day}T01:30:00.000Z` : '';
}

function collectStarTimeline(dailyEvents = {}) {
  const samples = Array.isArray(dailyEvents?.intradayObservation?.samples)
    ? dailyEvents.intradayObservation.samples : [];
  const expected = new Map();
  const confirmed = new Map();
  for (const sample of samples) {
    for (const family of (Array.isArray(sample?.families) ? sample.families : [])) {
      for (const star of (Array.isArray(family?.stars) ? family.stars : [])) {
        const code = codeOf(star);
        if (!code) continue;
        const item = {
          code,
          name: text(star?.name),
          familyKey: text(family?.familyKey),
          theme: text(family?.theme),
          observedAt: text(sample?.observedAt),
        };
        if (star?.level === 'expected' && !expected.has(code)) expected.set(code, item);
        if (star?.level === 'confirmed' && !confirmed.has(code)) confirmed.set(code, item);
      }
    }
  }
  const predictionTransitions = Array.isArray(dailyEvents?.prediction?.starTransitions)
    ? dailyEvents.prediction.starTransitions : [];
  for (const transition of predictionTransitions) {
    const code = codeOf(transition);
    if (!code) continue;
    if (transition.firstExpectedAt && !expected.has(code)) {
      expected.set(code, {
        code,
        name: text(transition?.name),
        familyKey: text(transition?.mainlineKey || transition?.familyKey),
        theme: text(transition?.theme),
        observedAt: text(transition.firstExpectedAt),
      });
    }
    if (transition.firstConfirmedAt && !confirmed.has(code)) {
      confirmed.set(code, {
        code,
        name: text(transition?.name),
        familyKey: text(transition?.mainlineKey || transition?.familyKey),
        theme: text(transition?.theme),
        observedAt: text(transition.firstConfirmedAt),
      });
    }
  }
  return { expected, confirmed };
}

function summarizeL2Jobs(jobs = []) {
  const list = Array.isArray(jobs) ? jobs : [];
  const totals = list.reduce((sum, job) => sum + Math.max(0, Number(job?.total || 0)), 0);
  const scanned = list.reduce((sum, job) => sum + Math.max(0, Number(job?.scanned || 0)), 0);
  const resultRows = list.reduce((sum, job) => sum + Math.max(0,
    Number(job?.metrics?.resultRows ?? (Array.isArray(job?.results) ? job.results.length : 0))), 0);
  const byStatus = {};
  for (const job of list) {
    const status = text(job?.status || 'unknown');
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  return {
    jobCount: list.length,
    byStatus,
    stockTotal: totals,
    scanned,
    resultRows,
    coveragePct: totals ? Number((Math.min(scanned, totals) / totals * 100).toFixed(1)) : null,
    resultCoveragePct: totals ? Number((Math.min(resultRows, totals) / totals * 100).toFixed(1)) : null,
    boardNames: unique(list.map(job => text(job?.boardName))),
  };
}

function summarizeMainlineTiming(day, dailyEvents = {}) {
  const openAt = marketOpenIso(day);
  const families = Array.isArray(dailyEvents?.intradayObservation?.families)
    ? dailyEvents.intradayObservation.families : [];
  return families.map(family => ({
    familyKey: text(family?.familyKey),
    theme: text(family?.theme),
    firstSeenAt: family?.firstSeenAt || null,
    firstSeenMinutesAfterOpen: minutesBetween(openAt, family?.firstSeenAt),
    firstResonanceAt: family?.firstResonanceAt || null,
    firstResonanceMinutesAfterOpen: minutesBetween(openAt, family?.firstResonanceAt),
    firstExpectedStarAt: family?.firstExpectedStarAt || null,
    firstExpectedStarMinutesAfterOpen: minutesBetween(openAt, family?.firstExpectedStarAt),
    firstConfirmedStarAt: family?.firstConfirmedStarAt || null,
    firstConfirmedStarMinutesAfterOpen: minutesBetween(openAt, family?.firstConfirmedStarAt),
    sampleCount: Number(family?.sampleCount || 0),
    bestRank: numberOrNull(family?.bestRank),
    maxScore: numberOrNull(family?.maxScore),
  })).sort((a, b) =>
    String(a.firstSeenAt || '').localeCompare(String(b.firstSeenAt || '')) || a.familyKey.localeCompare(b.familyKey));
}

function predictionBlocks(prediction = {}) {
  if (prediction?.bySource) {
    return [prediction.bySource.eastmoney, prediction.bySource.ths].filter(Boolean);
  }
  return [prediction];
}

function predictionMainlineCount(prediction = {}) {
  return predictionBlocks(prediction).reduce((sum, block) =>
    sum + (Array.isArray(block?.top) ? block.top.length : 0), 0);
}

function buildStrategyObservationReport(input = {}) {
  const day = text(input.day || input.context?.day || input.dailyEvents?.day);
  const generatedAt = text(input.generatedAt || new Date().toISOString());
  const context = input.context || {};
  const dailyEvents = input.dailyEvents || {};
  const prediction = input.prediction || {};
  const l2 = summarizeL2Jobs(input.l2Jobs);
  const timeline = collectStarTimeline({ ...dailyEvents, prediction });
  const expectedCodes = [...timeline.expected.keys()];
  const confirmedCodes = [...timeline.confirmed.keys()];
  const convertedCodes = expectedCodes.filter(code => timeline.confirmed.has(code));
  const unresolvedExpectedCodes = expectedCodes.filter(code => !timeline.confirmed.has(code));
  const sourceStatus = context?.sourceStatus || {};
  const missingSources = Object.entries(sourceStatus)
    .filter(([, status]) => !status?.complete || status?.stale)
    .map(([source]) => source);
  const mainlineCount = predictionMainlineCount(prediction);
  let noMainlineAssessment = null;
  if (!mainlineCount) {
    noMainlineAssessment = confirmedCodes.length || expectedCodes.length
      ? 'positive-star-without-mainline-investigate'
      : (missingSources.includes('eastmoney') ? 'canonical-source-incomplete' : 'reasonable-no-positive-l2-star');
  }
  const issues = [];
  if (missingSources.length) issues.push(`source-incomplete:${missingSources.join(',')}`);
  if (l2.jobCount && l2.coveragePct != null && l2.coveragePct < 100) issues.push('l2-coverage-incomplete');
  if (!l2.jobCount) issues.push('l2-not-scanned');
  if (noMainlineAssessment === 'positive-star-without-mainline-investigate') {
    issues.push('positive-star-without-mainline');
  }
  if (context?.missingReasonCodes?.length) issues.push('main-reason-coverage-incomplete');

  return {
    schemaVersion: STRATEGY_OBSERVATION_REPORT_SCHEMA_VERSION,
    day,
    generatedAt,
    scope: 'diagnostic-only',
    officialV2PathChanged: false,
    sourceStatus,
    contextReadiness: context?.readyFor || {},
    missingFields: Array.isArray(context?.missingFields) ? context.missingFields.slice() : [],
    l2,
    stars: {
      expectedCount: expectedCodes.length,
      confirmedCount: confirmedCodes.length,
      convertedExpectedCount: convertedCodes.length,
      conversionPct: expectedCodes.length
        ? Number((convertedCodes.length / expectedCodes.length * 100).toFixed(1)) : null,
      expected: [...timeline.expected.values()],
      confirmed: [...timeline.confirmed.values()],
      convertedCodes,
      unresolvedExpectedCodes,
    },
    mainline: {
      predictionCount: mainlineCount,
      recordState: text(prediction?.recordState),
      noMainlineAssessment,
      timing: summarizeMainlineTiming(day, dailyEvents),
    },
    issues,
    healthy: issues.length === 0,
  };
}

function renderStrategyObservationMarkdown(report) {
  const sources = Object.entries(report?.sourceStatus || {}).map(([source, status]) =>
    `- ${source}: ${status?.complete && !status?.stale ? 'complete' : 'incomplete'}; rows=${Number(status?.rowCount || 0)}; asOf=${status?.asOf || '-'}`);
  const timing = (report?.mainline?.timing || []).map(row =>
    `- ${row.theme || row.familyKey}: first=${row.firstSeenMinutesAfterOpen ?? '-'}m, expected=${row.firstExpectedStarMinutesAfterOpen ?? '-'}m, confirmed=${row.firstConfirmedStarMinutesAfterOpen ?? '-'}m`);
  return [
    `# Strategy Daily Observation - ${report?.day || ''}`,
    '',
    `Generated: ${report?.generatedAt || ''}`,
    '',
    '## Source Facts',
    ...(sources.length ? sources : ['- No source facts']),
    '',
    '## L2 Coverage',
    `- jobs=${Number(report?.l2?.jobCount || 0)}, scanned=${Number(report?.l2?.scanned || 0)}/${Number(report?.l2?.stockTotal || 0)}, coverage=${report?.l2?.coveragePct ?? '-'}%`,
    '',
    '## Star Conversion',
    `- expected=${Number(report?.stars?.expectedCount || 0)}, confirmed=${Number(report?.stars?.confirmedCount || 0)}, converted=${Number(report?.stars?.convertedExpectedCount || 0)}, conversion=${report?.stars?.conversionPct ?? '-'}%`,
    '',
    '## Mainline Timing',
    ...(timing.length ? timing : ['- No observed mainline family']),
    '',
    '## Assessment',
    `- mainlineCount=${Number(report?.mainline?.predictionCount || 0)}`,
    `- noMainline=${report?.mainline?.noMainlineAssessment || '-'}`,
    `- issues=${(report?.issues || []).join(', ') || 'none'}`,
    '',
  ].join('\n');
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, content, 'utf8');
  try {
    await fs.rename(temp, file);
  } catch (error) {
    await fs.rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

async function writeStrategyObservationReport(options = {}) {
  const rootDir = path.resolve(options.rootDir || path.join(__dirname, 'strategy-data', 'quality-reports'));
  const report = options.report || buildStrategyObservationReport(options);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(text(report?.day))) throw new Error('observation report day must be YYYY-MM-DD');
  const jsonFile = path.join(rootDir, `${report.day}.json`);
  const markdownFile = path.join(rootDir, `${report.day}.md`);
  await atomicWrite(jsonFile, JSON.stringify(report, null, 2));
  await atomicWrite(markdownFile, renderStrategyObservationMarkdown(report));
  return { report, jsonFile, markdownFile };
}

module.exports = {
  STRATEGY_OBSERVATION_REPORT_SCHEMA_VERSION,
  buildStrategyObservationReport,
  renderStrategyObservationMarkdown,
  writeStrategyObservationReport,
  summarizeL2Jobs,
  summarizeMainlineTiming,
};
