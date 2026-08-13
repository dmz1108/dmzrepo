const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFunction(name) {
  const match = source.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  if (!match) throw new Error(`function not found: ${name}`);
  const bodyOpen = source.indexOf('{', source.indexOf(')', match.index));
  let depth = 0;
  for (let index = bodyOpen; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(match.index, index + 1);
    }
  }
  throw new Error(`function not closed: ${name}`);
}

const numOrNull = value => {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const isFiniteNumeric = value => value !== null && value !== '' && Number.isFinite(Number(value));
const isoFromCompactDate = value => String(value || '');
const chinaNowParts = () => ({ day: '2026-08-13' });
const familyKey = value => {
  const text = String(value || '');
  if (/CPO|光模块|光通信|共封装光学/.test(text)) return 'group:光通信';
  if (/绿色电力|电力/.test(text)) return 'group:电力';
  if (/机器人/.test(text)) return 'group:机器人';
  if (/算力/.test(text)) return 'group:算力硬件';
  return `theme:${text}`;
};
const strategyMainlineFamilyInfo = item => ({ key: item?.key || familyKey(item?.theme), label: item?.theme || '' });
const strategyMainlineBoardThemeRelated = (board, theme) => familyKey(board) === familyKey(theme);
const strategyBoardFundFlowForSource = (board, zsType) => {
  if (Number(zsType) === 6) {
    return {
      value: numOrNull(board?.superLargeNetInflow),
      metric: 'eastmoney-super-large-net-inflow',
      legacy: false,
    };
  }
  if (Number(zsType) === 5 && numOrNull(board?.ddeBigOrderAmount) != null) {
    return { value: Number(board.ddeBigOrderAmount), metric: 'ths-dde-big-order-amount', legacy: false };
  }
  return { value: numOrNull(board?.netInflow), metric: 'ths-net-inflow', legacy: false };
};

[
  'strategyMainlineRepresentativeBoardInflow',
  'strategyMainlineSourcePairs',
  'strategyMainlineVisibleMetricIdMatchesSource',
  'strategyMainlineVisibleMetricFamilyKey',
  'strategyMainlineVisibleMetricBoardMatches',
  'strategyMainlineVisibleMetricCandidateIds',
  'strategyMainlineVisibleMetricSelectBoards',
  'strategyMainlineVisibleMetricNormalizeBoard',
  'strategyMainlineVisibleMetricUsable',
  'strategyMainlineVisibleMetricMergeLine',
].forEach(name => eval(`${extractFunction(name)}\nglobalThis.${name} = ${name};`));

const eastRobot = strategyMainlineVisibleMetricMergeLine({
  theme: '人形机器人',
  familyKey: 'group:机器人',
  boardGainPct: null,
  netInflow: null,
  resonanceBoards: [],
  starStocks: [{ code: '000887', scanPlateId: 'BK1145' }],
}, [
  { plateId: 'BK1145', name: '机器人执行器', gainPct: -1.41, netInflow: 446422384, netInflowMetric: 'eastmoney-super-large-net-inflow', sourceDay: '2026-08-13' },
  { plateId: 'BK1090', name: '机器人概念', gainPct: -1.42, netInflow: -7497520896, netInflowMetric: 'eastmoney-super-large-net-inflow', sourceDay: '2026-08-13' },
  { plateId: 'BK1128', name: 'CPO概念', gainPct: 5.2, netInflow: 99999999999, netInflowMetric: 'eastmoney-super-large-net-inflow', sourceDay: '2026-08-13' },
], 6);
assert.strictEqual(eastRobot.boardGainPct, -1.41);
assert.strictEqual(eastRobot.netInflow, 446422384);
assert.strictEqual(eastRobot.netInflowMetric, 'eastmoney-super-large-net-inflow');
assert(!eastRobot.resonanceBoards.some(board => board.name === 'CPO概念'), 'unrelated board must not lend metrics');

const eastLight = strategyMainlineVisibleMetricMergeLine({
  theme: '光模块', familyKey: 'group:光通信', boardGainPct: null, netInflow: null,
  resonanceBoards: [], starStocks: [{ code: '000938', scanPlateId: 'BK1128' }],
}, [
  { plateId: 'BK1128', name: 'CPO概念', gainPct: -0.02, netInflow: 2216714496, netInflowMetric: 'eastmoney-super-large-net-inflow', sourceDay: '2026-08-13' },
], 6);
assert.strictEqual(eastLight.boardGainPct, -0.02);
assert.strictEqual(eastLight.netInflow, 2216714496, 'verified fact-store netInflow must retain its f66 metric');
assert.strictEqual(eastLight.boardGainName, 'CPO概念');

const crossFamilyScan = strategyMainlineVisibleMetricMergeLine({
  theme: '算力硬件', familyKey: 'group:算力硬件', boardGainPct: null, netInflow: null,
  resonanceBoards: [{ plateId: 'BK1128', name: 'CPO概念', zsType: 6 }],
  starStocks: [{ code: '000938', scanPlateId: 'BK1128' }],
}, [
  { plateId: 'BK1128', name: 'CPO概念', gainPct: 4.5, netInflow: 5000000000, netInflowMetric: 'eastmoney-super-large-net-inflow' },
], 6);
assert.strictEqual(crossFamilyScan.boardGainPct, null, 'star scan carrier from another family must not hydrate the card');
assert.strictEqual(crossFamilyScan.netInflow, null);

const ths = strategyMainlineVisibleMetricMergeLine({
  theme: '光模块', familyKey: 'group:光通信', boardGainPct: null, netInflow: null,
  resonanceBoards: [{ plateId: '309049', name: '共封装光学(CPO)', zsType: 5, gainPct: null,
    netInflow: null, netInflowMetric: 'ths-net-inflow' }],
}, [
  { plateId: '309049', name: '共封装光学(CPO)', gainPct: -0.97, ddeBigOrderAmount: 4889286700,
    netInflow: 4889286700, netInflowZjjlr: 130000000, netInflowMetric: 'ths-dde-big-order-amount', sourceDay: '2026-08-13' },
], 5);
assert.strictEqual(ths.boardGainPct, -0.97);
assert.strictEqual(ths.netInflow, 4889286700);
assert.strictEqual(ths.netInflowZjjlr, 130000000);
assert.strictEqual(ths.netInflowMetric, 'ths-dde-big-order-amount',
  'metric label must follow the hydrated DDE value, not an empty frozen-row label');
assert.strictEqual(ths.sourcePairs.ths.board, '共封装光学(CPO)');

const rich = strategyMainlineVisibleMetricMergeLine({
  theme: '电力', familyKey: 'group:电力', boardGainPct: 2.5, netInflow: 900000000,
  boardGainName: '原板', netInflowBoard: '原板', netInflowMetric: 'eastmoney-super-large-net-inflow',
  sourcePairs: { eastmoney: { board: '原板', netInflow: 900000000, gainPct: 2.5 } },
  resonanceBoards: [],
}, [
  { plateId: 'BK1024', name: '绿色电力', gainPct: -0.29, netInflow: 2738671616, netInflowMetric: 'eastmoney-super-large-net-inflow' },
], 6);
assert.strictEqual(rich.boardGainPct, 2.5, 'existing snapshot gain must not be overwritten');
assert.strictEqual(rich.netInflow, 900000000, 'existing snapshot fund value must not be overwritten');
assert.strictEqual(rich.sourcePairs.eastmoney.board, '原板', 'existing same-source pair must not be overwritten');

const thsWithoutDirection = strategyMainlineVisibleMetricNormalizeBoard({
  plateId: '309049', name: '共封装光学(CPO)', gainPct: -0.97,
  netInflow: 4889286700, netInflowMetric: 'ths-dde-big-order-amount',
}, 5);
assert.strictEqual(thsWithoutDirection.netInflow, 4889286700);
assert.strictEqual(thsWithoutDirection.netInflowZjjlr, null,
  'DDE amount must not be mislabeled as directional zjjlr when direction is unavailable');

const emptyThs = strategyMainlineVisibleMetricMergeLine({
  theme: '人形机器人', familyKey: 'group:机器人', boardGainPct: null, netInflow: null,
  resonanceBoards: [{ plateId: '309119', name: '人形机器人', zsType: 5 }],
}, [{ plateId: '309119', name: '人形机器人', gainPct: null, netInflow: null }], 5);
assert.strictEqual(emptyThs.boardGainPct, null, 'catalog identity alone must not invent a quote');
assert.strictEqual(emptyThs.netInflow, null);

assert(/const composed = composedRaw && requestedDay === today[\s\S]{0,180}?strategyMainlineHydrateVisibleMetrics/.test(source),
  'live build must hydrate same-day card metrics before prediction persistence');
assert(/return strategyMainlineHydrateVisibleMetrics\(predictDay, annotated\)/.test(source),
  'visible response must repair an already-frozen same-day payload without rewriting it');
assert(/boardGainPct: isFiniteNumeric\(m\.boardGainPct\)/.test(source)
  && /sourcePairs: m\.sourcePairs/.test(source),
  'future prediction records must persist display metrics');

console.log('strategy mainline visible metric checks passed');
