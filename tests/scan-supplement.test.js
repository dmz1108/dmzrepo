// P1-B 扫描补选通道测试(node tests/scan-supplement.test.js)
// 抽取 strategyMainlineEnrichBoardsWithRisingStocks,验证:主通道排序不变、
// 补选只在 live 源生效、进入原因记录、去重与上限、可关闭、零强度不补。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}

const fnSrc = extractFn('strategyMainlineEnrichBoardsWithRisingStocks');

// 每次用不同常量构造独立执行环境;mapLimit 只捕获目标板块,不执行成员拉取
function makeEnrich(risingLimit, supplementLimit) {
  const ctx = { captured: null, state: null };
  const prelude = `
    const STRATEGY_MAINLINE_RISING_BOARD_LIMIT = ${risingLimit};
    const STRATEGY_MAINLINE_SUPPLEMENT_BOARDS = ${supplementLimit};
    let strategyMainlineSupplementState = null;
    const mapLimit = async (arr) => { ctx.captured = arr; };
  `;
  const epilogue = `
    ctx.run = async (boards, day, options) => {
      await strategyMainlineEnrichBoardsWithRisingStocks(boards, day, options);
      ctx.state = strategyMainlineSupplementState;
    };
  `;
  eval(prelude + fnSrc + epilogue);
  return ctx;
}

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
const board = (plateId, name, zt, gainPct, netInflow) => ({ plateId, name, zt, gainPct, netInflow });

(async () => {
  // 场景:6 个板块。主通道 top-2 按涨停数取 A、B;
  // 补选按净流入应取 D(涨停0但资金最强)、F(资金次强);C 已含足够弱、E 零强度不补。
  const boards = () => [
    board('A', '板A', 5, 3.0, 2e8),
    board('B', '板B', 4, 2.0, 1e8),
    board('C', '板C', 1, 0.5, 0.2e8),
    board('D', '板D', 0, 4.5, 9e8),
    board('E', '板E', 0, 0, 0),
    board('F', '板F', 1, 3.8, 6e8),
  ];

  // 1. live 源 + 补选开启
  const t1 = makeEnrich(2, 2);
  const b1 = boards();
  await t1.run(b1, '2026-07-10', { realtimeSource: 'live' });
  const names = t1.captured.map(b => b.plateId);
  A(JSON.stringify(names.slice(0, 2)) === JSON.stringify(['A', 'B']), '主通道 top-2 排序不变(涨停数优先)');
  A(JSON.stringify(names.slice(2)) === JSON.stringify(['D', 'F']), '补选按净流入取 D、F(涨停少但实时强)');
  A(b1[0].scanChannel === 'primary' && b1[3].scanChannel === 'supplement', 'scanChannel 标记');
  A(b1[3].supplementBasis.netInflow === 9e8 && b1[3].supplementBasis.zt === 0 && b1[3].supplementBasis.liveRankIndex === 4, '补选进入原因记录(净流入/涨停数/榜单位置)');
  A(t1.state.picked.length === 2 && t1.state.picked[0].plateId === 'D', '观测状态 picked=若无补选会漏的板块');
  A(t1.state.realtimeSource === 'live' && t1.state.enabled === true && t1.state.limit === 2, '观测状态含源与配置');

  // 2. 快照源不补选(约束3:不得把历史快照伪装成盘中补选)
  const t2 = makeEnrich(2, 2);
  const b2 = boards();
  await t2.run(b2, '2026-07-10', { realtimeSource: 'snapshot' });
  A(t2.captured.length === 2 && t2.state.picked.length === 0, 'snapshot 源零补选');

  // 3. 补选数=0 即关闭(约束2:可关闭)
  const t3 = makeEnrich(2, 0);
  await t3.run(boards(), '2026-07-10', { realtimeSource: 'live' });
  A(t3.captured.length === 2 && t3.state.enabled === false, '补选数配 0 即回退主通道行为');

  // 4. 零强度板块不补;去重(主通道已选不重复进补选)
  const t4 = makeEnrich(2, 5);
  const b4 = boards();
  await t4.run(b4, '2026-07-10', { realtimeSource: 'live' });
  const picked4 = t4.state.picked.map(p => p.plateId);
  A(!picked4.includes('E'), '净流入与涨幅均<=0 的板块不补');
  A(!picked4.includes('A') && !picked4.includes('B'), '主通道已选板块不重复补选');
  A(picked4.length === 3, '上限内按强度补齐(D/F/C)');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL SCAN-SUPPLEMENT CHECKS PASSED');
})();
