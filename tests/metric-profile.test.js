// P1-D 口径元数据测试(node tests/metric-profile.test.js)
// 验证:响应元数据带 metricProfile 口径声明;前端四处口径标注存在;前端内联脚本可编译。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');

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
function extractConst(name) {
  const start = src.indexOf(`const ${name} = {`);
  if (start < 0) throw new Error('const not found: ' + name);
  let depth = 0, i = src.indexOf('{', start);
  const open = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 2);
}

const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

// 1. attachResponseMeta 输出 metricProfile
let attach;
{
  const prelude = `
    const strategyMainlineSavedAt = p => String(p?.generatedAt || '');
    const strategyMainlineAgeMs = () => 1000;
    const strategyMainlineStaleness = () => 'fresh';
    const strategyMainlineQuality = () => ({ ok: true });
    const strategyMainlineWarmState = { lastTickAt: '', lastResult: '', consecutiveFailures: 0, currentDelayMs: 0 };
    const strategyMainlineSupplementState = null;
  `;
  eval(prelude + extractConst('STRATEGY_MAINLINE_METRIC_PROFILE') + extractFn('strategyMainlineAttachResponseMeta') + '; attach = strategyMainlineAttachResponseMeta;');
}
const out = attach({ day: '2026-07-10', mainlines: [] });
A(!!out.metricProfile, '响应元数据带 metricProfile');
A(out.metricProfile.leaderGain?.basis === 'close', '龙头涨幅声明为收盘口径');
A(out.metricProfile.cardKlineGain?.basis === 'intraday-kline', '实时卡/QI涨幅声明为K线口径');
A(out.metricProfile.realtimeBoard?.basis === 'intraday-live', '实时板块指标声明为盘中口径');
A(Array.isArray(out.metricProfile.leaderGain.fields) && out.metricProfile.leaderGain.fields.includes('gain10'), '声明含字段清单');

// 2. 前端口径标注(同名数值必须让用户看得出口径差异)
A(html.includes('10/30日涨幅为收盘口径(不含今日盘中)'), '龙头候选列表标注收盘口径');
A(html.includes(';10/30日涨幅为收盘口径(不含今日盘中)">龙头</span>'), '主线卡龙头行 tooltip 标注收盘口径');
A(html.includes('涨幅为K线口径(含快照日盘中)'), 'QI 徽章 tooltip 标注K线口径');
A(html.includes('涨幅为K线口径(含当日盘中)'), '热门题材搜索结果标注K线口径');

// 3. 前端内联脚本仍可编译
const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
A(scripts.length > 0, '找到内联脚本');
let compiled = true;
for (const s of scripts) {
  try { new Function(s); } catch (e) { compiled = false; console.error('inline script compile failed:', e.message); }
}
A(compiled, '前端内联脚本全部可编译');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL METRIC-PROFILE CHECKS PASSED');
