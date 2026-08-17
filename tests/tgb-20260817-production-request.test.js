'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-17-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260817_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-17-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = '715d7f1c2600c043056488c8e23e8f001ad11b22c2af2eac0914750365ac4a6c'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2ukUULM6lx6'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-07.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '42747eedae5809cfb06bbf47d5f358ddc8e72e6bb3e266543f5f4bbc9c17dd03'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 989124'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 106'), 'request must require the 106-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 106'), 'request must pin the 106-row raw terminal pool');
assert(request.includes('const expectedExcludedCodes = []'), 'request must pin the empty excluded-code set');
assert(request.includes("['\\u673a\\u5668\\u4eba', 12]"), 'request must pin the robot block');
assert(request.includes("['\\u534a\\u5bfc\\u4f53', 11]"), 'request must pin the semiconductor block');
assert(request.includes("['\\u533b\\u7597\\u533b\\u836f', 10]"), 'request must pin the medical block');
assert(request.includes("['PCB\\u677f', 9]"), 'request must pin the PCB block');
assert(request.includes("['\\u5927\\u6d88\\u8d39', 9]"), 'request must pin the consumer block');
assert(request.includes("['\\u5149\\u901a\\u4fe1', 9]"), 'request must pin the optical block');
assert(request.includes("['\\u7b97\\u529b', 7]"), 'request must pin the compute block');
assert(request.includes("['\\u519c\\u6797\\u7267\\u6e14', 6]"), 'request must pin the agriculture block');
assert(request.includes("['\\u822a\\u5929', 4]"), 'request must pin the aerospace block');
assert(request.includes("['\\u71c3\\u6c14\\u8f6e\\u673a', 4]"), 'request must pin the gas-turbine block');
assert(request.includes("['\\u667a\\u80fd\\u7535\\u7f51', 4]"), 'request must pin the smart-grid block');
assert(request.includes("['\\u80a1\\u6743\\u8f6c\\u8ba9', 3]"), 'request must pin the equity-transfer block');
assert(request.includes("['\\u5316\\u5de5', 3]"), 'request must pin the chemical block');
assert(request.includes("['\\u6db2\\u51b7\\u670d\\u52a1\\u5668', 3]"), 'request must pin the liquid-cooling block');
assert(request.includes("['\\u6709\\u8272\\u91d1\\u5c5e', 3]"), 'request must pin the nonferrous block');
assert(request.includes("['\\u57f9\\u80b2\\u94bb\\u77f3', 2]"), 'request must pin the cultivated-diamond block');
assert(request.includes("['\\u5176\\u4ed6', 7]"), 'request must pin the other block');
assert(request.includes("code: '000029'"), 'request must declare the full-width A normalization');
assert(request.includes("code: '000735'"), 'request must declare the spaced Luoniushan normalization');
assert(request.includes("code: '002081'"), 'request must declare the spaced Jintanglang normalization');
assert(request.includes("code: '002165'"), 'request must declare the spaced Hongbaoli normalization');
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

console.log('2026-08-17 TGB production request tests passed');

