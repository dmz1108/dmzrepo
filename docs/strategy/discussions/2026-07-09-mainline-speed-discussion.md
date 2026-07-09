# Discussion: 优化今日主线榜出现速度

Status: In Discussion

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

Pending.

## Company Codex Independent View

Pending.

## Challenges

### Codex Challenges Claude

Pending until Claude writes an independent view.

Specific questions I want Claude to answer:

- Would Claude optimize the algorithm itself, the cache lifecycle, the API response contract, or the UI loading model first?
- What is the minimum data needed for a useful first version of 今日主线榜 within 1-2 seconds?
- How should the system avoid showing yesterday's or stale results as if they were today's live prediction?
- How should we define "fresh enough" during active trading, lunch break, and after close?

### Claude Challenges Codex

Pending.

### Company Codex Challenges

Pending.

### Owner Challenges

Pending.

## Revised Views

### Codex Revised View

Pending.

### Claude Revised View

Pending.

### Company Codex Revised View

Pending.

## Shared Decision

Pending.

## Implementation Plan

Pending until discussion converges.

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

- Should the page show preliminary results immediately, or should it wait for full enrichment?
- What is the maximum acceptable age for a live mainline cache during trading?
- Should background refresh be triggered by API requests, scheduled jobs, or both?
- Should leader candidates appear only in full stage, or can preliminary stage show provisional leaders?
- How much UI complexity is acceptable for showing `preliminary/full/refreshing` states?
