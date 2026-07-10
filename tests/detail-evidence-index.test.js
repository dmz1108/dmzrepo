// P1-A 细分证据索引库测试(node tests/detail-evidence-index.test.js)
// 从 kpl-stats-server.js 抽取真实函数,以假四源数据验证:
// 拆词与保粒度归一、索引聚合、别名候选/人工词典、端点行为、自动任务成功才标记。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bodyBrace = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bodyBrace;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(m.index, i + 1);
}

const files = {};
let aliasDictContent = null;
let sourceViewByDay = {};
let sent = null;
let adminOk = true;

const stubs = `
const path = require('path');
const PRIMARY_TOPIC_CLUSTERS = [['大类词', '细分词甲', '细分词乙']];
function canonicalTopicName(name) {
  const raw = String(name || '').trim();
  if (!raw) return '';
  const simplified = raw.replace(/概念$/u, '').trim();
  for (const cluster of PRIMARY_TOPIC_CLUSTERS) {
    if (cluster.some(alias => raw === alias || raw.includes(alias) || alias.includes(raw))) return cluster[0];
  }
  return simplified || raw;
}
const STRATEGY_MAINLINE_DATA_DIR = '/fake/strategy-data';
const DETAIL_EVIDENCE_INDEX_DAYS = 30;
const DETAIL_EVIDENCE_MAX_WORDS = 2000;
const DETAIL_EVIDENCE_ALIAS_DICT_PATH = '/fake/strategy-data/detail-evidence-alias.json';
const fs = {
  mkdir: async () => {},
  readFile: async (p) => {
    if (p === DETAIL_EVIDENCE_ALIAS_DICT_PATH) { if (aliasDictContent == null) throw new Error('ENOENT'); return aliasDictContent; }
    if (files[p] === undefined) throw new Error('ENOENT');
    return files[p];
  },
  writeFile: async (p, content) => { files[p] = content; },
};
const isoFromCompactDate = d => String(d || '');
const normalizeReasonSourceCode = c => String(c || '').trim();
async function readSavedApiKey() { return 'k'; }
async function getRecentTradingDays(day, key, n) {
  const all = ['2026-07-08', '2026-07-09', '2026-07-10'];
  return all.filter(d => d <= day).slice(-n);
}
async function buildDaySourceViewWithConsensus(day) { return { payload: { tabs: sourceViewByDay[day] || [] } }; }
function chinaNowParts() { return { day: '2026-07-10', hour: 17 }; }
function isChinaMarketTradingDay() { return true; }
function requireAdmin(req, res) { return adminOk; }
function send(res, code, payload) { sent = { code, payload }; }
`;

const code = stubs
  + extractFn('detailEvidenceSplitTerms') + '\n'
  + extractFn('detailEvidenceNormalizeTerm') + '\n'
  + extractFn('readDetailEvidenceAliasDict') + '\n'
  + extractFn('readDetailEvidenceIndex') + '\n'
  + 'function detailEvidenceIndexPath(day) { return "/fake/strategy-data/detail-evidence-index-" + day + ".json"; }\n'
  + extractFn('buildDetailEvidenceIndex') + '\n'
  + extractFn('getDetailEvidenceIndexApi');
eval(code);

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

(async () => {
  // 1. 拆词与保粒度归一
  A(JSON.stringify(detailEvidenceSplitTerms('词B+涨价预期')) === JSON.stringify(['词B', '涨价预期']), '按 + 拆词');
  A(JSON.stringify(detailEvidenceSplitTerms('词C概念')) === JSON.stringify(['词C']), '去概念后缀');
  A(detailEvidenceSplitTerms('5% / 涨').length === 0, '纯数字与单字滤除');
  A(detailEvidenceNormalizeTerm('细分词甲') === '细分词甲', '归一保留原始细分词,不压成大类');

  // 2. 索引构建:两天、两真实源 + final
  const row = (code2, name, boardTopic, detailReason) => ({ code: code2, name, boardTopic, detailReason });
  sourceViewByDay = {
    '2026-07-09': [
      { key: 'tgb', rows: [row('600001', '甲', '大类词', '细分词甲'), row('600002', '乙', '大类词', '细分词甲')] },
      { key: 'xuangubao', rows: [row('600001', '甲', '大类词', '细分词乙')] },
      { key: 'final', rows: [row('600001', '甲', '大类词', '细分词甲')] },
    ],
    '2026-07-10': [
      { key: 'tgb', rows: [row('600003', '丙', '大类词', '细分词甲'), row('600001', '甲', '大类词', '细分词甲')] },
      { key: 'xuangubao', rows: [row('600001', '甲', '大类词', '细分词乙')] },
      { key: 'final', rows: [row('600003', '丙', '大类词', '')] },
    ],
  };
  const idx = await buildDetailEvidenceIndex('2026-07-10', { days: 30 });
  A(idx.ok && idx.windowDays === 3, '索引构建成功(3个交易日窗口)');
  const wJ = idx.words.find(w => w.word === '细分词甲');
  A(!!wJ, '细分词以原词入索引,未塌缩为大类');
  A(wJ.broadTopic === '大类词', 'broadTopic 附注大类归属,不替换 word');
  const wY = idx.words.find(w => w.word === '细分词乙');
  A(!!wY && wY.broadTopic === '大类词', '同族另一细分词独立成词条');
  A(wJ.sourceCount === 1, 'sourceCount 只计真实源(细分词甲只来自tgb+final=1)');
  A(wJ.firstDay === '2026-07-09' && wJ.lastDay === '2026-07-10' && wJ.dayCount === 2, '首末出现日');
  A(JSON.stringify(wJ.stocksByDay['2026-07-09']) === JSON.stringify(['600001', '600002']), '按日股票集合');
  A(wJ.stockCount === 3, '窗口去重股票数=3');
  const wBig = idx.words.find(w => w.word === '大类词');
  A(!!wBig && wBig.kinds.includes('board') && wBig.broadTopic === '', '大主题同样入索引(kind=board),broad 与 word 相同时留空');
  const cand = idx.aliasCandidates.find(c => (c.a === '细分词甲' && c.b === '细分词乙') || (c.a === '细分词乙' && c.b === '细分词甲'));
  A(!!cand && cand.count === 2 && cand.stockCount === 1, '别名自动候选(同股同日不同源,两日=count2)');

  // 3. 人工词典:confirm 合并,veto 排除候选
  aliasDictContent = JSON.stringify({ confirm: [['细分词甲', '细分词乙']], veto: [] });
  const idx2 = await buildDetailEvidenceIndex('2026-07-10', { days: 30 });
  A(!idx2.words.find(w => w.word === '细分词乙'), 'confirm 后别名并入规范词');
  A(idx2.words.find(w => w.word === '细分词甲').sourceCount === 2, '并入后 sourceCount=2(细分多源共识)');
  aliasDictContent = JSON.stringify({ confirm: [], veto: [['细分词甲', '细分词乙']] });
  const idx3 = await buildDetailEvidenceIndex('2026-07-10', { days: 30 });
  A(!idx3.aliasCandidates.find(c => c.a === '细分词甲' || c.b === '细分词甲'), 'veto 对不再出现在候选');

  // 4. 端点行为
  aliasDictContent = null;
  await buildDetailEvidenceIndex('2026-07-10', { days: 30 });
  const urlOf = (q) => ({ pathname: '/api/detail-evidence-index', searchParams: new URLSearchParams(q) });
  await getDetailEvidenceIndexApi(urlOf({ day: '2026-07-10' }), {}, {});
  A(sent.payload.ok && sent.payload.words.length >= 2 && sent.payload.words[0].stocksByDay === undefined, '摘要模式不带 stocksByDay');
  await getDetailEvidenceIndexApi(urlOf({ day: '2026-07-10', word: '细分词甲' }), {}, {});
  A(sent.payload.matches.length >= 1 && sent.payload.matches[0].stocksByDay, 'word 查询带按日股票集合');
  A(sent.payload.matches.some(w => w.word === '细分词甲'), '查询词不做大类归一,精确命中原词');
  await getDetailEvidenceIndexApi(urlOf({ day: '2026-07-10', word: '大类词' }), {}, {});
  A(sent.payload.matches.some(w => w.broadTopic === '大类词'), '按大类查询可经 broadTopic 补充命中细分词');
  await getDetailEvidenceIndexApi(urlOf({ day: '2026-07-11' }), {}, {});
  A(sent.payload.indexDay === '2026-07-10' && sent.payload.requestedDay === '2026-07-11', '当日无索引回退最近一份并标注 indexDay,不冒充当日');
  adminOk = false;
  sent = null;
  await getDetailEvidenceIndexApi(urlOf({ day: '2026-07-10', rebuild: '1' }), {}, {});
  A(sent === null, 'rebuild=1 未过管理员校验时直接被拦截');

  // 5. 自动任务:成功生成有效索引后才标记当天完成
  const autoSrc = extractFn('runAutoDetailEvidenceIndexIfDue');
  const makeAuto = (buildImpl) => {
    let markedDay = '';
    let lastTryMs = 0;
    const wrapped = autoSrc
      .replace(/autoDetailEvidenceIndexDay/g, 'markedDay')
      .replace(/autoDetailEvidenceIndexLastTryMs/g, 'lastTryMs');
    let runAuto;
    eval('runAuto = ' + wrapped.replace('async function runAutoDetailEvidenceIndexIfDue', 'async function')
      .replace(/buildDetailEvidenceIndex\(/g, 'buildImpl('));
    return { run: runAuto, day: () => markedDay, resetTry: () => { lastTryMs = 0; } };
  };
  const failAuto = makeAuto(async () => { throw new Error('boom'); });
  await failAuto.run();
  A(failAuto.day() === '', '构建抛错:当天不标记完成(可重试)');
  const emptyAuto = makeAuto(async () => ({ ok: true, wordCount: 0 }));
  await emptyAuto.run();
  A(emptyAuto.day() === '', '空索引:当天不标记完成(可重试)');
  const okAuto = makeAuto(async () => ({ ok: true, wordCount: 5 }));
  await okAuto.run();
  A(okAuto.day() === '2026-07-10', '有效索引:成功后才标记当天完成');
  const spacedAuto = makeAuto(async () => { spacedAuto.calls = (spacedAuto.calls || 0) + 1; throw new Error('boom'); });
  await spacedAuto.run();
  await spacedAuto.run();
  A(spacedAuto.calls === 1, '失败后 10 分钟内不重复重跑(重试间隔生效)');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL DETAIL-EVIDENCE-INDEX CHECKS PASSED');
})();
