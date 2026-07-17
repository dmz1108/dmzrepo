'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { mergeIntradayObservation } = require('../strategy-daily-events');
const {
  buildStrategyObservationReport,
  renderStrategyObservationMarkdown,
  writeStrategyObservationReport,
} = require('../strategy-observation-report');

const DAY = '2026-07-17';
const familyInfo = theme => ({ key: `group:${theme}`, label: theme });
const realtimeContext = {
  schemaVersion: 1,
  day: DAY,
  asOf: '2026-07-17T01:36:00.000Z',
  complete: true,
  partial: false,
  readyFor: { intradayRanking: true, historicalScoring: true, l2StarValidation: true },
  sourceStatus: {
    eastmoney: { available: true, complete: true, stale: false, sourceDay: DAY, rowCount: 100 },
    ths: { available: true, complete: true, stale: false, sourceDay: DAY, rowCount: 120 },
    kpl: { available: true, complete: true, stale: false, sourceDay: DAY, rowCount: 80 },
  },
  missingFields: [],
};

(async () => {
  let daily = mergeIntradayObservation(null, {
    day: DAY,
    observedAt: '2026-07-17T01:36:00.000Z',
    sessionPhase: '早盘',
    familyInfo,
    realtimeContext,
    mainlines: [{
      theme: '算力AI', rank: 1, score: 88, netInflow: 6e8, count: 2,
      starStocks: [{ code: '000001', name: '预期一', level: 'expected' }],
    }],
  });
  daily = mergeIntradayObservation(daily, {
    day: DAY,
    observedAt: '2026-07-17T02:00:00.000Z',
    sessionPhase: '上午盘',
    familyInfo,
    realtimeContext: { ...realtimeContext, asOf: '2026-07-17T02:00:00.000Z' },
    mainlines: [{
      theme: '算力AI', rank: 1, score: 96, netInflow: 8e8, count: 3,
      starStocks: [{ code: '000001', name: '预期一', level: 'confirmed' }],
    }],
  });
  assert.strictEqual(daily.intradayObservation.dataQuality.status, 'observed');
  assert.strictEqual(daily.intradayObservation.dataQuality.sampleCount, 2);
  assert.strictEqual(daily.intradayObservation.dataQuality.last.sourceStatus.eastmoney.rowCount, 100);
  assert.strictEqual(daily.intradayObservation.samples[0].realtimeData.complete, true);
  console.log('ok: P4 数据质量随既有盘中观察样本保存，不新建平行时间线');

  const qualityOnly = mergeIntradayObservation(daily, {
    day: DAY,
    observedAt: '2026-07-17T02:03:00.000Z',
    sessionPhase: '上午盘',
    familyInfo,
    realtimeContext,
    mainlines: [],
  });
  assert.strictEqual(qualityOnly.intradayObservation.sampleCount, 3);
  assert.strictEqual(qualityOnly.intradayObservation.samples[2].families.length, 0);
  assert(qualityOnly.intradayObservation.samples[2].realtimeData);
  console.log('ok: 没有主线时仍保存来源质量，不把空榜误当观测缺失');

  const report = buildStrategyObservationReport({
    day: DAY,
    generatedAt: '2026-07-17T07:05:00.000Z',
    context: {
      ...realtimeContext,
      evidenceStatus: {},
      missingReasonCodes: [],
    },
    dailyEvents: qualityOnly,
    prediction: { recordState: 'no-mainline', bySource: { eastmoney: { top: [] }, ths: { top: [] } } },
    l2Jobs: [
      { status: 'done', total: 10, scanned: 10, metrics: { resultRows: 10 }, boardName: '算力' },
      { status: 'running', total: 5, scanned: 2, metrics: { resultRows: 2 }, boardName: '云计算' },
    ],
  });
  assert.strictEqual(report.l2.coveragePct, 80);
  assert.strictEqual(report.stars.expectedCount, 1);
  assert.strictEqual(report.stars.confirmedCount, 1);
  assert.strictEqual(report.stars.conversionPct, 100);
  assert.strictEqual(report.mainline.timing[0].firstSeenMinutesAfterOpen, 6);
  assert.strictEqual(report.mainline.timing[0].firstConfirmedStarMinutesAfterOpen, 30);
  assert.strictEqual(report.mainline.noMainlineAssessment, 'positive-star-without-mainline-investigate');
  assert(report.issues.includes('l2-coverage-incomplete'));
  assert(report.issues.includes('positive-star-without-mainline'));
  console.log('ok: 每日报告同时量化 L2 覆盖、明星转化、主线出现速度和异常空榜');

  const noSignal = buildStrategyObservationReport({
    day: DAY,
    context: realtimeContext,
    dailyEvents: mergeIntradayObservation(null, {
      day: DAY, observedAt: '2026-07-17T01:40:00.000Z', sessionPhase: '早盘',
      familyInfo, realtimeContext, mainlines: [],
    }),
    prediction: { recordState: 'no-mainline', top: [] },
    l2Jobs: [{ status: 'done', total: 1, scanned: 1, metrics: { resultRows: 1 } }],
  });
  assert.strictEqual(noSignal.mainline.noMainlineAssessment, 'reasonable-no-positive-l2-star');
  console.log('ok: 完整扫描但没有明星时，今日无主线被判为合理而非故障');

  const markdown = renderStrategyObservationMarkdown(report);
  assert(markdown.includes('Star Conversion') && markdown.includes('positive-star-without-mainline'));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strategy-report-'));
  const written = await writeStrategyObservationReport({ rootDir: dir, report });
  assert(fs.existsSync(written.jsonFile));
  assert(fs.existsSync(written.markdownFile));
  assert.strictEqual(JSON.parse(fs.readFileSync(written.jsonFile, 'utf8')).day, DAY);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('ok: 每日观察报告原子输出 JSON 与可读 Markdown');
  console.log('ALL STRATEGY OBSERVATION REPORT TESTS PASSED');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
