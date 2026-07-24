// 回看日 K 新鲜度回归：同日保存但未覆盖目标交易日的缓存必须被绕过，
// 返回数据仍未覆盖目标日时也不能永久挡住下一次补取。
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const A = (cond, msg) => {
  if (!cond) {
    console.error('FAIL: ' + msg);
    process.exitCode = 1;
  } else {
    console.log('ok: ' + msg);
  }
};

function extractFn(name) {
  const match = source.match(new RegExp(`(?:async )?function ${name}\\(`));
  if (!match) throw new Error('not found: ' + name);
  const bodyStart = source.indexOf('{', source.indexOf(')', match.index));
  let depth = 0;
  let end = bodyStart;
  for (; end < source.length; end += 1) {
    if (source[end] === '{') depth += 1;
    else if (source[end] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return source.slice(match.index, end + 1);
}

const compactDate = value => String(value || '').replace(/\D/g, '').slice(0, 8);
const isoFromCompactDate = value => {
  const raw = compactDate(value);
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : '';
};
const numOrNull = value => (value == null || value === '' || !Number.isFinite(Number(value))) ? null : Number(value);
const eastmoneySecid = code => `1.${code}`;
const klineCache = new Map();
let persisted = null;
const readPersistCache = async () => persisted;
const writes = [];
const writePersistCache = async (type, code, data) => writes.push({ type, code, data });
const chinaNowParts = () => ({ day: '20260724', hour: 16, minute: 30 });
const isAfterMarketClose = () => true;
const fetchTencentKline = async () => null;
let responseKlines = [];
let fetchCount = 0;
const fetch = async () => {
  fetchCount += 1;
  return {
    ok: true,
    json: async () => ({ data: { klines: responseKlines } }),
  };
};

eval(extractFn('strategyKlineBarForDay'));
eval(extractFn('strategyKlineCoversDay'));
eval(extractFn('fetchEastmoneyKline'));

(async () => {
  const stale = {
    source: 'eastmoney',
    stockId: '601179',
    x: ['2026-07-23'],
    y: [[12.7, 13.65, 13.65, 12.65, 1828708, 0]],
  };
  persisted = { savedAt: '2026-07-23T16:31:39.462Z', data: stale };
  klineCache.set('eastmoney:601179', stale);
  responseKlines = [
    '2026-07-23,12.70,13.65,13.65,12.65,1828708,2411991167.00',
    '2026-07-24,14.01,13.55,14.48,13.53,3691072,5147727657.00',
  ];

  const fresh = await fetchEastmoneyKline('601179', { requiredThroughDay: '2026-07-24' });
  A(fetchCount === 1, '同日保存但只到07-23的进程/磁盘缓存被绕过并重新请求');
  A(strategyKlineCoversDay(fresh, '2026-07-24'), '重新请求的数据实际覆盖目标交易日07-24');
  A(strategyKlineBarForDay(fresh, '2026-07-24')?.high === 14.48, '目标日最高价按精确日期解析');

  klineCache.clear();
  persisted = null;
  responseKlines = ['2026-07-24,14.01,13.55,14.48,13.53,3691072,5147727657.00'];
  const beforeRetry = fetchCount;
  await fetchEastmoneyKline('601179', { requiredThroughDay: '2026-07-27' });
  await fetchEastmoneyKline('601179', { requiredThroughDay: '2026-07-27' });
  A(fetchCount === beforeRetry + 2, '网络结果尚未覆盖目标交易日时，下一次调用会继续补取而非永久命中旧缓存');
  A(writes.every(row => strategyKlineCoversDay(row.data, row.data.x[row.data.x.length - 1])),
    '持久化内容均为可解析的日K数据');

  if (process.exitCode) console.error('\nSOME KLINE REVIEW FRESHNESS CHECKS FAILED');
  else console.log('\nALL KLINE REVIEW FRESHNESS CHECKS PASSED');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
