// Regression test for review source health stats.
// Verifies that sourceStats is rebuilt from all source tabs with rows, even when
// the stored evidence payload already contains a partial sourceStats list.
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0;
  let i = bodyBrace;
  for (; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(m.index, i + 1);
}

const stubs = `
function isDisabledReviewSource() { return false; }
function isExcludedFromReview(code, name) { return /^(8|4|920)/.test(String(code || '')) || /ST|退/.test(String(name || '')); }
function normalizeReasonSourceCode(code) { return String(code || '').trim(); }
function reviewSourceGroup(value) {
  const s = String(value || '').toLowerCase();
  if (s.includes('jiuyangongshe')) return 'jiuyangongshe';
  if (s.includes('kaipanla') || s.includes('fupanla')) return 'kaipanla';
  if (s.includes('xuangubao')) return 'xuangubao';
  if (s.includes('tgb')) return 'tgb';
  return s;
}
function limitUpMainReasonSourceViewTopics() { return []; }
`;

eval(stubs + extractFn('recomputeReviewSourceStatsFromTabs'));

const A = (cond, msg) => {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exitCode = 1;
  } else {
    console.log('ok: ' + msg);
  }
};

const row = (code, name, boardTopic = '算力', detailReason = '服务器') => ({
  code,
  name,
  boardTopic,
  primaryRawTopic: boardTopic,
  detailReason,
  reasonText: `${boardTopic}: ${detailReason}`,
  confidence: 0.99,
  reasonQuality: 'clear',
});

const payload = {
  tabs: [
    { key: 'final', rows: [row('600001', '甲'), row('600002', '乙')] },
    { key: 'kaipanla', rows: [row('600001', '甲'), row('600002', '乙')] },
    { key: 'xuangubao', rows: [row('600001', '甲'), row('600002', '乙')] },
    { key: 'jiuyangongshe', rows: [row('600001', '甲'), row('600002', '乙')] },
    { key: 'tgb', rows: [] },
  ],
  sourceStats: [
    { group: 'kaipanla', source: 'review/kaipanla-fupanla', stockCount: 2 },
    { group: 'xuangubao', source: 'review/xuangubao-limit-up', stockCount: 2 },
  ],
  sourceErrors: [
    { source: 'review/jiuyangongshe-structured', error: 'stale missing error' },
    { source: 'review/tgb-hunan-structured', error: 'not uploaded yet' },
  ],
};

recomputeReviewSourceStatsFromTabs(payload);

const stats = new Map(payload.sourceStats.map(stat => [stat.group, stat]));
A(stats.has('kaipanla'), 'keeps existing Kaipanla stats');
A(stats.has('xuangubao'), 'keeps existing Xuangubao stats');
A(stats.has('jiuyangongshe'), 'adds Jiuyangongshe stats from non-empty tab');
A(!stats.has('tgb'), 'does not add empty TGB tab');
A(stats.get('jiuyangongshe').stockCount === 2 && stats.get('jiuyangongshe').rowCount === 2, 'Jiuyangongshe count is recomputed from tab rows');
A(stats.get('jiuyangongshe').coveragePct === 100, 'Jiuyangongshe coverage uses final tab total');
A(!payload.sourceErrors.some(error => String(error.source || '').includes('jiuyangongshe')), 'removes stale source error once tab has data');
A(payload.sourceErrors.some(error => String(error.source || '').includes('tgb')), 'keeps TGB source error while tab is empty');

console.log(process.exitCode ? 'SOME REVIEW SOURCE HEALTH CHECKS FAILED' : 'ALL REVIEW SOURCE HEALTH CHECKS PASSED');
