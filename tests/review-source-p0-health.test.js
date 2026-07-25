'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  adminReviewSourceHealthVerdict,
} = require('../review-source-health');

const healthyArtifacts = ['kaipanla', 'xuangubao', 'jiuyangongshe', 'tgb']
  .map(group => ({ group, exists: true, ok: true, count: 40 }));
const complete = {
  needsSync: false,
  reasonReady: true,
  compatible: true,
  limitUpCount: 40,
  mainReasonCount: 40,
  missingCount: 0,
  sourceArtifactStats: healthyArtifacts,
};

assert.deepStrictEqual(
  adminReviewSourceHealthVerdict(complete, { afterMarketClose: true, requiredSourceCount: 4 }),
  { status: 'healthy', label: '完整', reasonCode: 'reconciled' },
);

const oldFalseGreen = adminReviewSourceHealthVerdict({
  needsSync: false,
  reasonReady: false,
  compatible: false,
  limitUpCount: 0,
  sourceArtifactStats: [],
}, { afterMarketClose: false, requiredSourceCount: 4 });
assert.strictEqual(oldFalseGreen.status, 'pending', 'needsSync=false must not imply healthy before publication');

const missingBase = adminReviewSourceHealthVerdict({
  needsSync: false,
  reasonReady: true,
  compatible: false,
  limitUpCount: 0,
  sourceArtifactStats: [],
}, { afterMarketClose: true, requiredSourceCount: 4 });
assert.strictEqual(missingBase.status, 'missing', 'missing terminal pool must not be green after the publication window');

const completeBeforeWindow = adminReviewSourceHealthVerdict({
  ...complete,
  reasonReady: false,
}, { afterMarketClose: true, requiredSourceCount: 4 });
assert.strictEqual(completeBeforeWindow.status, 'healthy', 'real reconciled rows may become healthy before the time window expires');

const invalid = adminReviewSourceHealthVerdict({
  ...complete,
  needsSync: true,
  missingCount: 1,
}, { afterMarketClose: true, requiredSourceCount: 4 });
assert.strictEqual(invalid.status, 'invalid');

const closed = adminReviewSourceHealthVerdict({
  source: 'market-closed',
  needsSync: false,
}, { afterMarketClose: true, requiredSourceCount: 4 });
assert.strictEqual(closed.status, 'not-required');

const failed = adminReviewSourceHealthVerdict({
  error: 'read failed',
  needsSync: true,
}, { afterMarketClose: true, requiredSourceCount: 4 });
assert.strictEqual(failed.status, 'failed');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'panda-admin.html'), 'utf8');
const syncMode = server.match(/if \(mode === 'missing'\) \{([\s\S]*?)return send\(res, 200,/);
assert(syncMode, 'missing sync branch must remain identifiable');
assert(!syncMode[1].includes('forceSources: true'), 'missing sync must not force-refresh every source');
assert(server.includes('sourceDay = reviewSourceArtifactPayloadDay(payload)'), 'artifact status must inspect the payload day');
assert(server.includes('if (before.protectedManual) {'), 'all protected manual artifacts must stop before a source generator runs');
assert(server.includes('protected manual source artifact already complete'), 'generic sync must skip a complete protected manual artifact');
assert(admin.includes("const reviewStatus = row.status ||"), 'admin UI must render the backend verdict');
assert(!admin.includes("(row.needsSync ? '待补齐' : '完整')"), 'admin UI must not infer complete only from needsSync');

console.log('review source P0 health tests passed');
