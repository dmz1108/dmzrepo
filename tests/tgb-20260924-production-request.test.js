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
  '2026-09-24-tgb-hunan-write.ps1',
), 'utf8');
const embeddedJs = request.match(/\$js = @'\r?\n([\s\S]*?)\r?\n'@/);

assert(embeddedJs, 'request must contain one extractable embedded JavaScript program');
assert.doesNotThrow(() => new Function(embeddedJs[1]), 'embedded production JavaScript must parse');
assert(/^[\x00-\x7f]*$/.test(request), 'Windows PowerShell 5.1 request must remain ASCII-only');

assert(request.includes("$expectedPayloadSha256 = '3d13e127c00963e84ec06cd4e621b67601d4a0ffd27b3d7a0eee7c3263c36e2c'"));
assert(request.includes("const day = '2026-09-24'"));
assert(request.includes("articleUrl = 'https://www.tgb.cn/a/2vlWvkwS6PU'"));
assert(request.includes("imageFile = 'image-01-06.png'"));
assert(request.includes("expectedImageSha256 = '329c93a7e677a990b7224f105f55c87119003d1116e07b4ad128d076cacaf924'"));
assert(request.includes('const expectedImageLength = 590626'));
assert(request.includes('const expectedCount = 51'));
assert(request.includes('const expectedRawPoolCount = 52'));
assert(request.includes("const expectedExcludedCodes = ['920748']"));
assert(request.includes("['\\u6d77\\u5ce1\\u4e24\\u5cb8', 10]"));
assert(request.includes("['\\u673a\\u5668\\u4eba', 8]"));
assert(request.includes("['\\u5927\\u6d88\\u8d39', 6]"));
assert(request.includes("['\\u4f20\\u5a92', 4]"));
assert(request.includes("['\\u5149\\u901a\\u4fe1', 3]"));
assert(request.includes("['\\u533b\\u836f', 3]"));
assert(request.includes("['\\u4eea\\u5668\\u4eea\\u8868', 3]"));
assert(request.includes("['\\u5176\\u4ed6\\u70ed\\u70b9', 4]"));
assert(request.includes("['\\u5176\\u4ed6\\u4e2a\\u80a1', 10]"));
assert(request.includes("code: '002029'"));
assert(request.includes("baselineName: '\\u4e03 \\u5339 \\u72fc'"));
assert(request.includes("code: '002264'"));
assert(request.includes("baselineName: '\\u65b0 \\u534e \\u90fd'"));
assert(request.includes("normalization: 'NFKC+remove-whitespace'"));
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

console.log('2026-09-24 TGB production request tests passed');
