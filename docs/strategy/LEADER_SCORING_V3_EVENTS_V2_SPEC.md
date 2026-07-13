# P6 规格:每日事件档案 v2 完整性收窄 — 状态转换表与测试案例

状态:待 Codex 评审、Owner 拍板。本文档只定义规则,不是实现。
作者:Claude(2026-07-13)。依据:Owner 对 P6 提前实施的确认与四点修正;06-23 / 07-02 两个缺快照日分别导致 07-01 替代验收 0/74、07-08 验收 0/90 的实证。

## 0. 范围与非目标

**范围**:`strategy-daily-events.js` 生成器的行级发射语义(ruleVersion v2)+ `strategy-leader-scoring-v3.js` 评分器日级闸门的对应调整。

**非目标(硬边界)**:
- 不改任何分值:`DAILY_EVENT_POINTS`(20/15/8/0)与趋势系数(10日×1、30日×0.25)一个数字都不动。
- 不改 v2 正式榜的任何取数或计分路径。
- 不启动 PR4。
- 不改写、不重命名、不删除任何冻结快照或污染快照文件;污染隔离一律通过独立 data-quality 清单(Owner 修正 #2)。
- 评分器信任模型不变:收窄发生在**生成器层**(把每行证据状态写得更细),评分器照旧只信显式状态,不新增任何数据源依赖。

## 1. 术语与日级源状态

对交易日 D,定义四个输入条件:

| 符号 | 含义 | 判定 |
|---|---|---|
| LU | 涨停底库可信 | `limitUpComplete`(可靠性 + 收盘后落盘) |
| MR | 主因库覆盖完整 | `mainReasonComplete`(且 missingMainReasonCodes 可枚举) |
| CL | 收盘库完整 | `closeComplete` |
| SNAP | 冻结主线快照**可用** | 快照存在 **且不在 data-quality 污染清单上**。清单命中 = 视同不存在,绝不读取其内容 |

派生:
- `mainlineKnowable = LU ∧ MR ∧ SNAP`(确认主线可判定;现行 sourceComplete 语义 + 污染清单)
- `rowsAuthoritative = LU`(行级证据可作为权威;无 LU 则正负证据全不可信)
- `noneDeterminable = LU ∧ (mainlineKnowable ∨ CL)`(「无事件 0 分」可判定:或 8 分事件已被完整发射,或可用收盘涨幅 ≤5% 排除 8 分)

日级源状态组合:

| 状态 | 条件 | 实例 | v1 现行为 | v2 行为 |
|---|---|---|---|---|
| S1 | LU∧MR∧CL∧SNAP | 06-16~06-22、06-24~07-01、07-03~07-08(除 07-02)、07-09 | 日 complete,正常计分 | **不变**(黄金不变性,见 T1) |
| S2 | LU∧MR∧CL∧¬SNAP | **06-23、07-02** | 顶层 complete=false → 全池全阻断 | 行级判定(见 §2),仅真不可知行阻断 |
| S3 | ¬LU | 尚未出现 | 全日阻断 | **不变**:全日阻断,`dataMissing:['limitUpDbUnreliable']` |
| S4 | LU∧¬MR(缺码可枚举) | 尚未出现(回填各日主因缺码均为空) | 全日阻断 | 已归因行有效;缺主因涨停股行级 `mainReasonFamily`(现有行为);确认主线不可知 → 按 S2 处理 8 分不确定性 |
| S5 | LU∧¬CL∧¬SNAP | 尚未出现 | 全日阻断 | 有板行有效;未板股一律 `noneUndeterminable`(≤5% 排除法失效) |

`reconstructed` 说明:若日后用东财历史资金重建某日确认主线,`postCloseConfirmed.status='reconstructed'`,**计分上视同 ¬mainlineKnowable**(只进展示与审计,不进计分;Owner 修正 #4 的家族级 canonicalSource 裁定落地前,此默认不变)。

## 2. 行级发射规则(生成器,ruleVersion `leader-scoring-v3-events-v2`)

前提 rowsAuthoritative=true(否则不发射个股行,日级标记 S3)。对股票 X、其盘后归属家族 G:

| 行规则 | 条件 | 发射 |
|---|---|---|
| R1 | X 涨停 ∧ 主因归属 G ∧ 当日明星证据体系可用 ∧ X 为 expected/confirmed 明星 | `star-limit-up` 20,status=confirmed,historyEligible=true,starEvidenceStatus=**confirmed** |
| R2a | X 涨停 ∧ 归属 G ∧ 明星体系可用 ∧ X 无明星正证据 | `ordinary-limit-up` 15,starEvidenceStatus=**not-confirmed**(扫过没星,真 15) |
| R2b | X 涨停 ∧ 归属 G ∧ 明星体系当日不存在(< 2026-07-13 回填日) | `ordinary-limit-up` 15,starEvidenceStatus=**unscanned**(下界 15,Owner 已裁定;不得写 not-confirmed) |
| R3 | X 涨停 ∧ 无法归属(缺主因或题材不可映射) | `data-missing`,historyEligible=false,`dataMissing:['mainReasonFamily']`(现有行为不变) |
| R4 | X 未涨停 ∧ mainlineKnowable ∧ X 属确认主线成分 ∧ 收盘涨幅>5% | `confirmed-mainline-big-gain` 8(现有行为不变) |
| R5 | X 未涨停 ∧ ¬mainlineKnowable ∧ CL ∧ 收盘涨幅>5% | **新增显式行**:`data-missing`,historyEligible=false,`dataMissing:['confirmedMainlineUnknown']`,附 closeGainPct。发射范围=当日全部「>5% 且未涨停」股票(有界,typically 数十行) |
| R6 | X 未涨停 ∧ noneDeterminable ∧ 不满足 R5 | 不发射行(缺席即 none 0,由评分器判定) |
| R7 | X 未涨停 ∧ ¬noneDeterminable | 不发射行;日级 `noneDeterminable=false` 由评分器兜底为 dataMissing |

日级新增字段(v2 档案):`stockEvents.rowsAuthoritative`、`stockEvents.noneDeterminable`、`stockEvents.snapshotUsable`(false 时注明 `missing` 或 `quarantined:<data-quality清单条目id>`)。既有字段(complete、coverageComplete、familyCoveragePct、counts、missingReasonCodes)语义不变。

## 3. 评分器状态转换(eventForCode,v2 模式)

按顺序判定,命中即返回:

| # | 条件 | 结果 |
|---|---|---|
| E1 | 无该日档案 | dataMissing `['dailyEventRecord']`(不变) |
| E2 | ruleVersion = v1 | **完全沿用现行 v1 闸**:要求 `record.complete ∧ stockEvents.complete`(向后兼容,07-10 等既有档案行为不变) |
| E3 | ruleVersion = v2 ∧ rowsAuthoritative≠true | dataMissing `['limitUpDbUnreliable']` |
| E4 | X 的行中任一 status=dataMissing 或 historyEligible=false | dataMissing(透传行内原因;不变) |
| E5 | 有同族(G)有效行 | 互斥取最高档(20>15>8>none,不变);duplicateRowsIgnored 照记 |
| E6 | 无同族行 ∧ noneDeterminable=true | event=none,0 分,complete(otherFamilyEvents 照记) |
| E7 | 无同族行 ∧ noneDeterminable≠true | dataMissing `['noneUndeterminable']` |
| E8 | ruleVersion ∉ {v1, v2} | dataMissing `['dailyEventRuleVersion']`(不变) |

`scoreToday` / 资格门(`todayConfirmedFamilyLimitGate`)、趋势锚、互斥、tieBreakers、formalEligibilityBasis:**全部不变**。日级顶层 `complete` 字段含义不变(其他消费方不受影响),v2 模式下评分器不再读它。

## 4. 迁移与再生成

1. RULE_VERSION 升为 `leader-scoring-v3-events-v2`;评分器同时接受 v1(E2 旧闸)与 v2。
2. 事件档案是三库+快照的**派生缓存**,不是原始证据;允许按 v2 对回填期(06-16~07-09)整段再生成,条件:逐份先备份 v1 原件到隔离目录、云端运维日志记录、S1 日再生成结果须通过 T1 黄金不变性校验(行集与 v1 逐行一致,仅 ruleVersion 与新增日级字段不同)。
3. 冻结快照、预测记录、三库:零接触。07-02 的污染快照文件原地不动,由 data-quality 清单标记(Owner 修正 #2),生成器读取快照前先查清单。
4. 07-10 及以后由线上系统自动生成的 v1 档案**不再生成**,按 E2 兼容路径消费;自然切换到 v2 从部署日起。

## 5. 测试案例(实现 PR 必须全部覆盖)

| # | 夹具 | 期望 |
|---|---|---|
| T1 | S1 日(取 06-24 真实形状)v1→v2 再生成 | 事件行逐行一致;v3 对每只股票的分值/状态与 v1 消费结果完全相同(黄金不变性,证明零权重变化) |
| T2 | S2 日 + 当日家族涨停股(黄河旋风 07-02 形状) | ordinary 15,historyEligible=true,窗口计入 15 分 |
| T3 | S2 日 + 未板 ≤5% 股 | 无行;E6 → none 0,complete=true |
| T4 | S2 日 + 未板 +7.29% 股(东方锆业形状) | R5 显式行 → dataMissing `['confirmedMainlineUnknown']`,该股整窗 incomplete |
| T5 | S2 日 + 涨停但主因不可归属 | R3 行 → dataMissing `['mainReasonFamily']`(与 v1 相同) |
| T6 | S5 日(¬CL)+ 有板股 / 未板股 | 有板股 15 正常;未板股 E7 → `noneUndeterminable` |
| T7 | S3 日(¬LU) | 全部股票 E3 → `limitUpDbUnreliable` |
| T8 | 快照文件存在但在 data-quality 清单(07-02 真实形状) | snapshotUsable=false(quarantined),按 S2 处理;生成器全程未读该文件内容 |
| T9a | 明星体系可用日,predict 有 expected 明星 | star 20,starEvidenceStatus=confirmed |
| T9b | 回填日明星体系不存在 | 15,starEvidenceStatus=**unscanned**(不是 not-confirmed) |
| T10 | 既有 v1 档案(07-10 真实形状)喂新评分器 | E2 旧闸行为逐字段不变 |
| T11 | S2 日同股同族双行(15+20) | 互斥取 20,duplicateRowsIgnored=1(互斥在 v2 路径同样成立) |
| T12 | 未知 ruleVersion | E8 → `dailyEventRuleVersion`(不变) |
| T13 | 端到端:07-08 星网形状(07-02 换 v2 档案) | 整窗 complete,formalScore 非空,basis=`confirmed-target-day-family-limit-up` |
| T14 | 端到端:600405 形状(趋势字段缺) | 仍 incomplete(`trend:gain10/gain30`),证明收窄不外溢到趋势层 |

**验收重跑预期**(实现后由 Codex 执行、Claude 复核;不得预先宣布 v3 优劣):
- 07-08 完整池:预期约 87/90 complete(阻断残留:东方锆业型 07-02 >5% 未板、600405 趋势缺、603067 07-06 主因不可归属);
- 07-01 完整池:预期约 60/74(12 只趋势缺 + 06-23 的 R5 型残留);
- 两日各自出首份合规 v2/v3 正式名次对照表,三组 SHA 重新锁定。

## 6. 悬而未决(需 Owner 拍板后才实现)

1. S4/S5 是否与 S2 同批实现,还是先只做 S2(最小改动,两个实证日都是 S2)?Claude 建议:表中全部定义、实现先做 S2+S5(S5 代价极小),S4 等真实出现再启用。
2. 家族级 canonicalSource(Owner 修正 #4)落地后,`reconstructed` 确认主线是否升级为可计分——本规格默认不可,重议时只需改 §1 的 reconstructed 条目。
