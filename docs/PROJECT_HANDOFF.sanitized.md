# Panda KPL/东财/同花顺看盘项目交接说明

最后更新：2026-06-23

## 最新云端变更记录

这份文件是项目总交接说明。2026-06-19 之后的云端实操记录、同步规则、涨停复盘来源库、邮箱验证码、SSH/服务配置等，请优先查看同目录：

`C:\PandaDashboard\panda-cloud-ops-2026-06-19.md`

2026-06-23 云端补充修复：

- 行情页账户弹窗已补齐“登录 / 注册 / 忘记密码”流程。
- 注册必须填写手机号、邮箱、密码和邮箱验证码。
- 忘记密码必须通过邮箱验证码重置。
- 公网注册/忘记密码不再把服务器 outbox 当成发送成功；必须真实 SMTP 可用。
- 数据源健康同步完成提示的悬浮明细只显示最近 3 个交易日。

## 项目路径

正式项目目录：

`C:\Users\Qi\Documents\New project`

主页面：

`C:\Users\Qi\Documents\New project\kpl-dashboard_17_apple.html`

本地统计服务：

`C:\Users\Qi\Documents\New project\kpl-stats-server.js`

浏览器访问地址：

`http://127.0.0.1:8765/`

健康检查：

`http://127.0.0.1:8765/health`

## 新账号接手时先做什么

1. 在 Codex 里打开这个目录：

   `C:\Users\Qi\Documents\New project`

2. 启动或重启本地统计服务：

   ```powershell
   $pidToStop = (Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)
   if ($pidToStop) { Stop-Process -Id $pidToStop -Force; Start-Sleep -Milliseconds 800 }
   Start-Process -FilePath "node" -ArgumentList "kpl-stats-server.js" -WorkingDirectory "C:\Users\Qi\Documents\New project" -WindowStyle Hidden
   Start-Sleep -Seconds 2
   Invoke-RestMethod http://127.0.0.1:8765/health
   ```

3. 打开网页：

   `http://127.0.0.1:8765/`

## 重要文件和目录

- `kpl-dashboard_17_apple.html`：正式网页。
- `kpl-dashboard_17_apple_hierarchy.html`：备用同步页面。
- `kpl-stats-server.js`：本地 Node 统计服务。
- `kpl-runtime-config.json`：运行配置，包含 KPL key。不要随便删除。
- `kpl-limitup-db`：每日全市场涨停股底层库。
- `eastmoney-close-db`：每日全市场收盘价库，用于加速 10 日/30 日涨幅。
- `eastmoney-concepts-db`：东财概念和成分股库。
- `ths-concepts-db`：同花顺概念和成分股库。
- `kpl-snapshots`：KPL/东财/同花顺页面快照。
- `kpl-persist-cache`：K 线、涨幅基准、主线统计等持久缓存。
- `kpl-permanent-hidden-boards.json`：永久删除板块记录。
- `favicon.ico`、`qi-nav-xl-*.png`：网页收藏夹和左上角 QI 图标资源。

## 当前数据源规则

### KPL

- 默认页面类型：`zs_type=7`。
- KPL 板块、板块成分、部分个股原因和 K 线仍依赖 KPL 接口。
- 每天 15:30 后自动生成 KPL 快照：

  `kpl-snapshots\7\YYYY-MM-DD.json`

### 东财

- 页面类型：`zs_type=6`。
- 东财概念榜使用东财实时概念榜接口。
- 东财成分股来自东财概念成分股接口。
- 每天 15:00 后同步东财概念库和成分股库：

  `eastmoney-concepts-db`

- 每天 15:30 后生成东财快照：

  `kpl-snapshots\6\YYYY-MM-DD.json`

### 同花顺

- 页面类型：`zs_type=5`。
- 同花顺概念榜使用同花顺自己的 `q.10jqka.com.cn/gn/` 概念数据。
- 同花顺成分股来自同花顺概念详情页分页。
- 每天 15:00 后同步同花顺概念库和成分股库：

  `ths-concepts-db`

- 每天 15:30 后生成同花顺快照：

  `kpl-snapshots\5\YYYY-MM-DD.json`

## 共享底层库

### 每日全市场涨停股库

保存路径：

`kpl-limitup-db\YYYY-MM-DD.json`

用途：

- KPL、东财、同花顺共同用于近 10 日涨停次数统计。
- 每天收盘后保存全市场涨停股，不只保存卡片里的股。

数据源优先级：

1. 东财涨停池
2. 东财收盘涨停扫描
3. KPL 历史涨停
4. KPL 当日涨停兜底

### 每日全市场收盘价库

保存路径：

`eastmoney-close-db\YYYY-MM-DD.json`

用途：

- KPL、东财、同花顺共同优先用于 10 日/30 日涨幅计算。
- 如果本地收盘价库不够，再回退到各自 K 线。
- 保存全市场股票收盘价，不只保存卡片里的股。

## 当前卡片筛选规则

- 页面最多显示 8 个卡片。
- 优先看涨幅榜前 15 个有效板块。
- 板块涨幅必须 `>= -0.5%`。
- 板块涨停家数必须 `>= 2`。
- 如果前 15 个里符合条件的卡片少于 4 个，才继续往后找。
- 往后找时仍要求板块涨幅 `>= -0.5%`。
- 榜单按 20 个一档递增读取：先取前 20，不够再取前 40、60、80……
- 不设置固定 60 上限。
- 如果到后面板块涨幅低于 `-0.5%` 或接口已经没有更多板块，就停止。
- 不强行显示不符合条件的板块。

## 删除板块规则

- 当日删除：刷新网页后当天不再显示。
- 底部“已删除板块”里再次删除：永久删除。
- 永久删除后，不仅页面不显示，也不会再后台计算这个板块详情。

## 主线明星股规则

- 普通明星股当前不显示。
- 主线明星股使用左上角 Panda 文字风格标识。
- 主线明星股只在净流入大于 2 亿的卡片里出现。
- 主线明星股规则曾调整为：近 10 日涨幅排名前 8，并结合近 10 日涨停次数和主线属性。

## 快照规则

- KPL、东财、同花顺都有自己的快照。
- 历史日期优先读取快照。
- 历史日期没有快照时，不再自动请求实时接口。
- 页面“确认快照”会保存当时页面为最终快照。
- 已确认快照受保护，普通自动保存不会覆盖。

## 视觉状态

- 当前是深色、苹果风、玻璃/水滴感卡片。
- 左上角是 QI/Panda 视觉体系。
- 收藏夹 favicon 已使用 QI logo。
- 文档页有独立卡片内容。

## 新账号接手后建议先发给 Codex 的话

见同目录：

`NEW_CODEX_ACCOUNT_PROMPT.txt`
