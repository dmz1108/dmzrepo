const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/strategy-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/strategy-workbench.css?v=20260724h" rel="stylesheet">'));
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
assert(css.includes('Strategy workspace polish: clearer hierarchy with fewer nested frames.'));
assert(css.includes('Local Claude strategy restructure 2026-07-24'));
// C 部分保留:KPI 带 + 回看日期表 + L2 表格化。A(合并双源卡)已按 Owner 撤回,双源保持隔离展示。
assert(html.includes('class="strategy-kpis'));
assert(html.includes('id="kpi-verdict"'));
assert(html.includes('function fillStrategyVerdictKpi'));
assert(html.includes('function fillStrategyRecordKpi'));
// 今日结论双源分开(不合并、不去重)
assert(html.includes('今日结论 · 双源独立') && html.includes('class="kpi-verdict-lines"'));
assert(css.includes('.kpi-verdict-lines') && css.includes('.kpi-src-line'));
// A 已撤回:合并卡类彻底移除
assert(!html.includes('mlx-strip') && !html.includes('renderMergedCard') && !css.includes('.mlx-card'));
// 双栏来源隔离渲染恢复(原 renderColumn 双栏)
assert(html.includes('const renderColumn = ') && html.includes("renderColumn('东财主线预测'") && html.includes("renderColumn('同花顺主线预测'"));
assert(html.includes('class="mlr-table-head"'));
assert(html.includes('class="mlr-line-sum"'));
assert(css.includes('.mlr-line-sum'));
assert(/body\.view-strategy \.ml-l2-job-head,\s*body\.view-strategy \.ml-l2-job-meta \{ display: contents !important; \}/.test(css));
assert(css.includes('Local Claude polish 2026-07-24'));
assert(/body\.view-strategy \.mlr-chip\s*\{[\s\S]*?border-radius:\s*999px !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-max-money\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*max-content\)\);[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.strategy-focus-section \.strategy-empty\s*\{[\s\S]*?width:\s*min\(100%,\s*580px\);[\s\S]*?text-align:\s*left;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-col > \.rht-loading\s*\{[\s\S]*?text-align:\s*left;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-group\.confirmed \.mlr-group-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-review\s*\{[\s\S]*?margin:\s*20px 0 0 !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-group\.confirmed \.mlr-group-list\s*\{[\s\S]*?align-items:\s*stretch;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-group\.confirmed \.mlr-row\s*\{[\s\S]*?height:\s*100%;[\s\S]*?\}/.test(css));
assert(!/\.strategy-mainlines\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(!/\.ml-l2-history\s*\{[^}]*display\s*:\s*none/s.test(css));
assert(/body\.view-strategy \.sc-pick-detail-title\s*\{[\s\S]*?justify-content:\s*flex-start !important;[\s\S]*?\}/.test(html));
assert((html.match(/grid-template-columns:\s*max-content max-content max-content !important;/g) || []).length >= 2);
assert(/body\.view-strategy \.sc-pick-pair\s*\{[\s\S]*?justify-content:\s*start !important;[\s\S]*?gap:\s*8px !important;[\s\S]*?\}/.test(html));

console.log('strategy workbench UI checks passed');
