const assert = require('node:assert/strict');
const { test } = require('node:test');
const { evaluate } = require('../tools/research-star-leader-events');

function input() {
  const days = ['2026-07-23', '2026-07-24', '2026-07-27', '2026-07-28'];
  const bars = days.map((day, i) => ({ day, open: 10 + i, close: 10.5 + i, high: 11 + i, low: 9 + i }));
  return { research: { rows: { augustStars: [], augustLeaders: [], julyStars: [{ day: days[0], code: '000001', predictLevel: 'confirmed' },
    { day: days[0], code: '000002', predictLevel: 'expected' }], julyLeaders: [] } },
    history: { rows: [{ symbol: 'sh000001', bars }, { symbol: 'sz000001', code: '000001', bars }, { symbol: 'sz000002', code: '000002', bars }] } };
}

test('uses exact trading-day offsets and respects an overnight exit for next-open entry', () => {
  const { research, history } = input(), result = evaluate(research, history);
  const row = result.results.julyConfirmed.models['openD1-to-closeD2'].rows[0];
  assert.equal(row.entryDay, '2026-07-24'); assert.equal(row.exitDay, '2026-07-27');
  assert.equal(row.entry, 11); assert.equal(row.exit, 12.5);
  assert.ok(Math.abs(row.grossPct - (12.5 / 11 - 1) * 100) < 1e-12);
  assert.equal(row.excessVsIndexPct, 0);
  assert.equal(result.results.julyConfirmed.observed, 1); assert.equal(result.results.julyExpected.observed, 1);
});

test('close entry excludes an earlier low on the signal day from holding-risk observations', () => {
  const { research, history } = input(); history.rows[1].bars = history.rows[1].bars.map((bar, i) => i === 0 ? { ...bar, low: 1 } : bar);
  const row = evaluate(research, history).results.julyConfirmed.models['closeD0-to-closeD1'].rows[0];
  assert.ok(Math.abs(row.holdingLowPct - (10 / 10.5 - 1) * 100) < 1e-12);
});

test('missing follow-up bars are rejected rather than replaced with zero or the next available date', () => {
  const { research, history } = input(); history.rows[1].bars = history.rows[1].bars.filter((bar, i) => i !== 2);
  const model = evaluate(research, history).results.julyConfirmed.models['openD1-to-closeD2'];
  assert.equal(model.n, 0); assert.equal(model.mean, null); assert.equal(model.rejected.length, 1);
});

test('near-limit entry remains flagged instead of being silently removed using future outcomes', () => {
  const { research, history } = input();
  history.rows[1].bars = history.rows[1].bars.map((bar, i) => i === 1 ? { ...bar, open: 11.6, high: 12 } : bar);
  const model = evaluate(research, history).results.julyConfirmed.models['openD1-to-closeD2'];
  assert.equal(model.n, 1); assert.equal(model.openingNearLimit, 1);
  assert.ok(Math.abs(model.assumedNetMean[20] - (model.mean - 0.2)) < 1e-12);
});

test('rejects duplicate day-stock signals and invalid calendar order', () => {
  const { research, history } = input(); research.rows.julyStars.push({ ...research.rows.julyStars[0] });
  assert.throws(() => evaluate(research, history), /Duplicate/);
  research.rows.julyStars.pop(); history.rows[0].bars.reverse();
  assert.throws(() => evaluate(research, history), /calendar/);
});

test('July strict leader cohort requires a recorded confirmed star in that same day and family', () => {
  const { research, history } = input(); research.rows.julyStars[0].family = 'A';
  research.rows.julyLeaders = [
    { day: '2026-07-23', code: '000001', family: 'A' },
    { day: '2026-07-23', code: '000002', family: 'B' },
  ];
  const result = evaluate(research, history);
  assert.equal(result.results.julyLeaders.observed, 2);
  assert.equal(result.results.julyLeadersConfirmedMainline.observed, 1);
  assert.equal(result.results.julyLeadersConfirmedMainline.models['openD1-to-closeD2'].rows[0].code, '000001');
});
