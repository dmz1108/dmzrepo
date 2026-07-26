'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const sop = fs.readFileSync(path.join(root, 'docs', 'ops', 'TGB_HUNAN_DAILY_SOP.md'), 'utf8');
const claude = fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8');

function functionSource(name) {
  const match = server.match(new RegExp(`async function ${name}\\(`));
  assert(match, `missing function ${name}`);
  const start = match.index;
  const bodyStart = server.indexOf('{', server.indexOf(')', start));
  let depth = 0;
  for (let index = bodyStart; index < server.length; index += 1) {
    if (server[index] === '{') depth += 1;
    if (server[index] === '}') depth -= 1;
    if (depth === 0) return server.slice(start, index + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

const ensureTgb = functionSource('ensureTgbHunanStructuredArtifactDay');
assert(ensureTgb.includes('fetchTgbHunanRawEvidenceDay'), 'TGB flow must retain official raw evidence fetching');
assert(ensureTgb.includes('manual-hunan-table-required'), 'TGB flow must explicitly require manual transcription');
assert(!ensureTgb.includes('buildTgbHunanStructuredArtifactFromVision'), 'TGB flow must not invoke automatic vision structuring');

const autoSync = functionSource('runAutoTgbVisionSyncIfDue');
assert(autoSync.includes('manualRequired: true'), 'automatic TGB structuring task must report manual-only mode');
assert(!autoSync.includes('readTgbQwenOcrConfig'), 'automatic TGB task must not read Qwen configuration');
assert(!autoSync.includes('ensureTgbHunanStructuredArtifactDay'), 'automatic TGB task must not attempt formal structuring');

const legacyCli = functionSource('runTgbVisionSyncCli');
assert(legacyCli.includes('runTgbHunanRawEvidenceCli'), 'legacy vision CLI must redirect to raw evidence only');
assert(!legacyCli.includes('ensureTgbHunanStructuredArtifactDay'), 'legacy vision CLI must not write a structured TGB artifact');
assert(!legacyCli.includes('readTgbQwenOcrConfig'), 'legacy vision CLI must not read Qwen configuration');

const rawCli = functionSource('runTgbHunanRawEvidenceCli');
assert(rawCli.includes('manualRequired: true'), 'raw evidence CLI must announce the manual transcription requirement');
assert(rawCli.includes('automaticStructuringDisabled: true'), 'raw evidence CLI must announce that automatic structuring is disabled');

for (const removedSymbol of [
  'buildTgbHunanStructuredArtifactFromVision',
  'buildTgbHunanStructuredArtifactFromQwenOcr',
  'buildTgbHunanStructuredFromVision',
  'readTgbQwenOcrConfig',
  'TGB_VISION_ALLOW_QWEN',
  'readTgbHunanOcrImage',
  'runWinRtOcr',
  'fetchTgbHunanOcrRows',
  'WINRT_OCR_SCRIPT',
]) {
  assert(!server.includes(removedSymbol), `legacy TGB Qwen/vision code must stay deleted: ${removedSymbol}`);
}
assert(!/\bqwen\b/i.test(server), 'main server must not retain an unused Qwen TGB implementation');
assert(!/\bwinrt\b/i.test(server), 'main server must not retain an unused WinRT TGB OCR implementation');
assert(!fs.existsSync(path.join(root, 'winrt-ocr.ps1')), 'the unused WinRT OCR helper script must stay deleted');

const structuredReader = functionSource('fetchTgbHunanStructuredRows');
assert(structuredReader.includes('官方复盘原图人工逐行结构化'), 'TGB structured rows must identify the manual official-image source');
assert(!structuredReader.includes('视觉识别+涨停池对账'), 'TGB structured rows must not claim the removed vision path');

assert(sop.includes('--tgb-hunan-raw-evidence'), 'TGB SOP must use the raw evidence command');
assert(!/node\s+\.\\kpl-stats-server\.js\s+--tgb-vision-sync/.test(sop), 'TGB SOP must not instruct operators to run vision sync');
assert(sop.includes('禁止使用 Qwen、OCR'), 'TGB SOP must explicitly prohibit Qwen and OCR');
assert(claude.includes('TGB 湖南人复盘只允许官方原图人工逐行转录'), 'root instructions must preserve the manual-only TGB policy');

console.log('ALL TGB MANUAL-ONLY CHECKS PASSED');
