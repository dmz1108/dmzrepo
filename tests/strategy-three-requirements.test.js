// 主线题材三要件测试(node tests/strategy-three-requirements.test.js)——Owner 定稿 2026-07-21。
// 正式主线(真主线)= 确认明星≥1(confirmed) 且 合格龙头≥1 且 非风格板;expected-only 降级预备主线;
// 风格板不参与评选与扫描配额;2026-07-21 前的历史日维持旧口径不追溯。
// 生产证据:2026-07-21 14:59 正式榜 4 卡中 大盘成长/基金重仓 为无龙头风格板,
// 半导体/消费电子·显示 有龙头但全天仅 expected——按三要件当日正式榜应空、预备 2 张。
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'kpl-stats-server.js'), 'utf8');
function extractFn(name) {
  const sig = new RegExp(`(?:async )?function ${name}\\(`);
  const m = src.match(sig);
  if (!m) throw new Error('not found: ' + name);
  const bb = src.indexOf('{', src.indexOf(')', m.index));
  let depth = 0, i = bb;
  for (; i < src.length; i++) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (depth === 0) break; } }
  return src.slice(m.index, i + 1);
}
const A = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); process.exitCode = 1; } else console.log('ok: ' + msg); };

const numOrNull = v => { const n = Number(v); return Number.isFinite(n) ? n : null; };
const isFiniteNumeric = v => Number.isFinite(Number(v)) && v !== null && v !== '';
const normalizeReasonSourceCode = c => String(c || '').replace(/\D/g, '').slice(0, 6);
const isoFromCompactDate = d => String(d);
const STRATEGY_MAINLINE_THREE_REQ_START_DAY = '2026-07-21';
eval(extractFn('strategyMainlineUsesThreeRequirements'));
const STRATEGY_MAINLINE_STYLE_BOARD_NAMES = new Set([
  '大盘成长', '大盘价值', '基金重仓', '机构重仓', '证金持股', '茅指数', '宁组合',
  '漂亮100', '同花顺漂亮100', '上证50', '上证180', '沪深300', '中证500', '权重股',
  '融资融券', 'MSCI概念', '富时罗素', '标普道琼斯', 'QFII重仓', '社保重仓', '险资重仓',
  '百元股', '低价股',
]);
eval(extractFn('strategyMainlineIsStyleBoard'));
eval(extractFn('strategyMainlineHasQiStarEvidence'));
eval(extractFn('strategyMainlineHasConfirmedStar'));
eval(extractFn('strategyMainlineHasQualifiedLeader'));
eval(extractFn('strategyMainlineReserveReasons'));
eval(extractFn('strategyMainlineL2RejectReason'));
eval(extractFn('strategyMainlineApplyL2StarGate'));

// ---- 1. 实施日切界 ----
A(strategyMainlineUsesThreeRequirements('2026-07-21') && strategyMainlineUsesThreeRequirements('2026-08-01'),
  '切界:2026-07-21 起启用三要件');
A(!strategyMainlineUsesThreeRequirements('2026-07-20') && !strategyMainlineUsesThreeRequirements('2026-07-16'),
  '切界:07-16~20 维持旧口径,不追溯改写(茅台 expected 日的正式记录不动)');

// ---- 2. 风格板识别 ----
A(strategyMainlineIsStyleBoard('大盘成长') && strategyMainlineIsStyleBoard('基金重仓')
  && strategyMainlineIsStyleBoard('上证50_') && strategyMainlineIsStyleBoard('同花顺漂亮100'),
  '风格板:黑名单命中(含尾缀下划线与漂亮100系,2026-07-21 实盘两卡在列)');
A(!strategyMainlineIsStyleBoard('半导体') && !strategyMainlineIsStyleBoard('消费电子')
  && !strategyMainlineIsStyleBoard('中字头基建') && !strategyMainlineIsStyleBoard(''),
  '风格板:真题材(含中字头基建)不误伤,空名不判');

// ---- 3. 三要件分层闸(2026-07-21 实盘形态回归) ----
const leaders = [{ code: '600001', name: '龙头一', leadScore: 76 }];
const mk = (theme, stars, lead, extra = {}) => ({
  theme, familyKey: `theme:${theme}`, l2VerificationStatus: 'qi', l2ScanState: 'qi',
  score: 80, count: 5, starStocks: stars, leaders: lead, ...extra,
});
const gate = strategyMainlineApplyL2StarGate([
  mk('确认+龙头', [{ code: '000001', level: 'confirmed' }], leaders),               // → formal
  mk('半导体', [{ code: '603986', level: 'expected' }], leaders),                    // → reserve(缺确认)
  mk('确认无龙头', [{ code: '000002', level: 'confirmed' }], []),                    // → reserve(缺龙头)
  mk('全缺', [{ code: '000003', level: 'expected' }], []),                           // → excluded(双缺,仅诊断)
  { theme: '无证据', familyKey: 'theme:无证据', l2VerificationStatus: 'scanned-no-star', l2ScanState: 'scanned-no-star', starStocks: [], leaders },
], { threeRequirements: true });
A(gate.kept.length === 1 && gate.kept[0].theme === '确认+龙头' && gate.kept[0].qiTier === 'formal',
  '正式榜:仅确认明星+合格龙头同时满足者(qiTier=formal)');
A(gate.reserve.length === 2, '单缺(expected-only 有龙头 / 确认无龙头)降级预备层');
const rsv = Object.fromEntries(gate.reserve.map(r => [r.theme, r.reserveReasons.join(',')]));
A(rsv['半导体'] === 'no-confirmed-star', '预备缺件如实:半导体缺确认明星(2026-07-21 实盘形态)');
A(rsv['确认无龙头'] === 'no-qualified-leader', '预备缺件如实:有确认明星但无龙头');
const exc = Object.fromEntries(gate.excluded.map(r => [r.theme, r.reason]));
A(gate.excluded.length === 2 && exc['全缺'] === 'missing-confirmed-star-and-leader',
  '双缺不占预备位,如实转诊断(Codex #201 P2:reserve 只留单缺)');
A(exc['无证据'] === 'completed-scan-without-star', '无 L2 证据者仍走原 excluded 诊断,不混入预备层');

// ---- 4. 旧口径兼容(threeRequirements=false):expected 照旧过闸,reserve 恒空 ----
const legacy = strategyMainlineApplyL2StarGate([
  mk('白酒', [{ code: '600519', level: 'expected' }], []),
], { threeRequirements: false });
A(legacy.kept.length === 1 && legacy.reserve.length === 0 && legacy.kept[0].qiTier === undefined,
  '历史日:expected 过闸保持 2026-07-16~20 旧行为,不打 tier 标');

// ---- 5. 预测轨迹不断粮:预备主线的 expected 星照常进 starTransitions ----
eval(extractFn('strategyPredictStarTransitions'));
eval(extractFn('strategyPredictPickTop'));
eval(extractFn('strategyPredictCandidateRecord'));
eval(extractFn('strategyPredictBuildBlock'));
const block = strategyPredictBuildBlock(
  [mk('确认+龙头', [{ code: '000001', name: '正星', level: 'confirmed' }], leaders, { rank: 1 })],
  [], '2026-07-21T02:00:00.000Z',
  [mk('半导体', [{ code: '603986', name: '兆易创新', level: 'expected', gain: 6.1 }], leaders, { rank: 1 })]
);
A(block.top.length === 1 && block.top[0].theme === '确认+龙头', '预测 top 仅真主线');
A(block.starTransitions.some(t => t.code === '603986'),
  '预备主线的预期明星轨迹照常落档——命中率复盘样本不因分层断粮');
A(block.candidates.some(c => c.theme === '半导体'), '预备主线进入 candidates 档案');
const reserveOnlyBlock = strategyPredictBuildBlock(
  [], [], '2026-07-21T02:00:00.000Z',
  [mk('半导体', [{ code: '603986', name: '兆易创新', level: 'expected', gain: 6.1 }], leaders, { rank: 1, qiTier: 'reserve', reserveReasons: ['no-confirmed-star'] })]
);
A(!reserveOnlyBlock.top.length && reserveOnlyBlock.candidates.length === 1 && reserveOnlyBlock.starTransitions.length === 1,
  '正式榜全空的纯预备日:candidates/starTransitions 仍有内容(配合放宽的落盘守卫,预测不丢档)');
A(reserveOnlyBlock.candidates[0].qiTier === 'reserve'
  && reserveOnlyBlock.candidates[0].reserveReasons.join(',') === 'no-confirmed-star',
  '候选档案持久化 qiTier/缺件原因——盘后回看识别预备层的唯一依据');

// ---- 5a. 重算→唯一分闸合同(Codex #201 三审 P1) ----
const strategyMainlineDiagNoteTimeout = () => {};   // 诊断上下文记录,与本测试无关
eval(extractFn('strategyMainlineWithTimeout'));
const STRATEGY_MAINLINE_REWORK_TIMEOUT_MS = 1200;
eval(extractFn('strategyMainlineThreeReqReworkAndGate'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // a) 初始双缺(expected+无龙头)候选,重算从近10日主因池补出龙头 → 应进预备层而非诊断
  const dualMissing = mk('云计算', [{ code: '000001', level: 'expected' }], []);
  const r1 = await strategyMainlineThreeReqReworkAndGate([dualMissing], '2026-07-21', {}, {
    reworkFn: async (list) => { for (const m of list) { m.leaders = [{ code: '600001', name: '补出龙头', leadScore: 70 }]; } },
    timeoutMs: 500,
  });
  A(r1.reworkCompleted === true && r1.gate.kept.length === 0 && r1.gate.reserve.length === 1
    && r1.gate.reserve[0].reserveReasons.join(',') === 'no-confirmed-star',
    '合同a:初始双缺候选经重算补出龙头 → 预备层(重算前不得判死)');
  A(dualMissing.leaders.length === 0 && r1.gate.reserve[0].leaders.length === 1,
    '合同a:重算发生在副本上,原对象不被改写,提交的是副本结果');
  // b) 重算超时:不得把重算前的 provisional leaders 当合格龙头 → 当日无正式主线(fail-closed)
  const provisional = mk('确认+旧龙头', [{ code: '000002', level: 'confirmed' }], leaders);
  const expectedOnly = mk('仅预期', [{ code: '000003', level: 'expected' }], leaders);
  let bgDone = false;
  const r2 = await strategyMainlineThreeReqReworkAndGate([provisional, expectedOnly], '2026-07-21', {}, {
    reworkFn: async (list) => { await sleep(200); for (const m of list) { m.leaders = []; } bgDone = true; },
    timeoutMs: 40,
  });
  A(r2.reworkCompleted === false && r2.gate.kept.length === 0,
    '合同b:重算超时(>1.2s 场景)不产生任何正式主线——旧 provisional leaders 不算合格龙头');
  A(r2.gate.reserve.some(m => m.theme === '确认+旧龙头' && m.reserveReasons.includes('no-qualified-leader')),
    '合同b:确认明星者超时降预备(待龙头形成),不消失');
  A(r2.gate.excluded.some(e => e.theme === '仅预期' && e.reason === 'missing-confirmed-star-and-leader'),
    '合同b:expected-only 超时按双缺落诊断');
  await sleep(220);
  A(bgDone === true && provisional.leaders.length === 1,
    '合同b:超时后后台 rework 继续改的只是被丢弃的副本,已返回对象不被半成品污染');
})().then(() => {
  console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-THREE-REQUIREMENTS CHECKS PASSED');
});

// ---- 5a2. 终盘封板事实升级(Codex #201 四审 P1,实盘反例 2026-07-21 兆易创新 603986) ----
eval(extractFn('strategyMainlineUpgradeStarsWithFinalSeal'));
const frozen603986 = mk('半导体', [{ code: '603986', name: '兆易创新', level: 'expected' }], leaders,
  { expectedStarHistory: [{ code: '603986', level: 'expected', expectedOutcome: 'not-confirmed' }] });
const upgraded = strategyMainlineUpgradeStarsWithFinalSeal([frozen603986], new Set(['603986']));
A(upgraded[0].starStocks[0].level === 'confirmed' && upgraded[0].starStocks[0].confirmedBy === 'final-limit-up-db'
  && upgraded[0].expectedStarHistory[0].expectedOutcome === 'confirmed',
  '终盘升级:冻结 expected + 最终可靠涨停库在列 → confirmed(旧 expectedOutcome 不得覆盖事实)');
A(frozen603986.starStocks[0].level === 'expected' && upgraded[0] !== frozen603986,
  '终盘升级:非变异——共享的缓存/冻结原对象不被改写');
const gateAfterSeal = strategyMainlineApplyL2StarGate(upgraded, { threeRequirements: true });
A(gateAfterSeal.kept.length === 1 && gateAfterSeal.kept[0].qiTier === 'formal',
  '603986 回归:盘中 expected、盘后封板 + 有合格龙头 → 半导体进正式真主线');
const notSealed = strategyMainlineUpgradeStarsWithFinalSeal([mk('游戏', [{ code: '002624', level: 'expected' }], leaders)], new Set(['603986']));
A(notSealed[0].starStocks[0].level === 'expected'
  && strategyMainlineApplyL2StarGate(notSealed, { threeRequirements: true }).reserve.length === 1,
  '终盘升级:不在涨停库的 expected 保持 expected,仍走预备层');
A(/strategyMainlineFinalSealedCodes\(isoDay\)/.test(src)
  && /strategyMainlineUpgradeStarsWithFinalSeal\(\s*inflowGate\.kept\.filter/.test(src),
  '静态:构建层在分闸前消费终盘封板事实');
A(/finalSealedCodes = options\.finalSealedCodes instanceof Set/.test(src)
  && /strategyMainlineUpgradeStarsWithFinalSeal\(themed, finalSealedCodes\)/.test(src),
  '静态:返回/冻结层(Restrict)同样先升级再分闸');
A(/unionRows\(originalMainlines, payload\.reserveMainlines\)/.test(src),
  '静态:冻结载荷既有预备卡与正式候选一起进闸——升级后可重回正式榜');
A(/strategyPredictPersistFinalSealUpgrades/.test(src) && /绝不改 top\/candidates\/qiTier\/savedAt/.test(src),
  '静态:confirmed 转换持久化仅限事件轨迹行,预测时点内容不追溯改写');

// ---- 5b. 盘后回看:预备主线预期明星单独输出,与正式回看分开 ----
eval(extractFn('strategyMainlineReserveStarOutcomes'));
const outcomePredict = {
  bySource: {
    eastmoney: {
      top: [{ key: 'theme:确认+龙头', theme: '确认+龙头' }],
      candidates: [
        { key: 'theme:确认+龙头', theme: '确认+龙头', qiTier: 'formal', reserveReasons: [] },
        { key: 'theme:半导体', theme: '半导体', qiTier: 'reserve', reserveReasons: ['no-confirmed-star'] },
      ],
      starTransitions: [
        { mainlineKey: 'theme:确认+龙头', code: '000001', name: '正星', firstExpectedAt: '2026-07-21T01:40:00.000Z' },
        { mainlineKey: 'theme:半导体', mainlineTheme: '半导体', code: '603986', name: '兆易创新', firstExpectedAt: '2026-07-21T02:00:00.000Z', lastLevel: 'expected' },
      ],
    },
    ths: {
      top: [],
      candidates: [
        { key: 'theme:消费电子', theme: '消费电子', qiTier: 'reserve', reserveReasons: ['no-qualified-leader'] },
        // 缺龙头且明星"从首次观察即 confirmed"(无 expected 轨迹行)——证据必须从候选档案 stars 补齐
        { key: 'theme:军工', theme: '军工', qiTier: 'reserve', reserveReasons: ['no-qualified-leader'],
          stars: [{ code: '600760', name: '中航沈飞', level: 'confirmed' }] },
      ],
      starTransitions: [{ mainlineKey: 'theme:消费电子', code: '000725', name: '京东方A', firstExpectedAt: '2026-07-21T02:10:00.000Z', lastLevel: 'expected' }],
    },
  },
};
const outcomes = strategyMainlineReserveStarOutcomes(outcomePredict);
A(outcomes.length === 3, '回看:两源预备明星都产出,正式主线(确认+龙头)的明星不混入');
const east = outcomes.find(o => o.source === 'eastmoney');
A(!!east && east.code === '603986' && east.mainlineTheme === '半导体' && east.kind === 'expected'
  && east.reserveReasons.join(',') === 'no-confirmed-star',
  '回看:预备结果按来源/题材/缺件/个股逐条落列(东财 半导体 兆易创新,kind=expected)');
A(outcomes.some(o => o.source === 'ths' && o.code === '000725' && o.kind === 'expected'
  && o.reserveReasons.join(',') === 'no-qualified-leader'),
  '回看:同花顺预备(缺龙头)独立成行,不与东财合并');
A(outcomes.some(o => o.source === 'ths' && o.code === '600760' && o.kind === 'confirmed' && o.lastLevel === 'confirmed'),
  '回看:缺龙头卡的"从未 expected 的确认明星"从候选档案补齐(kind=confirmed),不因无轨迹行消失(Codex #201 三审)');
A(/if \(row\.kind === 'confirmed'\) \{ item\.sealStatus = 'confirmed'; return item; \}/.test(src),
  '静态:kind=confirmed 展示行不进 expected 封板转化统计(两类语义分开)');
A(/reserveCell\(r\)/.test(fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8'))
  && /reserveStarOutcomes/.test(fs.readFileSync(path.join(__dirname, '..', 'kpl-dashboard_17_apple.html'), 'utf8')),
  '静态:回看前端消费 reserveStarOutcomes(纯预备日不再只显示今日无主线)');
const legacyPredictNoTier = {
  top: [{ key: 'theme:白酒', theme: '白酒' }],
  candidates: [{ key: 'theme:白酒', theme: '白酒' }, { key: 'theme:第四名', theme: '第四名' }],
  starTransitions: [{ mainlineKey: 'theme:第四名', code: '600000', name: '某股', firstExpectedAt: '2026-07-18T02:00:00.000Z' }],
};
A(strategyMainlineReserveStarOutcomes(legacyPredictNoTier).length === 0,
  '回看:旧档案无 qiTier 标记时一律不产出——不把历史第4~10名正式候选猜成预备层(不追溯)');

// ---- 6. 静态接线 ----
A(/boardPayload\.boards = boardPayload\.boards\.filter\(b => !strategyMainlineIsStyleBoard\(b\?\.name\)\)/.test(src),
  '静态:风格板在种子/扫描消费前统一剔除(不占扫描配额)');
A(/strategyMainlineApplyL2StarGate\(inflowGate\.kept, \{ threeRequirements: useThreeRequirements \}\)/.test(src),
  '静态:正式构建按日切界启用三要件');
A(/reason: 'no-confirmed-mainline'/.test(src) && /条预备主线待明星确认/.test(src),
  '静态:正式榜空但有预备时输出专属空态文案');
A(/const threeReq = strategyMainlineUsesThreeRequirements\(payload\.day\)/.test(src),
  '静态:缓存/冻结返回层按载荷日期同样执行三要件重过滤');
A(/reserveList = \(source && Array\.isArray\(source\.reserveMainlines\)\) \? source\.reserveMainlines : \[\]/.test(src),
  '静态:bySource 预测块并入预备主线轨迹');
A(/inflowGate\.kept\.filter\(item => strategyMainlineHasQiStarEvidence\(item\)\)/.test(src),
  '静态:重算对象=未截断的 QI 星证据全集(首闸与截断线不得决定重算对象,Codex #201 三审 P1)');
A(/strategyMainlineThreeReqReworkAndGate\(qiPool, isoDay, reworkOpts\)/.test(src),
  '静态:三要件日走"重算→唯一分闸"合同,重算完成后才排序截断');
A(/leaderReworkCompleted: reworkOutcome\.reworkCompleted/.test(src) && /reason: 'leader-rework-incomplete'/.test(src),
  '静态:重算未完成状态透出到 l2Gate 与空态文案(fail-closed 可解释)');
A(/reason: 'style-board-not-theme'/.test(src),
  '静态:冻结/缓存载荷返回层同样剔除风格板并落诊断(Codex #201 P1-2)');
A(/if \(!block\.top\.length && !block\.starTransitions\.length && !block\.candidates\.length\) return;/.test(src),
  '静态:预测落盘守卫放宽——正式 top 全空但预备轨迹有内容仍落档(Codex #201 P1-3)');
A(/reserveStarOutcomes/.test(src) && /reserveSealTotal/.test(src) && /reserveSealRate/.test(src),
  '静态:回看 API 输出预备明星结果并独立计数,不混正式 expectedSeal 口径(Codex #201 P1-3)');
// (总结行由 5a 异步块在全部断言后输出)
