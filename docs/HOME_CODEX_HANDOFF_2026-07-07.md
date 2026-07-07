请先不要直接改代码，先做交接同步和 Git 核对。

今天另一台 Codex 已经完成一批策略页 / L2 / AXTICK 相关改动。你现在要做的是：理解今天的方案、核对代码、同步到 Git，避免后续改偏。

一、正式云端入口

正式域名：

https://dreamerqi.com

策略页：

https://dreamerqi.com/kpl

健康检查：

https://dreamerqi.com/health

云端 IP 124.222.188.68 只作为 SSH 或临时排障使用，不作为前端正式入口。

SSH：

ssh -i 私钥路径 -p 2222 administrator@124.222.188.68

二、今天最终确定的 L2 计算方案

策略页 L2 计算不是云端直接下载计算，也不是家里电脑计算。

真正负责下载 AXTICK HTTP Tran 并计算的是“公司/交易电脑”上的 worker。

公司/交易电脑 worker 目录：

D:\PandaLocalL2Worker

这个目录只在公司/交易电脑上存在。家里 Codex 如果看不到这个目录，是正常的，不代表云端缺文件。

数据流：

用户在 https://dreamerqi.com/kpl 的策略页点击 L2扫描/计算
→ dreamerqi.com 云端服务创建任务
→ 公司/交易电脑上的 D:\PandaLocalL2Worker\worker.js 轮询 dreamerqi.com 并领取任务
→ 公司/交易电脑下载 AXTICK HTTP Tran 逐笔成交并计算
→ worker 把结果回传 dreamerqi.com
→ https://dreamerqi.com/kpl 展示结果

家里电脑只负责 Git 同步和代码维护，除非以后单独配置成新的 worker 节点。

三、公司/交易电脑 worker 内容

目录：

D:\PandaLocalL2Worker

主要文件：

worker.js
start-worker.cmd
start-worker-hidden.vbs
config.json
logs\worker.log
logs\worker.err.log

config.json 里有：
- dreamerqi.com 云端地址
- worker token
- AXTICK HTTP 账号配置

config.json 不能提交到 Git。

四、今天使用的数据接口

只使用 AXTICK HTTP 的 Tran 逐笔成交。

接口：

http://down.l2api.cn:9090/GetData

数据类型：

Tran

不用 QMT。
不用 PTrade。
不用同花顺软件抓屏。
不用同花顺大单棱镜。
不用 TCP 旧接口。

今天已经验证：AXTICK HTTP Tran 可以拿到当日从 09:30 到当前时刻的逐笔成交数据，可用于计算主动买、主动卖、被动买、被动卖。

五、测速结论

今天做过本机和云端测速。

注意这里的“本机”指公司/交易电脑，不是家里电脑。

单股华天科技样本：

公司/交易电脑约 8.74 秒。
云端约 14.32 秒。

同花顺先进封装涨幅前 10 样本：

公司/交易电脑约 25.19 秒。
云端约 35.18 秒。

结论：

公司/交易电脑下载和解析都比云端快。
所以后续板块扫描计算优先用公司/交易电脑 worker。
云端只做网页展示和任务调度。

六、主动 / 被动买卖统计口径

只统计 09:30 后的当日逐笔成交。

四类金额：

主动买：
逐笔成交方向为买，按成交金额累计。

主动卖：
逐笔成交方向为卖，按成交金额累计。

被动买：
主动卖成交里，按 buy_no 挂单号累计。
也就是挂在买盘上的委托最终被主动卖吃掉。

被动卖：
主动买成交里，按 sell_no 挂单号累计。
也就是挂在卖盘上的委托最终被主动买吃掉。

页面展示五个金额档位：

>=50万
>=300万
>=500万
>=800万
>=1000万

七、入选筛选口径

筛选只看 >=50万 档。

三个条件：

1. 主动买 / 主动卖 >= 1.5
2. 被动买 / 被动卖 >= 1.5
3. (主动买 + 被动买) / (主动卖 + 被动卖) >= 1.5

必须至少满足 2 个条件才入选。

注意：

300万、500万、800万、1000万只作为展开明细展示，不影响入选筛选。
筛选固定用 50万档。

八、策略页新增功能

今日策略页面增加了板块搜索。

可以搜索：

东财板块
同花顺板块

搜索出来的板块可以点“计算”。

计算逻辑和重点关注卡片一致：
dreamerqi.com 创建任务，公司/交易电脑 worker 领取任务，下载 AXTICK HTTP Tran，计算主动/被动买卖，回传 dreamerqi.com 展示。

同花顺目录接口加了 cache=1，避免每次搜索都等待实时同花顺板块行情。

九、扫描前排除股票

每个板块进入 L2 计算队列前，统一排除：

688 开头股票
北交所相关 4 / 8 / 9 开头股票

也就是不扫科创板 688 和北交所。

十、页面体验优化

今天修了 L2 扫描时页面不停跳的问题。

原来的问题：
扫描轮询时反复重画整个策略页，导致页面跳动。

现在改成：
只刷新当前板块卡片，不重画整页。

相关前端函数：

refreshSmartPickCard(plateId)

单股展开明细也做了优化：

两列金额档位网格
每档显示主动比、被动比
只展示主动买、被动买、主动卖、被动卖四类金额
展示 50 / 300 / 500 / 800 / 1000 万五档

十一、权限口径，非常重要

L2 管理员只有两个账号：

panda
qi_admin

只有这两个账号可以看到：

L2 阈值
L2扫描按钮
板块搜索计算入口
计算按钮
L2 明细
主动/被动金额
扫描状态

普通用户：

页面上不能出现任何 L2 字样。
不能看到 L2扫描按钮。
不能看到 L2阈值。
不能看到 L2失败、L2无入选、L2扫描中。
不能看到主动/被动金额明细。
不能展开 L2 明细。

如果 panda 或 qi_admin 已经扫描过某个重点关注板块，普通用户只能看到筛选出来的个股：

股票代码
股票名称
“重点关注”标记

普通用户看到的是脱敏结果。

十二、今天主要改动文件

这些文件需要同步进 Git：

kpl-dashboard_17_apple.html
kpl-stats-server.js
strategy-backend.js
local-l2-task-queue.js
tools/axtick_down_benchmark.js
tools/ths_board_top_eastmoney.js
panda-cloud-ops-2026-06-19.md

如果仓库里还没有今天的交接文件，请新建：

HOME_CODEX_HANDOFF_2026-07-07.md

并把这份交接内容放进去。

十三、云端对应文件

云端目录：

C:\PandaDashboard

今天涉及：

C:\PandaDashboard\kpl-dashboard_17_apple.html
C:\PandaDashboard\kpl-stats-server.js
C:\PandaDashboard\strategy-backend.js
C:\PandaDashboard\local-l2-task-queue.js
C:\PandaDashboard\tools\axtick_down_benchmark.js
C:\PandaDashboard\panda-cloud-ops-2026-06-19.md

十四、今天云端备份目录

今天做过这些云端备份：

C:\PandaDashboard\backups\local-l2-worker-20260707-143407
C:\PandaDashboard\backups\strategy-l2-search-exclude-20260707-174500
C:\PandaDashboard\backups\strategy-search-compact-20260707-181500
C:\PandaDashboard\backups\strategy-l2-detail-compact-20260707-155247
C:\PandaDashboard\backups\strategy-l2-admin-public-20260707-163343
C:\PandaDashboard\backups\strategy-search-left-20260707-163857
C:\PandaDashboard\backups\strategy-public-no-l2-20260707-164706

十五、验证方式

接手后先验证，不要先改方案。

本地代码检查：

node --check kpl-stats-server.js
node --check strategy-backend.js
node --check local-l2-task-queue.js

还要检查 kpl-dashboard_17_apple.html 的内联 script 语法，确保 HTML 里的 JS 没有语法错误。

云端检查：

https://dreamerqi.com/health

应该返回：

{"ok":true}

策略 L2 worker 状态接口：

https://dreamerqi.com/api/strategy/focus-l2-scan

应该能看到类似：

mode=local-worker
workerOnline=true

如果 workerOffline：

先确认公司/交易电脑是否开机。
再看公司/交易电脑：

D:\PandaLocalL2Worker\logs\worker.log
D:\PandaLocalL2Worker\logs\worker.err.log

十六、不要提交到 Git 的东西

不要提交：

AXTICK 账号密码
worker token
panda-l2-config.json
panda-local-l2-worker-config.json
D:\PandaLocalL2Worker\config.json
panda-auth-sessions.json
session 文件
大缓存文件
大日志文件
backups 目录
node_modules

建议 .gitignore 至少包含：

panda-l2-config.json
panda-local-l2-worker-config.json
panda-auth-sessions.json
panda-site-sync-manifest-cache.json
*.log
logs/
backups/
node_modules/

十七、你现在应该做什么

1. 先看 Git 仓库当前状态：

git status

2. 确认今天这些文件是否已经在工作区：

kpl-dashboard_17_apple.html
kpl-stats-server.js
strategy-backend.js
local-l2-task-queue.js
tools/axtick_down_benchmark.js
tools/ths_board_top_eastmoney.js
panda-cloud-ops-2026-06-19.md

3. 如果没有 HOME_CODEX_HANDOFF_2026-07-07.md，请用这份交接新建。

4. 检查 .gitignore，确保敏感文件不会提交。

5. 查看 diff，只提交今天的增量，不要提交账号、token、缓存、日志。

6. 做基础验证：

node --check kpl-stats-server.js
node --check strategy-backend.js
node --check local-l2-task-queue.js
HTML 内联脚本解析

7. 能访问云端就再验证：

https://dreamerqi.com/health
https://dreamerqi.com/api/strategy/focus-l2-scan

8. 提交 Git。

commit message 建议：

strategy: add local AXTICK L2 worker flow and public L2 permissions

十八、不要做什么

不要重新设计方案。
不要改回云端直接计算。
不要把家里电脑误认为当前计算 worker。
不要把普通用户改成能看到 L2。
不要把账号密码、token、config 提交到 Git。
不要覆盖云端文件前不备份。
不要忽略 panda-cloud-ops-2026-06-19.md 的交接记录。

十九、最重要的结论

正式入口是 dreamerqi.com。
云端负责页面和任务。
公司/交易电脑 worker 负责 AXTICK HTTP Tran 下载和主被动买卖计算。
panda、qi_admin 可以看 L2 和明细。
普通用户完全不看 L2，只看“重点关注”的股票结果。
Git 只同步代码和交接，不同步账号密码、本机 worker config 和敏感文件。