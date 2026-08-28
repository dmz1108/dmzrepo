'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-27-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260827_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-27-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = 'd96a1749649e50764c4da12015c0abaab0db456cd80479f68a1ba3c73a96fcea'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2uBuay3MSqq'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-06.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '18e03a34538b496c7982d6c6c52a78d694ade3b45e9f86ea262a264d2b5ebf2c'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 801096'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 76'), 'request must require the 76-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 77'), 'request must pin the 77-row raw terminal pool');
assert(request.includes("const expectedExcludedCodes = ['920895']"), 'request must pin the Beijing Exchange exclusion');
assert(request.includes("['\\u5149\\u901a\\u4fe1', 15]"), 'request must pin the optical-communication block');
assert(request.includes("['\\u519c\\u6797\\u7267\\u6e14', 8]"), 'request must pin the agriculture block');
assert(request.includes("['PCB', 6]"), 'request must pin the PCB block');
assert(request.includes("['\\u5927\\u91d1\\u878d', 5]"), 'request must pin the big-finance block');
assert(request.includes("['\\u534a\\u5bfc\\u4f53', 4]"), 'request must pin the semiconductor block');
assert(request.includes("['\\u6c1f\\u5316\\u5de5', 4]"), 'request must pin the fluorochemical block');
assert(request.includes("['\\u6db2\\u51b7\\u670d\\u52a1\\u5668', 4]"), 'request must pin the liquid-cooling block');
assert(request.includes("['\\u533b\\u7597\\u533b\\u836f', 4]"), 'request must pin the medical block');
assert(request.includes("['\\u5b58\\u50a8', 3]"), 'request must pin the storage block');
assert(request.includes("['\\u9ec4\\u91d1', 3]"), 'request must pin the gold block');
assert(request.includes("['\\u4e1a\\u7ee9\\u589e\\u957f', 3]"), 'request must pin the performance-growth block');
assert(request.includes("['\\u5176\\u4ed6\\u70ed\\u70b9', 12]"), 'request must pin the other-hotspot block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 5]"), 'request must pin the other-stock block');
assert(request.includes("code: '301666'"), 'request must declare the Da Pu Wei source alias');
assert(request.includes("baselineName: '\\u5927\\u666e\\u5fae-UW'"), 'request must pin the Da Pu Wei terminal-pool suffix');
assert(request.includes("code: '688790'"), 'request must declare the Ang Rui Wei source alias');
assert(request.includes("baselineName: '\\u6602\\u745e\\u5fae-UW'"), 'request must pin the Ang Rui Wei terminal-pool suffix');
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

console.log('2026-08-27 TGB production request tests passed');
