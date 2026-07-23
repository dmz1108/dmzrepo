const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/strategy-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/strategy-workbench.css?v=20260722d" rel="stylesheet">'));
assert(html.includes('<header class="strategy-hero">'));
assert(html.includes('class="strategy-hero-head"'));
assert(html.includes('class="strategy-hero-utility"'));

assert(server.includes("['/vendor/strategy-workbench.css', 'Qi/vendor/strategy-workbench.css']"));
assert(server.includes("['/qi/vendor/strategy-workbench.css', 'Qi/vendor/strategy-workbench.css']"));

for (const selector of [
  '.ml-card.has-expected-star',
  '.ml-card.has-confirmed-star',
  '.mlr-row.star-confirmed',
  '.mlr-row.star-expected',
  '.mlr-row.star-missed',
  '.mlr-row.star-pending',
  '.mlr-group.confirmed',
  '.mlr-outcome-summary',
  '.mlr-no-star',
  '.ml-l2-stock.is-expected',
  '.ml-l2-stock.is-confirmed',
  '.ml-l2-history-disclosure',
  '.ml-l2-history-summary',
  '.ml-l2-job-summary',
  '.strategy-board-card',
]) {
  assert(css.includes(selector), `missing strategy visual state: ${selector}`);
}

assert(css.includes('@media (max-width: 760px)'));
assert(!/\.strategy-mainlines\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/\.ml-l2-history\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(/body\.view-strategy \.sc-pick-detail-title\s*\{[\s\S]*?justify-content:\s*flex-start !important;[\s\S]*?\}/.test(html));
assert((html.match(/grid-template-columns:\s*max-content max-content max-content !important;/g) || []).length >= 2);
assert(/body\.view-strategy \.sc-pick-pair\s*\{[\s\S]*?justify-content:\s*start !important;[\s\S]*?gap:\s*8px !important;[\s\S]*?\}/.test(html));

console.log('strategy workbench UI checks passed');
