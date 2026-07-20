// 今日实时涨停榜“主”统计回归测试。
// 精确统计接口以前只返回近 10 日涨停次数 Top10，导致今日涨停但未进 Top10 的股票
// 无法按代码匹配主因次数，前端显示“--”。现在接口保留 Top10 在前，并追加全部今日涨停股。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = src.indexOf('{', src.indexOf(')', match.index));
  let depth = 0;
  for (let i = bodyStart; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(match.index, i + 1);
    }
  }
  throw new Error(`unterminated function: ${name}`);
}

eval(extractFn('limitUpThreshold'));
eval(extractFn('compactDate'));
eval(extractFn('isCurrentPreciseLimitUp'));
eval(extractFn('appendCurrentLimitUpsToPreciseTop'));

const selected = new Set(['600001']);
assert.strictEqual(
  isCurrentPreciseLimitUp({ code: '600001', name: '池内股' }, 8, selected, true),
  true,
  '当日涨停池中的股票应计为今日涨停',
);
assert.strictEqual(
  isCurrentPreciseLimitUp({ code: '600002', name: '主板实时封板' }, 9.8, selected, true),
  true,
  '当日涨停池延迟时，主板实时涨幅达到涨停阈值应兜底',
);
assert.strictEqual(
  isCurrentPreciseLimitUp({ code: '300001', name: '创业板未封板' }, 9.8, selected, true),
  false,
  '创业板 9.8% 不应误判为涨停',
);
assert.strictEqual(
  isCurrentPreciseLimitUp({ code: '600002', name: '历史回看' }, 10, selected, false),
  false,
  '历史日期不能使用当前实时涨幅兜底',
);

const rankedRows = Array.from({ length: 12 }, (_, index) => ({
  code: String(600001 + index),
  totalCount: 12 - index,
  days: index === 11 ? ['20260720'] : ['20260717'],
}));
const merged = appendCurrentLimitUpsToPreciseTop(rankedRows.slice(0, 10), rankedRows, '20260720');
assert.strictEqual(merged.length, 11, 'Top10 之外的今日涨停股必须追加供主因次数映射');
assert.deepStrictEqual(merged.slice(0, 10).map(row => row.code), rankedRows.slice(0, 10).map(row => row.code), '原 Top10 顺序必须保持');
assert.strictEqual(merged[10].code, rankedRows[11].code, '追加项必须是今日涨停股');

const duplicate = appendCurrentLimitUpsToPreciseTop(
  [{ code: '600001', days: ['20260720'] }],
  [{ code: '600001', days: ['20260720'] }],
  '20260720',
);
assert.strictEqual(duplicate.length, 1, 'Top10 内已有的今日涨停股不能重复追加');

console.log('realtime main-reason count checks passed');
