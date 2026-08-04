'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-04-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260804_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-04-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = 'f3ccd690f63dffae49ea6fcb3831f7e0aee9b6814ff63816cc6d5551b1bb3b34'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2tZtbfK6FHu'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-07.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '39e306418b9da97e585b6025b55cd162251d55cf5f094e600de45d6f628556e2'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 1278534'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 137'), 'request must require the 137-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 138'), 'request must pin the 138-row raw terminal pool');
assert(request.includes("const expectedExcludedCodes = ['920092']"), 'request must pin the excluded Beijing Exchange code');
assert(request.includes("code: '688316'"), 'request must record the source-name alias code');
assert(request.includes("sourceName: '\\u9752\\u4e91\\u79d1\\u6280'"), 'request must preserve the source name');
assert(request.includes("baselineName: '\\u9752\\u4e91\\u79d1\\u6280-U'"), 'request must record the terminal-pool name');
assert(request.includes("['\\u7b97\\u529b', 21]"), 'request must pin the first manual block');
assert(request.includes("['PCB', 19]"), 'request must pin the PCB block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 7]"), 'request must pin the final manual block');
assert(request.includes('manualBlockTotal !== expectedCount'), 'manual block totals must equal the formal count');
assert(request.includes('manualSecondPassReviewed: true'), 'request must record second-pass manual review');
assert(request.includes('missingCodes.length'), 'request must reject missing codes');
assert(request.includes('extraCodes.length'), 'request must reject extra codes');
assert(request.includes('duplicateCodes.length'), 'request must reject duplicate codes');
assert(request.includes('weakRows.length'), 'request must reject weak rows');
assert(request.includes('nameDifferencesMatch'), 'request must reject undeclared name differences');
assert(request.includes("'--main-reason-backfill'"), 'request must rebuild the same-day combined database');
assert(request.includes('validateAutoTgb(auto, expectedCodes)'), 'request must validate persisted auto-fold TGB rows');
assert(request.includes('validatePreviouslyHealthySources'), 'request must prevent degradation of healthy review sources');
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'), 'request must restore touched artifacts on failure');
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

console.log('2026-08-04 TGB production request tests passed');
