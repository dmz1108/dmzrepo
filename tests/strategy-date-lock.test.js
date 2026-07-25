const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFunction(name) {
  const match = html.match(new RegExp(`function\\s+${name}\\s*\\(`));
  if (!match) throw new Error(`function not found: ${name}`);
  const start = match.index;
  const paramsOpen = html.indexOf('(', start);
  let paramsDepth = 0;
  let open = -1;
  for (let index = paramsOpen; index < html.length; index += 1) {
    if (html[index] === '(') paramsDepth += 1;
    else if (html[index] === ')') {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        open = html.indexOf('{', index + 1);
        break;
      }
    }
  }
  if (open < 0) throw new Error(`function body not found: ${name}`);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    else if (html[index] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`function not closed: ${name}`);
}

let today = '2026-07-24';
const chinaToday = () => today;
const picker = { value: '' };
const document = {
  getElementById(id) {
    return id === 'date-picker' ? picker : null;
  },
};
let renderCount = 0;
let dashboardRefreshCount = 0;
const renderStrategyPage = () => { renderCount += 1; };
const refreshAll = () => { dashboardRefreshCount += 1; };
const setDatePickerValue = value => { picker.value = value; };
const reviewClockFallbackDay = value => value;
const state = {
  page: 'strategy',
  date: today,
  reviewDateOverride: '',
  strategyDateOverride: '',
  strategyData: {},
  smartPick: { stale: true },
  boards: [],
  cardData: {},
  usingSnapshot: false,
};

eval([
  extractFunction('syncDatePickerForPage'),
  extractFunction('ensureLivePageToday'),
  extractFunction('refreshLivePageAfterDateSync'),
  extractFunction('onStrategyDateChange'),
].join('\n'));

// 用户在策略页选择历史日期后，窗口 focus/pageshow 不得把日期改回今天。
onStrategyDateChange('2026-07-22');
assert.strictEqual(state.date, '2026-07-22');
assert.strictEqual(state.strategyDateOverride, '2026-07-22');
assert.strictEqual(picker.value, '2026-07-22');
assert.deepStrictEqual(state.smartPick, {});
const renderAfterSelection = renderCount;
assert.strictEqual(refreshLivePageAfterDateSync(), false);
assert.strictEqual(state.date, '2026-07-22');
assert.strictEqual(renderCount, renderAfterSelection);

// 切到实时看板仍应回到今天，但不能遗失策略页历史日期锁定。
state.page = 'dashboard';
assert.strictEqual(refreshLivePageAfterDateSync(), true);
assert.strictEqual(state.date, today);
assert.strictEqual(state.strategyDateOverride, '2026-07-22');
assert.strictEqual(dashboardRefreshCount, 1);

// 再回策略页时恢复用户锁定的历史日期，而不是继续显示今天。
state.page = 'strategy';
assert.strictEqual(refreshLivePageAfterDateSync(), true);
assert.strictEqual(state.date, '2026-07-22');
assert.strictEqual(picker.value, '2026-07-22');

// 用户主动选择今天才解除锁定；之后跨日恢复时应跟随新的今天。
onStrategyDateChange(today);
assert.strictEqual(state.strategyDateOverride, '');
assert.strictEqual(state.date, '2026-07-24');
today = '2026-07-25';
assert.strictEqual(refreshLivePageAfterDateSync(), true);
assert.strictEqual(state.date, '2026-07-25');

// 顶部全局日期框在策略页必须复用同一选择函数，不能绕过日期锁定。
assert(
  /datePicker\.addEventListener\('change'[\s\S]*?if \(state\.page === 'strategy'\) \{[\s\S]*?onStrategyDateChange\(selectedDay\);[\s\S]*?return;/.test(html),
  'global date picker should route strategy changes through onStrategyDateChange',
);
assert(
  /strategyDateOverride:\s*''/.test(html),
  'strategy date override should be initialized in shared state',
);

console.log('strategy date lock checks passed');
