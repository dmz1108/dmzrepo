const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/review-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/review-workbench.css?v=20260718c" rel="stylesheet">'));
assert(html.includes('<header class="review-hero">'));
assert(html.includes('<nav class="review-source-tabs" role="tablist" aria-label="复盘数据来源">'));
assert(html.includes('role="tab" aria-selected="${activeClass ? \'true\' : \'false\'}"'));
assert(html.includes('aria-label="查询复盘股票"'));
assert(html.includes('aria-label="个股复盘证据" aria-live="polite"'));
assert(html.includes('<section class="review-topic-section">'));
assert(html.includes('<div class="review-table-scroll">'));

for (const label of ['股票', '主因板块', '细分原因', '来源', '置信 / 时间']) {
  assert(html.includes(`data-label="${label}"`), `missing mobile field label: ${label}`);
}

assert(server.includes("['/vendor/review-workbench.css', 'Qi/vendor/review-workbench.css']"));
assert(server.includes("['/qi/vendor/review-workbench.css', 'Qi/vendor/review-workbench.css']"));

for (const selector of [
  '.review-source-tab[data-review-kind="final"].active',
  '.review-topic-card.active',
  '.review-consensus-badge.is-strong',
  '.review-strong-badge',
  '.review-stock-detail-card',
  '.review-history-item.is-active',
  '.review-table td::before',
]) {
  assert(css.includes(selector), `missing review visual state: ${selector}`);
}

assert(css.includes('@media (max-width: 680px)'));
assert(!/body\.view-review\s+\.review-source-tabs\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/body\.view-review\s+\.review-topics\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/body\.view-review\s+\.review-table-card\s*\{[^}]*display\s*:\s*none/s.test(css));

console.log('review workbench UI checks passed');
