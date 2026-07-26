const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi/vendor/strategy-workbench.css'), 'utf8');

assert(html.includes('<link href="/vendor/strategy-workbench.css?v=20260726e" rel="stylesheet">'));
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
  '.ml-rail',
  '.ml-rail-score',
  '.ml-rail-bar',
  '.ml-cardbody',
  '.ml-qi-mark',
  '.ml-qi-mark.pending',
  '.ml-star-none',
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
assert(/body\.view-strategy \.ml-proof-row\.ml-star-proof\s*\{[\s\S]*?display:\s*block !important;[\s\S]*?background:\s*transparent !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-star-proof \.ml-star-list\s*\{[\s\S]*?display:\s*flex !important;[\s\S]*?flex-wrap:\s*wrap;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-star-proof \.ml-stock\.ml-starstock\s*\{[\s\S]*?width:\s*max-content;[\s\S]*?max-width:\s*100%;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-card\.confirmed-mainline\s*\{[\s\S]*?border-color:\s*rgba\(255,\s*104,\s*100,\s*0\.62\) !important;[\s\S]*?box-shadow:\s*inset 4px 0 0 #ff6864,[\s\S]*?\}/.test(css));
assert(html.includes('class="ml-confirmed ml-daily-confirmed">✔ 当日主线</span>'));
assert(html.includes('class="ml-confirmed" style="background:rgba(74,155,255,.16);color:#4a9bff;"'));
assert(/body\.view-strategy \.ml-card\.confirmed-mainline \.ml-daily-confirmed\s*\{[\s\S]*?background:\s*#e95753 !important;[\s\S]*?color:\s*#fff !important;[\s\S]*?\}/.test(css));
assert(!css.includes('body.view-strategy .ml-card.confirmed-mainline .ml-confirmed {'));
assert(/body\.view-strategy \.ml-star-proof \.ml-stock\.ml-starstock\.confirmed\s*\{[\s\S]*?box-shadow:\s*inset 3px 0 0 #efb94f !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-star-proof \.ml-stock\.ml-starstock\.confirmed \.ml-star-state\s*\{[\s\S]*?background:\s*#efb94f !important;[\s\S]*?font-weight:\s*820 !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-line\.hit-ok > \.mlr-line-sum\s*\{[\s\S]*?box-shadow:\s*inset 6px 0 0 #ff6864;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.mlr-hit\.ok\s*\{[\s\S]*?background:\s*#e95753 !important;[\s\S]*?color:\s*#fff !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-job-head,\s*body\.view-strategy \.ml-l2-job-meta \{ display: contents !important; \}/.test(css));
assert(css.includes('Local Claude polish 2026-07-24'));
assert(/body\.view-strategy \.mlr-chip\s*\{[\s\S]*?border-radius:\s*999px !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-l2-max-money\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*max-content\)\);[\s\S]*?\}/.test(css));
// 今日主线榜卡片紧凑化(2026-07-24,Owner 反馈卡片太大太宽)——锁定核心收紧,防多层覆盖后回退:
// 标题 15px、评分数字 15px、龙头行左对齐(消除整行中间空档)、信号条改 flex 左排(不再 4 等宽铺满)。
assert(css.includes('今日主线榜卡片紧凑化'));
// 卡片物理宽度收窄:限宽 600px 且左对齐(不再撑满双源栏),预备卡同宽。
// max-width 必须带 !important:否则 max-width:760px 媒体查询里旧的 .ml-card{max-width:100% !important}
// 会在 601–760px 区间让正式卡撑满(实测 736px)而预备卡仍 600px,两者不齐。
assert(/body\.view-strategy \.ml-card\s*\{[\s\S]*?max-width:\s*600px !important;[\s\S]*?margin-right:\s*auto;[\s\S]*?\}/.test(css));
// 预备卡 wrapper 必须显式 width:100%,否则 .ml-grid 的 justify-items:start 会让它按内容收缩、各卡宽度不齐。
assert(/body\.view-strategy \.ml-reserve-card\s*\{[\s\S]*?width:\s*100%;[\s\S]*?max-width:\s*600px !important;[\s\S]*?margin-right:\s*auto;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-grid\s*\{[\s\S]*?justify-items:\s*start;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-name\s*\{[\s\S]*?font-size:\s*15px !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-score b, body\.view-strategy \.ml-predict b\s*\{\s*font-size:\s*15px !important;\s*\}/.test(css));
assert(/body\.view-strategy \.ml-stock\.ml-leaderstock,[\s\S]*?justify-content:\s*flex-start !important;[\s\S]*?\}/.test(css));
assert(/body\.view-strategy \.ml-signal-strip\s*\{[\s\S]*?display:\s*flex !important;[\s\S]*?\}/.test(css));
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

// 主线卡片重构(2026-07-25):左柱锚点 + 明星前置 + QI 认证标识
assert(html.includes('<div class="ml-rail">') && html.includes('class="ml-rail-score"')
  && html.includes('class="ml-rail-bar"'), '主线卡片左柱含排名/主线分/强度条');
assert(html.includes('<div class="ml-cardbody">'), '卡片右侧内容区包裹存在');
assert(html.includes('function strategyMainlineQiMarkHTML(kind)')
  && html.includes('viewBox="12 27 110 82"'), 'QI 认证标识助手存在且使用裁切后的 viewBox');
assert(html.includes("strategyMainlineQiMarkHTML(visibleStars.some(s => s.level === 'confirmed') ? 'confirmed' : 'pending')"),
  '确认明星佩戴 QI 认证标识,预期明星为待认证态');
assert(html.includes('ml-star-proof is-empty') && html.includes('已完成 L2 扫描,未出现达标明星'),
  '无明星方向仍显示明星信号行与扫描状态,强度够的板块不隐身');
assert(!html.includes('<div class="ml-score-wrap">'), '旧的整行评分盒已由左柱取代');
assert(css.includes('body.view-strategy .ml-card.has-confirmed-star .ml-rail')
  && css.includes('--st-gold: #f0c04a'), '确认明星沿用金色证据语义(#262),红色仍留给人工确认主线');
// Owner 定稿方案A:确认=金箔徽章,预期改冷石板(原金/琥珀色相仅差 1.4°、RGB 距离 17,几乎同色)
assert(css.includes('--st-slate: #7f9bbd') && css.includes('.ml-card.has-expected-star .ml-rail-bar i { background: var(--st-slate)'),
  '预期明星改冷石板色,与确认金拉开色相');
assert(html.includes('class="ml-qi-seal') && css.includes('body.view-strategy .ml-qi-seal {'),
  'QI 标识置于外框内(外框只负责三态占位对齐)');
assert(css.includes('body.view-strategy .ml-card.has-confirmed-star::after'),
  '确认卡顶部金箔高光使用 ::after(::before 已被左色条占用)');
assert(css.includes('body.view-strategy .ml-qi-seal.empty { visibility: hidden; }'),
  '无明星态外框隐藏但仍占位,保证卡片文字起始线对齐');
// Owner 2026-07-25:"qi 一圈还是黄色框"——外框金环与标识是一个视觉整体,同受"QI 不着金"约束。
{
  const sealAt = css.indexOf('body.view-strategy .ml-qi-seal {');
  const sealRule = css.slice(sealAt, css.indexOf('}', sealAt));
  assert(/border:\s*1px solid transparent/.test(sealRule)
    && /background:\s*transparent/.test(sealRule)
    && /box-shadow:\s*none/.test(sealRule),
    'QI 外框不着色(无金环/金底/金光晕),确认态由卡片层的金边金顶线金明星条表达');
  assert(!/240, 192, 74|255, 233, 168/.test(sealRule), 'QI 外框规则内不得出现金色值');
  assert(/\.ml-qi-seal \.ml-qi-mark \{ width: 30px; height: 22px; \}/.test(css)
    && !/\.ml-qi-seal\.pending \.ml-qi-mark/.test(css),
    '标识三态统一 30×22(去掉金环后不再需要为其留内缩量)');
}
// Codex #280 [P2]:外框同为 40×40 不代表文字对齐——明星行本身的左边框宽度三态不同,
// 边框计入盒宽会把内容右推。运行时实测曾为 164/164/166。断言"边框 + 左内边距"三态相等。
{
  const num = (s) => parseInt(s, 10);
  const ruleOf = (sel) => {
    const at = css.indexOf(sel);
    assert(at > -1, `CSS 存在规则 ${sel}`);
    return css.slice(at, css.indexOf('}', at));
  };
  const edge = (rule, fallback) => {
    const bl = /border-left:\s*(\d+)px/.exec(rule) || /border-left-width:\s*(\d+)px/.exec(rule);
    const pl = /padding-left:\s*(\d+)px/.exec(rule);
    return {
      border: bl ? num(bl[1]) : fallback.border,
      padding: pl ? num(pl[1]) : fallback.padding,
    };
  };
  // 基准:.ml-proof-row.ml-star-proof 的 padding: 9px 11px
  const base = { border: 1, padding: 11 };
  const confirmed = edge(ruleOf('body.view-strategy .ml-card.has-confirmed-star .ml-proof-row.ml-star-proof {\n  border-color: rgba(240, 192, 74, .3)'), base);
  const expected = edge(ruleOf('body.view-strategy .ml-card.has-expected-star .ml-proof-row.ml-star-proof {'), base);
  const empty = edge(ruleOf('body.view-strategy .ml-proof-row.ml-star-proof.is-empty {'), base);
  const start = (e) => e.border + e.padding;
  assert(empty.border === 3, '无明星行保留 3px 状态边的视觉厚度');
  assert(start(confirmed) === start(expected) && start(expected) === start(empty),
    `三态"明星信号"文字起始线必须一致(border+padding-left):`
    + ` 确认 ${start(confirmed)} / 预期 ${start(expected)} / 无明星 ${start(empty)};`
    + ' 改动任一态的 border-left 宽度时必须同步补偿 padding-left');
}
// 实现注释不得与规范冲突(Codex #280 [P2]:旧注释仍写"确认态才显示金环",会诱导后续 agent 加回金环)
assert(!/徽章外框在三态下尺寸一致\(确认态才显示金环\)/.test(html),
  '旧的"确认态才显示金环"注释必须删除');
assert(html.includes('外框三态均透明,只负责 40×40 占位对齐'),
  '外框注释改为描述占位职责,并指向视觉语义规范');

// 视觉语义规范(docs/strategy/STRATEGY_VISUAL_SEMANTICS.md)——色相归属不得被后续样式无意翻转
{
  const specPath = path.join(root, 'docs/strategy/STRATEGY_VISUAL_SEMANTICS.md');
  assert(fs.existsSync(specPath), '策略页视觉语义规范文档存在');
  const spec = fs.readFileSync(specPath, 'utf8');
  for (const token of ['--st-gold', '--st-slate', '#f0c04a', '#7f9bbd']) {
    assert(spec.includes(token), `规范记录 ${token}`);
  }
  // 规范里声明的色值必须与实际 CSS 一致(防文档与实现漂移)
  assert(css.includes('--st-gold: #f0c04a') && css.includes('--st-slate: #7f9bbd'),
    'CSS token 与视觉语义规范声明的色值一致');
  // 确认明星与预期明星色相必须拉开(规范硬约束:>=90°)
  const hue = (h) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0;
    const t = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return (t * 60 + 360) % 360;
  };
  const diff = Math.abs(hue('#f0c04a') - hue('#7f9bbd'));
  assert(Math.min(diff, 360 - diff) >= 90, '确认明星与预期明星色相相差 >=90°(规范硬约束)');
}

// ===== Codex #276 复审三项 P1 的回归锁 =====
// P1-1 媒体查询不增加特异性:移动端隐藏三比值的规则必须与桌面规则同级(.ml-star-proof .ml-star-ratios)
assert(css.includes('body.view-strategy .ml-star-proof .ml-star-ratios { display: none !important; }'),
  '窄屏隐藏三比值的规则特异性与桌面规则同级,否则窄屏下仍显示并被裁切');
assert(!/\n\s*body\.view-strategy \.ml-star-ratios \{ display: none !important; \}/.test(css),
  '不得保留低特异性的窄屏隐藏规则(会被桌面规则静默压过)');

// P1-2 强度条基准:预备主线必须显式传入所属列表,不能依赖 map 隐式第三参数
assert(html.includes('renderCard(row, idx, reserveList)'),
  '预备主线显式传入整份列表作为强度条基准(否则每卡只与自身比,恒 100%)');
assert(html.includes('const reserveList = reserves.slice(0, 4);'),
  '预备列表先具名再 map,保证基准与渲染集合一致');

// P1-3 L2 状态单一归一化:明星空态与徽章共用同一份 l2State
{
  const cardFn = html.slice(html.indexOf('const renderCard = (m, i, cardList)'), html.indexOf('// 两套独立主线预测'));
  const l2StateAt = cardFn.indexOf('const l2State = m.l2ScanState');
  const starRowAt = cardFn.indexOf('const starRow = starChips');
  assert(l2StateAt > -1 && starRowAt > -1 && l2StateAt < starRowAt,
    'l2State 归一化必须在 starRow 之前,供空态文案与徽章共同消费');
  assert(!cardFn.includes("const st = String(m.l2ScanState || m.l2VerificationStatus || '');"),
    '明星空态不得另起一套原始状态推导(旧冻结快照会与徽章文案矛盾)');
  assert(cardFn.includes("l2State === 'coverage-insufficient' ? '扫描覆盖不足,暂不能判定无明星'"),
    '空态文案读归一化后的 l2State');
}

// QI 标识必须与主页 .qi-logo 同色(中性白描边 + 蓝色高亮点),不得随卡片主题染成金色
assert(css.includes('.ml-qi-mark .qim-orbit { stroke: var(--border-strong)')
  && css.includes('.ml-qi-mark .qim-line { stroke: var(--text)')
  && css.includes('.ml-qi-mark .qim-fill { fill: var(--text)')
  && css.includes('.ml-qi-mark .qim-spark { fill: var(--accent)'),
  'QI 标识取色与主页 logo 一致(--text / --border-strong / --accent);pending 态是规范定义的唯一例外');
// pending(预期明星)是规范批准的状态化例外:灰蓝半透明 + 无高亮点,表达"尚未盖章"。
// 断言其存在,防止后续 agent 以"标识颜色恒定"为由误删(见 STRATEGY_VISUAL_SEMANTICS.md §2)。
assert(css.includes('.ml-qi-mark.pending') && css.includes('.ml-qi-mark.pending .qim-line'),
  'pending 态灰蓝规则必须保留(规范定义的唯一状态化例外)');
assert(!/\.ml-qi-mark[^}]*(#fff8e6|rgba\(255, 233, 168|rgba\(239, 185, 79|rgba\(231, 173, 70|rgba\(240, 192, 74)/.test(css),
  'QI 标识任何状态都不得使用金色系(pending 轨道曾残留暖金 rgba(231,173,70,.5),已改冷石板)');

// Owner 2026-07-26 操作口径：只对 Panda 管理员显示；预期明星仅观察，实时 L2
// 明星确认的封板瞬间为买点，正式主线首位龙头在主线有效期内保留操作角色。
{
  const cardFn = html.slice(html.indexOf('const renderCard = (m, i, cardList)'), html.indexOf('// 两套独立主线预测'));
  assert(html.includes('const showAdminActionSemantics = !!state.adminLoggedIn'),
    '操作口径仅在 Panda 管理员会话开启');
  assert(html.includes("actionIsToday ? '仅观察' : '当日观察'")
    && html.includes("`封板买点${confirmedTime ? ` ${confirmedTime}` : ''}`"),
    '预期明星只观察，实时确认明星显示封板买点与确认时间');
  assert(html.includes("s.confirmedBy === 'live-l2-scan' || s.actionState === 'buy-point-confirmed'")
    && html.includes('const confirmationIsReviewOnly = !confirmationIsLive'),
    '只有显式实时 L2 确认可显示买点，盘后补确认或旧未知来源均不冒充盘中买点');
  assert(cardFn.includes("actionIsToday ? '主线内随时' : '当日龙头'")
    && cardFn.includes("isFormalActionCard && idx === 0"),
    '只有正式主线首位龙头获得主线内操作角色，其他候选不误标');
  assert(cardFn.includes('可操作仅限：确认明星（封板确认点）· 首位龙头（正式主线有效期）')
    && cardFn.includes('预期明星仅观察，确认封板前无买点')
    && cardFn.includes('历史复盘：确认时点只作当日记录，不是当前信号'),
    '卡片明确两类可操作角色，并把历史记录与当前信号隔离');
  assert(css.includes('body.view-strategy .ml-action-guide')
    && css.includes('body.view-strategy .ml-action-tag')
    && css.includes('.ml-star-state.is-buy')
    && css.includes('.ml-star-state.is-watch'),
    '管理员操作状态有独立且紧凑的视觉层级');

  eval([
    extractHtmlFn('strategyMainlineActionTimeText'),
    extractHtmlFn('strategyMainlineStarActionPresentation'),
  ].join('\n'));
  const expectedView = strategyMainlineStarActionPresentation(
    { level: 'expected', actionState: 'watch-only' },
    true,
    true
  );
  const liveConfirmedView = strategyMainlineStarActionPresentation(
    {
      level: 'confirmed',
      confirmedBy: 'live-l2-scan',
      actionState: 'buy-point-confirmed',
      confirmedAt: '2026-07-24T02:18:00.000Z',
    },
    true,
    true
  );
  const finalReviewView = strategyMainlineStarActionPresentation(
    {
      level: 'confirmed',
      confirmedBy: 'final-limit-up-db',
      actionState: 'review-confirmed',
      confirmedAt: '2026-07-24T07:30:00.000Z',
    },
    true,
    true
  );
  const normalUserView = strategyMainlineStarActionPresentation(
    { level: 'confirmed', confirmedBy: 'live-l2-scan', actionState: 'buy-point-confirmed' },
    true,
    false
  );
  assert(expectedView.stateText === '仅观察' && expectedView.actionClass === ' is-watch',
    '运行时:预期明星对管理员只显示观察');
  assert(liveConfirmedView.stateText === '封板买点 10:18' && liveConfirmedView.actionClass === ' is-buy',
    '运行时:盘中 L2 确认显示上海时间的封板买点');
  assert(finalReviewView.stateText === '当日确认' && finalReviewView.actionClass === ' is-review',
    '运行时:盘后涨停库补确认不展示伪造的盘中时间或买点');
  assert(normalUserView.stateText === '已确认' && normalUserView.actionClass === '',
    '运行时:普通用户维持中性文案，不暴露管理员操作口径');
}

console.log('strategy workbench UI checks passed');
