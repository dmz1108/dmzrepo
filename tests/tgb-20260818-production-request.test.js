'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-18-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260818_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-18-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = 'e63932951881de0e35116562ccb9df0446b4c833e901356a30484874528327c9'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2umBA1BXLzX'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-06.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '821b8f54a372048365ed450dd0ad65a2093b5a5fc06b0d7484c852cf7a428505'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 847643'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 78'), 'request must require the 78-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 79'), 'request must pin the 79-row raw terminal pool');
assert(request.includes("const expectedExcludedCodes = ['920087']"), 'request must pin the single BSE excluded code');
assert(request.includes("['\\u519c\\u6797\\u7267\\u6e14', 24]"), 'request must pin the agriculture block');
assert(request.includes("['\\u673a\\u5668\\u4eba', 11]"), 'request must pin the robot block');
assert(request.includes("['\\u5927\\u6d88\\u8d39', 8]"), 'request must pin the consumer block');
assert(request.includes("['\\u5149\\u901a\\u4fe1', 7]"), 'request must pin the optical block');
assert(request.includes("['\\u56fd\\u4ea7\\u8f6f\\u4ef6', 4]"), 'request must pin the domestic-software block');
assert(request.includes("['\\u4e1a\\u7ee9\\u589e\\u957f', 4]"), 'request must pin the performance-growth block');
assert(request.includes("['\\u533b\\u7597\\u533b\\u836f', 4]"), 'request must pin the medical block');
assert(request.includes("['\\u534a\\u5bfc\\u4f53', 3]"), 'request must pin the semiconductor block');
assert(request.includes("['\\u80a1\\u6743\\u8f6c\\u8ba9', 3]"), 'request must pin the equity-transfer block');
assert(request.includes("['\\u5176\\u4ed6\\u70ed\\u70b9', 4]"), 'request must pin the other-hotspot block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 6]"), 'request must pin the other-stock block');
assert(request.includes("code: '000020'"), 'request must declare the full-width A normalization');
assert(request.includes("code: '000735'"), 'request must declare the spaced Luoniushan normalization');
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
assert(request.includes('protected formal TGB file already exists; refusing concurrent overwrite'), 'request must reject a concurrent protected-source write');
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'), 'request must restore touched artifacts on failure');
assert(request.includes('serviceRestarted: false'), 'request must not claim a service restart');
assert(!/OCR|Qwen|vision/i.test(request.replace(/never invokes OCR\/Qwen\/vision/g, '')), 'request must not invoke automated visual processing');

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

console.log('2026-08-18 TGB production request tests passed');
