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

# 代码修复:盘后归属复核 ≠ 盘中主线预测(后续 PR,claude/mainline-attribution-fix)

诊断已三方确认根因①「归属链路不看当日主因库」。**Codex 复审(PR #24)否决了"直接把当日综合主因写进 build"的初版——那会用收盘后才生成的当日答案回写盘中预测/冻结快照,造成数据穿越。** 本版严格分离两条链路。

## 设计:盘中预测 vs 盘后复核

| | 盘中主线预测(默认) | 盘后归属复核(review) |
|---|---|---|
| 触发 | 正式请求 / 写冻结快照 | 仅 `?review=1` 的 admin 诊断端点 |
| 当日综合主因 | **完全不读**(收盘后才有,严禁穿越) | 读,用于把真龙头归回其主因主线 |
| 用到的证据 | ≤ 上一交易日历史主因 + 实时行情 + 板块成分(原有行为) | 当日四源综合主因(多源共识) |
| 写快照 | 是(冻结盘中预测) | **否**,只作对照 |

**冻结的 7-08 盘中预测保留当时已知结果,不重建。** 盘后复核只作为并列对照产出,`reviewAttribution` 明示哪些股被 hard 改判。

## 改动(`kpl-stats-server.js`)

1. `buildStrategyMainlinesLiveImpl` 新增 `options.postCloseReview` 门;**默认不进该分支,盘中预测/冻结快照行为零变化**(修正初版的数据穿越)。
2. `strategyMainlineApplyCurrentReasonAttribution(seedByKey, currentReasonDb, todayLimitCodes)` 只在 review 模式调用:对「当日涨停 + 综合主因有效 + 置信度=hard」的股并入其主因主线,并从**族别不同**的其它 seed 彻底剔除。
3. **置信度门槛**(Codex 第5点)`strategyMainlineReasonAttributionConfidence`:strong/majority 档、或 `agreeCount≥2`、或候选源≥2 且至少一源板块题材与最终题材同族 → `hard`(可跨族改判);孤源/来源不足 → `soft`,只记软证据、**不执行跨族删除**。
4. **彻底剔除**(Codex 第4点)`strategyMainlineDetachCodeFromSeed`:同步清理 `codeSet / realtimeCodeSet / risingCodeSet / nearLimitCodeSet / risingStockMap / nearLimitStockMap` 六集合;**不动 `countFallback`**(二审修正:它按板块 zt/成分数逐板块重复累计,按股减 1 不成立——盘后复核的 count 直接取去重 `todayCodes.length`,见二审段)。错误主线的 `todayCodes/count/bigGainCount/risingStocks/leaders` 不再受该股贡献。
5. `/api/strategy-mainline-leader-debug` 增 `review=1`:额外跑一次 `postCloseReview:true` 重算,返回 `review`(盘后复核)与 `live`(盘中口径)、`frozenSummary`(冻结)三方对照。

家族判定复用生产 `strategyMainlineFamilyInfo`(`group:算力AI` 等),零新造映射、零硬编码指标。星网 7-08 综合主因=算力(候选源含"数据中心"同族,多源 → hard)→ 复核里归回算力AI、移出网络安全;紫光(当日未涨停)由既有近10日龙头池历史补全。

## 验证

- `tests/mainline-attribution.test.js`(重写,36 项):置信度门槛(hard/soft 各档)、六集合+countFallback 彻底剔除、soft 绝不改写 seeds、null/空涨停行为不变——全用生产家族判定复现。
- `tests/leader-debug-endpoint.test.js`(新增场景八,build-level):真实起服务 + fixtures,证明 `live` 仍把星网误记网络安全(盘中口径不回写)、`review` 把星网归回算力AI 且从网络安全的 todayCodes/leaders 剔除、600002 不受污染、`reviewAttribution.hard` 记录改判。
- 既有 leader-pool-debug / inflow-gate / qi-mainline-states / scan-priority / scan-supplement / strategy-evidence-tools / metric-profile / star-l2-layers / predict-records / detail-evidence-index / review-source-health 全绿。

## 二审修正(Codex PR #24 第二轮,两阻断项)

1. **按真实库结构读置信度**:真实 kpl-limitup-main-reason-db 记录顶层无 `candidates`——候选在 `sourceEvidence.candidates`,聚合候选(review-auto-consensus)的真实底层来源在 `candidate.sourceSupport.groups`(星网实测 [jiuyangongshe, tgb],consensusTier/agreeCount 空、confidence=0.975)。旧实现读顶层 `record.candidates` 会把真实星网误判 soft、目标修复失效。修正:嵌套结构优先(导出包展平结构兼容);真实来源 = groups 展开 ∪ 非兜底候选源(kpl-zt-reason / limit-up-db-reason / multi-source-consensus 为兜底回落源,不计入多源门槛,与主因评选 `NON_REVIEW_FALLBACK` 口径一致)。测试夹具全部改为真实嵌套形态。
2. **count 不回退 countFallback**:countFallback 按板块 zt 数/成分数逐板块累计,同一股被多板块/三套来源重复计多次,「按股减 1」不成立——detach 不再动它;盘后复核模式 count 直接取去重后的 `todayCodes.length`,跨族删除清空后 count=0(count=0 且无其它信号的错误主线被过滤器整体移出)。构建级测试:星网被网络安全/数字货币/IPv6 三板块重复携带、数字货币板块 ztCount=3 只由星网撑着 → review 中该主线 todayCodes=[] 且 count=0,600002 不受污染;live 口径两处均原样保留。

## 三审修正(Codex PR #24 第三轮:禁止跨候选拼接来源与题材)

三审反例(云端真实记录):上海石化 2026-06-04 final=碳纤维——多源支持的聚合候选题材是「其他」,碳纤维题材候选全是兜底源;二审实现把「其他候选的多源」+「兜底候选的同族题材」跨候选拼成 hard,错。修正后的置信度规则:

1. **首选 `mainReasonSummary.supportGroups`**(选中候选自身的支持组,随记录落盘,与最终题材天然同一候选):只统计 `REQUIRED_REVIEW_SOURCE_GROUPS` 四个真实复盘源(kaipanla/jiuyangongshe/xuangubao/tgb),去重 ≥2 → hard;该字段存在即权威,不足 2 组即 soft,**不再回退候选**。
2. **仅旧库无该字段时回退候选**:逐候选独立判定,「≥2 真实源」与「题材与最终题材同族」必须**出自同一候选**;候选题材看其自身 boardTopic/primaryRawTopic/primaryTopic(「其他/待定」不算),真实源 = 该候选 sourceSupport.groups ∪ reviewSourceGroup(候选源),同样只认四组。
3. 真实结构回归三例(镜像云端记录构造,evidence bundle sha256 见 handoff):星网锐捷 2026-07-08 → hard;上海石化 2026-06-04 → soft(不得借用「其他」候选的多源);雷曼光电 2026-06-05 → hard(boardTopic=芯片(玻璃基板) 映射偏族,但同一候选 primaryTopic=玻璃基板封装与最终主题一致)。
4. 同时清掉了仍声称「countFallback 减 1」的旧注释与文档段落(该做法二审已废除)。

## 合并后(Codex)

- 部署后可跑 `?day=2026-07-08&review=1` 核验盘后复核对照(星网→算力AI、移出网络安全)。
- **不重建 2026-07-08 冻结盘中预测快照**;如需留档,另存盘后复核结果作对照即可。
- 后续若要让盘中预测本身更准,方向是用「≤上一交易日主因库 + 细分证据索引 + 今日实时行情」增强归属,仍不得使用当日盘后答案。

## 回滚

review 分支纯读、不写快照,默认路径未改;revert 该 commit 即可,无行为回退风险。
