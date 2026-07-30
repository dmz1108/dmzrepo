// Stale K-line tail regression: intermediate trading days must not disappear.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');

function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const match = src.match(sig);
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

const compactDate = value => String(value || '').replace(/\D/g, '').slice(0, 8);
const isoFromCompactDate = value => {
  const day = compactDate(value);
  return day.length === 8
    ? `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`
    : String(value || '');
};
const shiftDay = (value, offset) => {
  const [year, month, day] = isoFromCompactDate(value).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(offset || 0));
  return date.toISOString().slice(0, 10);
};
const isChinaMarketTradingDay = value => {
  const day = isoFromCompactDate(value);
  const date = new Date(`${day}T00:00:00Z`);
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6;
};

eval(extractFn('recentTradingWindowDayList'));

const stale = {
  x: ['20260721', '20260722', '20260723', '20260724', '20260727'],
};
assert(
  JSON.stringify(recentTradingWindowDayList(stale, '2026-07-30', 5))
    === JSON.stringify(['2026-07-24', '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30']),
  '陈旧 K 线停在 07-27 时补齐 07-28/29，不再从 07-27 跳到 07-30'
);

assert(
  JSON.stringify(recentTradingWindowDayList(stale, '2026-07-29', 3))
    === JSON.stringify(['2026-07-27', '2026-07-28', '2026-07-29']),
  '历史请求日同样补齐陈旧尾部'
);

assert(
  JSON.stringify(recentTradingWindowDayList({ x: ['20260722', '20260723', '20260724'] }, '2026-07-26', 3))
    === JSON.stringify(['2026-07-22', '2026-07-23', '2026-07-24']),
  '周末不被补成交易日'
);

assert(
  JSON.stringify(recentTradingWindowDayList({ x: ['20260727', '20260728', '20260729'] }, '2026-07-29', 2))
    === JSON.stringify(['2026-07-28', '2026-07-29']),
  'K 线已覆盖请求日时保持原有窗口语义'
);

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL RECENT-TRADING-DAYS CHECKS PASSED');
