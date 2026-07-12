const {
  STRATEGY_DAILY_EVENT_RULE_VERSION,
  mergeIntradayObservation,
  buildPostCloseRecord,
} = require('../strategy-daily-events');
const fs = require('fs');
const path = require('path');
const serverSource = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

const A = (condition, message) => {
  if (!condition) { console.error('FAIL: ' + message); process.exitCode = 1; }
  else console.log('ok: ' + message);
};

const familyInfo = theme => {
  const value = String(theme || '');
  if (/算力|云计算|数据中心/.test(value)) return { key: 'group:算力AI', label: '算力AI' };
  if (/机器人|减速器/.test(value)) return { key: 'group:机器人', label: '机器人' };
  if (/消费/.test(value)) return { key: 'group:消费', label: '消费' };
  return null;
};

let record = mergeIntradayObservation(null, {
  day: '2026-07-13',
  observedAt: '2026-07-13T01:35:00.000Z',
  sessionPhase: '早盘',
  familyInfo,
  mainlines: [{
    theme: '云计算', familyKey: 'group:算力AI', rank: 2, score: 80,
    netInflow: 300000000, count: 1, bigGainCount: 3, nearLimitCount: 1,
    l2VerificationStatus: 'unscanned', starStocks: [], leaders: [{ code: '000001' }],
  }],
});
record = mergeIntradayObservation(record, {
  day: '2026-07-13',
  observedAt: '2026-07-13T01:40:00.000Z',
  sessionPhase: '早盘',
  familyInfo,
  mainlines: [{
    theme: '算力', familyKey: 'group:算力AI', rank: 1, score: 92,
    netInflow: 500000000, count: 2, bigGainCount: 4, nearLimitCount: 2,
    l2VerificationStatus: 'qi',
    starStocks: [{ code: '000001', name: '星一', level: 'expected' }],
    leaders: [{ code: '000001' }, { code: '000002' }],
  }],
});
A(record.ruleVersion === STRATEGY_DAILY_EVENT_RULE_VERSION, '盘中记录携带固定规则版本');
A(record.intradayObservation.sampleCount === 2, '两个盘中时点都被持久化,不是只保留最后状态');
const intradayFamily = record.intradayObservation.families[0];
A(intradayFamily.firstResonanceAt === '2026-07-13T01:35:00.000Z', '首次有效共振时间保留');
A(intradayFamily.firstExpectedStarAt === '2026-07-13T01:40:00.000Z', '首次预期明星时间保留');
A(intradayFamily.bestRank === 1 && intradayFamily.maxScore === 92, '盘中最佳名次与最高分保留');
A(record.postCloseConfirmed === null, '盘中观察不提前生成盘后答案');
let capped = record;
for (let i = 0; i < 165; i += 1) {
  capped = mergeIntradayObservation(capped, {
    day: '2026-07-13', observedAt: `2026-07-13T02:${String(i % 60).padStart(2, '0')}:${String(i).padStart(3, '0')}Z`,
    sessionPhase: '上午盘', familyInfo,
    mainlines: [{ theme: '算力', familyKey: 'group:算力AI', rank: 1, score: 92, netInflow: 1, count: 1 }],
  });
}
A(capped.intradayObservation.sampleCount === 160, '盘中样本上限160,覆盖完整交易时段且文件大小有界');
A(capped.intradayObservation.firstObservedAt === '2026-07-13T01:35:00.000Z', '裁剪旧样本不丢首次观察时间');

const snapshot = {
  mainlines: [
    {
      theme: '算力AI', familyKey: 'group:算力AI', score: 120,
      netInflow: 600000000, boardGainPct: 4.2, boardCount: 3, bigGainCount: 5, nearLimitCount: 2,
      priorReasonCodes: ['000007'],
      risingStocks: [{ code: '000007', name: '大涨一', gain: 6.4, priorReason: { theme: '算力' } }],
      resonanceBoards: [{ breadth: { upPct: 72, medianGainPct: 2.1 } }],
    },
    {
      theme: '机器人', familyKey: 'group:机器人', score: 105,
      netInflow: 300000000, boardGainPct: 3.1, boardCount: 2, bigGainCount: 3, nearLimitCount: 1,
      priorReasonCodes: [], resonanceBoards: [],
    },
    {
      theme: '消费', familyKey: 'group:消费', score: 99,
      netInflow: -100000000, boardGainPct: 2.2, boardCount: 2, bigGainCount: 2, nearLimitCount: 1,
      priorReasonCodes: [], resonanceBoards: [],
    },
  ],
};
const predict = {
  candidates: [
    { familyKey: 'group:算力AI', l2VerificationStatus: 'qi', stars: [{ code: '000001', name: '星一', level: 'expected' }] },
    { familyKey: 'group:机器人', l2VerificationStatus: 'qi', stars: [{ code: '000003', name: '星三', level: 'confirmed' }] },
    { familyKey: 'group:消费', l2VerificationStatus: 'qi', stars: [{ code: '000005', name: '星五', level: 'confirmed' }] },
  ],
  starTransitions: [{ mainlineKey: 'group:算力AI', code: '000001', firstExpectedAt: '2026-07-13T01:40:00.000Z' }],
};
const limitDb = { stocks: [
  { code: '000001', name: '星一' }, { code: '000002', name: '算二' },
  { code: '000003', name: '星三' }, { code: '000004', name: '机四' },
  { code: '000005', name: '星五' }, { code: '000006', name: '消六' },
] };
const mainReasonDb = { stocks: [
  { code: '000001', name: '星一', finalBoardTopic: '云计算' },
  { code: '000002', name: '算二', finalBoardTopic: '数据中心' },
  { code: '000003', name: '星三', finalBoardTopic: '机器人' },
  { code: '000004', name: '机四', finalBoardTopic: '减速器' },
  { code: '000005', name: '星五', finalBoardTopic: '消费' },
  { code: '000006', name: '消六', finalBoardTopic: '消费' },
] };
const closeDb = { stocks: [
  ...limitDb.stocks.map(row => ({ ...row, gain: 10 })),
  { code: '000007', name: '大涨一', gain: 6.4 },
] };

record = buildPostCloseRecord(record, {
  day: '2026-07-13', generatedAt: '2026-07-13T08:10:00.000Z',
  snapshot, predict, limitDb, mainReasonDb, closeDb, familyInfo,
  isExcluded: () => false,
  quality: { limitUpComplete: true, mainReasonComplete: true, closeComplete: true, missingMainReasonCodes: [] },
});
A(record.complete === true && record.postCloseConfirmed.complete === true, '完整底库生成可用于历史的盘后记录');
A(record.postCloseConfirmed.confirmedMainlines.length === 2, '最多确认两条且两条均独立过硬门槛');
A(record.postCloseConfirmed.confirmedMainlines.map(row => row.familyKey).join(',') === 'group:算力AI,group:机器人', '净流出消费即使有明星和两涨停也被硬门槛排除');
const byCode = new Map(record.stockEvents.events.map(row => [row.code, row]));
A(byCode.get('000001')?.event === 'star-limit-up' && byCode.get('000001')?.points === 20, '预期明星最终封板记20分');
A(byCode.get('000002')?.event === 'ordinary-limit-up' && byCode.get('000002')?.points === 15, '同族普通涨停记15分且不叠加明星分');
A(byCode.get('000007')?.event === 'confirmed-mainline-big-gain' && byCode.get('000007')?.points === 8, '已确认主线证据股收盘大于5%未板记8分');
A(record.stockEvents.events.filter(row => row.code === '000001').length === 1, '同一股票同日事件互斥,只保留最高等级');
A(record.historyUsableFrom === 'next-trading-day', '盘后答案明确只能从下一交易日起使用');

const missing = buildPostCloseRecord(null, {
  day: '2026-07-14', generatedAt: '2026-07-14T08:10:00.000Z',
  snapshot, predict, limitDb, mainReasonDb: { stocks: [] }, closeDb, familyInfo,
  isExcluded: () => false,
  quality: { limitUpComplete: true, mainReasonComplete: false, closeComplete: true, missingMainReasonCodes: ['000001'] },
});
A(missing.complete === false && missing.postCloseConfirmed.status === 'dataMissing', '主因库不完整时明确dataMissing,不生成伪完整记录');
A(missing.postCloseConfirmed.confirmedMainlines.length === 0, '缺主因时不勉强确认主线');
A(missing.stockEvents.events.every(row => row.points === null), '缺主因家族时不把未知事件写成0或15');

A(serverSource.includes("require('./strategy-daily-events')"), '主服务原子依赖每日事件模块');
A(serverSource.includes('await recordStrategyDailyIntradayObservation(day, sessionPhase, mainlines, savedAt)'), '盘中预测写盘后同步记录观察样本');
A(serverSource.includes('runAutoStrategyDailyEventsIfDue().catch'), '服务分钟任务接入16点后盘后定稿与重试');
A(serverSource.includes("'strategy-daily-events.js',") && serverSource.includes("'strategy-evidence.js',"), '每日事件及证据模块包含在后台程序同步清单');
A(serverSource.match(/'strategy-data',[\s\S]{0,180}'kpl-permanent-hidden-boards\.json'/), '每日事件运行文件包含在数据库同步清单');
A(serverSource.includes('cleanupDateNamedEntries(STRATEGY_MAINLINE_DATA_DIR, retentionDays, nowDay, dateCleanupOptions)'), '每日事件沿用最近30交易日清理');
A(serverSource.includes("url.pathname === '/api/admin/strategy-daily-events'") &&
  serverSource.match(/async function getStrategyDailyEventsApi[\s\S]{0,120}requireAdmin\(req, res\)/), '每日事件查询/重建接口仅管理员可用');

if (!process.exitCode) console.log('ALL STRATEGY-DAILY-EVENT CHECKS PASSED');
