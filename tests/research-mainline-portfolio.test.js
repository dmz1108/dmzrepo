const test = require('node:test');
const assert = require('node:assert/strict');
const { costs, DEFAULTS, quantityForBudget, simulate, cohorts } = require('../tools/research-mainline-portfolio');

const days = ['2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-20', '2026-07-21'];
function bar(day, price = 10, overrides = {}) { return { day, open: price, close: price, high: price + 1, low: price - 1, volume: 10000, ...overrides }; }
function fixture(codes = ['600001']) {
  return { rows: [{ symbol: 'sh000001', code: '000001', adjustment: 'unadjusted', bars: days.map(day => bar(day, 100)) },
    ...codes.map(code => ({ symbol: 'sh' + code, code, adjustment: 'unadjusted', bars: days.map(day => bar(day)) }))], errors: [] };
}
const signal = (code = '600001', day = days[0], extra = {}) => ({ code, day, name: code, family: 'family-a', families: ['family-a'], leaderRank: 1, leadScore: 100, ...extra });
const config = { startDay: days[0], signalEndDay: days[4], endDay: days[6] };
const priceRow = (history, code = '600001') => history.rows.find(row => row.code === code);

test('fixed prior-close quantities, T+1 and exact cash/fee reconciliation', () => {
  const history = fixture(); priceRow(history).bars[1] = bar(days[1], 8);
  const result = simulate([signal()], history, config);
  const trade = result.trades[0];
  assert.equal(trade.entryDay, days[1]); assert.equal(trade.exitDay, days[2]);
  assert.equal(trade.shares, quantityForBudget('600001', 20000, 10.3, DEFAULTS));
  assert.equal(trade.shares, 1900);
  assert.equal(result.summary.finalNav, DEFAULTS.initialCash + trade.netPnl);
  assert.ok(result.equity.every(row => row.cash >= 0));
  assert.equal(result.summary.signalTimingVerified, false); assert.equal(result.summary.fillsVerified, false);
});

test('only preplaced orders, no replacement after discovering auction prices', () => {
  const history = fixture(['600001', '600002', '600003', '600004']);
  priceRow(history).bars[1] = bar(days[1], 11);
  const signals = ['600001', '600002', '600003', '600004'].map((code, i) => signal(code, days[0], { families: ['f' + i], leadScore: 100 - i }));
  const result = simulate(signals, history, config);
  assert.equal(result.skipped.find(row => row.code === '600001').reason, 'auction-open-above-limit');
  assert.equal(result.skipped.find(row => row.code === '600004').reason, 'position-count-budget');
  assert.deepEqual(result.trades.map(row => row.code), ['600002', '600003']);
});

test('same-family exposure, gross exposure and at most three positions are reserved before open', () => {
  const codes = ['600001', '600002', '600003', '600004'];
  const result = simulate(codes.map(code => signal(code)), fixture(codes), config);
  assert.equal(result.trades.length, 2);
  assert.ok(result.equity.every(row => row.grossPct <= 40.001));
});

test('today closing sales cannot finance today opening buys', () => {
  const history = fixture(['600001', '600002']);
  const result = simulate([signal(), signal('600002', days[1])], history,
    { ...config, initialCash: 10000, stockWeight: 1, grossWeight: 1, familyWeight: 1, maxPositions: 1 });
  assert.equal(result.trades.length, 1);
  assert.equal(result.skipped.find(row => row.code === '600002').reason, 'position-count-budget');
});

test('a closing loss only triggers an order at the following open, never same-day T+0', () => {
  const history = fixture(); priceRow(history).bars[1] = bar(days[1], 10, { close: 9 });
  priceRow(history).bars[2] = bar(days[2], 8.9);
  const result = simulate([signal()], history, config);
  assert.equal(result.trades[0].exitDay, days[2]); assert.equal(result.trades[0].exitField, 'open');
  assert.equal(result.trades[0].reason, 'previous-close-stop');
  assert.equal(result.trades[0].exit, 8.9);
});

test('lower-limit close defers sale and tracks retry, rather than fabricating a closing fill', () => {
  const history = fixture(), series = priceRow(history).bars;
  series[2] = bar(days[2], 9, { high: 10 });
  series[3] = bar(days[3], 8.1); series[4] = bar(days[4], 8.5);
  const result = simulate([signal()], history, config);
  assert.equal(result.trades[0].exitDay, days[4]); assert.equal(result.trades[0].exitField, 'open');
  assert.ok(result.orders.some(row => row.action === 'sell-deferred'));
});

test('unresolved lower-limit positions are marked, not forced liquidated at end', () => {
  const history = fixture(), series = priceRow(history).bars;
  for (let i = 2; i < days.length; i++) series[i] = bar(days[i], 10 * 0.9 ** (i - 1));
  const result = simulate([signal()], history, config);
  assert.equal(result.trades.length, 0); assert.equal(result.summary.unresolvedPositions, 1);
  assert.equal(result.summary.mechanicsComplete, false); assert.equal(result.unresolved.length, 1);
});

test('missing opening data remains an issue, not a zero-return winner or shifted entry', () => {
  const history = fixture(); priceRow(history).bars.splice(1, 1);
  const result = simulate([signal()], history, config);
  assert.equal(result.trades.length, 0); assert.equal(result.summary.mechanicsComplete, false);
  assert.equal(result.issues[0].reason, 'opening-data-unavailable');
});

test('opening admission never uses the still-unknown same-day high, low, volume or close', () => {
  const history = fixture(); priceRow(history).bars[1] = { day: days[1], open: 10 };
  const result = simulate([signal()], history, config);
  assert.ok(result.orders.some(row => row.action === 'modeled-buy'));
  assert.ok(result.issues.some(row => row.reason === 'stale-position-valuation'));
  assert.equal(result.summary.mechanicsComplete, false);
});

test('corporate-action alerts include exit day and never filter the trade away', () => {
  const history = fixture(), adjusted = fixture();
  priceRow(adjusted).adjustment = 'qfq'; priceRow(adjusted).bars[2].close = 10.5;
  const result = simulate([signal()], history, config, adjusted);
  assert.equal(result.trades.length, 1);
  assert.ok(result.issues.some(row => row.day === days[2] && row.reason === 'possible-corporate-action-unmodeled'));
  assert.equal(result.summary.mechanicsComplete, false);
});

test('corporate-action audit also covers a stop exiting at the opening price', () => {
  const history = fixture(), adjusted = fixture();
  priceRow(history).bars[1] = bar(days[1], 10, { close: 9 });
  priceRow(history).bars[2] = bar(days[2], 9);
  priceRow(adjusted).bars[1] = bar(days[1], 10, { close: 9 });
  priceRow(adjusted).bars[2] = bar(days[2], 9, { close: 9.5 });
  const result = simulate([signal()], history, config, adjusted);
  assert.equal(result.trades[0].exitField, 'open');
  assert.ok(result.issues.some(row => row.day === days[2] && row.reason === 'possible-corporate-action-unmodeled'));
});

test('loss pause affects only future orders, never deletes a losing trade', () => {
  const history = fixture(['600001', '600002']);
  priceRow(history).bars[1] = bar(days[1], 10, { close: 8.8, low: 8.8 });
  priceRow(history).bars[2] = bar(days[2], 8.8);
  const result = simulate([signal(), signal('600002', days[2])], history, config);
  assert.equal(result.summary.paused.day, days[1]); assert.equal(result.trades.length, 1);
  assert.ok(result.trades[0].netPnl < 0);
  assert.ok(result.skipped.some(row => row.code === '600002' && row.reason === 'paused-at-signal-close'));
});

test('normal lots, STAR minimum/increment and actual fees use correct units', () => {
  assert.equal(quantityForBudget('600001', 1999, 10, DEFAULTS), 100);
  assert.equal(quantityForBudget('688001', 1999, 10, DEFAULTS), 0);
  assert.equal(quantityForBudget('688001', 2020, 10, DEFAULTS), 201);
  assert.deepEqual(costs(20000, 'buy', DEFAULTS), { commission: 6, tax: 0, friction: 20, total: 26 });
  assert.deepEqual(costs(20000, 'sell', DEFAULTS), { commission: 6, tax: 10, friction: 20, total: 36 });
});

test('duplicate signals, malformed series, adjusted cash prices and invalid limits reject', () => {
  assert.throws(() => simulate([signal(), signal()], fixture(), config), /Duplicate signal/);
  const history = fixture(); priceRow(history).adjustment = 'qfq';
  assert.throws(() => simulate([signal()], history, config), /unadjusted/);
  assert.throws(() => simulate([signal()], fixture(), { ...config, initialCash: -1 }), /limits/);
  assert.throws(() => simulate([signal()], fixture(), { ...config, maxPositions: 1.5 }), /limits/);
});

test('strict July cohort requires a recorded confirmed star in the same family and date', () => {
  const result = cohorts({ rows: { julyLeaders: [signal()],
    julyStars: [{ day: days[0], family: 'other', predictLevel: 'confirmed' }], augustLeaders: [] } });
  assert.equal(result.july.signals.length, 0);
});
