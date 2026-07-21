// 主线资金门槛测试(node tests/inflow-gate.test.js)
// 东财沿用带符号净流入；同花顺须 DDE≥5亿、zjjlr>0、涨停≥2，且无确认/预期明星豁免。
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

const numOrNull = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);
const THS_ZS_TYPE = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
eval(extractFn('strategyMainlineThsCompositeEligibility'));
eval(extractFn('strategyMainlineBoardAutoScanEligibility'));
eval(extractFn('strategyMainlineApplyInflowGate'));

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

const items = [
  { key: 'a', theme: '流入主线', netInflow: 5e8, count: 3 },
  { key: 'b', theme: '流出主线', netInflow: -103e8, count: 6, boardCount: 2 },
  { key: 'c', theme: '零流入主线', netInflow: 0, count: 1 },
  { key: 'd', theme: '缺数据主线', netInflow: null, count: 2 },
  { key: 'e', theme: '已确认流出主线', netInflow: -1e8, count: 4 },
];

// 1. 基本规则
const r1 = strategyMainlineApplyInflowGate(items, null);
A(r1.kept.map(i => i.key).join(',') === 'a,d', '净流入与缺数据保留;净流出与零流入排除');
A(r1.excluded.length === 3 && r1.excluded[0].reason === 'net-outflow', '排除项记录原因');
A(r1.excluded.find(e => e.theme === '流出主线').netInflow === -103e8, '排除项含净流出数值(可观测)');

// 2. null 不误杀(缺数据不得当流出)
A(r1.kept.some(i => i.key === 'd'), 'netInflow=null 不视为流出');

// 3. 确认主线保护
const r2 = strategyMainlineApplyInflowGate(items, { key: 'e', theme: '已确认流出主线' });
A(r2.kept.some(i => i.key === 'e'), 'owner 已确认主线不被自动规则移除');
A(!r2.excluded.some(e => e.theme === '已确认流出主线'), '确认主线不入排除清单');
const rExpected = strategyMainlineApplyInflowGate([
  { key: 'f', theme: '盘中预期主线', netInflow: -2e8, hadExpectedStarToday: true },
], null);
A(rExpected.kept.length === 1 && rExpected.excluded.length === 0, '盘中曾出现预期明星后,资金转弱不删除当日复盘主线');

// 4. 同花顺组合门槛：DDE 活跃度、带符号方向、涨停数三腿缺一不可。
const thsItems = [
  { key: 'ths-ok', theme: '合格', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 6e8, netInflowZjjlr: 1e8, count: 2 },
  { key: 'ths-out', theme: '流出', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 9e8, netInflowZjjlr: -2e8, count: 3, hadExpectedStarToday: true },
  { key: 'ths-flat', theme: '零方向', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 9e8, netInflowZjjlr: 0, count: 3 },
  { key: 'ths-missing-dir', theme: '方向缺失', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 9e8, netInflowZjjlr: null, count: 3 },
  { key: 'ths-low-dde', theme: '活跃不足', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 4.9e8, netInflowZjjlr: 2e8, count: 3 },
  { key: 'ths-low-zt', theme: '涨停不足', netInflowZsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 9e8, netInflowZjjlr: 2e8, count: 1 },
  { key: 'ths-fallback', theme: 'DDE缺失回退', netInflowZsType: 5, netInflowMetric: 'ths-net-inflow', netInflow: 9e8, netInflowZjjlr: 9e8, count: 3 },
];
const thsGate = strategyMainlineApplyInflowGate(thsItems, { key: 'ths-out', theme: '流出' });
A(thsGate.kept.map(item => item.key).join(',') === 'ths-ok', '同花顺仅三腿全部通过的候选进入正式主线');
A(thsGate.kept[0].fundDirection.value === 1e8 && thsGate.kept[0].thsEligibilityGate.passed === true,
  '方向提示与准入闸门以两个独立接口字段输出');
A(thsGate.excluded.find(item => item.key === 'ths-out')?.reason === 'ths-net-outflow',
  'zjjlr<0 明确记录 ths-net-outflow，确认与预期明星均不豁免');
A(thsGate.excluded.some(item => item.reason === 'ths-direction-missing'), 'zjjlr 缺失不得冒充方向通过');
A(thsGate.excluded.some(item => item.reason === 'ths-dde-below-threshold'), 'DDE 活跃度不足被明确排除');
A(thsGate.excluded.some(item => item.reason === 'ths-limit-up-below-threshold'), '涨停不足被明确排除');
A(thsGate.excluded.some(item => item.reason === 'ths-dde-metric-missing'), 'DDE 失败回退 zjjlr 不得冒充 DDE 门槛通过');
const thsHistorical = strategyMainlineApplyInflowGate([thsItems[6]], null, { enforceThsComposite: false });
A(thsHistorical.kept.length === 1, '历史冻结/回看显式关闭组合闸时维持旧口径，不倒溯清空');

const scanBase = { plateId: '885001', name: '扫描样本', zsType: 5, netInflowMetric: 'ths-dde-big-order-amount', netInflow: 6e8, netInflowZjjlr: 1e8, zt: 2, memberRows: [{}] };
A(strategyMainlineBoardAutoScanEligibility(scanBase, { requireMembers: true }).eligible, '自动扫描:同花顺三腿通过且有成分股时合格');
A(!strategyMainlineBoardAutoScanEligibility({ ...scanBase, netInflowZjjlr: -1 }).eligible, '自动扫描:zjjlr 负方向阻断');
A(!strategyMainlineBoardAutoScanEligibility({ ...scanBase, netInflowZjjlr: null }).eligible, '自动扫描:zjjlr 缺失阻断');
A(!strategyMainlineBoardAutoScanEligibility({ ...scanBase, netInflowMetric: 'ths-net-inflow' }).eligible, '自动扫描:DDE 口径缺失阻断');
A(!strategyMainlineBoardAutoScanEligibility({ ...scanBase, netInflow: 4.9e8 }).eligible, '自动扫描:DDE 活跃度不足阻断');
A(!strategyMainlineBoardAutoScanEligibility({ ...scanBase, zt: 1 }).eligible, '自动扫描:涨停不足阻断');
A(strategyMainlineBoardAutoScanEligibility({ plateId: 'BK001', name: '东财样本', zsType: 6, netInflow: 6e8, zt: 2, memberRows: [{}] }, { requireMembers: true }).eligible,
  '自动扫描:东财原有超大单净流入门槛不依赖 zjjlr');

// 5. 接线静态断言
A(src.includes('strategyMainlineApplyInflowGate(') && src.includes("rule: 'source-aware-fund-flow-required'"), '构建管线已接来源感知门槛且响应带 inflowGate 观测字段');
A(src.indexOf('const mainlineConfirm = await readMainlineConfirm(isoDay)') < src.indexOf('const inflowGate = strategyMainlineApplyInflowGate(')
  && src.indexOf('const inflowGate = strategyMainlineApplyInflowGate(') < src.indexOf(': strategyMainlineApplyL2StarGate(inflowGate.kept);'), 'readMainlineConfirm 先进入净流入门槛,再进入 L2 明星门槛');
A(src.includes('{ enforceThsComposite: isTodayQuery }'), '同花顺组合门槛只作用于当日实时构建');

// 6. 空输入
const r3 = strategyMainlineApplyInflowGate([], null);
A(r3.kept.length === 0 && r3.excluded.length === 0, '空输入安全');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL INFLOW-GATE CHECKS PASSED');
