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

const context = {};
vm.runInNewContext(`${matchFunction[0]}; this.matchesConfirm = strategyMainlineMatchesConfirm;`, context);
assert(context.matchesConfirm({ familyKey: 'group:PCB与连接', theme: 'PCB' }, { key: 'group:PCB与连接', theme: 'PCB' }), '家族键可匹配确认记录');
assert(context.matchesConfirm({ familyKey: 'group:其他', theme: 'PCB' }, { key: 'group:PCB与连接', theme: 'PCB' }), '主题可作为兼容匹配');
assert(!context.matchesConfirm({ familyKey: 'group:医药', theme: '医药' }, { key: 'group:PCB与连接', theme: 'PCB' }), '无关主线不会误标确认');

assert(server.includes('async function getStrategyMainlinesWithConfirm(day)'), '主线响应经过动态确认叠加器');
assert(server.includes('async function getStrategyMainlinesVisible(day)')
  && server.includes('const payload = await getStrategyMainlinesWithConfirm(day);')
  && server.includes("url.pathname === '/api/strategy-mainlines') return send(res, 200, await getStrategyMainlinesVisible"), '公开主线接口在动态确认后补预期轨迹并执行正式榜过滤');
assert(server.includes('strategyMainlineWithTimeout(getStrategyMainlinesWithConfirm(requestedDay)'), 'AI只读策略响应使用同一确认口径');

assert(dashboard.includes('async function confirmMainlineTheme(key, theme)'), '确认主线操作改为可捕获错误的异步流程');
assert(dashboard.includes('确认主线失败：${e.message || e}'), '确认失败向管理员显示原因');
assert(dashboard.includes('取消主线确认失败：${e.message || e}'), '取消确认失败向管理员显示原因');

console.log('ALL MAINLINE-CONFIRM CHECKS PASSED');
