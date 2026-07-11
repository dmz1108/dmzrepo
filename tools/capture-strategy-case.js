#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const https = require('https');
const {
  normalizeEvidenceCodes,
  normalizeEvidenceThemes,
  verifyEvidenceBundle,
} = require('../strategy-evidence');

const DEFAULT_MARKET_BASE = 'https://market.dreamerqi.com';
const ALLOWED_MARKET_HOSTS = new Set(['market.dreamerqi.com']);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    if (!item.startsWith('--')) continue;
    const index = item.indexOf('=');
    if (index < 0) args[item.slice(2)] = true;
    else args[item.slice(2, index)] = item.slice(index + 1);
  }
  return args;
}

function validateEvidenceBase(base) {
  const url = new URL(String(base || DEFAULT_MARKET_BASE));
  const hostname = String(url.hostname || '').toLowerCase();
  const isLoopback = LOOPBACK_HOSTS.has(hostname);
  if (url.username || url.password) throw new Error('--base must not contain credentials');
  if (!isLoopback && !ALLOWED_MARKET_HOSTS.has(hostname)) throw new Error(`--base host is not allowed: ${hostname || 'empty'}`);
  if (!isLoopback && (url.protocol !== 'https:' || (url.port && url.port !== '443'))) {
    throw new Error('--base must use https://market.dreamerqi.com');
  }
  if (isLoopback && !['http:', 'https:'].includes(url.protocol)) throw new Error('--base loopback URL must use http or https');
  return url;
}

function requestJson(target, headers = {}, redirects = 0, allowedOrigin = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(target);
    const carriesAiToken = !!headers['x-ai-read-token'] || /^Bearer\s+/i.test(String(headers.authorization || ''));
    const trustedOrigin = allowedOrigin || (carriesAiToken ? validateEvidenceBase(url.origin).origin : url.origin);
    const client = url.protocol === 'http:' ? http : https;
    const req = client.request(url, { method: 'GET', headers, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 3) {
        const next = new URL(res.headers.location, url);
        if (next.origin !== trustedOrigin) {
          res.resume();
          reject(new Error(`cross-origin redirect blocked: ${next.origin}`));
          return;
        }
        res.resume();
        resolve(requestJson(next.toString(), headers, redirects + 1, trustedOrigin));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let payload = null;
        try { payload = JSON.parse(text); } catch {}
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode}: ${payload?.error || text.slice(0, 300) || 'request failed'}`));
          return;
        }
        if (!payload) reject(new Error('response is not valid JSON'));
        else resolve(payload);
      });
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end();
  });
}

function buildEvidenceUrl(base, options) {
  const trustedBase = validateEvidenceBase(base);
  const url = new URL('/api/ai/strategy-evidence', trustedBase.origin);
  url.searchParams.set('day', options.day);
  url.searchParams.set('codes', options.codes.join(','));
  url.searchParams.set('window', String(options.windowDays));
  if (options.themes.length) url.searchParams.set('themes', options.themes.join(','));
  return url.toString();
}

async function captureStrategyCase(argv = process.argv.slice(2), env = process.env) {
  const args = parseArgs(argv);
  const day = String(args.day || '').trim();
  const codes = normalizeEvidenceCodes(args.codes || '', 20);
  const themes = normalizeEvidenceThemes(args.themes || '', 12);
  const parsedWindow = Number(args.window || 30);
  const windowDays = Number.isFinite(parsedWindow) ? Math.max(1, Math.min(30, Math.trunc(parsedWindow))) : 30;
  const base = String(args.base || env.PANDA_MARKET_BASE_URL || DEFAULT_MARKET_BASE).replace(/\/+$/, '');
  const token = String(env.PANDA_AI_READONLY_TOKEN || env.PANDA_AI_STRATEGY_TOKEN || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('--day=YYYY-MM-DD is required');
  if (!codes.length) throw new Error('--codes=000001[,000002] is required');
  if (!token) throw new Error('PANDA_AI_READONLY_TOKEN is required in the environment');

  const target = buildEvidenceUrl(base, { day, codes, themes, windowDays });
  const payload = await requestJson(target, { 'x-ai-read-token': token, accept: 'application/json' });
  const verification = verifyEvidenceBundle(payload);
  if (!verification.ok) throw new Error(`evidence integrity failed: ${verification.errors.join('; ')}`);

  const slug = `${day}-${codes.join('-')}`;
  const output = path.resolve(String(args.out || path.join('tmp', 'strategy-cases', `${slug}.json`)));
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
  captureStrategyCase().then(result => {
    process.stdout.write(`${JSON.stringify({ ok: true, ...result }, null, 2)}\n`);
  }).catch(err => {
    process.stderr.write(`capture-strategy-case failed: ${err.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { buildEvidenceUrl, captureStrategyCase, parseArgs, requestJson, validateEvidenceBase };
