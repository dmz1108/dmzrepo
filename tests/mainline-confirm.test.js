const fs = require('fs');
const vm = require('vm');

const server = fs.readFileSync('kpl-stats-server.js', 'utf8');
const dashboard = fs.readFileSync('kpl-dashboard_17_apple.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok: ${message}`);
}

const matchFunction = server.match(/function strategyMainlineMatchesConfirm\(mainline, confirm\) \{[\s\S]*?\n\}/);
assert(matchFunction, '找到主线确认匹配函数');
const formalFunction = server.match(/function strategyMainlineIsFormal\(mainline\) \{[\s\S]*?\n\}/);
const annotateFunction = server.match(/function strategyMainlineAnnotateList\(mainlines, confirm\) \{[\s\S]*?\n\}/);
assert(formalFunction && annotateFunction, '找到正式主线与人工重点独立标注函数');

const context = {};
vm.runInNewContext(`${matchFunction[0]}; ${formalFunction[0]}; ${annotateFunction[0]}; this.matchesConfirm = strategyMainlineMatchesConfirm; this.annotate = strategyMainlineAnnotateList;`, context);
assert(context.matchesConfirm({ familyKey: 'group:PCB与连接', theme: 'PCB' }, { key: 'group:PCB与连接', theme: 'PCB' }), '家族键可匹配确认记录');
assert(context.matchesConfirm({ familyKey: 'group:其他', theme: 'PCB' }, { key: 'group:PCB与连接', theme: 'PCB' }), '主题可作为兼容匹配');
assert(!context.matchesConfirm({ familyKey: 'group:医药', theme: '医药' }, { key: 'group:PCB与连接', theme: 'PCB' }), '无关主线不会误标确认');
const annotated = context.annotate([
  { familyKey: 'group:光通信', theme: '光通信', qiTier: 'formal', rank: 1 },
  { familyKey: 'group:算力AI', theme: '算力AI', qiTier: 'formal', rank: 2 },
  { familyKey: 'group:医药', theme: '医药', qiTier: 'formal', rank: 4 },
], { key: 'group:算力AI', theme: '算力AI' });
assert(annotated.every(row => row.isFormalMainline === true), '所有过闸方向都标为正式主线，不受名次限制');
assert(annotated.filter(row => row.isStrongestMainline).map(row => row.theme).join(',') === '光通信', '只有排序第一额外标为最强主线');
assert(annotated.filter(row => row.isOwnerConfirmedMainline).map(row => row.theme).join(',') === '算力AI', '人工重点独立于正式主线资格');

assert(server.includes('async function getStrategyMainlinesWithConfirm(day)'), '主线响应经过动态确认叠加器');
assert(server.includes('async function getStrategyMainlinesVisible(day)')
  && server.includes('const payload = await getStrategyMainlinesWithConfirm(day);')
  // 2026-07-26 命中率随行:路由改为先取 payload 再在响应层附加 predictHitRates,
  // 锁的意图不变——公开主线接口必须走 getStrategyMainlinesVisible(动态确认 + 正式榜过滤)。
  && /url\.pathname === '\/api\/strategy-mainlines'\) \{[\s\S]{0,240}?const payload = await getStrategyMainlinesVisible\(/.test(server), '公开主线接口在动态确认后补预期轨迹并执行正式榜过滤');
assert(server.includes('strategyMainlineWithTimeout(getStrategyMainlinesWithConfirm(requestedDay)'), 'AI只读策略响应使用同一确认口径');

assert(dashboard.includes('async function confirmMainlineTheme(key, theme)'), '确认主线操作改为可捕获错误的异步流程');
assert(dashboard.includes('确认主线失败：${e.message || e}'), '确认失败向管理员显示原因');
assert(dashboard.includes('取消主线确认失败：${e.message || e}'), '取消确认失败向管理员显示原因');

console.log('ALL MAINLINE-CONFIRM CHECKS PASSED');
