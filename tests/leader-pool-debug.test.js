// 龙头池诊断与 7-08 问题机制复现测试(node tests/leader-pool-debug.test.js)。
// 走真实 strategyMainlineReworkLeaders,只 stub 数据库 IO(主因库/交易日/指标充实)。
// 夹具数值为机制复现用的模拟值,不断言任何真实行情数字——修复必须由底库自动计算(Codex 评审要求)。
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
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

(async () => {
  // ---- stub 依赖(仅 IO 与工具,评分/入池/门槛全走真实代码) ----
  const normalizeReasonSourceCode = c => String(c || '').trim();
  const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
  const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
  const canonicalTopicName = t => String(t || '').trim();
  const isExcludedFromReview = () => false;
  const readSavedApiKey = async () => 'k';
  const strategyParseSealMinutes = (t) => { const s = String(t || ''); if (!/^\d{5,6}$/.test(s)) return null; const p = s.padStart(6, '0'); return (Number(p.slice(0, 2)) - 9) * 60 + Number(p.slice(2, 4)); };
  eval(extractFn('strategyLeaderRankScore'));

  // 近10个交易日,末位=诊断日 2026-07-08
  const TD10 = ['2026-06-25', '2026-06-26', '2026-06-27', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03', '2026-07-06', '2026-07-07', '2026-07-08'];
  const getRecentTradingDays = async () => TD10;
  // 主因库夹具:XW=类星网(诊断日当天主因命中本族但归属出错的股),ZG=类紫光(近10日两次主因,一次族内)
  const REASON_DB = {
    '2026-07-08': { stocks: [{ code: '600801', name: 'XW', finalBoardTopic: '算力' }] },
    '2026-07-06': { stocks: [{ code: '600802', name: 'ZG', finalBoardTopic: '算力' }] },
    '2026-06-30': { stocks: [{ code: '600802', name: 'ZG', finalBoardTopic: '光模块' }, { code: '600803', name: 'CY', finalBoardTopic: '算力' }] },
    '2026-06-29': { stocks: [{ code: '600803', name: 'CY', finalBoardTopic: '算力' }] },
  };
  const readLimitUpMainReasonDbDay = async d => REASON_DB[d] || null;
  // 指标充实 stub = 收盘价库/涨停底库口径(真实实现由 enrichReviewLeaderMetrics 从底库算,此处只喂模拟值)
  const METRICS = {
    '600801': { zt10Count: 5, gain10: 54, gain30: 25, mainZt10Count: 1 },
    '600802': { zt10Count: 2, gain10: 21, gain30: 16, mainZt10Count: 1 },
    '600803': { zt10Count: 2, gain10: 16, gain30: 26, mainZt10Count: 2 },
  };
  const enrichReviewLeaderMetrics = async rows => { for (const r of rows) Object.assign(r, METRICS[r.code] || { zt10Count: 0, mainZt10Count: 0 }); };
  eval(extractFn('strategyMainlineReworkLeaders'));

  const mkMainline = (over = {}) => ({
    theme: '算力AI', mergedThemes: ['算力'], todayCodes: [], leaders: [], risingStocks: [],
    priorReasonStocks: [], recentTopStocks: [], starStocks: [], isNewTheme: false, ...over,
  });

  // 1. 机制复现A:当日主因命中本族的涨停股,即使 todayCodes 归属出错(未进本主线),
  //    池子补全也会靠主因库把它拉回龙头池——但拿不到任何"今日"加分,评分被压低。
  const buggy = mkMainline();   // todayCodes 里没有 600801(复现归属丢失)
  await strategyMainlineReworkLeaders([buggy], '2026-07-08', { debug: true });
  const buggyXW = (buggy.leaders || []).find(r => r.code === '600801');
  A(!!buggyXW, '归属丢失时:主因库池子补全仍把它拉进龙头池(不至于彻底缺席)');
  A(buggyXW && buggyXW.todayLimit !== true && !buggyXW.basis.some(b => b.startsWith('今日')), '但拿不到今日涨停/连板/封速加分(todayLimit=false)——归属错误的真实代价');
  A((buggy.leaders || []).some(r => r.code === '600802'), '类紫光:近10日族内主因涨停 → 池子补全入池并过门槛,应出现在龙头名单');

  // 2. 机制复现A':归属修复后(todayCodes 含它 + 盘中行情进池),同一只股评分显著抬升
  const fixed = mkMainline({
    todayCodes: ['600801'],
    risingStocks: [{ code: '600801', name: 'XW', gain: 10, lianban: 5, firstLimitTime: '093000' }],
  });
  await strategyMainlineReworkLeaders([fixed], '2026-07-08', { debug: true });
  const fixedXW = (fixed.leaders || []).find(r => r.code === '600801');
  A(!!fixedXW && fixedXW.leadScore > buggyXW.leadScore + 30, `归属修复后同股评分抬升(${buggyXW?.leadScore} → ${fixedXW?.leadScore}):今日涨停+在场+连板+封速全部生效`);
  A(fixed.leaders[0]?.code === '600801', '修复后由底库数据自动算出第一龙头,无任何硬编码干预');

  // 3. 机制复现B:族清单(canonical(m.theme)+mergedThemes)不含股票的主因题材 → 彻底进不了池
  //    ——这是"真龙头缺席前三"的另一条根因链(题材族映射缺口),与归属丢失不同。
  const familyGap = mkMainline({ mergedThemes: [] });   // familyTopics=['算力AI'],主因库里都是'算力'
  await strategyMainlineReworkLeaders([familyGap], '2026-07-08', { debug: true });
  A(!(familyGap.leaders || []).length, "族清单不含'算力':三只股全部进不了池,主线无龙头(复现族映射缺口)");
  A(JSON.stringify(familyGap.leaderDebug?.familyTopics) === JSON.stringify(['算力AI']), 'leaderDebug 暴露族清单,可直接看出缺口在映射而非评分');

  // 4. 诊断采集本身:debug 开关行为
  A(Array.isArray(buggy.leaderDebug?.pool) && buggy.leaderDebug.pool.length >= 3, 'debug 模式:龙头池全量打分明细可见(含未过门槛股)');
  const dbgRow = buggy.leaderDebug.pool.find(r => r.code === '600801');
  A(dbgRow && dbgRow.freshDist === 0 && dbgRow.gated === true && dbgRow.todayLimit === false, '明细行含主因新鲜度/门槛/今日在场三关键字段(定位"该赢未赢"的直接证据)');
  const plain = mkMainline();
  await strategyMainlineReworkLeaders([plain], '2026-07-08');
  A(plain.leaderDebug === undefined, '正常调用(无 debug):不产生 leaderDebug,线上行为零变化');

  // 5. 接线静态断言:端点/只读性/冻结快照事实
  A(src.includes("url.pathname === '/api/strategy-mainline-leader-debug'"), '诊断端点已注册');
  A(src.match(/strategy-mainline-leader-debug'[\s\S]{0,300}requireAdmin\(req, res\)/), '诊断端点 admin 门控');
  A(src.includes("{ writePredict: false, leaderDebug: true, traceCodes }"), '诊断调用不写预测');
  A(src.includes('if (!options.leaderDebug) {') && src.match(/if \(!options\.leaderDebug\) \{\s*\n\s*strategyMainlineMaybeAutoScan/), '诊断模式不派发扫描任务(严格只读)');
  A(src.includes('debug: !!options.leaderDebug'), 'leaderDebug 贯通到 ReworkLeaders');
  A(src.includes('mainlinesWithCode') && src.includes('boardsWithCode') && src.includes('todayReason:'), '个股归属追踪:板块携带/当日主因/落入主线三方对照');
  A(src.includes('历史日期不再临时重算'), '事实断言:历史日走冻结快照——修复最终需重建当日快照,单修源数据不改变展示');
  A(!fsReal.existsSync(pathReal.join(__dirname, '..', 'tools', 'patch-20260708-suanli-leaders.js')), '快照盲补脚本已废弃删除');

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL LEADER-POOL-DEBUG CHECKS PASSED');
})();
