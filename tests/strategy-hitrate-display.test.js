'use strict';
// 主线榜命中率随行展示(Owner 2026-07-26 第一步)行为锁:
// 1) 紧凑块与预判回看同源,分母 0 时 rate 保持 null,禁止编造 0%;
// 2) 命中率只在路由响应层附加,绝不进入冻结快照生成路径;
// 3) 前端三态:字段缺失静默 / 零样本如实"暂无样本" / 有样本展示 top1/top3;
// 4) 热路径不因缓存未命中而同步等待回看计算(stale-while-revalidate)。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const server = fs.readFileSync(path.join(root, 'kpl-stats-server.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'kpl-dashboard_17_apple.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'Qi', 'vendor', 'strategy-workbench.css'), 'utf8');

function extractFn(name) {
  const m = server.match(new RegExp(`(?:async )?function ${name}\\(`));
  assert(m, `missing function ${name}`);
  const bodyBrace = server.indexOf('{', server.indexOf(')', m.index));
  let depth = 0;
  for (let i = bodyBrace; i < server.length; i += 1) {
    if (server[i] === '{') depth += 1;
    else if (server[i] === '}') { depth -= 1; if (depth === 0) return server.slice(m.index, i + 1); }
  }
  throw new Error(`unterminated ${name}`);
}

// ---- 1. 紧凑块纯函数行为 ----
// eslint-disable-next-line no-eval
const strategyPredictHitRatesCompact = eval(`(${extractFn('strategyPredictHitRatesCompact')})`);

const full = strategyPredictHitRatesCompact({
  mainlineTotal: 8, mainlineTop1Rate: 62.5, mainlineTop3Rate: 87.5,
  starWinRate: 71.4, starTotal: 7,
  bySource: {
    eastmoney: { mainlineTotal: 8, mainlineTop1Rate: 62.5, mainlineTop3Rate: 87.5 },
    ths: { mainlineTotal: 0, mainlineTop1Rate: null, mainlineTop3Rate: null },
  },
}, 10);
assert.strictEqual(full.windowDays, 10);
assert.strictEqual(full.overall.total, 8);
assert.strictEqual(full.bySource.eastmoney.top1Rate, 62.5);
assert.strictEqual(full.bySource.ths.total, 0, '零样本源 total 必须为 0');
assert.strictEqual(full.bySource.ths.top1Rate, null, '零样本源 rate 必须保持 null,不得变 0');
assert.strictEqual(strategyPredictHitRatesCompact(null, 10), null, 'stats 缺失返回 null,不返回空壳');
const missingSource = strategyPredictHitRatesCompact({ mainlineTotal: 3, mainlineTop1Rate: 33.3, mainlineTop3Rate: 66.7 }, 10);
assert.strictEqual(missingSource.bySource.eastmoney.total, 0, '无 bySource 的旧统计降级为零样本而非报错');
assert.strictEqual(missingSource.bySource.eastmoney.top1Rate, null);

// ---- 2. 附加位置与日期锚点(Codex #292 P1:历史日期不得挂当前命中率) ----
// 行为测试:真实调用附加函数,today 与 historical 双请求分别断言,不做纯字符串推断。
{
  // eslint-disable-next-line no-unused-vars
  const isoFromCompactDate = (d) => {
    const digits = String(d || '').replace(/\D/g, '');
    return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : String(d || '');
  };
  // eslint-disable-next-line no-unused-vars
  const chinaNowParts = () => ({ day: '2026-07-26' });
  // eslint-disable-next-line no-unused-vars
  const getStrategyPredictHitRatesCached = () => ({ windowDays: 10, overall: { total: 5, top1Rate: 60 } });
  // eslint-disable-next-line no-eval
  const attach = eval(`(${extractFn('attachPredictHitRatesIfToday')})`);

  const todayRes = attach({ ok: true, day: '2026-07-26' }, '2026-07-26');
  assert(todayRes.predictHitRates, '今天的请求必须附加命中率');
  assert.strictEqual(todayRes.predictHitRates.asOfDay, '2026-07-26', '附加块必须显式声明锚点 asOfDay');

  const compactToday = attach({ ok: true }, '20260726');
  assert(compactToday.predictHitRates, '紧凑日期格式的今天同样附加');

  const historical = attach({ ok: true, day: '2026-07-08' }, '2026-07-08');
  assert.strictEqual(historical.predictHitRates, undefined, '历史日期请求绝不附加当前锚点的命中率(日期穿越)');

  const errored = attach({ ok: false, error: 'boom' }, '2026-07-26');
  assert.strictEqual(errored.predictHitRates, undefined, '错误载荷不得附加命中率');

  const noCacheAttach = (() => {
    // eslint-disable-next-line no-shadow
    const getStrategyPredictHitRatesCached = () => null;
    // eslint-disable-next-line no-eval
    return eval(`(${extractFn('attachPredictHitRatesIfToday')})`)({ ok: true }, '2026-07-26');
  })();
  assert.strictEqual(noCacheAttach.predictHitRates, undefined, '缓存未就绪时原样返回,前端静默');
}
const route = server.slice(server.indexOf("url.pathname === '/api/strategy-mainlines'"), server.indexOf("url.pathname === '/api/admin/strategy-realtime-context'"));
assert(route.includes('attachPredictHitRatesIfToday(payload, requestedDay)'), '路由必须经由日期锚点守卫附加命中率');
const visibleFn = extractFn('getStrategyMainlinesVisible');
assert(!visibleFn.includes('predictHitRates'), '冻结快照/可见载荷生成路径不得写入命中率(只在响应层附加)');

// ---- 3. 热路径非阻塞(stale-while-revalidate) ----
const cachedFn = extractFn('getStrategyPredictHitRatesCached');
assert(!/await/.test(cachedFn), '缓存读取必须同步返回,过期时后台刷新,不得阻塞主线榜热路径');
assert(cachedFn.includes('inflight'), '并发轮询只允许一个后台刷新在途');

// ---- 4. 前端三态 ----
assert(html.includes("renderColumn('东财主线预测', bs.eastmoney, '超大单净流入', 'eastmoney')")
  && assertIncludes(html, "renderColumn('同花顺主线预测', bs.ths, 'DDE 活跃度 + 全量方向', 'ths')"),
  '两列各自传入源键读取自己的命中率');
function assertIncludes(s, sub) { assert(s.includes(sub), `missing: ${sub}`); return true; }
assert(html.includes('if (!hr) return \'\';'), '字段缺失(旧快照/缓存未就绪)整行静默不渲染');
assert(html.includes('暂无样本'), '零样本必须如实显示"暂无样本"');
const hitBlock = html.slice(html.indexOf('const hitRateLine'), html.indexOf('const renderColumn'));
assert(hitBlock.includes('if (!Number(hr.total) || hr.top1Rate == null)'), '零样本分支必须在渲染数字之前短路,且 rate 为 null 时直连兜底');
// 变异验证补锁(首版此处被"零样本分支改渲染 0%"的变异逃过):
// 双列 hitRateLine 块内零样本分支必须落在"暂无样本"文案上,且块内不得出现任何字面 0%。
assert(/if \(!Number\(hr\.total\) \|\| hr\.top1Rate == null\)[^;]*暂无样本/.test(hitBlock), '零样本分支必须渲染"暂无样本"文案');
assert(!/0%/.test(hitBlock), 'hitRateLine 块内禁止出现任何字面 0%(动态率由数据渲染,静态 0% 即伪造)');
assert(html.includes('ml-hitrate is-empty'), '暂无样本使用弱化样式');
// Owner 二次修订:结果直接进标题行——命中率必须渲染在列标题 span 内部,与"××主线预测"同行
assert(html.includes('<span>${escapeHTML(title)}${hitRateLine(srcKey)}</span>'), '双列命中率位于列标题行内');
assert(html.includes('<span>今日主线榜${overallHitLine}</span>'), '单列整体命中率位于主标题行内');
// 单列兼容路径同样受三态约束
const overallBlock = html.slice(html.indexOf('const overallHitLine'), html.indexOf('const cards = lines.slice'));
assert(/if \(!Number\(hr\.total\) \|\| hr\.top1Rate == null\)[^;]*暂无样本/.test(overallBlock) && !/0%/.test(overallBlock),
  '单列整体命中率同样禁止 0% 伪造');

// ---- 5. CSS 与缓存版本 ----
assert(css.includes('body.view-strategy .ml-hitrate {') && css.includes('.ml-hitrate.is-empty'), '命中率行样式存在');
// Local #292 阻断修正:≤430px 徽标退回独立一行(nowrap 徽标会把标题挤成两行;真实单列规则下断点 405–420,取 430 留余量)
assert(/@media \(max-width: 430px\) \{[\s\S]{0,240}?\.ml-hitrate \{[\s\S]{0,120}?display: block;[\s\S]{0,120}?white-space: normal;/.test(css),
  '≤400px 命中率徽标必须退回块级独立行,恢复标题单行');
assert(html.includes('strategy-workbench.css?v=20260726d'), 'CSS 缓存版本已升号');

console.log('strategy hit-rate display checks passed');
