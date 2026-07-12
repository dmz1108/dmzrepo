# AI 分析可用只读数据接口清单

目的:数据类任务**先穷尽已有只读接口取证,再设计方案**。7-08 龙头修复连吃两轮否决的直接原因,就是没有盘点过这份清单——所有被云端核验推翻的臆测,当时都可以用下面的接口在十分钟内自查。

基址:`https://market.dreamerqi.com`(服务器本机可用 `http://127.0.0.1:8765`)

## 公开只读(无需凭据)

| 接口 | 参数 | 内容 | 注意 |
|---|---|---|---|
| `/api/snapshot` | `day=YYYY-MM-DD&zs_type=6\|5\|7` | **当日冻结快照原文**:boards + cardData(每板块 ztList/zt10/gain10/gain30) | 参数名是 `zs_type` 不是 `zsType`(写错返回 400/404);zt10 行含 totalCount(总次数)/ztCount(板内主因次数)/todayGain/days;gain10/gain30 行的 `gain` 是区间涨幅,`todayGain` 才是当日涨幅,语义勿混 |
| `/api/strategy-mainlines` | `day=` | 主线榜(历史日=冻结快照,不重算) | 历史日反映的是**生成当日的代码**,与现行代码可能不一致 |
| `/api/strategy-mainline-review` | `days=1..30` | 预判回看/胜率统计 | |
| `/api/strategy-mainline-confirm` | `day=`(GET) | owner 确认的主线 | 写操作需 admin |
| `/api/strong-board-resonance` | `day=` | 强势板块共振 | 历史日会解析到板块快照日(可能回退前一交易日) |
| `/api/detail-evidence-index` | `day=`、`word=` | 细分证据词索引 | 16:00 后生成当日 |
| `/api/limit-up-main-reason-db/source-view` | `day=` | 复盘四源对照(final tab=综合归纳) | |
| `/api/limit-up-main-reason-db/stock` | `day=&code=` | 单股复盘详情(tier/主因/细分) | |

## 管理员只读(x-admin-token 或登录 cookie)

| 接口 | 内容 |
|---|---|
| `/api/strategy-mainline-leader-debug?day=&codes=` | 龙头池诊断:live 重算(leaderDebug 含完整池人数、完整正式池 originalRank、前30+指定股明细及 resultScope)+ frozenSummary + debugMeta；不把返回切片冒充完整池 |
| `/api/admin/review-source-health` | 复盘源健康度 |
| `/api/admin/cloud-health` | 云端服务健康 |

## 外部公开行情(双源核验用)

- 腾讯 K 线:`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sz000938,day,起,止,60,qfq`(前复权;10/30 日口径=第 n 个交易日前收盘为基准)
- 用于核对 gain10/gain30/涨停次数;与系统收盘库互证,±0.6% 内为复权口径差异。

## 使用规矩

1. 涉及运行时数据的方案,设计前必须先用上述接口取到真实样本;接口取不到的(如服务器文件布局、进程状态)再找 Codex 要。
2. 历史结论(评分、排名)引用前先核对是否被后续讨论推翻。
3. 凭据类端点(若有)只存在于 owner 与 AI 的会话中,**永不写入本仓库任何文件**。
