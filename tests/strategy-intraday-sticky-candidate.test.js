// 当日候选粘性恢复：已出现 L2 预期/确认明星的候选不能因实时板块池换榜而从页面消失。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
  if (!match) throw new Error(`not found: ${name}`);
  const start = match.index;
  const brace = src.indexOf('{', src.indexOf(')', start));
  let depth = 0;
  let index = brace;
  for (; index < src.length; index += 1) {
    if (src[index] === '{') depth += 1;
    else if (src[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(start, index + 1);
}

const stubs = `
const isFiniteNumeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const normalizeReasonSourceCode = value => String(value || '').replace(/\\D/g, '').trim();
const isoFromCompactDate = value => String(value || '').slice(0, 10);
const chinaNowParts = () => ({ day: '2026-07-31' });
const strategyMainlineStarActionState = level => level === 'confirmed' ? 'buy-point-observed' : 'watch';
function strategyMainlineFilterAttributedStars(item, attributionByCode) {
  if (!(attributionByCode instanceof Map)) return item;
  const stars = (item.starStocks || []).filter(star => attributionByCode.get(star.code) !== 'reject');
  return {
    ...item,
    starStocks: stars,
    l2VerificationStatus: stars.some(star => ['expected', 'confirmed'].includes(star.level)) ? 'qi' : 'scanned-no-star',
  };
}
function strategyMainlineHasQiStarEvidence(item) {
  return item?.l2VerificationStatus === 'qi'
    && (item?.starStocks || []).some(star => ['expected', 'confirmed'].includes(star.level));
}
`;

eval(stubs
  + extractFn('strategyPredictCandidateKey') + '\n'
  + extractFn('strategyMainlineIntradayStickyCandidateRow') + '\n'
  + extractFn('strategyMainlineRestoreIntradayStickyPrediction'));

const A = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

const emptySource = source => ({
  source,
  available: true,
  hasMainlines: false,
  mainlines: [],
  reserveMainlines: [],
});
const payload = {
  ok: true,
  day: '2026-07-31',
  mainlines: [],
  reserveMainlines: [],
  mainlinesBySource: {
    eastmoney: emptySource('eastmoney'),
    ths: emptySource('ths'),
  },
};
const aiVideo = {
  key: 'theme:AI视频',
  familyKey: 'theme:AI视频',
  theme: 'AI视频',
  qiTier: 'reserve',
  reserveReasons: ['no-qualified-leader'],
  score: 218,
  predictScore: 138,
  netInflow: 1146847200,
  netInflowZsType: 5,
  netInflowZjjlr: 5908000000,
  netInflowMetric: 'ths-dde-big-order-amount',
  limitUpCount: 8,
  todayLimitCodes: ['300418', '300063'],
  stars: [
    { code: '300418', name: '昆仑万维', level: 'confirmed' },
    { code: '300063', name: '天龙集团', level: 'expected' },
  ],
  leaders: [],
  firstObservedAt: '2026-07-31T05:07:56.919Z',
  lastObservedAt: '2026-07-31T05:30:56.702Z',
  intradaySticky: true,
};
const predict = {
  day: '2026-07-31',
  savedAt: '2026-07-31T06:06:38.633Z',
  bySource: {
    eastmoney: { candidates: [] },
    ths: {
      candidates: [
        aiVideo,
        { key: 'theme:普通', familyKey: 'theme:普通', theme: '普通',
          stars: [{ code: '300001', name: '普通股', level: 'active' }] },
      ],
    },
  },
};

const restored = strategyMainlineRestoreIntradayStickyPrediction(payload, predict);
const restoredAi = restored.mainlinesBySource.ths.reserveMainlines.find(row => row.theme === 'AI视频');
A(!!restoredAi, '同花顺 AI视频 从当天预测档恢复到预备主线');
A(restoredAi.intradaySticky === true && restoredAi.currentObservation === false,
  '恢复卡明确标记为盘中历史轨迹，不冒充当前实时板块数据');
A(restoredAi.count === 8 && restoredAi.netInflow === 1146847200,
  '恢复卡保留当时真实涨停数与资金，不重新编造');
A(restoredAi.starStocks.some(star => star.code === '300418' && star.level === 'confirmed')
  && restoredAi.starStocks.some(star => star.code === '300063' && star.level === 'expected'),
  '确认明星与预期明星轨迹同时保留');
A(restored.mainlinesBySource.eastmoney.reserveMainlines.length === 0,
  '同花顺候选不串入东财来源');
A(restored.reserveMainlines.some(row => row.theme === 'AI视频' && row.source === 'ths'),
  '顶层兼容预备列表同步包含来源标记');
A(!restored.mainlinesBySource.ths.reserveMainlines.some(row => row.theme === '普通'),
  '仅 active、从未成为预期/确认明星的候选不恢复');

const currentPayload = {
  ...payload,
  mainlinesBySource: {
    ...payload.mainlinesBySource,
    ths: {
      ...emptySource('ths'),
      reserveMainlines: [{
        key: 'theme:AI视频',
        familyKey: 'theme:AI视频',
        theme: 'AI视频',
        l2VerificationStatus: 'unscanned',
        starStocks: [{ code: '300418', name: '昆仑万维', level: 'active' }],
      }],
    },
  },
};
const merged = strategyMainlineRestoreIntradayStickyPrediction(currentPayload, predict);
const mergedAi = merged.mainlinesBySource.ths.reserveMainlines[0];
A(mergedAi.starStocks.some(star => star.code === '300418' && star.level === 'confirmed')
  && mergedAi.l2VerificationStatus === 'qi',
  '候选重新出现时，当前行保留且同日已确认事实不会被 active 降级覆盖');

const rejected = strategyMainlineRestoreIntradayStickyPrediction(payload, predict, {
  attributionByCode: new Map([['300418', 'reject'], ['300063', 'reject']]),
});
A(rejected.mainlinesBySource.ths.reserveMainlines.length === 0,
  '当前/历史主因明确冲突时，粘性候选仍经过归属过滤，不能错挂');

const frozen = strategyMainlineRestoreIntradayStickyPrediction({ ...payload, frozen: true }, predict);
A(frozen.mainlinesBySource.ths.reserveMainlines.length === 0,
  '冻结历史载荷不走盘中候选粘性恢复');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL INTRADAY STICKY CANDIDATE CHECKS PASSED');
