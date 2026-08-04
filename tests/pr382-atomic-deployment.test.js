const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const manifestPath = path.join(
  root,
  'ops',
  'production',
  'manifests',
  'strategy-multi-formal-mainlines-20260804.json'
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');

assert.strictEqual(manifest.restart, 'main', 'PR #382 deployment must restart the main service');
assert.deepStrictEqual(
  manifest.files.map((item) => [item.source, item.destination]),
  [
    ['kpl-stats-server.js', 'kpl-stats-server.js'],
    ['kpl-dashboard_17_apple.html', 'kpl-dashboard_17_apple.html'],
    ['theme-taxonomy.json', 'theme-taxonomy.json'],
  ],
  'PR #382 deployment must publish server, UI, and the startup taxonomy atomically'
);
assert(
  server.includes("const THEME_TAXONOMY_PATH = path.join(__dirname, 'theme-taxonomy.json');"),
  'server must keep the declared taxonomy dependency covered by the deployment manifest'
);
assert(
  server.includes('strategyThemeTaxonomyValidateFamilyUnits();'),
  'server must keep the startup taxonomy validation covered by the deployment manifest'
);

console.log('pr382-atomic-deployment.test.js passed');
