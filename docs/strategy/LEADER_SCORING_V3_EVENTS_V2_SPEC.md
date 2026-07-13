# P6 规格:每日事件档案 v2 完整性收窄 — 状态转换表与测试案例(定稿)

状态:**已定稿(2026-07-13)**——六轮 Codex 评审通过(共 13 项阻断修订 + R5b 精化接受),Owner §7 两项全部拍板。本文档只定义规则,实现另开 Draft PR。
作者:Claude(2026-07-13)。依据:Owner 对 P6 提前实施的确认与四点修正;06-23 / 07-02 两个缺原始快照日分别导致 07-01 替代验收 0/74、07-08 验收 0/90 的实证。

## 0. 范围与非目标

**范围**:`strategy-daily-events.js` 生成器的行级发射语义(event rule v2)+ `strategy-leader-scoring-v3.js` 评分器日级闸门的对应调整。

**实现范围(Owner 2026-07-13 口径修正)**:S2、S4、S5 均按「按股票、按字段」闸实现;唯一的全日闸是 S3(涨停事实本身不可信)。核心原则:**缺少某类数据,不等于当天所有已经确定的事件都不得分;能由可靠证据独立确认的分数(如涨停 15/20)必须记录**。此前「首个实现 PR = S2 only」的范围声明废止——S4/S5 的正确行为由 **rev6 的逐股决策树(§2.1)与 R5b 显式行**共同修正确立(rev5 的日级布尔在 mainlineKnowable∧¬CL 组合下存在误判 0 的缺口,见 T16b)。

**两条档案级不变量(Owner 口径修正)**:
1. 每日事件档案必须保存**所有可独立确认的 15/20 分事件**及其 provenance,无论当日其他字段缺什么;
2. 趋势或其他必要字段缺失时,v3 **总分**可保持 incomplete(formalScore=null),但**已确认的事件分必须在明细(history.evidence / knownPoints)中完整可审计**,任何字段缺失不得反向清除已确认涨停事件。

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

派生(仅作实现便利,**语义以 §2.1 逐股决策树为唯一真值**):
- `mainlineKnowable = LU ∧ MR ∧ SNAP`
- `rowsAuthoritative = LU`
- `noneDeterminable = LU ∧ (mainlineKnowable ∨ CL)`(该布尔只在 R5b 行如约发射的前提下才与决策树等价,见 §2.1 注)

**逐股家族归属状态**(Codex 五审 #2):`familyEvidenceForStock(X) ∈ {reliable, missing}`:

| 值 | 判定(优先级从上到下) |
|---|---|
| `missing` | X ∈ `missingMainReasonCodes`;或 X 无四源综合主因记录;或记录的 `finalBoardTopic` 经 `familyForTheme` 无法映射到任何主线家族 |
| `reliable` | 以上皆否:X 有四源综合主因记录 ∧ 主题可映射家族。provenance 落行内 `sourceReason.finalBoardTopic/finalDetailReason` |

现行管线一码一记录一家族;若未来同股出现多家族证据,按家族分别发事件行(评分器本就按 familyKey 过滤,非对称记录规则兼容),不合并不去重。

### 2.1 逐股事件决策树(唯一真值;S1-S5 仅为输入组合的诊断标签,不构成互斥控制流)

对家族 G 评分时,股票 X 在日 D 的事件判定:

1. ¬LU → 全局 `dataMissing:['limitUpDbUnreliable']`(唯一全日闸)。
2. X 在可信涨停库:
   - `familyEvidenceForStock(X)=reliable` → 15/20(明星按逐股三分 `starEvidenceStatusForStock`);
   - `=missing` → `dataMissing:['mainReasonFamily']`(只阻断 X)。
3. X 不在涨停库(未板):
   - **mainlineKnowable ∧ CL** → X 属确认主线成分且 gain>5% → 8;否则 none 0;
   - **mainlineKnowable ∧ ¬CL** → X 属确认主线成分 → `dataMissing:['closePrice']`(8 分依赖涨幅,不可判);X **不属任何确认主线成分** → none 0(8 分因非成分即被排除,不依赖涨幅——见下注);
   - **¬mainlineKnowable ∧ CL** → gain>5% → `dataMissing:['confirmedMainlineUnknown']`;gain≤5% → none 0;
   - **¬mainlineKnowable ∧ ¬CL** → `dataMissing:['closePrice','confirmedMainlineUnknown']`(0/8 均不可判)。

**注(对 Codex 五审 #1 决策树的一处精化,请复核)**:五审建议「CL 缺失 → 一律 closePrice dataMissing」。本规格在 mainlineKnowable∧¬CL 分支细分:确认主线**成分股**按建议阻断;**非成分股**判 none 0——因为 8 分要求「成分 ∧ >5%」两条件,非成分单条即被排除,none 0 的确定性不依赖收盘涨幅,符合「缺什么只阻断依赖它的分数」。为使评分器可判定,该分支要求生成器发射 R5b 显式行(§3),行缺席才能安全解释为「非成分 → none 0」。若 Codex 认为此精化引入不可接受的复杂度,可整支退回「¬CL 一律 closePrice」的保守口径,只需删 R5b 与该子分支。

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
| S3 | ¬LU | 尚未出现 | 全日阻断 | **不变**,`dataMissing:['limitUpDbUnreliable']`(涨停事实本身不可信,正负证据全失效——唯一保留的全日闸) |
| S4 | LU∧¬MR | 尚未出现 | 全日阻断 | **按股票收窄**:归属可靠的涨停股正常 15/20(明星按逐股三分);仅缺归属股 R3 → `mainReasonFamily`;¬MR ⇒ ¬mainlineKnowable,8 分不确定按 R5/R7 处理(CL 在则 >5% 显式行,CL 缺则 noneUndeterminable)。MR 全局不完整**不得**阻断归属已确定股票 |
| S5 | LU∧¬CL(可与 S4 重叠,仅为诊断标签,不构成互斥控制流) | 尚未出现 | 全日阻断 | **按字段收窄**:涨停+可靠归属不依赖 CL/SNAP,正常 15/20;依赖收盘涨幅或确认主线的判定(8 分、none 0)按 §2.1 决策树逐股阻断;**不得反向清除已确认涨停事件** |

`reconstructed`(**Owner 2026-07-13 终裁**):重建确认主线 `postCloseConfirmed.status='reconstructed'` 只用于展示、解释与审计,**不得直接产生 `confirmed-mainline-big-gain` 8 分**,计分上视同 ¬mainlineKnowable。该限制不影响可独立确认的事件:可靠涨停+可靠归属 → 15,叠加自身明星正证据 → 20,照常进入后续 10 日历史窗口;窗口有未决字段时 formalScore 可保持 null,但已确认 15/20 必须保留在 `history.knownPoints/evidence`。将来只有在 canonicalSource、sourceDay/asOf、防跨日污染与重建可信标准**全部定稿**后,才另开讨论决定 reconstructed 是否升级计分——不得在 P6 中暗中放开。

## 3. 行级发射规则(生成器,event rule `leader-scoring-v3-events-v2`)

前提 rowsAuthoritative=true。对股票 X、盘后归属家族 G:

| 行规则 | 条件 | 发射 |
|---|---|---|
| R1 | X 涨停 ∧ 归属 G ∧ `starEvidenceStatusForStock(X) = positive` | `star-limit-up` 20,starEvidenceStatus=confirmed |
| R2a | X 涨停 ∧ 归属 G ∧ 状态 = scanned-no-star | `ordinary-limit-up` 15,starEvidenceStatus=not-confirmed(X 确实被扫过没星,真 15) |
| R2b | X 涨停 ∧ 归属 G ∧ 状态 = unscanned | `ordinary-limit-up` 15,starEvidenceStatus=**unscanned**(下界 15,Owner 已裁定) |
| R3 | X 涨停 ∧ 无法归属 | `data-missing`,`['mainReasonFamily']`(不变) |
| R4 | X 未涨停 ∧ mainlineKnowable ∧ 确认主线成分 ∧ 收盘涨幅>5% | `confirmed-mainline-big-gain` 8(不变) |
| R5 | X 未涨停 ∧ ¬mainlineKnowable ∧ CL ∧ 收盘涨幅>5% | **显式行**:`data-missing`,`['confirmedMainlineUnknown']`,附 closeGainPct;发射范围=当日全部「>5% 未涨停」股(有界) |
| R5b | X 未涨停 ∧ mainlineKnowable ∧ ¬CL ∧ **对当前评分家族 G:X ∈ confirmedMainlineMembers[G]**(即 G 的 familyEvidenceCodes) | **显式行**:`data-missing`,`['closePrice']`,**行携带 familyKey=G**;发射范围=各确认主线家族成分中未涨停股(有界),逐家族发射,不得误解为任意主线成分。本行是 §2.1 精化分支的前提:发射后行缺席才可安全解释为「非 G 成分 → 对 G 而言 none 0」 |
| R6 | X 未涨停 ∧ 按 §2.1 决策树判 none 0 ∧ 非 R5/R5b | 不发射(缺席=none 0,评分器判定) |
| R7 | X 未涨停 ∧ ¬mainlineKnowable ∧ ¬CL | 不发射;由日级 noneDeterminable=false 兜底(E7 输出 `['closePrice','confirmedMainlineUnknown']`) |

R1/R2a/R2b 与 `starEvidenceStatusForStock` 三值一一对应,**任何涨停且可归属的股票必落入其一,不存在漏行空洞**(Codex 三审 #1 的 B 股案例:同族 A=positive→20,B 无自身证据且无覆盖证据→unscanned→15,行不丢失)。

v2 档案日级新增:`stockEvents.rowsAuthoritative`、`stockEvents.noneDeterminable`、`stockEvents.snapshotStatus`(含 snapshotEvidence 引用,ok 蕴含全链 provenance 干净)、`stockEvents.starEvidenceStatusByFamily`(诊断用;行级发射以每行 starEvidenceStatus 为准)。既有字段语义不变。

## 4. 评分器状态转换(v2 模式)

| # | 条件 | 结果 |
|---|---|---|
| E1 | 无该日档案 | `['dailyEventRecord']`(不变) |
| E2 | event rule = v1 | 完全沿用现行 v1 闸(`record.complete ∧ stockEvents.complete`;07-10 等既有档案行为不变) |
| E3 | v2 ∧ rowsAuthoritative≠true | `['limitUpDbUnreliable']` |
| E4 | X 任一行 dataMissing / historyEligible=false | dataMissing 透传行内原因(不变) |
| E5 | 有同族有效行 | 互斥取最高(不变) |
| E6 | 无同族行 ∧ noneDeterminable=true | none 0,complete(前提:R5/R5b 已如约发射,行缺席=确定无事件) |
| E7 | 无同族行 ∧ noneDeterminable≠true | dataMissing `['closePrice','confirmedMainlineUnknown']`(0/8 均不可判,替代旧笼统标签 noneUndeterminable) |
| E8 | event rule ∉ {v1,v2} | `['dailyEventRuleVersion']`(不变) |

**scoreVersion 升级**(Codex 阻断 #4):评分器以 v2 闸运行时输出 `LEADER_SCORING_V3_SCORE_VERSION = 'leader-scoring-v3-shadow-v2'`,新旧报告可审计区分;event rule v1/v2 同时接受。`scoreToday`、资格门、趋势锚、互斥、tieBreakers:全部不变。日级顶层 `complete` 含义不变,v2 模式评分器不再读它。

## 5. 迁移与再生成(Codex 阻断 #1:最小范围)

1. event rule 升 `leader-scoring-v3-events-v2`;评分器接受 v1(E2)与 v2;scoreVersion 升 shadow-v2。
2. **生产只备份并重生成两个 S2 实证日:`06-23`、`07-02`**。S1 各日的 v1 档案在生产保持原样,经 E2 消费;不安装任何 S1 v2 文件(历史主因映射/板块目录会演化,今日重跑 S1 可能改变行集与证据)。
3. T1 黄金不变性作为**离线 golden 测试**:隔离目录内用锁定输入生成 S1 v2 对照,校验行集一致后丢弃,不安装。
4. 冻结快照、预测记录、三库、污染快照文件:零接触。07-02 综合策略快照的污染条目、06-23/07-02 原始板块快照缺失,均登记 data-quality 清单。
5. 实现部署日起,新生成档案自然切 v2;部署前既有 v1 档案(含 07-10 起线上自动生成的)永不重写。

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
| T15 | S4 日:同日 A `familyEvidenceForStock=reliable`,B `=missing`(B ∈ missingMainReasonCodes) | A 正常 15(或凭自身正证据 20);**仅 B** `dataMissing:['mainReasonFamily']`;判定必须走显式逐股状态,不用日级 MR |
| T16 | ¬mainlineKnowable ∧ ¬CL 日:涨停归属股 + 未板股 | 涨停股正常 15/20;未板股 E7 → `['closePrice','confirmedMainlineUnknown']`;**断言涨停行未被反向清除** |
| T16b | **Codex 五审反例**:mainlineKnowable ∧ ¬CL,确认主线成分未板股 M + 非成分未板股 N | M 收到 R5b 行 → `dataMissing:['closePrice']`(**绝不判 0**);N 无行 → none 0(非成分排除 8 分,不依赖涨幅) |
| T17 | 总分 incomplete 审计不变量:同一窗口**同时含**≥1 个已确认 15/20 事件与 ≥1 个缺失事件/趋势缺失 | 断言 formalScore=null,且该已确认事件分与 provenance 在 `history.knownPoints` / `history.evidence` 中完整保留、可审计 |

**验收重跑测算预期(非验收承诺,最终以锁定输入与三组 SHA 为准)**:07-08 约 87/90、07-01 约 60/74;两日各出首份合规 v2/v3 正式名次对照表。实现后由 Codex 执行、Claude 复核,不得据测算预期预先宣布 v3 优劣。

## 7. Owner 决策记录(全部完成,无悬决项)

1. **S4 / S5 启用时机——已裁定**(Owner 2026-07-13 口径修正):与 S2 同批实现,按股票/按字段闸,见 §0 与 §2。
2. **reconstructed 计分资格——已终裁**(Owner 2026-07-13):默认只展示/审计,不产生主线 8 分;可靠 15/20 事件不受影响照常累计;升级计分须待 canonicalSource、sourceDay/asOf、防污染与重建可信标准全部定稿后**另开讨论**,不得在 P6 中放开。详见 §2 reconstructed 条目。
