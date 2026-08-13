'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-13-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260813_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-13-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = '3e76d4cc38e0b97955b73748a2b1f4f01a4f17a9f3c08279c331e7438f5b4b80'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2uec4Zbbvhb'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-06.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '90afc9e94f7b2f65d18be2c7760b4b4b7c661b7afa8f27adb1758b9a026d723b'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 817029'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 59'), 'request must require the 59-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 59'), 'request must pin the 59-row raw terminal pool');
assert(request.includes('const expectedExcludedCodes = []'), 'request must pin the empty exclusion set');
assert(request.includes("['\\u533b\\u836f', 14]"), 'request must pin the medicine block');
assert(request.includes("['\\u7b97\\u529b', 6]"), 'request must pin the compute block');
assert(request.includes("['\\u667a\\u80fd\\u7535\\u7f51', 5]"), 'request must pin the smart-grid block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 13]"), 'request must pin the other-stock block');
assert(request.includes("baselineName: '\\u6df1\\u632f\\u4e1a\\uff21'"), 'request must declare the full-width-name normalization');
assert(request.includes("baselineName: '\\u91d1 \\u87b3 \\u8782'"), 'request must declare the source-faithful whitespace normalization');
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

console.log('2026-08-13 TGB production request tests passed');
