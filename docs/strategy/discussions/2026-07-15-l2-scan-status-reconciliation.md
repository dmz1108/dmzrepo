# Discussion: L2 扫描完成状态归并

Status: Implemented

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

两个核心修复方向正确：worker 合同排除代码不应进入覆盖率分母；完整落盘但漏发 `done` 的任务可以按严格完整性条件恢复为完成。但原实现把 `persistDays=30` 保留范围内的全部 `queued/running` 历史任务都重新入队，会让 worker 用今天的实时盘口补扫历史 job，并挤占当天任务，必须在合并部署前收敛。

## Company Codex Independent View

Pending

## Challenges

### Codex Challenges Claude

同日恢复是否还应额外限制在开盘连续交易时段？结论是不再增加这一层限制：公司 worker 可能午休、短时离线或服务在盘中重启，同一中国日期的任务仍应保留续扫机会；任务的新建本身已有盘中时段和限流闸。跨日才是不能继续使用实时盘口的硬边界。

### Claude Challenges Codex

`restorePersistedJobs()` 遍历 30 天持久化目录后，把每个历史 `queued/running` 任务都执行 `this.queue.push(...)`。实测重启日 2026-07-15 时 worker 会领取 2026-06-20 的任务，造成实时 L2 数据穿越到历史日期，并阻塞当天串行队列。30 天只能表示记录保留期，不能表示允许重扫的日期窗口。

### Other Challenges

自动恢复 `done` 不能只看 `scanned==total`，还必须同时要求结果行、现价和五档完整率全部达到任务总数，避免把半成品误判为完成。若不满足，必须重新排队而不是判负。

## Revised Views

### Codex Revised View

接受 Claude 的阻断意见并修正：继续采用严格完整性恢复条件；只有 `job.day` 等于服务启动时的中国日期，残缺任务才恢复为 `queued` 并重新入队。更早的残缺任务保留原结果和审计说明，但转为终止状态，不进入 worker 队列。

### Claude Revised View

Pending post-fix re-review. Claude 已明确表示收敛到当天并补回归后可再次复核。

### Company Codex Revised View

Pending

## Shared Decision

Owner 在看到 Claude 阻断意见后明确要求修复。共同采用以下边界：

1. 30 天只保留任务记录，不赋予历史重扫权限。
2. 任意日期的完整落盘任务都可在重启时保守修正为 `done`，因为这不触发新扫描。
3. 只有中国时区当天的残缺任务可重新排队；历史残缺任务保留供查看，但不得领取、不得写入今天盘口。
4. 不采用“30 天内都续扫”，因为会数据穿越并占用串行 worker；不额外采用“仅开盘时段恢复”，因为会误伤午休或短时离线后的同日续扫。
5. 本修复不改明星阈值、扫描准入、评分排名或冻结快照。

## Implementation Plan

1. 队列重启恢复完整结果为 `done`；仅中国时区当天的不完整任务重新排队。
2. 历史不完整任务恢复为可审计的终止记录，不进入 worker 队列。
3. 三态覆盖率过滤 worker 合同排除代码。
4. 增加生产结构对应回归与边界测试，不改明星和扫描阈值。

## Validation Plan

- 回放上述生产证据哈希。
- 覆盖“50/50 完整但 running”“当天不完整任务重启续扫”“25 天前不完整任务绝不派发”“CAR-T 含两只 688”“仅含排除代码”五个场景。
- 跑 L2 专项、语法检查和全仓测试；部署后检查 worker 心跳、pending、当日任务状态和主线三态。

## Open Questions

- Claude 需复核本次当天边界修订；Company Codex 仍为 Pending，不冒充其参与。
- 既有 2026-07-15 冻结快照是否重建，应与代码修复分开审批；默认不自动改写历史快照。
