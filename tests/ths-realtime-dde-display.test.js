const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
}

assert(
  dashboard.includes('/api/ths-concepts/catalog?fund_metric=dde&limit=${encodeURIComponent(count)}'),
  '今日实时同花顺榜显式请求 DDE 口径和有限候选数',
);
assert(
  dashboard.includes("netInflowMetric: String(row[11] || '')")
    && dashboard.includes('netInflowSourceDay: String(row[12] || \'\')')
    && dashboard.includes('netInflowStale: row[14] === true'),
  '前端保留 DDE 口径、源日期和 stale 元数据',
);
assert(
  dashboard.includes("item.boards.some(board => board.netInflowMetric !== 'ths-dde-big-order-amount')"),
  '旧 zjjlr 预览缓存不会在升级后短暂冒充 DDE',
);
assert(
  dashboard.includes("const fundFlowLabel = isThsDde ? 'DDE活跃' : '净流入';"),
  '同花顺卡片明确标识 DDE 为活跃度而非净流入',
);
assert(
  dashboard.includes('board-direction-inline')
    && dashboard.includes('同花顺 zjjlr 带符号净流向；正值才通过方向闸'),
  '今日实时卡片另行显示 zjjlr 全量方向提示',
);

assert(
  server.includes("requestedFundMetric === 'dde'")
    && server.includes('applyThsDdeFundFlowToRealtimeBoards(')
    && server.includes('outputBoards = responseBoards.slice(0, requestedLimit)'),
  '目录端点只对请求的有限候选执行 DDE 覆盖',
);
assert(
  server.includes("board.netInflow = null;")
    && server.includes("board.netInflowState = 'stale-source-day'")
    && server.includes('board.netInflowZjjlr = original;'),
  'DDE 缺失或跨日时可审计但不回退显示 zjjlr',
);
assert(
  server.includes("netInflowMetric: String(quote?.netInflowMetric ?? board.netInflowMetric ?? 'ths-net-inflow')")
    && server.includes('netInflowAsOf: String(quote?.netInflowAsOf ?? board.netInflowAsOf ?? \'\')'),
  '公开板块对象不会丢失资金口径与源时间',
);

console.log(process.exitCode ? 'SOME THS REALTIME DDE DISPLAY CHECKS FAILED' : 'ALL THS REALTIME DDE DISPLAY CHECKS PASSED');
