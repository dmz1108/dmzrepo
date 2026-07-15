# Discussion: 策略页剔除 KPL(7) + 东财/同花顺两套独立主线预测

Status: Converged (v2 — Owner 2026-07-15 最终口径取代 R2 单卡形态)
Owner Question:
（v1）策略页 `今日主线榜` 是否应只用东财(6)+同花顺(5)、完全剔除 KPL(7)？主线卡片净流入与涨幅是否同源一一对应？
（v2 最终）策略页是否应拆成**两套完全独立的主线预测**——东财主线预测（只用 zsType=6）与同花顺主线预测（只用 zsType=5），各自独立形成候选、评分、排序与第 1 主线，绝不先跨源合并再拆显示？

> **v2 取代 v1 的 R2 形态**：R2（合并成一张主线卡，再在卡内附东财/同花顺两组数值）不满足 Owner 需求——它无法回答「东财今天第一主线是谁 / 同花顺今天第一主线是谁」。`sourcePairs` 可作为单卡溯源信息保留，但不能替代两套独立预测。见文末「2026-07-15 Owner 最终口径澄清」。

## Context

- `今日主线榜` 是盘中预测系统，候选识别 / 板块数 / 净流入 / 涨幅 / 排序 / L2 扫描都依赖「取哪些板块来源」。
- 历史上三源（东财 zsType=6 / 同花顺 zsType=5 / KPL zsType=7）都进策略取板。Owner 判断 KPL 的板名口径与东财/同花顺差异大，混入后污染板块计数与主线判断，决定策略页只用东财+同花顺。
- 主线卡片旧版只显示「资金口径 单板」一行，净流入与涨幅可能来自不同源的不同板，读起来会「跨源拼」。Owner 要求按同源一一对应展示（R2：两组并列）。

## Evidence Available

生产只读证据（AI_PRODUCTION_READ.md 标准流程，Token 仅由安全环境注入，未入任何文件/PR）：

- 标准证据包：`day=2026-07-15 codes=002396,000566 themes=算力AI,大消费 window=30`
  - `bundleSha256 = c5acd5e9779b91044795248c103793f399fc9b7501c0ba38706883f2f654f60c`
  - `complete=true`，`missingSources=[]`，`sourceErrors=[]`
  - `replay-strategy-case.js --require-complete --expect-sha=<上值>` 通过（确定性、哈希未被篡改）。
- 原始板块快照对照（`/api/snapshot?day=2026-07-15&zs_type=5|6|7`，人工交叉核对）：
  - 东财(6) 12 板、同花顺(5) 12 板、KPL(7) 8 板；策略口径 6∪5 去重后 21 个板名。
  - **KPL(7) 的 8 个板名全部不在东财∪同花顺集合内**（保健品、宠物经济、生育概念、眼科医疗、美容护理、酿酒、民营医院、医药）。→ 旧代码下这 8 个 KPL 独有板会独立进入策略候选与板块计数，直接污染策略口径。
- 实时摘要（`/api/ai/strategy-live?day=2026-07-15`）：今日 6 条主线的 `netInflowZsType` 均为 5 或 6（无 7），`resonanceBoards` zsType 分布 {6:5, 5:2}。说明「今天这一刻」KPL 未在净流入上胜出，但仍进候选/板块计数；剔除是结构性正确，而非针对单日现象。

结论字段支撑：`netInflowZsType`、`/api/snapshot` 各源 `boards[].name`、证据包 `strategyMembership`。缺失字段：无（complete）。

## Codex Independent View

Codex 在 PR #88 复核（`pullrequestreview-4702711558`，`author_association: OWNER` 账号代 Codex 复核）给出「暂不批准」，核心为真实主线链路仍未剔除 KPL 的 P1 问题，并列出 5 项阻断/建议（见下 Challenges）。Codex 同意方向（剔除 KPL + R2），但要求改在真实链路、补贯穿上游的行为测试、修快照日可用性、澄清历史冻结快照、补生产证据包与讨论组记录。

## Claude Independent View

- 方向认同：策略口径应只用东财+同花顺；KPL 板名体系差异大，混入会虚增 `boardCount` 并可能把 KPL 独有题材顶上主线。生产快照证据（8/8 KPL 独有板）支持这一点。
- R2 同源配对正确且必要：净流入与涨幅必须同源同板，避免误导。
- 实现上要避免「误伤」：看板/复盘等页面仍需三源，故剔除应作用在策略取板链路，而非全局改常量。

## Company Codex Independent View

Pending（本次未参与）。

## Challenges

### Codex Challenges Claude

1. **P1**：`buildStrategyMainlinesLiveImpl` 真正调用 `getDayBoardsWithMembers`，其快照循环与实时回退仍固定 `[6,5,7]`；`STRATEGY_ZS_TYPES` 只改了 `getStrategyBoardsForDay`/`collectStrategyQiCodes`，KPL 实际未被剔除。
2. **丢源**：`getDayBoardsWithMembers` 用 `bmap.get(name)` 跨源按板名去重，同名东财/同花顺只留涨停高的一条；即使修 P1，`strategyMainlineSourcePairs` 也常拿不到两源。helper 测试直接构造两源数组，绕过了上游丢源。要求 source-aware 身份 + 贯穿真实上游的行为测试。
3. **快照日可用性**：`strategySnapshotDayHasSnap` 仍把 KPL-only 快照当策略日可用，可能选中只有 zs7、无 zs5/zs6 的日期导致策略板块为空。
4. **历史冻结快照**：历史接口优先返回已冻结快照，旧快照不会因本次代码去掉 KPL；PR 文案不应声称历史展示也已完全剔除。
5. **证据缺失**：无标准生产证据包、`bundleSha256` 与讨论组收敛记录。

### Claude Challenges Codex

- 对点 4：认同不能声称历史已剔除，但也不宜对冻结快照做「代码自动重建」——历史重建属高风险写操作，应显式排除在本 PR 之外，仅在新生成快照与实时 live 口径生效。→ 采纳为「本 PR 只影响新快照 + live，不动历史冻结快照」的明确边界。

## Revised Views

### Codex Revised View

Pending（等 Claude 修复后重新请求审核；本记录同步至 PR #88 评论）。

### Claude Revised View

逐项落实：
- 点1：`getDayBoardsWithMembers` 增 `options.zsTypes`（默认 `[6,5,7]` 不误伤共享调用者），`buildStrategyMainlinesLiveImpl` 传 `zsTypes: STRATEGY_ZS_TYPES`。真实链路剔除 KPL。
- 点2：去重仍按板名（排名口径不变），但每源留一份到 `winner.bySource[zsType]`；`strategyMainlineSourcePairs` 优先读 `bySource[zs]`，绝不跨源拼；seeds/resonance 透传。行为测试贯穿真实 `getDayBoardsWithMembers` + `strategyMainlineSourcePairs`。
- 点3：`strategySnapshotDayHasSnap` 改遍历 `STRATEGY_ZS_TYPES`，KPL-only 日对策略页视为空板日不可用（三处调用均策略口径）。
- 点4：明确本 PR 仅影响「新生成快照 + 实时 live 口径」，不改历史冻结快照；PR 文案与本记录不宣称历史展示已完全剔除。历史迁移/重建若需要，另起经审核的方案。
- 点5：本记录 + PR 评论补齐 `bundleSha256`、完整性、字段与结论。

## Shared Decision

Owner 2026-07-15 定稿：**剔除 KPL(7) 确认**，策略页只用东财(6)+同花顺(5)，KPL「不用统计也不展示」；主线卡片按 **R2 同源一一对应** 并列展示东财、同花顺两组。

未选择的方案与原因：
- 全局改常量剔除 KPL：否。会误伤看板/复盘等仍需三源的页面 → 改为策略链路 option 传参。
- R1（只展示单一「代表源」一组）：否。Owner 要求两源都看得到 → 选 R2 两组并列。
- 代码自动重建历史冻结快照去 KPL：否（本 PR 排除）。属高风险写操作，另起审核方案。

## Implementation Plan

- `STRATEGY_ZS_TYPES = [6, 5]`；`getStrategyBoardsForDay` / `collectStrategyQiCodes` / `getDayBoardsWithMembers`(策略路径 via option) / `strategySnapshotDayHasSnap` 用之。
- `strategyMainlineSourcePairs(boards)` 同源配对，读 `bySource`；主线对象输出 `sourcePairs:{eastmoney, ths}`（合并 + seeds + AI 证据三路径）。
- 前端 `kpl-dashboard_17_apple.html`：`strategyMainlineSourcePairsHTML` 两组并列 + `.ml-srcpairs` 样式。

## Validation Plan

- 生产证据：`bundleSha256=c5acd5e9779b91044795248c103793f399fc9b7501c0ba38706883f2f654f60c`，`complete=true`；回放 `--expect-sha` 通过。快照对照证明 KPL 8/8 独有板会污染旧口径。
- 回归：全仓 33 个测试文件全绿；新增 `tests/strategy-kpl-exclusion.test.js` 贯穿真实 `getDayBoardsWithMembers` / `strategyMainlineSourcePairs` / `strategySnapshotDayHasSnap`；`tests/strategy-source-pairs.test.js` 配对 + 静态断言。
- 非作者复核：Codex 复核 PR #88（作者不自批）。
- 部署后测量：策略页板块计数应不含 KPL 独有题材；主线卡片两组净流入/涨幅严格同源同板；无仅 KPL 快照被选为策略日。
- 回退：`production-ops.yml` 备份 + 还原 `kpl-stats-server.js` / `kpl-dashboard_17_apple.html`。

## Open Questions

- 历史冻结快照仍含 KPL：是否需要经审核的离线重建脚本？本 PR 不做。
- `getStrategyBoardStocks` 逐 plateId 查表保留 `[6,5,7]`：策略已不传 KPL plateId，无副作用；是否统一改口径待 Owner 定。

---

## 2026-07-15 Owner 最终口径澄清（取代 R2）：两套独立主线预测

Owner PR #88 定稿：策略页明确分成两套**独立**预测，不是「合并成一张卡再附两组数值」。

### Shared Decision (v2)

1. **东财主线预测**：只用东财 `zsType=6` 的板块、成员、涨幅、净流入与盘中行为，**独立**形成候选、评分、排序与第 1 主线。
2. **同花顺主线预测**：只用同花顺 `zsType=5`，同样**独立**。
3. 候选、板块数、净流入、涨幅、成员股贡献、评分、排名必须在**各自来源内独立计算**；某源缺失显示「该源暂缺」，**不得借另一源数据补值**。
4. 历史四源主因、涨停库、L2 可作两边**共同佐证层**，但不得把东财/同花顺的板块指标混成同一个预测分数。
5. 前端分「东财主线预测」「同花顺主线预测」两个清晰板块：桌面并列、移动上下排。每边显示自己的第 1 主线与后续候选。
6. 同一题材两边都独立排前列 → 可额外标「东财×同花顺双源共振」，但两边各自保留分数/排序/证据，**不塌成一张共享卡**。
7. **KPL(7) 不进入两套预测，也不进入策略页热点/共振等辅助指标**（回答了 hot-themes 范围问题：策略页热点榜、共振榜均剔除 KPL）。
8. 现有 `sourcePairs`/`bySource` 可作单卡溯源信息保留，但不替代两套独立预测。

未选择：R2 单卡两组（v1）——无法回答各源第 1 主线，Owner 明确否决。

### Implementation Plan (v2)

- 后端：`buildStrategyMainlinesLiveImpl` 参数化单一板块来源（`options.boardZsTypes`），按 `[6]` 与 `[5]` 各独立跑一遍全套引擎（取板→富化→评分→排序），输出 `mainlinesBySource: { eastmoney, ths }`；每套带自己的 `count/mainlines/第1主线` 与「暂缺」标志。
- 共享佐证层（四源主因、涨停库、L2、收盘价）仍单次读取，作为两边共同输入，但不并入板块预测分。
- 双源共振：题材归一后若两边都进前列，附 `dualResonance` 标记，不合并卡。
- 前端：`renderStrategyMainlinesHTML` 拆成两区（东财/同花顺），桌面并列、移动上下；缺源显示暂缺。
- 热点榜/共振榜：`getDayThemeBoardStats`（策略页消费路径）与 `getStrategyStrongResonance` 均剔除 KPL（共振榜已改；热点榜策略消费路径待改）。
- AI live/review 证据链输出改为两套；`aiCompactMainline` 适配。

### Validation Plan (v2) — 必须的行为回归

- 东财 A 第 1、同花顺 B 第 1 → 接口与页面分别显示 A/B，不被合并为同一排名。
- 只在东财的题材只出现在东财区；只在同花顺的只出现在同花顺区。
- 同名题材两源不同净流入/涨幅 → 两边各自保留分数与排序，不交叉取值。
- 某源缺失 → 另一源正常，缺失源不借值。
- KPL 即便资金/涨停最高，也不改变任一来源的候选/分数/排名，也不进热点/共振。
- 生产证据：按 AI_PRODUCTION_READ.md 重新抓取并回放，记录 bundleSha256；对照东财 vs 同花顺各自第 1 主线（可不同）。

### Open Questions (v2)

- 双跑引擎的性能/缓存：两源各跑一遍全套（含实时补水），需确认可接受或做并发/缓存。→ 待 Owner 确认实现走法后落地。
- 响应体积变化对 AI live 证据链的影响（两套 mainlines）。
