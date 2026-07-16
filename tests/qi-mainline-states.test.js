// QI 主线判定与页面六态测试(node tests/qi-mainline-states.test.js)。
const fsReal = require('fs');
const pathReal = require('path');
const src = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
const html = fsReal.readFileSync(pathReal.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8');
const { isExcludedL2StockCode } = require(pathReal.join(__dirname, '..', 'local-l2-task-queue.js'));

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

// 1. certainty 封顶:已扫无明星时最高降到中等;未扫不惩罚
const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
const normalizeReasonSourceCode = v => String(v || '').replace(/\D/g, '').trim();
const STRATEGY_MAINLINE_STAR_LEVEL_ORDER = { confirmed: 0, expected: 1, active: 2 };
eval(extractFn('strategyMainlineCertainty'));
const richItem = { count: 3, maxLianban: 2, bigGainCount: 5, nearLimitCount: 2, priorReasonCount: 3, netInflow: 5e8, boardCount: 3 };
const base = strategyMainlineCertainty(richItem, null, {});
A(base.level === 'high', '信号充足时基线为高确定性');
const capped = strategyMainlineCertainty(richItem, null, { scannedNoStar: true });
A(capped.level === 'medium', '已扫无明星:高确定性封顶降为中等');
const unscanned = strategyMainlineCertainty(richItem, null, { scannedNoStar: false });
A(unscanned.level === 'high', '未扫描不惩罚(scannedNoStar=false 保持高)');
const mid = strategyMainlineCertainty({ count: 1, bigGainCount: 3, nearLimitCount: 1 }, null, { scannedNoStar: true });
A(mid.level !== 'high', '中等及以下不再额外降(只封顶不叠罚)');

// 2. 接线静态断言(后端)
A(src.includes('queuedPlates,') && src.includes('runningPlates,') && src.includes('errorPlates,'), 'collectStars 返回排队/运行/失败细分集合');
A(src.includes('strategyMainlineDeriveL2Status(l2Stars, hasQiStar, themeCodes)'), '三态推导走独立函数(含完成与覆盖门槛)');
A(src.includes('strategyMainlineDeriveL2ScanState(l2Stars, hasQiStar, themeCodes, autoScanEligibility)'), '页面六态走独立推导函数,不改变正式三态');
A(src.includes("star.level === 'confirmed' || star.level === 'expected'"), 'QI 判定=预期明星或明星确认(L2 全方位符合)');
A(src.includes("l2VerificationStatus: m.l2VerificationStatus || ''"), 'P1-C 预测记录携带 QI 状态');
A(src.includes("l2ScanState: m.l2ScanState || ''"), '预测记录携带页面六态,支持回看解释');
A(src.includes("scannedNoStar: l2VerificationStatus === 'scanned-no-star'"), 'certainty 接收已扫无明星标志');
A(!src.includes('isConfirmedMainline = l2') && src.includes('const l2VerificationStatus'), '独立字段,不复用 isConfirmedMainline');
A(src.includes(': strategyMainlineApplyL2StarGate(inflowGate.kept);')
  && src.includes("rule: 'visible-mainline-requires-expected-or-confirmed-star'"), '正式主线榜严格要求 L2 预期明星或明星确认');
A(src.includes('getStrategyMainlinesVisible(url.searchParams.get') && src.includes('strategyMainlineAttachExpectedHistoryPayload(payload, predict)'), '正式页面接口对旧缓存与冻结快照补历史预期证据后再执行严格 QI 过滤');
A(src.includes("options?.leaderDebug\n    ? { kept: inflowGate.kept, excluded: [] }"), '管理员复核保留完整候选池,可解释板块为何未上榜');
const autoScanAt = src.indexOf('strategyMainlineMaybeAutoScan(boardPayload?.boards || []');
const strictGateAt = src.indexOf(': strategyMainlineApplyL2StarGate(inflowGate.kept);');
A(autoScanAt >= 0 && strictGateAt > autoScanAt, '后台先派发符合条件的 L2 扫描，再执行用户可见主线硬闸');

// 3. 接线静态断言(前端)
A(['未达扫描条件','等待公司端','扫描中','覆盖不足','L2未见明星','QI主线'].every(label => html.includes(label)), '前端六态徽章齐备');
A(html.includes("Number(board?.netInflow) >= 5e8 && Number(board?.ztCount) >= 2")
  && html.includes("legacyL2Eligible ? 'coverage-insufficient' : 'not-eligible'"), '旧冻结快照按同一5亿+2涨停门槛区分未达条件/历史覆盖不足');
A(html.includes('${qiBadge}${confirmedBadge}'), 'QI 徽章与 Owner 确认徽章并列独立');
A(html.includes("const visibleStars = (m.starStocks || []).filter(s => s.level === 'confirmed' || s.level === 'expected').slice(0, 3)"), '明星行只显确认/预期,至多3只');
A(html.includes("s.expectedOutcome === 'not-confirmed' ? ' missed' : ''") && src.includes('预期明星·未兑现'), '盘中预期未转为明星时使用醒目的未兑现复盘样式');
A(!html.includes('>潜力</span>'), '潜力行已退役(Owner 定稿:预期明星取代)');
A(src.includes('focusStocks,'), 'focusStocks 后端数据保留(供调度用)');

// 4. 前端内联脚本编译
let ok = true;
for (const m2 of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  try { new Function(m2[1]); } catch (e) { ok = false; console.error('compile failed:', e.message); }
}
A(ok, '前端内联脚本可编译');

// 5. 评审修正:三态推导行为测试(分批回传不判负/完成+覆盖才判负/预期明星立即QI)
eval(extractFn('strategyMainlineDeriveL2Status'));
const mk = (completed, covered, pending = [], runningCovered = [], queue = [], running = [], errors = []) => ({
  completedPlates: new Set(completed),
  pendingPlates: new Set(pending),
  queuedPlates: new Set(queue),
  runningPlates: new Set(running),
  errorPlates: new Set(errors),
  completedCoveredCodes: new Set(covered),                    // done 任务覆盖
  coveredCodes: new Set([...covered, ...runningCovered]),     // 全部覆盖(含 running 分批)
  scannedPlates: new Set(completed.length ? completed : ['p1']),
});
const theme5 = new Set(['A1', 'A2', 'A3', 'A4', 'A5']);
A(strategyMainlineDeriveL2Status(mk([], ['A1', 'A2', 'A3']), false, theme5) === 'unscanned', '运行中分批回传(无完成任务):不判负,保持待验证');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1', 'A2', 'A3']), false, theme5) === 'scanned-no-star', '扫描完成且相关股覆盖(>=3):才判已扫无明星');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['X1', 'X2', 'X3']), false, theme5) === 'unscanned', '扫描完成但覆盖的都是无关股:不判负');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1']), false, theme5) === 'unscanned', '完成但相关覆盖不足(1/5<3):不判负');
A(strategyMainlineDeriveL2Status(mk([], []), true, theme5) === 'qi', '发现预期明星/明星确认:即使扫描未完成也立即 QI');
const theme2 = new Set(['B1', 'B2']);
A(strategyMainlineDeriveL2Status(mk(['p1'], ['B1']), false, theme2) === 'unscanned', '小主线(2只)只覆盖1只:不判负');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['B1', 'B2']), false, theme2) === 'scanned-no-star', '小主线全覆盖:可判负');
// 二审组合场景:一个 done(只覆盖A1)+ 一个 running(分批回传A2/A3)——不得判负
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1'], ['p2'], ['A2', 'A3']), false, theme5) === 'unscanned', '一done一running:running 分批覆盖不给判负凑数,且有 pending 即不判负');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1', 'A2', 'A3'], ['p2'], []), false, theme5) === 'unscanned', 'done 覆盖已够但相关任务仍在运行:保持待验证');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1', 'A2', 'A3'], [], ['A4', 'A5']), false, theme5) === 'scanned-no-star', '无 pending 且 done 覆盖达标:可判负(历史 running 残留覆盖不影响)');
A(strategyMainlineDeriveL2Status(mk(['p1'], ['A1'], [], ['A2', 'A3']), false, theme5) === 'unscanned', '无 pending 但 done 只覆盖1只(running 残留 A2/A3 不计):不判负');

// 5b. 页面六态:不参与评分,只解释任务究竟停在哪一层。
eval(extractFn('strategyMainlineL2CoverageSummary'));
eval(extractFn('strategyMainlineDeriveL2ScanState'));
const eligible = { eligible: true };
const ineligible = { eligible: false };
A(strategyMainlineDeriveL2ScanState(mk([], []), false, theme5, ineligible) === 'not-eligible', '未达5亿且2涨停门槛:未达扫描条件');
A(strategyMainlineDeriveL2ScanState(mk([], []), false, theme5, eligible) === 'waiting-worker', '已达门槛但尚无任务:等待公司端');
A(strategyMainlineDeriveL2ScanState(mk([], []), false, theme5, { eligible: true, dispatchable: false }) === 'coverage-insufficient', '门槛达标但成分股未取到:覆盖不足,不伪装成公司端排队');
A(strategyMainlineDeriveL2ScanState(mk([], [], ['p1'], [], ['p1']), false, theme5, eligible) === 'waiting-worker', '任务 queued:等待公司端');
A(strategyMainlineDeriveL2ScanState(mk([], [], ['p1'], [], [], ['p1']), false, theme5, eligible) === 'running', '任务 running:扫描中');
A(strategyMainlineDeriveL2ScanState(mk(['p1'], ['A1']), false, theme5, eligible) === 'coverage-insufficient', '任务完成但覆盖不足:覆盖不足');
A(strategyMainlineDeriveL2ScanState(mk(['p1'], ['A1', 'A2', 'A3']), false, theme5, eligible) === 'scanned-no-star', '任务完成且覆盖达标无明星:L2未见明星');
A(strategyMainlineDeriveL2ScanState(mk([], []), true, theme5, eligible) === 'qi', '出现预期明星/明星确认:QI主线');

// 6. Owner 规则:只有 L2 正证据(expected/confirmed)能进入正式主线榜；其他状态仅留作内部候选。
eval(extractFn('strategyMainlineHasQiStarEvidence'));
eval(extractFn('strategyMainlineL2RejectReason'));
eval(extractFn('strategyMainlineApplyL2StarGate'));
const gated = strategyMainlineApplyL2StarGate([
  { theme: '医药', familyKey: 'group:医药', count: 8, l2VerificationStatus: 'scanned-no-star' },
  { theme: '算力AI', familyKey: 'group:算力AI', count: 5, l2VerificationStatus: 'qi', starStocks: [{ code: '000001', level: 'expected' }] },
  { theme: '机器人', familyKey: 'group:机器人', count: 4, l2VerificationStatus: 'qi', starStocks: [{ code: '000002', level: 'confirmed' }] },
  { theme: '半导体', familyKey: 'group:半导体', count: 4, l2VerificationStatus: 'unscanned', l2ScanState: 'waiting-worker' },
  { theme: '消费', familyKey: 'group:消费', count: 3, l2VerificationStatus: 'qi', starStocks: [{ code: '000003', level: 'active' }] },
]);
A(gated.kept.map(x => x.theme).join(',') === '算力AI,机器人', '正式榜只保留预期明星或明星确认方向');
A(gated.excluded.length === 3, '已扫无明星、未扫描/等待及仅 active 的候选全部从正式榜排除');
A(gated.excluded.some(x => x.theme === '医药' && x.reason === 'completed-scan-without-star'), '已扫无明星返回可审计原因');
A(gated.excluded.some(x => x.theme === '半导体' && x.reason === 'l2-scan-waiting-worker'), '等待公司端候选不进榜并保留状态原因');
A(gated.excluded.some(x => x.theme === '消费' && x.reason === 'qi-status-without-star-evidence'), '只有 active 不能冒充 QI 正证据');

// 6a. 盘中一旦出现预期明星，当日资格不可逆；收盘未确认只标“未兑现”，不删除主线卡。
eval(extractFn('strategyMainlineExpectedTransitionMap'));
eval(extractFn('strategyMainlineAttachExpectedHistory'));
const expectedMap = strategyMainlineExpectedTransitionMap({ starTransitions: [{
  mainlineKey: 'group:医药', mainlineTheme: '医药', code: '600001', name: '预期股',
  firstExpectedAt: '2026-07-16T02:00:00.000Z', confirmedAt: null, lastLevel: 'active',
  firstGain: 6.8, ratios: { activeRatio: 1.9, passiveRatio: 0.8, supportRatio: 1.2 },
  maxBucket: { amount: 10000000, activeBuy: 180000000 },
}] });
const sourceMaps = {
  eastmoney: strategyMainlineExpectedTransitionMap({ bySource: {
    eastmoney: { starTransitions: [{ mainlineKey: 'group:东财', code: '600010', firstExpectedAt: '2026-07-16T02:01:00.000Z' }] },
    ths: { starTransitions: [{ mainlineKey: 'group:同花顺', code: '600011', firstExpectedAt: '2026-07-16T02:02:00.000Z' }] },
  } }, 'eastmoney'),
  ths: strategyMainlineExpectedTransitionMap({ bySource: {
    eastmoney: { starTransitions: [{ mainlineKey: 'group:东财', code: '600010', firstExpectedAt: '2026-07-16T02:01:00.000Z' }] },
    ths: { starTransitions: [{ mainlineKey: 'group:同花顺', code: '600011', firstExpectedAt: '2026-07-16T02:02:00.000Z' }] },
  } }, 'ths'),
};
A(sourceMaps.eastmoney.has('group:东财') && !sourceMaps.eastmoney.has('group:同花顺')
  && sourceMaps.ths.has('group:同花顺') && !sourceMaps.ths.has('group:东财'), '预期明星轨迹按东财/同花顺来源隔离,不跨源串线');
const stickyExpected = strategyMainlineAttachExpectedHistory({
  theme: '医药', familyKey: 'group:医药', netInflow: -1e8,
  l2VerificationStatus: 'scanned-no-star', l2ScanState: 'scanned-no-star', starStocks: [],
}, expectedMap, '已收盘');
A(stickyExpected.hadExpectedStarToday && stickyExpected.l2VerificationStatus === 'qi' && stickyExpected.l2ScanState === 'qi', '历史预期证据把当日主线资格固定为 QI');
A(stickyExpected.starStocks[0].level === 'expected' && stickyExpected.starStocks[0].label === '预期明星·未兑现'
  && stickyExpected.starStocks[0].expectedOutcome === 'not-confirmed', '最终未成为明星时保留预期股并明确标为未兑现');
A(strategyMainlineApplyL2StarGate([stickyExpected]).kept.length === 1, '预期未兑现板块仍保留在当日正式主线榜');

// 6b. 旧收盘快照/文件缓存也必须在返回时收紧，不能绕过新生成器硬闸。
eval(extractFn('strategyMainlineRestrictToQiPayload'));
eval(extractFn('strategyMainlineAttachExpectedHistoryPayload'));
const strictPayload = strategyMainlineRestrictToQiPayload({
  ok: true,
  mainlines: [
    { theme: '未扫候选', familyKey: 'theme:未扫', l2VerificationStatus: 'unscanned' },
    { theme: 'QI方向', familyKey: 'theme:QI', l2VerificationStatus: 'qi', starStocks: [{ level: 'confirmed' }], todayCodes: ['000001'] },
  ],
  mainlinesBySource: {
    eastmoney: { available: true, mainlines: [{ theme: '未扫候选', familyKey: 'theme:未扫', l2VerificationStatus: 'unscanned' }] },
    ths: { available: true, mainlines: [{ theme: 'QI方向', familyKey: 'theme:QI', l2VerificationStatus: 'qi', starStocks: [{ level: 'expected' }] }] },
  },
});
A(strictPayload.mainlines.length === 1 && strictPayload.mainlines[0].theme === 'QI方向' && strictPayload.count === 1, '旧顶层快照只返回 QI 正证据方向并重排');
A(strictPayload.mainlinesBySource.eastmoney.mainlines.length === 0 && strictPayload.mainlinesBySource.eastmoney.hasMainlines === false, '旧东财候选被严格过滤为有效零主线');
A(strictPayload.mainlinesBySource.ths.mainlines.length === 1, '旧同花顺 QI 正证据方向保留');
const restoredPayload = strategyMainlineRestrictToQiPayload(strategyMainlineAttachExpectedHistoryPayload({
  ok: true, sessionPhase: '已收盘', mainlines: [{ theme: '医药', familyKey: 'group:医药', l2VerificationStatus: 'scanned-no-star' }],
}, { starTransitions: [{ mainlineKey: 'group:医药', code: '600001', name: '预期股', firstExpectedAt: '2026-07-16T02:00:00.000Z' }] }));
A(restoredPayload.mainlines.length === 1 && restoredPayload.mainlines[0].starStocks[0].label === '预期明星·未兑现', '旧缓存/冻结快照可由同日预测轨迹恢复预期明星主线资格');

// 7. 评审修正:用户可见文案不再出现潜力股
A(!src.includes('潜力股${'), '后端 explain 不再输出潜力股文案');
A(src.includes('预期明星${expectedStars.length}只'), 'explain 改为预期明星(无预期明星不补位)');
A(src.includes('盯预期明星能否首板'), '阶段建议文案已替换');
A(!html.includes('m.focusStocks[0]') && !html.includes('const focus = (m.focusStocks'), '抢跑雷达与卡片不再使用 focusStocks');
A(html.includes("x.level === 'expected' || x.level === 'confirmed'"), '抢跑雷达改用预期明星/明星确认,无则不补位');
const visiblePotential = html.split('\n').filter(l => l.includes('潜力') && !l.trim().startsWith('//'));
A(visiblePotential.length === 0, '前端用户可见内容零"潜力"字样(仅存代码注释)');

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL QI-MAINLINE-STATES CHECKS PASSED');
