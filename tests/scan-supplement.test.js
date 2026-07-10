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

  // 5. 宽候选池只惠及补选通道;主通道锁定在原始榜序前 primaryPool 个(与补选前行为一致)
  // 榜序:G(zt1) H(zt2) | I(zt9,资金5亿) D(zt0,资金9亿) —— primaryPool=2 时,
  // 补选前行为 = boardPool 裁到 [G,H] 再排序 → 主通道必须仍是 H,G;I 虽 zt9 也不得进主通道,只能走补选。
  const t5 = makeEnrich(2, 2);
  const b5 = [
    board('G', '板G', 1, 1.0, 0.5e8),
    board('H', '板H', 2, 1.5, 0.8e8),
    board('I', '板I', 9, 2.5, 5e8),
    board('D2', '板D2', 0, 4.0, 9e8),
  ];
  await t5.run(b5, '2026-07-10', { realtimeSource: 'live', primaryPool: 2 });
  const ids5 = t5.captured.map(b => b.plateId);
  A(JSON.stringify(ids5.slice(0, 2)) === JSON.stringify(['H', 'G']), '主通道只从原前 primaryPool 个里选(高zt的I不得挤进主通道)');
  A(ids5.includes('I') && ids5.includes('D2') && t5.captured.find(b => b.plateId === 'I').scanChannel === 'supplement', '宽池板块经补选通道进入(I/D2)');
  A(t5.state.picked.map(p => p.plateId).sort().join(',') === 'D2,I', '补选观测记录宽池来源');

  // 6. buildStrategyMainlinesLive 接线事实(静态断言):boardPool 按补选配置放宽 + enrich 后裁剪未选中板块
  A(src.includes('boardPool: STRATEGY_MAINLINE_LIVE_BOARD_POOL + STRATEGY_MAINLINE_SUPPLEMENT_BOARDS'), 'boardPool 已按补选配置放宽(补选真正看到 top-5 之外的实时候选)');
  A(src.includes('boardPayload.boards = boardPayload.boards.filter(b => b && b.scanChannel)'), 'enrich 后仅保留已选中板块进 seeds(未选中板块不改变原有语义)');
  A(src.includes('primaryPool: STRATEGY_MAINLINE_LIVE_BOARD_POOL'), '调用点传入 primaryPool 锁定主通道候选范围');

  // 7. scanSupplement 跨日不污染:仅当状态 day 与响应 day/requestedDay 一致时输出
  const metaSrc = extractFn('strategyMainlineAttachResponseMeta');
  const makeMeta = (stateDay) => {
    let out;
    const metaPrelude = `
      const strategyMainlineSavedAt = p => String(p?.generatedAt || '');
      const strategyMainlineAgeMs = () => 1000;
      const strategyMainlineStaleness = () => 'fresh';
      const strategyMainlineQuality = () => ({ ok: true });
      const strategyMainlineWarmState = { lastTickAt: '', lastResult: '', consecutiveFailures: 0, currentDelayMs: 0 };
      const strategyMainlineSupplementState = ${stateDay ? `{ day: '${stateDay}', picked: [] }` : 'null'};
    `;
    eval(metaPrelude + metaSrc + '; out = strategyMainlineAttachResponseMeta;');
    return out;
  };
  const metaFn = makeMeta('2026-07-10');
  A(metaFn({ day: '2026-07-10', mainlines: [] }).scanSupplement?.day === '2026-07-10', '同日响应输出 scanSupplement');
  A(metaFn({ day: '2026-07-09', requestedDay: '2026-07-09', mainlines: [] }).scanSupplement === null, '历史日响应不输出跨日补选状态');
  A(metaFn({ day: '2026-07-09', requestedDay: '2026-07-10', mainlines: [] }).scanSupplement?.day === '2026-07-10', 'requestedDay 匹配也可输出(回退场景仍标注)');
  A(makeMeta(null)({ day: '2026-07-10', mainlines: [] }).scanSupplement === null, '无补选状态输出 null');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL SCAN-SUPPLEMENT CHECKS PASSED');
})();
