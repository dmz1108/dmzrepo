const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/strategy-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/strategy-workbench.css?v=20260724j" rel="stylesheet">'));
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
  '.mlr-line.hit-ok',
  '.mlr-line.hit-miss',
  '.mlr-hit.ok',
  '.mlr-hit.miss',
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
// 逐档明细 6 列紧凑表(2026-07-24 重设计):买/卖合并成对,比值为主角。
assert(html.includes('<th colspan="2" class="grp grp-active">主动成交</th><th colspan="2" class="grp grp-passive">被动成交</th><th rowspan="2" class="col-support">合力比</th>'));
assert(html.includes('<th class="col-amt">买入 / 卖出</th><th class="col-ratio">主动比</th>'));
assert(html.includes('class="ml-l2-amt-pair"') && html.includes('ml-l2-amt-sep'));
assert(html.includes('function strategyL2HistoryAmtPair'));
// 锁定 6 列紧凑表 CSS 布局(防多层覆盖后悄悄退回铺满整页的宽表):
// 表定宽 560px + table-layout:fixed(不再 width:100% 拉满);容器 max-content/overflow-x(窄屏滚动不撑页);
// 比值为视觉主角(14px,大于金额 11.5px);合力比列有强调底色。
assert(/body\.view-strategy \.ml-l2-bucket-table\s*\{[\s\S]*?width:\s*560px;[\s\S]*?table-layout:\s*fixed;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-bucket-table-wrap\s*\{[\s\S]*?width:\s*max-content;[\s\S]*?max-width:\s*100%;[\s\S]*?overflow-x:\s*auto;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-table-ratio b\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-table-ratio\.is-support\s*\{[\s\S]*?background:\s*rgba\(203, 178, 126, 0\.07\);[\s\S]*?\}/.test(css));
assert(css.includes('.ml-l2-amt-pair') && /body\.view-strategy \.ml-l2-amt-pair \.ml-l2-table-money\s*\{[\s\S]*?display:\s*inline-flex;[\s\S]*?\}/.test(css));
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
assert(/body\.view-strategy \.mlr-line\.hit-ok > \.mlr-line-sum\s*\{[\s\S]*?box-shadow:\s*inset 4px 0 0 #ff6864;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-line\.hit-miss > \.mlr-line-sum\s*\{[\s\S]*?box-shadow:\s*inset 4px 0 0 #3fc98a;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-hit\.ok::before\s*\{[\s\S]*?content:\s*"✓";[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-hit\.miss::before\s*\{[\s\S]*?content:\s*"×";[\s\S]*?\}/.test(css));
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

// ===== 运行时样本测试:实际执行 strategyL2HistoryBucketRow,验证 6 列重构没有错位单元格 =====
// (Codex 终审第 3 项:仅有文本断言不够,需真实调用确认主动/被动买卖映射与三比值落位正确。)
function extractHtmlFn(name) {
  const sig = new RegExp(`function ${name}\\(`);
  const m = html.match(sig);
  if (!m) throw new Error('L2 fn not found: ' + name);
  const open = html.indexOf('{', html.indexOf(')', m.index));
  let depth = 0, i = open;
  for (; i < html.length; i++) { if (html[i] === '{') depth++; else if (html[i] === '}') { depth--; if (depth === 0) break; } }
  return html.slice(m.index, i + 1);
}
const L2_ROW_FNS = [
  'strategyPlainMoney', 'strategyL2HistoryNum', 'strategyL2HistoryRatioValue',
  'strategyL2HistoryRatioText', 'strategyL2HistoryBucketLabel', 'strategyL2HistoryMoney',
  'strategyL2HistoryBucket', 'strategyL2HistoryAmtPair', 'strategyL2HistoryRatioCell',
  'strategyL2HistoryBucketRow',
];
eval(L2_ROW_FNS.map(extractHtmlFn).join('\n'));

// 四项互不相同的金额:主买3.8亿 主卖1.7亿 被买3.1亿 被卖1.9亿(单位元)。
const sampleRow = { code: '600001', price: 12, thresholds: {
  '500000': { activeBuy: 3.8e8, activeSell: 1.7e8, passiveBuy: 3.1e8, passiveSell: 1.9e8 },
  '3000000': { activeBuy: 3.5e8, activeSell: 1.5e8, passiveBuy: 2.9e8, passiveSell: 1.6e8 },
  // 800万缺整个档位 → 数据缺失;1000万有对象但缺 activeSell 字段 → 字段不完整
  // (strategyL2HistoryNum 把 null 视作 0,故用「缺字段」而非 null 才是真正的字段不完整)。
  '10000000': { activeBuy: 2.0e8, passiveBuy: 1.8e8, passiveSell: 1.2e8 },
} };
const rowMax = strategyL2HistoryBucketRow(sampleRow, 500000, 500000);
// 1) 金额未互换:主动格=买3.8亿/卖1.7亿,被动格=买3.1亿/卖1.9亿(四值互不相同,错位即被抓)。
assert(rowMax.includes('is-buy"><i>买</i><b>3.8亿</b>'), 'L2样本:主动买入=3.8亿落在主动买格');
assert(rowMax.includes('is-sell"><i>卖</i><b>1.7亿</b>'), 'L2样本:主动卖出=1.7亿落在主动卖格');
assert(rowMax.includes('is-buy"><i>买</i><b>3.1亿</b>'), 'L2样本:被动买入=3.1亿落在被动买格');
assert(rowMax.includes('is-sell"><i>卖</i><b>1.9亿</b>'), 'L2样本:被动卖出=1.9亿落在被动卖格');
// 列顺序:主动买卖 → 主动比 → 被动买卖 → 被动比 → 合力比。
const iActBuy = rowMax.indexOf('<b>3.8亿</b>'), iActR = rowMax.indexOf('is-active'), iPasBuy = rowMax.indexOf('<b>3.1亿</b>'), iPasR = rowMax.indexOf('is-passive'), iSup = rowMax.indexOf('is-support');
assert(iActBuy > -1 && iActBuy < iActR && iActR < iPasBuy && iPasBuy < iPasR && iPasR < iSup, 'L2样本:主动买卖/主动比/被动买卖/被动比/合力比列顺序正确');
// 2) 三比值具体结果:主动比 3.8/1.7=2.24;被动比 3.1/1.9=1.63;合力比 6.9/3.6=1.92。
assert(rowMax.includes('is-active"><b>2.24</b>'), 'L2样本:主动比=2.24');
assert(rowMax.includes('is-passive"><b>1.63</b>'), 'L2样本:被动比=1.63');
assert(rowMax.includes('is-support"><b>1.92</b>'), 'L2样本:合力比=1.92');
// 3) 最大档:is-max + 最大档标记。
assert(/class="ml-l2-bucket-row is-max"/.test(rowMax) && rowMax.includes('<i>最大档</i>'), 'L2样本:最大档行带 is-max 与最大档标记');
// 4) 数据缺失(缺 key)与字段不完整(字段含 null)。
const rowMissing = strategyL2HistoryBucketRow(sampleRow, 8000000, 500000);
assert(/ is-empty"/.test(rowMissing) && rowMissing.includes('<small>数据缺失</small>'), 'L2样本:缺档位数据 → 数据缺失');
const rowIncomplete = strategyL2HistoryBucketRow(sampleRow, 10000000, 500000);
assert(/ is-empty"/.test(rowIncomplete) && rowIncomplete.includes('<small>字段不完整</small>'), 'L2样本:字段含 null → 字段不完整');

console.log('strategy workbench UI checks passed');
