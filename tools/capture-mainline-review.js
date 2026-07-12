#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const { normalizeEvidenceCodes, verifyEvidenceBundle } = require('../strategy-evidence');
const { parseArgs, requestJson, validateEvidenceBase } = require('./capture-strategy-case');

const DEFAULT_MARKET_BASE = 'https://market.dreamerqi.com';

function buildMainlineReviewUrl(base, options) {
  const trustedBase = validateEvidenceBase(base || DEFAULT_MARKET_BASE);
  const url = new URL('/api/ai/strategy-mainline-review', trustedBase.origin);
  url.searchParams.set('day', options.day);
  url.searchParams.set('codes', options.codes.join(','));
  return url.toString();
}

async function captureMainlineReview(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  const day = String(args.day || '').trim();
  const codes = normalizeEvidenceCodes(args.codes || '', 10);
  const base = String(args.base || env.PANDA_MARKET_BASE_URL || DEFAULT_MARKET_BASE).replace(/\/+$/, '');
  const token = String(env.PANDA_AI_READONLY_TOKEN || env.PANDA_AI_STRATEGY_TOKEN || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('--day=YYYY-MM-DD is required');
  if (!codes.length) throw new Error('--codes=000001[,000002] is required');
  if (!token) throw new Error('PANDA_AI_READONLY_TOKEN is required in the environment');

  const target = buildMainlineReviewUrl(base, { day, codes });
  const payload = await requestJson(target, { 'x-ai-read-token': token, accept: 'application/json' });
  const verification = verifyEvidenceBundle(payload);
  if (!verification.ok) throw new Error(`review integrity failed: ${verification.errors.join('; ')}`);

  const output = path.resolve(String(args.out || path.join('tmp', 'strategy-cases', `${day}-${codes.join('-')}-mainline-review.json`)));
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return {
    output,
    day,
    codes,
    complete: payload.complete === true,
    missingSources: payload.missingSources || [],
    sourceErrors: payload.sourceErrors || [],
    bundleSha256: payload.integrity?.bundle || '',
  };
}

if (require.main === module) {
  captureMainlineReview().then(result => {
    process.stdout.write(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`);
  }).catch(err => {
    process.stderr.write(`capture-mainline-review failed: ${err.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { buildMainlineReviewUrl, captureMainlineReview };
