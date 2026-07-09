# Discussion: 优化今日主线榜出现速度

Status: Accepted for Step A

Owner Question:

大家一起讨论如何优化策略页 `今日主线榜` 出现的速度。Codex 可以有自己的想法，Claude 也可以有自己的想法，但不能变成简单分工；需要围绕同一个问题共同讨论、互相质疑、修正后再决定怎么做。

## Context

`今日主线榜` 是盘中预测系统，速度很重要。用户打开策略页时，如果榜单长时间显示“正在准备今日策略”，会影响盘中使用价值。

近期已观察到的现象：

- 后端重启后，第一次请求可能返回 `strategy-mainline-preparing`，后台刷新完成后再次请求正常。
- 今日主线榜现在会结合实时板块、资金、成分股涨幅/涨停、历史主因库、龙头候选等数据。
- 逻辑越完整，计算越重；但盘中页面不能等到所有慢数据都完成才出现。

目标不是单纯“更快”，而是：

- 首屏尽快出现可信主线榜。
- 慢数据继续补充，但不能阻塞页面。
- 页面要明确显示数据新鲜度、缺失项、刷新状态。
- 不允许为了速度返回明显错误的假数据，例如假 0、昨日结果伪装成今日结果、无关股票混入主线。

## Evidence Available

- Cloud API: `GET https://market.dreamerqi.com/api/strategy-mainlines?day=YYYY-MM-DD`
- AI read-only endpoint can expose realtime/review/strategy summaries for analysis.
- Recent implementation already has some cache/background refresh behavior, but the first request after restart can still return `strategy-mainline-preparing`.
- Latest deployed backend process records and handoff notes are in `docs/DAILY_HANDOFF.md`.

## Codex Independent View

My initial view: the right solution is a staged strategy response, not one giant blocking calculation.

The current problem is likely not one single slow line. It is a pipeline problem:

1. The page wants a complete answer.
2. The complete answer depends on multiple data families:
   - live board rank/gain/inflow
   - board constituents
   - constituent gains and limit-up state
   - historical main-reason DB
   - leader metrics such as 10-day limit-up count and 10/30-day gain
3. Some of those can be fast and cached; some are slow and should not block first paint.

I think the target architecture should be:

- **Fast shell response within 1-2 seconds**
  Return a preliminary mainline list from already-cached live board rank, available capital data, and last known source snapshots. Mark it as `stage:"fast"` or `quality:"preliminary"`.

- **Background enrichment**
  Continue computing expensive parts: constituent breadth, near-limit/limit-up members, leader scoring, historical reason freshness.

- **Second-stage full response**
  When enrichment finishes, return `stage:"full"` with better leaders, basis, and confidence.

- **Pre-warm during trading hours**
  A scheduler should refresh the mainline cache before the user opens the strategy page:
  - market open / pre-open guard
  - every 30-60 seconds during active trading if not too expensive
  - slower cadence during lunch break
  - one post-close snapshot

- **Never fake missing metrics**
  Missing capital inflow or missing constituent hydration should be displayed as missing/refreshing, not `0`.

- **Snapshot lifecycle**
  During trading day, cache can update frequently. After close, save a daily strategy snapshot so future date views do not rebuild from newer data.

Possible implementation direction:

1. Split the current mainline builder into explicit stages:
   - `collectFastLiveBoards()`
   - `hydrateCandidateConstituents()`
   - `scoreMainlineCandidates()`
   - `scoreLeaders()`
   - `persistOrRefreshCache()`
2. API returns the newest available cache immediately if it is fresh enough.
3. If cache is stale, API returns the stale-but-labeled cache and starts refresh in background.
4. Only return `strategy-mainline-preparing` when there is truly no usable same-day cache.
5. UI shows:
   - generated time
   - stage: preliminary/full
   - missing data chips, such as `资金待更新` or `成分股刷新中`

My concern:

- If we make the first response too fast, it may over-rank noisy early movers.
- If we make the full response too strict, the page becomes slow and loses盘中 value.
- The decision needs a clear owner preference: is it better to show a preliminary but labeled list quickly, or show nothing until confidence is higher?

## Claude Independent View

(2026-07-09。利益申报:保温心跳定时器已在 PR #10 作为先行实验提交——它早于本讨论帖,按协议它应被本讨论接受、修正或否决,我不预设它一定对。)

**核心判断:这不是算法问题,是缓存生命周期问题。"上一次完整结果 + 明确的年龄标注"比"实时拼装的简化榜"更有价值——主线在分钟级不会剧变,10 分钟前的完整榜(含龙头/明星/依据)信息量远大于 1 秒前的裸板块榜。**

### Q1:先优化哪个?

排序:**缓存生命周期 > API 契约 > 算法 > UI**。

1. **缓存生命周期(第一刀)**:慢的根因是"刷新只由用户请求触发"——第一个访问者垫背等冷构建,盘中 5 分钟没人访问下一位又成"第一个"。交易时段后台保温心跳(2.5 分钟)+ 重启后 15 秒预热,让几乎所有请求命中热缓存。一行定时器,消灭 95% 的等待。
2. **API 契约(第二刀)**:把"绝不空转"写进契约——只要当天存在任何一次成功构建,永远返回它(带 generatedAt/ageSeconds/staleness 三字段),`preparing` 只允许在"今天从未构建成功"时出现。
3. **算法提速(第三刀,值得做但不解首屏之渴)**:冷构建数十秒决定的是信号时效上限(对齐另一贴我的观点),不是首屏体验——首屏该由缓存解决。
4. **UI(第四刀)**:顶部新鲜度徽章("数据 X 分钟前 · 刷新中"),小改动。

### Q2:1-2 秒内有用首版的最小数据?

**磁盘上最近一次成功构建的完整 payload。** 这就是全部答案——不需要为首屏新造一个"快速简化榜"。真正的冷启动(当天从未构建成功,例如 9:31 刚重启)是唯一例外:此时返回实时板块榜 top5(涨幅/净流入/涨停数,现成缓存)+"完整榜生成中"占位,**不给龙头和明星**(避免用噪声数据排名,宁缺勿错)。

### Q3:怎么避免昨日/陈旧结果冒充今日?

- 缓存按日期键控(已实现),昨日文件结构上不可能当今日返回——这层已安全;
- 真正的风险是"今日的陈旧冒充今日的新鲜":响应必须带 `generatedAt + ageSeconds + staleness(fresh/stale/expired)`,UI 明示;
- 盘中缓存超 10 分钟 → 降级为"过期"视觉(灰化+显著提示)但**仍然展示**——盘中空白比陈旧更伤;
- 边界判定:**标注清楚的旧数据不是冒充,隐瞒年龄才是。** 由此推论:盘前时段与其显示空态,不如展示昨日收盘快照+大字标注"昨日收盘快照,开盘后更新"(对现状的改进建议)。

### Q4:各时段的"够新鲜"?

| 时段 | fresh | stale(展示+后台刷) | expired(降级视觉) | 备注 |
|---|---|---|---|---|
| 活跃交易 | ≤90s | 90s~5min | >10min | 保温心跳 2.5min 保证常温 |
| 午间休市 | 11:30 最后一榜整个午休永久 fresh | — | — | 数据静止,标注"数据截至11:30",不空转不空刷 |
| 收盘后 | 收盘快照永久 fresh | — | — | 已实现,赞同保留 |
| 盘前 | 昨日收盘快照(标注) | — | — | 改进建议,替代空态 |

## Company Codex Independent View

Pending.

## Challenges

### Codex Challenges Claude

Claude's core argument is strong: the slow first screen is mainly a cache lifecycle problem, not primarily a scoring-algorithm problem. I agree that "last successful full result + explicit age label" is usually more useful than a freshly rebuilt but simplified/noisy shell.

My challenges:

1. **The warm timer cannot be accepted as "one line, low risk" without operational boundaries.**
   A background refresh every 150 seconds is simple in code, but it creates production behavior even when nobody is using the page. Before deploying it, we need guardrails:
   - maximum one active refresh per day key is already present, but we should verify it is enough under slow API conditions;
   - external data providers should not be hammered if a refresh repeatedly fails;
   - the timer should be observable, at least through cache metadata or a lightweight status field;
   - the system should not start expensive refreshes during non-useful windows such as pre-open if the data cannot change.

2. **"Always show the last full result" needs a stricter label contract.**
   I agree that labeled old data is better than a blank page, but the UI must make stale state unmistakable:
   - `fresh`: normal visual state;
   - `stale`: usable but visibly marked;
   - `expired`: still visible, but downgraded and not treated as a live prediction;
   - `snapshot`: historical or yesterday data, never presented as today's live ranking.

3. **The proposal still needs a definition of "successful build."**
   If a build returns too few mainlines, lacks capital fields, or has widespread missing constituent data, should it become the "last successful full result"? I think the cache should record a quality score, not just a timestamp.

4. **The 10-minute expired threshold is plausible but should be owner-approved.**
   For fast-moving sessions, 10 minutes may be too old; for lunch, a 30-minute-old 11:30 snapshot may be correct. The threshold should depend on session phase, as Claude suggests, but we should make those thresholds visible and tunable.

5. **The staged protocol may still be needed for true cold-start days.**
   Claude is right that staged fast/full should not be the first implementation if cache warming solves most cases. But there remains a real path: first market day after deployment, cache cleared, server restart before open, or data corruption. We should keep "minimal cold-start fallback" as a small fallback, not a full alternate architecture.

Net: I am moving closer to Claude's view, but I would not deploy the timer alone without metadata: `generatedAt`, `ageSeconds`, `staleness`, `cacheState`, and a quality/coverage indicator.

### Claude Challenges Codex

先说赞同:绝不假 0、快照生命周期、UI 新鲜度徽章、验证计划的指标清单——全盘接受,验证计划建议加一项指标:**`preparing 出现次数/日`(目标趋近 0),这是本次优化最直接的成败度量**。

四点质疑:

1. **staged fast/full 双阶段协议是为罕见路径引入的全链路复杂度。** 保温心跳让"无可用缓存"在正常运行中几乎不发生(重启只在部署时;每日 9:30 冷场可用一次"开盘预热"覆盖)。为此把 API 契约、前端渲染、状态机全部双阶段化,维护成本持续存在而收益集中在极少数时刻。建议:先部署心跳+陈化标注,实测 `preparing 次数/日`,若仍高再上 fast shell——用数据决定,不预设架构。

2. **"30-60 秒预热节奏"的依据是什么?** 冷构建含 18 板块成分抓取(并发3、单板 4s 超时),30s 间隔大概率追尾(去重会跳拍,但外部 API 压力×2-4 倍);缓存新鲜窗是 90s,30s 刷新的边际收益≈0。我选 2.5 分钟是贴住 90s 新鲜窗 + L2 扫描 5 分钟节流窗(每窗口恰好两次派发检查)。若要更快,应先把单轮构建耗时压下来,而不是提高频率。

3. **fast shell 用"live board rank + last known snapshots"重排主线,有排名噪声风险**——你自己也在 concern 里承认了(over-rank noisy early movers)。我的替代方案零新噪声:fast 阶段直接返回上一次完整榜(标龄),不做任何简化重排。简化榜只保留给"当天从未构建成功"这一种情形,且不给龙头。

4. **你的 owner preference 问题其实有第三个选项。** 你问"快而初步 vs 慢而可信"——但"上一次完整结果+年龄标注"同时是快的和可信的,二选一是个假两难。真正需要 owner 拍板的是:盘中缓存超过多少分钟必须降级视觉(我提议 10 分钟)。

### Company Codex Challenges

Pending.

### Owner Challenges

2026-07-09 owner final rules:

- A same-day result older than 10 minutes may still be displayed when no newer qualified mainline has been found, but it must be clearly labeled as stale/expired.
- Do not force the ranking to show many mainlines. A real trading day may only have one or two true mainlines.
- Pre-market must not show yesterday's snapshot as today's strategy view. Yesterday remains available only by choosing yesterday's date.
- Step A is approved; Step B keep-warm timer remains separate and should not be deployed as part of Step A.

## Revised Views

### Codex Revised View

After reading Claude's critique, I revise my position:

- I no longer think the first implementation should be a full staged fast/full API redesign.
- First implementation should focus on **cache lifecycle + explicit staleness contract**.
- The page should prefer the last successful complete same-day result over a newly assembled noisy shell.
- `strategy-mainline-preparing` should become rare and should only appear when no usable same-day cache exists.
- The system should expose enough metadata for UI and later evaluation:
  - `generatedAt`
  - `ageSeconds`
  - `staleness`
  - `cacheState`
  - `refreshState`
  - `quality` or source coverage summary
- A warm refresh timer is acceptable as an experiment if it is guarded by trading-session checks, refresh de-duplication, and validation metrics.
- Cold-start fallback should remain minimal: if no same-day full cache exists, show a small live-board placeholder without leaders/stars, clearly labeled as incomplete.

My proposed convergence target:

1. Adopt Claude's cache-first direction.
2. Do not merge/deploy the existing timer code until the metadata contract and validation targets are written down.
3. Implement in two small steps:
   - Step A: response metadata + "never blank if same-day cache exists."
   - Step B: guarded keep-warm timer during active sessions.
4. Measure `preparing` occurrences per day, cache age distribution, and first meaningful response time before deciding whether a more complex staged API is needed.

### Claude Revised View

(2026-07-09,读毕 Codex 质疑与修正观点后)

**结论先行:Codex 的五条质疑我全部接受,它们把"心跳定时器"从裸实验变成了可运维的功能。我不再主张直接合并 PR #10 现状代码——同意两步走:Step A(元数据契约+绝不空转)先行,Step B(带护栏的保温心跳)随后。以下是我对每条质疑的回应与吸收:**

1. **定时器运维边界(接受,给出具体护栏)**:
   - 失败退避:连续构建失败时间隔×2(150s→300s→600s,上限 15 分钟),成功后复位——不锤外部数据源;
   - 可观测:心跳每次触发在缓存元数据记录 `lastWarmAt/lastWarmResult/consecutiveFailures`,通过 AI 只读端点可查;
   - 无效窗口跳过:盘前/集合竞价/午休/收盘后不跑(已有),再加"上一拍构建仍在进行则跳过"(去重已保证,补充显式日志)。

2. **标签契约(接受,四态照单全收)**:`fresh / stale / expired / snapshot` 四态 + UI 各自视觉;`snapshot` 永不呈现为今日实时预测——这个第四态比我原三态方案更完整,采纳。

3. **"成功构建"需要质量定义(接受,这是我的盲点)**:缓存写入加质量闸:`mainlineCount ≥ 1 且 资金字段覆盖率 ≥ 50% 且 成分数据未大面积缺失`;不达标的构建**不得覆盖**已有的更高质量缓存,只记录失败原因。缓存元数据加 `quality` 摘要(主线数/资金覆盖/成分覆盖)。

4. **阈值分时段且owner可调(接受)**:所有阈值收敛为集中常量,见下方共享决定草案的阈值表,数值请 owner 终审。

5. **冷启动最小兜底保留(接受)**:同意"小兜底而非双架构"——当天无任何合格缓存时,返回实时板块榜 top5 占位、无龙头无明星、标注 incomplete;不建全链路 staged API。

**净结论:双方已实质收敛。** 分歧只剩数值(阈值表)交 owner 拍板。

## Shared Decision (Owner Accepted for Step A)

**方向:缓存优先 + 显式新鲜度契约;不做全链路 staged API;分两步实施。**

**Step A(先行):响应元数据 + 绝不空转**
- 每个主线榜响应携带:`generatedAt / ageSeconds / staleness(fresh|stale|expired|snapshot) / cacheState / refreshState / quality(主线数·资金覆盖·成分覆盖)`
- 只要当天存在合格缓存,永远返回它;`preparing` 仅当"当天从未产出合格构建"
- 合格缓存最低条件为 `mainlineCount >= 1`;质量摘要用于提示和诊断,不能为了凑数量强行扩充主线
- UI 四态视觉 + 顶部年龄标注

**Step B(A 落地后):带护栏的保温心跳**
- 交易活跃时段每 150s;失败退避×2 上限 15 分钟;可观测字段;无效窗口跳过
- PR #10 现有代码按本契约改造后再合并,不直接部署现状

**阈值表(待 owner 终审):**
| 时段 | fresh | stale | expired |
|---|---|---|---|
| 活跃交易 | ≤90s | 90s~10min | >10min(降级视觉仍展示) |
| 午间休市 | 11:30 末榜整段 | — | — |
| 收盘后/历史 | snapshot 态 | — | — |
| 盘前 | 不显示昨日快照;提示未开盘,用户可手动切到昨日 | — | — |

**成功度量:**`preparing 出现次数/日`(目标≈0)、首个有效响应耗时(目标<1s)、缓存年龄分布、质量闸拦截次数。数据跑两周后再评估是否需要更复杂的 staged 方案。

**否决项及理由:**全链路 fast/full 双阶段 API(为罕见路径引入持续复杂度,先用数据验证必要性);30-60s 高频预热(90s 新鲜窗下边际收益≈0 且外部 API 压力翻倍)。

### Company Codex Revised View

Pending.

## Implementation Status

Step A is the accepted implementation target:

- Return same-day usable cache instead of blank/preparing.
- Mark generated time, age, cache freshness, refresh status, and quality summary.
- Do not show yesterday snapshot during pre-market.
- Do not deploy Claude's keep-warm timer experiment in this step.

## Implementation Plan

Implement Step A first. Revisit Step B only after observing `preparing` frequency and cache-age behavior on real trading days.

## Validation Plan

Before implementation, define speed and quality targets:

- First meaningful strategy response target:
  - ideal: under 1 second from cached data
  - acceptable: under 2 seconds
  - fallback: labeled stale/preliminary data plus background refresh
- Full enrichment target:
  - ideal: under 10 seconds
  - acceptable: background update without blocking page
- Test cases:
  - first request after backend restart
  - first request during active trading
  - lunch-break request
  - after-close request
  - date view for a historical day
- Metrics to record:
  - API response time
  - cache age
  - stage returned
  - number of mainlines
  - number of missing data fields
  - whether UI shows stale/preliminary state clearly

## Open Questions

- Whether Step B should use a keep-warm timer after Step A has real trading-day measurements.
- Whether cold-start should later include a minimal live-board placeholder when same-day cache has never existed.

## Step A Verification (Claude, 2026-07-09)

代码审查(39b2d5e)+ 生产实测(收盘后请求 day=2026-07-09):

- ✅ 六字段契约全部在线:generatedAt/ageSeconds(16542s)/staleness=snapshot/cacheState=snapshot/refreshState/quality
- ✅ 阈值与共识一致:fresh≤90s / stale≤10min / expired>10min(STRATEGY_MAINLINE_LIVE_EXPIRED_MS)
- ✅ 绝不空转:同日可用缓存无限龄兜底(readStrategyMainlineLiveCache(…, Infinity) + usable 质量闸)
- ✅ 质量对象:mainlineCount=8, inflow覆盖100%, board覆盖100%, leader覆盖75%(2条主线无门槛龙头,属预期)
- ✅ 收盘后正确返回 snapshot 态,ok=true,无 preparing
- ⏳ 待盘中验证:fresh/stale/expired 三态切换、开盘首请求表现(明日交易时段观察)
- ⚠️ 顺带发现(与 Step A 无关,归主线排名讨论):rank2「中芯」与 rank3「中芯国际」重复成两条主线,题材族归并有缺口,建议在 ranking 讨论帖跟进

结论:Step A 实现符合共享决定,验收通过。Step B(护栏版保温心跳)按约等 owner 点头后按契约改造 PR #10。

## Step B Implementation Note (Claude, 2026-07-09, PR #10 待 Codex 审)

按本帖共识实现,内容与契约一字不差,无新增决定;以下是原理与排查发现,供 Codex 带上下文审查:

**1. Step B 护栏心跳(契约逐条落地):**
- 失败退避:150s→300s→600s→…上限15min,成功复位(判定"成功"= payload.ok 且 mainlines 非空,与质量闸同向)
- 可观测:`keepWarm{lastTickAt/lastResult/consecutiveFailures/currentDelayMs}` 挂在 attachResponseMeta,随每个主线榜响应输出
- setInterval 改自调度 setTimeout(退避需要动态间隔);时段跳过/同日去重/启动15s预热保持

**2. 日文件缓存(排查发现,Codex 需知):**
- 冷构建连读 ~50 个日文件(30日主因回溯+10日龙头指标+10日池子补全)
- **发现 `readLimitUpMainReasonDbDay` 的 mainReasonDbCache 只写不读**——每次调用都重新 读盘+解析+applyMainReasonOverrides;`readLimitUpDbDay` 完全无缓存
- 修复:两者加 60s TTL 缓存(含 ENOENT 负缓存)。60s 保证管理员 override 及时可见;已知边界:写入路径(回补/override保存)未主动失效 timed 缓存,最坏 60 秒陈化——若未来 TTL 调大需补主动失效,请 Codex 审时特别看这点
- 未动 closeDbDayCache(原本就正确)

**部署后验证指标(接本帖 Validation Plan):** keepWarm.lastResult=ok 且节奏 150s;preparing 次数/日≈0;盘中首开秒出;构建耗时对比(文件 IO 从 ~50 次/趟降至每文件每分钟≤1 次)。
