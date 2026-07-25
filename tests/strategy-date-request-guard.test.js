const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');

function extractFunction(name) {
  const match = html.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
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

const elements = {
  'strategy-mainlines': { innerHTML: '' },
  'strategy-l2-history': { innerHTML: '' },
  'strategy-mainline-review': { innerHTML: '' },
};
const document = {
  getElementById(id) {
    return elements[id] || null;
  },
};
const state = {
  page: 'strategy',
  date: '2026-07-22',
  strategyMainlinesLoadSeq: 0,
  strategyL2HistoryLoadSeq: 0,
  strategyMainlineReviewLoadSeq: 0,
};
const KPL_STATS_BASE = '';
const canUseL2AdminTools = () => true;
const adminHeaders = () => ({});
const renderStrategyMainlinesHTML = data => `main:${data.day}`;
const renderStrategyL2History = data => `l2:${data.day}`;
const renderMainlineReviewHTML = data => `review:${data.version}`;
let verdictDay = '';
let reviewVersion = '';
const fillStrategyVerdictKpi = data => { verdictDay = data.day; };
const fillStrategyRecordKpi = data => { reviewVersion = data.version; };

let requests = [];
const fetch = url => new Promise(resolve => {
  requests.push({
    url,
    resolve(data, ok = true) {
      resolve({
        ok,
        json: async () => data,
      });
    },
  });
});

eval([
  extractFunction('loadStrategyMainlines'),
  extractFunction('loadStrategyL2History'),
  extractFunction('loadStrategyMainlineReview'),
].join('\n'));

async function verifyDayGuard(load, elementId, prefix) {
  requests = [];
  state.date = '2026-07-22';
  const oldRequest = load('2026-07-22');
  state.date = '2026-07-23';
  const newRequest = load('2026-07-23');
  assert.strictEqual(requests.length, 2);

  requests[1].resolve({ day: '2026-07-23' });
  await newRequest;
  requests[0].resolve({ day: '2026-07-22' });
  await oldRequest;

  assert.strictEqual(elements[elementId].innerHTML, `${prefix}:2026-07-23`);
}

(async () => {
  await verifyDayGuard(loadStrategyMainlines, 'strategy-mainlines', 'main');
  assert.strictEqual(verdictDay, '2026-07-23');

  await verifyDayGuard(loadStrategyL2History, 'strategy-l2-history', 'l2');

  requests = [];
  const oldReview = loadStrategyMainlineReview();
  const newReview = loadStrategyMainlineReview();
  requests[1].resolve({ version: 'new' });
  await newReview;
  requests[0].resolve({ version: 'old' });
  await oldReview;
  assert.strictEqual(elements['strategy-mainline-review'].innerHTML, 'review:new');
  assert.strictEqual(reviewVersion, 'new');

  console.log('strategy date request guard checks passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
