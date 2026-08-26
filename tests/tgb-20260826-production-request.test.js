'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-08-26-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260826_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-26-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = '89ac892e050510027c653802d221bdb6318f622de81ce8859be908c937b76a89'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2uzSn8RLuWv'"), 'request must pin the official article');
assert(request.includes("imageFile = 'image-01-06.png'"), 'request must pin the selected official image');
assert(request.includes("expectedImageSha256 = '32a6d6c2651fe43ed5eece818ae0ad4f0064f22aac58b47fe6f30997ae4725c8'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 644390'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 52'), 'request must require the 52-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 52'), 'request must pin the 52-row raw terminal pool');
assert(request.includes('const expectedExcludedCodes = []'), 'request must pin the empty excluded-code set');
assert(request.includes("['\\u5927\\u91d1\\u878d', 6]"), 'request must pin the big-finance block');
assert(request.includes("['\\u5149\\u901a\\u4fe1', 6]"), 'request must pin the optical-communication block');
assert(request.includes("['\\u516c\\u544a', 5]"), 'request must pin the announcement block');
assert(request.includes("['\\u533b\\u836f', 5]"), 'request must pin the medical block');
assert(request.includes("['\\u9ec4\\u91d1', 4]"), 'request must pin the gold block');
assert(request.includes("['\\u534a\\u5bfc\\u4f53', 3]"), 'request must pin the semiconductor block');
assert(request.includes("['\\u53ef\\u63a7\\u6838\\u805a\\u53d8', 3]"), 'request must pin the controlled-fusion block');
assert(request.includes("['\\u519c\\u4e1a', 3]"), 'request must pin the agriculture block');
assert(request.includes("['\\u6709\\u8272\\u91d1\\u5c5e', 3]"), 'request must pin the nonferrous-metal block');
assert(request.includes("['\\u5176\\u4ed6\\u70ed\\u70b9', 6]"), 'request must pin the other-hotspot block');
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 8]"), 'request must pin the other-stock block');
assert(request.includes("code: '000997'"), 'request must declare the spaced Xin Dalu normalization');
assert(request.includes("baselineName: '\\u65b0 \\u5927 \\u9646'"), 'request must pin the terminal-pool name formatting');
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

console.log('2026-08-26 TGB production request tests passed');
