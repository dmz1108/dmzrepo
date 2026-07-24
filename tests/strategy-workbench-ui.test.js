const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/strategy-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/strategy-workbench.css?v=20260724c" rel="stylesheet">'));
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
  '.mlr-card-head',
  '.mlr-compare',
  '.mlr-source-grid',
  '.mlr-evidence-grid',
  '.mlr-no-star',
  '.ml-l2-stock.is-expected',
  '.ml-l2-stock.is-confirmed',
  '.ml-l2-history-disclosure',
  '.ml-l2-history-summary',
  '.ml-l2-job-summary',
  '.ml-l2-stock-detail',
  '.ml-l2-bucket-table',
  '.ml-l2-table-money.is-buy',
  '.ml-l2-table-money.is-sell',
  '.ml-l2-table-ratio',
  '.strategy-board-card',
]) {
  assert(css.includes(selector), `missing strategy visual state: ${selector}`);
}

assert(html.includes('<table class="ml-l2-bucket-table">'));
assert(html.includes('class="mlr-card-head"'));
assert(html.includes('class="mlr-compare"'));
assert(html.includes('class="mlr-source-grid"'));
assert(html.includes('class="mlr-evidence-grid"'));
assert(html.includes('<details class="mlr-reserve-line">'));
assert(html.includes('<th colspan="3">主动成交</th><th colspan="3">被动成交</th><th>买卖合力</th>'));
assert(html.includes('<th>买入金额</th><th>卖出金额</th><th>主动比</th>'));
assert(html.includes('主动比 = 主动买入 ÷ 主动卖出'));
assert(html.includes('被动比 = 被动买入 ÷ 被动卖出'));
assert(html.includes('合力比 = 总买入 ÷ 总卖出'));

assert(css.includes('@media (max-width: 760px)'));
assert(!/\.strategy-mainlines\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/\.ml-l2-history\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(/body\.view-strategy \.sc-pick-detail-title\s*\{[\s\S]*?justify-content:\s*flex-start !important;[\s\S]*?\}/.test(html));
assert((html.match(/grid-template-columns:\s*max-content max-content max-content !important;/g) || []).length >= 2);
assert(/body\.view-strategy \.sc-pick-pair\s*\{[\s\S]*?justify-content:\s*start !important;[\s\S]*?gap:\s*8px !important;[\s\S]*?\}/.test(html));

console.log('strategy workbench UI checks passed');
