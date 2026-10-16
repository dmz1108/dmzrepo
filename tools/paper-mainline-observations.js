#!/usr/bin/env node
// Evidence journal only. No networking, signal adjudication, scheduler or broker orders.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const contract = require('../research/mainline-leader-paper-v1.contract.json');

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
  return JSON.stringify(value);
}
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const ruleHash = () => hash(canonical(contract));

async function register(root, now = new Date()) {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const file = path.join(root, 'experiment.json');
  const expected = { strategyVersion: contract.strategyVersion, ruleHash: ruleHash() };
  const manifest = { ...expected, registeredAt: now.toISOString(), state: 'prerequisites-and-review-pending',
    automaticCollectionEnabled: false, paperTradingStarted: false, liveTradingEnabled: false };
  try { await fs.writeFile(file, JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const actual = JSON.parse(await fs.readFile(file, 'utf8'));
  if (actual.ruleHash !== expected.ruleHash || actual.strategyVersion !== expected.strategyVersion) throw Error('Rule drift: use a new approved experiment/version, do not overwrite');
  return actual;
}

function classifyTiming(day, observedAt) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day + 'T00:00:00Z').toISOString().slice(0, 10) !== day) throw Error('Invalid target day');
  const chinaDay = new Date(observedAt.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (day < chinaDay) return 'retrospective';
  if (day > chinaDay) return 'future-day';
  return observedAt.getTime() > new Date(day + 'T' + contract.signalCutoff).getTime()
    ? 'late-capture' : 'same-day-before-cutoff';
}

async function record(root, { day, kind, input }, now = new Date()) {
  const allowed = new Set(['candidate-capture', 'no-signal-evidence', 'data-failure', 'execution-feedback']);
  if (!allowed.has(kind)) throw Error('Unknown observation kind');
  const timing = classifyTiming(day, now);
  const source = await fs.readFile(input);
  if (!source.length || source.length > 16 * 1024 * 1024) throw Error('Capture must be nonempty JSON below 16 MiB');
  JSON.parse(source.toString('utf8'));
  const manifest = await register(root, now);
  const sourceSha256 = hash(source), timestamp = now.toISOString();
  const envelope = { strategyVersion: manifest.strategyVersion, ruleHash: manifest.ruleHash,
    targetDay: day, observedAt: timestamp, kind, timing, sourceSha256, sourceBytes: source.length,
    validation: 'unvalidated-evidence', countsAsAcceptedSignal: false, countsAsVerifiedFill: false };
  // Publish source and metadata without replacing an earlier record. Interrupted files fail verification.
  const dir = path.join(root, 'observations', day);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const id = timestamp.replace(/[:.]/g, '-') + '-' + crypto.randomUUID();
  await fs.writeFile(path.join(dir, id + '.source.json'), source, { flag: 'wx', mode: 0o600 });
  const envelopeSha256 = hash(canonical(envelope));
  await fs.writeFile(path.join(dir, id + '.record.json'), JSON.stringify({ ...envelope, envelopeSha256 }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return { id, ...envelope, envelopeSha256 };
}

async function verify(root, day, id) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^[0-9TZ-]+-[0-9a-f-]{36}$/.test(id)) throw Error('Invalid record locator');
  const prefix = path.join(root, 'observations', day, id);
  const bytes = await fs.readFile(prefix + '.source.json');
  const { envelopeSha256, ...envelope } = JSON.parse(await fs.readFile(prefix + '.record.json', 'utf8'));
  if (envelope.sourceSha256 !== hash(bytes) || envelope.sourceBytes !== bytes.length
    || envelopeSha256 !== hash(canonical(envelope)) || envelope.ruleHash !== ruleHash()
    || envelope.targetDay !== day || envelope.strategyVersion !== contract.strategyVersion
    || envelope.validation !== 'unvalidated-evidence' || envelope.countsAsAcceptedSignal !== false
    || envelope.countsAsVerifiedFill !== false) throw Error('Observation verification failed');
  return { id, ...envelope, envelopeSha256 };
}

async function main(argv = process.argv.slice(2)) {
  const [command, ...pairs] = argv;
  const allowed = new Set(['--root', '--day', '--kind', '--input', '--id']);
  const args = {};
  for (const pair of pairs) {
    const at = pair.indexOf('=');
    if (at < 0 || !allowed.has(pair.slice(0, at))) throw Error('Use named arguments; observation timestamps cannot be supplied');
    args[pair.slice(2, at)] = pair.slice(at + 1);
  }
  const root = path.resolve(args.root || path.join('tmp', 'quant-paper', contract.strategyVersion));
  if (command === 'register') return register(root);
  if (command === 'record' && args.input && args.day && args.kind) return record(root, args);
  if (command === 'verify' && args.day && args.id) return verify(root, args.day, args.id);
  throw Error('Use register, record --day=YYYY-MM-DD --kind=... --input=..., or verify --day=... --id=...');
}

if (require.main === module) main().then(value => console.log(JSON.stringify(value, null, 2)))
  .catch(() => { console.error('Paper evidence operation failed; no trading was enabled. Check arguments, rule drift or capture integrity locally.'); process.exitCode = 1; });

module.exports = { contract, canonical, ruleHash, register, classifyTiming, record, verify, main };
