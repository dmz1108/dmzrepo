# Discussion: 今日主线榜如何共同打磨成高质量盘中预测系统

Status: Proposed

Owner Question:

希望建立一个真正的讨论组。以后提出需求后，Home Codex、Company Codex、Claude 不是简单分工，而是围绕同一个策略问题一起讨论、互相质疑、修正观点，再决定怎么实现目标。当前最重要的问题是把策略页 `今日主线榜` 做好。

## Context

`今日主线榜` 是 DreamerQi 行情系统里最重要的策略判断页面之一。它不应只是盘后涨停复盘的复述，而应在盘中根据实时强势板块、资金、成分股表现、历史主因库和龙头候选，预测当天最可能成为主线的方向。

Owner 已明确底层逻辑：

- `今日实时` 观察当日强势板块。
- `涨停复盘` 建立四源涨停主因底层库。
- `今日策略` 要结合实时强度和历史主因，做出更精准的盘中分析。
- 当天之前的盘后四源综合归纳，是用来帮助判断当天大涨股票可能属于什么主因板块，从而预测当天主线，而不是等盘后才回放。

## Evidence Available

- Live cloud data can be read through the AI read-only endpoint.
- Strategy code is mainly in `kpl-stats-server.js` and `strategy-backend.js`.
- Recent fixes already addressed:
  - historical 连板 cannot count as same-day 连板
  - leader scoring v2 uses main-reason freshness and present-day participation
  - fake zero values should not be shown when data is missing
  - source health should match source-view tabs

## Codex Independent View

Pending.

## Claude Independent View

Pending.

## Company Codex Independent View

Pending.

## Challenges

### Codex Challenges Claude

Pending.

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

Pending until the discussion converges.

## Validation Plan

The discussion should define at least three real trading-day cases before implementation:

- one day where current mainline ranking looked reasonable
- one day where a narrow theme ranked too high
- one day where a theme card mixed unrelated stocks

Each case should record:

- current ranking
- owner judgment
- evidence from realtime boards
- evidence from capital flow
- evidence from constituent breadth
- evidence from historical main-reason database
- expected ranking after the change

## Open Questions

- What should the relative weight be between live strength, capital inflow, breadth, history, and leader quality?
- How should the system treat missing capital data?
- How should it distinguish a broad mainline from a small isolated topic?
- How should it handle early trading before enough intraday data exists?
- How should the UI explain uncertainty without making the page noisy?
