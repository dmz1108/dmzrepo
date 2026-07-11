#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');
const { buildCodeAudits, verifyEvidenceBundle } = require('../strategy-evidence');

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

function compactAudit(audit) {
  return {
    code: audit.code,
    snapshotTodayGain: audit.snapshotTodayGain,
    snapshotBoards: audit.snapshotMatches.map(item => ({
      zsType: item.zsType,
      plateId: item.plateId,
      boardName: item.boardName,
      tables: Object.keys(item.tables),
    })),
    limitUpCount: audit.limitUpCount,
    limitUpDays: audit.limitUpDays,
    mainReasonHits: audit.mainReasonHits,
    closeGain10: audit.closeGain10,
    closeGain30: audit.closeGain30,
    strategyMembership: audit.strategyMembership,
  };
}

async function replayStrategyCase(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const fileArg = String(args.file || args.positional[0] || '').trim();
  if (!fileArg) throw new Error('--file=tmp/strategy-cases/<case>.json is required');
  const file = path.resolve(fileArg);
  const bundle = JSON.parse(await fs.readFile(file, 'utf8'));
  const verification = verifyEvidenceBundle(bundle);
  if (!verification.ok) throw new Error(`evidence integrity failed: ${verification.errors.join('; ')}`);
  const expectedSha = String(args['expect-sha'] || '').trim().toLowerCase();
  if (expectedSha && String(bundle?.integrity?.bundle || '').toLowerCase() !== expectedSha) {
    throw new Error(`evidence bundle SHA-256 mismatch: expected ${expectedSha}`);
  }
  if (args['require-complete'] && bundle.complete !== true) {
    throw new Error(`evidence bundle is incomplete: ${(bundle.missingSources || []).join(', ') || (bundle.sourceErrors || []).join('; ')}`);
  }
  const audits = buildCodeAudits(bundle);
  return {
    ok: true,
    file,
    schemaVersion: bundle.schemaVersion,
    bundleSha256: bundle.integrity?.bundle || '',
    generatedAt: bundle.generatedAt || '',
    complete: bundle.complete === true,
    missingSources: bundle.missingSources || [],
    sourceErrors: bundle.sourceErrors || [],
    coverage: bundle.coverage || null,
    request: bundle.request || {},
    audits: args.full ? audits : audits.map(compactAudit),
  };
}

if (require.main === module) {
  replayStrategyCase().then(result => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch(err => {
    process.stderr.write(`replay-strategy-case failed: ${err.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { compactAudit, parseArgs, replayStrategyCase };
