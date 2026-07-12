// P1-C 预测记录扩展测试(node tests/predict-records.test.js)
// P1-C 功能测试:从源文件抽出 strategyPredictCandidateRecord + writeMainlinePredict,
// 用假数据验证:top 结构不变、candidates 全量记录、收盘后不覆盖、上限 12。
const fsReal = require('fs');
const src = fsReal.readFileSync(require('path').join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error(`not found: ${name}`);
  const start = m.index;
  const bodyBrace = src.indexOf('{', src.indexOf(')', start));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 1);
}

const written = {};
let existingPredict = null;
const stubs = `
const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '' && v !== undefined;
const STRATEGY_MAINLINE_DATA_DIR = '/fake';
const strategyMainlinePredictPath = d => '/fake/mainline-predict-' + d + '.json';
const fs = {
  mkdir: async () => {},
  writeFile: async (p, content) => { written[p] = JSON.parse(content); },
};
async function readMainlinePredict(day) { return existingPredict; }
`;
const code = stubs + extractFn('strategyPredictCandidateRecord') + '\n' + extractFn('writeMainlinePredict');
eval(code);

const fullMainline = {
  familyKey: 'fam-a', key: 'k-a', theme: '示例主线A', mergedThemes: ['细分1', '细分2'],
  rank: 1, score: 88.5, predictScore: 61.2,
  stage: { label: '发酵期' }, certainty: { label: '较高' }, isNewTheme: false,
  netInflow: 12.3e8, boardCount: 3, count: 5, bigGainCount: 9, nearLimitCount: 4,
  leaderBasisMode: 'pool-rank', leaderNote: '',
  mainLeader: { code: '600001', name: '龙一' },
  leaders: [
    { code: '600001', name: '龙一', gain: 10.0, leadScore: 92.1, basis: ['10日3板', '主因2次·最近今日'], todayLimit: true, lianban: 2, zt10Count: 3, mainZt10Count: 2, gain10: 21.5, gain30: 30.2, star: { level: 'confirmed', ratios: {} } },
    { code: '600002', name: '龙二', gain: 6.2, leadScore: 71.0, basis: ['10日2板'], todayLimit: false, lianban: 0, zt10Count: 2, mainZt10Count: 1, gain10: 11.1, gain30: null },
  ],
  starStocks: [ { code: '600003', name: '星一', gain: 9.9, level: 'confirmed', label: '明星确认' } ],
  focusStocks: [ { code: '600004', name: '潜力一', gain: 5.5, basis: ['盘中+5.5%', '冲板储备'] } ],
  todayCodes: ['600001', '600005'],
};
const minimalMainline = { key: 'k-b', theme: '示例主线B', rank: 2 };
const manyMainlines = [fullMainline, minimalMainline];
for (let i = 0; i < 15; i++) manyMainlines.push({ key: 'k-x' + i, theme: '填充' + i, rank: 3 + i });

(async () => {
  const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

  // 1. 盘中写入:top 结构不变 + candidates 全量
  await writeMainlinePredict('2026-07-10', '早盘', manyMainlines, { key: 'fam-a' });
  const out = written['/fake/mainline-predict-2026-07-10.json'];
  A(out && Array.isArray(out.top) && out.top.length === 3, 'top 仍为前3');
  A(JSON.stringify(Object.keys(out.top[0]).sort()) === JSON.stringify(['certainty','key','leader','predictScore','rank','score','stage','star','theme'].sort()), 'top 元素字段与旧版完全一致');
  A(out.top[0].leader.code === '600001' && out.top[0].star.code === '600003', 'top 龙头/明星取值不变');
  A(out.confirmedKey === 'fam-a', 'confirmedKey 不变');
  A(out.schemaVersion === 2, 'schemaVersion=2');
  A(Array.isArray(out.candidates) && out.candidates.length === 12, 'candidates 上限 12(输入17条)');
  const c0 = out.candidates[0];
  A(c0.familyKey === 'fam-a' && c0.theme === '示例主线A', 'candidate 基本字段');
  A(c0.leaders.length === 2 && c0.leaders[0].leadScore === 92.1 && c0.leaders[0].basis.length === 2, 'candidate 龙头1-3含打分与依据');
  A(c0.leaders[0].mainZt10Count === 2 && c0.leaders[1].gain30 === null, '龙头指标字段与空值处理');
  A(c0.stars.length === 1 && c0.stars[0].level === 'confirmed', 'candidate 明星');
  A(c0.focusStocks.length === 1 && c0.focusStocks[0].basis.length === 2, 'candidate 潜力股');
  A(JSON.stringify(c0.todayLimitCodes) === JSON.stringify(['600001','600005']), '当日贡献股票');
  A(c0.lowConfidence === null, '低置信占位为 null(通道未上线)');
  A(c0.limitUpCount === 5 && c0.bigGainCount === 9 && c0.nearLimitCount === 4, '盘面上下文信号');
  const c1 = out.candidates[1];
  A(c1.theme === '示例主线B' && c1.leaders.length === 0 && c1.stars.length === 0, '最小主线不报错、空数组');

  // 1b. 预测时点的明星等级随记录落盘(PR#25 复审:回看封板验证只统计 expected)
  A(out.top[0].star.level === 'confirmed', '明星 level 落盘(预测时点等级)');
  await writeMainlinePredict('2026-07-12', '午后', [{ key: 'k-c', theme: '旧式', rank: 1,
    mainLeader: { code: '600001', name: 'L' }, starStocks: [{ code: '600009', name: '无级星' }] }], null);
  A(written['/fake/mainline-predict-2026-07-12.json'].top[0].star.level === null, '明星无 level 的旧形态 → level=null(等级未知)');

  // 2. 收盘后已有记录不覆盖
  existingPredict = out;
  delete written['/fake/mainline-predict-2026-07-10.json'];
  await writeMainlinePredict('2026-07-10', '已收盘', manyMainlines, null);
  A(!written['/fake/mainline-predict-2026-07-10.json'], '收盘后不覆盖既有预判');

  // 2b. 收盘后无既有记录也不首次创建(PR#25 复审:盘后答案不得冒充盘中预测——7-08 已收盘文件的成因)
  existingPredict = null;
  await writeMainlinePredict('2026-07-13', '已收盘', manyMainlines, null);
  A(!written['/fake/mainline-predict-2026-07-13.json'], '收盘后不首次创建预测文件(不只是不覆盖)');

  // 3. 无主线不写
  existingPredict = null;
  await writeMainlinePredict('2026-07-11', '早盘', [], null);
  A(!written['/fake/mainline-predict-2026-07-11.json'], '空主线不写文件');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL P1-C CHECKS PASSED');
})();
