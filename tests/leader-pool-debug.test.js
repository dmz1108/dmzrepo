// 龙头池诊断与 7-08 问题机制复现测试(node tests/leader-pool-debug.test.js)。
// 走真实 strategyMainlineReworkLeaders + 生产 canonicalTopicName / PRIMARY_TOPIC_CLUSTERS,
// 只 stub 数据库 IO(主因库/交易日/指标充实)。夹具数值为机制复现用,不断言真实行情数字
// (修复必须由底库自动计算——Codex 评审要求)。
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
function extractArr(name) {
  const i = src.indexOf('const ' + name + ' = [');
  const start = src.indexOf('[', i);
  let d = 0, j = start;
  for (; j < src.length; j++) { if (src[j] === '[') d++; else if (src[j] === ']') { d--; if (d === 0) break; } }
  return src.slice(i, j + 2).replace('const ', 'var ');
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

(async () => {
  // ---- 真实诊断上下文(六审):store + note 函数取自生产源,后续所有 extractFn 共用同一 store ----
  const { AsyncLocalStorage } = require('async_hooks');
  const strategyMainlineDiagStore = new AsyncLocalStorage();
  eval(extractFn('strategyMainlineDiagScrubPath'));
  eval(extractFn('strategyMainlineDiagErrorText'));
  eval(extractFn('strategyMainlineDiagNoteRead'));
  eval(extractFn('strategyMainlineDiagNoteTimeout'));
  // ---- 生产工具(不 stub):canonicalTopicName 及其依赖的题材簇 ----
  eval(extractArr('PRIMARY_TOPIC_CLUSTERS'));
  eval(extractFn('canonicalTopicName'));
  // 前置事实校验(Codex 第6点):生产 canonical('算力AI')='算力',云计算/光模块各自独立 → 族缺口成立
  A(canonicalTopicName('算力AI') === '算力', "生产 canonicalTopicName('算力AI')='算力'(测试建立在真实行为上)");
  A(canonicalTopicName('云计算') === '云计算' && canonicalTopicName('光模块') === '光模块', '云计算/光模块不并入算力 → 族缺口真实');

  // ---- stub 依赖(仅 IO 与工具,评分/入池/门槛全走真实代码) ----
  const normalizeReasonSourceCode = c => String(c || '').trim();
  const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
  const isExcludedFromReview = () => false;
  const readSavedApiKey = async () => 'k';
  const strategyParseSealMinutes = (t) => { const s = String(t || ''); if (!/^\d{5,6}$/.test(s)) return null; const p = s.padStart(6, '0'); return (Number(p.slice(0, 2)) - 9) * 60 + Number(p.slice(2, 4)); };
  eval(extractFn('strategyLeaderRankScore'));

  // 近10个交易日(Codex 第7点):含周一 2026-06-29,排除周六 2026-06-27;末位=诊断日 07-08
  const TD10 = ['2026-06-25', '2026-06-26', '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07', '2026-07-08'];
  A(TD10.includes('2026-06-29') && !TD10.includes('2026-06-27') && TD10.length === 10, '交易日含 06-29、排除周六 06-27,共10日');
  const getRecentTradingDays = async () => TD10;
  // 主因库夹具:XW=星网锐捷(7-08 当日主因=算力,单板),ZG=紫光(近10日两次,一次族外主因),CY=长源(算力,较早)
  const REASON_DB = {
    '2026-07-08': { stocks: [{ code: '002396', name: '星网锐捷', finalBoardTopic: '算力', finalDetailReason: 'CPO交换机' }] },
    '2026-07-06': { stocks: [{ code: '000938', name: '紫光股份', finalBoardTopic: '云计算' }] },
    '2026-06-30': { stocks: [{ code: '000938', name: '紫光股份', finalBoardTopic: '光模块' }, { code: '603950', name: '长源东谷', finalBoardTopic: '算力' }] },
    '2026-06-29': { stocks: [{ code: '603950', name: '长源东谷', finalBoardTopic: '算力' }] },
  };
  const readLimitUpMainReasonDbDay = async d => REASON_DB[d] || null;
  // 指标充实 stub = 收盘价库/涨停底库口径(真实实现由 enrichReviewLeaderMetrics 从底库算,此处喂模拟值)。
  // zt10Count=近10日总涨停(星网5),lianban 由主线当日数据带入(见下),两者不可混。
  let METRICS_TABLE = code => ({
    '002396': { zt10Count: 5, gain10: 54.05, gain30: 25.32, mainZt10Count: 1 },
    '000938': { zt10Count: 2, gain10: 21.55, gain30: 16.59, mainZt10Count: 1 },
    '603950': { zt10Count: 2, gain10: 16.25, gain30: 25.37, mainZt10Count: 2 },
  }[code] || { zt10Count: 0, mainZt10Count: 0 });
  const enrichReviewLeaderMetrics = async rows => { for (const r of rows) Object.assign(r, METRICS_TABLE(r.code)); };
  eval(extractFn('strategyMainlineReworkLeaders'));

  const mkMainline = (over = {}) => ({
    theme: '算力AI', mergedThemes: [], todayCodes: [], leaders: [], risingStocks: [],
    priorReasonStocks: [], recentTopStocks: [], starStocks: [], isNewTheme: false, ...over,
  });

  // 1. 机制复现A(归属丢失):星网当日主因=算力(canonical 命中族'算力'),池子补全靠主因库把它拉进池,
  //    但 todayCodes 未含它 → 拿不到今日涨停/连板/封速加分,评分被压低。
  const buggy = mkMainline();
  await strategyMainlineReworkLeaders([buggy], '2026-07-08', { debug: true, traceCodes: ['002396', '000938'] });
  const buggyXW = (buggy.leaders || []).find(r => r.code === '002396');
  A(!!buggyXW, '归属丢失时:主因库池子补全仍把星网拉进龙头池(不至彻底缺席)');
  A(buggyXW && !buggyXW.basis.some(b => b.startsWith('今日')), '但星网拿不到今日涨停/连板/封速加分(归属错误的真实代价)');
  A(!(buggy.leaders || []).some(r => r.code === '000938'), '紫光:近10日主因是云计算/光模块,canonical 后不在算力族 → 不进池(数据在库却过不了族门槛,场景3详证)');

  // 2. 机制复现A'(归属修复):todayCodes 含星网 + 盘中一板(lianban=1,非近10日总数5),评分抬升且登顶
  const fixed = mkMainline({
    todayCodes: ['002396'],
    // Codex 第8点:7-08 当日 limitUpCount/lianban=1(单板),5 是近10日总涨停(在 zt10Count 里)
    risingStocks: [{ code: '002396', name: '星网锐捷', gain: 10.0, lianban: 1, firstLimitTime: '093000' }],
  });
  await strategyMainlineReworkLeaders([fixed], '2026-07-08', { debug: true });
  const fixedXW = (fixed.leaders || []).find(r => r.code === '002396');
  A(!!fixedXW && fixedXW.lianban === 1, '修复后星网今日连板=1(单板),不误用近10日总数5');
  A(fixedXW && fixedXW.leadScore > buggyXW.leadScore + 15, `归属修复后星网评分抬升(${buggyXW?.leadScore} → ${fixedXW?.leadScore}):今日涨停+在场+封速生效`);
  A(fixed.leaders[0]?.code === '002396', '修复后由底库数据自动算出星网第一龙头,无硬编码干预');

  // 3. 机制复现B(族清单缺口):族清单只含 canonical('算力AI')='算力';紫光近10日主因是云计算/光模块,
  //    canonical 后都不在族 → 彻底进不了池(空池基线也暴露族清单)。
  const onlyZG = { '2026-07-06': { stocks: [{ code: '000938', name: '紫光股份', finalBoardTopic: '云计算' }] },
                   '2026-06-30': { stocks: [{ code: '000938', name: '紫光股份', finalBoardTopic: '光模块' }] } };
  const savedDb = { ...REASON_DB };
  for (const k of Object.keys(REASON_DB)) delete REASON_DB[k];
  Object.assign(REASON_DB, onlyZG);
  const familyGap = mkMainline();
  await strategyMainlineReworkLeaders([familyGap], '2026-07-08', { debug: true, traceCodes: ['000938'] });
  A(!(familyGap.leaders || []).length, "族清单只含'算力':紫光的云计算/光模块主因 canonical 后不在族,进不了池(复现族映射缺口)");
  A(JSON.stringify(familyGap.leaderDebug?.familyTopics) === JSON.stringify(['算力']), "leaderDebug 暴露族清单=['算力'],缺口在映射而非评分");
  A(Array.isArray(familyGap.leaderDebug?.tracedMissing) && familyGap.leaderDebug.tracedMissing.includes('000938'), 'tracedMissing 明示紫光根本没进池(空池场景也追踪到)');
  Object.assign(REASON_DB, savedDb);

  // 4. Codex 第5点:codes= 指定股必须始终出现在明细,即使不在 pool 前30
  const many = mkMainline();
  const bigReason = { '2026-07-08': { stocks: [] } };
  for (let i = 0; i < 40; i++) bigReason['2026-07-08'].stocks.push({ code: '60' + String(1000 + i), name: 'F' + i, finalBoardTopic: '算力' });
  bigReason['2026-07-08'].stocks.push({ code: '002396', name: '星网锐捷', finalBoardTopic: '算力' });
  for (const k of Object.keys(REASON_DB)) delete REASON_DB[k];
  Object.assign(REASON_DB, bigReason);
  const savedTable = METRICS_TABLE;
  METRICS_TABLE = code => ({ zt10Count: code === '002396' ? 1 : 3, gain10: 5, gain30: 5, mainZt10Count: 1 });
  await strategyMainlineReworkLeaders([many], '2026-07-08', { debug: true, traceCodes: ['002396'] });
  const inPool = (many.leaderDebug?.pool || []).some(r => r.code === '002396');
  A(inPool, '被 trace 的星网即使评分排 30 名外,也强制出现在明细 pool 中');
  A((many.leaderDebug?.pool || []).length > 30, 'pool 因 trace 注入而超过 30(证明 trace 股是被额外补入的)');
  METRICS_TABLE = savedTable;
  for (const k of Object.keys(REASON_DB)) delete REASON_DB[k];
  Object.assign(REASON_DB, savedDb);

  // 5. debug 开关:正常调用零变化
  const plain = mkMainline();
  await strategyMainlineReworkLeaders([plain], '2026-07-08');
  A(plain.leaderDebug === undefined, '正常调用(无 debug):不产生 leaderDebug,线上行为零变化');

  // 6. 接线静态断言:端点/只读/历史隔离/超时/全量板块/全局状态
  A(src.includes("url.pathname === '/api/strategy-mainline-leader-debug'"), '诊断端点已注册');
  A(src.match(/strategy-mainline-leader-debug'[\s\S]{0,300}requireAdmin\(req, res\)/), '诊断端点 admin 门控');
  A(src.includes('if (opts.historicalOnly) return getStrategyBoardSnapshotStocks'), '历史模式:实时成分接口改走快照还原(四审阻断1,取代三审的一刀切返回空)');
  A(src.includes('const diagHistoricalBoards = diagMode && requestedDay !== isoFromCompactDate(chinaNowParts().day)'), '历史诊断标志=诊断且非今天(板块加载前判定)');
  A(src.includes('historicalOnly: diagHistorical') && src.includes('const catalogBoards = diagHistorical ? []'), '历史诊断:成分与 catalog 榜都禁实时数据');
  A(src.includes('liveIfMissing: !diagHistoricalBoards'), '历史诊断:板块榜快照缺失也不回退实时榜(自检补堵,宁空勿混)');
  A(src.includes('recordState: !diagMode') && src.includes('if (options.recordState !== false) {'), '诊断模式 recordState:false — 不写全局补选状态');
  A(src.includes('fullWait: diagMode') && src.includes('options.fullWait'), 'fullWait 贯通 enrich(诊断完整等待成分抓取)');
  A(src.includes('const allBoardsForTrace = diagMode ? (boardPayload?.boards || []).slice()'), '保留过滤前全量板块供 boardsWithCode');
  A(src.includes('(allBoardsForTrace || boardPayload?.boards || [])'), 'boardsWithCode 用过滤前全量板块(不漏未进主通道的原始板块)');
  A(src.match(/if \(diagMode\) \{\s*\n\s*try \{\s*\n\s*await strategyMainlineReworkLeaders\(mainlines, isoDay, reworkOpts\);/), '诊断模式完整等待龙头池重构(不吃 1.2s 超时,且不吞异常)');
  A(src.includes('debugMeta: diagBuildMeta(') && src.includes('fullWait: diagStore.timeouts.length === 0') && src.includes('partial: diagStore.timeouts.length > 0'), 'debugMeta 由真实事件计算(fullWait/partial/complete),不再静态声明 true');
  A(src.includes("'历史日期不再临时重算'") || src.includes('历史日期不再临时重算'), '事实:历史日展示走冻结快照,修复须重建当日快照');
  A(!fsReal.existsSync(pathReal.join(__dirname, '..', 'tools', 'patch-20260708-suanli-leaders.js')), '快照盲补脚本已废弃删除');

  // 7. 行为测试(三审第9点):历史诊断不访问实时行情 / 不写全局状态 / 不因超时吐半结果
  // 7a. historicalOnly:三个实时抓取器一次都不被调用
  {
    const liveCalls = [];
    const fetchEastmoneyConceptStocks = async () => { liveCalls.push('em'); return [{ code: '1' }]; };
    const fetchThsConceptStocks = async () => { liveCalls.push('ths'); return [{ code: '2' }]; };
    const fetchRealtimePlateStocks = async () => { liveCalls.push('kpl'); return { List: [['3', 'x', 0, 0, 0, 0, 1]] }; };
    const strategyNormRealtimeStocks = r => r;
    const getStrategyBoardStocks = async () => [{ code: 'HIST' }];
    const getStrategyBoardSnapshotStocks = async () => [{ code: 'SNAP-ZT', name: '快照涨停股', gainPct: 10.02 }];
    eval(extractFn('getStrategyBoardRealtimeStocks'));
    for (const z of [6, 5, 7]) {
      const rows = await getStrategyBoardRealtimeStocks('p1', '2026-07-08', { zsType: z }, { historicalOnly: true });
      A(Array.isArray(rows) && rows.length === 1 && rows[0].code === 'SNAP-ZT', `历史诊断 zsType=${z}:成分来自冻结快照还原,不触实时接口`);
    }
    A(liveCalls.length === 0, '行为验证:历史模式下东财/同花顺/KPL 实时接口零调用');
    await getStrategyBoardRealtimeStocks('p1', '2026-07-08', { zsType: 6 }, {});
    A(liveCalls.length === 1 && liveCalls[0] === 'em', '对照:非历史模式实时接口正常调用(行为未被误伤)');
  }
  // 7b/7c. enrich:recordState:false 不写全局补选状态;fullWait 不吃超时半结果
  {
    let strategyMainlineSupplementState = null;   // 模拟模块级全局(eval 的函数会对它赋值)
    const STRATEGY_MAINLINE_RISING_BOARD_LIMIT = 5;
    const STRATEGY_MAINLINE_SUPPLEMENT_BOARDS = 2;
    const STRATEGY_MAINLINE_RISING_FETCH_TIMEOUT_MS = 5;   // 极短,逼出半结果路径
    const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
    const mapLimit = async (arr, n, f) => { for (const x of arr) await f(x); };
    const strategyMainlineNormalizeRisingStock = s => s && s.code ? { code: s.code, name: s.name || '', gain: Number(s.gainPct) || 0 } : null;
    const strategyMainlineIsNearLimitStock = () => false;
    const strategyMainlineBoardBreadth = () => null;
    // 慢速成分抓取:30ms 后才回数据——短超时下会被截成空,fullWait 下应完整拿到
    const getStrategyBoardRealtimeStocks = (pid, day, b, o) => new Promise(res =>
      setTimeout(() => res([{ code: '600001', name: 'S', gainPct: 9 }]), 30));
    eval(extractFn('strategyMainlineWithTimeout'));
    eval(extractFn('strategyMainlineEnrichBoardsWithRisingStocks'));
    const mkBoards = () => [{ plateId: 'p1', name: '算力', zt: 3, gainPct: 2, netInflow: 1e8, codes: ['600001'] }];

    const b1 = mkBoards();
    await strategyMainlineEnrichBoardsWithRisingStocks(b1, '2026-07-08', { realtimeSource: 'live', recordState: false, fullWait: true });
    A(strategyMainlineSupplementState === null, '行为验证:recordState:false — 补选全局状态未被覆盖');
    A(Array.isArray(b1[0].memberRows) && b1[0].memberRows.length === 1, '行为验证:fullWait — 慢数据完整等到,不吃 5ms 超时');

    const b2 = mkBoards();
    await strategyMainlineEnrichBoardsWithRisingStocks(b2, '2026-07-08', { realtimeSource: 'live' });
    A(strategyMainlineSupplementState !== null && strategyMainlineSupplementState.day === '2026-07-08', '对照:正式请求照常记录补选状态(行为未被误伤)');
    A(Array.isArray(b2[0].memberRows) && b2[0].memberRows.length === 0, '对照:正式请求超时兜底成空——正是诊断模式必须绕开的半结果路径');
  }

  // 8. 行为测试(四审阻断1):历史成分从快照 cardData 还原,todayGain 与三表携带证据保留
  {
    // 夹具字段与线上快照实测结构一致(zt10 行:totalCount+ztCount+todayGain+days;ztList 行:gain/price;
    // gain10/gain30 行:gain=区间涨幅 + todayGain=当日涨幅——两个 gain 语义不同,还原时绝不可混)
    const SNAP = {
      boards: [{ plateId: 'p1', name: '云计算' }],
      cardData: {
        p1: {
          ztList: [{ code: '600801', name: 'XW', price: 29.1, gain: 10.02, ztState: null }],
          zt10: [{ code: '600802', name: 'ZG', totalCount: 2, ztCount: 1, todayGain: 6.8, days: ['20260630', '20260706'] }],   // 紫光型:只在三表,不在 ztList
          gain10: [{ code: '600802', name: 'ZG', gain: 21.55, todayGain: 6.8 }],
          gain30: [{ code: '600802', name: 'ZG', gain: 16.59, todayGain: 6.8 }],
        },
      },
    };
    const fs = { readFile: async () => JSON.stringify(SNAP) };
    const snapshotPath = () => '/snap/6/2026-07-08.json';
    const isoFromCompactDate = d => String(d);
    eval(extractFn('getStrategyBoardSnapshotStocks'));
    eval(extractFn('collectSnapshotCardStatsForCode'));

    const rows = await getStrategyBoardSnapshotStocks('p1', '2026-07-08', { zsType: 6 });
    const rXW = rows.find(r => r.code === '600801');
    const rZG = rows.find(r => r.code === '600802');
    A(rows.length === 2 && rXW?.gainPct === 10.02, '历史成分=快照四表合并还原,ztList 行当日涨幅保留');
    A(rZG?.gainPct === 6.8, '紫光型(不在 ztList):三表行的 todayGain=6.8 还原为当日涨幅——真实快照核验后的补强,区间 gain 不混入');

    const statsZG = await collectSnapshotCardStatsForCode('2026-07-08', '600802');
    A(statsZG.length === 3 && statsZG.every(s => s.boardName === '云计算'), '紫光型:三套源快照均查(此处三次读到同板块)');
    A(statsZG[0].zt10?.totalCount === 2 && statsZG[0].zt10?.ztCount === 1 && statsZG[0].gain10?.gain === 21.55 && !statsZG[0].ztList, 'cardData 三表原值带出(totalCount/ztCount 两口径原样),ztList 缺席如实');
    const statsNone = await collectSnapshotCardStatsForCode('2026-07-08', '999999');
    A(statsNone.length === 0, '不在任何表的股:snapshotStats 为空(不虚构)');
    // 六审:损坏快照的错误进入诊断上下文,即使无人传入 debugErrors 数组
    const fsBad = { readFile: async () => '{broken' };
    eval(extractFn('collectSnapshotCardStatsForCode').replace(/fs\.readFile/g, 'fsBad.readFile'));
    const badStore = { readErrors: [], timeouts: [], missing: [] };
    await strategyMainlineDiagStore.run(badStore, () => collectSnapshotCardStatsForCode('2026-07-08', '600802'));
    A(badStore.readErrors.length === 3 && badStore.readErrors[0].startsWith('snapshot-zs') && badStore.readErrors[0].includes('invalid JSON'), '快照损坏不静默:三源 JSON 损坏记入诊断上下文 readErrors(缺文件才走 missing)');
  }

  // 9. 行为测试(四审阻断2):动能采样 record=false 只读不写
  {
    const strategyMainlineTrendSamples = new Map();
    const STRATEGY_MAINLINE_TREND_WINDOW_MS = 60 * 60 * 1000;
    const STRATEGY_MAINLINE_TREND_MIN_GAP_MS = 1;
    const STRATEGY_MAINLINE_TREND_BASE_MIN_AGE_MS = 0;
    const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
    eval(extractFn('strategyMainlineTrackTrend'));
    strategyMainlineTrackTrend('k1', { netInflow: 1e8 }, false);
    A(strategyMainlineTrendSamples.size === 0, '行为验证:record=false — 诊断不写动能采样序列');
    strategyMainlineTrackTrend('k1', { netInflow: 1e8 });
    A(strategyMainlineTrendSamples.get('k1')?.length === 1, '对照:正式请求照常采样(行为未被误伤)');
    strategyMainlineTrendSamples.get('k1')[0].ts = Date.now() - 60000;   // 老化既有样本
    const ro = strategyMainlineTrackTrend('k1', { netInflow: 3e8 }, false);
    A(strategyMainlineTrendSamples.get('k1').length === 1 && ro && ro.inflowDelta === 2e8, 'record=false 仍可读既有样本算动能(只读,评分口径不失真)');
  }

  // 10. 行为测试(四审阻断3):rework 内部指标充实失败不静默,记入 debugErrors
  {
    const errs = [];
    const savedMetricsFn = enrichReviewLeaderMetrics;
    const throwingEnrich = async () => { throw new Error('close-db unavailable'); };
    // 用抛错版指标充实重新 eval rework(独立作用域,避免污染前面的用例)
    const normalizeReasonSourceCode2 = c => String(c || '').trim();
    await (async () => {
      const normalizeReasonSourceCode = normalizeReasonSourceCode2;
      const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
      const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
      const isExcludedFromReview = () => false;
      const readSavedApiKey = async () => 'k';
      const strategyParseSealMinutes = () => 30;
      const getRecentTradingDays = async () => TD10;
      const readLimitUpMainReasonDbDay = async d => REASON_DB[d] || null;
      const enrichReviewLeaderMetrics = throwingEnrich;
      eval(extractFn('strategyLeaderRankScore'));
      eval(extractFn('strategyMainlineReworkLeaders'));
      const m = mkMainline();
      await strategyMainlineReworkLeaders([m], '2026-07-08', { debug: true, debugErrors: errs });
      A(errs.length === 1 && errs[0].startsWith('leader-metrics:') && errs[0].includes('close-db unavailable'), '行为验证:指标充实失败记入 debugErrors(诊断者可见缺数原因)');
      A(Array.isArray(m.leaderDebug?.pool), '出错时池明细仍输出(诚实的不完整结果,配合 complete:false)');
    })();
    void savedMetricsFn;
  }

  // 11. 接线静态断言(四审)
  A(src.includes('if (opts.historicalOnly) return getStrategyBoardSnapshotStocks(plateId, day, info);'), '历史成分改走快照还原(不再一刀切返回空)');
  A(src.includes('snapshotStats: await collectSnapshotCardStatsForCode(isoDay, code)'), 'debugTrace 带快照 cardData 三表携带证据');
  A(src.includes('strategyMainlineAugmentPrediction(item, isTodayQuery, isoDay, !diagMode)') && src.includes('}, recordTrend)'), '诊断今天不写 strategyMainlineTrendSamples(recordTrend 贯通)');
  A(src.includes('const debugErrors = diagStore ? diagStore.readErrors : null;') && src.includes('complete: diagStore.readErrors.length === 0 && diagStore.timeouts.length === 0'), 'debugMeta.complete 由读错误+超时共同决定,debugErrors 统一到诊断上下文');
  A(src.includes("debugErrors.push(`rework: ") && src.includes("debugErrors.push(`enrich: ") && src.includes('`board-members ${plateId}:') && src.includes('`leader-metrics:'), 'enrich/rework/单板/指标四类异常全部进 debugErrors,不吞');

  // 12. 五审阻断1:历史 breadth 必须 null(涨停名单≠完整成分),todayGain 个股信号照常参与
  {
    let strategyMainlineSupplementState = null;
    const STRATEGY_MAINLINE_RISING_BOARD_LIMIT = 5;
    const STRATEGY_MAINLINE_SUPPLEMENT_BOARDS = 0;
    const STRATEGY_MAINLINE_RISING_FETCH_TIMEOUT_MS = 1000;
    const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
    const mapLimit = async (arr, n, f) => { for (const x of arr) await f(x); };
    const strategyMainlineNormalizeRisingStock = s => s && s.code ? { code: s.code, name: s.name || '', gain: Number(s.gainPct) || 0 } : null;
    const strategyMainlineIsNearLimitStock = () => false;
    let breadthCalls = 0;
    const strategyMainlineBoardBreadth = () => { breadthCalls++; return { pct: 100, score: 50 }; };
    // 历史快照还原:10 只涨停股(全 +10%)+ 紫光型 todayGain=6.8(不在 ztList,来自三表)
    const snapRows = [];
    for (let i = 0; i < 10; i++) snapRows.push({ code: '60' + (100 + i), name: 'Z' + i, gainPct: 10.0 });
    snapRows.push({ code: '000938', name: '紫光股份', gainPct: 6.8 });
    const getStrategyBoardRealtimeStocks = async (pid, day, b, o) => (o && o.historicalOnly ? snapRows : snapRows);
    eval(extractFn('strategyMainlineWithTimeout'));
    eval(extractFn('strategyMainlineEnrichBoardsWithRisingStocks'));

    const bh = [{ plateId: 'p1', name: '云计算', zt: 10, gainPct: 5, netInflow: 1e8, codes: [] }];
    await strategyMainlineEnrichBoardsWithRisingStocks(bh, '2026-07-08', { realtimeSource: 'snapshot', recordState: false, fullWait: true, historicalOnly: true });
    A(bh[0].breadth === null && breadthCalls === 0, '历史诊断:breadth=null 且广度函数零调用——10 只涨停股不产生虚高普涨分');
    A(bh[0].risingStocks.some(s => s.code === '000938' && s.gain === 6.8), '紫光 todayGain=6.8 照常进入 risingStocks(个股在场信号不受 breadth 隔离影响)');
    A(bh[0].memberRows.length === 11, '四表合并的 11 行全部保留为成分证据');

    const bl = [{ plateId: 'p1', name: '云计算', zt: 10, gainPct: 5, netInflow: 1e8, codes: [] }];
    await strategyMainlineEnrichBoardsWithRisingStocks(bl, '2026-07-11', { realtimeSource: 'live', recordState: false, fullWait: true });
    A(bl[0].breadth !== null && breadthCalls === 1, '对照:非历史模式广度照常计算(行为未被误伤)');
  }

  // 13. 五审阻断2:关键读取失败入账(diagAwait),正式路径行为不变
  {
    eval(extractFn('strategyMainlineDiagAwait'));
    const errs = [];
    const fb = { byCode: new Map() };
    const failing = Promise.reject(new Error('reason-db io error'));
    const got = await strategyMainlineDiagAwait('prior-reason', failing, errs, fb);
    A(got === fb && errs.length === 1 && errs[0] === 'prior-reason: reason-db io error', '行为验证:读取失败 → 兜底值返回 + debugErrors 入账(不再静默)');
    const ok2 = await strategyMainlineDiagAwait('history-context', Promise.resolve({ x: 1 }), errs, fb);
    A(ok2.x === 1 && errs.length === 1, '成功路径原样透传,不误记');
    const silent = await strategyMainlineDiagAwait('board-payload', Promise.reject(new Error('boom')), null, fb);
    A(silent === fb, '正式请求(debugErrors=null):与原 .catch(()=>fallback) 行为完全一致');
    // 接线:四个关键读取全部走 diagAwait;gainLeaders 诊断模式完整等待;板块榜早退带 debugMeta
    A(src.includes("strategyMainlineDiagAwait('board-payload'") && src.includes("strategyMainlineDiagAwait('prior-reason'") && src.includes("strategyMainlineDiagAwait('history-context'") && src.includes("strategyMainlineDiagAwait('gain-leaders'"), 'boardPayload/priorReason/history/gainLeaders 四读取全部入账');
    A(src.match(/const gainLeaders = diagMode\s*\n?\s*\? await strategyMainlineDiagAwait/), 'gainLeaders:诊断完整等待(不吃 TOP_GAIN 超时),正式请求保持原超时兜底');
    A(src.match(/伪装成"数据未准备"[\s\S]{0,200}debugMeta: diagBuildMeta\(/), '板块榜失败导致的早退:诊断模式带 diagBuildMeta(complete 由真实事件决定)');
    A(src.includes('board.breadth = options.historicalOnly ? null : strategyMainlineBoardBreadth(normalized);'), 'breadth 历史隔离接线');
  }

  // 14. 六审场景一:损坏快照 — 底层读取函数把错误压进诊断上下文,历史成分还原也不静默
  {
    const isoFromCompactDate = d => String(d);
    const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
    const snapshotPath = () => '/snap/6/2026-07-08.json';
    const fs = { readFile: async () => { const e = new SyntaxError('Unexpected token'); throw e; } };
    eval(extractFn('getStrategyBoardSnapshotStocks'));
    // 无诊断上下文:安全返回空,不抛
    const noCtx = await getStrategyBoardSnapshotStocks('p1', '2026-07-08', { zsType: 6 });
    A(Array.isArray(noCtx) && noCtx.length === 0, '损坏快照:无诊断上下文时返回空且不抛(正式请求行为不变)');
    // 有诊断上下文:损坏错误必被记录(即使返回空看起来"像缺数据")
    const store = { readErrors: [], timeouts: [], missing: [] };
    await strategyMainlineDiagStore.run(store, () => getStrategyBoardSnapshotStocks('p1', '2026-07-08', { zsType: 6 }));
    A(store.readErrors.length === 1 && store.readErrors[0].includes('invalid JSON') && store.missing.length === 0, '损坏快照:记入 readErrors(非 missing)→ complete 将为 false');
  }

  // 15. 六审场景二:历史主因库读取失败 — 即使调用方 .catch(()=>null) 吞掉,底层仍把真实错误压进上下文
  {
    const isoFromCompactDate = d => String(d);
    const mainReasonDbDayTimedCache = new Map();
    const mainReasonDbCache = new Map();
    const DAY_FILE_CACHE_TTL_MS = 60000;
    const limitUpMainReasonDbPath = () => '/db/main-reason/2026-07-08.json';
    const applyMainReasonOverridesToPayload = () => {};
    const readMainReasonOverrides = async () => ({});
    // 权限错误(EACCES):非 ENOENT,必须入 readErrors
    const permErr = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    const fs = { readFile: async () => { throw permErr; } };
    eval(extractFn('readLimitUpMainReasonDbDay').replace('readLimitUpMainReasonDbDay(', 'readMainReasonEacces('));
    const store = { readErrors: [], timeouts: [], missing: [] };
    // 关键:调用方按现网写法 .catch(()=>null) 吞掉——底层的 note-before-throw 仍已记录
    const got = await strategyMainlineDiagStore.run(store, () => readMainReasonEacces('2026-07-08').catch(() => null));
    A(got === null, '历史主因读取失败:调用方 .catch(()=>null) 照常拿到 null(控制流不变)');
    A(store.readErrors.length === 1 && store.readErrors[0].startsWith('main-reason 2026-07-08') && store.readErrors[0].includes('EACCES'), '但底层已把 EACCES 压进诊断上下文(不再被 .catch 吞成静默)');
    // 对照:ENOENT 只记 missing,不污染 readErrors(正常可选缺失)
    {
      const isoFromCompactDate = d => String(d);
      const mainReasonDbDayTimedCache = new Map();
      const mainReasonDbCache = new Map();
      const DAY_FILE_CACHE_TTL_MS = 60000;
      const limitUpMainReasonDbPath = () => '/db/main-reason/2026-07-09.json';
      const applyMainReasonOverridesToPayload = () => {};
      const readMainReasonOverrides = async () => ({});
      const store2 = { readErrors: [], timeouts: [], missing: [] };
      const enoErr = Object.assign(new Error('no such file'), { code: 'ENOENT' });
      const fs = { readFile: async () => { throw enoErr; } };
      eval(extractFn('readLimitUpMainReasonDbDay').replace('readLimitUpMainReasonDbDay(', 'readMainReasonEnoent('));
      const got2 = await strategyMainlineDiagStore.run(store2, () => readMainReasonEnoent('2026-07-09').catch(() => null));
      A(got2 === null && store2.readErrors.length === 0 && store2.missing[0] === 'main-reason 2026-07-09', 'ENOENT 缺文件只记 missing,不使 complete=false');
    }
  }

  // 16. 六审场景三:实时成分抓取超时 — 超时兜底被如实记录,fullWait/complete 据此翻转
  {
    eval(extractFn('strategyMainlineWithTimeout'));
    // 无上下文:与原行为一致(超时返回兜底,不记录)
    const slow = new Promise(res => setTimeout(() => res('late'), 40));
    const r0 = await strategyMainlineWithTimeout(slow, 5, 'fallback', 'members');
    A(r0 === 'fallback', '超时:无上下文时返回兜底(正式请求行为不变)');
    // 有上下文:超时事件入 timeouts;计算出的 debugMeta 应 partial=true / fullWait=false / complete=false
    const store = { readErrors: [], timeouts: [], missing: [] };
    const r1 = await strategyMainlineDiagStore.run(store, () =>
      strategyMainlineWithTimeout(new Promise(res => setTimeout(() => res('late'), 40)), 5, 'fallback', 'board-members p1'));
    A(r1 === 'fallback' && store.timeouts.length === 1 && store.timeouts[0] === 'board-members p1', '超时:诊断上下文记录 timeouts(不把半结果当完整)');
    const diagBuildMeta = (extra = {}) => ({
      fullWait: store.timeouts.length === 0,
      partial: store.timeouts.length > 0,
      timeouts: store.timeouts.slice(),
      complete: store.readErrors.length === 0 && store.timeouts.length === 0,
      ...extra,
    });
    const meta = diagBuildMeta();
    A(meta.fullWait === false && meta.partial === true && meta.complete === false, '有超时时:fullWait=false / partial=true / complete=false(不再静态声明 fullWait:true)');
    // 未超时对照:fullWait=true 是诚实的
    const store2 = { readErrors: [], timeouts: [], missing: [] };
    const r2 = await strategyMainlineDiagStore.run(store2, () =>
      strategyMainlineWithTimeout(Promise.resolve('quick'), 50, 'fallback', 'board-members p2'));
    A(r2 === 'quick' && store2.timeouts.length === 0, '未超时:如实全量,fullWait 保持 true 才成立');
  }

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL LEADER-POOL-DEBUG CHECKS PASSED');
})();
