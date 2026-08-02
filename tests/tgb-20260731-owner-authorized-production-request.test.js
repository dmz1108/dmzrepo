'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const requestPath = path.join(
  root,
  'ops',
  'production',
  'requests',
  '2026-08-02-tgb-hunan-20260731-owner-authorized-write.ps1',
);
const request = fs.readFileSync(requestPath, 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260731_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-08-02-tgb-hunan-20260731-owner-authorized-write.ps1'"), 'payload upload must be bound to the exact request');
assert(request.includes("$expectedPayloadSha256 = 'fa211bd37a1ef1c76498b92e791bff6d19111f7ea3de8e53e28dcc88045b1054'"), 'request must pin the manual payload hash');
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2tSJcjNYab7'"), 'request must pin the official article');
assert(request.includes("imageUrl = 'https://image.tgb.cn/img/2026/07/31/10g3ru3rhcqj.png_760w.png'"), 'request must pin the manifest image URL');
assert(request.includes("expectedImageSha256 = '3048e335c7741d45f7231a5d44227006834b9a40bf99d85aa3ed60ff518726a3'"), 'request must pin the official image hash');
assert(request.includes('const expectedImageLength = 1505003'), 'request must pin the official image length');
assert(request.includes('const expectedCount = 98'), 'request must require the 98-stock formal pool');
assert(request.includes('const expectedRawPoolCount = 99'), 'request must pin the 99-row raw terminal pool');
assert(request.includes("expectedEligibleCodeSetSha256 = '908743e0babcb01990c299e4b3af97774d988811f24982b382e28eff814d678f'"), 'request must pin the eligible code set');

assert(request.includes("'\\u7b97\\u529b+\\u6570\\u636e\\u4e2d\\u5fc3': 18"), 'request must pin the compute/data-center block');
assert(request.includes("'\\u4eba\\u5de5\\u667a\\u80fd\\u5927\\u6a21\\u578b': 17"), 'request must pin the AI-model block');
assert(request.includes("'\\u673a\\u5668\\u4eba': 14"), 'request must pin the robot block');
assert(request.includes("'\\u5176\\u4ed6\\u4e2a\\u80a1': 7"), 'request must pin the final block');
assert(request.includes('manualBlockTotal !== expectedCount'), 'request must require manual block totals to equal the formal count');

assert(request.includes("code: '605178'"), 'request must bind the storage-chip override to code 605178');
assert(request.includes("authorizedCompletion: '\\uff09'"), 'request must record only the authorized closing punctuation for 605178');
assert(request.includes("code: '605198'"), 'request must bind the copper-clad override to code 605198');
assert(request.includes("authorizedCompletion: '\\u677f\\uff09'"), 'request must record the authorized copper-clad suffix for 605198');
assert(request.includes("authorizedBy: 'owner'"), 'request must record owner authorization');
assert(request.includes("scope: 'one-time-2026-07-31'"), 'request must keep the exception date-scoped');
assert(request.includes('manualOverridesMatch'), 'request must reject altered override metadata');
assert(request.includes('overrideRowsMatch'), 'request must reject rows that diverge from the authorized values');
assert(request.includes('fixedOverrideQualityNote'), 'override rows must retain explicit provenance');
assert(request.includes('ownerAuthorizedOverrides: expectedManualOverrides'), 'stored validation must retain override provenance');

assert(request.includes("code: '000032'"), 'request must explicitly record the source-name width difference');
assert(request.includes("sourceName: '\\u6df1\\u6851\\u8fbeA'"), 'request must preserve the source ASCII suffix');
assert(request.includes("baselineName: '\\u6df1\\u6851\\u8fbe\\uff21'"), 'request must record the terminal-pool full-width suffix');
assert(request.includes('missingCodes.length'), 'request must reject missing codes');
assert(request.includes('extraCodes.length'), 'request must reject extra codes');
assert(request.includes('duplicateCodes.length'), 'request must reject duplicate codes');
assert(request.includes('weakRows.length'), 'request must reject weak rows');
assert(request.includes("'--main-reason-backfill'"), 'request must rebuild the same-day combined database');
assert(request.includes('validateAutoTgb(auto, expectedCodes)'), 'request must validate persisted auto-fold TGB rows');
assert(request.includes('validatePreviouslyHealthySources'), 'request must prevent regression of existing sources');
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'), 'request must roll back every touched artifact on failure');
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

console.log('2026-07-31 owner-authorized TGB production request tests passed');
