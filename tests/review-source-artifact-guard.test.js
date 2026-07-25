'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  guardedImportReviewSourceArtifact,
  reviewSourceArtifactPayloadDay,
} = require('../review-source-artifact-guard');

const writeJson = (file, payload) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
};
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dreamerqi-review-guard-'));
  const backupRoot = path.join(root, 'backups');
  try {
    assert.strictEqual(reviewSourceArtifactPayloadDay({ tradeDate: '20260724' }), '2026-07-24');
    assert.strictEqual(reviewSourceArtifactPayloadDay({}), '');

    const goodSource = path.join(root, 'good.json');
    const goodTarget = path.join(root, 'formal', '2026-07-24.json');
    writeJson(goodSource, { day: '2026-07-24', count: 1, rows: [{ code: '600001' }] });
    const imported = await guardedImportReviewSourceArtifact({
      group: 'tgb',
      sourceFile: goodSource,
      targetFile: goodTarget,
      targetDay: '2026-07-24',
      backupRoot,
    });
    assert.strictEqual(imported.ok, true, 'same-day candidate may fill an absent target');
    assert.strictEqual(readJson(goodTarget).day, '2026-07-24');

    const wrongDaySource = path.join(root, 'wrong-day.json');
    const wrongDayTarget = path.join(root, 'wrong-day-target.json');
    writeJson(wrongDaySource, { day: '2026-07-23', count: 1, rows: [{ code: '600002' }] });
    const wrongDay = await guardedImportReviewSourceArtifact({
      group: 'jiuyangongshe',
      sourceFile: wrongDaySource,
      targetFile: wrongDayTarget,
      targetDay: '2026-07-24',
      backupRoot,
    });
    assert.strictEqual(wrongDay.ok, false);
    assert.strictEqual(wrongDay.reasonCode, 'cross-day-candidate');
    assert.strictEqual(fs.existsSync(wrongDayTarget), false, 'wrong-day candidate must not create the target');

    const missingDaySource = path.join(root, 'missing-day.json');
    writeJson(missingDaySource, { count: 1, rows: [{ code: '600003' }] });
    const missingDay = await guardedImportReviewSourceArtifact({
      group: 'jiuyangongshe',
      sourceFile: missingDaySource,
      targetFile: path.join(root, 'missing-day-target.json'),
      targetDay: '2026-07-24',
      backupRoot,
    });
    assert.strictEqual(missingDay.reasonCode, 'candidate-day-missing');

    const protectedTarget = path.join(root, 'protected-tgb.json');
    const replacementSource = path.join(root, 'replacement-tgb.json');
    const protectedPayload = {
      day: '2026-07-24',
      source: 'review/tgb-hunan-structured',
      method: 'manual-hunan-table',
      count: 1,
      rows: [{ code: '600004', matchType: 'manual-hunan-table' }],
      validation: { manualSecondPassReviewed: true },
    };
    writeJson(protectedTarget, protectedPayload);
    writeJson(replacementSource, { day: '2026-07-24', count: 1, rows: [{ code: '600005' }] });
    const protectedBytes = fs.readFileSync(protectedTarget, 'utf8');
    const protectedResult = await guardedImportReviewSourceArtifact({
      group: 'tgb',
      sourceFile: replacementSource,
      targetFile: protectedTarget,
      targetDay: '2026-07-24',
      backupRoot,
    });
    assert.strictEqual(protectedResult.ok, false);
    assert.strictEqual(protectedResult.protected, true);
    assert.strictEqual(protectedResult.reasonCode, 'protected-manual-target');
    assert.strictEqual(fs.readFileSync(protectedTarget, 'utf8'), protectedBytes, 'protected TGB bytes must remain unchanged');

    const autoTarget = path.join(root, 'auto-target.json');
    const autoSource = path.join(root, 'auto-source.json');
    writeJson(autoTarget, { day: '2026-07-24', method: 'automatic', count: 1, rows: [{ code: '600006' }] });
    writeJson(autoSource, { day: '2026-07-24', method: 'automatic', count: 1, rows: [{ code: '600007' }] });
    const replaced = await guardedImportReviewSourceArtifact({
      group: 'jiuyangongshe',
      sourceFile: autoSource,
      targetFile: autoTarget,
      targetDay: '2026-07-24',
      backupRoot,
    });
    assert.strictEqual(replaced.ok, true);
    assert(replaced.backupFile && fs.existsSync(replaced.backupFile), 'replacement must retain a rollback backup');
    assert.strictEqual(readJson(replaced.backupFile).rows[0].code, '600006');
    assert.strictEqual(readJson(autoTarget).rows[0].code, '600007');

    console.log('review source artifact guard tests passed');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
