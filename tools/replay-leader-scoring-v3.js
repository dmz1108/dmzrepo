#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');
const { rankLeaderPoolV3 } = require('../strategy-leader-scoring-v3');
const { hashEvidence } = require('../strategy-evidence');

function parseArgs(argv) {
  const args = { positional: [] };
  for (const item of argv) {
    if (!item.startsWith('--')) {
      args.positional.push(item);
      continue;
    }
    const index = item.indexOf('=');
    if (index < 0) args[item.slice(2)] = true;
    else args[item.slice(2, index)] = item.slice(index + 1);
  }
  return args;
}

async function replayLeaderScoringV3(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const fileArg = String(args.file || args.positional[0] || '').trim();
  if (!fileArg) throw new Error('--file=<v3-shadow-case.json> is required');
  const file = path.resolve(fileArg);
  const input = JSON.parse(await fs.readFile(file, 'utf8'));
  const inputSha256 = hashEvidence(input);
  const expectedSha256 = String(args['expect-sha'] || '').trim().toLowerCase();
  if (expectedSha256 && inputSha256 !== expectedSha256) {
    throw new Error(`v3 shadow input SHA-256 mismatch: expected ${expectedSha256}`);
  }
  const report = rankLeaderPoolV3(input);
  if (args['require-complete'] && report.complete !== true) {
    const missing = report.results
      .filter(row => !row.complete)
      .map(row => `${row.code || 'unknown'}:${row.dataMissing.join(',')}`);
    throw new Error(`v3 shadow evidence is incomplete: ${missing.join('; ')}`);
  }
  const normalizeCode = value => String(value || '').trim().replace(/^(?:sh|sz|bj)/i, '');
  const v2ByCode = new Map((Array.isArray(input.v2Rows) ? input.v2Rows : [])
    .map(row => [normalizeCode(row?.code), row]).filter(([code]) => code));
  return {
    ok: true,
    file,
    inputSha256,
    ...report,
    results: report.results.map(row => ({
      ...row,
      v2: v2ByCode.has(row.code) ? {
        originalRank: Number.isFinite(Number(v2ByCode.get(row.code)?.originalRank))
          ? Number(v2ByCode.get(row.code).originalRank) : null,
        leadScore: Number.isFinite(Number(v2ByCode.get(row.code)?.leadScore))
          ? Number(v2ByCode.get(row.code).leadScore) : null,
      } : null,
    })),
  };
}

if (require.main === module) {
  replayLeaderScoringV3().then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch(error => {
    process.stderr.write(`replay-leader-scoring-v3 failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, replayLeaderScoringV3 };
