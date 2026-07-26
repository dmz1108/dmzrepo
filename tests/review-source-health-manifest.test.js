'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const {
  REVIEW_HEALTH_MANIFEST_RULE_VERSION,
  buildLegacyReviewHealthProjection,
  buildReviewHealthManifest,
  compareReviewHealthProjection,
  isExcludedReviewStock,
  summarizeReviewSourceRows,
} = require('../review-source-health-manifest');

const DAY = '2026-07-23';
const row = (code, name, extra = {}) => ({
  code,
  name,
  boardTopic: '算力',
  detailReason: '服务器',
  confidence: 0.96,
  ...extra,
});
const observation = payload => ({
  exists: true,
  payload,
  error: '',
  file: 'fixture.json',
  byteSize: 100,
  modifiedAt: '2026-07-23T08:00:00.000Z',
  contentHash: 'fixture-hash',
});
const source = (group, label, payload) => ({
  group,
  label,
  ...observation(payload),
});
const baseInput = () => ({
  day: DAY,
  generatedAt: '2026-07-23T08:30:00.000Z',
  isTradingDay: true,
  afterMarketClose: true,
  terminal: observation({
    day: DAY,
    stocks: [
      row('600001', '甲'),
      row('600002', '乙'),
      row('920001', '北交样本'),
    ],
  }),
  combined: observation({
    day: DAY,
    stocks: [row('600001', '甲'), row('600002', '乙')],
  }),
  sources: [
    source('kaipanla', '复盘啦', {
      day: DAY,
      boards: [{
        rows: [
          row('600001', '甲'),
          row('600001', '甲'),
          row('600002', '乙'),
          row('920001', '北交样本'),
        ],
      }],
    }),
    source('jiuyangongshe', '韭研', {
      day: DAY,
      rows: [row('600001', '甲'), row('600002', '乙')],
    }),
    source('xuangubao', '选股宝', {
      day: DAY,
      count: 99,
      rows: [row('600001', '甲'), row('600002', '乙')],
    }),
    source('tgb', '淘股吧', {
      day: DAY,
      rows: [row('600001', '甲')],
    }),
  ],
});

const manifest = buildReviewHealthManifest(baseInput(), {
  excludeRow: item => isExcludedReviewStock(item?.code, item?.name),
});
assert.strictEqual(manifest.ruleVersion, REVIEW_HEALTH_MANIFEST_RULE_VERSION);
assert.strictEqual(manifest.status, 'healthy');
assert.strictEqual(manifest.blockingOk, true);
assert.strictEqual(manifest.writesAllowed, false);
assert.strictEqual(manifest.terminal.actual, 2, 'terminal pool must use filtered unique codes');
assert.strictEqual(manifest.combined.poolComparison.exact, true);

const kaipanla = manifest.sources.find(item => item.group === 'kaipanla');
assert.strictEqual(kaipanla.observed.rawRowCount, 4);
assert.strictEqual(kaipanla.observed.excludedRowCount, 1);
assert.strictEqual(kaipanla.rowCount, 3);
assert.strictEqual(kaipanla.actual, 2);
assert.strictEqual(kaipanla.observed.duplicateCodeCount, 1);
assert.deepStrictEqual(kaipanla.observed.duplicateCodes, [{ code: '600001', count: 2 }]);

const xuangubao = manifest.sources.find(item => item.group === 'xuangubao');
assert.strictEqual(xuangubao.actual, 2, 'cached payload.count must never be trusted');
assert.strictEqual(xuangubao.rawActual, 2);

const tgb = manifest.sources.find(item => item.group === 'tgb');
assert.strictEqual(tgb.status, 'healthy', 'source-faithful TGB rows are valid even when not a full terminal pool');
assert.strictEqual(tgb.expected, null);
assert.strictEqual(tgb.expectedBasis, 'source-faithful-diagnostic');
assert.strictEqual(tgb.poolComparison.missingCount, 1, 'TGB pool difference remains visible as a diagnostic');

const identityMismatchInput = baseInput();
identityMismatchInput.terminal = observation({
  day: DAY,
  stocks: [row('603950', '长源东谷'), row('600002', '乙')],
});
identityMismatchInput.combined = observation({
  day: DAY,
  stocks: [row('603950', '长源东谷'), row('600002', '乙')],
});
identityMismatchInput.sources[3] = source('tgb', '淘股吧', {
  day: DAY,
  rows: [row('600950', '长源东谷'), row('600002', '乙')],
});
const identityMismatchManifest = buildReviewHealthManifest(identityMismatchInput);
const identityMismatchTgb = identityMismatchManifest.sources.find(item => item.group === 'tgb');
assert.strictEqual(identityMismatchTgb.status, 'healthy');
assert.strictEqual(identityMismatchTgb.poolComparison.identityMismatchCount, 1);
assert.deepStrictEqual(identityMismatchTgb.poolComparison.identityMismatches, [{
  code: '600950',
  name: '长源东谷',
  expectedCode: '603950',
  reasonCode: 'name-maps-to-different-pool-code',
}]);
const identityMismatchComparison = compareReviewHealthProjection(
  buildLegacyReviewHealthProjection(identityMismatchManifest),
  identityMismatchManifest,
);
assert(identityMismatchComparison.identityMismatchGroups.includes('tgb'));

const ambiguousNameInput = baseInput();
ambiguousNameInput.terminal = observation({
  day: DAY,
  stocks: [row('600001', '同名样本'), row('600002', '同名样本')],
});
ambiguousNameInput.combined = observation({
  day: DAY,
  stocks: [row('600001', '同名样本'), row('600002', '同名样本')],
});
ambiguousNameInput.sources[3] = source('tgb', '淘股吧', {
  day: DAY,
  rows: [row('600002', '同名样本')],
});
const ambiguousNameManifest = buildReviewHealthManifest(ambiguousNameInput);
assert.strictEqual(
  ambiguousNameManifest.sources.find(item => item.group === 'tgb').poolComparison.identityMismatchCount,
  0,
  'an ambiguous terminal-pool name must not be blamed on a source code',
);

const legacy = buildLegacyReviewHealthProjection(manifest);
const comparison = compareReviewHealthProjection(legacy, manifest);
assert.strictEqual(legacy.sourceArtifactStats.find(item => item.group === 'kaipanla').count, 4);
assert(comparison.changedGroups.includes('kaipanla'), 'raw count and filtered unique count difference must be explicit');
assert.strictEqual(comparison.statusChanged, false);

const crossDayInput = baseInput();
crossDayInput.sources[1] = source('jiuyangongshe', '韭研', {
  day: '2026-07-22',
  rows: [row('600001', '甲')],
});
const crossDay = buildReviewHealthManifest(crossDayInput);
const staleSource = crossDay.sources.find(item => item.group === 'jiuyangongshe');
assert.strictEqual(staleSource.status, 'stale');
assert.strictEqual(staleSource.actual, null, 'wrong-day values must not be exposed as target-day actuals');
assert.strictEqual(staleSource.observed.uniqueCodeCount, 1, 'wrong-day evidence remains available only under observed');
assert.strictEqual(crossDay.status, 'invalid');

const missingBeforeCloseInput = baseInput();
missingBeforeCloseInput.afterMarketClose = false;
missingBeforeCloseInput.sources[2] = {
  group: 'xuangubao',
  label: '选股宝',
  exists: false,
  payload: null,
  error: '',
};
const pending = buildReviewHealthManifest(missingBeforeCloseInput);
assert.strictEqual(pending.sources.find(item => item.group === 'xuangubao').status, 'pending');
assert.strictEqual(pending.status, 'pending');

const publicationWindowInput = baseInput();
publicationWindowInput.sources[2] = {
  group: 'xuangubao',
  label: '选股宝',
  exists: false,
  payload: null,
  error: '',
};
const publicationWindow = buildReviewHealthManifest(publicationWindowInput);
assert.strictEqual(
  buildLegacyReviewHealthProjection(publicationWindow, { reasonReady: false }).status,
  'pending',
  'legacy comparison must preserve the source publication window',
);
assert.strictEqual(
  buildLegacyReviewHealthProjection(publicationWindow, { reasonReady: true }).status,
  'missing',
  'a missing source becomes actionable only after the publication window',
);

const invalidJsonInput = baseInput();
invalidJsonInput.sources[2] = {
  group: 'xuangubao',
  label: '选股宝',
  exists: true,
  payload: null,
  error: 'invalid JSON',
};
const invalidJson = buildReviewHealthManifest(invalidJsonInput);
assert.strictEqual(invalidJson.sources.find(item => item.group === 'xuangubao').status, 'invalid');
assert.strictEqual(invalidJson.status, 'invalid');

const combinedMissingInput = baseInput();
combinedMissingInput.combined = observation({
  day: DAY,
  stocks: [row('600001', '甲')],
});
const combinedMissing = buildReviewHealthManifest(combinedMissingInput);
assert.strictEqual(combinedMissing.combined.poolComparison.missingCount, 1);
assert.strictEqual(combinedMissing.status, 'invalid');
assert.strictEqual(combinedMissing.reasonCode, 'combined-pool-mismatch');

const marketClosedInput = baseInput();
marketClosedInput.isTradingDay = false;
const marketClosed = buildReviewHealthManifest(marketClosedInput);
assert.strictEqual(marketClosed.status, 'not-required');
assert.strictEqual(marketClosed.terminal.actual, null);
assert(marketClosed.sources.every(item => item.actual === null));

const summary = summarizeReviewSourceRows([
  row('600001', '甲'),
  row('600001', '甲'),
  row('920001', '北交样本'),
  row('600003', '*ST样本'),
]);
assert.strictEqual(summary.rawRowCount, 4);
assert.strictEqual(summary.excludedRowCount, 2);
assert.strictEqual(summary.rowCount, 2);
assert.strictEqual(summary.uniqueCodeCount, 1);

const historicalOcrFallbackSummary = summarizeReviewSourceRows([
  row('600004', '历史数值标记', { confidence: 0.8, ocrFallback: 1 }),
  row('600005', '历史字符串标记', { confidence: 0.8, ocrFallback: 'true' }),
]);
assert.strictEqual(
  historicalOcrFallbackSummary.lowConfidenceCodeCount,
  2,
  'historical truthy ocrFallback values must preserve the deployed classification',
);

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const auditToolPath = path.join(root, 'tools', 'audit-review-health-manifest.js');
const auditTool = fs.readFileSync(auditToolPath, 'utf8');

function functionSource(name) {
  const match = server.match(new RegExp(`(?:async )?function ${name}\\(`));
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

const shadowBuilder = functionSource('buildReviewSourceHealthShadowDay');
const shadowEndpoint = functionSource('adminReviewSourceHealthShadow');
const sourceStats = functionSource('recomputeReviewSourceStatsFromTabs');
assert(shadowBuilder.includes('readReviewHealthObservation'), 'shadow builder must use direct read-only observations');
assert(!/\bensure[A-Z]/.test(shadowBuilder), 'shadow builder must not call generators or ensure paths');
assert(!/writeFile|appendFile|rename|guardedWrite|fetch\(/.test(shadowBuilder), 'shadow builder must not write or fetch');
assert(!shadowEndpoint.includes('inspectLimitUpMainReasonDbDay'), 'shadow endpoint must not call the legacy side-effecting inspector');
assert(shadowEndpoint.includes("mode: 'shadow-read-only'"));
assert(shadowEndpoint.includes('identityMismatchDays'));
assert(sourceStats.includes('summarizeReviewSourceRows'), 'source view and shadow manifest must share row normalization');
assert(server.includes("'/api/admin/review-source-health-shadow'"), 'admin-only shadow route must be registered');
assert(!/writeFile|appendFile|rename|copyFile|mkdir|rm\(/.test(auditTool), 'audit tool must remain strictly read-only');

const missingRootAudit = JSON.parse(childProcess.execFileSync(process.execPath, [
  auditToolPath,
  `--root=${path.join(root, '__missing_review_health_fixture__')}`,
  '--end-day=2026-07-23',
  '--days=2',
], { encoding: 'utf8' }));
assert.strictEqual(missingRootAudit.daySelection, 'recent-trading-days');
assert.strictEqual(missingRootAudit.scanned, 2, 'entirely missing trading days must still be audited');
assert.deepStrictEqual(missingRootAudit.rows.map(item => item.day), ['2026-07-22', '2026-07-23']);
assert(missingRootAudit.rows.every(item => item.manifest.status === 'missing'));

console.log('review source health manifest tests passed');
