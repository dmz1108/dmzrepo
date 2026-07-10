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

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STAR-L2-LAYERS CHECKS PASSED');
