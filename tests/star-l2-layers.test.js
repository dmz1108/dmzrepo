// 明星股判定测试(node tests/star-l2-layers.test.js)
// Owner 2026-07-20 修订:最大档主动买 > 1.5亿，且三项比值至少两项严格 >1.65:
//   最大档主动比、50万档主动比、最大档合力比。
//   封板满足→明星确认(confirmed);未封大涨(≥5%)满足→预期明星(expected)。
//   最大档无大单/数据缺失/现价缺失一律不确认。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const { isExcludedL2StockCode } = require(pathReal.join(__dirname, '..', 'local-l2-task-queue.js'));

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
  extractConstLine('STRATEGY_MAINLINE_STAR_RATIO_REQUIRED_COUNT'),
  extractFn('strategyMainlineBucketRatios'),
  extractFn('strategyMainlinePerOrderShareCap'),
  extractFn('strategyMainlineMaxObservableBucket'),
  extractFn('strategyMainlineStarStatus'),
].join('\n');
eval(code);

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
// 某档数据:主买/主卖/被买/被卖(单位:元)
const th = (ab, as, pb, ps) => ({ activeBuy: ab, activeSell: as, passiveBuy: pb, passiveSell: ps });
// 最大档仅主动比达标；合力比=1.0，不达标。
const maxActiveOnly = () => th(2.0e8, 1.0e8, 0, 1.0e8);
// 最大档主动比、合力比都达标。
const maxActiveAndSupport = () => th(2.0e8, 1.0e8, 2.0e8, 1.0e8);
// 最大档仅合力比达标：主动比=1.0，合力比=2.0。
const maxSupportOnly = () => th(2.0e8, 2.0e8, 4.0e8, 1.0e8);
// 50万档仅主动比达标。
const fiftyActiveOnly = () => th(2.0e8, 1.0e8, 0, 3.0e8);
const weakSmall = () => th(1.0e6, 1.0e7, 1.0e6, 1.0e7);

// 1. 最大可统计档映射(逻辑未改,回归保护)
A(strategyMainlinePerOrderShareCap('600001') === 1000000, '主板单笔上限100万股');
A(strategyMainlinePerOrderShareCap('300123') === 300000, '创业板单笔上限30万股');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 3 }) === 3000000, '3元主板→300w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 10 }) === 10000000, '10元→1000w档');
A(strategyMainlineMaxObservableBucket({ code: '600001', price: 5 }) === 5000000, '5元→500w档');

// 2. 明星确认：最大档主动比 + 50万档主动比两项达标。
const confirmed = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': maxActiveOnly() } });
A(confirmed && confirmed.level === 'confirmed', '封板+最大档主动比/50万档主动比达标 → 明星确认');
A(confirmed.maxBucket.amount === 10000000 && confirmed.maxBucket.activeBuy === 2e8, '确认携带最大档档位与主动买金额');
A(confirmed.maxBucket.ratioGate.passed === 2 && confirmed.maxBucket.ratioGate.required === 2, '确认携带2/3比值闸审计信息');

// 3. 三种两两组合均可通过。
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': maxActiveAndSupport() },
})?.level === 'confirmed', '最大档主动比+最大档合力比达标 → 确认');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': maxSupportOnly() },
})?.level === 'confirmed', '50万档主动比+最大档合力比达标 → 确认');
const inspur0944 = strategyMainlineStarStatus({ code: '000977', price: 85.14, gainPct: 10,
  thresholds: {
    '500000': th(1194282372, 892289923, 1048406343, 649899923),
    '10000000': th(238161245, 116359943, 402773831, 62765691),
  },
});
A(inspur0944?.level === 'confirmed'
  && inspur0944.maxBucket.ratioGate.passed === 2
  && inspur0944.maxBucket.ratioGate.checks.maxActive
  && !inspur0944.maxBucket.ratioGate.checks.fiftyActive
  && inspur0944.maxBucket.ratioGate.checks.maxSupport,
'浪潮信息09:44真实样本:最大档主动比+最大档合力比达标，按新规则仍为明星确认');

// 4. 金额闸仍是硬门槛：即使两项比值通过，主动买 ≤1.5亿仍不确认。
const belowAmt = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': th(1.4e8, 0.7e8, 1.4e8, 0.7e8) } });
A(belowAmt?.level === 'sealedWeak' && /不足1\.5亿/.test(belowAmt.label), '主动买1.4亿(<1.5亿)→ sealedWeak 不足1.5亿');

// 5. 金额边界：正好1.5亿仍不达标。
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': th(1.5e8, 0.75e8, 1.5e8, 0.75e8) } })?.level === 'sealedWeak', '主动买正好1.5亿(非严格大于)→ sealedWeak');

// 6. 只有一项比值达标不通过。
const onlyOneRatio = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': maxActiveOnly() } });
A(onlyOneRatio?.level === 'sealedWeak' && /1\/3项>1\.65/.test(onlyOneRatio.label), '仅最大档主动比达标 → sealedWeak 1/3');

// 7. 三项都使用严格 >1.65，等于1.65不算通过。
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': th(1.65e8, 1.0e8, 0, 1.0e8) },
})?.level === 'sealedWeak', '最大档主动比正好1.65不通过');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': th(1.65e8, 1.0e8, 0, 3.0e8), '10000000': maxActiveOnly() },
})?.level === 'sealedWeak', '50万档主动比正好1.65不通过');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': th(2.0e8, 1.0e8, 1.3e8, 1.0e8) },
})?.level === 'sealedWeak', '最大档合力比正好1.65不通过');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': weakSmall(), '10000000': th(1.66e8, 1.0e8, 1.66e8, 1.0e8) },
})?.level === 'confirmed', '最大档主动比和合力比1.66 → 确认');

// 8. 最大档无大单 / 数据缺失 / 现价缺失
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': th(0, 0, 0, 0) } })?.label === '涨停但最大档无大单', '最大档字段在但全0 → 无大单(小档有数据不回退)');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '3000000': maxActiveAndSupport() } })?.label === '涨停但最大档数据缺失', '缺最大档字段 → 数据缺失(不用小档回退)');
A(strategyMainlineStarStatus({ code: '600001', gainPct: 10,
  thresholds: { '500000': fiftyActiveOnly(), '8000000': maxActiveAndSupport() } })?.label === '涨停但最大档现价缺失', '无股价 → 现价缺失');

// 9. 预期明星使用同一套2/3比值闸，含低价股按自身最大档。
const expected = strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': maxActiveOnly() } });
A(expected?.level === 'expected', '未封+涨6%+最大档达标 → 预期明星');
A(strategyMainlineStarStatus({ code: '600002', price: 3, gainPct: 8,
  thresholds: { '500000': fiftyActiveOnly(), '3000000': maxActiveOnly() } })?.maxBucket.amount === 3000000,
  '3元股按自身最大档(300w)判定');

// 10. 未封 + 大涨:金额/比值不足 → 资金活跃;无大单 → null;涨幅不足 → null
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '10000000': th(1.0e8, 0.5e8, 0, 0.5e8) } })?.level === 'active',
  '未封+涨6%+金额不足 → 资金活跃');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '10000000': th(2.0e8, 1.3e8, 0, 1.3e8) } })?.level === 'active',
  '未封+涨6%+比值不足 → 资金活跃');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 6, thresholds: { '500000': fiftyActiveOnly(), '10000000': th(0, 0, 0, 0) } }) === null,
  '未封+大涨但最大档无大单 → null(小档有数据不回退)');
A(strategyMainlineStarStatus({ code: '600001', price: 12, gainPct: 3,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': maxActiveOnly() } }) === null,
  '涨幅<5%且未封 → null');

// rowExpected:未封大涨 + 最大档达标 → 预期明星,供跨来源挂载测试复用
const rowExpected = { code: '600001', price: 12, gainPct: 7,
  thresholds: { '500000': fiftyActiveOnly(), '10000000': maxActiveOnly() } };
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

// 13. 扫描覆盖率分母只计算 worker 实际允许扫描的股票。
eval(extractFn('strategyMainlineDeriveL2Status'));
const completeEligibleCoverage = {
  completedPlates: new Set(['BK0986']),
  pendingPlates: new Set(),
  completedCoveredCodes: new Set(['300149', '000566']),
};
A(strategyMainlineDeriveL2Status(
  completeEligibleCoverage,
  false,
  new Set(['300149', '000566', '688621', '688062'])
) === 'scanned-no-star', 'CAR-T 两只可扫描股票均覆盖时，科创板代码不再阻塞“已扫描无明星”');
A(strategyMainlineDeriveL2Status(
  { ...completeEligibleCoverage, completedCoveredCodes: new Set() },
  false,
  new Set(['688621', '688062'])
) === 'unscanned', '主题仅含 worker 排除代码时仍保持未扫描，不伪造完成');

// 14. 前端管理员证据(静态断言 + 内联脚本编译)
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
A(html.includes('function starMaxBucketAdminInfo(s)') && html.includes("if (!state.adminLoggedIn || !s || !s.maxBucket) return ''"), '管理员证据函数存在且非管理员返回空串');
A((html.match(/starMaxBucketAdminInfo\(s\)/g) || []).length >= 2, '两处明星 tooltip 均拼接管理员证据');
A(html.includes('最大档字段在但无大单:非明星') && html.includes('最大档字段缺失:需检查worker采集')
  && html.includes('现价缺失:无法确认该股允许最大档'), 'empty/dataMissing/priceMissing 三种状态文案齐备');
A(html.includes('id="strategy-l2-history"') && html.includes('function loadStrategyL2History(day)'), '管理员策略页包含每日L2扫描记录入口');
A(html.includes("if (!canUseL2AdminTools()) return ''") && html.includes('管理员可见 · 默认看最大档'), 'L2扫描记录只在管理员工具权限下渲染');
const l2HistoryRenderer = html.slice(html.indexOf('function renderStrategyL2History(data)'), html.indexOf('async function loadStrategyL2History(day)'));
A(l2HistoryRenderer.includes('job?.results')
  && l2HistoryRenderer.includes('strategyL2HistoryStarStatus(row)')
  && l2HistoryRenderer.includes('selectedRows.slice(0, 8)')
  && l2HistoryRenderer.includes('ml-l2-stock-list'), 'L2扫描记录从完整结果补入明星证据，不只依赖旧picked列表');
A(html.includes('const STRATEGY_L2_HISTORY_BUCKETS = [500000, 3000000, 5000000, 8000000, 10000000]')
  && html.includes('function strategyL2HistoryMaxBucket(row)')
  && html.includes('function strategyL2HistoryBucketRow(row, amount, maxAmount)'), 'L2扫描记录支持50万至1000万五档及个股最大档摘要');
A(html.includes('const fiftyBucket = strategyL2HistoryBucket(row, 500000)')
  && html.includes('ratioPassCount < 2')
  && html.includes('最大档主动比、50万档主动比、最大档合力比三项中至少两项严格>1.65'), '管理员L2历史判定和页面说明同步2/3比值闸');
A(html.includes('<details class="ml-l2-stock')
  && html.includes('点击查看该股全部L2档位')
  && html.includes('ml-l2-max-money')
  && html.includes('ml-l2-buckets'), 'L2个股默认显示最大档金额，点击展开全部档位');
A(html.includes("return { level: 'expected', label: '预期明星', maxBucket }")
  && html.includes('ml-l2-star ${star.level}')
  && html.includes('.ml-l2-stock.is-expected'), '预期明星在折叠状态优先入列并高亮');
const backend = fsReal.readFileSync(pathReal.join(__dirname, '..', 'strategy-backend.js'), 'utf8');
A(backend.includes("url.searchParams.get('history') === '1'") && backend.includes("if (!adminViewer) { sendJson(res, 403, { error: 'admin required' })"), 'L2历史接口有管理员门控');
let htmlCompiled = true;
for (const m2 of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try { new Function(m2[1]); } catch (e) { htmlCompiled = false; console.error('inline compile failed:', e.message); }
}
A(htmlCompiled, '前端内联脚本仍可编译');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STAR-L2-LAYERS CHECKS PASSED');
