'use strict';

const fs = require('fs/promises');
const path = require('path');

const STRATEGY_DATA_QUALITY_MANIFEST = 'strategy-data-quality.json';

function normalizedPath(value) {
  return String(value || '').trim().replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+/g, '/').toLowerCase();
}

function relativePath(rootDir, file) {
  return normalizedPath(path.relative(rootDir, file));
}

function manifestEntries(payload) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.entries) ? payload.entries : [];
}

function entryPath(entry) {
  return normalizedPath(entry?.path || entry?.expectedPath);
}

function matchesDependency(entry, dependency, rootDir) {
  const actual = entryPath(entry);
  const relative = relativePath(rootDir, dependency.file);
  if (!actual || !relative) return false;
  return actual === relative || actual.endsWith(`/${relative}`);
}

function snapshotDependencies(rootDir, day, provenance = {}) {
  const strategyDir = path.join(rootDir, 'strategy-data');
  const exemptLayers = new Set(Array.isArray(provenance?.exemptLayers) ? provenance.exemptLayers : []);
  return [
    { layer: 'frozen', file: path.join(strategyDir, `strategy-mainline-snapshot-${day}.json`) },
    { layer: 'composite', file: path.join(strategyDir, 'snapshots', `${day}.json`) },
    ...[5, 6, 7].map(zsType => ({
      layer: `raw-zs${zsType}`,
      file: path.join(rootDir, 'kpl-snapshots', String(zsType), `${day}.json`),
    })),
  ].filter(dependency => !exemptLayers.has(dependency.layer));
}

async function defaultReadJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function defaultAccess(file) {
  await fs.access(file);
}

function missingEvidence(rootDir, dependency, day, reason) {
  return {
    expectedPath: relativePath(rootDir, dependency.file),
    state: 'missing',
    targetDay: day,
    reason,
    sha256: null,
  };
}

async function loadStrategySnapshotForDailyEvents(options = {}) {
  const rootDir = path.resolve(options.rootDir || __dirname);
  const day = String(options.day || '').trim();
  const manifestPath = options.manifestPath || path.join(rootDir, 'strategy-data', STRATEGY_DATA_QUALITY_MANIFEST);
  const readJson = options.readJson || defaultReadJson;
  const access = options.access || defaultAccess;
  let manifest = null;
  try {
    // Manifest is always read before probing or reading any snapshot layer.
    manifest = await readJson(manifestPath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  const dependencies = snapshotDependencies(rootDir, day, options.provenance);
  const entries = manifestEntries(manifest).filter(entry => String(entry?.targetDay || '') === day);
  const flagged = [];
  for (const dependency of dependencies) {
    for (const entry of entries) {
      if (matchesDependency(entry, dependency, rootDir)) flagged.push({ ...entry, layer: dependency.layer });
    }
  }
  if (flagged.length) {
    return {
      snapshot: null,
      snapshotStatus: flagged.some(entry => entry.state === 'contaminated') ? 'quarantined' : 'missing',
      snapshotUsable: false,
      snapshotEvidence: flagged,
      dependencies: dependencies.map(item => ({ layer: item.layer, path: relativePath(rootDir, item.file) })),
    };
  }

  const missing = [];
  for (const dependency of dependencies) {
    try {
      await access(dependency.file);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      missing.push({
        ...missingEvidence(rootDir, dependency, day, `${dependency.layer} snapshot file not found`),
        layer: dependency.layer,
      });
    }
  }
  if (missing.length) {
    return {
      snapshot: null,
      snapshotStatus: 'missing',
      snapshotUsable: false,
      snapshotEvidence: missing,
      dependencies: dependencies.map(item => ({ layer: item.layer, path: relativePath(rootDir, item.file) })),
    };
  }

  const frozen = dependencies.find(item => item.layer === 'frozen');
  try {
    const snapshot = options.snapshotOverride || await readJson(frozen.file);
    return {
      snapshot,
      snapshotStatus: 'ok',
      snapshotUsable: true,
      snapshotEvidence: [],
      dependencies: dependencies.map(item => ({ layer: item.layer, path: relativePath(rootDir, item.file) })),
    };
  } catch (error) {
    return {
      snapshot: null,
      snapshotStatus: 'quarantined',
      snapshotUsable: false,
      snapshotEvidence: [{
        path: relativePath(rootDir, frozen.file),
        state: 'read-error',
        targetDay: day,
        reason: error instanceof SyntaxError ? 'invalid JSON' : String(error?.code || 'snapshot read failed'),
      }],
      dependencies: dependencies.map(item => ({ layer: item.layer, path: relativePath(rootDir, item.file) })),
    };
  }
}

module.exports = {
  STRATEGY_DATA_QUALITY_MANIFEST,
  loadStrategySnapshotForDailyEvents,
  snapshotDependencies,
};
