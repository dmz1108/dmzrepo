'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-07-24-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260724_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-07-24-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = 'e8ec18efa6f7dc81f6be0ff89d8c2049f776f5541b4deee0a10f57a549e55915'"), 'request must pin the manual payload hash');
assert(request.includes("expectedImageSha256 = '60347f3fcbe837df5007852f8d257b20e0a2375cd60d5386b0c1f5a61b54b88c'"), 'request must pin the official image hash');
assert(request.includes('const expectedCount = 40'), 'request must require the 40-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 40'), 'request must require the 40-stock terminal pool');
assert(request.includes("'\\u534a\\u5bfc\\u4f53': 8"), 'request must pin the semiconductor block count');
assert(request.includes("'\\u5176\\u4ed6\\u4e2a\\u80a1': 10"), 'request must pin the final block count');
assert(request.includes('manualSecondPassReviewed: true'), 'request must record second-pass manual review');
assert(request.includes('missingCodes.length'), 'request must reject missing codes');
assert(request.includes('extraCodes.length'), 'request must reject extra codes');
assert(request.includes('duplicateCodes.length'), 'request must reject duplicate codes');
assert(request.includes('weakRows.length'), 'request must reject weak rows');
assert(request.includes("normalize('NFKC')"), 'request must explicitly audit name normalization');
assert(request.includes("'--main-reason-backfill'"), 'request must rebuild the same-day combined database');
assert(request.includes('validateAutoTgb(auto, expectedCodes)'), 'request must validate persisted auto-fold TGB rows');
assert(request.includes('validateTgbStat'), 'request must validate public and persisted TGB health');
assert(request.includes('validatePreviouslyHealthySources'), 'request must prevent degradation of already healthy review sources');
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'), 'request must restore all touched artifacts on failure');
assert(request.includes('/day?day=${day}&force=1&rollback='), 'rollback must refresh the public combined cache');
assert(request.includes('required cloud operation log is missing'), 'both cloud logs must exist before writing');
assert(request.includes('serviceRestarted: false'), 'request must not claim a service restart');

const runBlocks = [];
const workflowLines = workflow.split(/\r?\n/);
for (let index = 0; index < workflowLines.length; index += 1) {
  const match = workflowLines[index].match(/^(\s*)run:\s*\|\s*$/);
  if (!match) continue;
  const contentIndent = match[1].length + 2;
  const lines = [];
  for (index += 1; index < workflowLines.length; index += 1) {
    const line = workflowLines[index];
    if (line.trim() && line.match(/^\s*/)[0].length < contentIndent) {
      index -= 1;
      break;
    }
    lines.push(line.trim() ? line.slice(contentIndent) : '');
  }
  runBlocks.push(lines.join('\n'));
}
for (const [index, block] of runBlocks.entries()) {
  const syntax = childProcess.spawnSync('bash', ['-n'], { input: block, encoding: 'utf8' });
  assert.strictEqual(syntax.status, 0, `workflow bash run block ${index + 1} must parse: ${syntax.stderr}`);
}

console.log('2026-07-24 TGB production request tests passed');
