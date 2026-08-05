'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-05-tgb-hunan-owner-authorized-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260805_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-05-tgb-hunan-owner-authorized-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = '4111c6088d1fe69cc2627b2484636d27afccc834ef731601d79e8b491d97adbf'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2u10yPnYbir'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-06.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = 'eb61a2164d33fc0e344d4a6f93e66ed690b9bb079ab2325409b395fc4d6e97af'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 1279169'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 102'), 'request must require the 102-stock formal pool');
assert(request.includes('const expectedRawPoolCounts = new Set([103, 104])'), 'request must safely accept either concurrent terminal-file state');
assert(request.includes('const expectedPublicLimitStatusCounts = new Set([103, 104])'), 'request must safely accept either observed public status count');
assert(request.includes("const ownerExcludedNonLimitUpCode = '601138'"), 'request must pin the owner-authorized non-limit-up exclusion');
assert(request.includes("const expectedAlwaysExcludedCodes = ['920117']"), 'request must pin the Beijing Exchange exclusion');
assert(request.includes('code === ownerExcludedNonLimitUpCode'), 'review filter must apply the owner-authorized exclusion');
assert(request.includes('ownerExcludedWasPresent = rawCodes.has(ownerExcludedNonLimitUpCode)'), 'gate must record whether the concurrent terminal file contains the non-limit-up code');
assert(request.includes('expectedPublicLimitStatusCounts.has(Number(statusDay?.count))'), 'public status gate must handle the same concurrent count pair');
assert(request.includes("code: '688549'"), 'request must record the source-name alias code');
assert(request.includes("sourceName: '\\u4e2d\\u5de8\\u82af'"), 'request must preserve the source name');
assert(request.includes("baselineName: '\\u4e2d\\u5de8\\u82af-U'"), 'request must record the terminal-pool name');
assert(request.includes("['\\u534a\\u5bfc\\u4f53', 17]"), 'request must pin the first manual block');
assert(request.includes("['PCB', 10]"), 'request must pin the PCB block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 13]"), 'request must pin the final manual block');
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

console.log('2026-08-05 TGB production request tests passed');
