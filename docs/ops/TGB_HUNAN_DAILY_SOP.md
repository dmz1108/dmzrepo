# TGB 湖南人每日复盘手动入库 SOP

适用场景：Owner 说“按昨天一样做湖南人复盘”“手动更新淘股吧湖南人复盘”“按 TGB 湖南人 SOP 做今天复盘”。

目标：把当天 `@TGB湖南人` 的官方涨停复盘原图，整理成 `review/tgb-hunan-structured` 正式底层来源库，并重折当天综合主因库。

## 固定原则

1. 只用 `@TGB湖南人` 官方原图。
2. 不按图片大小选图；同花顺红色数据可视化图经常更大，但不能作为 TGB 来源。
3. 不使用回帖图、头像、二维码、广告图、同花顺图、其他作者图。
4. 入库内容按湖南人原图原版板块和个股原因保存，不提前优化、不合并、不改写。
5. 炸板、跌停、消息面、广告、二维码不进入 TGB 正式涨停库。
6. 是否保留“市场连板股”等表格块，以当天湖南人原图和总数校验为准；不能机械套旧规则。
7. 写入正式库前必须对账当天非 ST/非北交所/非新股前缀的涨停池，确保无重复、无缺失、无多余。

## 每日步骤

### 1. 确认目标日期

- 使用北京时间当前交易日。
- 如果当日非交易日，不做 TGB 入库。

### 2. 强制刷新 TGB 原文和图片证据

在云端项目目录执行：

```powershell
cd C:\PandaDashboard
node .\kpl-stats-server.js --tgb-vision-sync --day YYYY-MM-DD --days 1 --force
```

如果 Qwen/视觉服务可用且质量闸通过，该命令可能会自动写入正式库。即使自动失败，也会保存 raw evidence。

### 3. 确认文章

raw manifest 中必须满足：

- 文章标题包含 `湖南人涨停复盘`
- 文章链接来自 `https://www.tgb.cn/a/...`
- 日期对应目标交易日

记录文章链接和标题。

### 4. 选择正确图片

正确图片特征：

- 标题类似 `【7.9星期四】湖南人涨停复盘`
- 白底表格样式
- 表格按题材块分组
- 水印是 `@TGB湖南人`
- 每行包含股票代码、名称、封板时间、连板/高度、细分原因

必须排除：

- 红色背景 `同花顺数据可视化` 图
- 头像、小图标、二维码、广告图
- 回帖里的其他复盘图
- 非 `@TGB湖南人` 水印图

### 5. 结构化入库口径

每只股票保存字段：

- `code`: 6 位股票代码
- `name`: 股票名称
- `boardTopic`: 湖南人原图题材块名
- `detailReason`: 该股右侧细分原因原文
- `firstLimitTime`: 原图封板时间
- `limitUpCount`: 原图连板/高度文本

来源字段固定：

- `source`: `review/tgb-hunan-structured`
- `matchType`: `manual-hunan-table`
- `reasonQuality`: `clear`
- `confidence`: `0.99`
- `qualityNote`: `Manual transcription from @TGB湖南人 official table image; source-faithful board block and stock detail reason.`

### 6. 写入前校验

必须校验：

- 正式行数等于当天复盘口径涨停池基准数
- `missingCodes` 为空
- `extraCodes` 为空
- 无重复代码
- `weakCount` 为 0

若不一致，暂停并列出缺失/多余股票，不要强写。

### 7. 写入云端正式文件

目标文件：

```text
C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\YYYY-MM-DD.json
```

写入前如果旧文件存在，先备份到：

```text
C:\PandaDashboard\backups\tgb-hunan-manual-YYYYMMDD-HHmmss\
```

### 8. 重折当天综合主因库

写入 TGB 正式库后，在云端重建当天综合主因库：

```powershell
cd C:\PandaDashboard
node .\kpl-stats-server.js --main-reason-backfill --day YYYY-MM-DD --days 1 --force
```

### 9. 验证

验证公开接口：

```text
https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=YYYY-MM-DD&force=1
```

必须确认：

- TGB/淘股吧来源数量正确
- 综合归纳数量正常
- 复盘页面数据源健康不再把 TGB 显示为缺失

### 10. 记录

必须记录到：

- `docs/DAILY_HANDOFF.md`
- 云端 `C:\PandaDashboard\_cloud-change-log-20260705.md`

记录内容至少包括：

- 日期
- TGB 文章链接
- 使用的图片文件名
- 入库数量
- 校验结果
- 是否重折综合主因库
- 是否重启服务

## 明确禁止

- 禁止把同花顺红色可视化图当 TGB 湖南人图入库。
- 禁止用 OCR 低置信度结果覆盖已确认的正式库。
- 禁止为了让数量一致而伪造个股或主因。
- 禁止把炸板区写入涨停库。
- 禁止只保存 raw evidence 后就声称 TGB 完成。
