// A completed L2 pass may legitimately leave no qualified mainline. That empty
// result must replace an older positive cache and remain available after close.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const match = src.match(new RegExp(`(?:async )?function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyBrace = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  let index = bodyBrace;
  for (; index < src.length; index += 1) {
    if (src[index] === '{') depth += 1;
    else if (src[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, index + 1);
}

const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${message}`);
  }
};

const isFiniteNumeric = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
eval(extractFn('strategyMainlineQuality'));
eval(extractFn('strategyMainlineIsUsablePayload'));

const resolvedEmpty = {
  ok: true,
  reason: 'no-l2-qualified-mainline',
  message: '今日暂不确认主线。',
  mainlines: [],
};
assert(strategyMainlineIsUsablePayload(resolvedEmpty), '有效的 0 条主线结果可写缓存');
assert(strategyMainlineQuality(resolvedEmpty).ok, '有效空结果的数据质量标记为已完成');
assert(!strategyMainlineIsUsablePayload({ ok: false, mainlines: [] }), '数据未准备结果仍不可写缓存');
assert(!strategyMainlineIsUsablePayload({ ok: true }), '缺少 mainlines 契约的结果不可写缓存');

assert(src.includes("reason: 'no-l2-qualified-mainline'"), 'L2 全部未过闸时返回明确原因');
assert(src.includes('未扫描、等待、扫描中、覆盖不足或扫描无明星的候选不会进入正式主线榜'), 'L2 空结果明确候选状态均不进入正式榜');
assert(src.includes("`ok-empty:${payload?.reason || 'no-qualified-mainline'}`"), '保温任务把有效空结果记为成功而非退避失败');
assert(src.includes('if (!payload?.ok || !Array.isArray(payload.mainlines)) return null;'), '收盘快照允许保存有效空结果');
assert(src.includes('if (!live?.ok || !Array.isArray(live.mainlines)) {'), '收盘生成器接受有效空结果');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL MAINLINE EMPTY STATE CHECKS PASSED');
