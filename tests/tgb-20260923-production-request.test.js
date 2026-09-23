'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const request = fs.readFileSync(path.join(
  root,
  'ops',
  'production',
  'requests',
  '2026-09-23-tgb-hunan-write.ps1',
), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(request.includes("$expectedPayloadSha256 = '59dc1dc67e097c380b401ca2d64f1402f05c18b19cf6d74dc3fd3a3a2b1eaad6'"));
assert(request.includes("const day = '2026-09-23'"));
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2vkiqZe1mF4'"));
assert(request.includes("imageFile = 'image-01-06.png'"));
assert(request.includes("expectedImageSha256 = 'd5eb63b259ec5af7f93f295f17b0d8a99e498d9f3d18a4a607c437529d20715f'"));
assert(request.includes('const expectedImageLength = 642372'));
assert(request.includes('const expectedCount = 51'));
assert(request.includes('const expectedRawPoolCount = 51'));
assert(request.includes('const expectedExcludedCodes = []'));
assert(request.includes("['PCB', 7]"));
assert(request.includes("['\\u623f\\u5730\\u4ea7', 7]"));
assert(request.includes("['\\u56fd\\u4ea7\\u82af\\u7247', 5]"));
assert(request.includes("['\\u4eea\\u5668\\u4eea\\u8868', 4]"));
assert(request.includes("['\\u7eba\\u7ec7', 3]"));
assert(request.includes("['\\u5149\\u901a\\u4fe1', 3]"));
assert(request.includes("['\\u5176\\u4ed6\\u70ed\\u70b9', 16]"));
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 6]"));
assert(request.includes("code: '688512'"));
assert(request.includes("sourceName: '\\u6167\\u667a\\u5fae'"));
assert(request.includes("baselineName: '\\u6167\\u667a\\u5fae-U'"));
assert(request.includes("normalization: 'explicit-source-alias'"));
assert(request.includes('manualBlockTotal !== expectedCount'));
assert(request.includes('manualSecondPassReviewed: true'));
assert(request.includes('missingCodes.length'));
assert(request.includes('extraCodes.length'));
assert(request.includes('duplicateCodes.length'));
assert(request.includes('weakRows.length'));
assert(request.includes('nameDifferencesMatch'));
assert(request.includes("'--main-reason-backfill'"));
assert(request.includes('validateAutoTgb(auto, expectedCodes)'));
assert(request.includes('validatePreviouslyHealthySources'));
assert(request.includes('protected formal TGB file already exists; refusing concurrent overwrite'));
assert(request.includes('restoreFileStates(touchedRels, backupDir, beforeStates)'));
assert(request.includes('serviceRestarted: false'));
assert(!/OCR|Qwen|vision/i.test(request), 'request must not invoke automated visual processing');

console.log('2026-09-23 TGB production request tests passed');
