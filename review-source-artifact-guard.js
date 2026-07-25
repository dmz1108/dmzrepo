'use strict';

const fs = require('fs/promises');
const path = require('path');

function normalizeReviewSourceDay(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const isoDay = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  const parsed = new Date(`${isoDay}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === isoDay ? isoDay : '';
}

function reviewSourceArtifactPayloadDay(payload) {
  if (!payload || typeof payload !== 'object') return '';
  return normalizeReviewSourceDay(
    payload.day
    || payload.sourceDay
    || payload.tradeDay
    || payload.tradeDate
    || payload.date
    || payload.targetDay
    || '',
  );
}

function reviewSourceArtifactCount(group, payload) {
  if (!payload) return 0;
  if (group === 'kaipanla') {
    if (Number(payload.stockRows || 0) > 0) return Number(payload.stockRows);
    return (payload.boards || []).reduce((sum, board) => sum + Number(board?.rows?.length || 0), 0);
  }
  return Number(payload.count || payload.rows?.length || 0);
}

function isProtectedManualReviewArtifact(group, payload, options = {}) {
  if (!options.targetExists) return false;
  if (group === 'tgb') return true;
  if (!payload || typeof payload !== 'object') return false;
  const provenance = [
    payload.origin,
    payload.method,
    payload.sourceMode,
    payload.provenance?.origin,
    payload.provenance?.method,
  ].map(value => String(value || '').toLowerCase());
  if (provenance.some(value => value.includes('manual'))) return true;
  if (payload.validation?.manualSecondPassReviewed === true || payload.evidence?.manualTranscription === true) {
    return true;
  }
  return (Array.isArray(payload.rows) ? payload.rows : [])
    .some(row => String(row?.matchType || '').toLowerCase().includes('manual'));
}

function safeBackupPart(value) {
  return String(value || '').replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 80) || 'artifact';
}

async function readJsonState(file) {
  try {
    return {
      exists: true,
      payload: JSON.parse(await fs.readFile(file, 'utf8')),
      error: null,
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, payload: null, error: null };
    return { exists: true, payload: null, error };
  }
}

async function backupReviewSourceArtifact(targetFile, group, targetDay, backupRoot) {
  const state = await readJsonState(targetFile);
  if (!state.exists) return '';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(
    backupRoot,
    `${stamp}-${safeBackupPart(targetDay)}`,
  );
  await fs.mkdir(backupDir, { recursive: true });
  const backupFile = path.join(
    backupDir,
    `${safeBackupPart(group)}-${safeBackupPart(path.basename(targetFile))}`,
  );
  await fs.copyFile(targetFile, backupFile);
  return backupFile;
}

async function atomicReplaceJson(targetFile, payload) {
  const nonce = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const tempFile = `${targetFile}.${nonce}.tmp`;
  const oldFile = `${targetFile}.${nonce}.old`;
  await fs.mkdir(path.dirname(targetFile), { recursive: true });
  await fs.writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  let movedOld = false;
  try {
    try {
      await fs.rename(targetFile, oldFile);
      movedOld = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.rename(tempFile, targetFile);
    if (movedOld) await fs.rm(oldFile, { force: true });
  } catch (error) {
    await fs.rm(tempFile, { force: true }).catch(() => {});
    if (movedOld) {
      await fs.rm(targetFile, { force: true }).catch(() => {});
      await fs.rename(oldFile, targetFile).catch(() => {});
    }
    throw error;
  }
}

async function guardedImportReviewSourceArtifact(options = {}) {
  const group = String(options.group || '');
  const sourceFile = String(options.sourceFile || '');
  const targetFile = String(options.targetFile || '');
  const targetDay = normalizeReviewSourceDay(options.targetDay);
  if (!group || !sourceFile || !targetFile || !targetDay) {
    return {
      ok: false,
      reasonCode: 'invalid-import-request',
      error: 'review source import requires group, source, target and target day',
      sourceFile,
      targetFile,
    };
  }

  const sourceState = await readJsonState(sourceFile);
  if (!sourceState.exists) {
    return { ok: false, reasonCode: 'source-file-missing', error: 'source file not found', sourceFile };
  }
  if (sourceState.error) {
    return {
      ok: false,
      reasonCode: 'source-json-invalid',
      error: 'source artifact is not valid JSON',
      sourceFile,
    };
  }

  const payload = sourceState.payload;
  const sourceDay = reviewSourceArtifactPayloadDay(payload);
  if (!sourceDay) {
    return {
      ok: false,
      reasonCode: 'candidate-day-missing',
      error: 'source artifact has no valid internal day',
      sourceFile,
      targetFile,
    };
  }
  if (sourceDay !== targetDay) {
    return {
      ok: false,
      reasonCode: 'cross-day-candidate',
      error: `source artifact day ${sourceDay} does not match target day ${targetDay}`,
      sourceDay,
      targetDay,
      sourceFile,
      targetFile,
    };
  }

  const count = reviewSourceArtifactCount(group, payload);
  if (count <= 0) {
    return {
      ok: false,
      reasonCode: 'source-artifact-empty',
      error: 'source artifact has no rows',
      sourceFile,
      targetFile,
      count,
    };
  }

  const targetState = await readJsonState(targetFile);
  if (isProtectedManualReviewArtifact(group, targetState.payload, { targetExists: targetState.exists })) {
    return {
      ok: false,
      skipped: true,
      protected: true,
      reasonCode: 'protected-manual-target',
      error: 'protected manual source artifact was not overwritten',
      sourceFile,
      targetFile,
      count,
    };
  }

  const backupRoot = String(options.backupRoot || path.join(path.dirname(targetFile), '..', '..', 'backups', 'review-source-artifact-import'));
  const backupFile = await backupReviewSourceArtifact(targetFile, group, targetDay, backupRoot);
  await atomicReplaceJson(targetFile, payload);
  return {
    ok: true,
    count,
    sourceDay,
    targetDay,
    sourceFile,
    targetFile,
    backupFile,
  };
}

module.exports = {
  atomicReplaceJson,
  guardedImportReviewSourceArtifact,
  isProtectedManualReviewArtifact,
  normalizeReviewSourceDay,
  reviewSourceArtifactCount,
  reviewSourceArtifactPayloadDay,
};
