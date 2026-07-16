// 主线净流入门槛测试(node tests/inflow-gate.test.js)
// Owner 规则:主线当天资金必须净流入。验证:净流出/零流入排除、null 不误杀、确认主线保护、排除项可观测。
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

const numOrNull = v => (v == null || v === '' || !Number.isFinite(Number(v))) ? null : Number(v);
eval(extractFn('strategyMainlineApplyInflowGate'));

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

const items = [
  { key: 'a', theme: '流入主线', netInflow: 5e8, count: 3 },
  { key: 'b', theme: '流出主线', netInflow: -103e8, count: 6, boardCount: 2 },
  { key: 'c', theme: '零流入主线', netInflow: 0, count: 1 },
  { key: 'd', theme: '缺数据主线', netInflow: null, count: 2 },
  { key: 'e', theme: '已确认流出主线', netInflow: -1e8, count: 4 },
];

// 1. 基本规则
const r1 = strategyMainlineApplyInflowGate(items, null);
A(r1.kept.map(i => i.key).join(',') === 'a,d', '净流入与缺数据保留;净流出与零流入排除');
A(r1.excluded.length === 3 && r1.excluded[0].reason === 'net-outflow', '排除项记录原因');
A(r1.excluded.find(e => e.theme === '流出主线').netInflow === -103e8, '排除项含净流出数值(可观测)');

// 2. null 不误杀(缺数据不得当流出)
A(r1.kept.some(i => i.key === 'd'), 'netInflow=null 不视为流出');

// 3. 确认主线保护
const r2 = strategyMainlineApplyInflowGate(items, { key: 'e', theme: '已确认流出主线' });
A(r2.kept.some(i => i.key === 'e'), 'owner 已确认主线不被自动规则移除');
A(!r2.excluded.some(e => e.theme === '已确认流出主线'), '确认主线不入排除清单');

// 4. 接线静态断言
A(src.includes('strategyMainlineApplyInflowGate(') && src.includes("inflowGate: { rule: 'net-inflow-required'"), '构建管线已接门槛且响应带 inflowGate 观测字段');
A(src.indexOf('const mainlineConfirm = await readMainlineConfirm(isoDay)') < src.indexOf('const inflowGate = strategyMainlineApplyInflowGate(')
  && src.indexOf('const inflowGate = strategyMainlineApplyInflowGate(') < src.indexOf(': strategyMainlineApplyL2StarGate(inflowGate.kept);'), 'readMainlineConfirm 先进入净流入门槛,再进入 L2 明星门槛');

// 5. 空输入
const r3 = strategyMainlineApplyInflowGate([], null);
A(r3.kept.length === 0 && r3.excluded.length === 0, '空输入安全');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL INFLOW-GATE CHECKS PASSED');
