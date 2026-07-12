'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  DAILY_EVENT_POINTS,
  LEADER_SCORING_V3_SCORE_VERSION,
  rankLeaderPoolV3,
  scoreLeaderV3,
} = require('../strategy-leader-scoring-v3');
const { replayLeaderScoringV3 } = require('../tools/replay-leader-scoring-v3');

const A = (condition, message) => {
  if (!condition) { console.error('FAIL: ' + message); process.exitCode = 1; }
  else console.log('ok: ' + message);
};

const DAYS = [
  '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-29', '2026-06-30',
  '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07',
];

function dailyRecord(day, events = [], complete = true) {
  return {
    day,
    complete,
    ruleVersion: 'leader-scoring-v3-events-v1',
    stockEvents: { complete, events },
  };
}

function event(code, familyKey, type, over = {}) {
  return {
    code,
    familyKey,
    event: type,
    points: DAILY_EVENT_POINTS[type],
    status: 'confirmed',
    historyEligible: true,
    dataMissing: [],
    ...over,
  };
}

const familyKey = 'group:算力AI';
const history = DAYS.map(day => dailyRecord(day));
history[1] = dailyRecord(DAYS[1], [event('000001', familyKey, 'ordinary-limit-up')]);
history[8] = dailyRecord(DAYS[8], [event('000001', familyKey, 'star-limit-up')]);
const todayOrdinary = dailyRecord('2026-07-08', [event('000001', familyKey, 'ordinary-limit-up')]);

const base = {
  targetDay: '2026-07-08',
  code: '000001',
  name: '样本一',
  familyKey,
  tradingDays: DAYS,
  dailyRecords: [...history, todayOrdinary],
  todayRecord: todayOrdinary,
  gainAnchorDay: '2026-07-07',
  gain10: 10,
  gain30: 20,
};

const scored = scoreLeaderV3({
  ...base,
  legacySignals: {
    zt10Count: 3,
    present: true,
    todayLimit: true,
    lianban: 3,
    earlySeal: true,
    starBonus: 15,
    freshScore: 10,
  },
});
A(scored.scoreVersion === LEADER_SCORING_V3_SCORE_VERSION, '输出固定 v3 影子评分版本');
A(scored.components.history.points === 35, '历史两日事件按15+20逐日累积,不递减不封顶');
A(scored.components.history.evidence.every(row => row.day < '2026-07-08'), '目标日事件严格排除在历史窗口外');
A(scored.components.today.points === 15, '当天普通涨停只记互斥事件15分');
A(scored.components.trend.points === 15, '趋势层按10日10分+30日5分独立计分');
A(scored.leadScoreV3Raw === 65, '总分=历史35+当天15+趋势15,不重复叠加旧信号');
A(scored.ignoredLegacyScoreSignals.length === 7, '旧在场/涨停/连板/早封/明星/新鲜度字段明确只作忽略诊断');
A(scored.components.history.familyLimitEventCount === 2 && scored.historyGate === true, '正式龙头门槛来自历史家族涨停事件');

const duplicateToday = dailyRecord('2026-07-08', [
  event('000001', familyKey, 'ordinary-limit-up'),
  event('000001', familyKey, 'star-limit-up'),
]);
const starScored = scoreLeaderV3({ ...base, todayRecord: duplicateToday });
A(starScored.components.today.points === 20 && starScored.components.today.duplicateRowsIgnored === 1,
  '同日明星涨停20替换普通涨停15,绝不计算15+20');

const bigGainToday = dailyRecord('2026-07-08', [event('000001', familyKey, 'confirmed-mainline-big-gain')]);
const bigGainScored = scoreLeaderV3({ ...base, todayRecord: bigGainToday });
A(bigGainScored.components.today.points === 8, '大涨未板固定8分且不叠加在场分');

const wrongRule = { ...todayOrdinary, ruleVersion: 'unknown-events-v9' };
const wrongRuleScored = scoreLeaderV3({ ...base, todayRecord: wrongRule });
A(wrongRuleScored.complete === false && wrongRuleScored.components.today.dataMissing.includes('dailyEventRuleVersion'),
  '不兼容事件规则版本明确dataMissing,不静默按0');

const unknownEvent = dailyRecord('2026-07-08', [event('000001', familyKey, 'ordinary-limit-up', {
  event: 'future-event-type', points: 999,
})]);
const unknownEventScored = scoreLeaderV3({ ...base, todayRecord: unknownEvent });
A(unknownEventScored.complete === false && unknownEventScored.components.today.dataMissing.includes('unknownDailyEvent'),
  '未知事件类型明确dataMissing,不接受文件里的任意分值');

const unproducedAlias = dailyRecord('2026-07-08', [event('000001', familyKey, 'ordinary-limit-up', {
  event: 'big-gain-not-limit-up', points: 8,
})]);
const unproducedAliasScored = scoreLeaderV3({ ...base, todayRecord: unproducedAlias });
A(unproducedAliasScored.complete === false && unproducedAliasScored.components.today.dataMissing.includes('unknownDailyEvent'),
  '事件生产器未定义的旧别名不得绕过事件白名单');

// 7月8日威尔高机制样本:7月7日历史普通涨停15,7月8日当天普通涨停15。
// lianban=2、早封、当日在场等旧字段不得把同一两连板重复加成。
const weierHistory = DAYS.map(day => dailyRecord(day,
  day === '2026-07-07' ? [event('301251', familyKey, 'ordinary-limit-up')] : []));
const weierToday = dailyRecord('2026-07-08', [event('301251', familyKey, 'ordinary-limit-up')]);
const weier = scoreLeaderV3({
  targetDay: '2026-07-08', code: '301251', name: '威尔高', familyKey,
  tradingDays: DAYS, dailyRecords: [...weierHistory, weierToday], todayRecord: weierToday,
  gainAnchorDay: '2026-07-07', gain10: 0, gain30: 0,
  legacySignals: { zt10Count: 2, todayLimit: true, present: true, lianban: 2, earlySeal: true, freshScore: 10 },
});
A(weier.components.history.points === 15 && weier.components.today.points === 15 && weier.leadScoreV3Raw === 30,
  '威尔高两连板只按两个交易日各15分,不再重复计算当日在场/连板/早封');

const tenStarDays = DAYS.map(day => dailyRecord(day, [event('000009', familyKey, 'star-limit-up')]));
const uncapped = scoreLeaderV3({
  ...base, code: '000009', dailyRecords: tenStarDays,
  todayRecord: dailyRecord('2026-07-08'), gain10: 0, gain30: 0,
});
A(uncapped.components.history.points === 200 && uncapped.leadScoreV3Raw === 200,
  '10个真实明星事件完整累积到200分,不设总分上限');

const missingHistory = history.slice(0, -1);
const incomplete = scoreLeaderV3({ ...base, dailyRecords: missingHistory });
A(incomplete.complete === false && incomplete.components.history.points === null && incomplete.components.history.knownPoints === 35,
  '缺一个交易日记录时保留已知分但正式分为null,不拿缺失日冒充0分');
A(incomplete.components.history.missingDays.includes('2026-07-07'), '缺失记录保留具体交易日,不是unknown');

const leakedAnchor = scoreLeaderV3({ ...base, gainAnchorDay: '2026-07-08' });
A(leakedAnchor.complete === false && leakedAnchor.components.trend.dataMissing.includes('gainAnchorIncludesTargetDay'),
  '趋势锚日包含目标日时阻断,避免当日涨幅与当天事件重复计分');
const staleAnchor = scoreLeaderV3({ ...base, gainAnchorDay: '2026-06-01' });
A(staleAnchor.complete === false && staleAnchor.components.trend.dataMissing.includes('gainAnchorNotPrevTradingDay') &&
  staleAnchor.components.trend.expectedAnchorDay === '2026-07-07',
  '趋势锚必须等于目标日前一交易日,陈旧锚不得静默取得趋势分');

const poolInput = {
  ...base,
  candidates: [
    { code: '000001', name: '样本一', gainAnchorDay: '2026-07-07', gain10: 10, gain30: 20 },
    { code: '000002', name: '样本二', gainAnchorDay: '2026-07-07', gain10: 80, gain30: 80,
      dailyRecords: DAYS.map((day, i) => dailyRecord(day, i === 0 ? [event('000002', familyKey, 'ordinary-limit-up')] : [])),
      todayRecord: dailyRecord('2026-07-08') },
  ],
};
const pool = rankLeaderPoolV3(poolInput);
const one = pool.results.find(row => row.code === '000001');
const two = pool.results.find(row => row.code === '000002');
A(pool.resultScope === 'full-input-pool' && pool.poolSize === 2 && pool.fullLeaderCount === 2,
  '完整输入池输出池规模与正式龙头人数');
A(two.originalRank === 1 && one.originalRank === 2, 'v3按绝对分排序,不是候选池名次分');
A(one.leadScoreV3Raw === 65, '增加其他候选不会改变同一股票自身绝对分');
A(pool.familyKey === familyKey, '一次完整池回放明确绑定一个主线家族');

const noTrendCandidate = rankLeaderPoolV3({
  ...base,
  candidates: [{
    code: '000003',
    name: '缺趋势样本',
    dailyRecords: DAYS.map((day, i) => dailyRecord(day,
      i === 0 ? [event('000003', familyKey, 'ordinary-limit-up')] : [])),
    todayRecord: dailyRecord('2026-07-08'),
  }],
}).results[0];
A(noTrendCandidate.complete === false && noTrendCandidate.components.trend.gain10 === null &&
  noTrendCandidate.components.trend.gain30 === null && noTrendCandidate.dataMissing.includes('trend:gain10') &&
  noTrendCandidate.dataMissing.includes('trend:gain30'),
  '候选缺少个股趋势字段时明确dataMissing,不得继承池顶层其他股票的涨幅');

let mixedFamilyRejected = false;
try {
  rankLeaderPoolV3({ ...poolInput, candidates: [
    poolInput.candidates[0],
    { ...poolInput.candidates[1], familyKey: 'group:机器人' },
  ] });
} catch (error) {
  mixedFamilyRejected = /one mainline family/.test(error.message);
}
A(mixedFamilyRejected, '不同主线家族不得混在一个池里跨族排名');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leader-v3-'));
  const file = path.join(dir, 'case.json');
  fs.writeFileSync(file, JSON.stringify({ ...poolInput, v2Rows: [{ code: 'sz000001', originalRank: 1, leadScore: 99 }] }), 'utf8');
  const replay = await replayLeaderScoringV3([`--file=${file}`, '--require-complete']);
  A(replay.results.find(row => row.code === '000001')?.v2?.leadScore === 99,
    '离线双跑工具同时保留v2对照分和v3完整分项');
  A(/^[a-f0-9]{64}$/.test(replay.inputSha256), '离线回放输出稳定输入SHA-256供三方复核同一证据');
  let shaMismatchRejected = false;
  try { await replayLeaderScoringV3([`--file=${file}`, '--expect-sha=' + '0'.repeat(64)]); }
  catch (error) { shaMismatchRejected = /SHA-256 mismatch/.test(error.message); }
  A(shaMismatchRejected, '指定证据SHA不一致时拒绝回放');
  fs.rmSync(dir, { recursive: true, force: true });
  if (!process.exitCode) console.log('ALL LEADER-SCORING-V3 CHECKS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
