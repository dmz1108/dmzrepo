#!/usr/bin/env node
// Historical event research only: supplied signals may contain retrospective corrections.
const fs = require('node:fs');
const crypto = require('node:crypto');

function quantile(values, q) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * q;
  return sorted[Math.floor(index)] * (1 - index % 1) + sorted[Math.ceil(index)] * (index % 1);
}

function summarize(rows, costsBps = [0, 20, 50]) {
  const byDay = new Map();
  for (const row of rows) {
    if (!byDay.has(row.day)) byDay.set(row.day, []);
    byDay.get(row.day).push(row.grossPct);
  }
  const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const values = rows.map(row => row.grossPct);
  const totalWins = rows.filter(row => row.grossPct > 0).length;
  const gains = values.filter(value => value > 0).reduce((a, b) => a + b, 0);
  const losses = -values.filter(value => value < 0).reduce((a, b) => a + b, 0);
  return {
    n: rows.length, signalDays: byDay.size,
    mean: average(values), median: quantile(values, 0.5),
    dayEqualWeightMean: average([...byDay.values()].map(average)),
    meanExcessVsIndex: average(rows.filter(row => Number.isFinite(row.excessVsIndexPct)).map(row => row.excessVsIndexPct)),
    winPct: rows.length ? totalWins / rows.length * 100 : null,
    min: rows.length ? Math.min(...values) : null,
    max: rows.length ? Math.max(...values) : null,
    p10: quantile(values, 0.1),
    meanHoldingLowPct: average(rows.map(row => row.holdingLowPct)),
    profitFactor: losses > 0 ? gains / losses : null,
    openingNearLimit: rows.filter(row => row.openingNearLimit).length,
    assumedNetMean: Object.fromEntries(costsBps.map(cost => [cost,
      rows.length ? average(values) - cost / 100 : null])),
  };
}

function evaluate(research, history) {
  const index = history.rows.find(row => row.symbol === 'sh000001');
  if (!index?.bars?.length) throw new Error('Missing reference trading calendar');
  const calendar = index.bars.map(bar => bar.day);
  if (new Set(calendar).size !== calendar.length
    || calendar.some((day, i) => i > 0 && day <= calendar[i - 1])) throw new Error('Invalid trading calendar');
  const byCode = new Map(history.rows.filter(row => row.symbol !== 'sh000001')
    .map(row => [row.code, new Map(row.bars.map(bar => [bar.day, bar]))]));
  const julyConfirmedFamilies = new Set(research.rows.julyStars
    .filter(row => row.predictLevel === 'confirmed').map(row => `${row.day}:${row.family}`));
  const cohorts = {
    augustConfirmed: research.rows.augustStars,
    augustLeaders: research.rows.augustLeaders,
    julyConfirmed: research.rows.julyStars.filter(row => row.predictLevel === 'confirmed'),
    julyExpected: research.rows.julyStars.filter(row => row.predictLevel === 'expected'),
    julyLeaders: research.rows.julyLeaders,
    julyLeadersConfirmedMainline: research.rows.julyLeaders
      .filter(row => julyConfirmedFamilies.has(`${row.day}:${row.family}`)),
  };
  const models = [
    { key: 'closeD0-to-closeD1', entryOffset: 0, entryField: 'close', exitOffset: 1 },
    { key: 'closeD0-to-closeD3', entryOffset: 0, entryField: 'close', exitOffset: 3 },
    { key: 'openD1-to-closeD2', entryOffset: 1, entryField: 'open', exitOffset: 2 },
    { key: 'openD1-to-closeD3', entryOffset: 1, entryField: 'open', exitOffset: 3 },
  ];
  const results = {}, mismatches = [];
  for (const [cohort, signals] of Object.entries(cohorts)) {
    const keys = signals.map(signal => `${signal.day}:${signal.code}`);
    if (new Set(keys).size !== keys.length) throw new Error('Duplicate signals: ' + cohort);
    results[cohort] = { observed: signals.length, models: {} };
    for (const model of models) {
      const accepted = [], rejected = [];
      for (const signal of signals) {
        const i = calendar.indexOf(signal.day), bars = byCode.get(signal.code);
        const entryDay = calendar[i + model.entryOffset], exitDay = calendar[i + model.exitOffset];
        if (i < 0 || !entryDay || !exitDay) { rejected.push({ day: signal.day, code: signal.code, reason: 'missing-calendar-date' }); continue; }
        const requiredDays = calendar.slice(i, i + model.exitOffset + 1);
        const window = requiredDays.map(day => bars?.get(day));
        const validBar = bar => bar && ['open', 'close', 'high', 'low'].every(key => Number.isFinite(bar[key]) && bar[key] > 0)
          && bar.high >= Math.max(bar.open, bar.close) && bar.low <= Math.min(bar.open, bar.close);
        if (!window.every(validBar)) { rejected.push({ day: signal.day, code: signal.code, reason: 'missing-or-invalid-bar' }); continue; }
        const entry = bars.get(entryDay)[model.entryField], exit = bars.get(exitDay).close;
        const baseClose = bars.get(signal.day).close, nextOpen = bars.get(calendar[i + 1]).open;
        const limitHint = /^(30|68)/.test(signal.code) ? 19.5 : 9.5;
        const openingGapPct = (nextOpen / baseClose - 1) * 100;
        const indexEntry = index.bars[i + model.entryOffset]?.[model.entryField];
        const indexExit = index.bars[i + model.exitOffset]?.close;
        const indexPct = indexEntry > 0 && indexExit > 0 ? (indexExit / indexEntry - 1) * 100 : null;
        const grossPct = (exit / entry - 1) * 100;
        const lowOffset = model.entryOffset + (model.entryField === 'close' ? 1 : 0);
        const observed = {
          day: signal.day, code: signal.code, entryDay, exitDay,
          entryField: model.entryField, entry, exit, grossPct,
          indexPct, excessVsIndexPct: indexPct == null ? null : grossPct - indexPct,
          holdingLowPct: (Math.min(...window.slice(lowOffset).map(bar => bar.low)) / entry - 1) * 100,
          openingGapPct, openingNearLimit: Math.abs(openingGapPct) >= limitHint,
          source: 'Tencent fqkline; one price series per stock',
          assumption: 'reference-price event study; no guaranteed fill or portfolio simulation',
        };
        accepted.push(observed);
        const reported = model.key === 'closeD0-to-closeD1' ? signal.nextCloseGain
          : model.key === 'closeD0-to-closeD3' ? signal.threeDayGain : null;
        if (Number.isFinite(reported) && Math.abs(reported - observed.grossPct) > 0.055) {
          mismatches.push({ cohort, model: model.key, day: signal.day, code: signal.code,
            archivedPct: reported, recomputedPct: observed.grossPct });
        }
      }
      results[cohort].models[model.key] = { ...summarize(accepted), rows: accepted, rejected };
    }
  }
  return { generatedAt: new Date().toISOString(), results, mismatches,
    limitations: [
      'These are retrospective signal cohorts, not verified point-in-time candidate universes.',
      'Opening/closing reference prices do not prove execution; near-limit rows remain in results and are flagged, not silently filtered.',
      '20/50 bps are illustrative round-trip cost sensitivities, not actual broker/tax/slippage models.',
      'Signal-level equal weights are not a cash-constrained portfolio, and holdingLowPct is not portfolio drawdown.',
      'No parameter optimization or untouched out-of-sample evaluation was performed.',
    ] };
}

if (require.main === module) {
  const [researchPath, historyPath, outputPath] = process.argv.slice(2);
  if (!researchPath || !historyPath || !outputPath) throw new Error('Usage: research-star-leader-events.js research.json history.json output.json');
  const researchBytes = fs.readFileSync(researchPath), historyBytes = fs.readFileSync(historyPath);
  const output = evaluate(JSON.parse(researchBytes), JSON.parse(historyBytes));
  output.inputs = Object.fromEntries([['research', researchBytes], ['history', historyBytes]]
    .map(([key, bytes]) => [key, crypto.createHash('sha256').update(bytes).digest('hex')]));
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify({ ...output, results: Object.fromEntries(Object.entries(output.results)
    .map(([key, value]) => [key, { ...value, models: Object.fromEntries(Object.entries(value.models)
      .map(([key, model]) => { const { rows, ...summary } = model; return [key, summary]; })) }])) }, null, 2));
}

module.exports = { evaluate, summarize };
