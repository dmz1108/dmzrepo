# Discussion: 龙头评分 v3——如何同时体现历史地位、盘中共振与明星证据

Status: Proposed

Discussion branch: discussion/3party-leader-scoring-v3-20260712

本文件只建立共同问题、事实边界和 Owner 已表达的方向。Codex、Claude、Company Codex 在各自首次独立观点完成前，不应先采用其他 agent 的答案。未形成 Shared Decision 前不改评分代码、不部署。

## Owner Question

请三方共同讨论如何优化今日主线榜的龙头评分。目标不是为了某一只股票硬调分，而是让评分更准确地识别真正具有主线地位、历史辨识度、当日共振和明星属性的龙头候选，同时保持可解释、可回放、可验证。

Owner 前面明确提出：

> 我觉得紫光股份的地位和最终评分不应该比祥鑫科技低。

> 我觉得应该增加10日涨停和10日涨幅得分权重，还有是否在主线上涨时龙头也一起在大涨。

> 明星股和主线共振上涨，明星股有时候也是龙头股，也应该有相应加分。

> 不应该限制有最高分这件事。

这些话是本轮讨论必须回应的产品判断，但不能通过硬编码紫光股份或任何个股实现。三方需要把它们转化为一般化规则，并用完整生产证据验证。

## Context

今日主线榜是盘中预测系统。龙头候选应综合回答：

- 这只股票过去是否反复因当前主线主因涨停，具有历史辨识度；
- 近10日和近30日是否持续强于同主线候选；
- 当天主线上涨时，它是否同步大涨或领先上涨；
- 它是否获得 L2 预期明星或明星确认信号；
- 当前高分来自真实证据，还是候选池变化、缺失数据、题材归属或重复加分造成；
- 盘中能否尽早识别，而不是等涨停或盘后主因生成后才给出答案。

当前生产系统已具备：近10日涨停库、近10/30交易日收盘价、四源综合主因库、当日板块强度与资金、成分股涨幅、L2 明星三层判定、主线归属复核、完整候选池诊断和预判回看。

## Current Production Formula

现行函数为 strategyMainlineReworkLeaders，当前 v2 规则如下：

| 分项 | 当前规则 | 已知边界 |
|---|---|---|
| 主因硬门槛 | mainZt10Count >= 1 才能进入正式龙头榜 | 首日新题材天然可能没有正式龙头 |
| 近10日涨停 | 每次14分，最高40分 | 3次后继续增加的历史辨识度被压缩 |
| 近10日涨幅 | 候选池内排名，第一30分，之后每名减3分，取前10 | 分数依赖候选池组成，不是绝对强度 |
| 近30日涨幅 | 候选池内排名，第一20分，之后每名减2分，取前10 | 同样会随候选池变化 |
| 主因新鲜度 | 最近3个交易日10分，6日内6分，10日内2分 | 只表达最近一次，不表达多次持续性 |
| 当日在场 | 今日涨停或涨幅>=3%加6分 | 没有直接衡量股票与主线板块同步程度 |
| 今日涨停 | 加10分 | 涨停后才确定，偏确认信号 |
| 今日连板 | 每板8分，最高24分 | 与近10日涨停可能存在相关性，需要防止重复奖励 |
| L2 明星 | confirmed加15分，其他已有 star 对象加8分 | active、expected 的语义需要进一步区分 |
| 早封 | 10:00前封板加6分 | 是确认后的辅助信号，不是盘中提前量本身 |
| 排序 | 总分→主因新鲜度→当日涨幅→代码 | 当前 leadScore 没有直接总分 clamp，但各分项上限形成理论最高约161分 |

现行公式没有直接使用“板块正在上涨时，候选股与板块同步上涨或领先上涨”的共振指标；主要通过当日在场、今日涨停、连板和早封间接体现。

## Evidence Boundary

### 1. 过滤后的 AI 响应不等于完整榜

2026-07-08 的 AI 只读请求曾只包含 codes=002396,000938。接口按请求代码过滤 leaders，因此返回的“星网锐捷114、紫光股份62”只能证明这两只股票各自的生产分数，不能证明紫光是完整榜第二，也不能证明祥鑫科技、长源东谷等不在完整池。

最近一次管理员完整诊断记录的复核顺序为：星网锐捷、祥鑫科技、紫光股份。该顺序是本轮需要解释和检验的真实案例之一，不是允许硬编码的目标答案。

本轮任何完整榜结论必须满足以下之一：

- 使用管理员完整 leaderDebug.pool；
- 或让只读接口返回 originalRank、fullLeaderCount 和明确的过滤范围；
- 或把需要比较的完整候选代码一次性纳入同一证据请求。

### 2. 必须锁定相同口径

同一次比较必须固定：

- 日期和交易阶段；
- frozen、live 或 review 模式；
- Git commit 与评分函数版本；
- 完整候选池；
- 交易日窗口与收盘价锚日；
- 涨停库、综合主因库、收盘价库的完整性；
- L2 是否已扫描、档位是否完整；
- 同一个证据包 SHA-256。

缺失数据必须保持 null 或 dataMissing，不得按0参与评分。

## Discussion Topics

### 议题 A：龙头候选池与主因硬门槛是否需要调整

问题：mainZt10Count>=1 是否仍是合理硬门槛？细分主因、主线家族证据和首日新题材应该怎样进入候选池？如何避免遗漏有地位但当日不在涨停名单中的股票，同时防止无关股票混入？

Owner 已知方向：龙头应建立在当前主线之内；不能为了提高紫光排名而硬编码个股。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

### 议题 B：10日涨停、10日涨幅、30日涨幅如何重新计分

问题：是否继续使用名次分，还是改为数值分、分段分或两者结合？10日涨停是否取消40分上限？10日涨幅应提高到什么权重？30日涨幅承担趋势确认还是长期地位？怎样避免高波动股票仅靠涨幅压过真正龙头？

Owner 已知方向：提高10日涨停和10日涨幅权重；不要因为固定最高分压平持续走强股票的差异。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

### 议题 C：主线与候选股的盘中共振如何量化

问题：应比较板块涨幅、候选股涨幅、相对超额涨幅、上涨广度、资金净流入还是时间先后？共振应看单个时点、连续多个采样，还是首次突破时间？如何防止与“当日在场+6”“今日涨停+10”重复计分？

Owner 已知方向：主线上涨时，真正龙头也应同步大涨；需要考察板块多数主因成分股是否一起上涨，而不是只看一只股票。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

### 议题 D：明星股与龙头重合时如何加分

问题：L2 资金活跃、预期明星、明星确认分别应给多少分？明星与龙头是两种独立角色还是可重合角色？同一只股既是预期明星又与主线共振时，怎样体现价值而不重复计算今日涨幅、涨停和资金信号？

Owner 已知方向：明星股有时就是龙头；明星股与主线共振上涨时应获得额外认可。涨停只是最终形态确认，系统应尽量在涨停前识别。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

### 议题 E：不设最高分后，如何保持可解释和可比较

问题：Owner 所说“不应该限制最高分”应落实为取消总分上限、取消部分分项上限，还是采用可累积的证据分？不同日期、不同候选池和不同主线规模下，原始分是否仍可直接比较？页面应展示原始分、分项分、置信度还是同池百分位？

Owner 已知方向：持续出现真实证据的股票应能继续积累优势，不应过早被固定上限压平。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

### 议题 F：如何验证新公式不是针对单日过拟合

问题：紫光股份与祥鑫科技是重要反例，但不能成为唯一训练样本。应选择哪些交易日、主线和正反例？上线前采用离线回放、影子评分还是直接替换？观察哪些指标，什么条件触发回滚？

最低验证要求：

- 2026-07-08 算力AI完整候选池，解释星网锐捷、祥鑫科技、紫光股份的每一分；
- 至少另外选择2个主线判断合理的交易日；
- 至少1个旧公式明显误判或窄题材过高的交易日；
- 对比旧v2与候选v3的完整榜、分项、原始名次、主线归属和次日表现；
- 先影子记录，不立刻替换生产排序；
- 观察主线内Top1/Top3、次日收盘/最高涨幅、盘中提前量、排名稳定性和明星转封率；
- 明确回滚条件，禁止仅凭“一个案例看起来更顺眼”上线。

Codex Independent View: Pending

Claude Independent View: Pending

Company Codex Independent View: Pending

Challenges / Responses: Pending

Owner Comments: Pending

Topic Decision: Pending

## Shared Decision

Pending.

## Implementation Plan

Pending until the discussion converges and Owner approves.

## Validation Plan

Pending. 最终计划必须锁定相同证据包、完整候选池和旧/新公式双跑方式。

## Open Questions

- “紫光不应低于祥鑫”是对7月8日交易地位的案例判断，还是希望形成可跨日复用的明确规则？
- 不设最高分是否允许10日涨停等证据无限累积，还是只取消总分显示上限？
- 主线共振需要新增盘中时间序列持久化到什么粒度？
- L2 active 是否应该继续获得明星分，还是只有 expected/confirmed 才算明星证据？
- 新公式应先只影响管理员影子榜，还是直接影响全部策略用户？
