const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const serverSource = fs.readFileSync(path.join(ROOT, 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFunction(name) {
  const match = serverSource.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  if (!match) throw new Error(`function not found: ${name}`);
  const paramsOpen = serverSource.indexOf('(', match.index);
  let paramsDepth = 0;
  let bodyOpen = -1;
  for (let index = paramsOpen; index < serverSource.length; index += 1) {
    if (serverSource[index] === '(') paramsDepth += 1;
    else if (serverSource[index] === ')') {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        bodyOpen = serverSource.indexOf('{', index + 1);
        break;
      }
    }
  }
  if (bodyOpen < 0) throw new Error(`function body not found: ${name}`);
  let bodyDepth = 0;
  for (let index = bodyOpen; index < serverSource.length; index += 1) {
    if (serverSource[index] === '{') bodyDepth += 1;
    else if (serverSource[index] === '}') {
      bodyDepth -= 1;
      if (bodyDepth === 0) return serverSource.slice(match.index, index + 1);
    }
  }
  throw new Error(`function not closed: ${name}`);
}

const isFiniteNumeric = value => value !== null && value !== '' && Number.isFinite(Number(value));
const normalizeReasonSourceCode = value => String(value || '').replace(/\D/g, '').slice(0, 6);
const strategyMainlineQuality = payload => ({
  ok: !!payload?.ok,
  mainlineCount: Array.isArray(payload?.mainlines) ? payload.mainlines.length : 0,
});
const STRATEGY_MAINLINE_SNAPSHOT_FREEZE_MINUTE = 15 * 60 + 30;

eval(extractFunction('strategyMainlineExpectedStarTransitions'));
eval(extractFunction('strategyMainlineReviewFormalTop'));
eval(extractFunction('strategyMainlineStarAttributionDecision'));
eval(extractFunction('strategyMainlineHistoricalPredictRow'));
eval(extractFunction('strategyMainlineRestoreHistoricalPrediction'));
eval(extractFunction('strategyMainlineSnapshotFreezeReady'));

const predictionRow = {
  key: 'theme:电网设备',
  theme: '电网设备',
  rank: 1,
  score: 520,
  predictScore: 186,
  stage: '确认期',
  certainty: '高确定性',
  l2VerificationStatus: 'qi',
  star: { code: '601179', name: '中国西电', level: 'confirmed' },
  leaders: [
    { code: '001258', name: '立新能源', leadScore: 144 },
    { code: '002879', name: '长缆科技', leadScore: 89 },
  ],
};
const candidate = {
  key: 'theme:电网设备',
  familyKey: 'theme:电网设备',
  theme: '电网设备',
  rank: 1,
  score: 520,
  predictScore: 186,
  l2VerificationStatus: 'qi',
  netInflow: 1680000000,
  netInflowBoard: '电网设备',
  netInflowMetric: 'eastmoney-super-large-net-inflow',
  boardGainPct: 2.35,
  boardGainName: '电网设备',
  sourcePairs: { eastmoney: { board: '电网设备', netInflow: 1680000000, gainPct: 2.35, metric: 'eastmoney-super-large-net-inflow' } },
  resonanceBoards: [{ name: '电网设备', plateId: 'BK0968', zsType: 6, gainPct: 2.35, netInflow: 1680000000, netInflowMetric: 'eastmoney-super-large-net-inflow' }],
  boardCount: 3,
  limitUpCount: 12,
  bigGainCount: 22,
  nearLimitCount: 5,
  leaders: predictionRow.leaders,
  stars: [{ code: '601179', name: '中国西电', level: 'confirmed' }],
  todayLimitCodes: ['601179', '001258'],
};
const sourceBlock = {
  available: true,
  hasMainlines: true,
  reason: '',
  message: '',
  top: [predictionRow],
  candidates: [candidate],
  starTransitions: [],
};
const predict = {
  day: '2026-07-23',
  savedAt: '2026-07-23T07:00:14.172Z',
  sessionPhase: '尾盘',
  schemaVersion: 3,
  top: [predictionRow],
  candidates: [candidate],
  starTransitions: [],
  bySource: {
    eastmoney: { ...sourceBlock, zsType: 6 },
    ths: { ...sourceBlock, zsType: 5 },
  },
};
const emptySource = {
  available: true,
  hasMainlines: false,
  reason: 'no-l2-qualified-mainline',
  message: '当前尚无通过 L2 明星验证的方向。',
  count: 0,
  mainlines: [],
  reserveMainlines: [],
};
const earlyEmptySnapshot = {
  ok: true,
  day: '2026-07-23',
  requestedDay: '2026-07-23',
  snapshot: true,
  frozen: true,
  snapshotState: 'frozen',
  snapshotSavedAt: '2026-07-23T07:01:25.562Z',
  snapshotReason: 'api-after-close',
  reason: 'no-l2-qualified-mainline',
  message: '当前尚无通过 L2 明星验证的方向。',
  mainlines: [],
  count: 0,
  mainlinesBySource: {
    eastmoney: { ...emptySource },
    ths: { ...emptySource },
    dualResonanceThemes: [],
  },
};

const restored = strategyMainlineRestoreHistoricalPrediction(
  earlyEmptySnapshot,
  predict,
  { finalSealedCodes: new Set(['601179']) },
);
assert.strictEqual(restored.historicalPredictionRecovered, true);
assert.strictEqual(restored.reason, '');
assert.strictEqual(restored.message, '');
assert.strictEqual(restored.mainlines.length, 1);
assert.strictEqual(restored.mainlines[0].theme, '电网设备');
assert.strictEqual(restored.mainlines[0].historicalPredictionSummary, true);
assert.strictEqual(restored.mainlines[0].starStocks[0].name, '中国西电');
assert.strictEqual(restored.mainlines[0].starStocks[0].level, 'confirmed');
assert.deepStrictEqual(restored.mainlines[0].leaders.map(row => row.name), ['立新能源', '长缆科技']);
assert.strictEqual(restored.mainlines[0].count, 12);
assert.strictEqual(restored.mainlines[0].netInflow, 1680000000);
assert.strictEqual(restored.mainlines[0].boardGainPct, 2.35);
assert.strictEqual(restored.mainlines[0].boardGainName, '电网设备');
assert.strictEqual(restored.mainlines[0].sourcePairs.eastmoney.netInflow, 1680000000);
assert.strictEqual(restored.mainlines[0].resonanceBoards[0].plateId, 'BK0968');

for (const source of ['eastmoney', 'ths']) {
  const block = restored.mainlinesBySource[source];
  assert.strictEqual(block.available, true);
  assert.strictEqual(block.hasMainlines, true);
  assert.strictEqual(block.reason, '');
  assert.strictEqual(block.message, '');
  assert.strictEqual(block.mainlines.length, 1);
  assert.strictEqual(block.mainlines[0].theme, '电网设备');
}
assert.deepStrictEqual(restored.mainlinesBySource.dualResonanceThemes, ['电网设备']);
assert.deepStrictEqual(restored.historicalPredictionRecoveredSources.sort(), ['eastmoney', 'ths']);
assert.strictEqual(earlyEmptySnapshot.mainlines.length, 0, 'historical snapshot must remain immutable');

// 已有丰富快照卡不能被简版预测行覆盖或重复。
const richRow = { theme: '电网设备', familyKey: 'theme:电网设备', boardGainPct: 7.2, starStocks: [{ code: '601179', level: 'confirmed' }] };
const richPayload = {
  ...earlyEmptySnapshot,
  reason: '',
  message: '',
  mainlines: [richRow],
  mainlinesBySource: {
    eastmoney: { ...emptySource, hasMainlines: true, mainlines: [richRow] },
    ths: { ...emptySource, hasMainlines: true, mainlines: [richRow] },
  },
};
const richRestored = strategyMainlineRestoreHistoricalPrediction(richPayload, predict, {
  finalSealedCodes: new Set(['601179']),
});
assert.strictEqual(richRestored.mainlines.length, 1);
assert.strictEqual(richRestored.mainlines[0].boardGainPct, 7.2);
assert.strictEqual(richRestored.mainlines[0].historicalPredictionSummary, undefined);

// 没有 L2 正证据的候选仍不得从空快照中“恢复”为主线。
const weakPredict = {
  ...predict,
  top: [{ key: 'theme:医药', theme: '医药', l2VerificationStatus: 'scanned-no-star' }],
  candidates: [{ key: 'theme:医药', theme: '医药', l2VerificationStatus: 'scanned-no-star', stars: [] }],
  bySource: null,
};
const weakRestored = strategyMainlineRestoreHistoricalPrediction(earlyEmptySnapshot, weakPredict);
assert.strictEqual(weakRestored.mainlines.length, 0);
assert.strictEqual(weakRestored.historicalPredictionRecovered, undefined);

assert.strictEqual(strategyMainlineSnapshotFreezeReady({ hour: 15, minute: 29 }), false);
assert.strictEqual(strategyMainlineSnapshotFreezeReady({ hour: 15, minute: 30 }), true);
assert.strictEqual(strategyMainlineSnapshotFreezeReady({ hour: 16, minute: 0 }), true);
assert(
  /if \(!strategyMainlineSnapshotFreezeReady\(now\)\)[\s\S]*?snapshotState: 'settling-after-close'/.test(serverSource),
  'after-close API must not freeze a permanent snapshot before 15:30',
);
assert(
  html.includes('盘中预测档案校正')
    && html.includes('历史盘中预测结论 · 未补造早期快照缺失的盘面指标')
    && /const signalStrip = predictionSummaryOnly \? ''/.test(html),
  'historical prediction recovery must be explicit and must not render missing metrics as zero',
);

console.log('strategy historical conclusion checks passed');
