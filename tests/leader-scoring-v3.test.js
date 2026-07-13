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
  gainAnchorDay: '2026-07-08',
  gainPriceState: 'post-close-final',
  gainAsOf: '2026-07-08T07:30:00.000Z',
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
A(scored.components.history.tradingDays.length === 9 &&
  scored.components.history.tradingDays[0] === '2026-06-25' &&
  scored.components.eventWindow.tradingDays.length === 10 &&
  scored.components.eventWindow.tradingDays.at(-1) === '2026-07-08',
  '10日事件窗口严格等于前9个交易日加目标日');
A(scored.components.today.points === 15, '当天普通涨停只记互斥事件15分');
A(scored.components.trend.points === 15, '趋势层按10日10分+30日5分独立计分');
A(scored.leadScoreV3Raw === 65, '总分=历史35+当天15+趋势15,不重复叠加旧信号');
A(scored.ignoredLegacyScoreSignals.length === 7, '旧在场/涨停/连板/早封/明星/新鲜度字段明确只作忽略诊断');
A(scored.components.history.familyLimitEventCount === 2 && scored.priorFamilyLimitGate === true &&
  scored.formalEligibilityGate === true && scored.formalEligibilityBasis === 'prior-family-limit-up',
  '此前家族涨停事件可以满足正式龙头资格');

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

const noPriorHistory = DAYS.map(day => dailyRecord(day));
const firstDayConfirmed = scoreLeaderV3({
  ...base,
  dailyRecords: noPriorHistory,
  todayRecord: todayOrdinary,
});
A(firstDayConfirmed.components.history.familyLimitEventCount === 0 && firstDayConfirmed.priorFamilyLimitGate === false &&
  firstDayConfirmed.todayConfirmedFamilyLimitGate === true && firstDayConfirmed.formalEligibilityGate === true &&
  firstDayConfirmed.formalEligibilityBasis === 'confirmed-target-day-family-limit-up' && firstDayConfirmed.formalScore === 30,
  '盘后确认的目标日家族涨停可零加分通过正式资格,当天15分只计算一次');

const firstDayIntraday = scoreLeaderV3({
  ...base,
  dailyRecords: noPriorHistory,
  todayRecord: null,
  todayProjection: { persisted: true, status: 'provisional', event: 'ordinary-limit-up', observedAt: '2026-07-08T10:00:00+08:00' },
  gainPriceState: 'intraday-live',
  gainAsOf: '2026-07-08T10:00:00+08:00',
});
A(firstDayIntraday.complete === true && firstDayIntraday.leadScoreV3Raw === 30 &&
  firstDayIntraday.todayConfirmedFamilyLimitGate === false && firstDayIntraday.formalEligibilityGate === false &&
  firstDayIntraday.formalScore === null,
  '盘中投影不能把首日家族候选提前升级为正式龙头');

const firstDayBigGain = scoreLeaderV3({
  ...base,
  dailyRecords: noPriorHistory,
  todayRecord: bigGainToday,
});
A(firstDayBigGain.todayConfirmedFamilyLimitGate === false && firstDayBigGain.formalEligibilityGate === false &&
  firstDayBigGain.formalScore === null,
  '首日仅大涨未板不能独立满足正式龙头的家族涨停资格');

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
  gainAnchorDay: '2026-07-08', gainPriceState: 'post-close-final', gainAsOf: '2026-07-08T07:30:00.000Z',
  gain10: 0, gain30: 0,
  legacySignals: { zt10Count: 2, todayLimit: true, present: true, lianban: 2, earlySeal: true, freshScore: 10 },
});
A(weier.components.history.points === 15 && weier.components.today.points === 15 && weier.leadScoreV3Raw === 30,
  '威尔高两连板只按两个交易日各15分,不再重复计算当日在场/连板/早封');

const tenStarDays = DAYS.map(day => dailyRecord(day, [event('000009', familyKey, 'star-limit-up')]));
const uncapped = scoreLeaderV3({
  ...base, code: '000009', dailyRecords: tenStarDays,
  todayRecord: dailyRecord('2026-07-08', [event('000009', familyKey, 'star-limit-up')]), gain10: 0, gain30: 0,
});
A(uncapped.components.history.points === 180 && uncapped.components.today.points === 20 &&
  uncapped.components.eventWindow.points === 200 && uncapped.leadScoreV3Raw === 200,
  '前9日加当天的10个真实明星事件完整累积到200分,不设总分上限');

const missingHistory = history.slice(0, -1);
const incomplete = scoreLeaderV3({ ...base, dailyRecords: missingHistory });
A(incomplete.complete === false && incomplete.components.history.points === null && incomplete.components.history.knownPoints === 35,
  '缺一个交易日记录时保留已知分但正式分为null,不拿缺失日冒充0分');
A(incomplete.components.history.missingDays.includes('2026-07-07'), '缺失记录保留具体交易日,不是unknown');

const previousDayAnchor = scoreLeaderV3({ ...base, gainAnchorDay: '2026-07-07' });
A(previousDayAnchor.complete === false && previousDayAnchor.components.trend.dataMissing.includes('gainAnchorNotTargetDay'),
  '趋势锚不得停在前一日,必须包含目标日实时价或终盘价');
const missingPriceState = scoreLeaderV3({ ...base, gainPriceState: '', gainAsOf: '' });
A(missingPriceState.complete === false && missingPriceState.components.trend.dataMissing.includes('gainPriceState') &&
  missingPriceState.components.trend.dataMissing.includes('gainAsOf'),
  '趋势价格必须注明盘中实时或盘后终值及时间,不能沿用来源不明的涨幅');
const staleAsOf = scoreLeaderV3({ ...base, gainAsOf: '2026-07-07T07:30:00.000Z' });
A(staleAsOf.complete === false && staleAsOf.components.trend.dataMissing.includes('gainAsOfNotTargetDay'),
  '趋势时间戳必须属于目标日,昨日时间戳不得冒充今日实时价或终盘价');
const wrongWindow = scoreLeaderV3({ ...base, windowDays: 11 });
A(wrongWindow.complete === false && wrongWindow.dataMissing.includes('history:eventWindowDays') &&
  wrongWindow.components.eventWindow.windowDays === 10,
  '龙头事件窗口锁定为10日,调用方不得重新传回旧11日口径');

const poolInput = {
  ...base,
  candidates: [
    { code: '000001', name: '样本一', gainAnchorDay: '2026-07-08', gain10: 10, gain30: 20 },
    { code: '000002', name: '样本二', gainAnchorDay: '2026-07-08', gain10: 80, gain30: 80,
      dailyRecords: DAYS.map((day, i) => dailyRecord(day, i === 1 ? [event('000002', familyKey, 'ordinary-limit-up')] : [])),
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
      i === 1 ? [event('000003', familyKey, 'ordinary-limit-up')] : [])),
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

// Owner 2026-07-13 口径:一旦窗口内至少一次涨停确认本主线资格,
// 同一10日窗口内该股的其它真实涨停也计15/20,不因当日细分标签不同而丢失。
const otherFamily = 'group:光通信';
const ziguangHistory = DAYS.map(day => dailyRecord(day,
  day === '2026-06-30' ? [event('000938', otherFamily, 'ordinary-limit-up', {
    sourceReason: { finalBoardTopic: '光模块', finalDetailReason: '算力' },
  })] : day === '2026-07-06' ? [event('000938', familyKey, 'ordinary-limit-up', {
    sourceReason: { finalBoardTopic: '算力', finalDetailReason: '云计算数据中心' },
  })] : []));
const ziguang = scoreLeaderV3({
  ...base,
  code: '000938',
  name: '紫光股份',
  dailyRecords: ziguangHistory,
  todayRecord: dailyRecord('2026-07-08'),
  gain10: 21.55,
  gain30: 16.59,
});
const ziguangCrossFamily = ziguang.components.history.evidence.find(row => row.day === '2026-06-30');
A(ziguang.components.history.points === 30 && ziguang.components.history.familyLimitEvidenceCount === 1 &&
  ziguang.components.history.limitUpEventCount === 2 &&
  ziguangCrossFamily?.evidence?.recordedFamilyKey === otherFamily &&
  ziguangCrossFamily?.countedBy === 'rolling-window-family-qualified-limit-up',
  '紫光7月6日算力涨停确认资格后,6月30日光模块涨停也计入同一10日窗口');
A(ziguang.components.trend.gain10Points === 21.55 && ziguang.components.trend.gain30Points === 4.15 &&
  ziguang.leadScoreV3Raw === 55.7,
  '紫光趋势使用截至7月8日的前9日加当天口径');

const hangjinHistory = DAYS.map(day => dailyRecord(day,
  ['2026-06-24', '2026-06-25', '2026-06-30'].includes(day)
    ? [event('000818', familyKey, 'ordinary-limit-up')] : []));
const hangjin = scoreLeaderV3({
  ...base,
  code: '000818',
  name: '航锦科技',
  dailyRecords: hangjinHistory,
  todayRecord: dailyRecord('2026-07-08'),
  gain10: 5.42,
  gain30: -9.44,
});
A(hangjin.components.history.points === 30 &&
  !hangjin.components.history.tradingDays.includes('2026-06-24') &&
  hangjin.leadScoreV3Raw === 35.42,
  '航锦6月24日已在新10日窗口外,只保留6月25日和6月30日两次涨停');
A(ziguang.formalScore > hangjin.formalScore,
  '修正后的真实样本不再因错位窗口把航锦排在紫光之前');

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
