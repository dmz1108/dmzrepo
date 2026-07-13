// 明星股三层判定测试(node tests/star-l2-layers.test.js)
// 验证:最大可统计档映射(股价×申报上限)、第三层档位纳入先决、第二层预期明星(2/3>1.8 + 3亿)、封板取最大档。
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
function extractConstLine(name) {
  const m = src.match(new RegExp(`const ${name} = [^;]+;`));
  if (!m) throw new Error('const not found: ' + name);
  return m[0];
}

const numOrNull = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);
const limitUpThreshold = (code) => /^(30|68)/.test(String(code || '')) ? 20 : 10;

const code = [
  extractConstLine('STRATEGY_MAINLINE_STAR_BUCKETS'),
  extractConstLine('STRATEGY_MAINLINE_STAR_PRE_RATIO'),
  extractConstLine('STRATEGY_MAINLINE_STAR_SEAL_RATIO'),
  extractConstLine('STRATEGY_MAINLINE_BIG_GAIN_PCT'),
  extractConstLine('STRATEGY_MAINLINE_ALL_BUCKETS'),
  extractConstLine('STRATEGY_MAINLINE_STAR_MAX_PRE_RATIO'),
  extractConstLine('STRATEGY_MAINLINE_STAR_MAX_BUY_MIN'),
  extractFn('strategyMainlineBucketRatios'),
  extractFn('strategyMainlinePerOrderShareCap'),
  extractFn('strategyMainlineMaxObservableBucket'),
  extractFn('strategyMainlineStarStatus'),
].join('\n');
eval(code);

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
// 构造某档数据:主买/主卖/被买/被卖(单位:元)
const th = (ab, as, pb, ps) => ({ activeBuy: ab, activeSell: as, passiveBuy: pb, passiveSell: ps });
// 各档全部达标的基础盘(比值 2.0/1.6)
const goodBucket = () => th(2.0e8, 1.0e8, 1.6e8, 1.0e8);

// 1. 申报上限与最大档映射
A(strategyMainlinePerOrderShareCap('600001') === 1000000, '主板单笔上限100万股');
A(strategyMainlinePerOrderShareCap('300123') === 300000, '创业板单笔上限30万股');
A(strategyMainlinePerOrderShareCap('688001') === 100000, '科创板单笔上限10万股');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 3 }) === 3000000, '3元主板股→最大档300w(Owner案例)');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 5 }) === 5000000, '5元→500w(Owner案例)');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 10 }) === 10000000, '10元→1000w(Owner案例)');
A(strategyMainlineMaxObservableBucket({ code: '300123', price: 20 }) === 5000000, '创业板20元→600万→500w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 0.4 }) === 500000, '极低价保底50w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', thresholds: { '500000': goodBucket(), '8000000': goodBucket() } }) === 8000000, '无股价时按有数据的最高档回推');
A(strategyMainlineMaxObservableBucket({ code: '600001' }) === null, '无股价无数据返回null');

// 2. 第三层:最大可统计档纳入先决条件
const rowL3 = {
  code: '600001', price: 10, gainPct: 7,
  thresholds: { '500000': goodBucket(), '3000000': goodBucket(), '8000000': goodBucket(),
    '10000000': th(2.0e8, 1.0e8, 1.2e8, 1.0e8) },  // 1000w档被动比1.2<1.5
};
A(strategyMainlineStarStatus(rowL3) === null, '10元股的1000w档不达标→整体不过先决(第三层生效)');

// 3. 第二层:预期明星(涨停前 2/3>1.8 + 最大档主动买>=3亿)
const rowExpected = {
  code: '600001', price: 10, gainPct: 7,
  thresholds: { '500000': goodBucket(), '3000000': goodBucket(), '8000000': goodBucket(),
    '10000000': th(3.5e8, 1.8e8, 1.9e8, 1.0e8) },  // 主动比1.94/被动比1.9/合力比1.93 均>1.8;主动买3.5亿
};
const sExpected = strategyMainlineStarStatus(rowExpected);
A(sExpected?.level === 'expected' && sExpected.label === '预期明星', '预期明星:最大档三比值2/3>1.8且主动买>=3亿');
A(sExpected.maxBucket?.amount === 10000000 && sExpected.maxBucket.activeBuy === 3.5e8, 'maxBucket 观测信息(档位+主动买累计)');

// 4. 主动买不足3亿→只算资金活跃
const rowActive = { ...rowExpected, thresholds: { ...rowExpected.thresholds, '10000000': th(2.0e8, 1.0e8, 1.9e8, 1.0e8) } };
A(strategyMainlineStarStatus(rowActive)?.level === 'active', '比值达标但主动买<3亿→资金活跃,不算预期明星');

// 5. 比值不足(仅1个>1.8)→资金活跃
const rowWeakMax = { ...rowExpected, thresholds: { ...rowExpected.thresholds, '10000000': th(3.5e8, 1.9e8, 1.5e8, 1.0e8) } };
// 主动比1.84>1.8;被动比1.5;合力比(5.0/2.9)=1.72 → 只1个>1.8
A(strategyMainlineStarStatus(rowWeakMax)?.level === 'active', '最大档仅1比值>1.8→资金活跃');

// 6. 封板口径取最大档
const sealedStrongMax = {
  code: '600001', price: 10, gainPct: 10,
  thresholds: { '500000': th(1.6e8, 1.0e8, 1.6e8, 1.0e8),   // 最小档比值弱(1.6)
    '3000000': goodBucket(), '8000000': goodBucket(),
    '10000000': th(4.2e8, 2.0e8, 2.2e8, 1.0e8) },            // 最大档 2.1/2.2/(6.4/3.0=2.13) 3项>=2
};
A(strategyMainlineStarStatus(sealedStrongMax)?.level === 'confirmed', '封板判定取最大档比值(最小档弱不影响)');
const sealedWeakMax = { ...sealedStrongMax, thresholds: { ...sealedStrongMax.thresholds, '10000000': th(2.0e8, 1.0e8, 1.2e8, 1.0e8) } };
// 最大档:主动2.0✓ 被动1.2✗ 合力(3.2/2.0)=1.6✗ → 1项>=2
A(strategyMainlineStarStatus(sealedWeakMax)?.level === 'sealedWeak', '最大档比值不足→涨停但未确认');

// 7. 低价股:最大档=300w,同样能出预期明星
const row3yuan = {
  code: '600002', price: 3, gainPct: 8,
  thresholds: { '500000': goodBucket(), '3000000': th(3.2e8, 1.6e8, 2.0e8, 1.05e8) },  // 300w档:2.0/1.9/(5.2/2.65=1.96) 且主动买3.2亿
};
const s3 = strategyMainlineStarStatus(row3yuan);
A(s3?.level === 'expected' && s3.maxBucket.amount === 3000000, '3元股按自己的最大档(300w)判定预期明星');

// 8. Owner 澄清:最大档字段存在但为空/零 = 条件不成立,绝不回退小档
const sealedEmptyMax = {
  code: '600001', price: 10, gainPct: 10,
  thresholds: { '500000': th(4e8, 1.5e8, 3e8, 1.2e8), '3000000': th(4e8, 1.5e8, 3e8, 1.2e8),
    '8000000': th(4e8, 1.5e8, 3e8, 1.2e8), '10000000': th(0, 0, 0, 0) },   // 最大档字段在、数据为零
};
const sEmpty = strategyMainlineStarStatus(sealedEmptyMax);
A(sEmpty?.level === 'sealedWeak' && sEmpty.label === '涨停但最大档无大单', '封板:最大档字段在但无大单→不是明星,不回退小档');
A(sEmpty.maxBucket.empty === true && sEmpty.maxBucket.dataMissing === false, 'empty 标志正确');

const preEmptyMax = { ...sealedEmptyMax, gainPct: 7 };
A(strategyMainlineStarStatus(preEmptyMax) === null, '涨停前:最大档无大单→连资金活跃也不给');

// 9. 最大档字段缺失(worker 未采集)= 数据不完整,退回旧行为并打标
const sealedMissingMax = {
  code: '600001', price: 10, gainPct: 10,
  thresholds: { '500000': th(4e8, 1.5e8, 3e8, 1.2e8), '3000000': th(4e8, 1.5e8, 3e8, 1.2e8),
    '8000000': th(4e8, 1.5e8, 3e8, 1.2e8) },   // 无 10000000 字段
};
const sMissing = strategyMainlineStarStatus(sealedMissingMax);
A(sMissing?.level === 'confirmed' && sMissing.maxBucket.dataMissing === true, '封板:最大档字段缺失→按旧行为判定并打 dataMissing 标');
const preMissingMax = { ...sealedMissingMax, gainPct: 7 };
const sPreMissing = strategyMainlineStarStatus(preMissingMax);
A(sPreMissing?.level === 'active' && sPreMissing.maxBucket.dataMissing === true, '涨停前:字段缺失→可判资金活跃但不可能预期明星,带标');

// 10. 跨来源任务挂载:KPL 创新药扫描可挂回东财医药卡片,后一次空任务不遮蔽有效结果。
const normalizeReasonSourceCode = value => String(value || '').replace(/\D/g, '').slice(0, 6);
const strategyMainlineFamilyInfo = item => ({
  key: /医药|创新药|中药/.test(String(item?.theme || '')) ? 'group:医药' : `theme:${String(item?.theme || '')}`,
});
const successfulCrossSourceJob = {
  jobId: 'auto-good', plateId: '308014', boardName: '创新药', familyKey: 'group:医药',
  day: '2026-07-13', status: 'done', createdAt: '2026-07-13T02:35:10.000Z',
  results: [{ ...rowExpected, code: '600001', name: '跨源明星' }],
};
const emptyNewerJob = {
  jobId: 'manual-empty', plateId: '308014', boardName: '创新药', familyKey: '',
  day: '2026-07-13', status: 'done', createdAt: '2026-07-13T04:42:29.000Z', results: [],
};
const unrelatedJob = {
  jobId: 'unrelated', plateId: 'BK_OTHER', boardName: '机器人', familyKey: 'group:机器人',
  day: '2026-07-13', status: 'done', createdAt: '2026-07-13T03:00:00.000Z',
  results: [{ ...rowExpected, code: '600002', name: '无关明星' }],
};
const localL2TaskQueue = {
  listDay: () => [emptyNewerJob, unrelatedJob, successfulCrossSourceJob],
};
eval(extractFn('strategyMainlineCollectStars'));
const crossSourceStars = strategyMainlineCollectStars(
  [{ plateId: 'BK0615', name: '中药概念' }],
  '2026-07-13',
  { familyKey: 'group:医药' }
);
A(crossSourceStars.byCode.get('600001')?.level === 'expected', '同一主线家族跨板块ID仍消费有效L2结果');
A(!crossSourceStars.byCode.has('600002'), '不同主线家族的扫描结果不会错挂');
A(crossSourceStars.completedPlates.has('308014'), '后一次空任务不遮蔽同板块较早的有效完成任务');

// 11. 前端管理员证据(静态断言 + 内联脚本编译)
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
A(html.includes('function starMaxBucketAdminInfo(s)') && html.includes("if (!state.adminLoggedIn || !s || !s.maxBucket) return ''"), '管理员证据函数存在且非管理员返回空串');
A((html.match(/starMaxBucketAdminInfo\(s\)/g) || []).length >= 2, '两处明星 tooltip 均拼接管理员证据');
A(html.includes('最大档字段在但无大单:非明星') && html.includes('最大档字段缺失:需检查worker采集'), 'empty/dataMissing 两种状态文案齐备');
A(html.includes('id="strategy-l2-history"') && html.includes('function loadStrategyL2History(day)'), '管理员策略页包含每日L2扫描记录入口');
A(html.includes("if (!canUseL2AdminTools()) return ''") && html.includes('管理员可见 · 同板块优先展示最近一次有效结果'), 'L2任务明细只在管理员工具权限下渲染');
A(html.includes('function strategyL2HistoryBucket(label, bucket)')
  && html.includes("moneyPair('主动', b.activeBuy, b.activeSell")
  && html.includes("moneyPair('被动', b.passiveBuy, b.passiveSell")
  && html.includes('主动按单笔成交统计；被动按同一挂单订单号累计统计'), 'L2任务明细展示五档主动/被动买卖金额与统计口径');
const backend = fsReal.readFileSync(pathReal.join(__dirname, '..', 'strategy-backend.js'), 'utf8');
A(backend.includes("url.searchParams.get('history') === '1'") && backend.includes("if (!adminViewer) { sendJson(res, 403, { error: 'admin required' })"), 'L2历史接口有管理员门控');
let htmlCompiled = true;
for (const m2 of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try { new Function(m2[1]); } catch (e) { htmlCompiled = false; console.error('inline compile failed:', e.message); }
}
A(htmlCompiled, '前端内联脚本仍可编译');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STAR-L2-LAYERS CHECKS PASSED');
