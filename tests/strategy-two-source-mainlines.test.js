// 两套独立主线预测行为测试(node tests/strategy-two-source-mainlines.test.js)——Owner 2026-07-15 v2。
// 东财只用东财数据、同花顺只用同花顺数据,各自独立候选/评分/排序/第1主线;两边绝不交叉借资金/涨幅/板块数;
// KPL(7) 不进任一边。贯穿真实 compose/assemble/slim 纯函数,另用静态断言锁定每源只用自己的 zsType。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) break; } }
  return src.slice(m.index, i + 1);
}
function extractHtmlFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = html.match(sig);
  if (!m) throw new Error('not found in html: ' + name);
  const bb = html.indexOf('{', html.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < html.length; i++) { if (html[i] === '{') depth++; else if (html[i] === '}') { depth--; if (depth === 0) break; } }
  return html.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };
const escapeHTML = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
eval(extractHtmlFn('renderMainlineReviewHTML'));

// 题材归一 key 的两个依赖 stub 成空,使 key 退回「题材名去『概念』后 trim」——按题材名精确匹配双源共振即可。
const consensusKey = () => '';
const canonicalTopicName = () => '';
eval(extractFn('strategyResonanceTopicKey'));
eval(extractFn('strategyMainlineSlimSourcePayload'));
eval(extractFn('strategyMainlineAssembleBySource'));
eval(extractFn('strategyMainlineComposeBySourcePayload'));

// 模拟两源各自独立跑出的 impl 结果(只保留 compose 关心的字段)。
const em = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', mainlines: [
  { theme: '算力AI', key: 'k-ai', score: 90, count: 5, netInflow: 30e8, boardGainPct: 6, rank: 1, todayCodes: ['600001'] },
  { theme: '医药',   key: 'k-yy', score: 40, count: 2, netInflow: 8e8,  boardGainPct: 2, rank: 2, todayCodes: ['600002'] },
] };
const th = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', mainlines: [
  { theme: '大消费', key: 'k-xf', score: 88, count: 4, netInflow: 20e8, boardGainPct: 5, rank: 1, todayCodes: ['600003'] },
  { theme: '算力AI', key: 'k-ai', score: 50, count: 3, netInflow: 12e8, boardGainPct: 4, rank: 2, todayCodes: ['600004'] },
] };

// ---- 1. 东财 A 第1、同花顺 B 第1:两边各自显示自己的第1主线,不被合并成同一排名 ----
const composed = strategyMainlineComposeBySourcePayload(em, th);
const bs = composed.mainlinesBySource;
A(bs.eastmoney.mainlines[0].theme === '算力AI' && bs.eastmoney.mainlines[0].source === 'eastmoney', '东财第1主线=算力AI(东财自己排序)');
A(bs.ths.mainlines[0].theme === '大消费' && bs.ths.mainlines[0].source === 'ths', '同花顺第1主线=大消费(同花顺自己排序)');
A(bs.eastmoney.mainLeaderTheme === '算力AI' && bs.ths.mainLeaderTheme === '大消费', '两边各自的 mainLeaderTheme 独立');
A(bs.eastmoney.zsType === 6 && bs.ths.zsType === 5, '两边来源标注:东财 zsType6 / 同花顺 zsType5');
// 顶层并集保留各自 rank 为 sourceRank(第1主线在各自源内 rank 都是 1)
const emAiUnion = composed.mainlines.find(m => m.source === 'eastmoney' && m.theme === '算力AI');
const thXfUnion = composed.mainlines.find(m => m.source === 'ths' && m.theme === '大消费');
A(emAiUnion.sourceRank === 1 && thXfUnion.sourceRank === 1, '并集里两个第1主线各自 sourceRank=1(未被合并成单一排名而丢失任一第1)');

// ---- 2. 只在东财的题材只出现在东财区;只在同花顺的只出现在同花顺区 ----
const emThemes = bs.eastmoney.mainlines.map(m => m.theme);
const thThemes = bs.ths.mainlines.map(m => m.theme);
A(emThemes.includes('医药') && !thThemes.includes('医药'), '「医药」只在东财区(东财独有)');
A(thThemes.includes('大消费') && !emThemes.includes('大消费'), '「大消费」只在同花顺区(同花顺独有)');

// ---- 3. 同名题材两源不同净流入/涨幅:两边各自保留自己的值,绝不交叉取值 ----
const emAi = bs.eastmoney.mainlines.find(m => m.theme === '算力AI');
const thAi = bs.ths.mainlines.find(m => m.theme === '算力AI');
A(emAi.netInflow === 30e8 && Number(emAi.boardGainPct) === 6 && emAi.count === 5, '东财「算力AI」保留东财自己的 30亿/6%/5涨停');
A(thAi.netInflow === 12e8 && Number(thAi.boardGainPct) === 4 && thAi.count === 3, '同花顺「算力AI」保留同花顺自己的 12亿/4%/3涨停');
A(emAi.score === 90 && thAi.score === 50, '同名题材两边各自保留自己的分数(不交叉)');

// ---- 双源共振:算力AI 两边都进前列 → 标记 dualResonance,但两边各留各的分/序,不塌成一张卡 ----
A(bs.dualResonanceThemes.length === 1, '双源共振题材集恰为1个(算力AI)');
A(emAi.dualResonance === true && thAi.dualResonance === true, '算力AI 在两边都打 dualResonance 标');
A(bs.eastmoney.mainlines.find(m => m.theme === '医药').dualResonance === false, '仅单源题材不打双源共振标');

// ---- 4. 某一源缺失:另一源正常,缺失源显示暂缺、绝不借值 ----
const composedMissTh = strategyMainlineComposeBySourcePayload(em, null);
A(composedMissTh.mainlinesBySource.eastmoney.available === true, '同花顺缺失时东财仍正常出结果');
A(composedMissTh.mainlinesBySource.ths.available === false, '同花顺缺失 → available=false(暂缺)');
A(composedMissTh.mainlinesBySource.ths.mainlines.length === 0, '缺失源没有任何主线(不借东财的值补)');
const composedMissEm = strategyMainlineComposeBySourcePayload({ ok: false, reason: 'today-realtime-not-ready' }, th);
A(composedMissEm.mainlinesBySource.eastmoney.available === false && composedMissEm.mainlinesBySource.eastmoney.reason === 'today-realtime-not-ready', '东财源不可用 → 暂缺并带原因');
A(composedMissEm.mainlinesBySource.ths.mainlines[0].theme === '大消费', '一源不可用时另一源照常输出自己的第1主线');

// ---- 4b. 有效零结果(ok=true, mainlines=[]):available=true 但 hasMainlines=false,不是"暂缺"(Codex 二审 P2) ----
const emZero = { ok: true, sessionPhase: '盘中', day: '2026-07-15', requestedDay: '2026-07-15', reason: 'no-net-inflow-mainline', message: '当前候选方向未满足资金净流入条件，今日暂不确认主线。', mainlines: [] };
const composedZeroEast = strategyMainlineComposeBySourcePayload(emZero, th);
A(composedZeroEast.mainlinesBySource.eastmoney.available === true, 'P2:东财有效零结果 available=true(源可用,已完成)');
A(composedZeroEast.mainlinesBySource.eastmoney.hasMainlines === false, 'P2:东财有效零结果 hasMainlines=false');
A(composedZeroEast.mainlinesBySource.eastmoney.reason === 'no-net-inflow-mainline', 'P2:有效零结果保留真实原因(资金闸),不是"源不可用"');
A(composedZeroEast.mainlinesBySource.eastmoney.message.includes('资金净流入'), 'P2:有效零结果带人类可读原因文案');
A(composedZeroEast.mainlinesBySource.ths.hasMainlines === true, 'P2:另一源仍正常出主线');
const composedBothZero = strategyMainlineComposeBySourcePayload(emZero, { ok: true, reason: 'no-l2-qualified-mainline', message: '已完成 L2 扫描，无预期明星或明星确认。', mainlines: [] });
A(composedBothZero.ok === true, 'P2:两边都有效零结果时载体 ok=true(页面不整体空白,双栏各自展示)');
A(composedBothZero.mainlinesBySource.eastmoney.available && composedBothZero.mainlinesBySource.ths.available, 'P2:两边均 available=true');
A(!composedBothZero.mainlinesBySource.eastmoney.hasMainlines && !composedBothZero.mainlinesBySource.ths.hasMainlines, 'P2:两边 hasMainlines=false,各带自己零结果原因');
A(composedBothZero.mainlinesBySource.ths.reason === 'no-l2-qualified-mainline', 'P2:同花顺零结果带自己的 L2 闸原因(不借东财原因)');
// 前端:有 mainlinesBySource 不走单列空态早退;双栏区分"无合格主线"与"暂缺"
A(html.includes('!lines.length && !(d && d.mainlinesBySource)'), 'P2 前端:有 mainlinesBySource 时不走单列空态早退(双栏仍展示)');
A(html.includes('src.available && src.hasMainlines') && html.includes('无合格主线') && html.includes('暂缺'), 'P2 前端:双栏三态区分(有主线/无合格主线/暂缺)');
const bySourceReviewHTML = renderMainlineReviewHTML({
  days: [{
    day: '2026-07-13', phase: '早盘', sampleValid: true, pendingReview: false,
    noMainline: true, theme: '', leaders: [], expectedStars: [], actualTop: [{ theme: '算力', count: 3, rankTier: 1 }],
    bySource: {
      eastmoney: { available: true, status: 'no-mainline', theme: '', noMainline: true, mainlineHitTop1: null, mainlineHitTop3: null },
      ths: { available: true, status: 'mainline', theme: '算力', noMainline: false, mainlineHitTop1: true, mainlineHitTop3: true },
    },
  }],
  stats: { bySource: {
    eastmoney: { mainlineTotal: 0, mainlineTop1Hits: 0, mainlineTop3Hits: 0, mainlineTop1Rate: null, mainlineTop3Rate: null },
    ths: { mainlineTotal: 1, mainlineTop1Hits: 1, mainlineTop3Hits: 1, mainlineTop1Rate: 100, mainlineTop3Rate: 100 },
  } },
});
A(bySourceReviewHTML.includes('<span class="mlr-label">东财</span>') && bySourceReviewHTML.includes('<span class="mlr-theme">无主线</span>'), 'P2 回看页:东财明确显示无主线');
A(bySourceReviewHTML.includes('<span class="mlr-label">同花顺</span>') && bySourceReviewHTML.includes('<span class="mlr-theme">算力</span>'), 'P2 回看页:同花顺独立显示算力主线');
A(bySourceReviewHTML.includes('同花顺 命中 1/1(100%) · 前三 1/1(100%)'), 'P2 回看统计:同花顺独立显示命中/前三数据');
A(bySourceReviewHTML.includes('<span class="mlr-actual"') && bySourceReviewHTML.includes('盘后 算力'), 'P2 回看页:双源有主线记录继续显示盘后实际第一家族');
A(!bySourceReviewHTML.includes('<span class="mlr-theme">今日无主线</span>') && !bySourceReviewHTML.includes('候选未通过 L2'), 'P2 回看页:东财空+同花顺有预测时不再输出无来源的整体“今日无主线”误导');
const bothNoMainlineReviewHTML = renderMainlineReviewHTML({
  days: [{
    day: '2026-07-16', phase: '尾盘', sampleValid: true, pendingReview: false,
    noMainline: true, leaders: [], expectedStars: [], actualTop: [],
    bySource: {
      eastmoney: { available: true, status: 'no-mainline', theme: '', noMainline: true, mainlineHitTop1: null, mainlineHitTop3: null },
      ths: { available: true, status: 'no-mainline', theme: '', noMainline: true, mainlineHitTop1: null, mainlineHitTop3: null },
    },
  }],
  stats: { bySource: { eastmoney: { mainlineTotal: 0 }, ths: { mainlineTotal: 0 } } },
});
A(bothNoMainlineReviewHTML.includes('<span class="mlr-label">双源</span>')
  && bothNoMainlineReviewHTML.includes('<span class="mlr-theme">今日无主线</span>')
  && bothNoMainlineReviewHTML.includes('<span class="mlr-no-star"')
  && bothNoMainlineReviewHTML.includes('>未通过明星验证</span>'), '双源都有效无主线时同行显示“今日无主线 / 未通过明星验证”');
A(!bothNoMainlineReviewHTML.includes('候选未通过 L2 明星验证，不计正式主线')
  && !bothNoMainlineReviewHTML.includes('<span class="mlr-arrow"'), '双源无主线状态不显示冗长说明或空箭头');
const unavailableReviewHTML = renderMainlineReviewHTML({
  days: [{
    day: '2026-07-14', phase: '早盘', sampleValid: true, pendingReview: false,
    noMainline: true, leaders: [], expectedStars: [], actualTop: [], mainReasonMissingCount: 2,
    bySource: {
      eastmoney: { available: false, status: 'unavailable', reason: 'source-unavailable', message: '东财当时暂不可用', theme: '', noMainline: false, mainlineHitTop1: null, mainlineHitTop3: null },
      ths: { available: true, status: 'mainline', theme: '算力', noMainline: false, mainlineHitTop1: null, mainlineHitTop3: null },
    },
  }],
  stats: { bySource: { eastmoney: { mainlineTotal: 0 }, ths: { mainlineTotal: 0 } } },
});
A(unavailableReviewHTML.includes('<span class="mlr-theme">来源暂缺</span>') && unavailableReviewHTML.includes('>暂缺</span>'), '终审P2 回看页:来源不可用明确显示“来源暂缺/暂缺”，不冒充无主线');
A(unavailableReviewHTML.includes('<span class="mlr-theme">算力</span>') && unavailableReviewHTML.includes('>数据不足</span>'), '终审P3 回看页:另一源主题保留，真实家族不完整时可见显示“数据不足”');
A(!unavailableReviewHTML.includes('<span class="mlr-theme">无主线</span>'), '终审P2 回看页:暂缺源不被写成无主线');
const mixedReviewHTML = renderMainlineReviewHTML({
  days: [
    { day: '2026-07-10', phase: '尾盘', sampleValid: true, noMainline: false, theme: '医药', star: null, leaders: [], expectedStars: [], actualTop: [], mainlineHitTop1: null },
    { day: '2026-07-13', phase: '早盘', sampleValid: true, noMainline: false, theme: '算力', star: null, leaders: [], expectedStars: [], actualTop: [],
      bySource: { eastmoney: { available: true, status: 'mainline', theme: '算力', noMainline: false, mainlineHitTop1: null }, ths: { available: true, status: 'no-mainline', theme: '', noMainline: true, mainlineHitTop1: null } } },
  ],
  stats: { starWins: 1, starTotal: 2, starWinRate: 50, leaderWins: 1, leaderTotal: 2, leaderWinRate: 50, expectedSealWins: 1, expectedSealTotal: 2, expectedSealRate: 50,
    bySource: { eastmoney: { mainlineTotal: 0 }, ths: { mainlineTotal: 0 } } },
});
A(mixedReviewHTML.includes('预期明星封板（兼容口径）') && mixedReviewHTML.includes('收益统计沿用历史兼容口径（v3 为东财，旧记录按原口径）'), '终审P2:混合旧/新 schema 的聚合收益明确标为兼容口径');
A(!mixedReviewHTML.includes('东财明星次日胜率') && !mixedReviewHTML.includes('东财龙头1次日胜率'), '终审P2:混合窗口不把旧 schema 聚合收益错误冠名为东财');
const mixedOutcomeHTML = renderMainlineReviewHTML({
  days: [{ day: '2026-07-13', phase: '尾盘', sampleValid: true, noMainline: false, theme: '算力', leaders: [], expectedStars: [], actualTop: [{ theme: '算力', count: 2 }],
    bySource: { eastmoney: { available: true, status: 'mainline', theme: '算力', noMainline: false, mainlineHitTop1: true, mainlineHitTop3: true }, ths: { available: true, status: 'mainline', theme: '医药', noMainline: false, mainlineHitTop1: false, mainlineHitTop3: false } } }],
  stats: { bySource: { eastmoney: { mainlineTotal: 1 }, ths: { mainlineTotal: 1 } } },
});
A(mixedOutcomeHTML.includes('<div class="mlr-row hit-na'), '终审P3:一源命中一源脱靶时整行用中性强调，不用“最好结果”绿色误导');
const legacyReviewHTML = renderMainlineReviewHTML({
  days: [{ day: '2026-07-10', phase: '尾盘', sampleValid: true, noMainline: true, leaders: [], expectedStars: [], actualTop: [] }],
  stats: { mainlineTotal: 0 },
});
A(legacyReviewHTML.includes('<span class="mlr-theme">今日无主线</span>'), '旧 schema 回看继续使用原单来源展示,不破坏历史兼容');
A(legacyReviewHTML.includes('<span class="mlr-no-star"')
  && legacyReviewHTML.includes('>未通过明星验证</span>'), '旧 schema 无主线记录把明星验证状态同行显示');
A(!legacyReviewHTML.includes('候选未通过 L2 明星验证，不计正式主线')
  && !legacyReviewHTML.includes('<div class="mlr-l2">'), '旧 schema 无主线记录不再占用独立详情行');

// ---- 4c. 回看明星状态视觉:确认/预期必须成为可扫描的行级信号,普通记录不误着色 ----
const starVisualReviewHTML = renderMainlineReviewHTML({
  days: [
    { day: '2026-07-08', phase: '已收盘', sampleValid: false, sampleInvalidReason: 'phase:已收盘', noMainline: false, theme: '算力AI', mainlineHitTop1: true,
      star: { code: '000938', name: '紫光股份', predictLevel: 'confirmed' }, leaders: [], expectedStars: [], actualTop: [] },
    { day: '2026-07-14', phase: '盘中', sampleValid: true, noMainline: false, theme: '创新药', mainlineHitTop3: true,
      star: { code: '300760', name: '迈瑞医疗', predictLevel: 'expected', sealStatus: 'sealed' }, leaders: [],
      expectedStars: [{ code: '300760', name: '迈瑞医疗', sealStatus: 'sealed' }], actualTop: [] },
    { day: '2026-07-15', phase: '盘中', sampleValid: true, noMainline: false, theme: '白酒', mainlineHitTop3: false,
      star: { code: '600519', name: '贵州茅台', predictLevel: 'expected', sealStatus: 'notSealed' }, leaders: [],
      expectedStars: [{ code: '600519', name: '贵州茅台', sealStatus: 'notSealed' }], actualTop: [] },
    { day: '2026-07-16', phase: '盘中', sampleValid: true, noMainline: false, theme: '半导体', mainlineHitTop1: null,
      star: { code: '603986', name: '兆易创新', predictLevel: 'expected', sealStatus: 'noData' }, leaders: [],
      expectedStars: [{ code: '603986', name: '兆易创新', sealStatus: 'noData' }], actualTop: [] },
    { day: '2026-07-13', phase: '盘中', sampleValid: true, noMainline: false, theme: '消费电子', mainlineHitTop3: true,
      star: null, leaders: [], expectedStars: [], actualTop: [] },
  ],
  stats: {},
});
A(starVisualReviewHTML.includes('mlr-row hit-invalid star-confirmed invalid') && starVisualReviewHTML.includes('mlr-star-signal confirmed'), '已收盘不计样本的明星确认记录仍保留确认态行级样式');
A(starVisualReviewHTML.includes('预期转明星</i><b>迈瑞医疗') && /mlr-row [^"\n]*star-confirmed/.test(starVisualReviewHTML), '预期明星最终封板升级为红色真主线证据');
A(starVisualReviewHTML.includes('star-expected star-missed') && starVisualReviewHTML.includes('mlr-star-signal missed')
  && starVisualReviewHTML.includes('预期未兑现</i><b>贵州茅台'), '预期明星最终未封板使用未兑现状态');
A(starVisualReviewHTML.includes('star-expected star-pending') && starVisualReviewHTML.includes('mlr-star-signal pending')
  && starVisualReviewHTML.includes('证据待补</i><b>兆易创新'), '盘后证据缺失使用中性待验证状态');
A(starVisualReviewHTML.includes('明星确认</i><b>紫光股份') && starVisualReviewHTML.includes('预期转明星</i><b>迈瑞医疗'), '两种明星确认路径均与股票名称成组展示');
A((starVisualReviewHTML.match(/star-confirmed/g) || []).length === 2
  && (starVisualReviewHTML.match(/star-missed/g) || []).length === 1
  && (starVisualReviewHTML.match(/star-pending/g) || []).length === 1, '普通回看记录不会误套明星结果样式');
A(starVisualReviewHTML.indexOf('mlr-group confirmed') < starVisualReviewHTML.indexOf('mlr-group missed')
  && starVisualReviewHTML.indexOf('mlr-group missed') < starVisualReviewHTML.indexOf('mlr-group pending'), '回看按真主线、未兑现、待验证顺序分组');
A((starVisualReviewHTML.match(/主线命中/g) || []).length >= 2 && !starVisualReviewHTML.includes('✓命中'), '主线命中使用独立结论文案,不再与明星阶段混为同一状态');
A(/mlr-row hit-invalid star-confirmed invalid[\s\S]*?主线命中/.test(starVisualReviewHTML), '不计样本标记、主线命中与明星确认可在同一记录中独立共存');
A(html.includes('body.view-strategy .mlr-row.star-confirmed.invalid') && html.includes('opacity: 1;'), '明星证据高亮覆盖 invalid 全行透明度，7月8日不再被变灰');

// ---- 5. 静态锁定:每源只用自己的 zsType 取板;KPL(7) 不进任一边,也不进策略辅助指标 ----
A(/boardZsTypes:\s*\[6\]/.test(src) && /boardZsTypes:\s*\[5\]/.test(src), '正常路径按 boardZsTypes:[6] 与 [5] 各自独立跑引擎(从不传 7)');
A(!/boardZsTypes:\s*\[[^\]]*7[^\]]*\]/.test(src), 'KPL(7) 从不作为任一预测的板块来源');
A(/zsTypes:\s*activeBoardZsTypes/.test(src), 'impl 取板按 activeBoardZsTypes(来自 boardZsTypes,默认[6,5]剔除KPL)');
A(/async function getDayThemeBoardStats\([^)]*\)\s*\{[\s\S]*?getDayBoardsWithMembers\(day,\s*\{\s*zsTypes:\s*STRATEGY_ZS_TYPES\s*\}/.test(src), '今日热点榜资金/涨幅补充(策略辅助指标)剔除 KPL');
A(/async function getStrategyStrongResonance\([^)]*\)\s*\{[\s\S]*?getDayBoardsWithMembers\(day,\s*\{\s*zsTypes:\s*STRATEGY_ZS_TYPES\s*\}/.test(src), '强势板块共振榜(策略辅助指标)剔除 KPL');

// ---- 5b. 盘中动能采样按来源隔离:真实 strategyMainlineTrackTrend(Codex 二审 P1) ----
// 复现场景:东财"医药"先记录 76.56 亿基线,6 分钟后同花顺"医药"43.08 亿——加了 zs 前缀后两边键不同,
// 同花顺拿到的是自己的首个样本(trend=null),不会与东财基线算出 -33 亿的假动能。
const STRATEGY_MAINLINE_TREND_MIN_GAP_MS = 3 * 60 * 1000;
const STRATEGY_MAINLINE_TREND_WINDOW_MS = 45 * 60 * 1000;
const STRATEGY_MAINLINE_TREND_BASE_MIN_AGE_MS = 5 * 60 * 1000;
const strategyMainlineTrendSamples = new Map();
const isFiniteNumeric = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
eval(extractFn('strategyMainlineTrackTrend'));
const sixMinAgo = Date.now() - 6 * 60 * 1000;
// 东财"医药"6 分钟前的基线样本(净流入 76.56 亿,大涨 10)
strategyMainlineTrendSamples.set('zs6::group:医药', [{ ts: sixMinAgo, netInflow: 76.56e8, bigGainCount: 10, nearLimitCount: 0, count: 5 }]);
// 东财本次(有 6 分钟前基线)→ 应算出动能
const emTrend = strategyMainlineTrackTrend('zs6::group:医药', { netInflow: 80e8, bigGainCount: 11, nearLimitCount: 0, count: 5 });
A(emTrend && Number(emTrend.inflowDelta) > 0, '东财"医药"有自己 6 分钟前基线 → 算出正动能');
// 同花顺本次同题材(zs5 键无任何历史样本)→ 首个样本,trend=null,绝不借东财基线
const thTrend = strategyMainlineTrackTrend('zs5::group:医药', { netInflow: 43.08e8, bigGainCount: 2, nearLimitCount: 0, count: 8 });
A(thTrend === null, '同花顺"医药"首次采样返回 null(不与东财 76.56 亿基线算出 -33 亿假动能)');
A(strategyMainlineTrendSamples.has('zs5::group:医药') && strategyMainlineTrendSamples.get('zs5::group:医药').length === 1, '同花顺记录了自己独立的首个样本序列');
// 反证:若不加来源前缀(共用"group:医药"键),第二次采样就会拿到第一次的基线算出假 delta
strategyMainlineTrendSamples.set('group:医药', [{ ts: sixMinAgo, netInflow: 76.56e8, bigGainCount: 10, nearLimitCount: 0, count: 5 }]);
const sharedTrend = strategyMainlineTrackTrend('group:医药', { netInflow: 43.08e8, bigGainCount: 2, nearLimitCount: 0, count: 8 });
A(sharedTrend && Number(sharedTrend.inflowDelta) < 0, '反证:共用键时第二次采样确实会与前一基线算出负 delta(前缀正是为消除此串扰)');
// 调用点确实按来源前缀 zs+zsType 组装趋势键
A(/trendKeyPrefix = 'zs' \+ activeBoardZsTypes\.join\('-'\)/.test(src), '调用点按 zs+activeBoardZsTypes 组装来源前缀');
A(/strategyMainlineTrackTrend\(trendKey,/.test(src) && /trendKeyPrefix \? String\(trendKeyPrefix\) \+ '::'/.test(src), 'augmentPrediction 用来源前缀化的 trendKey 采样');

// ---- 5c. 统一 L2 自动扫描:两源合并候选按跨源字典序,高净流入源不被低净流入源抢先(Codex 三审 P1) ----
const STRATEGY_MAINLINE_BIG_GAIN_PCT = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_WINDOW_MS = 5 * 60 * 1000;
const STRATEGY_MAINLINE_AUTO_SCAN_MAX_PER_WINDOW = 2;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_INFLOW = 5e8;
const STRATEGY_MAINLINE_AUTO_SCAN_MIN_ZT = 2;
const THS_ZS_TYPE = 5;
const STRATEGY_MAINLINE_AUTO_SCAN_LIMIT_STOCKS = 50;
const strategyMainlineAutoScanState = { windowStart: 0, dispatched: 0, lastJobId: '' };
const strategyMainlineFamilyInfo = (x) => ({ key: 'group:' + String(x && x.theme || '') });
const strategyMainlineScanPriorityCodes = () => [];
eval(extractFn('numOrNull'));
eval(extractFn('strategyMainlineThsCompositeEligibility'));
eval(extractFn('strategyMainlineBoardAutoScanEligibility'));
const l2jobs = {};
let l2seq = 0;
const dispatched = [];
const localL2TaskQueue = {
  configured: () => true,
  get: (id) => l2jobs[id] || null,
  latest: () => null,   // 无既有任务
  start: (job) => { const jobId = 'J' + (++l2seq); const rec = { jobId, ...job, status: 'queued' }; l2jobs[jobId] = rec; dispatched.push(rec); return rec; },
};
eval(extractFn('strategyMainlineMaybeAutoScan'));
// 东财板列在前(9亿),同花顺板在后(99亿);跨源字典序应让同花顺 99亿 先被派发
const scanBoards = [
  { plateId: 'E1', name: '东财板', netInflow: 9e8, zt: 2, zsType: 6, scanChannel: '', memberRows: [{ code: '600001', gain: 6 }] },
  { plateId: 'T1', name: '同花顺板', netInflow: 99e8, netInflowZjjlr: 8e8, netInflowMetric: 'ths-dde-big-order-amount', zt: 2, zsType: 5, scanChannel: '', memberRows: [{ code: '600002', gain: 6 }] },
];
strategyMainlineMaybeAutoScan(scanBoards, '2026-07-15', true, '早盘', null);
A(dispatched.length === 1, '统一扫描:一次只派发一个任务(限流不变)');
A(dispatched[0].plateId === 'T1' && Number(dispatched[0].zsType) === 5, '统一扫描:同花顺 99亿板先于东财 9亿板被派发(跨源按净流入排序,非完成顺序)');
// 再来一次:上一个任务仍 queued(单任务在飞)→ 不再派发,单一来源无法独占两个名额
strategyMainlineMaybeAutoScan(scanBoards, '2026-07-15', true, '早盘', null);
A(dispatched.length === 1 && strategyMainlineAutoScanState.dispatched === 1, '统一扫描:上一任务在飞时不再派发,五分钟两名额不被单源无意独占');
// 调用点接线:两 impl deferAutoScan,外层合并候选统一派发
A(/deferAutoScan: true/.test(src) && /!options\.leaderDebug && !options\.deferAutoScan/.test(src), 'impl 支持 deferAutoScan,两源配对时各自不派发');
A(/const scanBoards = \[\.\.\.\(\(em && em\.__autoScanBoards\)/.test(src) && /strategyMainlineMaybeAutoScan\(scanBoards, requestedDay, true/.test(src), '外层用两源合并候选统一派发一次');

// ---- 6. 性能优化:配对运行期「按日只读」缓存去重且结果一致(不改口径) ----
const { AsyncLocalStorage } = require('async_hooks');
const strategyMainlineReadCache = new AsyncLocalStorage();
eval(extractFn('strategyMainlineReadCachedCall'));
(async () => {
  let calls = 0;
  const loader = async (day) => { calls += 1; return { day, payload: 'DB-' + day }; };
  // 无作用域:每次都真读(其它调用者行为零变化)
  calls = 0;
  await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
  await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
  A(calls === 2, '无配对作用域:不缓存,每次都真读(不影响其它调用者)');
  // 作用域内:同一天只读一次,不同天各读一次,结果与真读一致
  await strategyMainlineReadCache.run(new Map(), async () => {
    calls = 0;
    const a1 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    const a2 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    const b1 = await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-14', undefined);
    A(calls === 2, '配对作用域:同一天(07-15)只读一次、不同天(07-14)另读一次 → 共 2 次真读');
    A(a1.payload === 'DB-2026-07-15' && a2.payload === 'DB-2026-07-15' && a1 === a2, '缓存命中返回同一份且内容一致(结果字节不变)');
    A(b1.payload === 'DB-2026-07-14', '不同天返回各自的内容');
    // 带非默认 options 不走缓存(可能改变返回)
    calls = 0;
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', { overrides: true });
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', { overrides: true });
    A(calls === 2, '带非默认 options 的读取绕过缓存(保守,不改带参返回)');
  });
  // 不同 kind 同一天互不串
  await strategyMainlineReadCache.run(new Map(), async () => {
    calls = 0;
    await strategyMainlineReadCachedCall('mainReason', loader, '2026-07-15', undefined);
    await strategyMainlineReadCachedCall('limitUpDb', loader, '2026-07-15', undefined);
    A(calls === 2, '不同库(kind)同一天各自缓存,不串键');
  });

  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-TWO-SOURCE-MAINLINES CHECKS PASSED');
})();
