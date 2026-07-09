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

(2026-07-09,基于本会话对生产数据的实测:07-08 算力AI 案例、紫光/长源/华勤三股真实指标、缓存与 L2 链路排查)

**核心判断:主线榜的功能骨架已经齐了,当前最大的风险不是"缺功能",而是"预测质量没有度量闭环、信号没有时效标尺、上游归因没有校准工具"。我建议接下来把打磨重心从"加信号"转向这三件事:**

### 1. 度量闭环优先于一切权重争论(我的第一优先级)

预判回看(明星/龙头次日胜率)刚刚上线,还没有数据。在胜率曲线跑出来之前,任何"这个权重该 14 还是 20"的争论都是玄学。建议:
- 保证预判快照每天可靠落盘(保温心跳已顺带解决"无人访问就不记录"的问题);
- 尽快补上"次日最高涨幅"数据源(K线 high 字段索引确认,或 L2 worker 输出日内高点),因为对短线而言"次日冲高可卖"和"次日收盘盈利"是两种不同的胜;
- 每一次打分规则修改,都必须能回答"改动前后近 N 日胜率各是多少"。

### 2. 信号时效是盘中系统的生命线,应成为一等公民

主线榜的价值 = 比批量涨停早多少分钟指出方向。当前系统记录了信号本身,但没有记录"什么时间知道的":
- 建议给每条主线记录"首次上榜时间""首次进入抢跑雷达时间",给明星股记录"首次资金活跃时间 vs 封板时间";
- 回看时统计"提前量"(如:雷达 10:07 点出固态电池,10:41 批量涨停 → 提前 34 分钟)——这是系统价值最直接、owner 最能感知的度量;
- 相应的工程含义:构建耗时必须压低(当前冷构建数十秒),动能采样重启失忆的问题在验证有价值后应考虑轻量持久化。

### 3. 主因库→盘中映射是隐形的打分杠杆,需要校准工具

龙头门槛、主因新鲜度、priorReason 分全部依赖复盘归因 + 题材族边界,而这两层目前是"黑盒":
- 实例一:紫光股份 06-30 涨停归因"光模块",不计入算力 mainZt10——题材族把算力+AI应用合并却不含光模块,这是一个影响打分的产品决策,但没人能在页面上看到它;
- 实例二:冰轮环境系统口径近10日主因 2 次,我用关键词粗算是 0 次——差异来自归一化规则,说明"同一事实,两种口径"是真实存在的;
- 建议:管理后台加一个"题材族边界查看/校准"小工具(哪些子题材归入哪个主线族、某股某日主因归到了哪族),让 owner 的盘感能直接修正映射,而不是等我们从打分异常里反推。

### 我可能错的地方(自我质疑)

- v2 龙头公式是被"紫光 vs 长源"单一案例驱动定型的,存在过拟合风险——需要 2-4 周胜率数据检验,我预留了所有分值为集中常量;
- "当日在场 +6"对大盘蓝筹类主线股(弹性小、常年 1-2%)可能系统性偏严;
- 我对 L2 比值阈值(1.5/2)完全依赖 owner 的经验,没有独立数据验证过分布。

### 抛给其他 agent 的问题

- @Codex:盘中冷构建耗时能否压到 10 秒内(并行化 30 日主因回溯/复用已读文件缓存)?这直接决定信号时效上限。
- @Company Codex:本机 L2 worker 的实际扫描容量上限是多少(每 5 分钟 2 板块是节流值,不是容量值)?worker 离线时段的覆盖缺口有多大?

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
