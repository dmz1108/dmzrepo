'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'production-ops.yml'), 'utf8');
const request = fs.readFileSync(path.join(root, 'ops', 'production', 'requests', '2026-07-23-tgb-hunan-write.ps1'), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(workflow.includes('DREAMERQI_TGB_20260723_PAYLOAD_B64'), 'manual payload must come from the protected production environment');
assert(workflow.includes("$SCRIPT_PATH\" == 'ops/production/requests/2026-07-23-tgb-hunan-write.ps1'"), 'payload upload must be bound to the exact date-bound request');
assert(workflow.includes('echo "remote_payload=$remote_payload" >> "$GITHUB_OUTPUT"'), 'remote payload cleanup output must be recorded before SCP can fail');
assert(workflow.includes('known_payload="dreamerqi-tgb-payload-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}.b64"'), 'cleanup must derive and remove the date-bound payload name even after a failed upload step');
assert(workflow.includes("Test-Path -LiteralPath 'C:/Windows/Temp/${known_payload}'"), 'cleanup must verify the protected remote payload is absent');
assert(workflow.includes('exit "$remote_status"'), 'remote cleanup failure must fail the workflow');
const cleanupSection = workflow.slice(workflow.indexOf('- name: Remove staged production files'));
assert(cleanupSection.indexOf("Remove-Item -LiteralPath 'C:/Windows/Temp/${known_payload}'")
  < cleanupSection.indexOf("Remove-Item -LiteralPath 'C:/Windows/Temp/${REMOTE_SCRIPT}'"), 'protected payload removal must be attempted before less-sensitive staged files');
assert(cleanupSection.lastIndexOf('Remove-Item -LiteralPath') < cleanupSection.indexOf('if (Test-Path -LiteralPath'), 'cleanup must attempt every removal before any verification can throw');
assert(!cleanupSection.includes('if [[ "$remote_status" -ne 255 ]]'), 'all cleanup failures must retry before the workflow fails closed');
assert(request.includes("$expectedPayloadSha256 = '934b778a239e9010e89a11bb12e7304de3ba4877e2dd55d74be7dd94be5b5269'"), 'request must pin the manual payload hash');
assert(request.includes("const zlib = require('zlib')"), 'oversized manual JSON must use a compact date-bound transport');
assert(request.includes('zlib.gunzipSync(compressedPayloadBytes)'), 'request must decompress before validating the original JSON hash');
assert(request.includes("expectedImageSha256 = '829af8cdc44361857914e11a36d93eb8340baf9336ca19c0b769cca3f65057bf'"), 'request must pin the twice-reviewed official image hash');
assert(request.includes('officialArticle.title !== articleTitle'), 'request must verify the official article title');
assert(request.includes("const expectedCount = 115"), 'request must require the 115-stock filtered review pool');
assert(request.includes("const expectedRawPoolCount = 115"), 'request must independently require the 115-stock raw terminal pool');
assert(request.includes('excludedRows.length !== 0'), 'request must require zero ST/BSE/new-prefix exclusions');
assert(request.includes('publicRequestTimeoutMs = 25000'), 'public verification must have a bounded request timeout');
assert(request.includes('request.destroy(new Error'), 'timed-out public requests must enter script-owned rollback');
assert(request.includes('missingCodes.length'), 'request must reject missing codes');
assert(request.includes('extraCodes.length'), 'request must reject extra codes');
assert(request.includes('duplicateCodes.length'), 'request must reject duplicate codes');
assert(request.includes('weakRows.length'), 'request must reject weak formal rows');
assert(request.includes("normalize('NFKC')"), 'request must explicitly audit harmless full-width name differences');
assert(request.includes("nameNormalizationDifferences.length === 0"), 'request must reject unexpected normalized-name differences');
assert(request.includes("'\\u7535\\u529b+\\u7535\\u7f51\\u8bbe\\u5907': 34"), 'request must pin the power-grid topic-block count');
assert(request.includes("['\\u5176\\u4ed6', 2]"), 'request must pin the first other topic-block count');
assert(request.includes("['\\u5176\\u4ed6', 7]"), 'request must pin the final other topic-block count');
assert(request.includes('manualBlockTotal !== expectedCount'), 'request must require manual topic-block rows to sum to the formal total');
assert(request.includes("matchType: 'manual-hunan-table'"), 'request must add the fixed formal provenance fields before validation and storage');
assert(request.includes('manualSecondPassReviewed: true'), 'request must record the second manual image review');
assert(request.includes("'--main-reason-backfill'"), 'request must rebuild the same-day combined reason database');
assert(request.includes('validateStoredBaseline(storedBaseline, expectedCodes)'), 'request must ensure force rebuild did not change the filtered terminal pool');
assert(request.includes('validateAutoTgbRows(postPublicAuto, expectedCodes)'), 'request must revalidate persisted TGB auto evidence after public force refresh');
assert(request.includes("combined.sourceCoverage?.reviewAutoSources"), 'request must verify persisted combined TGB coverage');
assert(request.includes("mainDay.sourceCoverage?.reviewAutoSources"), 'request must verify public main-reason TGB coverage');
assert(request.includes('validateAllReviewSourceHealth'), 'request must fail closed on degradation of any existing review source');
assert(request.includes('(sourceView.sourceErrors || []).length === 0'), 'public source errors must be empty');
assert(request.includes('serviceRestarted: false'), 'manual data write must not claim a service restart');
assert(request.includes('rollbackFailures.push'), 'rollback must continue restoring other files after one restore failure');
assert(request.includes('rollback public state mismatch'), 'rollback must refresh and verify public cache state');
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'), 'rollback must restore and hash-check every touched file');
assert(request.includes('mainReasonStateSha256'), 'rollback must compare per-stock main-reason content, not counts alone');
assert(request.includes('/day?day=${day}&force=1&rollback='), 'rollback must refresh the read-only combined cache');
assert(!request.includes('/source-view?day=${day}&force=1&rollback='), 'rollback must not force source-view writers after restoring backups');
assert(request.includes('required cloud operation log is missing'), 'both cloud logs must exist before any production write');
assert(!request.includes("if (fs.existsSync(file)) fs.appendFileSync(file, logEntry"), 'cloud log appends must not silently skip missing logs');

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

console.log('2026-07-23 TGB production request tests passed');
