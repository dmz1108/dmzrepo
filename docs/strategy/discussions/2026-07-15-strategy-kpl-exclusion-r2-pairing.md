# Discussion: 策略页剔除 KPL(7) + 主线卡片 R2 同源配对

Status: Converged
Owner Question:
策略页 `今日主线榜` 是否应只用东财(6)+同花顺(5)、完全剔除 KPL(7)（不统计也不展示）？主线卡片的净流入与卡片涨幅是否应按「同源一一对应」（东财净流入配东财涨幅、同花顺净流入配同花顺涨幅，绝不跨源拼）？

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
