const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/realtime-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/realtime-workbench.css?v=20260718" rel="stylesheet">'));
assert(html.includes("document.body.classList.toggle('view-dashboard', nextPage === 'dashboard')"));
assert(html.includes('class="board-grid-shell"'));
assert(html.includes('class="data-health-shell"'));
assert(html.includes('id="hot-search-shell"'));

assert(server.includes("['/vendor/realtime-workbench.css', 'Qi/vendor/realtime-workbench.css']"));
assert(server.includes("['/qi/vendor/realtime-workbench.css', 'Qi/vendor/realtime-workbench.css']"));

for (const selector of [
  'body.view-dashboard .board-grid-shell',
  'body.view-dashboard .data-health-strip',
  'body.view-dashboard #hot-search-shell',
  'body.view-dashboard .board-card.collapsed .board-header',
  'body.view-dashboard .board-card.collapsed .board-main-star-preview.has-star',
  'body.view-dashboard .board-card.expanded .card-body',
  'body.view-dashboard .board-card.expanded .section',
]) {
  assert(css.includes(selector), `missing realtime visual state: ${selector}`);
}

assert(css.includes('@media (max-width: 760px)'));
assert(!/body\.view-dashboard\s+\.board-grid\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/body\.view-dashboard\s+\.board-card\.expanded\s+\.card-body\s*\{[^}]*display\s*:\s*none/s.test(css));

console.log('realtime workbench UI checks passed');
