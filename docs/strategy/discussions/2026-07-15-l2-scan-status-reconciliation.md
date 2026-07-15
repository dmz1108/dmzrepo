# Discussion: L2 扫描完成状态归并

Status: In Discussion

Owner Question: 为什么今日主线有板块且资金已达标，页面仍一直显示“L2 未扫描”？

## Context

2026-07-15 生产主线冻结快照包含肝炎、CAR-T 细胞疗法等方向，但六条卡片均为 `unscanned`。本次只修正扫描任务和覆盖状态的事实归并，不调整明星金额、比值、资金流或主线排名常量。

## Evidence Available

- 标准生产证据请求：`day=2026-07-15`，`codes=603387,600664,603538,000566,600721,300149`，`themes=肝炎,CAR-T细胞疗法`，`window=20`。
- `bundleSha256=422fbec028beb5560bc47ae2ba4ff5e8ff8d0e644f3cc84beda18d5745bc7ad4`，`complete=true`，`missingSources=[]`，`sourceErrors=[]`。
- 生产持久化队列共有 15 个当日自动任务：14 个 `done`；肝炎同花顺任务为 `running`，但 `scanned/results/resultRows/rowsWithPrice/rowsWithAllBuckets` 均为 `50/50`。
- 肝炎东财任务已经 `done`，覆盖 5 个当日题材代码中的 4 个；同花顺任务覆盖 5/5，但漏发最终 `done`。
- CAR-T 东财任务已经 `done`，18/18 完成，并覆盖两只允许扫描的题材股；另外两只 `688` 股票按 worker 合同本来就被排除，却仍进入覆盖率分母。

## Codex Independent View

这是状态归并缺陷，不是自动派单失败。完整落盘但漏发 `done` 的任务应在服务重启时保守恢复为完成；未完成的排队/运行任务应真正重新入队。主线扫描覆盖率分母必须排除 worker 合同明确不扫描的科创板和北交所代码。

## Claude Independent View

Pending

## Company Codex Independent View

Pending

## Challenges

### Codex Challenges Claude

Pending

### Claude Challenges Codex

Pending

### Other Challenges

自动恢复 `done` 不能只看 `scanned==total`，还必须同时要求结果行、现价和五档完整率全部达到任务总数，避免把半成品误判为完成。若不满足，必须重新排队而不是判负。

## Revised Views

### Codex Revised View

采用严格五条件恢复：`total>0`，且 `scanned`、`results.length`、`metrics.resultRows`、`metrics.rowsWithPrice`、`metrics.rowsWithAllBuckets` 均覆盖全部任务；否则统一恢复为 `queued` 并重新入队。

### Claude Revised View

Pending

### Company Codex Revised View

Pending

## Shared Decision

Pending independent review. 生产显示已错误，按紧急缺陷路径先提交最小修复 PR；未完成独立评审前不合并、不部署。

## Implementation Plan

1. 队列重启恢复完整结果为 `done`，不完整任务重新排队。
2. 三态覆盖率过滤 worker 合同排除代码。
3. 增加生产结构对应回归与边界测试，不改明星和扫描阈值。

## Validation Plan

- 回放上述生产证据哈希。
- 覆盖“50/50 完整但 running”“不完整任务重启续扫”“CAR-T 含两只 688”“仅含排除代码”四个场景。
- 跑 L2 专项、语法检查和全仓测试；部署后检查 worker 心跳、pending、当日任务状态和主线三态。

## Open Questions

- Claude / Company Codex 需独立复核相同证据参数与恢复条件。
- 既有 2026-07-15 冻结快照是否重建，应与代码修复分开审批；默认不自动改写历史快照。
