'use strict';
/*
 * Panda 娱乐(Yule)独立服务 —— 与主站(主页 / 行情 /kpl)彻底隔离。
 * - 独立进程 / 端口(默认 8766) / 独立数据目录 yule-data / 独立配置 yule-config.json。
 * - 主服务 server.js 只做薄代理(/yule、/api/yule/*、/yule-img/*),本服务崩了不连累主页和行情。
 * - 采集:主源=小红书+今日头条爬虫(慢采、失败静默);备胎=热榜API + qwen 生成文案(每细分兜底几条)。
 * - 5 天 TTL 自动清理;每细分最多 50 条,温和低频采集。
 * 纯 node 内置模块,零外部依赖。Node 18+(用全局 fetch)。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------- 故障隔离:任何未捕获错误都只记录,不退出进程 ----------
process.on('uncaughtException', (err) => {
  try { log('error', 'uncaughtException', err && err.stack || String(err)); } catch (_) {}
});
process.on('unhandledRejection', (reason) => {
  try { log('error', 'unhandledRejection', reason && reason.stack || String(reason)); } catch (_) {}
});

// ---------- 路径 / 常量 ----------
const SCRIPT_DIR = __dirname;
const DATA_DIR = process.env.YULE_DATA_DIR || path.join(SCRIPT_DIR, 'yule-data');
const ITEMS_DIR = path.join(DATA_DIR, 'items');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const CONFIG_PATH = path.join(DATA_DIR, 'yule-config.json');
const STATE_PATH = path.join(DATA_DIR, 'state.json');
const LOG_PATH = path.join(DATA_DIR, 'yule.log');
const PORT = Number(process.env.YULE_PORT || 8766);
const HOST = process.env.YULE_HOST || '127.0.0.1';
// 主站运行时配置(只读取 qwenApiKey 一项做兜底,不写不依赖)
const KPL_RUNTIME_CONFIG = process.env.KPL_RUNTIME_CONFIG ||
  path.join(SCRIPT_DIR, 'kpl-runtime-config.json');

// ---------- 默认配置 ----------
const DEFAULT_CONFIG = {
  version: 1,
  ttlDays: 5,                       // 文案超过 N 天自动清除
  perCategoryMax: 50,               // 每细分最多保留条数
  categories: [
    { key: 'star',    label: '明星热点', emoji: '⭐', seeds: ['田曦薇'] },
    { key: 'screen',  label: '影视综艺', emoji: '🎬', seeds: [] },
    { key: 'fashion', label: '时尚穿搭', emoji: '👗', seeds: [] },
    { key: 'music',   label: '音乐现场', emoji: '🎵', seeds: [] },
    { key: 'society', label: '社会热点', emoji: '📰', seeds: [] },
    { key: 'life',    label: '生活方式', emoji: '🍃', seeds: [] },
  ],
  crawl: {
    enabled: true,
    intervalHours: 2,               // 每隔几小时跑一轮采集检查
    dailyHour: 7,                   // 旧配置兼容字段,不再作为主调度
    gentleDelayMs: 4000,            // 每次请求间隔(慢采,降低被封概率)
    perCategoryTarget: 8,           // 每细分目标条数(主源优先填到这个数)
    sources: {
      xiaohongshu: { enabled: true },
      toutiao:     { enabled: true },
      bilibili: {
        enabled: true,
        perCategory: 4,
        rankings: {
          star: 5,
          screen: 181,
          music: 3,
          fashion: 155,
          life: 160,
        },
      },
      iqiyi: {
        enabled: true,
        perRun: 16,
        ranks: [
          { channel: -1, label: '总榜' },
          { channel: 2, label: '电视剧' },
          { channel: 6, label: '综艺' },
          { channel: 1, label: '电影' },
        ],
      },
      douban: {
        enabled: true,
        perCollection: 6,
        collections: [
          { id: 'movie_showing', label: '正在上映电影' },
          { id: 'tv_hot', label: '热播剧集' },
          { id: 'show_hot', label: '热门综艺' },
        ],
      },
      qqMusic: { enabled: true, topId: 4, perRun: 12, label: '流行指数榜' },
      weiboBand: { enabled: true, perRun: 60 },
      sinaFashion: { enabled: true, perRun: 12 },
      zhihu: { enabled: true, perRun: 30 },
    },
    backup: {
      enabled: true,
      perCategory: 3,               // 备胎每细分兜底条数
      // 公开热榜聚合 API(任选一个能用的;失败自动跳过)
      hotlistEndpoints: {
        weibo:   'https://api.vvhan.com/api/hotlist/wbHot',
        toutiao: 'https://api.vvhan.com/api/hotlist/toutiao',
        douyin:  'https://api.vvhan.com/api/hotlist/douyinHot',
        baidu:   'https://api.vvhan.com/api/hotlist/baiduRD',
      },
    },
  },
  qwen: {
    enabled: true,
    apiKey: '',                     // 留空则回退读 kpl-runtime-config.json 的 qwenApiKey
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus',
  },
  mediaEnhance: {
    enabled: true,
    minCoverPixels: 700 * 420,
    baiduImage: { enabled: true, perItem: 2, maxPerRun: 18 },
    wikimedia: { enabled: true },
    tmdb: {
      enabled: true,
      apiKey: '',
      imageBase: 'https://image.tmdb.org/t/p/original',
    },
  },
};

// ---------- 基础工具 ----------
function ensureDirs() {
  for (const d of [DATA_DIR, ITEMS_DIR, IMAGES_DIR]) {
    try { fs.mkdirSync(d, { recursive: true }); } catch (_) {}
  }
}
function nowIso() { return new Date().toISOString(); }
function todayStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
function log(level, ...parts) {
  const line = `[${nowIso()}] [${level}] ${parts.map(p => typeof p === 'string' ? p : JSON.stringify(p)).join(' ')}`;
  // 控制台 + 文件(文件写失败也不抛)
  if (level === 'error') console.error(line); else console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + '\n'); } catch (_) {}
}
function readJsonSafe(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return fallback; }
}
function writeJsonSafe(p, obj) {
  try {
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmp, p);
    return true;
  } catch (err) { log('error', 'writeJsonSafe', p, err.message); return false; }
}
function hashId(...parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}

// ---------- 配置 ----------
let CONFIG = DEFAULT_CONFIG;
function loadConfig() {
  ensureDirs();
  const onDisk = readJsonSafe(CONFIG_PATH, null);
  if (!onDisk) {
    CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    writeJsonSafe(CONFIG_PATH, CONFIG);
    log('info', 'config: 初始化默认 yule-config.json');
  } else {
    // 浅合并默认值,保证新字段不丢
    CONFIG = Object.assign({}, DEFAULT_CONFIG, onDisk);
    CONFIG.crawl = Object.assign({}, DEFAULT_CONFIG.crawl, onDisk.crawl || {});
    CONFIG.crawl.sources = Object.assign({}, DEFAULT_CONFIG.crawl.sources, (onDisk.crawl || {}).sources || {});
    CONFIG.crawl.sources.bilibili = Object.assign({}, DEFAULT_CONFIG.crawl.sources.bilibili, ((onDisk.crawl || {}).sources || {}).bilibili || {});
    CONFIG.crawl.sources.bilibili.rankings = Object.assign({}, DEFAULT_CONFIG.crawl.sources.bilibili.rankings, (((onDisk.crawl || {}).sources || {}).bilibili || {}).rankings || {});
    CONFIG.crawl.sources.iqiyi = Object.assign({}, DEFAULT_CONFIG.crawl.sources.iqiyi, ((onDisk.crawl || {}).sources || {}).iqiyi || {});
    CONFIG.crawl.sources.douban = Object.assign({}, DEFAULT_CONFIG.crawl.sources.douban, ((onDisk.crawl || {}).sources || {}).douban || {});
    CONFIG.crawl.sources.qqMusic = Object.assign({}, DEFAULT_CONFIG.crawl.sources.qqMusic, ((onDisk.crawl || {}).sources || {}).qqMusic || {});
    CONFIG.crawl.sources.weiboBand = Object.assign({}, DEFAULT_CONFIG.crawl.sources.weiboBand, ((onDisk.crawl || {}).sources || {}).weiboBand || {});
    CONFIG.crawl.sources.sinaFashion = Object.assign({}, DEFAULT_CONFIG.crawl.sources.sinaFashion, ((onDisk.crawl || {}).sources || {}).sinaFashion || {});
    CONFIG.crawl.sources.zhihu = Object.assign({}, DEFAULT_CONFIG.crawl.sources.zhihu, ((onDisk.crawl || {}).sources || {}).zhihu || {});
    CONFIG.crawl.backup = Object.assign({}, DEFAULT_CONFIG.crawl.backup, (onDisk.crawl || {}).backup || {});
    CONFIG.qwen = Object.assign({}, DEFAULT_CONFIG.qwen, onDisk.qwen || {});
    CONFIG.mediaEnhance = Object.assign({}, DEFAULT_CONFIG.mediaEnhance, onDisk.mediaEnhance || {});
    CONFIG.mediaEnhance.baiduImage = Object.assign({}, DEFAULT_CONFIG.mediaEnhance.baiduImage, ((onDisk.mediaEnhance || {}).baiduImage || {}));
    CONFIG.mediaEnhance.wikimedia = Object.assign({}, DEFAULT_CONFIG.mediaEnhance.wikimedia, ((onDisk.mediaEnhance || {}).wikimedia || {}));
    CONFIG.mediaEnhance.tmdb = Object.assign({}, DEFAULT_CONFIG.mediaEnhance.tmdb, ((onDisk.mediaEnhance || {}).tmdb || {}));
    if (!Array.isArray(CONFIG.categories) || !CONFIG.categories.length) CONFIG.categories = DEFAULT_CONFIG.categories;
  }
  return CONFIG;
}
function getQwenKey() {
  const k = (CONFIG.qwen && CONFIG.qwen.apiKey || '').trim();
  if (k) return k;
  if (process.env.QWEN_API_KEY) return process.env.QWEN_API_KEY.trim();
  const rc = readJsonSafe(KPL_RUNTIME_CONFIG, null);
  if (rc && (rc.qwenApiKey || rc.visionApiKey)) return String(rc.qwenApiKey || rc.visionApiKey).trim();
  return '';
}
function getTmdbKey() {
  const k = (CONFIG.mediaEnhance && CONFIG.mediaEnhance.tmdb && CONFIG.mediaEnhance.tmdb.apiKey || '').trim();
  if (k) return k;
  if (process.env.TMDB_API_KEY) return process.env.TMDB_API_KEY.trim();
  return '';
}
function categoryByKey(key) { return (CONFIG.categories || []).find(c => c.key === key) || null; }

// 娱乐频道是热榜内容流,不是行情页。综合热榜里会混入财经、产业、科技等词条,
// 这里统一做前台过滤与排序降权,后台仍保留原始内容方便人工编辑。
const PRIMARY_ENTERTAINMENT_CATEGORIES = new Set(['star', 'screen', 'fashion', 'music']);
const HARD_OFF_TOPIC_RE = /金价|黄金|白银|COMEX|伦敦现货|股市|股票|A股|港股|美股|涨停|跌停|行情|财报|债券|基金|楼市|关税|稀土|人造太阳|核聚变|空调业|废旧.*空调|家用空调中提取|淘宝闪购|健康卡|急送|供应链|产能|内销|外销|出口|进口|关税|能源|算力|芯片|半导体|央行|利率|汇率|GDP|通胀|降息|加息|查家底|教育初心/i;
const ENTERTAINMENT_TOPIC_RE = /明星|艺人|演员|导演|编剧|剧组|电视剧|电影|综艺|密逃|网剧|短剧|剧集|播出|定档|开播|主演|票房|预告|首映|片场|大结局|追剧|热度|配音|拟声|官宣阵容|导演组|官宣|恋情|分手|结婚|离婚|工作室|路透|生图|粉丝|偶像|顶流|代言人|疑似喊话|染黑发|圈内|摄影师|玫瑰婚|对打|红毯|造型|穿搭|时尚|妆容|品牌|代言|写真|高定|网红裤|棉绸|穿衣|单品|演唱会|新歌|专辑|歌手|音乐|单曲|乐队|巡演|舞台|演出|王力宏|胡歌|白鹿|霉霉|徐艺真|郭宇欣|黄灿灿|虞书欣|杨紫|刘烨|戚薇|刘宇宁|翟子路|张婧仪|周润发|张国荣|钟楚红|迈克尔|杰克逊|普拉达|野狗骨头|灿如繁星/i;
const VIRAL_SOCIAL_RE = /热搜|网红|社死|回应|争议|冲突|生气|赛后|世界杯|足球|球员|门将|姆巴佩|获刑|出逃|法院|判处|通报|网友|老板|免单|公共|事件|现场/i;
const SPORTS_TOPIC_RE = /世界杯|足球|球员|门将|主帅|球队|球迷|佛得角|巴拉圭|法国队|姆巴佩|马宁|大满贯|女单|湖人|詹姆斯|内马尔|TES|TSW|对战|四强/i;
const SOCIETY_TOPIC_RE = /高考|清华|网暴|医院|获刑|落榜|普京|俄罗斯|诺奖|国际|赛事|景区|管理|安全|死亡|教育机构|抢购大战|超市|公共事件|通报|法院|判处|违规|失当/i;
const SCREEN_HOT_RE = /电视剧|电影|综艺|密逃|网剧|短剧|剧集|播出|定档|开播|主演|导演|票房|预告|首映|片场|追剧|热度|配音|拟声|导演组|官宣阵容|扮演者重聚|西游记|野狗骨头|灿如繁星|普拉达/i;
const STAR_HOT_RE = /明星|艺人|演员|官宣|恋情|分手|结婚|离婚|工作室|路透|生图|粉丝|偶像|顶流|代言人|疑似喊话|染黑发|圈内的人缘|摄影师是谁|玫瑰婚|对打|发了蜡烛|胡歌|白鹿|霉霉|徐艺真|郭宇欣|黄灿灿|虞书欣|杨紫|刘烨|戚薇|刘宇宁|翟子路|张婧仪/i;
const FASHION_HOT_RE = /穿搭|时尚|造型|红毯|机场|妆容|美妆|品牌|代言|时尚大片|写真|高定|网红裤|棉绸|穿衣|单品|染黑发|深V|礼服|裙|发型|发色|同款/i;
const MUSIC_HOT_RE = /演唱会|新歌|专辑|歌手|音乐|单曲|乐队|巡演|舞台|演出|王力宏/i;
const LIFE_HOT_RE = /感官过载|有线耳机|翻红|爱干净|家里长啥样|年轻人|法拍房|吃饭|成年人|健康|养生|旅行|旅游|美食|宠物|家居|手机|吃播|网红儿童|生活方式/i;
const STYLE_SIGNAL_RE = /穿搭|时尚|造型|红毯|机场|妆容|美妆|高定|礼服|深V|裙|同款|发型|发色|写真|大片|生图|染黑发|网红裤|棉绸|单品|穿衣/i;
const FASHION_BILI_REJECT_RE = /腋毛|愚人节|同担拒否|梦女|表情包|由岐|花火|生日快乐|鼻子难do|下巴为什么|六尺之内|摩登表演舞|cos|不刮胡子|不理发|^新衣服[！!。]*$/i;
const SCREEN_BILI_ACCEPT_RE = /影视|剧|电影|综艺|密逃|短片|小剧场|剪辑|开播|神探|演员|导演|配音|拟声|预告|片场|纪录片|影评|剧评/i;

function topicText(v) {
  if (typeof v === 'string') return v;
  return [
    v && v.title,
    v && v.summary,
    v && v.body,
    v && v.author,
    v && v.source,
  ].filter(Boolean).join(' ');
}
function isHardOffTopic(v) {
  const t = topicText(v);
  return HARD_OFF_TOPIC_RE.test(t) && !ENTERTAINMENT_TOPIC_RE.test(t);
}
function isEntertainmentTopic(v) {
  const t = topicText(v);
  return ENTERTAINMENT_TOPIC_RE.test(t);
}
function isLowQualityPublicItem(it) {
  if (!it) return true;
  const source = String(it.source || '');
  const text = topicText(it);
  if (it.category === 'fashion' && source.startsWith('bilibili-')) return true;
  if (it.category === 'fashion' && FASHION_BILI_REJECT_RE.test(text)) return true;
  if (it.category === 'fashion' && !FASHION_HOT_RE.test(text)) return true;
  if (it.category === 'screen' && source.startsWith('bilibili-')) return true;
  if (it.category === 'life' && source.startsWith('bilibili-')) return true;
  if (it.category === 'life' && (SPORTS_TOPIC_RE.test(text) || SOCIETY_TOPIC_RE.test(text))) return true;
  return false;
}
function isPublicItem(it) {
  return !!(it && it.id && !it.hidden && !isHardOffTopic(it) && !isLowQualityPublicItem(it));
}
function itemImagePixels(it) {
  const imgs = Array.isArray(it && it.images) ? it.images : [];
  let best = 0;
  for (const im of imgs) {
    const w = Number(im && im.width || 0);
    const h = Number(im && im.height || 0);
    if (w && h) best = Math.max(best, w * h);
  }
  return best;
}
function itemHasUsableImage(it) {
  if (!it) return false;
  const pixels = itemImagePixels(it);
  if (pixels >= 240000) return true;
  const cover = String(it.cover || '');
  return /^\/yule-img\//.test(cover) && pixels >= 120000;
}
function normalizeTopicCategory(text, proposed) {
  const t = String(text || '');
  if (SPORTS_TOPIC_RE.test(t) && !MUSIC_HOT_RE.test(t) && !SCREEN_HOT_RE.test(t) && !STAR_HOT_RE.test(t)) return 'society';
  if (SOCIETY_TOPIC_RE.test(t) && !FASHION_HOT_RE.test(t) && !MUSIC_HOT_RE.test(t) && !SCREEN_HOT_RE.test(t) && !STAR_HOT_RE.test(t)) return 'society';
  if (MUSIC_HOT_RE.test(t)) return 'music';
  if (SCREEN_HOT_RE.test(t)) return 'screen';
  if (FASHION_HOT_RE.test(t)) return 'fashion';
  if (STAR_HOT_RE.test(t)) return 'star';
  if (LIFE_HOT_RE.test(t)) return 'life';
  return categoryByKey(proposed) ? proposed : 'society';
}
function shouldIngestHotTopic(text, source, category) {
  const t = String(text || '');
  const src = String(source || '');
  if (src === 'baidu-movie' || src === 'baidu-teleplay') return true;
  if (isHardOffTopic(t)) return false;
  const hasEntertainmentSignal = ENTERTAINMENT_TOPIC_RE.test(t);
  if (PRIMARY_ENTERTAINMENT_CATEGORIES.has(category)) return hasEntertainmentSignal;
  if (category === 'life') return LIFE_HOT_RE.test(t) || VIRAL_SOCIAL_RE.test(t);
  return hasEntertainmentSignal || VIRAL_SOCIAL_RE.test(t);
}
function trendingScore(it) {
  if (!it || isHardOffTopic(it)) return -1000000000;
  const rawHot = Math.max(0, Number(it.hotScore || 0));
  const cat = String(it.category || '');
  let score = Math.log10(rawHot + 10) * 1000;
  if (cat === 'star') score *= 1.95;
  else if (cat === 'music') score *= 1.9;
  else if (cat === 'screen') score *= 1.85;
  else if (cat === 'fashion') score *= 1.58;
  else if (cat === 'life') score *= 0.86;
  else if (cat === 'society') score *= 0.72;
  if (isEntertainmentTopic(it)) score += 2200;
  const source = String(it.source || '');
  if (source === 'weibo-hot') score += PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat) ? 3600 : 900;
  if (source === 'baidu-realtime' && PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat)) score += 3000;
  if (source === 'baidu-teleplay') score += 1200;
  if (source === 'baidu-movie') score += 500;
  if (source === 'iqiyi-rank') score += cat === 'screen' ? 9600 : 1600;
  if (source.startsWith('douban-')) score += cat === 'screen' ? 8200 : 1200;
  if (source === 'qq-music-rank') score += cat === 'music' ? 9800 : 1200;
  if (source === 'weibo-band') score += PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat) ? 5200 : 2600;
  if (source === 'style-hot') score += cat === 'fashion' ? 7600 : 1000;
  if (source === 'sina-fashion') score += cat === 'fashion' ? 7200 : 1000;
  if (source === 'zhihu-hot') score += cat === 'life' || cat === 'society' ? 4200 : 1000;
  if (source.startsWith('bilibili-')) score += PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat) ? 1800 : 900;
  if (PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat)) score += (cat === 'fashion' ? 350 : 700);
  const imgPixels = itemImagePixels(it);
  if (imgPixels >= Number((CONFIG.mediaEnhance || {}).minCoverPixels || 294000)) score += 850;
  else if (imgPixels >= 120000) score += 420;
  else score -= 550;
  if (!isEntertainmentTopic(it) && /世界杯|足球|球员|门将|姆巴佩|赛后|冲突/.test(topicText(it))) score -= 900;
  const ageMs = Date.now() - (Date.parse(it.createdAt || '') || Date.now());
  const ageHours = Math.max(0, ageMs / 3600000);
  score -= Math.min(ageHours, 120) * 4;
  return Math.round(score);
}

// ---------- 数据存储 ----------
function itemDir(category) { return path.join(ITEMS_DIR, category); }
function itemPath(category, id) { return path.join(itemDir(category), id + '.json'); }

function saveItem(item) {
  try {
    fs.mkdirSync(itemDir(item.category), { recursive: true });
    return writeJsonSafe(itemPath(item.category, item.id), item);
  } catch (err) { log('error', 'saveItem', err.message); return false; }
}
function listItems(category, opts = {}) {
  const out = [];
  const cats = category ? [category] : (CONFIG.categories || []).map(c => c.key);
  for (const cat of cats) {
    let files = [];
    try { files = fs.readdirSync(itemDir(cat)).filter(f => f.endsWith('.json')); } catch (_) { files = []; }
    for (const f of files) {
      const it = readJsonSafe(path.join(itemDir(cat), f), null);
      if (it && it.id && (opts.includeHidden || isPublicItem(it))) out.push(it);
    }
  }
  // 娱乐热榜分优先,再看原始热度与时间
  out.sort((a, b) => trendingScore(b) - trendingScore(a) ||
    (b.hotScore || 0) - (a.hotScore || 0) ||
    String(b.createdAt).localeCompare(String(a.createdAt)));
  return out;
}
function getItem(id) {
  const found = getItemWithPath(id);
  return found ? found.item : null;
}
function getItemWithPath(id) {
  for (const cat of (CONFIG.categories || []).map(c => c.key)) {
    const filePath = itemPath(cat, id);
    const it = readJsonSafe(filePath, null);
    if (it && it.id) return { item: it, filePath, category: cat };
  }
  return null;
}
function itemExists(category, id) {
  try { return fs.existsSync(itemPath(category, id)); } catch (_) { return false; }
}
function titleKey(title) {
  return String(title || '').replace(/\s+/g, '').replace(/[“”"'《》：:·,，.。!！?？]/g, '').toLowerCase();
}
function itemTitleExists(title) {
  const key = titleKey(title);
  if (!key) return false;
  return listItems('', { includeHidden: true }).some(it => titleKey(it && it.title) === key);
}
function cardOf(it) {
  const img = bestImage(it.images || []) || {};
  const bodyText = normalizeCopy(it.body || '');
  const summaryText = normalizeCopy(it.summary || '');
  const keepSourceSummary = /^(iqiyi-rank|douban-)/.test(String(it.source || ''));
  const displaySummary = !keepSourceSummary && bodyText.length > summaryText.length && summaryText.length < 120
    ? bodyText.slice(0, 160)
    : summaryText;
  return {
    id: it.id, category: it.category, title: it.title,
    cover: it.cover || (it.images && it.images[0] && it.images[0].src) || '',
    summary: publicCopyText(displaySummary || summaryText || ''),
    imageWidth: Number(img.width || 0), imageHeight: Number(img.height || 0),
    hotScore: it.hotScore || 0, rankScore: trendingScore(it),
    createdAt: it.createdAt, day: it.day,
  };
}
function publicItemOf(it) {
  if (!it) return null;
  return {
    id: it.id,
    category: it.category,
    title: it.title,
    summary: publicCopyText(it.summary || ''),
    body: publicCopyText(it.body || it.summary || ''),
    cover: it.cover || (it.images && it.images[0] && it.images[0].src) || '',
    images: Array.isArray(it.images) ? it.images.map(im => ({
      src: im && im.src,
      width: Number(im && im.width || 0),
      height: Number(im && im.height || 0),
    })).filter(im => im.src) : [],
    hotScore: it.hotScore || 0,
    rankScore: trendingScore(it),
    createdAt: it.createdAt,
    day: it.day,
  };
}
function adminItemOf(it) {
  if (!it) return null;
  return Object.assign({}, publicItemOf(it), {
    source: it.source || '',
    author: it.author || '',
    sourceUrl: it.sourceUrl || '',
    hidden: !!it.hidden,
    rawCategory: it.category || '',
  });
}

// 5 天 TTL 清理(同时删图)
function cleanupExpired() {
  const ttl = Number(CONFIG.ttlDays || 5);
  const cutoff = Date.now() - ttl * 24 * 3600 * 1000;
  let removed = 0;
  for (const cat of (CONFIG.categories || []).map(c => c.key)) {
    let files = [];
    try { files = fs.readdirSync(itemDir(cat)).filter(f => f.endsWith('.json')); } catch (_) { continue; }
    for (const f of files) {
      const it = readJsonSafe(path.join(itemDir(cat), f), null);
      if (!it) continue;
      const t = Date.parse(it.createdAt || '') || 0;
      if (t && t < cutoff) {
        try { fs.unlinkSync(path.join(itemDir(cat), f)); removed++; } catch (_) {}
        try { fs.rmSync(path.join(IMAGES_DIR, it.id), { recursive: true, force: true }); } catch (_) {}
      }
    }
  }
  // 每细分超出 perCategoryMax 的旧条目也修剪
  const max = Number(CONFIG.perCategoryMax || 50);
  for (const cat of (CONFIG.categories || []).map(c => c.key)) {
    const items = listItems(cat);
    if (items.length > max) {
      for (const it of items.slice(max)) {
        try { fs.unlinkSync(itemPath(cat, it.id)); removed++; } catch (_) {}
        try { fs.rmSync(path.join(IMAGES_DIR, it.id), { recursive: true, force: true }); } catch (_) {}
      }
    }
  }
  if (removed) log('info', `cleanup: 清理过期/超额 ${removed} 条`);
  return removed;
}

// ---------- 占位封面(无真实图时用,避免空白;后续被真实图替换) ----------
function placeholderCover(label, title) {
  const safe = String(title || label || '').slice(0, 14).replace(/[<>&]/g, '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='#2a3550'/><stop offset='1' stop-color='#1a1d2b'/></linearGradient></defs>` +
    `<rect width='400' height='300' fill='url(#g)'/>` +
    `<text x='200' y='150' fill='#7da0ff' font-family='sans-serif' font-size='22' ` +
    `text-anchor='middle' dominant-baseline='middle'>${safe}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function imageMeta(buf, ct) {
  try {
    if (ct && ct.includes('png') && buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
    }
    if (ct && /jpe?g/.test(ct)) {
      let offset = 2;
      while (offset + 9 < buf.length) {
        if (buf[offset] !== 0xff) break;
        const marker = buf[offset + 1];
        const len = buf.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xc3) {
          return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5), bytes: buf.length };
        }
        offset += 2 + len;
      }
    }
  } catch (_) {}
  return { width: 0, height: 0, bytes: buf.length };
}
function qualityOfImage(im) {
  const w = Number(im && im.width || 0), h = Number(im && im.height || 0);
  if (!w || !h) return 0;
  const landscape = w >= h ? 1.25 : 1;
  return w * h * landscape;
}
function bestImage(images) {
  return (images || []).slice().sort((a, b) => qualityOfImage(b) - qualityOfImage(a))[0] || null;
}

// ---------- 网络工具(全局 fetch,带超时,失败返回 null) ----------
async function fetchWithTimeout(url, opts = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, Object.assign({
      signal: ctrl.signal,
      headers: Object.assign({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      }, opts.headers || {}),
    }, opts));
    return res;
  } catch (err) {
    log('warn', 'fetch fail', url, err.message);
    return null;
  } finally { clearTimeout(t); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function absoluteHttpUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return 'https:' + s;
  if (s.startsWith('http://')) return s.replace(/^http:/, 'https:');
  if (s.startsWith('https://')) return s;
  return s;
}
function betterIqiyiImageUrl(url) {
  const u = absoluteHttpUrl(url);
  if (!/iqiyipic\.com/.test(u)) return u;
  return u.replace(/_(\d{2,4})_(\d{2,4})(\.jpe?g)(\?.*)?$/i, '_600_800$3$4');
}
function parseHeatNumber(text) {
  const s = String(text || '').replace(/,/g, '');
  const m = s.match(/([\d.]+)\s*(亿|万)?/);
  if (!m) return 0;
  const n = Number(m[1] || 0);
  if (m[2] === '亿') return Math.round(n * 100000000);
  if (m[2] === '万') return Math.round(n * 10000);
  return Math.round(n);
}
function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCharCode(Number(n)); } catch (_) { return _; }
    });
}
function stripHtml(s) {
  return normalizeCopy(decodeHtmlEntities(String(s || '').replace(/<[^>]*>/g, ' ')));
}

// 下载图片到 images/<id>/<n>.<ext>,返回本地可访问路径与尺寸;失败返回原 url
async function downloadImage(itemId, idx, url, referer) {
  if (!url || /^data:/.test(url)) return { src: url || '', width: 0, height: 0, bytes: 0 };
  try {
    const res = await fetchWithTimeout(url, { headers: referer ? { Referer: referer } : {} }, 20000);
    if (!res || !res.ok) return { src: url, width: 0, height: 0, bytes: 0 };
    const ct = res.headers.get('content-type') || '';
    if (!/image\//.test(ct)) return { src: url, width: 0, height: 0, bytes: 0 };
    const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg';
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return { src: url, width: 0, height: 0, bytes: buf.length }; // 太小多半是占位/防盗链图
    const meta = imageMeta(buf, ct);
    const dir = path.join(IMAGES_DIR, itemId);
    fs.mkdirSync(dir, { recursive: true });
    const fname = `${idx}.${ext}`;
    fs.writeFileSync(path.join(dir, fname), buf);
    return Object.assign({ src: `/yule-img/${itemId}/${fname}` }, meta);
  } catch (err) { log('warn', 'downloadImage', url, err.message); return { src: url, width: 0, height: 0, bytes: 0 }; }
}

async function searchBaiduImages(query, limit = 2) {
  if (!CONFIG.mediaEnhance || !CONFIG.mediaEnhance.enabled || !((CONFIG.mediaEnhance.baiduImage || {}).enabled)) return [];
  const q = normalizeCopy(query).slice(0, 80);
  if (!q) return [];
  const rn = Math.max(3, Math.min(12, Number(limit || 2) * 3));
  const api = `https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&word=${encodeURIComponent(q)}&pn=0&rn=${rn}`;
  const res = await fetchWithTimeout(api, { headers: { Referer: 'https://image.baidu.com/' } }, 12000);
  if (!res || !res.ok) return [];
  let data = null;
  try { data = await res.json(); } catch (_) { return []; }
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows
    .map(row => ({
      url: row.middleURL || row.hoverURL || row.thumbURL || '',
      title: row.fromPageTitleEnc || row.fromPageTitle || '',
      width: Number(row.width || 0),
      height: Number(row.height || 0),
    }))
    .filter(row => row.url && row.width >= 360 && row.height >= 220)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))
    .slice(0, Math.max(1, Math.min(4, Number(limit || 2))));
}

async function enhanceItemImages(found) {
  const it = found && found.item;
  if (!it || itemHasUsableImage(it)) return false;
  const cat = categoryByKey(it.category) || {};
  const query = `${it.title} ${cat.label || ''}`.trim();
  const candidates = await searchBaiduImages(query, Number((CONFIG.mediaEnhance.baiduImage || {}).perItem || 2));
  if (!candidates.length) return false;
  const nextImages = Array.isArray(it.images) ? it.images.filter(im => im && im.src && /^\/yule-img\//.test(String(im.src))) : [];
  const start = nextImages.length;
  for (let i = 0; i < candidates.length; i++) {
    const local = await downloadImage(it.id, start + i, candidates[i].url, 'https://image.baidu.com/');
    if (local && local.src && /^\/yule-img\//.test(local.src) && qualityOfImage(local) >= 120000) {
      local.source = 'baidu-image';
      nextImages.push(local);
    }
    await sleep(250);
  }
  if (!nextImages.length) return false;
  const coverImage = bestImage(nextImages);
  it.images = nextImages;
  it.cover = (coverImage && coverImage.src) || it.cover;
  it.imageEnhancedAt = nowIso();
  it.updatedAt = nowIso();
  saveItem(it);
  log('info', `imageEnhance [${it.category}] ${it.title.slice(0, 24)} (img:${nextImages.length})`);
  return true;
}

async function enhanceMissingImages(maxRun) {
  if (!CONFIG.mediaEnhance || !CONFIG.mediaEnhance.enabled || !((CONFIG.mediaEnhance.baiduImage || {}).enabled)) return 0;
  const max = Math.max(0, Math.min(40, Number(maxRun || (CONFIG.mediaEnhance.baiduImage || {}).maxPerRun || 18)));
  if (!max) return 0;
  let added = 0;
  const candidates = listItems('', { includeHidden: false })
    .filter(it => !itemHasUsableImage(it))
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, max);
  for (const it of candidates) {
    const found = getItemWithPath(it.id);
    if (await enhanceItemImages(found).catch(err => { log('warn', 'imageEnhance', err.message); return false; })) added++;
    await sleep(Math.max(500, (CONFIG.crawl.gentleDelayMs || 3000) / 4));
  }
  if (added) log('info', `imageEnhance: 补图 ${added} 条`);
  return added;
}

// ---------- qwen 生成/润色文案(可选,失败回退到原始文本) ----------
async function qwenWrite(title, rawText, label) {
  if (!CONFIG.qwen || !CONFIG.qwen.enabled) return rawText || title || '';
  const key = getQwenKey();
  if (!key) return rawText || title || '';
  const prompt = `你是 Qi 娱乐频道的站内编辑。根据下面的热点信息,写 260-420 字中文站内详情正文,分 2-3 段。` +
    `要求:第一段交代已确认信息和来源语境;第二段解释为什么值得关注、读者应看哪些变化;必要时第三段补充后续看点。` +
    `不要标题、不要 emoji、不要夸张营销词、不要外链引导;不要编造素材里没有的事实。` +
    `如果素材不足,明确说明目前可确认的信息有限,并只围绕标题与公开热度做分析。\n板块:${label || ''}\n标题:${title}\n素材:${rawText || '(无)'}`;
  try {
    const res = await fetchWithTimeout(CONFIG.qwen.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: CONFIG.qwen.model || 'qwen-plus',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 900, temperature: 0.55,
      }),
    }, 25000);
    if (!res || !res.ok) return rawText || title || '';
    const data = await res.json();
    const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return (txt && txt.trim()) || rawText || title || '';
  } catch (err) { log('warn', 'qwenWrite', err.message); return rawText || title || ''; }
}

function normalizeCopy(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}
function normalizeBodyCopy(s) {
  return String(s || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
function sourceReadable(source) {
  const s = normalizeCopy(source);
  if (s.includes('weibo-band')) return '微博领域热榜';
  if (s.includes('style-hot')) return '时尚热点';
  if (s.includes('sina-fashion')) return '时尚资讯';
  if (s.includes('weibo')) return '微博热搜';
  if (s.includes('baidu-movie')) return '百度电影榜';
  if (s.includes('baidu-teleplay')) return '百度电视剧榜';
  if (s.includes('baidu')) return '百度热榜';
  if (s.includes('iqiyi')) return '爱奇艺风云榜';
  if (s.includes('douban')) return '豆瓣热门片单';
  if (s.includes('qq-music')) return 'QQ音乐流行指数榜';
  if (s.includes('zhihu')) return '知乎热榜';
  if (s.includes('bilibili')) return 'B站热门榜';
  if (s.includes('toutiao')) return '今日头条搜索';
  if (s === 'seed') return '站内样例';
  return s || '公开热榜';
}
function publicCopyText(text) {
  return normalizeBodyCopy(String(text || '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/爱奇艺总榜/g, '热播总榜')
    .replace(/爱奇艺电视剧榜/g, '电视剧热播榜')
    .replace(/爱奇艺综艺榜/g, '综艺热播榜')
    .replace(/爱奇艺电影榜/g, '电影热播榜')
    .replace(/爱奇艺风云榜|微博领域热榜|微博热搜|百度电影榜|百度电视剧榜|百度热榜|豆瓣热门片单|B站热门榜|QQ音乐流行指数榜|知乎热榜|今日头条搜索|时尚资讯|公开热榜/g, '当前热榜')
    .replace(/爱奇艺|百度|豆瓣|B站|QQ音乐|网易云音乐|知乎|今日头条|新浪时尚|新浪/g, '')
    .replace(/出现在当前热榜中,?/g, '已进入当前热榜,')
    .replace(/进入当前热榜后/g, '进入当前热榜后')
    .replace(/微博热搜 · [^。\n]+/g, '热度信号')
    .replace(/讨论来源/g, '讨论背景')
    .replace(/标题、来源和热度线索/g, '标题和热度线索')
    .replace(/来源和/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/。{2,}/g, '。'));
}
function stripThinGeneratedCopy(text) {
  const t = normalizeCopy(text);
  if (!t) return '';
  if (/进入.*后,?成为.*板块里值得留意的一条动态/.test(t)) return '';
  if (/本轮被归入.*适合放在站内做连续观察/.test(t)) return '';
  if (/这条内容可以在后台继续补写/.test(t)) return '';
  return t;
}
function categoryWatchLine(label) {
  return {
    明星热点: '这类明星话题的看点不只在单个标题,还在后续是否出现当事方回应、工作室补充、粉丝讨论扩散,以及它会不会影响正在播出或待播作品的关注度。',
    影视综艺: '影视综艺内容更适合连续追踪:一看平台或片方是否继续释放物料,二看阵容、档期和口碑变化,三看热度是否从粉丝圈层扩散到普通观众讨论。',
    时尚穿搭: '时尚穿搭内容需要看两个层面:一是造型、发型、妆容或单品本身有没有辨识度,二是它是否带动同款搜索、二创模仿和社交平台的审美讨论。',
    音乐现场: '音乐现场类热点要重点看现场反馈、歌手状态、作品传播和后续演出安排;如果话题来自事故或争议,还需要等待主办方、团队或平台的进一步说明。',
    社会热点: '社会热点在娱乐频道里只保留高讨论度内容。阅读时应区分已确认事实、当事方说法和网友讨论,后续以权威发布或主流媒体更新为准。',
    生活方式: '生活方式话题适合从真实使用场景切入:它为什么被讨论、是否代表一种消费或审美变化,以及普通用户能从中得到什么参考。',
  }[label] || '后续可以继续关注公开信息是否补充、讨论热度是否延续,以及话题是否出现新的当事方回应。';
}
function isThinSourceFact(text) {
  const t = normalizeCopy(text);
  return !t ||
    /^微博热搜( · [^。]{1,8})?$/.test(t) ||
    /^B站[^。]* · 播放 [\d,]+/.test(t) ||
    /^百度热榜$/.test(t);
}
function titleAngleLine(title, label) {
  const t = normalizeCopy(title);
  if (label === '时尚穿搭') {
    if (/染黑发|染发|发色|发型/.test(t)) return '从标题看,讨论点集中在发色变化和整体造型呈现。此类话题通常会被放大到肤色适配、妆容协调、镜头状态以及同款审美几个层面。';
    if (/网红裤|棉绸|穿搭|单品|衣服|裤/.test(t)) return '从标题看,讨论点集中在热门单品的实际穿着体验。它既有消费参考价值,也容易引发关于价格、面料、版型和社交场景的讨论。';
    return '从标题看,这条内容更偏造型或审美趋势观察,重点在它是否带动同款搜索、模仿穿搭和社交平台二次传播。';
  }
  if (label === '影视综艺') {
    if (/官宣阵容|阵容/.test(t)) return '从标题看,核心信息是节目或项目阵容释放。阵容官宣往往会直接影响观众期待值,也会带动嘉宾适配度、节目玩法和播出节奏的讨论。';
    if (/开播|热度|滤镜|播出/.test(t)) return '从标题看,核心信息与播出表现或观众反馈有关。后续更值得关注的是口碑是否稳定、讨论是否破圈,以及平台热度能否延续。';
    if (/配音|从业者|免费劳动力/.test(t)) return '从标题看,它涉及影视制作链条里的幕后劳动和行业生态。相比单纯作品热度,这类内容更适合关注从业者处境、平台规则和行业回应。';
    return '从标题看,这条内容与近期影视、剧集或综艺讨论有关,适合继续观察物料更新、平台热度和观众反馈。';
  }
  if (label === '明星热点') {
    if (/疑似|曝|泄漏|回应|感谢|人缘|对打|出场/.test(t)) return '从标题看,这类明星话题主要靠社交传播扩散。读者需要分清已公开信息、网友解读和未经证实的说法,再看后续是否有本人或团队回应。';
    return '从标题看,这条内容与艺人公开动态或社交讨论有关,重点在热度是否持续、话题是否影响作品曝光和粉丝互动。';
  }
  if (label === '音乐现场') {
    if (/受伤|事故|缝|调查/.test(t)) return '从标题看,这条音乐现场话题涉及安全和责任问题。相比普通演出反馈,后续更应关注伤情说明、责任调查、主办方回应和后续演出安排。';
    return '从标题看,这条内容与音乐作品、现场演出或舞台传播有关,重点在作品讨论、现场反馈和艺人后续动态。';
  }
  if (label === '生活方式') {
    return '从标题看,这条生活方式内容已经具备公共讨论属性。它的价值在于呈现一种具体生活场景,并观察网友反馈是否代表更普遍的消费、习惯或情绪变化。';
  }
  if (label === '社会热点') {
    return '从标题看,这条内容涉及公共事件或社会讨论。阅读时应优先看已确认事实和权威后续,再判断网友观点与现场信息之间的边界。';
  }
  return '从标题看,这条内容已经形成公开讨论,后续重点在更多事实是否补充、热度是否延续。';
}
function summaryFromBody(body, max = 180) {
  const clean = normalizeCopy(body);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const p = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf('，'));
  return (p > 70 ? cut.slice(0, p + 1) : cut).trim();
}
function localEditorialCopy({ title, rawText, label, source }) {
  const cleanTitle = normalizeCopy(title);
  const cleanRaw = stripThinGeneratedCopy(rawText);
  const cleanLabel = normalizeCopy(label || '热点');
  const fact = cleanRaw && cleanRaw !== cleanTitle && !isThinSourceFact(cleanRaw) ? cleanRaw : '';
  const lead = `「${cleanTitle}」已进入本轮${cleanLabel}列表。这说明它已经不只是单条动态,而是进入了公开讨论场,适合放在站内做连续观察。`;
  const middle = fact
    ? `目前可确认的信息是:${fact.replace(/[。.!！?？]$/, '')}。这些信息能帮助读者先抓住事件主体、讨论来源和最初的热度信号,但仍不等于完整结论。`
    : `${titleAngleLine(cleanTitle, cleanLabel)}目前公开素材仍偏短,站内先保留标题、来源和热度线索,让读者不用跳到外部平台,也能快速知道它为什么被推到当前列表里。`;
  const watch = categoryWatchLine(cleanLabel);
  const close = `后续如果出现更清晰的官方信息、当事方回应、作品物料或现场反馈,这条内容可以在后台继续补写,前台详情页会直接展示更新后的站内正文。`;
  return normalizeBodyCopy(`${lead}\n\n${middle}${watch}\n\n${close}`);
}
async function editorialCopy({ title, rawText, label, source }) {
  if (/^(iqiyi-rank|douban-)/.test(String(source || '')) && normalizeCopy(rawText).length >= 80) {
    return localEditorialCopy({ title, rawText, label, source });
  }
  const aiText = await qwenWrite(title, rawText, label);
  const cleanAi = normalizeBodyCopy(aiText);
  if (normalizeCopy(cleanAi).length >= 180 && normalizeCopy(cleanAi) !== normalizeCopy(title)) return cleanAi;
  return localEditorialCopy({ title, rawText, label, source });
}

// ---------- 把一条采集结果落库(统一入口,含图片下载) ----------
async function ingest({ category, title, summary, body, source, sourceUrl, author, hotScore, imageUrls, referer }) {
  if (!title) return null;
  const cat = categoryByKey(category) ? category : (CONFIG.categories[0] && CONFIG.categories[0].key);
  const id = hashId(cat, source || '', title, sourceUrl || '');
  if (itemExists(cat, id)) return null; // 去重
  if (itemTitleExists(title)) return null; // 跨板块去重,避免综合榜重复进入
  // 下载图片(最多 9 张)
  const images = [];
  const urls = (imageUrls || []).filter(Boolean).slice(0, 9);
  for (let i = 0; i < urls.length; i++) {
    const local = await downloadImage(id, i, urls[i], referer);
    if (local && local.src) images.push(local);
  }
  const catObj = categoryByKey(cat);
  const finalBody = normalizeBodyCopy(body || summary || '');
  const finalSummary = normalizeCopy(summary || finalBody).slice(0, 220);
  const coverImage = bestImage(images);
  const cover = (coverImage && coverImage.src) || placeholderCover(catObj && catObj.label, title);
  const item = {
    id, category: cat, title: String(title).slice(0, 120),
    summary: finalSummary,
    body: finalBody || finalSummary,
    cover,
    images,
    source: source || 'unknown', sourceUrl: sourceUrl || '',
    author: author || '', hotScore: Number(hotScore || 0),
    createdAt: nowIso(), day: todayStamp(),
  };
  if (saveItem(item)) { log('info', `ingest [${cat}] ${item.title.slice(0, 24)} (img:${images.length}, src:${item.source})`); return item; }
  return null;
}

function shouldRefreshBody(it, minLen) {
  const body = normalizeCopy(it && it.body || '');
  if (body.length < Number(minLen || 240)) return true;
  return /进入.*后,?成为.*板块里值得留意的一条动态|目前公开信息仍偏简短|后续可以关注|这些信息能帮助读者先抓住事件主体|不等于完整结论/.test(body);
}

function expandExistingShortBodies(minLen = 240) {
  loadConfig();
  let changed = 0;
  const items = listItems('', { includeHidden: true });
  for (const it of items) {
    if (!it || it.hidden || !it.id || !categoryByKey(it.category)) continue;
    const found = getItemWithPath(it.id);
    if (!found || !shouldRefreshBody(found.item, minLen)) continue;
    const label = (categoryByKey(found.item.category) || {}).label || '';
    const raw = stripThinGeneratedCopy(found.item.summary || '') || stripThinGeneratedCopy(found.item.body || '');
    const nextBody = localEditorialCopy({
      title: found.item.title,
      rawText: raw,
      label,
      source: found.item.source,
    });
    if (normalizeCopy(nextBody).length < 180) continue;
    found.item.body = nextBody;
    found.item.summary = summaryFromBody(raw, 180) || summaryFromBody(nextBody, 180);
    found.item.updatedAt = nowIso();
    if (saveItem(found.item)) changed++;
  }
  if (changed) log('info', `copyExpand: 扩写 ${changed} 条详情正文`);
  return changed;
}

// ===================== 采集器 =====================
// 关键词分类器:把通用热榜词条分到各娱乐/社会板块。
const CAT_RULES = [
  ['screen',  /剧|电视剧|电影|综艺|密逃|播出|定档|开播|主演|演员|导演|票房|预告|首映|大结局|追剧|片场|热度|配音|拟声|导演组/],
  ['music',   /演唱会|新歌|专辑|歌手|音乐|单曲|乐队|巡演|演出|live/i],
  ['fashion', /穿搭|时尚|造型|红毯|机场|妆容|品牌|代言|大片|写真|时装|发型|高定|网红裤|棉绸|穿衣/],
  ['star',    /官宣|恋情|分手|结婚|离婚|工作室|路透|生图|顶流|明星|出道|塌房|绯闻|恋爱|代言|代言人|感谢|疑似喊话|染黑发|圈内|摄影师|玫瑰婚|对打|粉丝见面/],
  ['life',    /美食|旅游|旅行|健康|养生|攻略|菜谱|减肥|宠物|家居|天气|景点|打卡|感官过载|有线耳机|翻红|爱干净|年轻人|法拍房|吃饭|成年人|手机|吃播|网红儿童/],
];
function classifyCategory(text) {
  const t = String(text || '');
  // 先匹配各板块的 seeds(如 star:田曦薇)
  for (const c of (CONFIG.categories || [])) {
    if (Array.isArray(c.seeds) && c.seeds.some(s => s && t.includes(s))) return c.key;
  }
  const normalized = normalizeTopicCategory(t, '');
  if (PRIMARY_ENTERTAINMENT_CATEGORIES.has(normalized)) return normalized;
  const keys = new Set((CONFIG.categories || []).map(c => c.key));
  for (const [k, re] of CAT_RULES) if (keys.has(k) && re.test(t)) return k;
  return keys.has('society') ? 'society' : (CONFIG.categories[0] && CONFIG.categories[0].key);
}
function countCat(cat) { return listItems(cat).length; }
function collectLimitFor(cat, target, source) {
  const base = Number(target || CONFIG.crawl.perCategoryTarget || 8);
  const max = Number(CONFIG.perCategoryMax || 50);
  const src = String(source || '');
  if (src === 'weibo-hot' || src === 'baidu-realtime') {
    return PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat) ? Math.max(max + 8, base + 8) : base;
  }
  if (src === 'iqiyi-rank' || src.startsWith('douban-')) {
    return cat === 'screen' ? Math.max(max + 18, base + 18) : base;
  }
  if (src === 'qq-music-rank') return cat === 'music' ? Math.max(max + 14, base + 14) : base;
  if (src === 'sina-fashion') return cat === 'fashion' ? Math.max(max + 16, base + 16) : base;
  if (src === 'style-hot') return cat === 'fashion' ? Math.max(max + 14, base + 14) : base;
  if (src === 'weibo-band') return PRIMARY_ENTERTAINMENT_CATEGORIES.has(cat) ? Math.max(max + 10, base + 10) : Math.max(max + 4, base + 4);
  if (src === 'zhihu-hot') return (cat === 'life' || cat === 'society') ? Math.max(max + 8, base + 8) : base;
  if (src.startsWith('bilibili-')) return Math.max(max + 4, base + 4);
  return base;
}

// qwen 批量分类:把多条热点一次性分到各板块 key(失败回退关键词分类器)。
async function qwenClassify(texts) {
  const keys = (CONFIG.categories || []).map(c => c.key);
  if (!texts.length) return [];
  const key = (CONFIG.qwen && CONFIG.qwen.enabled) ? getQwenKey() : '';
  if (!key) return texts.map(t => classifyCategory(t));
  const catList = (CONFIG.categories || []).map(c => `${c.key}(${c.label})`).join('、');
  const numbered = texts.map((t, i) => `${i}. ${String(t).slice(0, 50)}`).join('\n');
  const prompt = `把下面每条热点分类到这些板块之一,只用板块 key:${catList}。` +
    `规则:明星八卦/恋情/官宣→star;影视剧综艺→screen;时尚穿搭红毯→fashion;歌手演唱会音乐→music;` +
    `社会/体育/突发→society;美食旅游生活健康→life;财经、股市、金价、产业、能源、科技政策不要误分到时尚或娱乐。` +
    `只返回一个 JSON 数组,元素是每行对应的板块 key,顺序与输入一致,不要任何多余文字。\n${numbered}`;
  try {
    const res = await fetchWithTimeout(CONFIG.qwen.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: CONFIG.qwen.model || 'qwen-plus', messages: [{ role: 'user', content: prompt }], max_tokens: 1200, temperature: 0 }),
    }, 30000);
    if (!res || !res.ok) return texts.map(t => classifyCategory(t));
    const data = await res.json();
    let txt = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    txt = txt.replace(/```json|```/g, '').trim();
    const m = txt.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(m ? m[0] : txt);
    return texts.map((t, i) => keys.includes(arr[i]) ? arr[i] : classifyCategory(t));
  } catch (e) { log('warn', 'qwenClassify', e.message); return texts.map(t => classifyCategory(t)); }
}

// 通用百度榜采集。forcedCat 非空则全部归该板块(影视榜);否则 qwen 批量分类。
async function ingestBaiduBoard(tab, forcedCat, target) {
  let added = 0;
  const res = await fetchWithTimeout(`https://top.baidu.com/api/board?platform=pc&tab=${tab}`,
    { headers: { Referer: 'https://top.baidu.com/' } }, 15000);
  await sleep((CONFIG.crawl.gentleDelayMs || 3000) / 2);
  if (!res || !res.ok) { log('warn', `baidu ${tab} 不可用`); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const arr = (((data.data || {}).cards || [])[0] || {}).content || [];
  if (!Array.isArray(arr) || !arr.length) return 0;
  const cats = forcedCat ? arr.map(() => forcedCat)
    : await qwenClassify(arr.map(r => (r.word || r.query || '') + ' ' + (r.desc || '')));
  for (let i = 0; i < arr.length; i++) {
    const row = arr[i];
    const title = row.word || row.query || '';
    if (!title) continue;
    const desc = row.desc || '';
    let cat = forcedCat || normalizeTopicCategory(`${title} ${desc}`, cats[i]);
    if (!categoryByKey(cat)) cat = 'society';
    const source = `baidu-${tab}`;
    if (!shouldIngestHotTopic(`${title} ${desc}`, source, cat)) continue;
    if (!categoryByKey(cat) || countCat(cat) >= collectLimitFor(cat, target, source)) continue;
    const label = (categoryByKey(cat) || {}).label;
    const body = await editorialCopy({ title, rawText: desc, label, source });
    const it = await ingest({
      category: cat, title, summary: (desc || body).slice(0, 180), body,
      source, sourceUrl: row.url || row.rawUrl || '',
      hotScore: Number(row.hotScore || 0) || 0,
      imageUrls: row.img ? [row.img] : [], referer: 'https://top.baidu.com/',
    });
    if (it) { added++; await sleep((CONFIG.crawl.gentleDelayMs || 3000) / 2); }
  }
  return added;
}

// 微博官方热搜:真实 title + 热度(无真实图,占位封面),qwen 批量分类。
async function ingestWeiboHot(target) {
  let added = 0;
  const res = await fetchWithTimeout('https://weibo.com/ajax/side/hotSearch',
    { headers: { Referer: 'https://weibo.com/' } }, 15000);
  await sleep((CONFIG.crawl.gentleDelayMs || 3000) / 2);
  if (!res || !res.ok) { log('warn', 'weiboHot 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const list = ((data.data && data.data.realtime) || []).filter(r => r.word);
  if (!list.length) return 0;
  const cats = await qwenClassify(list.map(r => r.word));
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const title = row.word;
    let cat = normalizeTopicCategory(title, cats[i]);
    if (!categoryByKey(cat)) cat = 'society';
    if (!shouldIngestHotTopic(title, 'weibo-hot', cat)) continue;
    if (countCat(cat) >= collectLimitFor(cat, target, 'weibo-hot')) continue;
    const label = (categoryByKey(cat) || {}).label;
    const body = await editorialCopy({ title, rawText: row.label_name ? `微博热搜 · ${row.label_name}` : '', label, source: 'weibo-hot' });
    const it = await ingest({
      category: cat, title, summary: row.label_name ? `微博热搜 · ${row.label_name}` : '微博热搜', body,
      source: 'weibo-hot', sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
      hotScore: Number(row.num || 0) || 0, imageUrls: [],
    });
    if (it) { added++; await sleep((CONFIG.crawl.gentleDelayMs || 3000) / 3); }
  }
  return added;
}

function biliHotScore(stat, row) {
  const s = stat || {};
  const r = row || {};
  return Math.round(
    Number(s.view || s.vv || r.play || 0) +
    Number(s.like || 0) * 10 +
    Number(s.coin || 0) * 14 +
    Number(s.favorite || 0) * 6 +
    Number(s.reply || r.video_review || 0) * 18 +
    Number(s.share || 0) * 24 +
    Number(s.danmaku || 0) * 4
  );
}

function biliVideoUrl(row) {
  if (row && row.bvid) return `https://www.bilibili.com/video/${row.bvid}`;
  if (row && row.aid) return `https://www.bilibili.com/video/av${row.aid}`;
  return 'https://www.bilibili.com/v/popular/rank/all';
}

function shouldUseBiliRow(category, row) {
  const title = normalizeCopy(row && row.title || '');
  const tname = normalizeCopy(row && row.tname || '');
  const text = `${title} ${tname}`;
  if (!title || isHardOffTopic(text)) return false;
  if (category === 'fashion') {
    // B站时尚分区榜单当前混入大量 cosplay、梗图和个人挑战,先不作为时尚新闻源。
    return false;
  }
  if (category === 'screen') {
    // 影视综艺要贴近近期片单、剧集和综艺热度,不直接采 B 站创作榜。
    return false;
  }
  if (category === 'star') {
    return /明星|娱乐|艺人|偶像|演员|idol|cover|舞台|徐明浩|赵露思|苏新皓|创造营|曹璐|THE 8/i.test(text);
  }
  if (category === 'music') {
    return /音乐|翻唱|演奏|歌|曲|乐评|MV|Intro|唢呐|循环|组合|SMTR/i.test(text);
  }
  if (category === 'life') return false;
  return true;
}

async function ingestBilibiliRanking(category, rid, target) {
  const cfg = (((CONFIG.crawl || {}).sources || {}).bilibili || {});
  if (!cfg.enabled || !rid || !categoryByKey(category)) return 0;
  let added = 0;
  const urls = [
    `https://api.bilibili.com/x/web-interface/ranking/v2?rid=${encodeURIComponent(rid)}&type=all`,
    `https://api.bilibili.com/x/web-interface/ranking?rid=${encodeURIComponent(rid)}&day=3`,
  ];
  let list = [];
  for (const api of urls) {
    const res = await fetchWithTimeout(api, { headers: { Referer: 'https://www.bilibili.com/' } }, 15000);
    await sleep(Math.max(600, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
    if (!res || !res.ok) continue;
    let data = null; try { data = await res.json(); } catch (_) { data = null; }
    const arr = data && data.data && (Array.isArray(data.data.list) ? data.data.list : Array.isArray(data.data) ? data.data : []);
    if (Array.isArray(arr) && arr.length) { list = arr; break; }
  }
  if (!list.length) { log('warn', `bilibili ${category}/${rid} 不可用`); return 0; }
  const limit = collectLimitFor(category, target, `bilibili-${category}`);
  for (const row of list.slice(0, 24)) {
    const title = normalizeCopy(row.title || '');
    if (!title || isHardOffTopic(title)) continue;
    if (!shouldUseBiliRow(category, row)) continue;
    if (countCat(category) >= limit) break;
    const tname = normalizeCopy(row.tname || '');
    const desc = normalizeCopy(row.desc || row.dynamic || '');
    const stat = row.stat || {};
    const views = Number(stat.view || stat.vv || row.play || 0);
    const likes = Number(stat.like || 0);
    const comments = Number(stat.reply || row.video_review || 0);
    const hotParts = [`播放 ${views.toLocaleString('zh-CN')}`];
    if (likes) hotParts.push(`点赞 ${likes.toLocaleString('zh-CN')}`);
    if (comments) hotParts.push(`评论/弹幕 ${comments.toLocaleString('zh-CN')}`);
    const hotText = `B站${tname || '热门'} · ${hotParts.join(' · ')}`;
    const rawText = [desc && desc !== '-' ? desc : '', hotText].filter(Boolean).join('。');
    const label = (categoryByKey(category) || {}).label;
    const body = await editorialCopy({ title, rawText, label, source: `bilibili-${category}` });
    const pic = row.pic ? String(row.pic).replace(/^http:/, 'https:') : '';
    const it = await ingest({
      category,
      title,
      summary: (rawText || body).slice(0, 180),
      body,
      source: `bilibili-${category}`,
      sourceUrl: biliVideoUrl(row),
      author: row.owner && row.owner.name || '',
      hotScore: biliHotScore(stat, row),
      imageUrls: pic ? [pic] : [],
      referer: 'https://www.bilibili.com/',
    });
    if (it) { added++; await sleep(Math.max(800, (CONFIG.crawl.gentleDelayMs || 3000) / 4)); }
  }
  log('info', `bilibili[${category}/${rid}]: +${added}`);
  return added;
}

async function collectBilibiliHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).bilibili || {});
  if (!cfg.enabled) return 0;
  const target = Math.max(CONFIG.crawl.perCategoryTarget || 8, Number(cfg.perCategory || 4));
  const rankings = cfg.rankings || {};
  let added = 0;
  for (const [cat, rid] of Object.entries(rankings)) {
    if (!categoryByKey(cat)) continue;
    try { added += await ingestBilibiliRanking(cat, rid, target); }
    catch (e) { log('warn', `bilibili-${cat}`, e.message); }
  }
  log('info', `collectBilibiliHot: 新增 ${added} 条`);
  return added;
}

function parseIqiyiRankItems(html, pageUrl, rankLabel) {
  const out = [];
  const boxRe = /<a\b([^>]*class="[^"]*\brvi__box\b[^"]*"[^>]*)>([\s\S]*?)(?=<a\b[^>]*class="[^"]*\brvi__box\b|<script\b|<\/body>)/g;
  let m;
  while ((m = boxRe.exec(html))) {
    const attrs = m[1] || '';
    const body = m[2] || '';
    const href = absoluteHttpUrl((attrs.match(/\bhref="([^"]+)"/) || [])[1] || pageUrl);
    const img = betterIqiyiImageUrl((body.match(/<img src="([^"]+)"[^>]*class="i71-img"/) || [])[1] || '');
    const rank = Number((body.match(/class="rvi__num[^"]*"[^>]*>(\d+)<\/span>/) || [])[1] || out.length + 1);
    const titleRaw = (body.match(/class="rvi__tit1"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '';
    const title = stripHtml(titleRaw.replace(/<span[^>]*>\d+<\/span>/, ''));
    const type = stripHtml((body.match(/class="rvi__type1"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
    const desc = stripHtml((body.match(/class="rvi__des2"[^>]*>([\s\S]*?)<\/p>/) || [])[1] || '');
    const heat = Number(stripHtml((body.match(/class="rvi__index__num"[^>]*>([^<]+)/) || [])[1] || '0').replace(/[^\d.]/g, '')) || 0;
    if (!title) continue;
    if (!/电影|电视剧|综艺|短剧/.test(type) && !/电影|电视剧|综艺|短剧|开播|热播|阵容|节目/.test(`${title} ${desc}`)) continue;
    out.push({ rank, title, type, desc, heat, img, href, rankLabel });
  }
  return out;
}

async function ingestIqiyiRank(channel, rankLabel, target) {
  const cfg = (((CONFIG.crawl || {}).sources || {}).iqiyi || {});
  if (!cfg.enabled || !categoryByKey('screen')) return 0;
  const pageUrl = `https://www.iqiyi.com/ranks1/${encodeURIComponent(channel)}/0`;
  const res = await fetchWithTimeout(pageUrl, { headers: { Referer: 'https://www.iqiyi.com/' } }, 18000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', `iqiyiRank ${channel} 不可用`); return 0; }
  const html = await res.text();
  const rows = parseIqiyiRankItems(html, pageUrl, rankLabel).slice(0, Number(cfg.perRun || 16));
  let added = 0;
  const limit = collectLimitFor('screen', target, 'iqiyi-rank');
  for (const row of rows) {
    if (countCat('screen') >= limit) break;
    if (!shouldIngestHotTopic(`${row.title} ${row.type} ${row.desc}`, 'iqiyi-rank', 'screen')) continue;
    const label = (categoryByKey('screen') || {}).label;
    const rawText = [
      `爱奇艺${row.rankLabel || '风云榜'}第${row.rank || ''}名`,
      row.heat ? `实时热度 ${row.heat}` : '',
      row.type,
      row.desc,
    ].filter(Boolean).join('。');
    const body = await editorialCopy({ title: row.title, rawText, label, source: 'iqiyi-rank' });
    const hotScore = Math.max(0, row.heat) * 100000 + Math.max(0, 80 - Number(row.rank || 80)) * 1000;
    const it = await ingest({
      category: 'screen',
      title: row.title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'iqiyi-rank',
      sourceUrl: row.href || pageUrl,
      author: '爱奇艺风云榜',
      hotScore,
      imageUrls: row.img ? [row.img] : [],
      referer: pageUrl,
    });
    if (it) { added++; await sleep(Math.max(600, (CONFIG.crawl.gentleDelayMs || 3000) / 5)); }
  }
  log('info', `iqiyiRank[${channel}/${rankLabel}]: +${added}`);
  return added;
}

async function collectIqiyiScreenHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).iqiyi || {});
  if (!cfg.enabled) return 0;
  const target = Math.max(CONFIG.crawl.perCategoryTarget || 8, Number(cfg.perRun || 16));
  const ranks = Array.isArray(cfg.ranks) && cfg.ranks.length ? cfg.ranks : DEFAULT_CONFIG.crawl.sources.iqiyi.ranks;
  let added = 0;
  for (const r of ranks) {
    try { added += await ingestIqiyiRank(r.channel, r.label, target); }
    catch (e) { log('warn', `iqiyi-${r && r.channel}`, e.message); }
  }
  log('info', `collectIqiyiScreenHot: 新增 ${added} 条`);
  return added;
}

async function ingestDoubanCollection(collectionId, collectionLabel, target) {
  const cfg = (((CONFIG.crawl || {}).sources || {}).douban || {});
  if (!cfg.enabled || !collectionId || !categoryByKey('screen')) return 0;
  const count = Math.max(3, Math.min(12, Number(cfg.perCollection || 6)));
  const api = `https://m.douban.com/rexxar/api/v2/subject_collection/${encodeURIComponent(collectionId)}/items?os=ios&for_mobile=1&start=0&count=${count}`;
  const res = await fetchWithTimeout(api, {
    headers: {
      Referer: 'https://m.douban.com/',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
    },
  }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', `douban ${collectionId} 不可用`); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = Array.isArray(data.subject_collection_items) ? data.subject_collection_items : [];
  let added = 0;
  const limit = collectLimitFor('screen', target, `douban-${collectionId}`);
  for (let i = 0; i < rows.length; i++) {
    if (countCat('screen') >= limit) break;
    const row = rows[i] || {};
    const title = normalizeCopy(row.title || '');
    if (!title) continue;
    const rating = row.rating || {};
    const ratingText = Number(rating.value || 0)
      ? `豆瓣评分 ${Number(rating.value).toFixed(1)}，${Number(rating.count || 0).toLocaleString('zh-CN')} 人评价`
      : '';
    const rawText = [
      `豆瓣${collectionLabel || '热门片单'}第${i + 1}名`,
      normalizeCopy(row.card_subtitle || row.info || ''),
      normalizeCopy(row.comment || row.description || ''),
      ratingText,
    ].filter(Boolean).join('。');
    if (!shouldIngestHotTopic(`${title} ${rawText}`, `douban-${collectionId}`, 'screen')) continue;
    const label = (categoryByKey('screen') || {}).label;
    const body = await editorialCopy({ title, rawText, label, source: `douban-${collectionId}` });
    const cover = row.cover && row.cover.url ? absoluteHttpUrl(row.cover.url) : '';
    const hotScore = 7200000 - i * 120000 + Math.min(2000000, Number(rating.count || 0) * 10) + Number(rating.value || 0) * 10000;
    const it = await ingest({
      category: 'screen',
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: `douban-${collectionId}`,
      sourceUrl: row.url || '',
      author: '豆瓣热门片单',
      hotScore,
      imageUrls: cover ? [cover] : [],
      referer: 'https://m.douban.com/',
    });
    if (it) { added++; await sleep(Math.max(600, (CONFIG.crawl.gentleDelayMs || 3000) / 5)); }
  }
  log('info', `douban[${collectionId}/${collectionLabel}]: +${added}`);
  return added;
}

async function collectDoubanScreenHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).douban || {});
  if (!cfg.enabled) return 0;
  const target = Math.max(CONFIG.crawl.perCategoryTarget || 8, Number(cfg.perCollection || 6));
  const collections = Array.isArray(cfg.collections) && cfg.collections.length ? cfg.collections : DEFAULT_CONFIG.crawl.sources.douban.collections;
  let added = 0;
  for (const c of collections) {
    try { added += await ingestDoubanCollection(c.id, c.label, target); }
    catch (e) { log('warn', `douban-${c && c.id}`, e.message); }
  }
  log('info', `collectDoubanScreenHot: 新增 ${added} 条`);
  return added;
}

async function collectScreenFocusedHot() {
  let added = 0;
  try { added += await collectIqiyiScreenHot(); } catch (e) { log('warn', 'iqiyiScreenHot', e.message); }
  try { added += await collectDoubanScreenHot(); } catch (e) { log('warn', 'doubanScreenHot', e.message); }
  return added;
}

function qqMusicCover(albummid) {
  const mid = normalizeCopy(albummid);
  return mid ? `https://y.qq.com/music/photo_new/T002R800x800M000${mid}.jpg?max_age=2592000` : '';
}

async function collectQQMusicHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).qqMusic || {});
  if (!cfg.enabled || !categoryByKey('music')) return 0;
  const count = Math.max(6, Math.min(30, Number(cfg.perRun || 12)));
  const topId = Number(cfg.topId || 4);
  const api = `https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?topid=${encodeURIComponent(topId)}&tpl=3&page=detail&type=top&song_begin=0&song_num=${count}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`;
  const res = await fetchWithTimeout(api, { headers: { Referer: 'https://y.qq.com/' } }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', 'qqMusicRank 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = Array.isArray(data.songlist) ? data.songlist : [];
  let added = 0;
  const limit = collectLimitFor('music', CONFIG.crawl.perCategoryTarget || 8, 'qq-music-rank');
  for (let i = 0; i < rows.length; i++) {
    if (countCat('music') >= limit) break;
    const row = rows[i] || {};
    const d = row.data || {};
    const song = normalizeCopy(d.songname || d.songorig || '');
    const singers = Array.isArray(d.singer) ? d.singer.map(s => normalizeCopy(s && s.name)).filter(Boolean).join(' / ') : '';
    if (!song) continue;
    const title = singers ? `${singers}《${song}》` : song;
    const indexValue = Number(row.Franking_value || row.cur_count || 0) || 0;
    const rawText = [
      `${cfg.label || '流行指数榜'}第${i + 1}名`,
      indexValue ? `指数 ${indexValue.toLocaleString('zh-CN')}` : '',
      singers ? `歌手 ${singers}` : '',
      d.albumname ? `专辑 ${d.albumname}` : '',
      data.date ? `榜单日期 ${data.date}` : '',
    ].filter(Boolean).join('。');
    const label = (categoryByKey('music') || {}).label;
    const body = await editorialCopy({ title, rawText, label, source: 'qq-music-rank' });
    const hotScore = indexValue * 1000 + Math.max(0, 80 - i) * 10000;
    const img = qqMusicCover(d.albummid);
    const it = await ingest({
      category: 'music',
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'qq-music-rank',
      sourceUrl: d.songmid ? `https://y.qq.com/n/ryqq/songDetail/${encodeURIComponent(d.songmid)}` : 'https://y.qq.com/n/ryqq/toplist/4',
      author: singers,
      hotScore,
      imageUrls: img ? [img] : [],
      referer: 'https://y.qq.com/',
    });
    if (it) { added++; await sleep(Math.max(500, (CONFIG.crawl.gentleDelayMs || 3000) / 6)); }
  }
  log('info', `collectQQMusicHot: 新增 ${added} 条`);
  return added;
}

function classifyWeiboBandRow(row) {
  const category = normalizeCopy(row && row.category || '');
  const text = `${normalizeCopy(row && row.word || '')} ${normalizeCopy(row && row.note || '')} ${category}`;
  if (/艺人|明星/.test(category)) return 'star';
  if (/综艺|剧集|电影|短剧/.test(category)) return 'screen';
  if (/音乐|演唱会|歌手/.test(category) || MUSIC_HOT_RE.test(text)) return 'music';
  if (/时尚|美妆|服饰|美容/.test(category) || FASHION_HOT_RE.test(text)) return 'fashion';
  if (/美食|情感|数码|健康|旅游|旅行|家居|互联网|幽默/.test(category) || LIFE_HOT_RE.test(text)) return 'life';
  if (/民生新闻|社会|海外新闻|国内时政|国际|体育|电竞/.test(category) || VIRAL_SOCIAL_RE.test(text)) return 'society';
  return normalizeTopicCategory(text, classifyCategory(text));
}

async function collectWeiboBandHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).weiboBand || {});
  if (!cfg.enabled) return 0;
  const res = await fetchWithTimeout('https://weibo.com/ajax/statuses/hot_band', { headers: { Referer: 'https://weibo.com/' } }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', 'weiboBand 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = (((data || {}).data || {}).band_list || []).filter(r => r && r.word).slice(0, Number(cfg.perRun || 60));
  let added = 0;
  for (const row of rows) {
    const title = normalizeCopy(row.word || row.note || '');
    if (!title) continue;
    const cat = classifyWeiboBandRow(row);
    if (!categoryByKey(cat)) continue;
    if (isHardOffTopic(`${title} ${row.category || ''}`)) continue;
    if (!shouldIngestHotTopic(`${title} ${row.category || ''} ${row.field_tag || ''}`, 'weibo-band', cat)) continue;
    if (countCat(cat) >= collectLimitFor(cat, CONFIG.crawl.perCategoryTarget || 8, 'weibo-band')) continue;
    const label = (categoryByKey(cat) || {}).label;
    const rawText = [
      normalizeCopy(row.field_tag || ''),
      row.detail_tag && row.detail_tag.content ? normalizeCopy(row.detail_tag.content) : '',
      row.label_name ? `标签 ${row.label_name}` : '',
    ].filter(Boolean).join('。');
    const body = await editorialCopy({ title, rawText, label, source: 'weibo-band' });
    const it = await ingest({
      category: cat,
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'weibo-band',
      sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(title)}`,
      hotScore: Number(row.num || 0) || 0,
      imageUrls: [],
    });
    if (it) { added++; await sleep(Math.max(350, (CONFIG.crawl.gentleDelayMs || 3000) / 8)); }
  }
  log('info', `collectWeiboBandHot: 新增 ${added} 条`);
  return added;
}

function fashionAngleTitle(title) {
  const base = normalizeCopy(title).replace(/\s+/g, '');
  if (!base) return '';
  if (STYLE_SIGNAL_RE.test(base)) return base;
  return `${base}造型讨论`;
}

function shouldUseStyleHotRow(row) {
  const title = normalizeCopy(row && (row.word || row.note) || '');
  const category = normalizeCopy(row && row.category || '');
  const detail = normalizeCopy(row && row.detail_tag && row.detail_tag.content || '');
  const text = `${title} ${category} ${normalizeCopy(row && row.field_tag || '')} ${detail}`;
  if (!title || isHardOffTopic(text) || SPORTS_TOPIC_RE.test(text)) return false;
  if (!STYLE_SIGNAL_RE.test(text)) return false;
  if (/艺人|明星|娱乐|时尚|美妆|电影|电视剧|剧集|综艺|音乐|演唱会/.test(text)) return true;
  return /网红裤|棉绸|穿搭|妆容|美妆|穿衣|单品|礼服|高定|红毯/.test(text);
}

async function collectStyleFocusedHot() {
  if (!categoryByKey('fashion')) return 0;
  const cfg = (((CONFIG.crawl || {}).sources || {}).weiboBand || {});
  const limit = collectLimitFor('fashion', CONFIG.crawl.perCategoryTarget || 8, 'style-hot');
  if (countCat('fashion') >= limit) return 0;
  const res = await fetchWithTimeout('https://weibo.com/ajax/statuses/hot_band', { headers: { Referer: 'https://weibo.com/' } }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', 'styleHot 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = (((data || {}).data || {}).band_list || []).filter(shouldUseStyleHotRow).slice(0, Number(cfg.perRun || 60));
  let added = 0;
  for (const row of rows) {
    if (countCat('fashion') >= limit) break;
    const baseTitle = normalizeCopy(row.word || row.note || '');
    const title = fashionAngleTitle(baseTitle);
    if (!title) continue;
    const detail = normalizeCopy(row && row.detail_tag && row.detail_tag.content || '');
    const rawText = [
      detail,
      normalizeCopy(row.field_tag || ''),
      '这条内容的时尚看点集中在造型、妆发、单品和社交平台讨论度,适合从穿搭审美与同款传播角度整理。',
    ].filter(Boolean).join('。');
    const label = (categoryByKey('fashion') || {}).label;
    const body = await editorialCopy({ title, rawText, label, source: 'style-hot' });
    let images = [];
    try {
      images = (await searchBaiduImages(`${title} 高清 时尚`, 2)).map(x => x.url).filter(Boolean);
    } catch (_) { images = []; }
    const it = await ingest({
      category: 'fashion',
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'style-hot',
      sourceUrl: `https://s.weibo.com/weibo?q=${encodeURIComponent(baseTitle)}`,
      hotScore: Number(row.num || 0) || 0,
      imageUrls: images,
      referer: 'https://image.baidu.com/',
    });
    if (it) { added++; await sleep(Math.max(450, (CONFIG.crawl.gentleDelayMs || 3000) / 7)); }
  }
  log('info', `collectStyleFocusedHot: 新增 ${added} 条`);
  return added;
}

function sinaFashionImage(row) {
  const pics = row && row.allPics && Array.isArray(row.allPics.pics) ? row.allPics.pics : [];
  const first = pics[0] || {};
  const url = first.originalImg || first.imgurl || row && row.img || '';
  return normalizeCopy(url).replace(/^http:/, 'https:');
}

function sinaFashionHotScore(row, index) {
  const when = Date.parse(row && row.cdateTime || '') || Date.now();
  const ageDays = Math.max(0, (Date.now() - when) / 86400000);
  const comment = Number(row && row.comment || 0) || 0;
  return Math.max(1000, Math.round(650000 - Math.min(ageDays, 60) * 12000 + comment * 3500 + Math.max(0, 40 - index) * 2200));
}

async function collectSinaFashionHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).sinaFashion || {});
  if (!cfg.enabled || !categoryByKey('fashion')) return 0;
  const limit = collectLimitFor('fashion', CONFIG.crawl.perCategoryTarget || 8, 'sina-fashion');
  if (countCat('fashion') >= limit) return 0;
  const api = 'https://interface.sina.cn/wap_api/layout_col.d.json?showcid=315&col=315&level=1&page=1&act=more&jsoncallback=';
  const res = await fetchWithTimeout(api, { headers: { Referer: 'https://fashion.sina.cn/', Accept: 'application/json' } }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', 'sinaFashion 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = (((data || {}).result || {}).data || {}).list || [];
  let added = 0;
  for (let i = 0; i < rows.length && i < Math.max(6, Math.min(30, Number(cfg.perRun || 12))); i++) {
    if (countCat('fashion') >= limit) break;
    const row = rows[i] || {};
    const title = normalizeCopy(row.title || row.stitle || '');
    if (!title) continue;
    const summary = normalizeCopy(row.summary || row.intro || '');
    const stitle = normalizeCopy(row.stitle || '');
    const text = `${title} ${summary} ${stitle}`;
    if (isHardOffTopic(text) || SPORTS_TOPIC_RE.test(text)) continue;
    if (!FASHION_HOT_RE.test(text)) continue;
    const label = (categoryByKey('fashion') || {}).label;
    const rawText = [
      summary && summary !== title ? summary : '',
      stitle ? `关键词 ${stitle}` : '',
      row.cdateTime ? `发布时间 ${row.cdateTime}` : '',
      '站内整理重点放在单品、版型、妆发和适用场景,让读者不用离开本站也能看懂这条时尚内容的核心看点。',
    ].filter(Boolean).join('。');
    const body = await editorialCopy({ title, rawText, label, source: 'sina-fashion' });
    const img = sinaFashionImage(row);
    const it = await ingest({
      category: 'fashion',
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'sina-fashion',
      sourceUrl: normalizeCopy(row.URL || row.pc_url || 'https://fashion.sina.cn/'),
      hotScore: sinaFashionHotScore(row, i),
      imageUrls: img ? [img] : [],
      referer: 'https://fashion.sina.cn/',
    });
    if (it) { added++; await sleep(Math.max(500, (CONFIG.crawl.gentleDelayMs || 3000) / 6)); }
  }
  log('info', `collectSinaFashionHot: 新增 ${added} 条`);
  return added;
}

function classifyZhihuHotRow(title, excerpt) {
  const text = `${title || ''} ${excerpt || ''}`;
  if (SPORTS_TOPIC_RE.test(text) || SOCIETY_TOPIC_RE.test(text)) return 'society';
  if (MUSIC_HOT_RE.test(text)) return 'music';
  if (SCREEN_HOT_RE.test(text)) return 'screen';
  if (/吃|美食|手机|电脑|笔记本|游戏|旅行|旅游|情感|女朋友|生活|上大学|蛋白质|健康|牙|空调|照片|心理/.test(text)) return 'life';
  return 'society';
}

async function collectZhihuHot() {
  const cfg = (((CONFIG.crawl || {}).sources || {}).zhihu || {});
  if (!cfg.enabled) return 0;
  const limitRows = Math.max(10, Math.min(50, Number(cfg.perRun || 30)));
  const api = `https://api.zhihu.com/topstory/hot-list?limit=${limitRows}&desktop=true`;
  const res = await fetchWithTimeout(api, { headers: { Referer: 'https://www.zhihu.com/hot', Accept: 'application/json' } }, 16000);
  await sleep(Math.max(700, (CONFIG.crawl.gentleDelayMs || 3000) / 5));
  if (!res || !res.ok) { log('warn', 'zhihuHot 不可用'); return 0; }
  let data = null; try { data = await res.json(); } catch (_) { return 0; }
  const rows = Array.isArray(data.data) ? data.data : [];
  let added = 0;
  for (let i = 0; i < rows.length; i++) {
    const target = rows[i] && rows[i].target || {};
    const title = normalizeCopy(target.title || '');
    if (!title) continue;
    const excerpt = normalizeCopy(target.excerpt || '');
    const cat = classifyZhihuHotRow(title, excerpt);
    if (!categoryByKey(cat)) continue;
    if (cat !== 'life' && cat !== 'society' && cat !== 'music') continue;
    if (isHardOffTopic(`${title} ${excerpt}`)) continue;
    if (countCat(cat) >= collectLimitFor(cat, CONFIG.crawl.perCategoryTarget || 8, 'zhihu-hot')) continue;
    const heatText = normalizeCopy(rows[i].detail_text || '');
    const rawText = [
      `热榜第${i + 1}名`,
      heatText,
      excerpt,
    ].filter(Boolean).join('。');
    const label = (categoryByKey(cat) || {}).label;
    const body = await editorialCopy({ title, rawText, label, source: 'zhihu-hot' });
    const qid = target.id || '';
    const it = await ingest({
      category: cat,
      title,
      summary: summaryFromBody(rawText, 180) || summaryFromBody(body, 180),
      body,
      source: 'zhihu-hot',
      sourceUrl: qid ? `https://www.zhihu.com/question/${qid}` : '',
      hotScore: parseHeatNumber(heatText),
      imageUrls: [],
    });
    if (it) { added++; await sleep(Math.max(350, (CONFIG.crawl.gentleDelayMs || 3000) / 8)); }
  }
  log('info', `collectZhihuHot: 新增 ${added} 条`);
  return added;
}

async function collectOtherFocusedHot() {
  let added = 0;
  try { added += await collectQQMusicHot(); } catch (e) { log('warn', 'qqMusicHot', e.message); }
  try { added += await collectWeiboBandHot(); } catch (e) { log('warn', 'weiboBandHot', e.message); }
  try { added += await collectStyleFocusedHot(); } catch (e) { log('warn', 'styleFocusedHot', e.message); }
  try { added += await collectSinaFashionHot(); } catch (e) { log('warn', 'sinaFashionHot', e.message); }
  try { added += await collectZhihuHot(); } catch (e) { log('warn', 'zhihuHot', e.message); }
  return added;
}

// 备胎总入口(均无需签名、已验证可用):
//   影视榜/电视剧榜 → 影视综艺(带真实图);realtime + 微博热搜 → qwen 分类到各板块。
async function collectBackup() {
  const bk = CONFIG.crawl.backup || {};
  if (!bk.enabled) return 0;
  const target = CONFIG.crawl.perCategoryTarget || 8;
  let added = 0;
  // 影视综艺优先使用平台实时榜与热播片单,避免只靠综合热搜碰运气。
  try { added += await collectScreenFocusedHot(); } catch (e) { log('warn', 'screenFocusedHot', e.message); }
  // 其他栏目也优先用更贴近栏目属性的热榜源。
  try { added += await collectOtherFocusedHot(); } catch (e) { log('warn', 'otherFocusedHot', e.message); }
  // 影视专属榜(内容对口、带真实图)→ 影视综艺
  if (categoryByKey('screen')) {
    try { added += await ingestBaiduBoard('movie', 'screen', target); } catch (e) { log('warn', 'baidu-movie', e.message); }
    try { added += await ingestBaiduBoard('teleplay', 'screen', target); } catch (e) { log('warn', 'baidu-teleplay', e.message); }
  }
  // 综合热榜 → qwen 分类铺到各板块
  try { added += await ingestBaiduBoard('realtime', null, target); } catch (e) { log('warn', 'baidu-realtime', e.message); }
  try { added += await ingestWeiboHot(target); } catch (e) { log('warn', 'weiboHot', e.message); }
  try { added += await collectBilibiliHot(); } catch (e) { log('warn', 'bilibiliHot', e.message); }
  log('info', `collectBackup: 新增 ${added} 条`);
  return added;
}

// 主源:今日头条搜索(相对好拿)。best-effort,被风控就静默返回 0。
async function collectToutiao(category, keyword) {
  if (!(CONFIG.crawl.sources.toutiao && CONFIG.crawl.sources.toutiao.enabled)) return 0;
  const kw = keyword || (categoryByKey(category) || {}).label || '';
  if (!kw) return 0;
  let added = 0;
  try {
    const api = `https://www.toutiao.com/api/search/content/?aid=24&app_name=web_search&offset=0&format=json` +
      `&keyword=${encodeURIComponent(kw)}&autoload=true&count=10&en_qc=1&from=search_tab`;
    const res = await fetchWithTimeout(api, {
      headers: { 'Referer': 'https://www.toutiao.com/', 'Accept': 'application/json' },
    }, 15000);
    await sleep(CONFIG.crawl.gentleDelayMs || 3000);
    if (!res || !res.ok) return 0;
    let data = null; try { data = await res.json(); } catch (_) { return 0; }
    const list = (data && data.data) || [];
    for (const row of Array.isArray(list) ? list : []) {
      const title = row.title || (row.cell_ctrls && row.title) || '';
      if (!title) continue;
      const combinedText = `${title} ${row.abstract || ''}`;
      const nextCat = normalizeTopicCategory(combinedText, category);
      if (!shouldIngestHotTopic(combinedText, 'toutiao', nextCat)) continue;
      const imgs = [];
      if (Array.isArray(row.image_list)) for (const im of row.image_list) if (im && im.url) imgs.push(im.url.replace(/^http:/, 'https:'));
      if (row.large_image_url) imgs.unshift(row.large_image_url);
      const url = row.article_url || (row.share_url) || '';
      const label = (categoryByKey(nextCat) || {}).label;
      const body = await editorialCopy({ title, rawText: row.abstract || '', label, source: 'toutiao' });
      const it = await ingest({
        category: nextCat, title, summary: (row.abstract || '').slice(0, 100), body,
        source: 'toutiao', sourceUrl: url, author: row.source || '',
        hotScore: Number(row.comment_count || 0) || 0,
        imageUrls: imgs, referer: 'https://www.toutiao.com/',
      });
      if (it) added++;
      const target = CONFIG.crawl.perCategoryTarget || 8;
      if (listItems(nextCat).length >= collectLimitFor(nextCat, target, 'toutiao')) break;
      await sleep(CONFIG.crawl.gentleDelayMs || 3000);
    }
  } catch (err) { log('warn', 'collectToutiao', err.message); }
  log('info', `collectToutiao[${category}/${kw}]: +${added}`);
  return added;
}

// 主源:小红书。反爬极强(x-s/x-t 签名 + 登录态),云端机房 IP 极易被封。
// 这里放占位实现:尝试一次,失败/被风控就静默返回 0,完全靠头条 + 备胎兜底。
// TODO: 若 IP 被封频繁,可接入家用机采集或带签名/cookie 的方案。
async function collectXiaohongshu(category, keyword) {
  if (!(CONFIG.crawl.sources.xiaohongshu && CONFIG.crawl.sources.xiaohongshu.enabled)) return 0;
  // 当前不做强行爬取(避免云端 IP 被风控连带影响后续请求),留接口位。
  return 0;
}

// 采集编排:逐板块、慢节奏。主源优先填到 target,不足再靠备胎。
let CRAWL_RUNNING = false;
async function runCollect(reason) {
  if (CRAWL_RUNNING) { log('info', 'runCollect: 上一轮还在跑,跳过'); return; }
  CRAWL_RUNNING = true;
  log('info', `runCollect 开始 (${reason || 'manual'})`);
  try {
    if (CONFIG.crawl.enabled) {
      for (const cat of CONFIG.categories) {
        const seeds = (cat.seeds && cat.seeds.length) ? cat.seeds : [cat.label];
        for (const kw of seeds) {
          try { await collectXiaohongshu(cat.key, kw); } catch (e) { log('warn', 'xhs', e.message); }
          try { await collectToutiao(cat.key, kw); } catch (e) { log('warn', 'tt', e.message); }
          if (listItems(cat.key).length >= (CONFIG.crawl.perCategoryTarget || 8)) break;
        }
      }
    }
    // 备胎兜底
    try { await collectBackup(); } catch (e) { log('warn', 'backup', e.message); }
    // 热搜源经常只有标题,采集结束后统一给高热无图内容补本地封面
    try { await enhanceMissingImages(); } catch (e) { log('warn', 'imageEnhance', e.message); }
    // 清理过期
    cleanupExpired();
    const state = readJsonSafe(STATE_PATH, {});
    state.lastCollectAt = nowIso();
    state.lastCollectReason = reason || 'manual';
    writeJsonSafe(STATE_PATH, state);
  } catch (err) {
    log('error', 'runCollect', err.stack || err.message);
  } finally {
    CRAWL_RUNNING = false;
    log('info', 'runCollect 结束');
  }
}

// ---------- 样例种子(首次启动无数据时,保证前端有东西可看) ----------
async function seedIfEmpty() {
  const total = listItems().length;
  if (total > 0) return;
  log('info', 'seedIfEmpty: 无数据,写入样例');
  const samples = [
    { category: 'star', title: '田曦薇近期热点合集', summary: '近期作品与活动路透聚合。',
      body: '田曦薇近期出席多场活动并有新作官宣,相关话题在社交平台持续发酵。本条为样例占位,正式采集上线后将自动替换为真实图文。' },
    { category: 'screen', title: '本周热播剧集口碑盘点', summary: '本周热度与讨论度较高的剧集。',
      body: '样例占位:正式采集后展示本周热播影视的剧情看点、演员阵容与观众讨论。' },
    { category: 'fashion', title: '当季流行穿搭趋势', summary: '本季时尚关键词与单品。',
      body: '样例占位:正式采集后展示当季流行色、廓形与街拍灵感。' },
    { category: 'society', title: '今日社会热点速览', summary: '今日值得关注的社会新闻。',
      body: '样例占位:正式采集后聚合今日热榜社会新闻要点。' },
  ];
  for (const s of samples) {
    await ingest({ category: s.category, title: s.title, summary: s.summary, body: s.body,
      source: 'seed', hotScore: 1, imageUrls: [] });
  }
}

// ===================== HTTP 服务 =====================
function sendJson(res, code, obj) {
  const buf = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
  res.end(buf);
}
const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
// 缓存策略与主服务 sendStatic 对齐:HTML 无论是否带 ?v= 一律 no-cache;
// 一年 immutable 只给带版本参数的字体/CSS/JS/图片;未版本化资产 1 天短缓存。
function fileCacheControl(ext, versioned) {
  if (ext === '.html') return 'no-cache';
  if (versioned && ['.ttf', '.woff', '.woff2', '.otf', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico'].includes(ext)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=86400';
}
function serveFile(req, res, filePath) {
  try {
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const versioned = /[?&]v=[^&]/.test(String(req?.url || ''));
    const st = fs.statSync(filePath);
    const etag = `"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': fileCacheControl(ext, versioned), 'ETag': etag };
    if (req?.headers?.['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return; }
    if (req?.method === 'HEAD') { res.writeHead(200, headers); res.end(); return; }
    const buf = fs.readFileSync(filePath);
    res.writeHead(200, headers);
    res.end(buf);
  } catch (err) { res.writeHead(500); res.end('err'); }
}

function readReqJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        try { req.destroy(); } catch (_) {}
        resolve({});
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}
function cleanText(v, max) {
  return String(v == null ? '' : v).slice(0, max);
}
function updateAdminItem(id, patch) {
  const found = getItemWithPath(id);
  if (!found) return null;
  const item = Object.assign({}, found.item);
  const nextCategory = categoryByKey(patch.category) ? patch.category : item.category;
  if (Object.prototype.hasOwnProperty.call(patch, 'title')) item.title = cleanText(patch.title, 120);
  if (Object.prototype.hasOwnProperty.call(patch, 'summary')) item.summary = cleanText(patch.summary, 240);
  if (Object.prototype.hasOwnProperty.call(patch, 'body')) item.body = cleanText(patch.body, 6000);
  if (Object.prototype.hasOwnProperty.call(patch, 'source')) item.source = cleanText(patch.source, 80);
  if (Object.prototype.hasOwnProperty.call(patch, 'author')) item.author = cleanText(patch.author, 80);
  if (Object.prototype.hasOwnProperty.call(patch, 'sourceUrl')) item.sourceUrl = cleanText(patch.sourceUrl, 1000);
  if (Object.prototype.hasOwnProperty.call(patch, 'hotScore')) item.hotScore = Number(patch.hotScore || 0);
  if (Object.prototype.hasOwnProperty.call(patch, 'hidden')) item.hidden = !!patch.hidden;
  item.category = nextCategory;
  item.updatedAt = nowIso();

  try {
    fs.mkdirSync(itemDir(item.category), { recursive: true });
    writeJsonSafe(itemPath(item.category, item.id), item);
    if (found.filePath !== itemPath(item.category, item.id)) {
      try { fs.unlinkSync(found.filePath); } catch (_) {}
    }
    return item;
  } catch (err) {
    log('error', 'updateAdminItem', err.message);
    return null;
  }
}
function deleteAdminItem(id) {
  const found = getItemWithPath(id);
  if (!found) return false;
  try { fs.unlinkSync(found.filePath); } catch (_) {}
  try { fs.rmSync(path.join(IMAGES_DIR, id), { recursive: true, force: true }); } catch (_) {}
  return true;
}

const YULE_PAGE = path.join(SCRIPT_DIR, 'yule.html');
const YULE_ADMIN_PAGE = path.join(SCRIPT_DIR, 'yule-admin.html');
const SHARED_VENDOR_DIR = path.join(SCRIPT_DIR, 'Qi', 'vendor');

function vendorFontPath(pathname) {
  const raw = String(pathname || '');
  if (raw === '/vendor/dreamerqi-fonts.css') return path.join(SHARED_VENDOR_DIR, 'dreamerqi-fonts.css');
  if (!raw.startsWith('/vendor/fonts/')) return '';
  const fileName = decodeURIComponent(raw.slice('/vendor/fonts/'.length));
  if (!/^[a-z0-9._-]+\.(ttf|woff2?|otf)$/i.test(fileName)) return '';
  return path.join(SHARED_VENDOR_DIR, 'fonts', fileName);
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const p = u.pathname;

    if (p === '/health' || p === '/api/yule/health') {
      return sendJson(res, 200, { ok: true, service: 'yule', port: PORT, items: listItems().length, state: readJsonSafe(STATE_PATH, {}) });
    }
    // 频道页 + 站内详情页: 支持 stanning.dreamerqi.com 根路径,也保留 /yule 兼容入口。
    if (p === '/' || p === '/index.html' || p === '/yule' || p === '/yule/' || p === '/yule.html' ||
        p.startsWith('/item/') || p.startsWith('/yule/item/')) {
      return serveFile(req, res, YULE_PAGE);
    }
    if (p === '/yule-admin' || p === '/yule-admin/' || p === '/yule-admin.html') {
      return serveFile(req, res, YULE_ADMIN_PAGE);
    }
    const vendorFile = vendorFontPath(p);
    if (vendorFile) return serveFile(req, res, vendorFile);
    if (p === '/api/yule/admin/items') {
      const items = listItems('', { includeHidden: true }).map(adminItemOf);
      return sendJson(res, 200, { ok: true, items, categories: CONFIG.categories || [] });
    }
    if (p.startsWith('/api/yule/admin/item/')) {
      const id = p.slice('/api/yule/admin/item/'.length);
      if (req.method === 'GET') {
        const found = getItemWithPath(id);
        if (!found) return sendJson(res, 404, { ok: false, error: 'not found' });
        return sendJson(res, 200, { ok: true, item: adminItemOf(found.item), categories: CONFIG.categories || [] });
      }
      if (req.method === 'PATCH') {
        const patch = await readReqJson(req);
        const item = updateAdminItem(id, patch);
        if (!item) return sendJson(res, 404, { ok: false, error: 'not found' });
        return sendJson(res, 200, { ok: true, item: adminItemOf(item) });
      }
      if (req.method === 'DELETE') {
        const ok = deleteAdminItem(id);
        return sendJson(res, ok ? 200 : 404, { ok, error: ok ? undefined : 'not found' });
      }
    }
    // 板块列表(含每板块数量)
    if (p === '/api/yule/categories') {
      const cats = (CONFIG.categories || []).map(c => ({
        key: c.key, label: c.label, emoji: c.emoji || '',
        count: listItems(c.key).length,
      }));
      return sendJson(res, 200, { ok: true, categories: cats });
    }
    // 卡片列表
    if (p === '/api/yule/list') {
      const cat = u.searchParams.get('category') || '';
      const items = (cat ? listItems(cat) : listItems()).slice(0, Number(CONFIG.perCategoryMax || 50) * (cat ? 1 : 10));
      return sendJson(res, 200, { ok: true, category: cat, items: items.map(cardOf) });
    }
    // 详情
    if (p.startsWith('/api/yule/item/')) {
      const id = p.slice('/api/yule/item/'.length);
      const it = getItem(id);
      if (!isPublicItem(it)) return sendJson(res, 404, { ok: false, error: 'not found' });
      return sendJson(res, 200, { ok: true, item: publicItemOf(it) });
    }
    // 主页卡片:当天最热明星热点
    if (p === '/api/yule/home-teaser') {
      let pick = listItems('star')[0] || listItems('music')[0] || listItems('screen')[0] || listItems('fashion')[0] || listItems()[0] || null;
      return sendJson(res, 200, { ok: true, teaser: pick ? cardOf(pick) : null });
    }
    // 手动触发采集(本地/调试用)
    if (p === '/api/yule/collect' && req.method === 'POST') {
      runCollect('manual-api'); // 不 await,后台跑
      return sendJson(res, 200, { ok: true, started: true });
    }
    // 图片静态
    if (p.startsWith('/yule-img/')) {
      const rel = decodeURIComponent(p.slice('/yule-img/'.length));
      const safe = path.normalize(rel).replace(/^(\.\.[\/\\])+/, '');
      return serveFile(req, res, path.join(IMAGES_DIR, safe));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'no route' }));
  } catch (err) {
    log('error', 'request', err.stack || err.message);
    try { sendJson(res, 500, { ok: false, error: 'internal' }); } catch (_) {}
  }
});

// ---------- 调度:按 intervalHours 跑一轮采集检查;启动后如果过期会补跑 ----------
function crawlIntervalMs() {
  const hours = Number(CONFIG.crawl.intervalHours || 2);
  return Math.max(1, hours) * 60 * 60 * 1000;
}

function shouldRunScheduledCollect() {
  const state = readJsonSafe(STATE_PATH, {});
  const last = Date.parse(state.lastCollectAt || '');
  return !Number.isFinite(last) || (Date.now() - last) >= crawlIntervalMs();
}

function scheduleTick() {
  try {
    cleanupExpired();
    if (CONFIG.crawl.enabled && shouldRunScheduledCollect()) {
      runCollect('interval-schedule');
    }
  } catch (err) { log('error', 'scheduleTick', err.message); }
}

function start() {
  loadConfig();
  ensureDirs();
  seedIfEmpty().catch(e => log('warn', 'seed', e.message));
  server.listen(PORT, HOST, () => {
    log('info', `Panda Yule 服务已启动 http://${HOST}:${PORT} (data: ${DATA_DIR})`);
  });
  server.on('error', (err) => log('error', 'server', err.message));
  // 调度每 intervalHours 小时检查一次,启动后先看是否需要补跑。
  setInterval(scheduleTick, crawlIntervalMs());
  setTimeout(scheduleTick, 30 * 1000);
}

if (require.main === module) start();
module.exports = {
  start,
  runCollect,
  cleanupExpired,
  loadConfig,
  enhanceMissingImages,
  expandExistingShortBodies,
  collectScreenFocusedHot,
  collectOtherFocusedHot,
  collectStyleFocusedHot,
  collectSinaFashionHot,
};
