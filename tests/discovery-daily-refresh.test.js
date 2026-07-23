const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const home = fs.readFileSync(path.join(root, 'Qi', 'qi-home.jsx'), 'utf8');
const compiled = fs.readFileSync(path.join(root, 'Qi', 'qi-home.compiled.js'), 'utf8');

function assert(condition, message) {
  if (condition) console.log(`ok: ${message}`);
  else {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

function extractFunction(source, name) {
  const match = source.match(new RegExp(`function ${name}\\(`));
  if (!match) throw new Error(`not found: ${name}`);
  const bodyStart = source.indexOf('{', match.index);
  let depth = 0;
  let index = bodyStart;
  for (; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    else if (source[index] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return source.slice(match.index, index + 1);
}

const serverContext = { Date, Set };
vm.createContext(serverContext);
vm.runInContext([
  'const DISCOVERY_FRESH_MAX_AGE_DAYS = 45;',
  extractFunction(server, 'discoverySourceIsCurated'),
  extractFunction(server, 'discoveryItemFreshTimestamp'),
  extractFunction(server, 'discoveryItemIsFreshExternal'),
  extractFunction(server, 'discoveryItemStableIdentity'),
  extractFunction(server, 'discoveryNewExternalItemCount'),
  `this.curatedFresh = discoveryItemIsFreshExternal({
    city: '上海',
    name: 'Pull Tab拉环咖啡',
    sourceName: '站内地点资料',
    publishedAt: '2026-07-23T00:00:00.000Z'
  }, Date.parse('2026-07-23T12:00:00.000Z'), 45);`,
  `this.externalFresh = discoveryItemIsFreshExternal({
    city: '深圳',
    name: '真实新店',
    sourceName: '微信文章 · 本地生活',
    publishedAt: '2026-07-20T00:00:00.000Z'
  }, Date.parse('2026-07-23T12:00:00.000Z'), 45);`,
  `this.externalOld = discoveryItemIsFreshExternal({
    city: '深圳',
    name: '旧店',
    sourceName: '微信文章 · 本地生活',
    publishedAt: '2026-01-01T00:00:00.000Z'
  }, Date.parse('2026-07-23T12:00:00.000Z'), 45);`,
  `this.newExternalCount = discoveryNewExternalItemCount([
    { city: '上海', name: '固定店', sourceName: '站内地点资料', publishedAt: '2026-07-23T00:00:00.000Z' },
    { city: '深圳', name: '已见新店', sourceName: '微信文章', publishedAt: '2026-07-21T00:00:00.000Z' },
    { city: '深圳', name: '本次新增', sourceName: '微信文章', publishedAt: '2026-07-22T00:00:00.000Z' }
  ], [
    { city: '深圳', name: '已见新店', sourceName: '微信文章', publishedAt: '2026-07-21T00:00:00.000Z' }
  ], Date.parse('2026-07-23T12:00:00.000Z'));`,
].join('\n'), serverContext);

assert(serverContext.curatedFresh === false, '固定地点即使带当天时间也不再算真实新线索');
assert(serverContext.externalFresh === true, '近期外部来源可进入真实新线索池');
assert(serverContext.externalOld === false, '超过新鲜期的旧文章不会伪装成今日线索');
assert(serverContext.newExternalCount === 1, 'freshCount 只统计本次首次出现的近期外部地点');

const seedBody = extractFunction(server, 'buildDiscoverySeedItems');
assert(seedBody.includes("publishedAt: ''") && seedBody.includes("discoveredAt: ''"), '固定地点不再每次同步重写当天时间');
assert(seedBody.includes("freshnessKind: 'curated'"), '固定地点显式标记为编辑精选');
assert(server.includes("syncDiscoveryDb({ force: true, reason: 'auto-daily' })"), '中午自动同步强制重新抓取当天来源');
assert(server.includes('if (!discoverySourceIsCurated(item) && !hasFresh'), '固定地点可作兜底展示但绕开伪新鲜度');
assert(server.includes('discoveryItemIsFreshExternal(item)'), '每城选择器为真实近期线索保留名额');
assert(server.includes('if (/[｜|_]/.test(text)) return true;'), '文章标题式下划线名称不会进入真实地点推荐');
assert(server.includes('咖啡地图[一二三四五六七八九十]?'), '泛化地图标题不会冒充具体新地点');

const homeContext = { Date };
vm.createContext(homeContext);
vm.runInContext([
  extractFunction(home, 'discoveryItemIsCurated'),
  extractFunction(home, 'discoveryDayOrdinal'),
  extractFunction(home, 'discoveryItemTimestamp'),
  extractFunction(home, 'discoveryItemIsRecentExternal'),
  extractFunction(home, 'discoveryItemIdentity'),
  extractFunction(home, 'sortDiscoveryFeaturedItems'),
  extractFunction(home, 'rotateDiscoveryFeaturedPool'),
  extractFunction(home, 'rankDiscoveryFeaturedItems'),
  `const cities = [
    {
      id: 'shanghai',
      name: '上海',
      items: [
        { id: 'pull-tab', name: 'Pull Tab拉环咖啡', sourceName: '站内地点资料', freshnessKind: 'curated', recommendationScore: 95, qualityScore: 103 },
        { id: 'fresh-shanghai', name: '上海近期新店', sourceName: '微信文章', publishedAt: '2026-07-20T00:00:00.000Z', recommendationScore: 82, qualityScore: 55 }
      ]
    },
    {
      id: 'beijing',
      name: '北京',
      items: [
        { id: 'soloist', name: 'Soloist Coffee', sourceName: '站内地点资料', freshnessKind: 'curated', recommendationScore: 95, qualityScore: 102 },
        { id: 'fresh-beijing', name: '北京近期新展', sourceName: '百度新闻', publishedAt: '2026-07-19T00:00:00.000Z', recommendationScore: 84, qualityScore: 60 }
      ]
    }
  ];`,
  `this.dayOne = rankDiscoveryFeaturedItems(cities, '2026-07-23', 4);`,
  `this.dayTwo = rankDiscoveryFeaturedItems(cities, '2026-07-24', 4);`,
].join('\n'), homeContext);

assert(homeContext.dayOne.length === 4 && homeContext.dayTwo.length === 4, '每日精选保持完整卡片数量');
assert(homeContext.dayOne.some(item => item.dailyPickKind === 'fresh'), '每日精选至少包含一个近期真实线索');
assert(homeContext.dayOne[0].id !== homeContext.dayTwo[0].id, '相邻日期的首推地点会轮换而非永久霸榜');
assert(homeContext.dayOne.every(item => ['近期新线索', '今日轮换'].includes(item.dailyPickLabel)), '精选卡片清楚标识新线索或编辑轮换');
assert(home.includes('rankDiscoveryFeaturedItems(discovery.cities || [], discovery.generatedDay, 1)'), '主页探索预览与探索页使用同一每日推荐器');
assert(compiled.includes('rankDiscoveryFeaturedItems'), '编译产物包含每日探索推荐器');

console.log(process.exitCode ? 'DISCOVERY DAILY REFRESH CHECKS FAILED' : 'ALL DISCOVERY DAILY REFRESH CHECKS PASSED');
