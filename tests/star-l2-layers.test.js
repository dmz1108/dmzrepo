// 明星股判定测试(node tests/star-l2-layers.test.js)
// Owner 定稿 2026-07-15:单一最大档判据——该股最大可统计档 主动买 > 1.5亿 且 activeRatio(主动买/主动卖) > 1.65。
//   封板满足→明星确认(confirmed);未封大涨(≥5%)满足→预期明星(expected)。
//   不看 passiveRatio/supportRatio,不要求逐档(小档)先决;最大档无大单/数据缺失/现价缺失一律不确认。
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
  extractConstLine('STRATEGY_MAINLINE_BIG_GAIN_PCT'),
  extractConstLine('STRATEGY_MAINLINE_ALL_BUCKETS'),
  extractConstLine('STRATEGY_MAINLINE_STAR_MAX_BUY_MIN'),
  extractConstLine('STRATEGY_MAINLINE_STAR_MAX_ACTIVE_RATIO_MIN'),
  extractFn('strategyMainlineBucketRatios'),
  extractFn('strategyMainlinePerOrderShareCap'),
  extractFn('strategyMainlineMaxObservableBucket'),
  extractFn('strategyMainlineStarStatus'),
].join('\n');
eval(code);

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
// 某档数据:主买/主卖/被买/被卖(单位:元)
const th = (ab, as, pb, ps) => ({ activeBuy: ab, activeSell: as, passiveBuy: pb, passiveSell: ps });
// 强最大档:主动买 2亿 > 1.5亿,activeRatio = 2e8/1e8 = 2.0 > 1.65;被动买=0(故意让被动/合力差,证明不看它们)
const strongMax = () => th(2.0e8, 1.0e8, 0, 1.0e8);
// 弱小档:主动/被动比都很差(用于证明逐档先决已废除)
const weakSmall = () => th(1.0e6, 1.0e7, 1.0e6, 1.0e7);

// 1. 最大可统计档映射(逻辑未改,回归保护)
A(strategyMainlinePerOrderShareCap('600001') === 1000000, '主板单笔上限100万股');
A(strategyMainlinePerOrderShareCap('300123') === 300000, '创业板单笔上限30万股');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 3 }) === 3000000, '3元主板→300w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 10 }) === 10000000, '10元→1000w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 5 }) === 5000000, '5元→500w档');

// 2. 明星确认(封板 + 最大档达标)
const confirmed = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10, thresholds: { '10000000': strongMax() } });
A(confirmed && confirmed.level === 'confirmed', '封板+最大档主动买2亿/activeRatio2.0 → 明星确认');
A(confirmed.maxBucket.amount === 10000000 && confirmed.maxBucket.activeBuy === 2e8, '确认携带最大档档位与主动买金额');

// 3. 逐档先决已废除:小档很弱,但最大档达标 → 仍明星确认
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '3000000': weakSmall(), '10000000': strongMax() },
})?.level === 'confirmed', '小档弱但最大档达标 → 仍确认(逐档先决已废除)');

// 4. passive/support 不再参与:被动/合力比很差但 activeRatio 达标 → 仍确认
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '10000000': th(2.0e8, 1.0e8, 0, 5.0e8) },  // passiveRatio≈0,supportRatio<1
})?.level === 'confirmed', '被动/合力比很差但 activeRatio 达标 → 仍确认(不看被动/合力)');

// 5. 金额闸:主动买 ≤ 1.5亿 → sealedWeak
const belowAmt = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '10000000': th(1.4e8, 0.5e8, 0, 0.5e8) } });  // ratio 2.8 达标,金额 1.4亿<1.5亿
A(belowAmt?.level === 'sealedWeak' && /不足1\.5亿/.test(belowAmt.label), '主动买1.4亿(<1.5亿)→ sealedWeak 不足1.5亿');

// 6. 边界:主动买正好 1.5亿(需严格 >)→ 不达标
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '10000000': th(1.5e8, 0.5e8, 0, 0.5e8) } })?.level === 'sealedWeak', '主动买正好1.5亿(非严格大于)→ sealedWeak');

// 7. 比值闸:activeRatio ≤ 1.65 → sealedWeak
const belowRatio = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '10000000': th(2.0e8, 1.3e8, 0, 1.3e8) } });  // 金额2亿达标,ratio 1.538<1.65
A(belowRatio?.level === 'sealedWeak' && /1\.65/.test(belowRatio.label), 'activeRatio1.54(<1.65)→ sealedWeak 主动买卖比不足1.65');

// 8. 边界:activeRatio 1.66(>1.65)且金额达标 → 确认
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '10000000': th(1.66e8, 1.0e8, 0, 1.0e8) } })?.level === 'confirmed', 'activeRatio1.66(>1.65)且金额1.66亿达标 → 确认');

// 9. 最大档无大单 / 数据缺失 / 现价缺失
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': strongMax(), '10000000': th(0, 0, 0, 0) } })?.label === '涨停但最大档无大单', '最大档字段在但全0 → 无大单(小档有数据不回退)');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': strongMax(), '3000000': strongMax() } })?.label === '涨停但最大档数据缺失', '缺最大档字段 → 数据缺失(不用小档回退)');
A(strategyMainlineStarStatus({ code: '600001', gainPct: 10,
  thresholds: { '8000000': strongMax() } })?.label === '涨停但最大档现价缺失', '无股价 → 现价缺失');

// 10. 预期明星(未封 + 大涨≥5% + 最大档达标),含低价股按自身最大档
const expected = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '10000000': strongMax() } });
A(expected?.level === 'expected', '未封+涨6%+最大档达标 → 预期明星');
A(strategyMainlineStarStatus({ code: '600002', price: 3, gainPct: 8, thresholds: { '3000000': strongMax() } })?.maxBucket.amount === 3000000,
  '3元股按自身最大档(300w)判定');

// 11. 未封 + 大涨:金额/比值不足 → 资金活跃;无大单 → null;涨幅不足 → null
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '10000000': th(1.0e8, 0.5e8, 0, 0.5e8) } })?.level === 'active',
  '未封+涨6%+金额不足 → 资金活跃');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '10000000': th(2.0e8, 1.3e8, 0, 1.3e8) } })?.level === 'active',
  '未封+涨6%+比值不足 → 资金活跃');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '500000': strongMax(), '10000000': th(0, 0, 0, 0) } }) === null,
  '未封+大涨但最大档无大单 → null(小档有数据不回退)');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 3, thresholds: { '10000000': strongMax() } }) === null,
  '涨幅<5%且未封 → null');

// rowExpected:未封大涨 + 最大档达标 → 预期明星,供跨来源挂载测试复用
const rowExpected = { code: '600001', price: 12, gainPct: 7, thresholds: { '10000000': strongMax() } };
A(strategyMainlineStarStatus(rowExpected)?.level === 'expected', 'rowExpected 在新规则下仍为预期明星');

// 12. 跨来源任务挂载:KPL 创新药扫描可挂回东财医药卡片,后一次空任务不遮蔽有效结果。
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

// 13. 前端管理员证据(静态断言 + 内联脚本编译)
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
A(html.includes('function starMaxBucketAdminInfo(s)') && html.includes("if (!state.adminLoggedIn || !s || !s.maxBucket) return ''"), '管理员证据函数存在且非管理员返回空串');
A((html.match(/starMaxBucketAdminInfo\(s\)/g) || []).length >= 2, '两处明星 tooltip 均拼接管理员证据');
A(html.includes('最大档字段在但无大单:非明星') && html.includes('最大档字段缺失:需检查worker采集')
  && html.includes('现价缺失:无法确认该股允许最大档'), 'empty/dataMissing/priceMissing 三种状态文案齐备');
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
