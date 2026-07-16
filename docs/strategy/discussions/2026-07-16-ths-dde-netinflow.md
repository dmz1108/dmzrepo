# Discussion: 策略页同花顺资金口径切换为 DDE 大单金额

Status: Converged (Owner 2026-07-16 定稿)
Owner Question: 能否找到同花顺板块 DDE 大单金额,作为策略页同花顺板块的资金净流入?(例:2026-07-16 国资云 APP 显示 DDE 大单金额 11.92亿,而 zjjlr 口径远小)

## Context

- 策略页同花顺侧资金原用 `q.10jqka.com.cn/gn` 的 `zjjlr`(全量资金净流入)。
- Owner 判断 DDE 大单金额(只统计大单的净买入)更贴近主力真实动向;东财侧同日已由 Codex 切换为超大单口径(f66),两源口径就此对齐为「大单/超大单族」。

## Evidence Available

调查与校准(全部只读,Token/cookie 未入 Git):

- 同花顺网页端公开面**无**现成板块级 DDE 字段:现用 gn 列表只有 zjjlr;数据中心 gnzjl 列=流入/流出/净额(全量口径);ddzz 为个股级(合同原有红线)。问财需验证码,不可自动化。
- 发现:`d.10jqka.com.cn/v6/realhead/bk_{885xxx}/defer/last.js` 字段 `527198`,单位元。
- 校准(2026-07-16 收盘,Owner 用 APP「DDE大单金额」逐板对照**确认一致**):
  - 国资云 bk_885977:527198=10.415亿(同日 zjjlr 1.79亿)
  - 智慧政务 bk_885956:527198=20.375亿(同日 zjjlr 0亿)
- 个股同字段族佐证:平安银行 526792=1.937(似大单净量%)、527198=3578.77万(似大单金额),符合官方 DDE 三指标结构(大单净量/散户数量/大单金额)。
- 板块指数代码映射:THS 概念目录 `thsPlateCode`(382 板全覆盖)。

## Shared Decision

Owner 2026-07-16:**只针对策略页的同花顺资金净流入**,切换为 DDE 大单金额(527198)。

边界(合同约束落地):
1. 仅策略口径调用(显式 zsTypes 且不含 KPL)触发;看板/复盘/默认三源不动,zjjlr 在这些页保持原样。
2. 仅当日实时覆盖;历史日拒绝(realhead 是当前值,回填历史=数据穿越)。历史冻结快照不重建。
3. 口径全程可溯:`netInflowMetric='ths-dde-big-order-amount'`,原 zjjlr 留档 `netInflowZjjlr`;DDE 拿不到的板保持 zjjlr 且 metric 如实,绝不冒充。
4. 请求纪律:仅对策略板块池(`getDayBoardsWithMembers` 策略口径调用中的 zsType=5 板与塌板 bySource[5],不止最终 5–8 张卡)按板拉取,90 秒 TTL 缓存 + in-flight 去重 + mapLimit(3) 并发;不拉全 382 板。单请求 4s AbortSignal 截止,整个 overlay 8s 总预算,超时按板回退 zjjlr。

未选方案:
- 自建聚合(Σ成分股个股 DDE):请求量大,且已有原生板块级字段,不需要。
- 问财:验证码墙,不可自动化。
- 直接改 fetchThsConceptBoards/快照文件:会波及看板与历史快照,违反「只针对策略页」。

## Implementation Plan

- `strategyBoardFundFlowForSource` zsType=5 分支:`ddeBigOrderAmount` 优先(metric ths-dde-big-order-amount),未覆盖回退 zjjlr(metric ths-net-inflow)。
- 新增 `fetchThsBoardDdeAmount`(realhead 527198,90s 缓存)+ `thsDdeIndexCodeMap`(目录映射,10min 缓存)+ `strategyApplyThsDdeFundFlow`(覆盖主板 zsType5 + 塌板 bySource[5],今日限定)。
- `getDayBoardsWithMembers` 返回前:策略口径且含 5 时执行覆盖;失败记诊断上下文。

## Validation Plan

- 单测:载荷解析/选择器优先级/覆盖行为(主板+bySource[5]/zjjlr 留档/失败保持/历史拒绝/东财不受影响)+ 接线静态断言。
- 部署后盘中验收(次交易日 14:59 例程):同花顺主线卡 netInflow 应为 DDE 量级(对照 APP),`netInflowMetric` 字段可见;共振/热点辅助指标同源生效;看板 zs5 仍为 zjjlr。
- 回退:恢复部署前 kpl-stats-server.js 并重启主服务。

## Open Questions

- L2 自动扫描门槛(净流入≥5亿)在同花顺侧现按 DDE 口径计——量级普遍大于 zjjlr,达标板会变多;限流(5分钟2个/单任务在飞)不变。观察数日,若派发过密再议门槛。
- 字段族 223/224 等买卖对未解码,未来可补「大单买入/卖出」明细,需单独校准。
