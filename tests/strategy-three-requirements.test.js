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
  mk('全缺', [{ code: '000003', level: 'expected' }], []),                           // → reserve(双缺)
  { theme: '无证据', familyKey: 'theme:无证据', l2VerificationStatus: 'scanned-no-star', l2ScanState: 'scanned-no-star', starStocks: [], leaders },
], { threeRequirements: true });
A(gate.kept.length === 1 && gate.kept[0].theme === '确认+龙头' && gate.kept[0].qiTier === 'formal',
  '正式榜:仅确认明星+合格龙头同时满足者(qiTier=formal)');
A(gate.reserve.length === 3, 'expected-only/缺龙头/双缺 全部降级预备层');
const rsv = Object.fromEntries(gate.reserve.map(r => [r.theme, r.reserveReasons.join(',')]));
A(rsv['半导体'] === 'no-confirmed-star', '预备缺件如实:半导体缺确认明星(2026-07-21 实盘形态)');
A(rsv['确认无龙头'] === 'no-qualified-leader', '预备缺件如实:有确认明星但无龙头');
A(rsv['全缺'] === 'no-confirmed-star,no-qualified-leader', '预备缺件如实:双缺并列列出');
A(gate.excluded.length === 1 && gate.excluded[0].reason === 'completed-scan-without-star',
  '无 L2 证据者仍走原 excluded 诊断,不混入预备层');

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

console.log(process.exitCode ? 'SOME CHECKS FAILED' : 'ALL STRATEGY-THREE-REQUIREMENTS CHECKS PASSED');
