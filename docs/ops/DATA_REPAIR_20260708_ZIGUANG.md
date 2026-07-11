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

## 五审修正(两阻断项,本次)

1. **breadth 历史隔离 + todayGain 在场信号**:历史快照的 ztList/统计表不是完整板块成分,用它算普涨广度会把 10 只涨停股算成 100% 普涨(≈50 分虚高)——历史诊断 `breadth=null`(广度函数零调用);个股当日在场信号不受影响:三表 todayGain(如紫光 6.8)去重后照常进入 risingStocks/评分。真实结构行为测试双向覆盖。
2. **关键读取失败入账**:新增 `strategyMainlineDiagAwait`,boardPayload/priorReason/history/gainLeaders 四个关键读取在诊断模式下失败必入 debugErrors(gainLeaders 并完整等待,不吃 TOP_GAIN 超时);板块榜失败导致的空板块早退也带 `complete:false` 的 debugMeta,不伪装成"数据未准备"。正式请求路径与原 `.catch(()=>fallback)` 行为完全一致(有对照断言)。

## 六审修正(诊断错误贯穿底层 + 诚实超时,本次)

1. **错误收集下沉到低层读取函数**:新增 `AsyncLocalStorage` 诊断上下文(`strategyMainlineDiagStore`),`readLimitUpDbDay` / `readLimitUpMainReasonDbDay` / 快照读取(`getDayBoardsWithMembers` / `getStrategyBoardSnapshotStocks` / `collectSnapshotCardStatsForCode`)在遭遇 JSON 损坏、权限(EACCES)、网络等非 ENOENT 错误时,**在 throw 之前就把真实错误压进上下文**——即使调用方 `.catch(()=>null)` 吞掉控制流,错误也不再静默;ENOENT 正常缺文件只记 `missing`,不使 complete=false。并发诊断请求各自独立(enterWith 只影响本请求异步链)。
2. **诚实超时,不再静态声明 fullWait:true**:`strategyMainlineWithTimeout` 的兜底触发时把超时事件记入上下文;`debugMeta` 的 `fullWait/partial/complete/timeouts` 全部由真实事件计算(`diagBuildMeta`)。诊断今天时成分抓取仍 fullWait 完整等待;但只要链路任一处发生超时兜底,`fullWait=false / partial=true / complete=false` 如实翻转。
3. **函数级场景测试**(tests/leader-pool-debug.test.js):损坏快照(SyntaxError→readErrors)、历史主因读取失败(注入 EACCES 被 `.catch(()=>null)` 吞仍入账 / ENOENT 只记 missing)、成分抓取超时(timeouts 记录 + fullWait/partial/complete 翻转),均含"无诊断上下文时正式请求行为不变"的对照断言——用真实读取函数与真实 store,注入真实 error/timeout 对象。

## 七审修正(complete 正确性 + 吞错补齐 + run() + 真实 HTTP 端点测试,本次)

1. **complete/partial 正确性**:`complete` 仅当 `ok=true` 且无 readErrors、无 timeouts、无必要缺失(本请求日快照/主因)时才为 true;任一降级则 `partial=true`。修复 Codex 复现的 bug(三套快照全缺时 `live.ok=false` 却 `complete=true`)。
2. **补齐仍被吞的错误/超时**:`getDayBoardsWithMembers` 实时回退空 catch、`getStrategyBoardRealtimeStocks` 空 catch、`hydrateStrategyLiveBoardsForMembers` 内部 Promise.race 超时,均写入诊断上下文并带稳定 label(`board-rank-live` / `board-members-live` / `board-hydrate`)。
3. **run() 取代 enterWith**:`strategyMainlineDiagStore.run()` 严格包住单次 `buildStrategyMainlinesLiveImpl` 执行;并发两个诊断请求 + 诊断后普通请求互不串写(真实 HTTP 并发测试验证)。
4. **真实 HTTP 端点测试**(tests/leader-debug-endpoint.test.js,新增):仓库拷入隔离临时目录 + 临时 `KPL_ADMIN_USERNAME/PASSWORD` 起本地服务 + 真实 admin 登录,覆盖损坏快照 / 必要文件缺失 / 主因损坏 / 主因非 ENOENT(EISDIR)/ 并发隔离 / 诊断后普通请求无残留;无需生产管理员 Token。root 环境 chmod 不产生 EACCES,故 HTTP 层用 EISDIR 走同一"非 ENOENT→readErrors"分支,纯 EACCES 由函数级注入覆盖。

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

---

# 代码修复:当日综合主因权威归属(后续 PR,claude/mainline-attribution-fix)

诊断已三方确认根因①「归属链路不看当日主因库」。本次实施代码修复,零硬编码,由综合主因库自动计算。

## 改动

`kpl-stats-server.js` 新增纯函数 `strategyMainlineApplyCurrentReasonAttribution(seedByKey, currentReasonDb, todayLimitCodes)`,在 `buildStrategyMainlinesLiveImpl` 的历史主因归属之后、板块附着之前调用:

1. **补齐缺席**:读当日综合主因库(`readLimitUpMainReasonDbDay(isoDay)`),对「当日涨停 + 综合主因 `finalBoardTopic` 有效」的股,按 `strategyMainlineTopicKey(theme)` 并入其主因所属主线 seed.codeSet(→ todayCodes)。星网锐捷 7-08 主因=算力 → 进入算力(算力AI 家族)。
2. **权威剔除**:再遍历所有 seed,凡「家族 ≠ 该股综合主因家族」的 seed.codeSet 剔除该股。星网从网络安全/数字货币/IPv6 剔除;同族不同 key 的液冷/云计算 seed 保留(合并时去重)。家族判定复用生产 `strategyMainlineFamilyInfo`(group:算力AI 等),非新造映射。

## 语义边界(与 PR #23 诊断规则一致)

- **只作用于当日综合主因库确有归类的涨停股**;无当日主因者(含盘中当天尚未生成盘后主因,ENOENT)完全走原板块成分归属,**行为不变**。
- 综合主因库是**持久化盘后文件**,历史回放读取它属证据复现,**不涉实时行情**(不违反「历史诊断禁实时接口」)。
- 龙头池评分链路(`strategyMainlineReworkLeaders` / `enrichReviewLeaderMetrics`)**未改**:它本就用近10日综合主因(含当日)自补全池子。修复让星网进入算力AI 的 todayCodes 后,①算力AI 主线得以浮现,②星网 `todayLimit=true` 拿到当日封板/连板分 → 评分第一;紫光(7-06 主因=算力,当日未涨停)由池子历史补全为第二。三方口径一致。

## 验证

- `tests/mainline-attribution.test.js`(新增,17 项):用生产家族判定复现——星网并入算力、移出网络安全/数字货币、保留同族液冷;紫光未涨停不被并入;null/空涨停/无主因均行为不变(不误删)。
- 既有 `leader-pool-debug` / `leader-debug-endpoint` / inflow-gate / qi-mainline-states / scan-priority / scan-supplement / strategy-evidence-tools / metric-profile / star-l2-layers / predict-records 全绿。
- 合并部署后由 Codex 跑 `?day=2026-07-08` 只读诊断端点核验 live 归属,再**重建 2026-07-08 主线冻结快照**(冻结旧账不会自动刷新),使历史页展示星网第一 / 紫光第二。

## 回滚

单一纯函数 + 一处调用,revert 该 commit 即恢复原归属。
