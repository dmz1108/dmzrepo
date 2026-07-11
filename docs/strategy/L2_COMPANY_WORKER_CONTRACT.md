# 公司端 L2 Worker 五档契约与实盘验收标准

状态：验收优先（2026-07-10）。只有真实输出未通过时才实施兼容修改。

适用对象：公司 Codex、负责运行公司电脑 L2 worker 的维护者、复审与联调人员

契约版本：`company-l2-worker/2.0.0`

## 1. 目标

公司电脑上的 L2 worker 领取云端策略扫描任务，读取完整逐笔成交数据，在本机按委托号聚合，并向云端回传五个金额档位：

| 显示档位 | JSON key（人民币元） |
| --- | ---: |
| 50 万 | `500000` |
| 300 万 | `3000000` |
| 500 万 | `5000000` |
| 800 万 | `8000000` |
| 1000 万 | `10000000` |

云端已经按这五档选择每只股票自己的“最大可统计档”，用于资金活跃、预期明星和明星确认。worker 缺档会产生 `dataMissing`，不能用小档结果冒充最大档。

## 2. 已知状态与核验边界

- 云端 `local-l2-task-queue.js` 已下发五档、`priorityCodes`，并统计 `rowsWithPrice`、`rowsWithAllBuckets`、`workerVersion` 和 `firstResultAt`。
- 仓库中的 `l2-focus-scanner.js` 是旧 MQTT 扫描参考，当前只生成 50 万和 500 万两档；它不是公司电脑实际运行脚本的可靠证明，不能直接覆盖公司 worker。
- 公司交接资料说明正式 worker 位于公司电脑，并以 50 万、300 万、500 万、800 万、1000 万五档工作；Owner 也已在策略页看到五档存在真实数据。因此目前没有证据证明正式 worker 缺档，禁止仅依据旧参考脚本判定“必须升级”。
- 2026-07-10 以前的云端任务没有保存原始结果，暂时不能从历史文件核实五档完整率。下一次真实任务会由云端持久化，并用本规范的校验器完成正式验收。
- `tools/axtick_down_benchmark.js` 是下载与聚合参考，不保存账号密码，也不负责领取/回传云端任务。
- 本规范不修改策略阈值、不修改云端自动调度数量，也不把公司账号、worker token 或原始行情文件提交 Git。

先验收，不先修改。只有真实任务出现缺档、缺价格、错序、累计错误或版本不兼容时，才在公司电脑确认实际运行脚本、启动方式、计划任务/守护进程、日志路径和配置来源，备份后进行最小修改。

## 3. 云端任务契约

### 3.1 领取任务

接口：`POST /api/strategy/local-l2-worker/claim`

请求体：

```json
{
  "token": "<仅保存在公司电脑的 worker token>",
  "workerId": "company-l2-worker",
  "version": "company-l2-worker/2.0.0",
  "host": "company-pc"
}
```

要求：

- 无任务时也要每 30 秒以内领取一次，维持 worker 在线；云端超过约 45 秒未见 worker 会显示离线。
- `version` 每次领取和回传都必须发送；五档版本从 `company-l2-worker/2.0.0` 起。
- token 只从公司电脑环境变量或被 Git 忽略的本地配置读取，禁止写入代码、日志和交接文档。

领取响应中的 `job` 关键字段：

```text
jobId, plateId, boardName, day, threshold, minAmount,
thresholds, total, batchSize, priorityCodes, stocks
```

`stocks` 已由云端排好顺序：优先股票在前，其余股票随后。worker 必须严格按这个顺序处理，不得再按代码或涨幅重排。

### 3.2 回传结果

接口：`POST /api/strategy/local-l2-worker/result`

请求体最外层：

```json
{
  "token": "<仅保存在公司电脑的 worker token>",
  "jobId": "<领取到的 jobId>",
  "version": "company-l2-worker/2.0.0",
  "status": "running",
  "scanned": 12,
  "currentBatch": 1,
  "note": "已完成第一批",
  "results": []
}
```

**重要：云端每次收到 `results` 都会整批替换旧结果，不会自动追加。**

因此分批回传必须发送“截至当前已经完成的累计结果”：

- 第一批完成：发送第 1 批全部结果。
- 第二批完成：发送第 1 批 + 第 2 批全部结果。
- 最终完成：发送任务内所有股票结果并设 `status: "done"`。

只发送新增批次会把先前批次从云端覆盖掉，这是验收阻断项。

## 4. 原始数据计算口径

### 4.1 时间和单位

- 交易日必须与 `job.day` 一致，不能静默回退到前一交易日。
- 现行口径统计 09:30 之后截至扫描时点的逐笔成交；不要把集合竞价混入本口径。
- worker 输出的价格单位是人民币元，例如 `10.25`。
- worker 输出的金额单位也是人民币元，例如 500 万写作 `5000000`，不能写“万元”数值 `500`。
- AXTICK 下载字段如使用万分之一元定点值，必须先按已验证的数据字典换算；不能根据数值大小猜单位。

### 4.2 必须先按委托号聚合

档位判断针对“同一原始委托在当日截至当前的累计成交金额”，不是单笔成交记录金额。

例如同一买方委托拆成 40 万和 20 万两笔成交：必须先合并为 60 万，再计入 50 万档。若先过滤单笔小于 50 万的成交，这个委托会被错误漏掉。

主动/被动归集：

| 成交方向 | 主动侧 | 被动侧 |
| --- | --- | --- |
| B / 主动买 | 买方委托号累计到 `activeBuy` | 卖方委托号累计到 `passiveSell` |
| S / 主动卖 | 卖方委托号累计到 `activeSell` | 买方委托号累计到 `passiveBuy` |

每个档位分别执行：

1. 找出累计成交金额大于等于该档位的委托。
2. 汇总这些合格委托的累计成交金额。
3. 可同时回传合格委托数量 `activeBuyCount` 等四个 Count 字段。

五档的每个方向都必须随档位升高保持非递增。高档金额大于低档金额，通常意味着单位换算、委托聚合或重复累计错误。

### 4.3 动态数据与去重

- 如果下载接口每次返回“当日完整快照”，每次应从该快照重新计算，不能在上次结果上再累加。
- 如果接口返回增量，必须用成交序号或稳定唯一键去重后再累计。
- 同一份原始数据重复执行两次，应得到完全相同的五档结果。
- 后续时点重新下载时，结果可以随新增成交变化，但不能因为重复下载无故成倍放大。
- 下载失败、日期错误、CSV 截断、关键字段缺失或解析异常时，必须回传 `status: "error"`；禁止伪造五档全零。
- 原始数据有效但确实没有达到某档位的委托时，该档仍要存在，四项金额传数字 `0`。零值与缺失不是同一含义。

## 5. 单只股票结果结构

完整示例见：

- `tests/fixtures/l2-worker-claim.example.json`
- `tests/fixtures/l2-worker-result.example.json`

每一行必填字段：

| 字段 | 要求 |
| --- | --- |
| `code` | 六位股票代码，不带 `.SH/.SZ` |
| `name` | 原样保留任务下发名称 |
| `gainPct` | 原样保留任务下发的实时涨幅，JSON 数字 |
| `rank` | 原样保留任务顺序，正整数 |
| `batch` | 原样保留任务批次，正整数 |
| `price` | 扫描时现价，人民币元正数；兼容 `close/lastPrice`，正式版本优先用 `price`；校验器会拦截疑似未换算的异常大值 |
| `thresholds` | 五档对象，五个 key 必须全部存在 |

每档必填四项金额：

```json
{
  "activeBuy": 0,
  "activeSell": 0,
  "passiveBuy": 0,
  "passiveSell": 0
}
```

所有金额必须是大于等于 0 的 JSON 数字，不能是数字字符串、`null`、空对象或缺失字段。

建议每档同时回传：

```text
activeBuyCount, activeSellCount, passiveBuyCount, passiveSellCount
```

为兼容旧展示，可在结果行顶层镜像 50 万档四项金额和 `netActive`；若回传，必须与 50 万档完全一致。

即使某只 6 元股票按交易规则不可能出现 1000 万单笔委托，worker 也必须输出 `10000000` 档并填真实零值。云端会根据股票代码、现价和申报上限选择该股真正需要判断的最大档，不由 worker 删除“看起来用不到”的档位。

## 6. 错误、完成与幂等

### `running`

- 每完成一批即可回传。
- `results` 是累计结果，`scanned === results.length`。
- 必须保持 `job.stocks` 的顺序。

### `done`

- `results` 必须覆盖任务内全部股票，一只不多、一只不少、不重复。
- 即使股票五档全为零，只要原始数据读取和解析有效，也要保留该股票结果行。
- `scanned === job.total === results.length`。

### `error`

- `jobId`、`version`、`status: "error"` 和可诊断的 `error/note` 必须存在。
- 不要用全零结果掩盖下载、登录、限流、解析或日期错误。
- token、账号、密码和完整 Cookie 不得出现在错误文本。

同一任务重试时，worker 应重新生成确定性结果；云端以最新累计快照覆盖旧结果，不应把同一成交重复累计。

## 7. 公司端验收与条件式修改步骤

1. 下一个交易日保持现有正式 worker 在线，不修改脚本，完成一个真实小板块任务。
2. 从云端持久化结果导出脱敏的 claim/result，先运行第 8 节校验器。
3. 若五档、价格、任务覆盖、优先顺序和累计上报全部通过，结论为“现有 worker 合格”，停止，不创建升级分支。
4. 若验收失败，再从最新 `main` 建立 `company/l2-worker-compat-YYYYMMDD` 分支，并在公司电脑确认实际 worker 脚本和启动配置。
5. 备份实际 worker、配置和启动方式；不得把本地密钥提交 Git。
6. 保留现有已验证的 AXTICK 登录、下载、金额单位换算和方向字段映射，只修复验收失败项。
7. 如确实缺档，将汇总档位统一为 `500000/3000000/5000000/8000000/10000000`，并继续先按买卖双方委托号聚合再过档。
8. 如确实缺价格或元数据，补充人民币元现价 `price` 和版本；原样保留 job 的 `code/name/gainPct/rank/batch`。
9. 按 `job.stocks` 顺序扫描；每次发送累计结果；完成时覆盖全部股票。
10. 修改版先离线验收，再连接云端单任务联调；通过前不要替换正式常驻 worker。
11. 在 `docs/DAILY_HANDOFF.md` 写代码交接；实际公司电脑部署另写公司本地运维记录。不要直接覆盖云端代码。

## 8. 自动验收命令

仓库基线测试：

```powershell
node --check .\tools\axtick_down_benchmark.js
node --check .\tools\validate-l2-worker-output.js
node .\tests\l2-worker-contract.test.js
```

验证仓库自带的正确样例：

```powershell
node .\tools\validate-l2-worker-output.js `
  .\tests\fixtures\l2-worker-result.example.json `
  --job .\tests\fixtures\l2-worker-claim.example.json
```

验证公司 worker 的真实输出：

```powershell
node .\tools\validate-l2-worker-output.js C:\Temp\l2-result-sanitized.json `
  --job C:\Temp\l2-claim-sanitized.json
```

真实验收文件必须先删除 token、账号、Cookie 和原始个人路径；不得提交 Git。

## 9. 上云联调通过标准

选一个小板块或受控测试任务，完成一次真实领取和回传。以下条件必须全部满足：

1. worker 30 秒内显示在线并领取任务。
2. claim 中的 `priorityCodes` 位于 `stocks` 前部，worker 结果顺序完全一致。
3. `workerVersion === "company-l2-worker/2.0.0"`。
4. `firstResultAt` 有值，分批期间不会丢失先前股票。
5. 完成后 `status === "done"`，`resultRows === total`。
6. `rowsWithPrice === resultRows`。
7. `rowsWithAllBuckets === resultRows`。
8. 五档高档真实无单时显示零，不出现空对象或缺档。
9. 至少抽查 3 只股票：逐笔原始数据、按委托聚合结果、五档金额和 Count 一致。
10. 同一原始快照重复执行，结果不翻倍；后续时点更新时只反映新增成交。
11. 低价主板、创业板各至少抽查一只，确认云端选择的最大可统计档符合现价和申报上限。
12. 日志不包含账号、密码、token、Cookie 或整份原始逐笔数据。

现有 worker 全部通过时无需替换。若制作了兼容修改版，任一条件失败都不能替换正式 worker。

## 10. 条件式修改的回退

- 保留修改前 worker 和启动配置备份。
- 联调失败时停止新 worker，恢复旧脚本和旧启动方式。
- 不删除云端失败任务；保留任务状态和错误说明用于复盘，但清除任何意外写入日志的凭据。
- 回退后确认旧 worker 能继续心跳，策略页面不因任务长期卡在 `running` 而错误判负。

## 11. 复审重点

复审不能只看“字段已经加了”，必须检查：

- 是否按委托号累计，而不是按单笔成交直接筛选。
- 是否使用人民币元且经过真实样本核对。
- 是否五档都存在，零与缺失是否区分。
- 是否累计上报 `results`，避免云端整批覆盖丢数据。
- 是否严格保持优先任务顺序。
- 是否真实失败时报错，而不是生成全零假数据。
- 是否完整回传现价和版本号。
