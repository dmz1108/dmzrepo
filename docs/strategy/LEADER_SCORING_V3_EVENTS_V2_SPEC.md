# P6 规格:每日事件档案 v2 完整性收窄 — 状态转换表与测试案例(rev4)

状态:按 Codex 三审两项状态机闭合问题修订;待 Codex 复审、Owner 拍板。本文档只定义规则,不是实现。
作者:Claude(2026-07-13,rev4)。依据:Owner 对 P6 提前实施的确认与四点修正;06-23 / 07-02 两个缺原始快照日分别导致 07-01 替代验收 0/74、07-08 验收 0/90 的实证。

## 0. 范围与非目标

**范围**:`strategy-daily-events.js` 生成器的行级发射语义(event rule v2)+ `strategy-leader-scoring-v3.js` 评分器日级闸门的对应调整。

**首个实现 PR 的范围 = S2 only**(Codex 阻断 #6):S3 维持现行为;S4、S5 仅作规范定义保留,未经 Owner 明确批准不进入实现。

**非目标(硬边界)**:
- 不改任何分值:`DAILY_EVENT_POINTS`(20/15/8/0)与趋势系数(10日×1、30日×0.25)一个数字都不动。
- 不改 v2 正式榜的任何取数或计分路径。
- 不启动 PR4。
- 不改写、不重命名、不删除任何快照文件;污染隔离一律通过独立 data-quality 清单。
- 评分器信任模型不变:收窄发生在**生成器层**,评分器照旧只信显式状态,不新增任何数据源依赖。
- **禁止用日期推断任何证据体系是否存在**(Codex 阻断 #2):一切可用性判断只能来自档案/元数据的显式字段。

## 1. 快照术语(三层,严格区分)

| 层 | 文件 | 本案状态 |
|---|---|---|
| 原始板块快照 | `kpl-snapshots/{5,6,7}/<DAY>.json`(zs5=同花顺、zs6=东财、zs7=KPL) | **06-23、07-02 缺失的是这一层**,原件及备份均无 |
| 综合策略快照 | `strategy-data/snapshots/<DAY>.json` | 07-02 该层文件存在但**已被跨日污染**(东财 12 板块资金=07-01 昨值) |
| 冻结主线快照 | `strategy-mainline-snapshot-<DAY>.json` | 生成器 `buildPostCloseRecord` 实际读取的输入(经 `input.snapshot`) |

**data-quality 清单**(判别联合,Codex 二审 #2):独立文件,条目按 `state` 区分两种形状,禁止伪 SHA 或空字符串冒充已验证文件:

| state | 必备字段 | 语义 |
|---|---|---|
| `contaminated` | `{path, state, observedSha256, targetDay, observedSourceDay, reason}` | 文件存在但内容被证伪(如 07-02 综合快照:observedSourceDay=2026-07-01) |
| `missing` | `{expectedPath, state, targetDay, reason, sha256: null}` | 文件不存在(如 06-23/07-02 原始板块快照),sha256 显式为 null |

**隔离查验在加载/编排层,不在生成器**(Codex 二审 #3):`buildPostCloseRecord(existing, input)` 是纯函数,只接收 snapshot 对象与 quality 元数据,不做任何文件 I/O。契约:`finalizeStrategyDailyEvents` 与回填加载器在读取任何快照层文件**之前**先查 data-quality 清单,命中则不读取内容,并向生成器传入显式元数据:`quality.snapshotStatus ∈ {ok, missing, quarantined}`、`quality.snapshotUsable`(布尔)、`quality.snapshotEvidence`(命中的清单条目引用)。生成器只信任并落档这些元数据,不新增文件读取。

## 2. 日级源状态

对交易日 D,输入条件:

| 符号 | 含义 | 判定 |
|---|---|---|
| LU | 涨停底库可信 | `limitUpComplete` |
| MR | 主因库覆盖完整 | `mainReasonComplete`(missingMainReasonCodes 可枚举) |
| CL | 收盘库完整 | `closeComplete` |
| SNAP | 冻结主线快照可用(**含全链 provenance**,Codex 三审 #2) | 由加载层判定后以 `quality.snapshotStatus='ok'` 传入。`ok` 的充要条件:冻结主线快照存在 ∧ **构建依赖链三层全部干净**——冻结层、综合层、当日必需的原始板块快照 `kpl-snapshots/{5,6,7}` 均无 missing/contaminated 清单条目且原始层文件齐全。任一必需原始 zs5/zs6/zs7 缺失或污染,或综合/冻结层污染 → `snapshotStatus ≠ ok`(missing/quarantined + snapshotEvidence 落档)。若某层确实不属于当日冻结快照的构建依赖,必须由显式 provenance 元数据证明后方可豁免,禁止默认忽略 |

派生:
- `mainlineKnowable = LU ∧ MR ∧ SNAP`
- `rowsAuthoritative = LU`
- `noneDeterminable = LU ∧ (mainlineKnowable ∨ CL)`

**明星证据按股票逐只三分,不留空洞**(Codex 三审 #1;二审 #1 的家族级判定升级为逐股判定)。对每只涨停股 X,`starEvidenceStatusForStock(X)` 三值,判定全部显式、禁止日期条件、空数组不算证据:

| 值 | 判定 |
|---|---|
| `positive` | X **自身**有 level ∈ {expected, confirmed} 正证据(持久化 predict candidates[].stars / starTransitions 含 firstExpectedAt / 冻结快照 starStocks) |
| `scanned-no-star` | X 无正证据,且存在**显式覆盖 X 的扫描证据**:X 的逐股扫描记录,或家族级扫描元数据(`l2VerificationStatus ∈ {qi, scanned-no-star}` / worker 记录)**且该元数据明确声明覆盖家族全部候选** |
| `unscanned` | 其余一切情况 |

两条反证禁令:**空 `stars:[]` / `starTransitions:[]` 只证明字段存在,不提升状态;「家族里出现了另一只明星」不能证明 X 被扫描过**(A 是 expected 明星 ≠ B 被扫过没星)。`starEvidenceStatusByFamily` 可保留为诊断字段,但行级发射一律以逐股状态为准。

| 状态 | 条件 | 实例 | v1 现行为 | v2 行为 |
|---|---|---|---|---|
| S1 | LU∧MR∧CL∧SNAP | 回填期除 06-23/07-02 外各日 | 日 complete,正常计分 | **不变**(黄金不变性 T1,仅离线校验) |
| S2 | LU∧MR∧CL∧¬SNAP | **06-23、07-02** | 全池全阻断 | 行级判定(§3) |
| S3 | ¬LU | 尚未出现 | 全日阻断 | **不变**,`dataMissing:['limitUpDbUnreliable']` |
| S4 | LU∧¬MR | 尚未出现 | 全日阻断 | 规范保留,不实现(待 Owner 批准) |
| S5 | LU∧¬CL∧¬SNAP | 尚未出现 | 全日阻断 | 规范保留,不实现(待 Owner 批准) |

`reconstructed`:重建确认主线 `postCloseConfirmed.status='reconstructed'`,计分上视同 ¬mainlineKnowable(只进展示与审计),家族级 canonicalSource 裁定前不变。

## 3. 行级发射规则(生成器,event rule `leader-scoring-v3-events-v2`)

前提 rowsAuthoritative=true。对股票 X、盘后归属家族 G:

| 行规则 | 条件 | 发射 |
|---|---|---|
| R1 | X 涨停 ∧ 归属 G ∧ `starEvidenceStatusForStock(X) = positive` | `star-limit-up` 20,starEvidenceStatus=confirmed |
| R2a | X 涨停 ∧ 归属 G ∧ 状态 = scanned-no-star | `ordinary-limit-up` 15,starEvidenceStatus=not-confirmed(X 确实被扫过没星,真 15) |
| R2b | X 涨停 ∧ 归属 G ∧ 状态 = unscanned | `ordinary-limit-up` 15,starEvidenceStatus=**unscanned**(下界 15,Owner 已裁定) |

R1/R2a/R2b 与 `starEvidenceStatusForStock` 三值一一对应,**任何涨停且可归属的股票必落入其一,不存在漏行空洞**(Codex 三审 #1 的 B 股案例:同族 A=positive→20,B 无自身证据且无覆盖证据→unscanned→15,行不丢失)。
| R3 | X 涨停 ∧ 无法归属 | `data-missing`,`['mainReasonFamily']`(不变) |
| R4 | X 未涨停 ∧ mainlineKnowable ∧ 确认主线成分 ∧ 收盘涨幅>5% | `confirmed-mainline-big-gain` 8(不变) |
| R5 | X 未涨停 ∧ ¬mainlineKnowable ∧ CL ∧ 收盘涨幅>5% | **新增显式行**:`data-missing`,`['confirmedMainlineUnknown']`,附 closeGainPct;发射范围=当日全部「>5% 未涨停」股(有界) |
| R6 | X 未涨停 ∧ noneDeterminable ∧ 非 R5 | 不发射(缺席=none 0,评分器判定) |
| R7 | X 未涨停 ∧ ¬noneDeterminable | 不发射;由日级 noneDeterminable=false 兜底 |

v2 档案日级新增:`stockEvents.rowsAuthoritative`、`stockEvents.noneDeterminable`、`stockEvents.snapshotStatus`(含 snapshotEvidence 引用,ok 蕴含全链 provenance 干净)、`stockEvents.starEvidenceStatusByFamily`(诊断用;行级发射以每行 starEvidenceStatus 为准)。既有字段语义不变。

## 4. 评分器状态转换(v2 模式)

| # | 条件 | 结果 |
|---|---|---|
| E1 | 无该日档案 | `['dailyEventRecord']`(不变) |
| E2 | event rule = v1 | 完全沿用现行 v1 闸(`record.complete ∧ stockEvents.complete`;07-10 等既有档案行为不变) |
| E3 | v2 ∧ rowsAuthoritative≠true | `['limitUpDbUnreliable']` |
| E4 | X 任一行 dataMissing / historyEligible=false | dataMissing 透传行内原因(不变) |
| E5 | 有同族有效行 | 互斥取最高(不变) |
| E6 | 无同族行 ∧ noneDeterminable=true | none 0,complete |
| E7 | 无同族行 ∧ noneDeterminable≠true | `['noneUndeterminable']` |
| E8 | event rule ∉ {v1,v2} | `['dailyEventRuleVersion']`(不变) |

**scoreVersion 升级**(Codex 阻断 #4):评分器以 v2 闸运行时输出 `LEADER_SCORING_V3_SCORE_VERSION = 'leader-scoring-v3-shadow-v2'`,新旧报告可审计区分;event rule v1/v2 同时接受。`scoreToday`、资格门、趋势锚、互斥、tieBreakers:全部不变。日级顶层 `complete` 含义不变,v2 模式评分器不再读它。

## 5. 迁移与再生成(Codex 阻断 #1:最小范围)

1. event rule 升 `leader-scoring-v3-events-v2`;评分器接受 v1(E2)与 v2;scoreVersion 升 shadow-v2。
2. **生产只备份并重生成两个 S2 实证日:`06-23`、`07-02`**。S1 各日的 v1 档案在生产保持原样,经 E2 消费;不安装任何 S1 v2 文件(历史主因映射/板块目录会演化,今日重跑 S1 可能改变行集与证据)。
3. T1 黄金不变性作为**离线 golden 测试**:隔离目录内用锁定输入生成 S1 v2 对照,校验行集一致后丢弃,不安装。
4. 冻结快照、预测记录、三库、污染快照文件:零接触。07-02 综合策略快照的污染条目、06-23/07-02 原始板块快照缺失,均登记 data-quality 清单。
5. 07-10 起线上自动生成档案自实现部署日起自然切 v2;之前的 v1 档案永不重写。

## 6. 测试案例(实现 PR 必须全部覆盖)

| # | 夹具 | 期望 |
|---|---|---|
| T1 | S1 日(06-24 真实形状)离线 v2 再生成 | 行集与 v1 逐行一致;v3 分值/状态与 v1 消费结果完全相同(黄金不变性;离线,不安装) |
| T2 | S2 日 + 家族涨停股(黄河旋风 07-02 形状) | 15,historyEligible=true,窗口计入 |
| T3 | S2 日 + 未板 ≤5% | 无行;E6 → none 0 |
| T4 | S2 日 + 未板 +7.29%(东方锆业形状) | R5 行 → `confirmedMainlineUnknown`,整窗 incomplete |
| T5 | S2 日 + 涨停不可归属 | `mainReasonFamily`(与 v1 相同) |
| T6 | 综合快照在清单(07-02 形状,state=contaminated 含 observedSha256/observedSourceDay),冻结文件本身存在 | **加载层**:查清单命中,未读污染文件内容(断言无该文件读取);**生成器**:收到 snapshotStatus=quarantined + snapshotEvidence,按 S2;**依赖链断言:冻结文件存在不足以 ok** |
| T6b | 原始板块快照缺失(06-23 形状,state=missing,sha256=null),综合/冻结层即使存在 | 加载层沿依赖链判 snapshotStatus=missing;按 S2;清单条目无伪 SHA;**断言:原始 zs 层缺失即阻断 ok,无 provenance 豁免时不得默认忽略** |
| T7 | S3(¬LU) | 全员 `limitUpDbUnreliable` |
| T8 | X 自身有 expected 正证据 | 20,confirmed |
| T8b | 同族 A=expected 明星、B 涨停但无自身证据且无覆盖扫描证据 | A→20/confirmed;**B→15/unscanned,行不得丢失**(positive 家族无漏行空洞) |
| T9 | X 无正证据,家族扫描元数据显式声明覆盖全部候选(scanned-no-star) | 15,starEvidenceStatus=**not-confirmed** |
| T9b | predict 文件存在但 `stars:[]`、`starTransitions:[]` 全空且无覆盖 X 的扫描证据 | 15,starEvidenceStatus=**unscanned**(空数组不得提升状态;判定全程无日期比较) |
| T10 | 既有 v1 档案(07-10 真实形状) | E2 旧闸逐字段不变;scoreVersion 输出 shadow-v2(消费语义可审计) |
| T11 | S2 日同股同族双行 | 互斥取最高,duplicateRowsIgnored=1 |
| T12 | 未知 event rule | `dailyEventRuleVersion`(不变) |
| T13 | 端到端:07-08 星网形状(07-02 换 v2 档案) | 整窗 complete,formalScore 非空,basis=confirmed-target-day-family-limit-up |
| T14 | 端到端:600405 形状 | 仍 incomplete(`trend:gain10/gain30`),收窄不外溢趋势层 |

**验收重跑测算预期(非验收承诺,最终以锁定输入与三组 SHA 为准)**:07-08 约 87/90、07-01 约 60/74;两日各出首份合规 v2/v3 正式名次对照表。实现后由 Codex 执行、Claude 复核,不得据测算预期预先宣布 v3 优劣。

## 7. 悬而未决(需 Owner 拍板)

1. S4 / S5 的启用时机(首个实现 PR 均不包含)。
2. 家族级 canonicalSource 裁定后,`reconstructed` 确认主线是否升级为可计分(本规格默认不可)。
