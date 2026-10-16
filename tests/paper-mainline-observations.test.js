const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { contract, canonical, ruleHash, register, classifyTiming, record, verify, main } = require('../tools/paper-mainline-observations');
const { DEFAULTS } = require('../tools/research-mainline-portfolio');

async function temporary(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'paper-evidence-'));
  t.after(() => fs.rm(root, { recursive: true, force: true })); return root;
}

test('Owner agreement permits paper preparation, not deployment, orders or implicit sample acceptance', () => {
  assert.equal(contract.approval.productionDeploymentApproved, false);
  assert.equal(contract.approval.liveTradingApproved, false);
  assert.equal(contract.approval.independentReview, 'pending');
  assert.deepEqual(DEFAULTS, contract.simulationParameters);
  assert.deepEqual([DEFAULTS.initialCash, DEFAULTS.stockWeight, DEFAULTS.grossWeight, DEFAULTS.familyWeight, DEFAULTS.entryPremium], [100000, 0.2, 0.6, 0.4, 0.03]);
  assert.deepEqual([DEFAULTS.maxPositions, DEFAULTS.stopLoss, DEFAULTS.pauseDailyLoss, DEFAULTS.pauseDrawdown], [3, 0.06, 0.02, 0.06]);
  assert.equal(ruleHash().length, 64);
  assert.equal(canonical({ b: 2, a: 1 }), canonical({ a: 1, b: 2 }));
});

test('registration is idempotent, preserves its original timestamp and rejects rule drift', async t => {
  const root = await temporary(t), at = new Date('2026-10-16T07:00:00Z');
  const a = await register(root, at), b = await register(root, new Date('2026-10-17T07:00:00Z'));
  assert.deepEqual(a, b); assert.equal(a.paperTradingStarted, false);
  const file = path.join(root, 'experiment.json'); await fs.writeFile(file, JSON.stringify({ ...a, ruleHash: 'changed' }));
  await assert.rejects(register(root, at), /Rule drift/);
});

test('Beijing date/cutoff separates retrospective, future and late evidence, including UTC rollover', () => {
  assert.equal(classifyTiming('2026-10-16', new Date('2026-10-16T07:59:59Z')), 'same-day-before-cutoff');
  assert.equal(classifyTiming('2026-10-16', new Date('2026-10-16T08:00:01Z')), 'late-capture');
  assert.equal(classifyTiming('2026-10-15', new Date('2026-10-16T07:00:00Z')), 'retrospective');
  assert.equal(classifyTiming('2026-10-17', new Date('2026-10-16T07:00:00Z')), 'future-day');
  assert.equal(classifyTiming('2026-10-16', new Date('2026-10-15T17:00:00Z')), 'same-day-before-cutoff');
  assert.throws(() => classifyTiming('2026-02-30', new Date()), /Invalid target day/);
});

test('records are distinct, reproducible and always unvalidated, including no-signal and data-failure', async t => {
  const root = await temporary(t), input = path.join(root, 'capture.json');
  await fs.writeFile(input, JSON.stringify({ ok: false, dataMissing: ['l2-login'] }));
  const now = new Date('2026-10-16T08:01:00Z');
  const a = await record(root, { day: '2026-10-16', kind: 'data-failure', input }, now);
  const b = await record(root, { day: '2026-10-16', kind: 'no-signal-evidence', input }, now);
  assert.notEqual(a.id, b.id); assert.equal(a.timing, 'late-capture');
  assert.equal(a.countsAsAcceptedSignal, false); assert.equal(b.countsAsAcceptedSignal, false);
  assert.equal(a.kind, 'data-failure'); assert.equal(b.kind, 'no-signal-evidence');
  assert.equal((await verify(root, '2026-10-16', a.id)).sourceSha256, a.sourceSha256);
  const c = await record(root, { day: '2026-10-16', kind: 'candidate-capture', input }, new Date('2026-10-16T07:00:00Z'));
  assert.equal(c.timing, 'same-day-before-cutoff'); assert.equal(c.countsAsAcceptedSignal, false);
});

test('modified or interrupted evidence fails verification rather than silently changing history', async t => {
  const root = await temporary(t), input = path.join(root, 'capture.json'); await fs.writeFile(input, '{}');
  const r = await record(root, { day: '2026-10-16', kind: 'candidate-capture', input });
  await fs.writeFile(path.join(root, 'observations', '2026-10-16', r.id + '.source.json'), '{"changed":true}');
  await assert.rejects(verify(root, '2026-10-16', r.id), /verification failed/);
  await assert.rejects(verify(root, '../', r.id), /Invalid record locator/);
});

test('CLI cannot backdate its own observation timestamp; unknown event types reject', async t => {
  const root = await temporary(t);
  await assert.rejects(main(['register', '--observedAt=2026-07-01T00:00:00Z', '--root=' + root]), /timestamps cannot be supplied/);
  await assert.rejects(record(root, { day: '2026-10-16', kind: 'order', input: '' }), /Unknown observation kind/);
});

test('changing simulation parameters is disclosed rather than presented as the locked baseline', () => {
  const { simulate } = require('../tools/research-mainline-portfolio');
  const days = ['2026-10-12', '2026-10-13', '2026-10-14'];
  const history = { rows: [{ symbol: 'sh000001', code: '000001', adjustment: 'unadjusted',
    bars: days.map(day => ({ day, open: 10, close: 10, high: 10, low: 10 })) }], errors: [] };
  const dates = { startDay: days[0], signalEndDay: days[0], endDay: days[2] };
  assert.equal(simulate([], history, dates).matchesLockedParameters, true);
  const altered = simulate([], history, { ...dates, stopLoss: 0.05 });
  assert.equal(altered.matchesLockedParameters, false);
  assert.deepEqual(altered.parameterOverrides, { stopLoss: 0.05 });
});
