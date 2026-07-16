const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const serverSrc = fs.readFileSync(path.join(root, 'yule-server.js'), 'utf8');
const yuleSrc = fs.readFileSync(path.join(root, 'yule.html'), 'utf8');
const jsx = fs.readFileSync(path.join(root, 'Qi', 'qi-home.jsx'), 'utf8');
const compiled = fs.readFileSync(path.join(root, 'Qi', 'qi-home.compiled.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'Qi', 'index.html'), 'utf8');

function assert(condition, message) {
  if (condition) console.log(`ok: ${message}`);
  else {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function extractFunction(src, name) {
  const match = src.match(new RegExp(`function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = src.indexOf('{', match.index);
  let depth = 0;
  let index = bodyStart;
  for (; index < src.length; index += 1) {
    if (src[index] === '{') depth += 1;
    else if (src[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return src.slice(match.index, index + 1);
}

const context = { Date };
vm.createContext(context);
vm.runInContext([
  extractFunction(serverSrc, 'beijingDayStamp'),
  extractFunction(serverSrc, 'itemImagePixels'),
  extractFunction(serverSrc, 'itemHasUsableImage'),
  extractFunction(serverSrc, 'pickHomeTeaser'),
  `this.beijingDay = beijingDayStamp(Date.UTC(2026, 6, 14, 16, 30));`,
  `this.todayPick = pickHomeTeaser([
    { id: 'old-star', day: '20260714', cover: '/yule-img/old/0.jpg', images: [{ width: 1200, height: 800 }] },
    { id: 'today-no-image', day: '20260715', images: [] },
    { id: 'today-music', day: '20260715', cover: '/yule-img/today/0.jpg', images: [{ width: 1200, height: 800 }] }
  ], '20260715');`,
  `this.latestFallback = pickHomeTeaser([
    { id: 'ranked-old', day: '20260713', cover: '/yule-img/old/0.jpg', images: [{ width: 1200, height: 800 }] },
    { id: 'latest', day: '20260714', cover: '/yule-img/latest/0.jpg', images: [{ width: 1200, height: 800 }] }
  ], '20260715');`,
].join('\n'), context);

assert(context.beijingDay === '20260715', '娱乐首页推荐按北京时间识别当天');
assert(context.todayPick?.id === 'today-music', '当天内容优先于旧明星热榜且优先选择有图条目');
assert(context.latestFallback?.id === 'latest', '当天暂缺时回退最新可用日期而非更旧高分内容');
assert(serverSrc.includes('const pick = pickHomeTeaser(listItems());'), 'home-teaser 接口使用跨频道今日推荐选择器');

const yuleContext = {};
vm.createContext(yuleContext);
vm.runInContext([
  extractFunction(yuleSrc, 'itemScore'),
  extractFunction(yuleSrc, 'sortedItems'),
  extractFunction(yuleSrc, 'rankedTodayItems'),
  `this.preferredFromList = rankedTodayItems([
    { id: 'global-top', rankScore: 200 },
    { id: 'today-teaser', title: '列表旧文案', rankScore: 100 }
  ], { id: 'today-teaser', title: '主页同款文案', rankScore: 100 });`,
  `this.preferredMissing = rankedTodayItems([
    { id: 'global-top', rankScore: 200 }
  ], { id: 'fresh-teaser', rankScore: 100 });`,
  `this.fallback = rankedTodayItems([
    { id: 'low', rankScore: 100 },
    { id: 'high', rankScore: 200 }
  ], null);`,
].join('\n'), yuleContext);
assert(
  Array.from(yuleContext.preferredFromList, item => item.id).join(',') === 'today-teaser,global-top',
  '娱乐页全部频道将主页同一条今日推荐置顶并按 id 去重',
);
assert(yuleContext.preferredFromList[0].title === '主页同款文案', '娱乐页主卡直接使用主页 teaser 的标题、图片和摘要对象');
assert(
  Array.from(yuleContext.preferredMissing, item => item.id).join(',') === 'fresh-teaser,global-top',
  '推荐刚更新而分类列表尚未出现时仍显示同一条今日推荐',
);
assert(
  Array.from(yuleContext.fallback, item => item.id).join(',') === 'high,low',
  '推荐接口失败或为空时回退娱乐页原有排行第一名',
);
assert(yuleSrc.includes("getJSON(`${API}/home-teaser?_=${Date.now()}`)"), '娱乐页读取与主页相同的今日推荐接口');
assert(yuleSrc.includes('return todayHTML(allItems, preferredLead)'), '娱乐页全部频道把同一推荐传入今日值得看');
assert(yuleSrc.includes('content.innerHTML = todayHTML(items) + sectionHTML(c, items);'), '单频道仍使用该频道自身榜首');
assert(jsx.includes("label: '今日值得看'"), '首页娱乐卡文案改为今日值得看');
assert(!jsx.includes('娱乐热榜第一'), '首页不再显示旧的娱乐热榜第一文案');
assert(jsx.includes('YULE_CATEGORY_LABELS'), '首页娱乐卡显示可读频道名称');
assert(jsx.includes("window.scrollTo({ top: 0, left: 0, behavior: 'auto' });") && jsx.includes('}, [page]);'), '首页内部页面切换后自动回到顶部');
assert(compiled.includes('今日值得看') && compiled.includes('window.scrollTo'), '首页编译产物包含文案和回顶修复');
assert(html.includes('qi-home.compiled.js?v=20260715-home-today-contact'), '首页脚本缓存版本已更新');

console.log(process.exitCode ? 'HOME PREVIEW / CONTACT CHECKS FAILED' : 'ALL HOME PREVIEW / CONTACT CHECKS PASSED');
