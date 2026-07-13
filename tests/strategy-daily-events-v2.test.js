'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildPostCloseRecord } = require('../strategy-daily-events');
const { loadStrategySnapshotForDailyEvents } = require('../strategy-daily-event-quality');
const {
  LEADER_SCORING_V3_SCORE_VERSION,
  eventForCode,
  scoreLeaderV3,
} = require('../strategy-leader-scoring-v3');

const A = (condition, message) => {
  if (!condition) { console.error('FAIL: ' + message); process.exitCode = 1; }
  else console.log('ok: ' + message);
};

const FAMILY = 'group:算力AI';
const familyInfo = theme => /算力|云计算|数据中心/.test(String(theme || ''))
  ? { key: FAMILY, label: '算力AI' } : null;
const snapshot = {
  mainlines: [{
    theme: '算力AI', familyKey: FAMILY, score: 100, netInflow: 5e8,
    boardGainPct: 3.5, boardCount: 2, bigGainCount: 3, nearLimitCount: 1,
    priorReasonCodes: ['000003'],
  }],
};
const completeQuality = {
  limitUpComplete: true,
  mainReasonComplete: true,
  closeComplete: true,
  missingMainReasonCodes: [],
  snapshotStatus: 'ok',
  snapshotUsable: true,
  snapshotEvidence: [],
};

function build(over = {}) {
  const input = {
    day: over.day || '2026-07-02',
    generatedAt: '2026-07-02T08:10:00.000Z',
    snapshot,
    predict: { candidates: [], starTransitions: [] },
    limitDb: { stocks: [
      { code: '000001', name: '甲' },
      { code: '000002', name: '乙' },
    ] },
    mainReasonDb: { stocks: [
      { code: '000001', name: '甲', finalBoardTopic: '算力', finalDetailReason: '细分甲' },
      { code: '000002', name: '乙', finalBoardTopic: '云计算', finalDetailReason: '细分乙' },
    ] },
    closeDb: { stocks: [
      { code: '000001', name: '甲', gain: 10 },
      { code: '000002', name: '乙', gain: 10 },
      { code: '000003', name: '丙', gain: 6.4 },
      { code: '000004', name: '丁', gain: 4.2 },
    ] },
    quality: completeQuality,
    familyInfo,
    isExcluded: () => false,
    ...over,
  };
  return buildPostCloseRecord(null, input);
}

function v2Record(day, events = [], over = {}) {
  return {
    day,
    complete: over.complete ?? true,
    ruleVersion: 'leader-scoring-v3-events-v2',
    stockEvents: {
      complete: over.stockComplete ?? true,
      rowsAuthoritative: over.rowsAuthoritative ?? true,
      noneDeterminable: over.noneDeterminable ?? true,
      events,
    },
  };
}

function scoredEvent(code, type, points, over = {}) {
  return {
    code, familyKey: FAMILY, event: type, points,
    status: 'confirmed', historyEligible: true, dataMissing: [],
    sourceReason: { finalBoardTopic: '算力', finalDetailReason: '证据' },
    ...over,
  };
}

(async () => {
  // T1:完整日的行集与 v1 既有语义一致。
  const s1 = build({
    predict: { candidates: [{ familyKey: FAMILY, stars: [{ code: '000001', level: 'expected' }] }] },
  });
  const s1Rows = s1.stockEvents.events.map(row => `${row.code}:${row.event}:${row.points}`).sort();
  A(s1Rows.join('|') === [
    '000001:star-limit-up:20',
    '000002:ordinary-limit-up:15',
    '000003:confirmed-mainline-big-gain:8',
  ].join('|'), 'T1 S1 v2 行集保持既有20/15/8语义');
  A(eventForCode(s1, '000001', FAMILY).points === 20 && eventForCode(s1, '000003', FAMILY).points === 8,
    'T1 v2评分消费与v1事件分值一致');

  // T2-T5:S2 按股票收窄。
  const s2 = build({
    snapshot: null,
    quality: { ...completeQuality, snapshotStatus: 'missing', snapshotUsable: false,
      snapshotEvidence: [{ state: 'missing', expectedPath: 'kpl-snapshots/5/2026-07-02.json', sha256: null }] },
  });
  A(eventForCode(s2, '000001', FAMILY).points === 15 &&
    s2.stockEvents.events.find(row => row.code === '000001')?.historyEligible === true,
  'T2 缺快照不清除可独立确认的普通涨停15分');
  A(eventForCode(s2, '000004', FAMILY).points === 0, 'T3 缺快照但未板且涨幅不超5%可确定none 0');
  const r5 = eventForCode(s2, '000003', FAMILY);
  A(!r5.complete && r5.dataMissing.includes('confirmedMainlineUnknown'),
    'T4 缺快照且未板涨幅大于5%显式阻断主线8分');
  const noFamily = build({
    snapshot: null,
    limitDb: { stocks: [{ code: '000009', name: '无归属' }] },
    mainReasonDb: { stocks: [] },
    quality: { ...completeQuality, mainReasonComplete: false, missingMainReasonCodes: ['000009'],
      snapshotStatus: 'missing', snapshotUsable: false },
  });
  A(eventForCode(noFamily, '000009', FAMILY).dataMissing.includes('mainReasonFamily'),
    'T5 涨停但主因家族不可归属只阻断该股');

  // T6/T6b:manifest 必须在任何快照层读取前拦截。
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'p6-quality-'));
  const day = '2026-07-02';
  const manifestFile = path.join(root, 'strategy-data', 'strategy-data-quality.json');
  const files = [
    path.join(root, 'strategy-data', `strategy-mainline-snapshot-${day}.json`),
    path.join(root, 'strategy-data', 'snapshots', `${day}.json`),
    ...[5, 6, 7].map(z => path.join(root, 'kpl-snapshots', String(z), `${day}.json`)),
  ];
  for (const file of files) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '{}'); }
  fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
  fs.writeFileSync(manifestFile, JSON.stringify({ entries: [{
    path: `strategy-data/snapshots/${day}.json`, state: 'contaminated', targetDay: day,
    observedSha256: 'a'.repeat(64), observedSourceDay: '2026-07-01', reason: 'cross-day values',
  }] }));
  const reads = [];
  const trackedRead = async file => { reads.push(path.relative(root, file).replace(/\\/g, '/')); return JSON.parse(fs.readFileSync(file, 'utf8')); };
  const quarantined = await loadStrategySnapshotForDailyEvents({ rootDir: root, day, readJson: trackedRead });
  A(quarantined.snapshotStatus === 'quarantined' && quarantined.snapshot === null && reads.length === 1,
    'T6 污染清单命中后不读取冻结/综合/原始快照');
  fs.writeFileSync(manifestFile, JSON.stringify({ entries: [{
    expectedPath: `kpl-snapshots/5/${day}.json`, state: 'missing', targetDay: day,
    reason: 'raw source absent', sha256: null,
  }] }));
  reads.length = 0;
  const rawMissing = await loadStrategySnapshotForDailyEvents({ rootDir: root, day, readJson: trackedRead });
  A(rawMissing.snapshotStatus === 'missing' && rawMissing.snapshotEvidence[0]?.sha256 === null && reads.length === 1,
    'T6b 任一必需原始层缺失即阻断snapshot ok且不伪造SHA');
  fs.rmSync(root, { recursive: true, force: true });

  // T7:涨停库不可信是唯一全日闸。
  const s3 = build({ quality: { ...completeQuality, limitUpComplete: false } });
  A(eventForCode(s3, '000001', FAMILY).dataMissing.includes('limitUpDbUnreliable'),
    'T7 涨停库不可信时全日阻断');

  // T8/T8b/T9/T9b:明星证据严格逐股。
  const stars = build({ predict: { candidates: [{
    familyKey: FAMILY, l2VerificationStatus: 'qi', stars: [{ code: '000001', level: 'expected' }],
  }] } });
  const starA = stars.stockEvents.events.find(row => row.code === '000001');
  const starB = stars.stockEvents.events.find(row => row.code === '000002');
  A(starA.points === 20 && starA.starEvidenceStatus === 'confirmed', 'T8 自身expected正证据记20');
  A(starB.points === 15 && starB.starEvidenceStatus === 'unscanned',
    'T8b 同族另一只明星不能证明本股已扫描');
  const crossFamilyStar = build({ predict: { candidates: [{
    familyKey: 'group:网络安全', l2VerificationStatus: 'qi',
    stars: [{ code: '000001', level: 'confirmed' }],
  }], starTransitions: [{
    mainlineKey: 'group:网络安全', code: '000001', firstExpectedAt: '2026-07-02T02:00:00.000Z',
  }] } });
  const crossFamilyRow = crossFamilyStar.stockEvents.events.find(row => row.code === '000001');
  A(crossFamilyRow?.points === 20 && crossFamilyRow?.starEvidenceStatus === 'confirmed' &&
    crossFamilyRow?.familyKey === FAMILY,
  'T8c 明星档次跟随股票自身盘中证据,盘后跨家族归属仍记20');
  const covered = build({ predict: { candidates: [{
    familyKey: FAMILY, l2VerificationStatus: 'scanned-no-star', stars: [],
    scanCoverage: { coversAllCandidates: true },
  }], starTransitions: [] } });
  A(covered.stockEvents.events.find(row => row.code === '000002')?.starEvidenceStatus === 'not-confirmed',
    'T9 明确全候选扫描覆盖后无明星记not-confirmed');
  const emptyEvidence = build({ predict: { candidates: [{ familyKey: FAMILY, stars: [] }], starTransitions: [] } });
  A(emptyEvidence.stockEvents.events.find(row => row.code === '000002')?.starEvidenceStatus === 'unscanned',
    'T9b 空stars和空transition不提升扫描状态');

  // T10-T12:兼容、互斥、未知规则。
  const v1 = {
    day, complete: true, ruleVersion: 'leader-scoring-v3-events-v1',
    stockEvents: { complete: true, events: [scoredEvent('000001', 'ordinary-limit-up', 15)] },
  };
  A(eventForCode(v1, '000001', FAMILY).points === 15 && LEADER_SCORING_V3_SCORE_VERSION.endsWith('shadow-v2'),
    'T10 v1档案保持旧闸且输出评分版本升级shadow-v2');
  const duplicate = v2Record(day, [
    scoredEvent('000001', 'ordinary-limit-up', 15),
    scoredEvent('000001', 'star-limit-up', 20),
  ]);
  A(eventForCode(duplicate, '000001', FAMILY).points === 20 &&
    eventForCode(duplicate, '000001', FAMILY).duplicateRowsIgnored === 1,
  'T11 同股同族双行只取最高分');
  A(eventForCode({ ...duplicate, ruleVersion: 'future-v9' }, '000001', FAMILY)
    .dataMissing.includes('dailyEventRuleVersion'), 'T12 未知事件规则明确阻断');

  // T13/T14:完整窗口、正式资格与趋势边界。
  const historyDays = [
    '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-29', '2026-06-30',
    '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07',
  ];
  const noEventHistory = historyDays.map(d => v2Record(d));
  const today = v2Record('2026-07-08', [scoredEvent('002396', 'ordinary-limit-up', 15)]);
  const endToEnd = scoreLeaderV3({
    targetDay: '2026-07-08', code: '002396', name: '星网锐捷', familyKey: FAMILY,
    tradingDays: historyDays, dailyRecords: [...noEventHistory, today], todayRecord: today,
    gainAnchorDay: '2026-07-07', gain10: 10, gain30: 20,
  });
  A(endToEnd.complete && endToEnd.formalScore !== null &&
    endToEnd.formalEligibilityBasis === 'confirmed-target-day-family-limit-up',
  'T13 v2窗口完整且目标日家族涨停可形成正式资格');
  const noTrend = scoreLeaderV3({
    targetDay: '2026-07-08', code: '600405', familyKey: FAMILY,
    tradingDays: historyDays, dailyRecords: [...noEventHistory, today], todayRecord: today,
    gainAnchorDay: '2026-07-07', gain10: null, gain30: null,
  });
  A(!noTrend.complete && noTrend.dataMissing.includes('trend:gain10') && noTrend.dataMissing.includes('trend:gain30'),
    'T14 P6不放松趋势层缺失');

  // T15:S4 主因全局不完整只阻断缺归属股票。
  const s4 = build({
    mainReasonDb: { stocks: [{ code: '000001', name: '甲', finalBoardTopic: '算力' }] },
    quality: { ...completeQuality, mainReasonComplete: false, missingMainReasonCodes: ['000002'] },
  });
  A(eventForCode(s4, '000001', FAMILY).points === 15 &&
    eventForCode(s4, '000002', FAMILY).dataMissing.includes('mainReasonFamily'),
  'T15 主因库局部缺失时A计15且只阻断B');
  const fullSourcesWithCoverageGap = build({
    limitDb: { stocks: [{ code: '000009', name: '事件股' }] },
    mainReasonDb: { stocks: [{ code: '000009', name: '事件股', finalBoardTopic: '其他事件' }] },
    quality: { ...completeQuality, missingMainReasonCodes: [] },
  });
  A(fullSourcesWithCoverageGap.stockEvents.complete === true &&
    fullSourcesWithCoverageGap.stockEvents.coverageComplete === false &&
    fullSourcesWithCoverageGap.complete === true,
  'T15b 三库完整日即使个股不可归属,complete仍为true且coverageComplete单独为false');

  // T16/T16b:S5 不清除涨停分,R5b只阻断确认主线成员。
  const s45 = build({
    snapshot: null,
    quality: { ...completeQuality, mainReasonComplete: false, closeComplete: false,
      snapshotStatus: 'missing', snapshotUsable: false },
  });
  A(eventForCode(s45, '000001', FAMILY).points === 15 &&
    eventForCode(s45, '000099', FAMILY).dataMissing.join(',') === 'closePrice,confirmedMainlineUnknown',
  'T16 收盘和主线未知不反向清除涨停15,未板走E7');
  const s5 = build({
    predict: { candidates: [{ familyKey: FAMILY, stars: [{ code: '000001', level: 'expected' }] }] },
    quality: { ...completeQuality, closeComplete: false },
  });
  A(eventForCode(s5, '000003', FAMILY).dataMissing.join(',') === 'closePrice' &&
    eventForCode(s5, '000099', FAMILY).points === 0,
  'T16b 主线成员缺收盘价走R5b,非成员仍可确定none 0');

  // T17:总分不完整仍保留已确认分与provenance。
  const mixed = noEventHistory.slice();
  mixed[0] = v2Record(historyDays[0], [scoredEvent('000001', 'ordinary-limit-up', 15)]);
  mixed[1] = v2Record(historyDays[1], [{
    code: '000001', familyKey: null, event: 'data-missing', points: null,
    status: 'dataMissing', historyEligible: false, dataMissing: ['confirmedMainlineUnknown'], closeGainPct: 7.2,
  }]);
  const audited = scoreLeaderV3({
    targetDay: '2026-07-08', code: '000001', familyKey: FAMILY,
    tradingDays: historyDays, dailyRecords: mixed, todayRecord: v2Record('2026-07-08'),
    gainAnchorDay: '2026-07-07', gain10: null, gain30: null,
  });
  const known = audited.components.history.evidence.find(row => row.points === 15);
  A(audited.formalScore === null && audited.components.history.knownPoints === 15 &&
    known?.evidence?.sourceReason?.finalBoardTopic === '算力',
  'T17 总分incomplete仍保留已确认15分及主因provenance');

  if (!process.exitCode) console.log('ALL STRATEGY-DAILY-EVENTS-V2 CHECKS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
