# 2026-07-08 算力AI 龙头问题:诊断先行方案(v3,快照盲补方案已废弃)

状态:待 Codex 审 → 合并部署后 Codex 跑诊断端点 → 三方确认根因 → 代码修复(底库自动计算,零硬编码)→ 重建当日快照
Owner 核定最终龙头:星网锐捷(002396) 第一、紫光股份(000938) 第二。

## 为什么废弃 v2 盲补方案(Codex 云端核验结论,全部采纳)

1. 真实快照路径是 `kpl-snapshots/<zsType>/`,v2 脚本写的 `strategy-data/snapshots/` 是臆测路径;
2. 三套真实快照 cardData 均无长源东谷 → 锚点定位零命中;
3. 紫光已存在于云计算等 cardData 的 zt10/gain10/gain30 —— 并非"完全缺失";
4. 星网已有 totalCount=5,统一口径 gain10=54.05/gain30=25.32 —— 硬编码 54.87/22.97 会写错数,ztCount 与 totalCount 也不可混写;
5. 综合主因库已把星网 7-08 主因归为"算力",但策略 API 仍把它放在网络安全 todayCodes;紫光数据在而未进前三——**问题在主线归属与龙头池评分链路,不在快照数据缺失**。

## 代码侧已核实的三个事实(本 PR 诊断依据)

1. **归属链路不看当日主因库**:涨停股进主线 todayCodes 只走「实时板块 ztList 成分 → 板块名映射题材」+「近30日历史主因(不含当日)」两条路;当日综合主因(星网 7-08=算力)完全不参与归属。
2. **龙头门槛依赖族清单**:入池与 `mainZt10Count≥1` 门槛都要求主因题材 ∈ `canonical(m.theme)+mergedThemes` 族清单;"云计算/光模块"若未并入算力AI 族,紫光即使数据齐全也过不了门槛。
3. **历史日对外展示走冻结快照**("历史日期不再临时重算"):7-08 页面上的长源 101 分是 v2 上线前旧公式的冻结产物。**所以最终修复 = 代码修复 + 重建 7-08 主线快照**,任何只改源数据的方案都不会改变展示。

## 三审修正(Codex 第二次否决后,本次)

Codex 用真实文件/API 指出九点,全部修复:
1. **历史诊断禁实时成分接口**:`getStrategyBoardRealtimeStocks` 新增 `historicalOnly`,历史回放直接返回空(东财/同花顺/KPL 成分都是"当前时刻"数据,且盘中行情无历史存档);catalog 榜同理。历史日只用冻结快照 ztList + 历史库,`debugMeta.historicalOnly=true` 明示 risingStocks 为空属预期。
2. **诊断不写全局状态**:`enrichBoardsWithRisingStocks` 加 `recordState:false`,诊断模式不覆盖 `strategyMainlineSupplementState`;诊断模式也不派发 `strategyMainlineMaybeAutoScan`。
3. **诊断完整等待**:诊断模式下成分抓取(`fullWait`)、龙头池重构均完整 await,不吃 1.2s / rework 超时;`debugMeta.fullWait=true` 声明无半结果。
4. **保留过滤前全量板块**:`allBoardsForTrace` 在 scanChannel 过滤前快照,`boardsWithCode` 用它——未进主通道/补选的原始板块不再漏掉(星网归属常在此)。
5. **trace 股必现**:`codes=` 指定股即使排 pool 30 名外也强制补入明细;完全不在池的记入 `tracedMissing`(空池场景也追踪)。
6. **测试用生产 canonicalTopicName**:确认生产 `canonical('算力AI')='算力'`、云计算/光模块独立,族缺口真实成立(不再用 identity stub 伪造)。
7. **交易日校正**:测试用真实交易日,含 06-29(周一),排除 06-27(周六)。
8. **星网当日一板**:7-08 `lianban=1`(单板),5 是近10日总涨停(在 `zt10Count`),两者不混。
9. **行为测试**:证明历史诊断不访问实时行情、不写全局状态、不因超时返回半结果(见测试 6 组静态+行为断言)。

## 四审修正(三阻断项,本次)

1. **历史成分改走快照还原**:`historicalOnly` 不再一刀切返回空——成分行从当日冻结快照 `cardData.ztList` 还原(快照已记录的当日涨幅保留为 todayGain,未记录不伪造);`zt10/gain10/gain30` 三表的板块携带证据由 `collectSnapshotCardStatsForCode` 在 `debugTrace.snapshotStats` 原值带出(紫光"数据在云计算 cardData 却没进前三"正需要这条证据通道)。
2. **动能采样只读**:`strategyMainlineTrackTrend` 增 record 参数,诊断今天时 `recordTrend=false`——读既有采样算动能(评分口径不失真),但不写 `strategyMainlineTrendSamples`。
3. **诊断不吞错**:`debugErrors` 贯通 enrich/单板成分抓取/catalog/rework/指标充实五个吞错点;`debugMeta.complete` 如实标注,出错时池明细照常输出(诚实的不完整结果),快照文件损坏也入账(缺文件才是正常缺省)。

## 本 PR 交付(只读诊断 + 机制复现,不改任何行为)

1. **admin 只读诊断端点** `GET /api/strategy-mainline-leader-debug?day=2026-07-08&codes=002396,000938`:
   - `live`:当前代码即时重算,含每条主线 `leaderDebug`(族清单 + 龙头池全量打分明细:mainZt10/zt10/gain10/gain30/主因新鲜度/今日在场/门槛判定,空池也暴露族清单)和 `debugTrace`(每只股:哪些板块携带→映射题材、当日综合主因、历史主因、落入了哪些主线 todayCodes、是否在涨停底库);
   - `frozenSummary`:冻结快照的龙头/todayCodes 摘要,与 live 对照即可看出"冻结旧账"与"现行代码缺陷"各占多少;
   - 严格只读:不写预测(writePredict:false)、不派发扫描、不动快照;admin 门控。
2. **机制复现回归**(tests/leader-pool-debug.test.js,18 项):真实 ReworkLeaders + 合成夹具(模拟值,不含真实行情硬编码)复现:归属丢失→池子补全兜底但今日加分全失;归属修复→底库数据自动算出第一龙头;族清单缺口→真龙头彻底进不了池(空池基线诊断);debug 开关不影响线上行为。
3. 删除 v2 盲补脚本。

## Codex 执行步骤(合并部署后)

1. `curl -H "x-admin-token: <token>" "http://127.0.0.1:8765/api/strategy-mainline-leader-debug?day=2026-07-08&codes=002396,000938"`;
2. 看 `debugTrace[002396]`:确认它被哪些板块携带/映射到什么题材、当日主因=算力是否被链路无视 → 归属根因;
3. 看 `live` 中算力AI 的 `leaderDebug`:紫光/星网是否入池、族清单是否含"云计算/光模块/算力"、门槛与各分项 → 龙头池根因;
4. 把两段 JSON 发回讨论,三方确认根因后 Claude 出代码修复(由涨停底库/主因库/收盘价库自动计算,不写死任何指标);
5. 代码修复合并部署后,重建 2026-07-08 主线冻结快照,验证 `?day=2026-07-08` → 星网第一/紫光第二。

## 回滚

本 PR 无行为变更(诊断端点 admin-only 且纯读),直接 revert 即可。
