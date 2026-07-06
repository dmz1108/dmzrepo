# Panda 云服务器配置记录 - 2026-06-19

## 服务器信息

- 云服务器公网 IP：124.222.188.68
- Windows 登录用户：Administrator / dreamerqi\administrator
- 项目固定路径：C:\PandaDashboard
- 后端入口：C:\PandaDashboard\kpl-stats-server.js
- 服务端口：8765
- SSH 管理端口：443（家里网络访问 22 不稳定，所以增加 443）

## SSH 管理配置

- 已启用 Windows OpenSSH Server，并设置为自动启动。
- 已配置 SSH 监听端口 443，同时保留 22。
- 已添加 Codex 专用无口令公钥到：
  - C:\ProgramData\ssh\administrators_authorized_keys
- Codex 自动化密钥指纹：
  - SHA256:Pv9k7LFdVTAmfT/KtYwEwxUlqV3Hru7WkhEZH14xMx4
- 已验证从家里电脑通过 SSH 443 登录成功：
  - 返回用户：dreamerqi\administrator

## 项目检查结果

- 已确认项目目录存在：C:\PandaDashboard
- 已确认关键文件存在：
  - kpl-stats-server.js
  - kpl-dashboard_17_apple.html
  - panda-admin.html
  - Qi\index.html
  - panda-admin-config.json
  - panda-auth-db.json
  - kpl-runtime-config.json
- 云端 Node 已安装：
  - node v24.16.0
- 已执行后端语法检查：
  - node --check C:\PandaDashboard\kpl-stats-server.js
  - 结果：通过
- 同步配置文件当前尚未生成：
  - panda-sync-config.json 不存在
  - panda-sync-state.json 不存在
  - backups\site-sync 不存在
  - 说明：需要后续在管理员后台保存同步配置后生成。

## 启动配置修改

- 已备份原启动脚本到：
  - C:\PandaDashboard\backups\server-config
- 已新增/更新启动命令：
  - C:\PandaDashboard\run-kpl-stats-server.cmd
- 启动命令设置了：
  - KPL_STATS_HOST=0.0.0.0
  - KPL_STATS_PORT=8765
- 日志输出到：
  - C:\PandaDashboard\logs\panda-server.log
- 已更新：
  - C:\PandaDashboard\start-kpl-stats-server.ps1
  - C:\PandaDashboard\start-kpl-stats-server.bat

## 开机自启动

- 已创建 Windows 计划任务：
  - 名称：Panda Dashboard Server
  - 触发：系统启动时
  - 运行身份：SYSTEM
  - 执行命令：C:\Windows\system32\cmd.exe /d /c "C:\PandaDashboard\run-kpl-stats-server.cmd"
  - 工作目录：C:\PandaDashboard
- 已做任务重启模拟：
  - 停止旧 Node 进程后，计划任务重新拉起新 Node 进程。
  - 新进程监听：0.0.0.0:8765

## 防火墙和访问测试

- Windows 防火墙已有 8765 入站规则：
  - Panda Dashboard 8765
  - TCP 8765
  - Enabled=True
- 云端本机访问测试通过：
  - http://127.0.0.1:8765/admin -> 200
  - http://127.0.0.1:8765/kpl -> 200
  - http://127.0.0.1:8765/ -> 200
- 家里电脑公网访问测试通过：
  - http://124.222.188.68:8765/admin -> 200

## TGB 30日人工结构化录入进度（按6月18日方法）

- 本轮要求：TGB 后续统一按 6月18日方法录入，即只看 TGB 湖南人原图，按红色板块标题作为当日主因板块，按右侧原因列作为个股细分原因。
- 明确不使用 OCR 结果作为正式 TGB 主因数据。
- `市场连板股` 只作为连板摘要，不进入正式涨停主因库。
- `涨停炸板` 不进入涨停主因库。
- 本轮已在本地完成并生成结构化 JSON 的日期：
  - 2026-06-17: 85
  - 2026-06-16: 116
  - 2026-06-15: 144
  - 2026-06-12: 88
  - 2026-06-11: 69
  - 2026-06-10: 70
  - 2026-06-09: 127
  - 2026-06-08: 55
  - 2026-06-05: 71
  - 2026-06-03: 66
  - 2026-06-02: 64
  - 2026-06-01: 118
  - 2026-05-29: 49
  - 2026-05-28: 101
  - 2026-05-27: 47
  - 2026-05-26: 46
  - 2026-05-25: 103
- 2026-06-18 已在此前按同一方法完成并部署到云端结构化源。
- 本轮只完成本地录入和本地 JSON 生成，未上传云端，未回填云端数据库，避免半成品污染云端主因库。
- 本地录入脚本：
  - C:\Users\86139\Documents\website\tools\build-tgb-manual-structured.js
- 本地生成目录：
  - C:\Users\86139\Documents\website\tgb-hunan-manual-structured
- 后续剩余待录入日期：
  - 2026-05-22
  - 2026-05-21
  - 2026-05-20
  - 2026-05-19
  - 2026-05-18
  - 2026-05-15
  - 2026-05-14
  - 2026-05-13
  - 2026-05-12
  - 2026-05-11
  - 2026-05-08
  - 2026-05-07
- 2026-06-04 在 TGB 湖南人最新30篇文章列表中未找到正式图，不用其他来源冒充 TGB。

## TGB 正式保存规则（云端和公司主机统一）

- 以后云端后台和公司主机的 TGB 正式涨停主因数据，都统一按 2026-06-18 的方法保存。
- 正式方法：
  - 只认 TGB 湖南人原图。
  - 红色横向板块标题 = 当日热点主因板块。
  - 右侧原因列 = 个股细分涨停原因。
  - `市场连板股` 只作为摘要，不进入正式涨停主因库。
  - `涨停炸板` 不进入正式涨停主因库。
  - 每日保存前必须校验：
    - 总数等于图上 `涨停X家`。
    - 各板块数量等于红色标题里的 `X只`。
    - 每只股票必须有主因板块和个股细分原因。
- 正式数据源统一使用：
  - `review/tgb-hunan-structured`
- 云端和公司主机都应保存同一份结构化 JSON 数据；公司主机同步时应同步这类 TGB 结构化源文件和回填后的主因库业务数据。
- 旧的 TGB OCR、普通 TGB 文字解析、或其他来源补 TGB 的结果，只能用于问题追踪或参考，不作为 TGB 正式主因库。
- 如果某一天 TGB 湖南人没有正式原图，则当天 TGB 数据标记为缺失，不用同花顺、东财、韭研等来源冒充 TGB。
  - http://124.222.188.68:8765/kpl -> 200

## 同步相关状态

- /api/site-sync/status 返回 403：
  - 说明接口存在并启用了鉴权。
  - 当前还没有配置同步 Token，所以不能匿名访问状态。
- /api/sync/status 返回 404：
  - 说明当前项目有效同步接口应以 site-sync 为主。

## 同步范围调整

- 已调整后台同步范围：
  - 前端网页同步仍同步主页、行情页、管理员后台、图标和静态页面资源。
  - 后台数据库同步仍同步业务后端代码、涨停库、主因库、收盘价库、概念库、快照、账号和业务配置。
  - 后台数据库同步不再同步云服务器专用启动脚本。
- 已从数据库同步清单移除：
  - start-kpl-stats-server.ps1
  - start-kpl-stats-server.bat
- 已新增本机专用文件排除规则，接收对端同步包时也会跳过：
  - run-kpl-stats-server.cmd
  - panda-sync-config.json
  - panda-sync-state.json
  - logs/
  - backups/server-config/
  - backups/site-sync/
  - panda-cloud-ops-YYYY-MM-DD.md
- 已更新管理员后台同步说明文案：
  - 后台数据库不包含云服务器启动、SSH、日志等专用配置。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\sync-scope-change-20260619
- 部署后验证：
  - node --check C:\PandaDashboard\kpl-stats-server.js 通过
  - http://127.0.0.1:8765/admin -> 200
  - http://127.0.0.1:8765/kpl -> 200

## 新增内容自动同步规则

- 已给管理员后台同步功能增加自动发现规则。
- 前端网页同步会自动纳入：
  - 根目录新增的常见前端文件：html、css、js、mjs、图片、svg、ico、字体等。
  - 常见前端资源目录：assets、images、img、pages、public、scripts、static、styles。
  - Qi 目录仍然整体同步。
- 后台数据库同步会自动纳入：
  - 新增业务数据目录：*-db、*-database、*-source / *-sources、*-snapshot / *-snapshots、*-manual-boards、*-cache。
  - 新增业务文件：*-db.json、*-config.json、*-settings.json、*-auth.json、hidden 相关 json、state 相关 json，以及新增后端 js / mjs / cjs / py 脚本。
- 自动发现仍会排除临时文件和服务器专用文件：
  - tmp-*、tmp_*、backup*、bk*、包含 before_ 的旧备份文件。
  - start-kpl-stats-server.ps1、start-kpl-stats-server.bat、run-kpl-stats-server.cmd。
  - panda-sync-config.json、panda-sync-state.json、logs/、backups/server-config/、backups/site-sync/。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\sync-auto-discovery-20260619
- 部署后验证：
  - node --check C:\PandaDashboard\kpl-stats-server.js 通过
  - http://124.222.188.68:8765/admin -> 200
  - http://124.222.188.68:8765/kpl -> 200

## 未改动内容

- 未修改业务数据库内容。
- 未修改 Cookie、API Key、管理员密码。
- 未硬编码任何密钥到 HTML。
- 未执行前端/后台数据库同步。
- 未执行同步回退。

## 后续建议

- 在云端管理员后台配置同步 Token：
  - http://124.222.188.68:8765/admin
- 公司主机也保存同一个同步 Token。
- 先测试“前端网页同步到云端”，再测试“后台数据库同步到云端”。
- 第一次数据库同步前确认备份目录生成，再测试一次“回退上一次”。
- 公司电脑要访问云端时，需要在腾讯轻量服务器防火墙里放行公司公网 IP 到 TCP 8765。
- 如果 8765 对公网开放，务必使用强管理员密码和长随机同步 Token。

## 最终交接待整理

最后一天需要整理一份给公司主机 Codex 的交接版，重点只写公司 Codex 需要知道的内容。

需要告知公司 Codex：
- 云端 SSH 管理改为 443，22 已关闭，临时账号 codexssh 已删除。
- 云端 Panda 服务通过 Windows 计划任务 Panda Dashboard Server 开机自启动。
- 云端网站端口为 8765，当前地址为 http://124.222.188.68:8765。
- 云服务器专用配置不参与后台同步，包括 SSH、防火墙、计划任务、启动脚本、日志、同步 Token、同步回退备份。
- 管理后台同步已分为前端网页和后台数据库，并已增加新增内容自动发现规则。
- 公司主机只需要在后台保存和云端一致的同步 Token，然后按顺序执行前端网页从云端同步回来、后台数据库从云端同步回来。

不需要逐项告知公司 Codex：
- 普通新增页面、栏目、前端逻辑、常规前端资源。
- 常规新增业务数据目录和业务配置。
- 这些内容应通过管理后台同步带到公司主机。

最终交接版不要写真实管理员密码、真实 Cookie 或 API Key。

## 同步密钥

敏感信息，仅给公司主机管理员后台或公司 Codex 使用，不要公开上传。

- 云端同步地址：http://124.222.188.68:8765
- 同步 Token：75xUJ0IH6HQhz5k59VOUBnZHPSgfdv8mK_2mku60v_U

使用方式：
- 云端管理员后台已保存该 Token。
- 公司主机管理员后台也需要保存同一个 Token。
- 两边 Token 完全一致后，才能互相同步。

## 同步配置文件编码修复

- 云端第一次用 PowerShell 写入 panda-sync-config.json 时，文件开头带了 UTF-8 BOM。
- 管理后台读取同步配置时出现浏览器提示：
  - Unexpected token '﻿', "{ ... is not valid JSON
- 已把云端 C:\PandaDashboard\panda-sync-config.json 重写为无 BOM JSON。
- 已验证：
  - 文件首字节为 `{`
  - Token 存在，长度 43
  - http://127.0.0.1:8765/admin -> 200

## 管理后台登录记录增强

- 已给管理员后台“登录记录”增加筛选：
  - 关键词
  - 账号
  - 类型
  - 成功/失败
  - IP
  - 起始日期
  - 结束日期
- 已增加批量清空：
  - 清空选中
  - 清空筛选结果
  - 清空全部
- 后端接口更新：
  - GET /api/auth/admin/login-events 支持筛选参数。
  - DELETE /api/auth/admin/login-events 支持按选中 id 或筛选条件清空。
  - 删除接口仍要求管理员登录。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\admin-login-events-tools-20260619
- 部署后验证：
  - node --check C:\PandaDashboard\kpl-stats-server.js 通过
  - http://124.222.188.68:8765/admin -> 200，并包含 event-filter-q 筛选控件
  - http://124.222.188.68:8765/kpl -> 200

## 管理后台用户搜索

- 已给管理员后台“用户”页增加搜索筛选：
  - 关键词
  - 账号
  - 角色
  - 联系方式（邮箱或手机）
- 后端接口更新：
  - GET /api/auth/admin/users 支持 q、username、role、contact 参数。
  - 返回 total、matched、users，便于页面展示匹配数量。
  - 接口仍要求管理员登录。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\admin-user-search-20260619
- 部署后验证：
  - node --check C:\PandaDashboard\kpl-stats-server.js 通过
  - http://124.222.188.68:8765/admin -> 200，并包含 user-filter-q 搜索控件
  - http://124.222.188.68:8765/kpl -> 200

## 休市日数据处理

- 2026-06-19 是端午节休市日，今天不应生成、统计或同步当天行情业务数据。
- 后端已增加 A 股休市日判断：
  - 今天 /api/after-close-status?day=2026-06-19 返回 isTradingDay=false、marketClosed=true、端午节休市。
  - 涨停库、主因库、收盘价库、东财概念、同花顺概念在休市日状态里全部 skipped=true，计数为 0。
  - 休市日 /api/dashboard-live 返回 skipped=true、boards=0。
- 已阻止休市日写入这些正式业务数据：
  - kpl-limitup-db/YYYY-MM-DD.json
  - eastmoney-close-db/YYYY-MM-DD.json
  - kpl-limitup-main-reason-db/YYYY-MM-DD.json
  - kpl-limitup-main-reason-sources/auto/YYYY-MM-DD.json
  - kpl-snapshots/*/YYYY-MM-DD.json
- 已阻止休市日自动任务写入今天数据：
  - 自动快照
  - 自动收盘价回补
  - 自动东财概念同步
  - 自动同花顺概念同步
- 已阻止休市日打开页面时，为了展示而自动抓取/写入今天概念成分股。
- 云端已经发现并隔离此前生成的 2026-06-19 当天数据文件，没有删除：
  - C:\PandaDashboard\backups\holiday-non-trading-status-20260619\moved-2026-06-19-data
- 隔离后验证：
  - 正式库目录里没有 2026-06-19.json。
  - /api/after-close-status?day=2026-06-19 返回所有业务源 count=0。
  - /api/dashboard-live?day=2026-06-19&zs_type=7 返回 boards=0、skipped=true。

## TGB 昨日复盘说明

- 页面“昨日”里的 TGB 复盘属于 2026-06-18 交易日，不属于 2026-06-19。
- 云端文件时间：
  - TGB OCR 缓存目录：C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-ocr-cache\2026-06-18，写入时间约 2026-06-19 08:31。
  - 自动复盘源文件：C:\PandaDashboard\kpl-limitup-main-reason-sources\auto\2026-06-18.json，写入时间约 2026-06-19 09:20。
  - 主因库文件：C:\PandaDashboard\kpl-limitup-main-reason-db\2026-06-18.json，写入时间约 2026-06-19 09:20。
- 原因：TGB 图片里实际包含 2026-06-18 当天 91 只涨停股代码，但 OCR 中文主因识别质量较差，旧解析逻辑要求能读到清楚的题材/原因文字，导致只纳入了 6 只股票。
- 已修复后端 TGB OCR 解析逻辑：
  - 先按 2026-06-18 涨停池里的 6 位股票代码做匹配。
  - 只要 OCR 行里命中当天涨停股代码，就作为 TGB 候选证据纳入主因库。
  - 如果 OCR 没读清中文原因，则用该股票已有涨停原因/主因作为低置信度兜底说明。
  - 这批 TGB OCR 证据只作为候选来源补全覆盖，不覆盖同花顺、韭研等更清楚来源选出的主因。
- 已补写 2026-06-18 数据：
  - review/tgb-hunan-ocr 覆盖 91 只。
  - review/tgb-hunan 原始文字来源仍保留，覆盖 6 只。
  - 2026-06-18 主因库总股票数 91 只，复盘覆盖率 100%。
- 页面统计文案已从“X条”调整为“覆盖X只”，同一来源多条记录不会重复相加，避免 TGB OCR 和 TGB 原始文字来源重复计数。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\tgb-coverage-repair-20260619
- 部署后验证：
  - /api/limit-up-main-reason-db/day?day=2026-06-18 返回 count=91、sourceCoverage.reviewCoveragePct=100。
  - TGB 来源里 review/tgb-hunan-ocr 返回 rowCount=91、stockCount=91、coveragePct=100。
  - /api/after-close-status?day=2026-06-19 仍返回休市、全部业务源 count=0，休市日逻辑未被破坏。

## 近 10 个交易日主因库覆盖检查

- 检查范围：云端正式库最近 10 个有主因库文件的交易日，不含 2026-06-19 休市日。
- 结论：整体复盘覆盖率较高，但不能说“各来源都完整”。TGB、同花顺、韭研单独看都没有每天覆盖全部涨停股。

| 日期 | 涨停数 | 综合复盘覆盖 | TGB 覆盖 | 同花顺覆盖 | 韭研覆盖 |
|---|---:|---:|---:|---:|---:|
| 2026-06-18 | 91 | 91/91，100% | 91/91 | 75/91 | 82/91 |
| 2026-06-17 | 86 | 85/86，98.84% | 81/86 | 74/86 | 74/86 |
| 2026-06-16 | 117 | 114/117，97.44% | 102/117 | 105/117 | 105/117 |
| 2026-06-15 | 144 | 142/144，98.61% | 123/144 | 131/144 | 129/144 |
| 2026-06-12 | 89 | 88/89，98.88% | 72/89 | 77/89 | 73/89 |
| 2026-06-11 | 69 | 69/69，100% | 55/69 | 64/69 | 57/69 |
| 2026-06-10 | 71 | 71/71，100% | 62/71 | 63/71 | 60/71 |
| 2026-06-09 | 129 | 125/129，96.90% | 115/129 | 114/129 | 108/129 |
| 2026-06-08 | 57 | 56/57，98.25% | 44/57 | 43/57 | 43/57 |
| 2026-06-05 | 73 | 71/73，97.26% | 63/73 | 58/73 | 59/73 |

- 说明：
  - “综合复盘覆盖”表示至少有一个复盘来源或候选复盘证据覆盖该股票。
  - “TGB/同花顺/韭研覆盖”是单独来源覆盖，不等于最终主因是否为空。
  - 2026-06-18 已经用新的 TGB OCR 股票代码匹配逻辑补到 TGB 覆盖 91/91。
  - 近 10 个交易日里，除 2026-06-18 外，其余日期还没有按新规则批量回补 TGB 历史数据。

## 主因库专项优化分析

- 已单独整理主因库优化分析文件：
  - C:\Users\86139\Documents\website\panda-main-reason-optimization-2026-06-19.md
- 核心结论：
  - 主因库应拆成“最终主因”和“全量证据”两层。
  - 页面统计应区分股票覆盖、主因覆盖、强证据覆盖、低置信度覆盖。
  - TGB OCR 的代码命中不应等同于 TGB 主因完整。
  - 后台需要新增主因库质量页，显示缺失、冲突、低置信度和待人工复核股票。
  - 下一步优先做质量诊断接口、每日全量证据文件、主因库质量视图，再批量回补近 10 日历史数据。

## 主因库质量诊断、证据文件和近 10 日回补

- 已升级主因库规则版本：
  - 新写入版本：multi-source-main-reason-v5
  - 保留兼容：multi-source-main-reason-v4
- 已新增每日全量证据目录：
  - C:\PandaDashboard\kpl-limitup-main-reason-evidence
- 已新增每日质量诊断目录：
  - C:\PandaDashboard\kpl-limitup-main-reason-quality
- 已新增接口：
  - GET /api/limit-up-main-reason-db/quality?day=YYYY-MM-DD
  - GET /api/limit-up-main-reason-db/evidence?day=YYYY-MM-DD
  - GET /api/limit-up-main-reason-db/evidence?day=YYYY-MM-DD&code=600851
- 已新增云端命令行回补入口：
  - node .\kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=10
- 已纳入后台数据库同步范围：
  - kpl-limitup-main-reason-evidence
  - kpl-limitup-main-reason-quality

### TGB OCR 新口径

- 已按用户标注的 TGB 图片结构调整：
  - 横向红框：当日涨停主因板块，例如“医疗医药”。
  - 右侧竖向红框：单一个股细分原因，例如“创新药”“医用敷料”“中药”。
  - 单一个股主因应按“板块主因 / 个股细分主因”综合，例如“医疗医药 / 创新药”。
- 已给 TGB OCR 证据增加字段：
  - boardTopic：横向板块
  - detailReason：右侧个股细分原因
  - matchType：structured-row / code-with-board / code
  - reasonQuality：clear / weak / fallback
  - qualityNote：为什么高置信或低置信
- 已增加 OCR 乱码过滤，避免把类似 @tJäE5 的乱码当作题材。

### 为什么 TGB OCR 有低置信度

- 高置信度：OCR 同时识别到横向板块、股票代码、右侧个股原因。
- 中等置信度：OCR 命中股票代码，并能结合板块或右侧文字，但未通过完整结构化校验。
- 低置信度：OCR 只证明这只股票出现在 TGB 图片里，中文主因或右侧细分原因没读清，只能用涨停底库原因兜底。
- 低置信度不代表股票不存在，也不代表主因一定错，只代表“TGB 这一路证据没有清晰解释主因”。

### 近 10 个交易日回补结果

- 已强制回补 2026-06-05 到 2026-06-18 的最近 10 个交易日。
- 回补后每个交易日均生成：
  - 主因库文件：kpl-limitup-main-reason-db/YYYY-MM-DD.json
  - 自动复盘源文件：kpl-limitup-main-reason-sources/auto/YYYY-MM-DD.json
  - 全量证据文件：kpl-limitup-main-reason-evidence/YYYY-MM-DD.json
  - 质量诊断文件：kpl-limitup-main-reason-quality/YYYY-MM-DD.json
- 2026-06-18 验证结果：
  - 主因库总数：91
  - 外部复盘股票覆盖：100%
  - 外部复盘可解析主因覆盖：96.7%
  - 需要复核低置信度主因：3 只
  - 有低置信度辅助证据：91 只
  - TGB OCR 股票覆盖：91/91
  - TGB OCR 可解析主因覆盖：0/91
  - TGB 文字来源可解析主因覆盖：6/91
- 说明：
  - 2026-06-18 的 TGB OCR 能覆盖 91 只股票，但 OCR 没有清晰读出横向板块和右侧细分原因，所以被标记为低置信度辅助证据。
  - 最终主因仍综合同花顺、韭研、KPL 和涨停底库，不会因为 TGB 低置信度代码命中而强行覆盖高质量来源。

### 备份和验证

- 云端部署前备份目录：
  - C:\PandaDashboard\backups\main-reason-quality-evidence-20260619
- 回补日志：
  - C:\PandaDashboard\logs\main-reason-backfill-20260619.json
- 验证：
  - node --check C:\PandaDashboard\kpl-stats-server.js 通过
  - http://124.222.188.68:8765/admin -> 200
  - http://124.222.188.68:8765/kpl -> 200
  - /api/limit-up-main-reason-db/quality?day=2026-06-18 -> ok=true
  - /api/limit-up-main-reason-db/evidence?day=2026-06-18&code=600851 -> ok=true
  - /api/after-close-status?day=2026-06-19 仍返回端午节休市、业务源 count=0

## 东财涨停池合并进主因证据

- 已确认东财 `getTopicZTPool` 涨停池本身已经作为每日涨停底库来源使用。
- 2026-06-18 东财涨停池字段检查：
  - 涨停股 91 只。
  - `hybk` 板块/行业字段覆盖 91/91。
  - `gn` 个股细分原因字段覆盖 0/91。
- 已把东财涨停池加入主因库自动证据源：
  - source: `eastmoney/topic-zt-pool`
  - group: `eastmoney`
  - `boardTopic`: 使用东财 `hybk`。
  - `detailReason`: 使用东财 `gn`，为空时保持空白。
  - `reasonQuality`: 有 `gn` 时为 `clear`，只有 `hybk` 时为 `weak`。
  - `matchType`: `board-detail` 或 `board`。
- 已统一证据字段格式：
  - TGB OCR、同花顺涨停聚焦、东财涨停池、文本复盘来源都尽量输出 `boardTopic/detailReason`。
  - 只有板块、没有个股细分原因的来源不会伪造成完整主因。
- 已升级主因库规则版本：
  - 新写入版本：`multi-source-main-reason-v6`
  - 兼容旧版本：`multi-source-main-reason-v4`、`multi-source-main-reason-v5`
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\main-reason-eastmoney-evidence-20260619
- 已强制重建近 10 个交易日：
  - node .\kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=10
  - 日志：C:\PandaDashboard\logs\main-reason-eastmoney-backfill-20260619.log
- 2026-06-18 验证结果：
  - /api/limit-up-main-reason-db/quality?day=2026-06-18 -> `ruleVersion=multi-source-main-reason-v6`
  - 东财来源覆盖 91/91，主因证据覆盖 91/91，强证据 0，低置信 0。
  - 东财质量计数：`clear=0`、`weak=91`、`fallback=0`。
  - 海欣股份单股证据中已有东财：`boardTopic=化学制药`、`detailReason=` 空、`reasonQuality=weak`。
  - /api/after-close-status?day=2026-06-19 仍保持休市逻辑，业务源 count=0。

## 主因库 v7：最终原因结构化和质量诊断细分

- 已继续升级主因库规则版本：
  - 新写入版本：`multi-source-main-reason-v7`
  - 兼容旧版本：`multi-source-main-reason-v4`、`multi-source-main-reason-v5`、`multi-source-main-reason-v6`
- 已给最终主因结果新增字段：
  - `finalBoardTopic`：最终归纳出的当日热点/板块。
  - `finalDetailReason`：最终归纳出的个股细分涨停原因。
  - `finalReason`：用于展示的最终原因文本。
  - `mainReasonSummary`：最终板块、细分原因、支持来源、证据层级。
- 已给质量诊断新增指标：
  - `clearMainReasonCoveragePct`：清晰主因覆盖率。
  - `boardEvidenceCoveragePct`：板块证据覆盖率。
  - `detailReasonCoveragePct`：个股细分原因覆盖率。
  - `boardOnlyEvidenceCount`：只有板块证据、没有个股细分原因的股票数。
  - 来源级新增 `detailReasonStockCount`、`boardOnlyStockCount`。
- 已调整冲突统计口径：
  - 只有 `reasonQuality=clear` 的清晰主因之间发生矛盾，才计入 `conflictCount`。
  - 东财这类只有行业/板块的弱证据不再制造大量假冲突。
- 云端部署前备份目录：
  - C:\PandaDashboard\backups\main-reason-summary-v7-20260619
- 已强制重建近 10 个交易日：
  - node .\kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=10
  - 日志：C:\PandaDashboard\logs\main-reason-summary-v7-backfill-20260619.log
- 2026-06-18 验证结果：
  - `total=91`
  - `reviewCoveragePct=100`
  - `clearMainReasonCoveragePct=96.7`
  - `boardEvidenceCoveragePct=100`
  - `detailReasonCoveragePct=82.42`
  - `boardOnlyEvidenceCount=16`
  - `strongEvidencePct=76.92`
  - `conflictCount=43`
- 单股验证：
  - 海欣股份 `finalBoardTopic=医疗医药`
  - 海欣股份 `finalDetailReason` 已能从多来源证据里归纳出个股细分原因。
- 页面和休市逻辑验证：
  - http://124.222.188.68:8765/admin -> 200
  - http://124.222.188.68:8765/kpl -> 200
  - /api/after-close-status?day=2026-06-19 仍返回休市，业务源 count=0。

## TGB 6月18日结构化修正

- 已确认此前后台 TGB 数据不合格：
  - `review/tgb-hunan-ocr` 只有股票代码命中和兜底，不应作为正式 TGB 主因统计。
  - `review/tgb-hunan` 文字解析把“逻辑、日内分歧点、板”等栏目词误当成主因板块。
- 已按 TGB 原图重新整理 6月18日：
  - 红色板块标题 = 当日主因板块。
  - 右侧原因列 = 个股细分涨停原因。
  - `市场连板股` 只作为连板摘要，不作为主因板块。
  - `涨停炸板` 单独观察，不进入涨停主因库。
- 本地校正表：
  - C:\Users\86139\Documents\website\tgb-2026-06-18-corrected-from-image.md
- 本地结构化源：
  - C:\Users\86139\Documents\website\tgb-2026-06-18-structured-source.json
- 云端结构化源：
  - C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-06-18.json
- 已新增后端来源：
  - source: `review/tgb-hunan-structured`
  - 规则版本：`multi-source-main-reason-v8`
  - matchType: `manual-structured-image`
  - reasonQuality: `clear`
- 已修正人工录入的两个代码：
  - 中稀有色：`600259`
  - 抚顺特钢：`600399`
- 云端备份：
  - C:\PandaDashboard\backups\tgb-structured-v8-20260619
- 回补日志：
  - C:\PandaDashboard\logs\tgb-structured-v8-backfill-20260619.log
- 6月18日 TGB 结构化源验证：
  - stockCount=91
  - mainReasonStockCount=91
  - strongStockCount=91
  - detailReasonStockCount=91
  - qualityCounts.clear=91
  - qualityCounts.weak=0
  - qualityCounts.fallback=0
- 单股验证：
  - 九安医疗：`boardTopic=医疗医药`，`detailReason=投资大模型+月之暗面`
- 页面验证：
  - http://124.222.188.68:8765/admin -> 200

## TGB v9：取消“优先级”说法，结构化源作为唯一正式 TGB 数据

- 用户纠正：TGB 原图结构化结果不应称为“优先级高于 OCR/文字解析”，而应是按原图 100% 匹配的正式 TGB 数据。
- 已调整后端逻辑：
  - 只要当天存在 `review/tgb-hunan-structured`，正式证据采集就跳过：
    - `review/tgb-hunan-ocr`
    - `review/tgb`
    - `review/tgb-hunan`
  - OCR 和旧文字解析只作为缓存/问题追溯，不再参与正式 TGB 主因统计。
  - 已移除 `review/tgb-hunan-structured` 的特殊权重/特殊优先级代码。
- 已升级规则版本：
  - 新写入版本：`multi-source-main-reason-v9`
  - 兼容旧版本：`multi-source-main-reason-v4` 到 `multi-source-main-reason-v8`
- 云端备份：
  - C:\PandaDashboard\backups\tgb-structured-v9-official-only-20260619
- 回补日志：
  - C:\PandaDashboard\logs\tgb-structured-v9-backfill-20260619.log
- 6月18日验证：
  - 正式 TGB 来源只剩 `review/tgb-hunan-structured`
  - stockCount=91
  - mainReasonStockCount=91
  - strongStockCount=91
  - detailReasonStockCount=91
  - clear=91，weak=0，fallback=0
- 单股验证：
  - 海欣股份：`boardTopic=医疗医药`，`detailReason=创新药`
- 页面验证：
  - http://124.222.188.68:8765/admin -> 200

## 2026-06-20 云端涨停复盘分来源视图

- 用户要求：
  - 涨停复盘页面要能按来源细分查看涨停主因库。
  - 类目包括：综合归纳、TGB、东财、同花顺、韭研。
  - 单个来源内要显示两个核心维度：
    - 当日主因板块。
    - 个股细分涨停原因。
  - 最终仍保留多来源一起整合归纳的综合主因系统。
- 本次修改的是云端正式项目：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端回退备份：
  - `C:\PandaDashboard\backups\source-view-tabs-20260620-010824`
- 后端新增接口：
  - `/api/limit-up-main-reason-db/source-view?day=YYYY-MM-DD`
  - 返回标签：
    - `final`：综合归纳
    - `tgb`：TGB
    - `eastmoney`：东财
    - `ths`：同花顺
    - `jiuyangongshe`：韭研
- TGB 规则：
  - TGB 标签只使用 `review/tgb-hunan-structured`。
  - 不把 `review/tgb-hunan-ocr`、`review/tgb`、`review/tgb-hunan` 混入正式 TGB 类目。
- 前端页面改动：
  - 涨停复盘页面增加来源切换栏。
  - 表格列调整为：股票、主因板块、个股细分原因、来源、置信/时间。
  - 搜索范围扩展到股票、代码、主因板块、细分原因、综合原因、来源。
- 云端验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
  - `http://124.222.188.68:8765/kpl-dashboard_17_apple.html` 已包含：
    - `/api/limit-up-main-reason-db/source-view`
    - `review-source-tabs`
    - `个股细分原因`
  - 2026-06-18 新接口验证：
    - 综合归纳：91
    - TGB：91
    - 东财：91
    - 同花顺：75
    - 韭研：82
    - TGB 来源唯一值：`review/tgb-hunan-structured`
    - TGB 前五板块：半导体 14、机器人 13、PCB 10、光通信 7、医疗医药 7
- 启动注意：
  - 不要通过 SSH 临时 `Start-Process` 方式长期启动网站，SSH 会话结束后进程可能退出。
  - 正确启动方式：
    - 计划任务：`\Panda Dashboard Server`
    - 命令：`Start-ScheduledTask -TaskName 'Panda Dashboard Server'`
  - 当前云端服务由该计划任务启动，监听 `0.0.0.0:8765`。

## 2026-06-20 云端 TGB 近 30 日结构化源补库

- 目的：
  - 让涨停复盘页面的 TGB 类目能查看已整理的近 30 日左右 TGB 涨停主因统计。
  - TGB 类目必须来自正式结构化文件，不依赖 OCR，不混入旧 TGB 文本解析。
- 已上传到云端的 TGB 结构化源：
  - 目录：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured`
  - 日期数量：18 个日期
  - 日期范围：`2026-05-25` 到 `2026-06-18`
  - 缺口说明：`2026-06-04` 当前没有 TGB 结构化源，因此 TGB 标签显示为空。
- 已做云端回退备份：
  - `C:\PandaDashboard\backups\tgb-structured-30day-source-backfill-20260620`
- 已执行云端批量回补：
  - 命令：`node C:\PandaDashboard\kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=19`
  - 结果：扫描 19 个交易日，重建 19 个交易日，退出码 0。
- 额外修正：
  - `/api/limit-up-main-reason-db/source-view` 的 TGB 标签现在直接读取 `tgb-hunan-structured`。
  - 即使某天东财涨停底库不完整，TGB 标签仍能完整显示 TGB 官方结构化数据。
  - 例：`2026-05-25` 云端综合涨停底库只有 6 条，但 TGB 标签能显示结构化源 103 条。
- 云端验证：
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
  - `2026-05-25`：TGB 103 条，来源唯一 `review/tgb-hunan-structured`。
  - `2026-06-04`：TGB 0 条，因为没有结构化源。
  - `2026-06-09`：TGB 127 条，来源唯一 `review/tgb-hunan-structured`。
  - `2026-06-18`：TGB 91 条，来源唯一 `review/tgb-hunan-structured`。
- 各日期 TGB 条数：
  - `2026-05-25`：103
  - `2026-05-26`：46
  - `2026-05-27`：47
  - `2026-05-28`：101
  - `2026-05-29`：49
  - `2026-06-01`：118
  - `2026-06-02`：64
  - `2026-06-03`：66
  - `2026-06-05`：71
  - `2026-06-08`：55
  - `2026-06-09`：127
  - `2026-06-10`：70
  - `2026-06-11`：69
  - `2026-06-12`：88
  - `2026-06-15`：144
  - `2026-06-16`：116
  - `2026-06-17`：85
  - `2026-06-18`：91

## 2026-06-20 云端 TGB 湖南人复盘关闭 OCR，并接入原文/原图自动收集
- 用户明确要求：
  - TGB 湖南人复盘以后不再用 OCR 收集数据。
  - TGB 正式数据一律按 2026-06-18 的方式：原图横向板块标题 + 个股右侧细分原因，写入 `review/tgb-hunan-structured`。
  - 不需要“待确认区”；用户会在涨停复盘页面点 TGB 类目抽查准确性。
- 已修改云端后端：
  - 文件：`C:\PandaDashboard\kpl-stats-server.js`
  - TGB 正式来源只保留 `review/tgb-hunan-structured`。
  - 已移除正式自动归纳中的 `review/tgb-hunan-ocr`、`review/tgb`、`review/tgb-hunan`。
  - `fetchTgbHunanOcrRows` 已改为直接跳过，不再执行图片 OCR。
- 新增云端原始证据目录：
  - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw`
  - 只保存 TGB 湖南人文章 HTML 和原始图片。
  - 不生成候选行，不写入正式 TGB 主因库。
- 新增接口：
  - `GET /api/limit-up-main-reason-db/tgb-hunan/status?day=YYYY-MM-DD`
  - `POST /api/limit-up-main-reason-db/tgb-hunan/sync?day=YYYY-MM-DD&force=1`
- 已接入管理员看板“数据库健康源”的主因库同步：
  - 管理员登录后，在涨停复盘/数据库健康源里点主因库同步时，会同步触发 TGB 湖南人原文/原图收集。
  - 但正式 TGB 类目仍只读取 `review/tgb-hunan-structured`，不会用 OCR 或普通文本兜底。
- 已接入云端自动任务：
  - 云端服务上午自动尝试收集前一个中国交易日的 TGB 湖南人原文/原图。
  - 日期按交易日处理，会跳过周末和中国法定节假日。
  - 如果交易日列表接口不可用，会向前回看最多 30 天，找到最近一个中国交易日。
  - 家里电脑不开机时，云服务器也会自己尝试抓取原始证据。
  - 是否进入正式 TGB 库，仍取决于是否已有按 2026-06-18 方法整理好的结构化文件。
- 已接入清理规则：
  - `tgb-hunan-raw` 原文/原图证据会按现有保留天数清理，不会无限堆积。
- 云端备份：
  - `C:\PandaDashboard\backups\tgb-no-ocr-raw-evidence-20260620-014015`
  - `C:\PandaDashboard\backups\tgb-sync-button-raw-evidence-20260620-014200`
- 云端验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - `http://127.0.0.1:8765/health` 返回 `{"ok":true}`。
  - 2026-06-18 TGB 状态：
    - 正式结构化库存在：91 条。
    - `ocrDisabled=true`。
    - 原文/原图证据已保存：1 篇文章、20 张图片。
  - 维护命令验证：
    - `node C:\PandaDashboard\kpl-stats-server.js --tgb-hunan-raw-evidence --day=2026-06-18 --days=1 --force`

## 2026-06-20 云端韭研公社 2026-06-18 非 OCR 主因采集修正
- 用户明确要求：
  - 韭研的数据收集也不使用 OCR。
  - 按 TGB 当前规则同样拆成两个维度：当日热点/主因板块 + 个股细分涨停原因。
- 本次修改的是云端正式后端：
  - `C:\PandaDashboard\kpl-stats-server.js`
- 云端回退备份：
  - `C:\PandaDashboard\backups\jyg-official-detail-20260620-020340`
- 采集方式：
  - 使用韭研公社异动接口的结构化字段。
  - 板块来自韭研 action field。
  - 个股细分原因来自韭研个股异动解析正文的第一行。
  - 不使用 OCR，不识别图片。
- 后端字段修正：
  - `boardTopic`：韭研板块。
  - `detailReason`：个股细分涨停原因。
  - `detailText`：韭研个股解析完整正文，用于以后排查证据。
  - `reasonText`：现在写成 `板块: 股票名 - 个股细分原因`。
- 已执行云端回补：
  - `node C:\PandaDashboard\kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=1`
- 2026-06-18 验证结果：
  - 当日总涨停：91。
  - 韭研来源入库：82。
  - 韭研个股细分原因覆盖：82/82。
  - 韭研板块数：15。
  - 示例：
    - `600851 海欣股份`：医疗医药 / 创新药+直肠癌疫苗+细胞免疫治疗+参股券商+玩具。
    - `688485 九州一轨`：光通信 / 光纤+拟收购半导体+钢弹簧浮置道床减振系统减振降噪。
    - `002432 九安医疗`：AI应用 / 投资大模型+月之暗面+医疗器械。
    - `002747 埃斯顿`：机器人 / 人形机器人+工业机器人+机器视觉+中游重负载机器人。
- 本机生成的检查表：
  - `C:\Users\86139\Documents\website\jiuyangongshe-2026-06-18-source-table-after-fix.md`
  - `C:\Users\86139\Documents\website\jiuyangongshe-2026-06-18-source-table-after-fix.json`
- 云端验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 云端 8765 服务已重启。
  - `http://124.222.188.68:8765/api/limit-up-main-reason-db/status` 返回 200。
  - `http://124.222.188.68:8765/api/limit-up-main-reason-db/source-view?day=2026-06-18` 中韭研 tab 为 82 条，82 条都有 `detailReason`。

## 2026-06-20 涨停复盘来源板块卡片显示数量修正
- 问题：
  - 后端 TGB 2026-06-18 返回 15 个板块，合计 91。
  - 前端页面只显示前 12 个板块卡片，导致用户看到 TGB 部分卡片缺失。
- 原因：
  - 前端 `kpl-dashboard_17_apple.html` 中来源板块卡片使用了 `topics.slice(0, 12)`，主动截断为最多 12 张。
- 修正：
  - 改为 `topics.map(...)`，所有来源的板块卡片全部显示。
- 云端回退备份：
  - `C:\PandaDashboard\backups\source-view-show-all-topics-20260620-021845`
- 云端验证：
  - `http://124.222.188.68:8765/kpl` 返回 200。
  - 云端页面已不包含 `topics.slice(0, 12)`。
  - TGB 2026-06-18：板块数 15，板块合计 91，总数 91。

## 2026-06-20 云端四来源 18 个交易日主因库补采与校验
- 用户要求：
  - 韭研按 TGB 当前方法，更新同一批日期的数据收集。
  - 东财、同花顺也继续按同一批日期补采和校验。
  - 重点检查每个来源的涨停明细、板块卡片合计、个股细分原因是否一致。
- 本次处理的交易日：
  - 2026-05-25、2026-05-26、2026-05-27、2026-05-28、2026-05-29
  - 2026-06-01、2026-06-02、2026-06-03、2026-06-05
  - 2026-06-08、2026-06-09、2026-06-10、2026-06-11、2026-06-12
  - 2026-06-15、2026-06-16、2026-06-17、2026-06-18
- 云端数据回退备份：
  - `C:\PandaDashboard\backups\all-review-sources-backfill-20260620-022809`
- 云端代码回退备份：
  - `C:\PandaDashboard\backups\source-official-all-review-logic-20260620-023504`
- 规则调整：
  - TGB：继续只使用 `review/tgb-hunan-structured`，不使用 OCR，不用普通文本兜底。
  - 韭研：改为只使用韭研官方异动结构化来源，去掉旧的韭研复盘普通文本兜底，避免重复和混源。
  - 东财：东方财富涨停池本身只提供行业板块，不直接提供个股涨停细分原因；本次用东财概念成分关系补充个股细分标签，并标记为 `weak`，表示它不是东财涨停池直接给出的主因字段。
  - 同花顺：继续使用同花顺涨停/异动结构化来源，保留其直接给出的个股原因。
- 已执行云端回补：
  - 对以上 18 个交易日重新执行四来源主因库回补。
- 云端服务状态：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 云端 8765 服务已重启。
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
- 18 个交易日来源页实时校验结果：
  - `badCount=0`。
  - 无重复股票。
  - 每个来源 tab 的明细行数 = 板块卡片合计。
  - TGB：1510 条，个股细分原因 1510 条，覆盖率 100%。
  - 韭研：1215 条，个股细分原因 1215 条，覆盖率 100%；2026-05-25 暂无韭研来源数据。
  - 东财：1227 条，个股细分原因 1218 条，覆盖率 99.27%；2026-05-25 至 2026-05-28 暂无东财来源数据。
  - 同花顺：1228 条，个股细分原因 1227 条，覆盖率 99.92%；2026-05-25 暂无同花顺来源数据。
- 2026-06-18 来源页实时抽查：
  - TGB：91 条，板块卡片合计 91，个股细分原因 91 条。
  - 韭研：82 条，板块卡片合计 82，个股细分原因 82 条。
  - 东财：91 条，板块卡片合计 91，个股细分原因 91 条。
  - 同花顺：75 条，板块卡片合计 75，个股细分原因 75 条。
- 本机检查文件：
  - `C:\Users\86139\Documents\website\all-review-sources-backfill-after-eastmoney-jyg-fix-20260620.log`
  - `C:\Users\86139\Documents\website\all-sources-18day-source-view-check-after-fix.json`

## 2026-06-20 云端 30 天保留、全卡片展示、自动/手动四来源同步规则
- 用户要求：
  - 所有数据统一保存 30 天。
  - 到期后自动删除多余数据。
  - 涨停复盘来源板块卡片全部展示，不再截断。
  - TGB、韭研、东财、同花顺等所有来源信息由云端服务器每天自动同步。
  - 管理员也可以手动点看板健康源里的“同步”进行同步。
- 本次修改文件：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端回退备份：
  - `C:\PandaDashboard\backups\retention-30-all-source-sync-20260620-030000`
- 后端规则：
  - `CLOSE_DB_SYNC_TRADING_DAYS = 30`
  - `AUTO_CLEANUP_RETENTION_DAYS = 30`
  - `AUTO_CLEANUP_MAX_CACHE_FILE_AGE_DAYS = 30`
  - `MAIN_REASON_SYNC_DEFAULT_DAYS = 30`
  - 清理目录新增 `tgb-hunan-structured`，TGB 正式结构化来源也会按 30 天到期清理。
- 自动同步规则：
  - 云端服务在中国交易日上午自动处理最近 30 个交易日的主因库缺失项。
  - 云端服务会强制刷新最近一个已收盘交易日的四来源主因库。
  - 周末和中国法定节假日不执行当日主因库自动同步。
  - TGB 湖南人原文/原图证据仍自动同步，但正式 TGB 数据仍只使用结构化来源，不使用 OCR。
- 手动同步规则：
  - 看板健康源“同步”按钮从近 2 个交易日改为近 30 个交易日。
  - 手动点击只补齐缺失或不完整日期，不强制覆盖已经完整的四来源主因库数据。
- 前端展示：
  - 来源板块卡片继续使用 `topics.map(...)` 全部展示。
  - 云端页面不包含 `topics.slice(0, 12)`。
- 云端验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 云端 8765 服务已重启。
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
  - `http://124.222.188.68:8765/kpl` 返回 200。
  - 页面确认：
    - `mainReasonSyncDays = 30`
    - 同步接口包含 `mode=missing&days=30`
    - 来源卡片为全部展示。
  - 2026-06-18 来源页抽查仍正常：
    - TGB：91 条，板块卡片合计 91，个股细分原因 91 条。
    - 韭研：82 条，板块卡片合计 82，个股细分原因 82 条。
    - 东财：91 条，板块卡片合计 91，个股细分原因 91 条。
    - 同花顺：75 条，板块卡片合计 75，个股细分原因 75 条。

## 2026-06-20 管理后台新增“后端程序”同步范围
- 用户问题：
  - 前端和数据库同步可以从云端带回公司主机，但后端采集逻辑也需要能同步。
  - 希望后台同步端增加同步 `kpl-stats-server.js` 这类后端逻辑的功能。
- 本次修改文件：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\panda-admin.html`
- 云端回退备份：
  - `C:\PandaDashboard\backups\site-sync-backend-scope-20260620-031500`
- 新增同步范围：
  - `frontend`：前端网页。
  - `database`：后台业务数据。
  - `backend`：后端程序。
- 后端程序同步包含：
  - `kpl-stats-server.js`
  - `wind-close-db-sync.py`
  - `winrt-ocr.ps1`
  - 如果以后新增后端目录，例如 `api`、`backend`、`jobs`、`lib`、`scripts`、`server`、`tasks`、`workers`，也会自动纳入后端程序同步。
- 已清理数据库同步范围：
  - 后台数据库同步不再包含 `kpl-stats-server.js`、`wind-close-db-sync.py` 等后端程序代码。
  - 后台数据库同步不再包含以下本机安全配置：
    - `kpl-runtime-config.json`
    - `panda-admin-config.json`
    - `panda-auth-db.json`
    - `jiuyangongshe-auth.json`
  - 这些文件被设为 local-only，避免同步覆盖 API Key、管理员账号密码、Cookie、同步密钥等机器专用配置。
- 接收保护：
  - 如果旧客户端错误地把后端程序文件塞进 `database` 同步包，新云端会跳过这些文件，并提示必须使用 `backend` 同步范围。
- 管理后台：
  - 同步页面新增“后端程序”卡片。
  - 后端程序同步完成后会提示：需要重启后端服务后新逻辑才会生效。
- 云端验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 云端 8765 服务已重启。
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
  - `http://124.222.188.68:8765/admin` 返回 200，页面包含 `backend` 同步卡片配置。
  - `backend` 导出包验证：
    - `scope=backend`
    - 文件数 3
    - 包含 `kpl-stats-server.js`
    - 包含 `wind-close-db-sync.py`
    - 包含 `winrt-ocr.ps1`
    - 不包含 `kpl-runtime-config.json`
    - 不包含 `panda-admin-config.json`
  - 数据库同步范围验证：
    - 不包含 `kpl-stats-server.js`
    - 不包含 `wind-close-db-sync.py`
    - 不包含 `kpl-runtime-config.json`
    - 不包含 `panda-auth-db.json`

## 周一公司电脑首次接入“后端程序同步”的操作顺序
- 现象：
  - 公司电脑旧版管理后台暂时看不到“后端程序”同步卡片，这是正常的。
  - 因为“后端程序”同步范围是 2026-06-20 在云端新增的，公司电脑旧版 `kpl-stats-server.js` 还不认识 `backend` 这个同步范围。
- 第一次需要这样做：
  1. 在公司电脑打开 `http://127.0.0.1:8765/admin`。
  2. 进入“同步”页面，确认云端地址为 `http://124.222.188.68:8765`，同步密钥与云端一致。
  3. 先点“前端网页 / 从云端同步回来”。
     - 这一步会把新版 `panda-admin.html` 拉到公司电脑。
     - 但此时后端服务还没更新，可能仍然不会马上完整显示或可用“后端程序”同步。
  4. 公司电脑需要做一次后端程序引导更新：
     - 把云端的 `kpl-stats-server.js`、`wind-close-db-sync.py`、`winrt-ocr.ps1` 更新到公司电脑项目目录。
     - 更新前必须备份公司电脑原文件。
     - 更新后重启公司电脑的 Panda 后端服务。
  5. 重启后重新打开 `http://127.0.0.1:8765/admin`。
     - 同步页面应出现三张卡片：前端网页、后台数据库、后端程序。
  6. 再点：
     - “后端程序 / 从云端同步回来”
     - “后台数据库 / 从云端同步回来”
     - 必要时再点“前端网页 / 从云端同步回来”
- 以后正常使用：
  - 云端改了页面：公司点“前端网页 / 从云端同步回来”。
  - 云端改了业务数据：公司点“后台数据库 / 从云端同步回来”。
  - 云端改了采集规则、后端接口、自动任务逻辑：公司点“后端程序 / 从云端同步回来”，然后重启公司电脑的 Panda 后端服务。
- 注意：
  - 后端程序同步不会同步云服务器专用配置。
  - 以下内容不会被同步覆盖：同步密钥、管理员账号密码、Cookie、API Key、SSH、防火墙、计划任务。
  - 后端程序文件更新后，必须重启后端服务，新逻辑才会生效。

## 2026-06-20 看板健康源主因库同步改为“补齐”而非“强制刷新”
- 用户纠正：
  - 管理员看板健康源里的“同步”按钮应该是补齐逻辑。
  - 不需要重新刷新已经完整存在的 30 个交易日数据。
- 本次修改：
  - `kpl-dashboard_17_apple.html`
  - 同步接口从 `mode=missing&force=1&days=30` 改为 `mode=missing&days=30`。
  - 页面提示从“刷新近 30 个交易日”改为“补齐近 30 个交易日缺失或不完整的数据”。
- 云端回退备份：
  - `C:\PandaDashboard\backups\health-sync-missing-only-20260620-033000`
- 云端验证：
  - `http://124.222.188.68:8765/health` 返回 `{"ok":true}`。
  - `http://124.222.188.68:8765/kpl` 返回 200。
  - 页面中已不包含 `mode=missing&force=1&days`。
  - 页面中包含 `mode=missing&days=30`。

## 2026-06-20 复盘啦正式接入涨停主因库
- 用户确认：
  - 复盘啦/开盘啦的“涨停原因”数据要作为独立信息源，和 TGB、韭研、同花顺、东财并列。
  - 复盘啦采用页面结构化数据，不使用 OCR。
  - 剔除 ST 后入库。
- 本次修改：
  - `kpl-stats-server.js`
    - 新增 `review/kaipanla-fupanla` 来源。
    - 新增复盘啦页面解析器，读取板块、个股、连板、封板时间、个股涨停原因。
    - 新增复盘啦来源缓存目录：`kpl-limitup-main-reason-sources\kaipanla-fupanla`。
    - 新来源纳入自动主因库采集、来源统计、证据表和综合归纳评分。
    - 新来源按 30 天保留，超过保留期自动清理。
  - `kpl-dashboard_17_apple.html`
    - 涨停复盘来源标签新增“复盘啦”。
    - 数据源健康区新增“复盘啦”覆盖数量。
    - 来源显示中 `kaipanla/fupanla` 统一显示为“复盘啦”。
- 云端备份：
  - `C:\PandaDashboard\backup-before-fupanla-20260620-110438`
- 云端部署：
  - 已上传新版 `kpl-stats-server.js`。
  - 已上传新版 `kpl-dashboard_17_apple.html`。
  - 使用计划任务 `Panda Dashboard Server` 启动服务，避免 SSH 临时进程退出后服务停止。
  - 当前服务监听：`0.0.0.0:8765`。
- 2026-06-18 验证结果：
  - 云端重建 2026-06-18 主因库成功。
  - 总涨停数仍为 91。
  - 复盘啦来源 `review/kaipanla-fupanla` 覆盖 91 只，覆盖率 100%。
  - 复盘啦来源页接口：
    - `http://124.222.188.68:8765/api/limit-up-main-reason-db/source-view?day=2026-06-18&source=kaipanla`
    - 返回 `ok=true`
    - `activeCount=91`
  - 复盘啦板块统计：
    - 其他 14
    - 非金属材料 11
    - 机器人概念 11
    - 通信 11
    - 芯片 10
    - 有色金属 7
    - 算力 6
    - 医药 4
    - 元器件 4
    - 物理AI 3
    - 并购重组 2
    - 地产链 2
    - 服装家纺 2
    - 稀土永磁 2
    - AI应用 2
- 页面验证：
  - `http://124.222.188.68:8765/admin` 返回 200。
  - `http://124.222.188.68:8765/kpl` 返回 200。
  - `/kpl` 页面包含“复盘啦”和 `kaipanla` 来源入口。
- 注意：
  - 复盘啦公开页面当前主要提供最新交易日内容。
  - 以后云端每天收盘后会保存当天复盘啦来源，按 30 天保留。
  - 已经保存过的日期可继续从本地缓存读取。

## 2026-06-20 主因库同步按钮改为检查五个来源缺失
- 用户要求：
  - 管理员看板健康源里的“同步”不能只看综合主因库是否完整。
  - 还要逐日检查 TGB、复盘啦、韭研、同花顺、东财这些独立来源库是否缺失。
  - 复盘啦历史日期需要继续找接口；如果实在没有公开历史接口，才从当天开始每日自动保存。
- 本次修改：
  - `kpl-stats-server.js`
    - 新增必检来源清单：TGB、复盘啦、韭研、同花顺、东财。
    - `mode=missing&days=30` 现在会检查综合库覆盖，也会检查五个来源组是否存在。
    - 如果某天综合库完整但某个来源缺失，仍会进入补齐流程。
    - 同步后会再次检查来源完整性；如果来源仍缺，不再误报“已完整”。
    - 返回字段新增：`requiredSourceGroups`、`sourceGroupStats`、`missingSourceGroups`、`missingSourceLabels`、`sourceMissingCount`。
  - `kpl-dashboard_17_apple.html`
    - 同步提示从“四来源”改成“五来源”。
    - 同步完成详情会显示每个交易日缺哪个来源，例如“缺来源: 复盘啦”。
    - 详情里会列出各来源统计：TGB、复盘啦、韭研、同花顺、东财。
- 复盘啦历史接口确认：
  - 公开网页 `www.fupanwang.com/fupanla/` 的历史日期按钮只负责跳 VIP 提示，公开 HTML 实际仍主要是最新交易日内容。
  - VIP 前端真实历史接口为：`https://api2.fupanwang.com/kpl/fupanla?date=YYYY-MM-DD&plat=vip`。
  - 该接口需要 `grace/makeToken` 获取请求 token，并提交签名字段；返回数据带 `aes` 字段，需要 AES 解密。
  - 后端已加入 token、签名、AES 解密和 `ztyy.list` 解析逻辑。
  - 云服务器直接测试 2026-06-17 复盘啦历史接口成功：
    - HTTP 200
    - 接口 `code=1`
    - `date=2026-06-17`
    - `newdate=2026-06-18`
    - `ZT=85`
    - 板块数 15
- 云端备份：
  - `C:\PandaDashboard\backup-before-source-missing-sync-20260620-115354`
- 云端部署：
  - 已上传新版 `kpl-stats-server.js`。
  - 已上传新版 `kpl-dashboard_17_apple.html`。
  - 已用计划任务 `Panda Dashboard Server` 重启服务。
  - 当前服务监听：`0.0.0.0:8765`。
- 云端验证：
  - `http://124.222.188.68:8765/health` 返回 200，`{"ok":true}`。
  - `http://124.222.188.68:8765/kpl` 返回 200。
  - 页面已包含“五来源”“缺来源”“missingSourceLabels”“sourceGroupStats”。
  - 页面不再包含“四来源”旧提示。
  - 2026-06-18 五来源统计仍正常：
    - 东财 91/91
    - 复盘啦 91/91
    - TGB 91/91
    - 韭研 82/91
    - 同花顺 75/91
- 周一公司主机同步提醒：
  - 公司端需要同步“前端网页”和“后端程序”，否则公司网页不会显示新提示，后端也不会按五来源缺失来补齐。
  - 数据库同步只能带回已经生成的数据；这次补齐规则属于后端程序逻辑。

## 2026-06-20 韭研 6 月 18 日来源修正为 91/91
- 用户反馈：
  - 韭研 2026-06-18 历史统计不精确。
  - 机器人板块原先 12 只正确，但预览结果变成 13 只错误。
  - 韭研当天涨停总数应与底库一致为 91。
- 问题原因：
  - 韭研接口当天返回 19 个栏目，其中包含 `公告`、`其他`、`ST板块`、`简图`。
  - 原后端把 `公告` 和 `其他` 当作无效栏目过滤，导致韭研正式来源只剩 82/91。
  - 前面的临时预览文件又把 `公告` 里的 `603358 华达科技` 错误补入了 `机器人`，所以机器人从正确的 12 只变成错误的 13 只。
- 本次修正：
  - `kpl-stats-server.js`
    - 韭研官方结构源现在保留 `公告` 和 `其他` 两个栏目。
    - `ST板块` 和 `简图` 继续排除。
    - `公告` 和 `其他` 只作为韭研自己的栏目展示，不再被挪到机器人、PCB 等热点板块。
- 云端备份：
  - `C:\PandaDashboard\backup-before-jyg-topic-fix-20260620-145100`
- 云端部署：
  - 已上传新版 `kpl-stats-server.js`。
  - 已用计划任务 `Panda Dashboard Server` 重启服务。
  - `/health` 返回 `{"ok":true}`。
- 已强制重算：
  - `node kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=1`
  - 返回 `rebuilt=1`，综合库 `count=91`。
- 云端验证结果：
  - 韭研来源 `review/jiuyangongshe-action`：91/91，覆盖率 100%。
  - 韭研标签页：91 行。
  - 韭研板块统计：
    - 半导体 13
    - 被动元件 7
    - 地产 2
    - 公告 3
    - 光通信 4
    - 机器人 12
    - 锂电产业链 2
    - 其他 6
    - 商业航天 1
    - 算力 4
    - 钨 3
    - 消费 1
    - 氧化锆 5
    - 医疗医药 5
    - AI应用 4
    - AI硬件 8
    - PCB 11
  - 韭研机器人仍为 12 只：
    - 001365 天海电子
    - 002354 天娱数科
    - 002442 龙星科技
    - 002674 兴业科技
    - 002747 埃斯顿
    - 301310 鑫宏业
    - 600835 上海机电
    - 603082 北自科技
    - 603211 晋拓股份
    - 603380 易德龙
    - 603616 韩建河山
    - 603956 威派格
  - 本次补回的 9 只：
    - 公告：002579 中京电子、002950 奥美医疗、603358 华达科技
    - 其他：001296 长江材料、603177 德创环保、603201 常润股份、603223 恒通股份、603261 立航科技、603679 华体科技
- 周一公司主机同步提醒：
  - 需要同步后端程序 `kpl-stats-server.js`，否则公司端仍可能按旧规则把韭研算成 82/91。
  - 数据库同步可以带回已经重算后的 2026-06-18 韭研 91/91 数据。

## 2026-06-20 韭研 6 月 18 日继续核对中，暂停其他日期
- 用户反馈：
  - 2026-06-18 韭研数据仍不准。
  - 先不要补其他日期。
- 已处理：
  - 已停止扩大范围。
  - 30 日回补已经跑完过一次，但已撤回到回补前状态。
- 回退说明：
  - 回退来源备份：`C:\PandaDashboard\backup-before-jyg-30day-backfill-20260620-145546`
  - 回退前当前状态备份：`C:\PandaDashboard\backup-current-before-undo-30day-backfill-20260620-145908`
  - 回退后已重启 `Panda Dashboard Server` 清缓存。
  - `/health` 返回 `{"ok":true}`。
- 当前状态：
  - 只保留 2026-06-18 韭研规则修正和数据核对。
  - 2026-06-18 当前接口仍显示韭研覆盖 91/91，但内容口径未最终确认。
  - 后续不能仅按“总数 91”判定正确，必须逐个板块、逐只股票核对。

## 2026-06-20 来源底层库改为原版优先，先修 6 月 18 日
- 用户确认的硬规则：
  - 东财、TGB、韭研、同花顺、复盘啦等所有信息源，都要先建立各自“底层来源数据库”。
  - 底层来源数据库必须尽量与原版数据源一致，不能因为综合涨停底库、页面展示、过滤、优化、合并而删股票、改板块或合并栏目。
  - 展示过滤、冲突处理、深度优化、最终主因归纳，放到“综合归纳层”处理。
- 发现的问题：
  - 韭研 2026-06-18 原版 `商业航天` 有 2 只：`600399 抚顺特钢`、`688333 铂力特`。
  - 页面原来只显示 1 只，漏了 `688333 铂力特`。
  - 韭研 2026-06-18 原版 `其他` 有 7 只：`001226 拓山重工`、`001296 长江材料`、`603177 德创环保`、`603201 常润股份`、`603223 恒通股份`、`603261 立航科技`、`603679 华体科技`。
  - 页面原来只显示 6 只，漏了 `001226 拓山重工`。
  - 原因是旧逻辑会用综合涨停底库做交集，原版来源里有、但综合底库没有的股票会被截掉。
- 本次后端修改：
  - `kpl-stats-server.js`
    - 韭研、复盘啦、东财、同花顺、TGB 的采集函数，不再因为股票不在综合涨停底库中就丢弃来源原版股票。
    - `/api/limit-up-main-reason-db/source-view` 的各来源标签页，改为优先读取自动来源库里的 `rawRows` 原始来源行。
    - TGB 标签继续读取湖南人结构化来源文件。
    - 综合归纳层仍可按综合涨停底库、证据融合和主因质量规则进行二次归纳，不反向限制来源底层库。
- 云端备份：
  - `C:\PandaDashboard\backup-before-source-original-layer-0618-20260620-151035`
- 云端部署：
  - 已上传新版 `kpl-stats-server.js`。
  - 已用计划任务 `Panda Dashboard Server` 重启服务。
  - `/health` 返回 `{"ok":true}`。
- 只重算 2026-06-18：
  - 执行：`node kpl-stats-server.js --main-reason-backfill --day=2026-06-18 --days=1`
  - 未再跑 30 日回补。
- 2026-06-18 来源标签页验证：
  - TGB：91 行，15 个板块。
  - 复盘啦：91 行，15 个板块。
  - 东财：91 行，46 个板块。
  - 同花顺：75 行，65 个板块。
  - 韭研：102 行，17 个栏目。
  - 韭研 `商业航天` 已恢复为 2 只：`600399 抚顺特钢`、`688333 铂力特`。
  - 韭研 `其他` 已恢复为 7 只：`001226 拓山重工`、`001296 长江材料`、`603177 德创环保`、`603201 常润股份`、`603223 恒通股份`、`603261 立航科技`、`603679 华体科技`。

## 2026-06-20 韭研 6 月 18 日改为按官方涨停简图结构化入库

- 问题原因：
  - 之前把 `https://www.jiuyangongshe.com/action/2026-06-18` 的异动解析接口 `/api/v1/action/field`、`/api/v1/action/list` 当成韭研底层涨停库来源。
  - 这个接口是异动解析宽表，不等于页面“涨停简图”原版，因此会把未进入涨停简图的股票也带入，导致韭研来源出现 102 行、半导体 15 等错误。
  - 正确入口应为该页面“涨停简图”标签，对应接口 `/api/v1/action/diagram-url` 返回的官方图片；6 月 18 日图片文章为 `https://www.jiuyangongshe.com/a/206r3hkwh7g`。
- 本次修正：
  - 新增韭研结构化来源目录：`kpl-limitup-main-reason-sources/jiuyangongshe-structured`。
  - 新增 2026-06-18 韭研结构化源：`kpl-limitup-main-reason-sources/jiuyangongshe-structured/2026-06-18.json`。
  - 后端自动主因来源从 `review/jiuyangongshe-action` 切换为 `review/jiuyangongshe-structured`。
  - 涨停复盘页面的“韭研”标签页改为直接读取韭研官方涨停简图结构化源，板块和个股归属以图片原版为准。
  - 30 天清理规则加入 `jiuyangongshe-structured`。
- 6 月 18 日韭研验证结果：
  - 韭研来源行数：91。
  - 来源标识：`review/jiuyangongshe-structured`。
  - 板块计数：半导体 13、机器人 12、PCB 11、AI硬件 8、被动元件 7、氧化锆 5、医疗医药 5、光通信 4、算力 4、AI应用 4、钨 3、锂电产业链 2、地产 2、公告 3、其他 8。
  - “其他”8 只：`603261 立航科技`、`603223 恒通股份`、`600399 抚顺特钢`、`603201 常润股份`、`603679 华体科技`、`603001 奥康国际`、`001296 长江材料`、`603177 德创环保`。
- 云端操作：
  - 部署前备份：`C:\PandaDashboard\backup-before-jyg-structured-0618-20260620-153908`。
  - 更新云端后端：`C:\PandaDashboard\kpl-stats-server.js`。
  - 重算范围：只重算 `2026-06-18`，没有回补其他日期。
  - 服务恢复方式：使用原计划任务 `\Panda Dashboard Server` 启动，当前 8765 监听 `0.0.0.0`。
- 待办：
  - 后续韭研每日自动化应先保存官方“涨停简图”图片，再按同 TGB 的结构化图片源格式生成 JSON。
  - 云端韭研登录态已失效，`/api/v1/action/diagram-url` 当前返回登录失效；需要在后台重新登录韭研后，才能做每日自动抓图。
- 后续核对原则：
  - 先逐个来源核对底层库是否与原版一致。
  - 底层库确认后，再做综合归纳的深度优化。

## 2026-06-20 同花顺改为官方涨停简图来源，先完成 6 月 18 日结构化

- 用户确认的硬规则：
  - 同花顺底层来源库不能再使用旧的 `block_top`、涨停池行业概念、或“最强风口”重叠概念来替代。
  - 正确口径是同花顺官方“涨停简图”长图：横向标题作为当日主因板块，股票行右侧文字作为个股细分原因。
  - 底层来源库必须先与同花顺原版保持一致，综合合并和优化以后放到“综合归纳层”。
- 找到的官方来源：
  - 同花顺官方账号：`https://t.10jqka.com.cn/494854872/?posttype=post`
  - 2026-06-18 官方帖子：`https://t.10jqka.com.cn/pid_645810237.shtml`
  - 2026-06-18 官方长图：`https://u.thsi.cn/imgsrc/sns/d9a118c6aa940912b388188b72a165f9_1180_5980.png`
- 本次修正：
  - 新增工具：`tools/collect-ths-official-images.js`
    - 只从同花顺官方账号帖子列表筛选“涨停复盘”帖子。
    - 用浏览器调试口打开详情页，提取 `u.thsi.cn/imgsrc/sns/` 官方长图。
    - 不使用旧涨停池、旧板块接口替代底层来源。
  - 新增 2026-06-18 同花顺结构化源：`kpl-limitup-main-reason-sources/tonghuashun-structured/2026-06-18.json`
  - 后端同花顺来源从旧 `review/ths-limitup-focus` 切换为 `review/ths-limitup-structured`。
  - 后端禁用同花顺旧接口回退：如果没有官方长图结构化 JSON，就不生成同花顺来源行，避免旧接口污染底层库。
  - 涨停复盘页面的“同花顺”标签页改为直接读取官方涨停简图结构化来源。
  - 来源标签页不再显示“综合：xxx”提示，避免抽查底层来源时被综合归纳字段干扰。
  - 30 天清理规则加入 `tonghuashun-official-images`。
- 2026-06-18 同花顺验证结果：
  - 来源行数：92。
  - 来源标识：`review/ths-limitup-structured`。
  - 来源模式：`official-image`。
  - 板块计数：算力/半导体产业链 18、有色金属/小金属 14、PCB产业链 10、机器人 8、军工/航天 6、医药 6、MLCC/电容 5、算力租赁 5、光通信 4、AI应用 4、锂电池 4、大消费 3、地产产业链 2、其他概念 3。
  - 第一条抽查：`002989 中天精装`，板块 `算力/半导体产业链`，细分原因 `FCBGA封装基板+HBM+半导体转型+浙江国资`。
  - 说明：同花顺官方图显示 92 家，旧综合涨停底库曾显示 91 家，底层同花顺来源库以官方图 92 家为准。
- 近 30 个交易日官方图证据：
  - 已收集并上传云端：`kpl-limitup-main-reason-sources/tonghuashun-official-images`
  - 范围：2026-05-08 到 2026-06-18，共 30 个同花顺官方涨停复盘帖子。
  - 官方长图保存结果：30/30，缺失 0。
  - 注意：这些是“官方图证据”已保存，不等于 30 天都已经逐股结构化入库。
- 云端操作：
  - 部署前备份：`C:\PandaDashboard\backup-before-ths-official-image-20260620-171544`
  - 更新云端后端：`C:\PandaDashboard\kpl-stats-server.js`
  - 上传云端前端：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 上传同花顺结构化源：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tonghuashun-structured\2026-06-18.json`
  - 上传同花顺 30 日官方图证据：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tonghuashun-official-images`
  - 服务恢复方式：使用原计划任务 `\Panda Dashboard Server` 启动，当前 8765 监听 `0.0.0.0`。
- 重要边界：
  - 同花顺详情页当前没有隐藏表格文字，只有官方长图。
  - 除 2026-06-18 外，其他日期尚未逐股结构化成“板块 + 个股细分原因”。
  - 不能用 OCR 低置信度结果直接写入同花顺底层库，也不能用旧同花顺接口冒充官方涨停简图。
  - 后续要继续做同花顺 30 日结构化，应逐日按官方长图生成 `tonghuashun-structured/YYYY-MM-DD.json`，再逐日验证卡片总数和原图一致。

## 2026-06-20 东财改为复盘啦“涨停原因”结构化来源，先完成 6 月 18 日

- 问题原因：
  - 之前东财来源使用 `eastmoney/topic-zt-pool`，来自东财涨停池/行业概念池。
  - 这个来源会把个股分散到较多行业/概念板块，且个股细分原因不等于东财复盘啦“涨停原因”页原版字段。
  - 用户确认东财后续采用 `https://emdata.eastmoney.com/appdc/fpl/index.html?appfenxiang=1#/` 里的“涨停原因”页，剔除 ST。
- 找到的真实接口：
  - `https://datacenter.eastmoney.com/securities/api/data/v1/get`
  - `reportName=RPT_PCHOT_LIMITLIST_HSDETIAL`
  - `filter=(TRADE_DATE='YYYY-MM-DD')`
  - 关键字段：
    - `BOARD_NAME`：东财原版板块。
    - `LIMIT_REASON`：个股涨停细分原因。
    - `LIMIT_CONTENT`：东财生成的行业/公司原因全文。
    - `LIMIT_LABEL`：保留“涨停”/“曾涨停”状态。
    - `IS_ST`：用于剔除 ST。
- 本次修正：
  - 新增东财结构化来源目录：`kpl-limitup-main-reason-sources/eastmoney-fpl-limit-reason`。
  - 新增工具：`tools/collect-eastmoney-fpl-limit-reason.js`。
  - 新增 2026-06-18 东财结构化源：`kpl-limitup-main-reason-sources/eastmoney-fpl-limit-reason/2026-06-18.json`。
  - 后端自动主因来源从 `eastmoney/topic-zt-pool` 切换为 `review/eastmoney-fpl-limit-reason`。
  - 涨停复盘页面的“东财”标签页改为直接读取东财复盘啦“涨停原因”结构化源。
  - 30 天清理规则加入 `eastmoney-fpl-limit-reason`。
  - 修正强制刷新逻辑：`force=1` 时会重建自动来源统计，不再沿用旧 `auto` 来源缓存。
- 2026-06-18 东财验证结果：
  - 来源行数：46。
  - 来源标识：`review/eastmoney-fpl-limit-reason`。
  - 来源模式：`official-structured-page`。
  - 板块合计：46，与行数一致。
  - 其中 `涨停` 38 条，`曾涨停` 8 条。
  - 板块数：30。
  - Top 板块：算力概念 5、PCB 5、机器人概念 3、创新药 2、稀土 2、液冷概念 2、印制电路板 2、中药Ⅱ 2、MLCC 2。
  - 第一条抽查：`001216 华瓷股份`，板块 `电池技术`，细分原因 `股权收购+材料创新+供应链整合`。
  - 说明：东财复盘啦“涨停原因”页 6 月 18 日本身只有 46 条，不等于全市场 91 家涨停底库；底层东财来源库按东财原版页面保存，综合归纳层以后再和其他来源合并。
- 云端操作：
  - 部署前备份：`C:\PandaDashboard\backup-before-eastmoney-fpl-20260620-175758`
  - 更新云端后端：`C:\PandaDashboard\kpl-stats-server.js`
  - 上传工具：`C:\PandaDashboard\tools\collect-eastmoney-fpl-limit-reason.js`
  - 上传东财结构化源：`C:\PandaDashboard\kpl-limitup-main-reason-sources\eastmoney-fpl-limit-reason\2026-06-18.json`
  - 服务恢复方式：使用原计划任务 `\Panda Dashboard Server` 启动，当前 8765 监听正常。
- 编码/乱码处理约定：
  - 云端中文 JSON 文件实际按 UTF-8 保存；SSH/Windows PowerShell 5.1 直接显示中文时容易乱码。
  - 后续检查中文 JSON 时优先使用 Node 或网页 API，不用旧 PowerShell 直接 `Get-Content | ConvertFrom-Json` 判断中文内容是否正确。
  - PowerShell 仅用于系统动作：创建目录、上传、重启、检查端口。
  - 中文内容是否正确，以 Node 读取、网页接口返回、浏览器页面显示为准。

## 2026-06-20 自动清理调度改为每天一次

- 用户要求：
  - 自动清理每天一次即可，不需要每分钟检查。
- 本次修正：
  - 保留 30 天数据规则不变。
  - 保留清理范围不变：涨停底库、主因库、证据文件、质量诊断、各来源结构化源和图片/原文证据。
  - 把 `runAutoCleanupIfDue()` 从每分钟循环和启动 3 秒检查里移除。
  - 新增独立每日调度：每天中国时间 15:45 后触发一次清理。
  - 新增可配置项：
    - `KPL_CLEANUP_RUN_HOUR`，默认 `15`。
    - `KPL_CLEANUP_RUN_MINUTE`，默认 `45`。
- 说明：
  - 之前代码已有“同一天只真正清理一次”的保护，但仍会每分钟做一次是否该清理的检查。
  - 现在连检查频率也改成每天一次，减少无意义后台触发。

## 2026-06-20 韭研 Cookie 失效自动续登

- 用户要求：
  - 云端检测到韭研登录失效时，自动用账号密码重新登录。
  - 登录成功后保存新的 Cookie。
  - 管理员看板点“同步”时，韭研数据也按这个逻辑继续收取。
- 本次修正：
  - 新增韭研账号密码保存接口：`/api/jiuyangongshe-auth/credentials`。
  - 账号密码保存到云端本机专用配置：`C:\PandaDashboard\jiuyangongshe-auth.json`。
  - 该文件属于云服务器专用配置，不纳入前端/后台数据库同步。
  - 后端不会把密码回传给前端；状态接口只显示是否已配置和脱敏手机号。
  - 韭研接口请求发现 Cookie 缺失或失效时，会自动调用韭研账号密码登录接口。
  - 登录成功后保存新的 `SESSION` Cookie，然后自动重试原来的韭研数据请求。
  - `/api/jiuyangongshe-auth/status` 也会在 Cookie 失效时尝试自动续登。
- 使用方式：
  - 只需要在云端保存一次韭研手机号和密码。
  - 后续每天自动同步或手动点“同步”，如果 Cookie 失效，后端会自动续登。
  - 如果韭研账号密码本身错误、平台需要验证码或风控拦截，则仍需要人工处理。
- 重要边界：
  - 本次解决的是“登录态失效自动恢复”。
  - 韭研底层库仍必须以韭研原版涨停简图/结构化来源为准；不能用错误聚合结果替代原版底层库。

### 2026-06-20 补充：管理员后台增加韭研账号输入入口

- 新增位置：
  - 管理员后台 `/admin`。
  - 进入“同步”页。
  - 在云端同步配置下方新增“韭研账号自动登录”卡片。
- 卡片功能：
  - 输入韭研手机号、密码和区号。
  - 点击“保存并测试”后，后端保存账号密码并立刻测试一次韭研自动登录。
  - 密码不会回显，后续可留空保留原密码。
  - 显示是否已配置、Cookie 是否已保存、最近自动登录时间。

## 2026-06-20 同步按钮升级为“先补齐五来源底层，再生成综合主因库”

- 用户要求：
  - 管理员看板健康源里的“同步”按钮，必须先补齐五个来源底层文件：TGB、复盘啦、韭研、同花顺、东财。
  - 五个来源底层文件就绪后，才允许生成综合主因库。
  - 不允许在来源底层缺失时继续生成看起来完整但实际缺来源的综合主因库。
- 本次修正：
  - 新增服务端前置流程：`ensureReviewSourceArtifactsForDay()`。
  - `mode=missing&days=30` 的同步逻辑改为两阶段：
    1. 检查并补齐五个来源底层文件。
    2. 五个来源均就绪后，才调用综合主因库生成。
  - 如果任一来源底层仍缺失：
    - 当日不会生成新的综合主因库。
    - 返回结果中会标明缺失来源和原因。
    - 页面仍显示“待处理”，不再误判为同步成功。
- 当前安全边界：
  - 复盘啦、东财已有可靠结构化抓取器，可由同步流程自动补齐。
  - TGB 如云端已有 `tgb-hunan-manual-structured` 精确结构化缓存，会自动复制到底层来源目录；否则只保存原文/原图证据，不使用 OCR 或兜底算法伪造结构化底层。
  - 韭研会先检查/自动恢复登录态，但如果缺“官方涨停简图结构化底层文件”，不会用之前不准确的 action API 结果替代。
  - 同花顺如果缺“官方涨停简图结构化底层文件”，不会用旧涨停池或 block_top 概念重叠结果替代。
- 影响：
  - 以后点击同步时，结果更严格：底层来源缺失会明确卡住综合库生成。
  - 这能解释之前“扫 30 日，同步 0，待 19”的情况：旧流程没有真正补齐所有来源底层，新流程会把缺失来源暴露出来。

## 2026-06-20 TGB/韭研/同花顺底层生成器边界修正

- 用户确认：
  - 6月18日 TGB、韭研、复盘啦的底层统计已经正确。
  - 这些来源的底层数据库必须和原版来源一致。
  - 不使用 OCR/识图结果兜底，尤其 TGB 湖南人复盘不再使用 OCR。
- 本次修正：
  - TGB、韭研、同花顺同步前置流程新增“精确结构化底稿导入”。
  - 同步时会先查找已确认的结构化 JSON 底稿；找到了才写入对应来源底层库。
  - TGB 额外兼容 `tgb-YYYY-MM-DD-structured-source.json` 这类 6月18日确认版文件。
  - 韭研如果缺结构化底稿，只保存官方涨停简图证据和登录状态，不再用 action API 聚合结果当作原版底层库。
  - 同花顺如果缺结构化底稿，只读取/保存官方涨停简图证据，不再用旧涨停池、block_top 或概念重叠结果当作原版底层库。
  - 韭研官方涨停简图证据目录 `kpl-limitup-main-reason-sources/jiuyangongshe-diagram` 纳入 30 天自动清理。
- 自动化结论：
  - 复盘啦、东财：有结构化接口，可自动补齐并每日更新。
  - TGB：云端目前已有 5月25日到6月18日的精确结构化底稿，可直接用于底层库；新日期如果只有图片/原文但无结构化底稿，则只保存证据，不生成假数据。
  - 韭研：已新增结构化生成器，云端已生成 21 个交易日正式底层文件；生成时必须通过“应有数量 = 实际数量、无缺失、无多余”校验。
  - 同花顺：目前云端只有 6月18日确认结构化底稿；其他日期已有官方候选数据/长图证据，但候选覆盖率不完整的日期不会进入正式底层库。
- 目的：
  - 底层库宁可显示缺失，也不能为了“同步成功”写入和原版不一致的数据。
  - 综合归纳层以后可以做合并、筛选、优化；来源底层层必须保持原版一致。

### 2026-06-20 补充：修正 6月18日仍显示待同步

- 现象：
  - 6月18日五个来源底层文件已经能读出：TGB、复盘啦、韭研、同花顺、东财。
  - 但管理员健康源里仍可能显示“待同步”。
- 原因：
  - 状态判断同时参考了旧的 `auto` 临时综合源统计和新的五来源底层文件。
  - 旧临时源里部分来源统计不全，会把已经修好的日期继续误判为“缺来源、待同步”。
- 修正：
  - “是否待同步”改为以正式五来源底层文件为准。
  - 旧 `auto` 临时综合源只保留做诊断，不再参与同步完成状态判定。

### 2026-06-20 补充：18号之前同步仍待处理的原因

- 云端实测：
  - 6月17日、6月16日、6月15日、6月12日等日期，TGB、复盘啦、东财底层文件已经存在。
  - 这些日期的韭研、同花顺精确结构化底层文件仍缺失。
  - 同花顺多数历史日期已有官方长图证据，但还没有对应结构化表。
- 原因：
  - 当前规则要求五来源底层文件都齐，才生成新的综合主因库。
  - 韭研/同花顺 18号以前缺精确结构化底稿，所以同步会显示“待处理”。
  - 这不是按钮没有扫到日期，而是按“底层库必须和原版一致、不用 OCR、不用错误接口兜底”的规则被挡住。
- 页面提示修正：
  - 看板健康源同步状态改为显示缺失来源，例如“缺韭研、同花顺”。
  - 同步详情改为展示正式五来源底层文件数量，不再用旧 `auto` 临时源统计误导判断。

### 2026-06-20 补充：韭研/同花顺结构化生成器落地

- 云端备份：
  - `C:\PandaDashboard\backup-before-jyg-ths-generators-20260620-204721`
  - `C:\PandaDashboard\backup-before-source-baseline-fix-20260620-210234`
- 本次新增：
  - 增加韭研结构化生成器：从韭研 action 结构化接口取板块、个股、细分主因、封板时间和连板信息。
  - 增加同花顺结构化候选生成器：抓同花顺官方涨停池和最强风口/block_top 候选数据。
  - 增加命令行补底层入口：`node .\kpl-stats-server.js --review-source-artifacts --day=YYYY-MM-DD --days=N --sources=jiuyangongshe,ths --force`
- 韭研规则：
  - 不使用 OCR。
  - 先用通用涨停底表做基准；如果通用底表导致韭研缺一只或覆盖不完整，再退回复盘啦/TGB 这类已确认来源底层基准。
  - 只有覆盖率完全一致，即“应有数量 = 实际数量、无缺失、无多余”，才写入正式韭研底层库。
  - 修正封板时间字段，优先取韭研原始 `action_info.time`，避免把其他时间误当封板时间。
- 云端验证：
  - 6月10日韭研已重建成功：70/70，无缺失、无多余。
  - 6月17日韭研已重建成功：86/86，无缺失、无多余。
  - 抽查 6月10日前几条：宿迁联盛 09:25:00、和远气体 09:30:00、中晶科技 09:34:00。
  - 云端当前韭研正式底层文件共 21 个交易日，日期从 2026-05-21 到 2026-06-18，中间排除周末和节假日。
- 同花顺规则：
  - 不用旧涨停池或概念重叠结果直接充当正式底层。
  - 官方候选数据会保存到 `kpl-limitup-main-reason-sources\tonghuashun-api-candidates`。
  - 只有候选数据覆盖率完全一致，才写入 `tonghuashun-structured` 正式底层库。
- 同花顺云端实测：
  - 已扫 30 日，同花顺正式底层库仍只有 2026-06-18 共 92 条。
  - 2026-05-21 到 2026-06-17 已保存 20 个官方候选文件。
  - 但这些日期的最强风口/block_top 候选覆盖不完整，例如 2026-06-17 为 pool 85/85、block 74/85，所以没有写入正式同花顺底层库。
  - 这符合“底层库必须和原版一致，宁可缺失也不写错数据”的规则。
- 部署验证：
  - 云端 `kpl-stats-server.js` 已部署最新版本。
  - `http://127.0.0.1:8765/admin` 返回 200。
  - `http://127.0.0.1:8765/kpl` 返回 200。

### 2026-06-20 补充：健康源同步范围固定为最近 30 个交易日

- 问题：
  - 数据健康源点击同步后，状态详情可能显示到 4 月份。
  - 原因是前端把页面当前日期 `state.date` 传给同步接口；如果页面停在历史日期，服务端就会从那个历史日期往前数 30 个交易日。
- 修正：
  - 前端同步按钮不再传页面当前日期。
  - 服务端 `mode=missing` 同步逻辑固定以云端当前能识别到的最新交易日为终点，再向前取 30 个交易日。
  - 即使旧前端或缓存仍传旧日期，服务端也会忽略旧日期，只返回最近 30 个交易日窗口。
- 云端备份：
  - `C:\PandaDashboard\backup-before-health-30tradingday-fix-20260620-212509`
- 验证：
  - 云端页面文件里旧的 `day=state.date&mode=missing` 请求已不存在。
  - 云端后端已包含 `resolveCurrentLatestTradingDay()` 和 `recentEndDay` 逻辑。
  - `/admin` 和 `/kpl` 均返回 200。

### 2026-06-20 补充：TGB 原图自动结构化入口

- 目标：
  - 让健康源“同步”按钮在 TGB 抓到官方文章和图片后，可以继续尝试生成正式 `tgb-hunan-structured` 底层库。
  - 正式库仍坚持“真实来源、数量校验、失败不入库”，不使用综合库反推，不把低质量结果写入来源底层库。
- 本次新增：
  - 新增本机专用配置文件：`source-structurer-config.json`。
  - 新增管理员后台“TGB 原图结构化”配置卡片，可保存接口地址、模型、API Key、最多图片数。
  - 该配置文件已加入本机专用清单，不参与前端、数据库、后端程序同步。
  - TGB 同步链路改为：优先导入已确认的结构化底稿；没有底稿时抓官方原文/原图；如已配置视觉结构化服务，再尝试把原图转换成正式底层库。
- 严格校验：
  - 自动排除头像、小图标、二维码等非复盘图。
  - 每条记录必须包含有效股票代码、股票名称、板块主题、个股细分主因。
  - 与当日涨停底库做覆盖校验；缺失过多、出现非涨停代码、重复代码、明细原因缺失过多时，全部拒绝入正式库。
  - 拒绝时只保留原始证据和失败原因，不写入 `tgb-hunan-structured`。
- 云端备份：
  - `C:\PandaDashboard\backup-before-source-structurer-20260620-220418`
- 云端验证：
  - `node --check .\kpl-stats-server.js` 通过。
  - `/health` 返回 `{"ok":true}`。
  - `/admin` 和 `/kpl` 均返回 200。
  - 未配置视觉结构化密钥时，测试 2026-05-21 TGB 返回“结构化器未配置”，不会写入正式底层库，避免污染数据。
  - 管理员后台已能看到“TGB 原图结构化”配置入口。
- 自启动修复：
  - 检查发现云端缺少 `Panda Dashboard Server` 开机自启动任务。
  - 已新增 `C:\PandaDashboard\start-kpl-stats-server.ps1`。
  - 已注册计划任务 `Panda Dashboard Server`，触发条件为系统启动时，运行账户为 `SYSTEM`。
  - 任务上次运行结果为 `0`，当前 8765 端口监听正常。

### 2026-06-20 补充：后台登录自动登出修复

- 现象：
  - 管理后台登录后，过一会儿可能自动退出。
- 原因：
  - 旧版本登录令牌只保存在 Node 服务内存里。
  - 只要云端后台服务重启，浏览器里的旧令牌还在，但服务端已经不认识它，前端检测到不是管理员后就会清掉登录状态。
- 修正：
  - 管理员/普通用户会话改为保存到云端本机文件 `panda-auth-sessions.json`。
  - 默认登录有效期从 12 小时调整为 7 天。
  - 后台正常使用时会自动续期，避免频繁重新登录。
  - `panda-auth-sessions.json` 已加入本机专用清单，不参与前端、数据库、后端程序同步。
- 说明：
  - 这只影响登录保持，不影响涨停主因库、五来源底层库和同步规则。
  - 已保留云端部署前备份，便于回退。

### 2026-06-20 补充：云端服务稳定启动方式修正

- 现象：
  - 部署后短时间内 `/health` 正常，但随后 8765 端口可能不再监听。
- 原因：
  - 旧启动任务通过 PowerShell 脚本启动 Node 后脚本退出；在计划任务环境下，子进程可能跟随任务结束。
- 修正：
  - 已改造 `C:\PandaDashboard\start-kpl-stats-server.ps1`，让计划任务前台运行 Node 服务，而不是启动后立即退出。
  - 已重新注册计划任务 `Panda Dashboard Server`，系统启动时运行，运行账户 `SYSTEM`。
- 验证：
  - 计划任务状态为“正在运行”。
  - Node 进程监听 8765。
  - 20 秒后复查 `/health`、`/admin`、`/kpl` 均返回 200。

### 2026-06-20 补充：公网 8765 无法打开修复

- 现象：
  - `http://124.222.188.68:8765` 从家里电脑无法打开。
- 原因：
  - 云端 Node 服务只监听 `127.0.0.1:8765`，只能服务器本机访问，公网无法访问。
  - Windows 防火墙中也缺少 8765 入站放行规则。
- 修正：
  - 已修改云端启动脚本 `C:\PandaDashboard\start-kpl-stats-server.ps1`：
    - 设置 `KPL_STATS_HOST=0.0.0.0`
    - 设置 `KPL_STATS_PORT=8765`
    - 让 Node 监听所有网卡的 8765 端口。
  - 已新增 Windows 防火墙规则：
    - `Panda Dashboard 8765`
    - 入站 TCP 8765 允许。
  - 已重新注册并启动计划任务 `Panda Dashboard Server`。
- 云端备份：
  - `C:\PandaDashboard\backup-before-public-8765-fix-20260620-222643`
- 验证：
  - 云端监听地址已变为 `0.0.0.0:8765`。
  - 家里电脑测试公网端口 `124.222.188.68:8765` 成功。
  - `http://124.222.188.68:8765/health` 返回 200。
  - `http://124.222.188.68:8765/admin` 返回 200。
  - `http://124.222.188.68:8765/kpl` 返回 200。

### 2026-06-20 补充：最近 30 个交易日底层库同步口径修正

- 发现问题：
  - 5月19日按“最近 30 个交易日”应在同步窗口内，但页面显示为空。
  - 原因不是 5月19日完全没有来源数据，而是：
    - `kpl-limitup-db\2026-05-19.json` 每日涨停底库缺失。
    - 来源查看接口依赖综合主因证据文件；综合证据缺失时，即使复盘啦、韭研、东财底层文件存在，页面也会整页返回空。
    - 自动清理旧逻辑按自然日保留 30 天，不是按交易日保留 30 个交易日，容易误清理仍在交易日窗口内的数据。
- 已修正：
  - 同步流程改为先补每日涨停底库，再检查/补五来源底层库。
  - 自动清理改为按最近 30 个交易日白名单保留，不再按 30 个自然日删除。
  - 来源查看接口改为直接读取五来源底层文件；即使综合主因证据还没生成，也能显示复盘啦、韭研、东财等来源的底层库。
  - 每日涨停底库增加严格兜底：官方涨停池/KPL 历史接口失败时，优先用复盘啦已确认结构化来源生成 `review/kaipanla-fupanla-limitup`，韭研作为第二兜底；不使用东财局部来源当总涨停底库。
- 云端备份：
  - `C:\PandaDashboard\backup-before-30tradingday-sync-fix-20260620-223615`
- 云端已执行：
  - 已跑最近 30 个交易日补齐。
  - 当前窗口：2026-05-08 到 2026-06-18，共 30 个交易日。
- 当前结果：
  - `kpl-limitup-db`：30 个文件，包含 2026-05-19。
  - 复盘啦：30 个文件，包含 2026-05-19。
  - 韭研：30 个文件，包含 2026-05-19。
  - 东财：30 个文件，包含 2026-05-19。
  - TGB：18 个文件，2026-05-19 缺失，原因是未配置 TGB 原图结构化密钥/无确认结构化底稿，不强写。
  - 同花顺：仅 2026-06-18 正式结构化文件，其他日期候选覆盖不完整，不强写。
- 5月19日验证：
  - 每日涨停底库：90 条，来源 `review/kaipanla-fupanla-limitup`。
  - 来源页复盘啦：90 条。
  - 来源页韭研：90 条。
  - 来源页东财：60 条。
  - 来源页 TGB/同花顺：仍显示缺失，符合严格规则。

### 2026-06-21 补充：新增选股宝底层数据库来源

- 新增内容：
  - 后端新增“选股宝”结构化底层库来源，目录为：
    - `C:\PandaDashboard\kpl-limitup-main-reason-sources\xuangubao-limit-up`
  - 涨停复盘来源页新增“选股宝”栏目。
  - 数据健康源新增“选股宝”卡片。
  - 最近 30 个交易日补齐逻辑新增检查和补齐“选股宝”。
  - 自动清理白名单新增“选股宝”，仍按最近 30 个交易日保留。
- 数据来源：
  - 使用选股宝涨停池结构化 JSON：
    - `https://flash-api.xuangubao.cn/api/pool/detail?pool_name=limit_up&date=YYYY-MM-DD`
  - 读取字段包括：
    - 股票代码、股票名称、首次涨停时间、最终涨停时间、连板数、炸板次数。
    - `surge_reason.stock_reason` 作为个股细分涨停原因。
    - `surge_reason.related_plates` 作为所属题材/板块及板块原因。
  - 剔除 ST 后入库，不使用 OCR。
- 6月18日验证：
  - 原始选股宝涨停池：101 条。
  - 剔除 ST 后：91 条。
  - 生成底层库行数：91 条。
  - 页面接口验证：
    - `source=xuangubao`
    - 返回 91 行。
    - `reportedCount=101`
    - `nonStCount=91`
- 最近 30 个交易日执行结果：
  - 已在云端补齐 30 个交易日选股宝底层文件。
  - 当前窗口：2026-05-08 到 2026-06-18。
  - 生成文件：30 个 JSON。
- 东财口径修正：
  - 东财“涨停原因”页仍保留为结构化证据来源。
  - 但该页面数量明显少于完整非 ST 涨停池，例如 2026-06-18 东财为 46 条，而选股宝/复盘啦/韭研为 91 条。
  - 因此东财已标记为“局部证据来源”，不再作为完整涨停总数的基准。
- 云端部署：
  - 已上传并替换：
    - `C:\PandaDashboard\kpl-stats-server.js`
    - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 已重启计划任务：
    - `Panda Dashboard Server`
  - 已验证：
    - `/health` 返回 200。
    - `/kpl` 返回 200，并包含“选股宝”入口。
    - 选股宝来源接口返回 91 行。
- 云端备份：
  - `C:\PandaDashboard\backup-before-xuangubao-source-20260621-001028`

### 2026-06-21 补充：同花顺底层库改为官方涨停池 JSON

- 用户提供并验证的接口：
  - `https://data.10jqka.com.cn/dataapi/limit_up/limit_up_pool`
  - 参数：
    - `page=1`
    - `limit=200`
    - `field=199112,10,9001,330323,330324,133971,3475914,9002,9003,9004`
    - `filter=HS,GEM2STAR`
    - `order_field=330324`
    - `order_type=0`
    - `date=YYYYMMDD`
- 关键发现：
  - `date=20260619` 返回非交易日，`info=[]`，但返回上一交易日统计。
  - `date=20260618` 返回 91 条，和 2026-06-18 非 ST 涨停总数一致。
  - 同花顺 `block_top` 板块接口在 2026-06-18 只覆盖 75/91 只股票，所以不能再作为同花顺底层库是否完整的硬性条件。
- 已修正：
  - 同花顺正式底层库改为以 `limit_up_pool` 官方 JSON 为准。
  - `reason_type` 作为个股细分涨停原因。
  - `block_top` 只作为板块辅助信息；没有覆盖到的股票不再被丢弃。
  - 旧版同花顺文件即使有行数，只要不是 `official-limit-up-pool-json` 方法，就会在同步时被判定为旧口径并重建。
  - 前端数据健康源文案从“同花顺复盘”改为“同花顺涨停池”。
- 6月18日验证：
  - 旧同花顺文件：92 条，已判定旧口径。
  - 新同花顺文件：91 条。
  - `limit_up_pool` 覆盖：91/91。
  - `block_top` 覆盖：75/91，仅作为辅助。
  - 页面接口：
    - `source=ths`
    - 返回 91 行。
    - `sourceMode=official-limit-up-pool-json`
- 最近 30 个交易日执行结果：
  - 已强制刷新同花顺最近 30 个交易日底层文件。
  - 当前窗口：2026-05-08 到 2026-06-18。
  - 生成文件：30 个 JSON。
  - 所有文件方法均为：`official-limit-up-pool-json`。
- 云端部署：
  - 已上传并替换：
    - `C:\PandaDashboard\kpl-stats-server.js`
    - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 已重启计划任务：
    - `Panda Dashboard Server`
  - 已验证：
    - `/health` 返回 200。
    - 同花顺来源页返回 91 行，中文说明正常。
- 云端备份：
  - `C:\PandaDashboard\backup-before-ths-limit-up-pool-json-20260621-002647`

### 2026-06-21 补充：移除 TGB 正式来源和原图结构化配置

- 调整原因：
  - TGB 原图结构化尝试时间较长，自动化稳定性和准确性仍无法达到正式底层库要求。
  - 当前项目正式底层库先保留更稳定的信息源：复盘啦、韭研、选股宝、同花顺、东财。
- 已移除的可见入口：
  - 管理员后台删除“TGB 原图结构化”配置卡片。
  - 行情页数据库健康源删除“TGB复盘”卡片。
  - 涨停复盘来源页删除 TGB 来源标签。
  - 页面说明改为：按复盘啦、东财、选股宝、同花顺、韭研拆分查看来源库。
- 已停用的后端入口：
  - `/api/source-structurer/config`
  - `/api/limit-up-main-reason-db/tgb-hunan/status`
  - `/api/limit-up-main-reason-db/tgb-hunan/sync`
  - `--tgb-hunan-raw-evidence` 命令行入口改为返回停用提示。
- 已停用的同步逻辑：
  - 后台主因库同步不再顺带收集 TGB 原文/原图。
  - 每天上午自动 TGB 原文/原图收集已停用。
  - 最近 30 个交易日来源完整性检查不再要求 TGB。
  - 综合主因库生成不再读取 TGB 来源。
- 保留说明：
  - 历史 TGB 文件和备份没有删除，仅从当前正式业务流程中移除，避免误删历史记录。
  - 云端原 `source-structurer-config.json` 已移动到备份目录：
    - `C:\PandaDashboard\backup-before-remove-tgb-source-20260621-003909\source-structurer-config.json.removed`
  - 当前 `C:\PandaDashboard` 根目录下不再保留该结构化 Key 配置文件。
- 云端验证：
  - `/health` 返回 200。
  - `/admin` 返回 200，且不再包含“TGB 原图结构化”和 `source-structurer`。
  - `/kpl` 返回 200，且不再包含“TGB复盘”健康源卡片。
  - `/api/source-structurer/config` 返回 404。
  - `/api/limit-up-main-reason-db/tgb-hunan/status` 返回 404。
  - `source-view` 标签仅剩：`final`、`kaipanla`、`eastmoney`、`xuangubao`、`ths`、`jiuyangongshe`。
- 云端备份：
  - `C:\PandaDashboard\backup-before-remove-tgb-source-20260621-003909`

### 2026-06-21 补充：Windows 编码和远程输出优化

- 问题现象：
  - Windows PowerShell 5.1 默认读取 UTF-8 无 BOM 文件时，可能把中文显示成乱码。
  - `Out-File` 写 JSON 时可能带 BOM 或使用不符合预期的编码，导致 Node/浏览器解析 JSON 报错。
  - 远程执行 `Invoke-WebRequest` 时，PowerShell 进度流可能输出 CLIXML 噪音。
- 已新增工具：
  - `tools\panda-remote-utf8.ps1`
  - `tools\panda-remote-utf8.cmd`
  - `tools\check-text-encoding.js`
- 新规则：
  - 后续远程执行云端命令优先使用 `tools\panda-remote-utf8.cmd`。
  - 远程命令自动设置 UTF-8 输出，并关闭 PowerShell 进度流。
  - 需要写 JSON 文件时，不再用 PowerShell `Out-File`；优先用 Node 写文件，或用脚本内的 `Write-Utf8NoBomFile`。
  - 检查前后端文件真实编码时，用 `node tools\check-text-encoding.js`，不要只看 PowerShell 终端显示。
- 已验证：
  - `cloud-kpl-stats-server-current.js`、`kpl-dashboard_17_apple.html`、`panda-admin.html` 通过 UTF-8/乱码检查。
  - 新远程工具读取云端 `/health` 返回 200，输出为干净 JSON。

### 2026-06-21 补充：行情页右上角账号区对齐主页

- 调整位置：
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 调整内容：
  - 行情页右上角登录后继续显示头像、账号名、身份标签。
  - 管理员登录后新增可见“后台”入口，点击进入 `/admin`。
  - 登录后新增可见“退出”按钮，和主页账号区的操作保持一致。
  - 原有齿轮配置入口保留，仅管理员登录后显示。
- 未调整内容：
  - 没有修改主因库、数据源、同步、后端采集逻辑。
  - 没有修改管理员账号、同步 Token、Cookie、API Key 或云服务器专用配置。
- 云端验证：
  - `/kpl` 返回 200。
  - `/kpl` 页面已包含 `account-admin-link` 和 `account-logout-btn`。
  - `/admin` 返回 200。
  - 云端 `kpl-dashboard_17_apple.html` 通过 UTF-8/乱码检查。

### 2026-06-21 补充：注册邮箱验证和行情页访问权限

- 调整位置：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - `C:\PandaDashboard\panda-admin.html`
- 注册规则：
  - 主页注册必须填写账号、邮箱、手机号、密码、邮箱验证码。
  - 手机号和邮箱改为注册必填。
  - 密码至少 8 位。
  - 密码不能是纯数字。
  - 密码不能是纯字母。
  - 注册前必须先请求邮箱验证码，再用验证码完成注册。
- 后端新增接口：
  - `POST /api/auth/register/request-code`
  - 验证码默认 15 分钟有效。
  - 如果云端未配置 SMTP，验证码邮件写入后台 outbox；配置 SMTP 后可真实发信。
- 行情页权限：
  - 未登录用户可以打开行情页外壳，但不能查看策略看板数据和涨停复盘数据。
  - 未登录访问策略看板或涨停复盘时，页面显示登录/注册提示，不再继续加载对应数据。
  - 已注册登录用户和管理员可以查看策略看板和涨停复盘。
- 管理后台：
  - 登录记录筛选增加“注册验证码”类型。
- 云端验证：
  - `/health` 返回 200。
  - `/qi-home.compiled.js` 返回 200，包含注册验证码接口和验证码输入逻辑。
  - `/kpl` 返回 200，包含登录门槛卡片和需要登录的导航标记。
  - `/admin` 返回 200，包含 `register-code` 登录记录筛选项。
  - 注册验证码接口测试：
    - 纯数字密码返回 400：`password cannot be only numbers`。
    - 纯字母密码返回 400：`password cannot be only letters`。
    - 合规注册信息请求验证码返回 200；当前云端 `smtpConfigured=false`，验证码进入后台 outbox。
    - 错误验证码注册返回 400：`invalid email verification code`。
  - 云端以下文件通过 UTF-8/乱码检查：
    - `kpl-stats-server.js`
    - `kpl-dashboard_17_apple.html`
    - `panda-admin.html`
    - `Qi\qi-home.compiled.js`

### 2026-06-21 补充：后台配置验证码发信邮箱

- 调整位置：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\panda-admin.html`
- 新增后台入口：
  - 管理后台 `/admin`
  - 进入“同步”页
  - 新增“验证码发信邮箱”配置卡片
- 可配置字段：
  - SMTP 服务器
  - 端口
  - 安全连接方式
  - SMTP 用户名
  - 邮箱授权码/密码
  - 发件人地址
  - 测试收件邮箱
- 新增后端接口：
  - `GET /api/auth/admin/smtp-config`
  - `POST /api/auth/admin/smtp-config`
- 保存位置：
  - `C:\PandaDashboard\panda-mail-config.json`
  - 该文件只保存在当前机器，已加入本机专用清单，不参与前端、数据库或后端程序同步。
- 生效范围：
  - 注册邮箱验证码
  - 忘记密码邮箱验证码
- 行为规则：
  - 配置成功后，验证码会尝试真实发送到用户邮箱。
  - 如果未配置或 SMTP 发送失败，系统仍会把验证码写入后台 outbox，便于管理员排查。
  - 保存配置时密码/授权码不回显；再次保存时留空可保留原授权码。
- 云端验证：
  - `/health` 返回 200。
  - `/admin` 返回 200，页面包含“验证码发信邮箱”。
  - 未登录访问 `/api/auth/admin/smtp-config` 返回 403。
  - 未配置 SMTP 时，请求注册验证码返回 200，`delivery=outbox`，`smtpConfigured=false`。
  - 云端 `kpl-stats-server.js` 和 `panda-admin.html` 通过 UTF-8/乱码检查。

### 2026-06-22 补充：修复涨停复盘数据源健康同步未补同花顺/韭研

- 问题现象：
  - 行情页“涨停复盘”中，数据源健康点击“同步”后，同花顺和韭研来源页签没有自动补齐当天收盘后的底层来源数据。
- 调整位置：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 后端修复：
  - `mode=missing` 的主因库同步流程改为先补齐来源底层文件，再决定是否重建综合主因库。
  - 即使旧综合主因库已经看起来完整，也会先检查并补齐 `复盘啦、韭研、选股宝、同花顺` 四个来源底层文件。
  - 当某个来源文件本次被补齐后，会强制重建当天综合主因库，避免新增来源证据没有进入综合归纳。
  - 后端现在支持 `day=` 参数；如果前端传入日期，就按该日期向前扫描 30 个交易日，而不是总是改用服务端自行判断的最新交易日。
- 前端修复：
  - 行情页数据源健康的“同步”按钮调用 `/api/limit-up-main-reason-db/sync?mode=missing` 时，追加当前页面日期 `day=${state.date}`。
  - 这样用户在某一天的涨停复盘页点击同步，会补齐该日期及向前 30 个交易日的来源底层库。
- 云端部署：
  - 部署前备份目录：`C:\PandaDashboard\backups\codex-fix-20260622-220216`
  - 部署后通过计划任务 `Panda Dashboard Server` 重启后端。
- 云端验证：
  - `node --check kpl-stats-server.js` 通过。
  - `/kpl` 返回 200。
  - `2026-06-22` 来源页签已恢复：
    - 综合归纳：134
    - 复盘啦：132
    - 选股宝：132
    - 同花顺：132
    - 韭研：134
  - 同花顺来源模式为 `official-limit-up-pool-json`。

### 2026-06-22 补充：复盘啦来源增加防串日校验

- 问题现象：
  - 开盘后进入“涨停复盘”，复盘啦可能已经出现数据，但内容实际是上一交易日的数据。
  - 风险是复盘啦公开页或接口在当天未收盘前仍返回上一交易日内容，系统不应该把它保存成当天来源库。
- 调整位置：
  - `C:\PandaDashboard\kpl-stats-server.js`
- 后端修复：
  - `ensureKaipanlaFupanlaSourceDay()` 增加未收盘保护：当前交易日 15:00 前不允许抓取/保存复盘啦当天来源。
  - 增加 `kaipanlaFupanlaPayloadIssue()` 校验：
    - `payload.day` 必须等于请求日期。
    - `payload.latestDay` 如存在，也必须等于请求日期。
    - 当前交易日缓存文件必须是 15:00 后生成，15:00 前生成的当天复盘啦缓存不再视为有效。
    - 必须有非 ST 行数据。
  - 历史接口返回日期不一致时，直接报错，不再写入来源库。
- 云端部署：
  - 部署前备份目录：`C:\PandaDashboard\backups\codex-fix-fupanla-dayguard-20260622-222245`
  - 通过计划任务 `Panda Dashboard Server` 重启后端，公网监听恢复为 `0.0.0.0:8765`。
- 云端验证：
  - `/kpl` 返回 200。
  - `2026-06-22` 复盘啦来源仍正常：132 条。
  - `2026-06-19` 休市日返回 `holiday`，复盘啦不显示错误数据。

### 2026-06-30 补充：策略页重点关注接入 L2 分批扫描框架

- 需求口径：
  - “重点关注”按板块处理，先取板块成分股实时涨幅快照排序。
  - L1 只用于排序；L2 只用于逐笔成交主动/被动买卖统计。
  - 扫描顺序固定为开始扫描时的涨幅排名，第一批 1-50，第二批 51-100，后续继续按快照顺序。
  - 每批最多 50 个 `trans/{code}` 订阅；默认每批结束后断开并用 `clean session` 清理旧订阅，再进入下一批。
- 调整位置：
  - `C:\PandaDashboard\l2-focus-scanner.js`
  - `C:\PandaDashboard\strategy-backend.js`
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - `C:\PandaDashboard\panda-l2-config.example.json`
  - `C:\PandaDashboard\package.json`
  - `C:\PandaDashboard\package-lock.json`
- 后端新增：
  - 新增 L2 扫描器，支持任务队列、50 只一批、每分钟最多 3 次订阅动作、`clean session` 重连清理。
  - 新增接口：
    - `GET /api/strategy/focus-l2-scan` 查看 L2 配置/依赖状态。
    - `POST /api/strategy/focus-l2-scan` 管理员启动重点板块 L2 扫描任务。
    - `GET /api/strategy/focus-l2-scan?jobId=...` 查询扫描进度和结果。
  - L2 账号只从 `panda-l2-config.json` 或环境变量读取，不写入前端或日志。
- 前端调整：
  - 重点关注卡片的按钮改为“L2扫描”。
  - 强势板块不显示 L2 扫描按钮，避免误触发。
  - 扫描中显示批次和已扫数量；结果明细显示主动买、被动买、主动卖、被动卖、净主动、涨幅排名、扫描批次。
- 云端部署：
  - 部署前备份目录：`C:\PandaDashboard\backups\l2-focus-scan-20260630-141512`
  - 云端安装 `mqtt` 依赖后，通过计划任务 `Panda Dashboard Server` 重启后端。
- 云端验证：
  - `/health` 返回 200。
  - `GET /api/strategy/focus-l2-scan` 返回 `dependencyReady=true`、`configured=false`，说明依赖已就绪但正式 L2 账号尚未配置。
  - `/kpl` 页面包含“L2扫描”和 `/api/strategy/focus-l2-scan`，旧的“统计算法待定义后接入”说明已移除。

### 2026-06-30 补充：L2 测试账号连通验证

- 调整：
  - 修复 `panda-l2-config.json` 在 Windows UTF-8 BOM 下无法读取的问题。
  - 根据实测推送格式补充 `trans/{code}` CSV 解析：`code, B/S/C, time, seq, price*10000, volume, buyNo, sellNo`。
  - `B/S` 计入主动买/主动卖；`C` 作为非成交/撤单类消息，不再误算成未知大额成交。
- 测试配置：
  - 本地和云端均临时写入 L2 测试账号配置，账号密码未写入源码、前端或日志。
  - 测试扫描窗口设为 12 秒。
- 云端验证：
  - `/health` 返回 200。
  - `GET /api/strategy/focus-l2-scan` 返回 `dependencyReady=true`、`configured=true`。
  - 云端直连短扫 `300750`、`688111` 成功收到 L2 消息并区分主动买卖。
  - 样例结果：`300750` 在短窗口内 `activeBuy=2048909`、`activeSell=275758`、`ratio=7.43`，被筛出。

### 2026-06-30 补充：修复策略页 L2 扫描点击无反应

- 问题现象：
  - 策略页重点关注卡片点击“L2扫描”后，普通登录用户没有明显反馈。
- 原因：
  - 前端策略页只要求账号登录，但后端 `POST /api/strategy/focus-l2-scan` 初版要求管理员权限。
  - 普通登录用户点击后被 403 拦截，看起来像没有反应；这与 `clean session` 无关。
- 修复：
  - 后端启动 L2 扫描改为“已登录即可”，未登录仍返回 `login required`。
  - 前端在 L2 启动失败或未接入时，在卡片内显示具体说明，不再只显示一个小标签。
- 云端验证：
  - `/health` 返回 200。
  - `GET /api/strategy/focus-l2-scan` 返回 `configured=true`。
  - 未登录 `POST /api/strategy/focus-l2-scan` 返回 403 `login required`。
  - `/kpl` 页面包含“L2扫描”和“L2扫描启动失败”前端说明文本。

### 2026-06-30 补充：修复 L2 扫描瞬间显示无入选

- 问题现象：
  - 使用 `panda` 账号登录后点击“L2扫描”，页面瞬间显示“L2无入选”，不符合真实扫描耗时。
- 原因：
  - 前端启动扫描时只传了 `plateId`，没有传 `zsType`。
  - 后端在当前策略板块池里找不到某些重点关注板块时，无法判断它属于东财/同花顺/KPL，导致成分股列表为空，任务立即结束。
- 修复：
  - 前端按钮增加 `data-zs-type` 和板块名，启动 L2 时一起提交。
  - 后端从三个来源兜底确定板块类型：实时板块池、重点关注文件、前端提交参数。
  - 成分股为空时页面明确显示“成分股为空”，不再误显示“L2无入选”。
- 验证：
  - 云端重点关注 `BK1175 玻璃基板` 为东财板块 `zsType=6`。
  - 云端 `/api/eastmoney-concepts/stocks?plateId=BK1175` 返回 41 只实时成分股，并带涨幅。
  - `/kpl` 页面已包含 `data-zs-type`、`成分股为空` 和 `L2扫描` 新逻辑。

### 2026-06-30 补充：修正 L2 明细主动/被动口径

- 问题现象：
  - L2 明细里出现“主动买”和“被动卖”金额完全相同，容易被误解为两个独立指标。
- 原因：
  - 初版用逐笔成交 `B/S` 方向时，把成交对手方也同步记为“被动卖/被动买”。
  - 在逐笔成交里，一笔主动买成交的对手方天然是等额卖方，因此这样展示会形成镜像重复，不适合作为独立信号。
- 修复：
  - `B` 只计入主动买金额和主动买笔数。
  - `S` 只计入主动卖金额和主动卖笔数。
  - `C` 作为撤单/非成交类消息，不计入成交金额。
  - 页面明细移除“被动买/被动卖”，改为主动买、主动卖、净主动、主动买笔、主动卖笔、撤单/非成交、涨幅排名、扫描批次。
- 云端验证：
  - `/health` 返回 200。
  - `/kpl` 页面已不包含“被动买/被动卖”字样。
  - `/kpl` 页面包含“主动买笔”和“L2逐笔B/S成交”。

### 2026-06-30 补充：被动买卖改为挂单订单号累计口径

- 口径修正：
  - 主动买/主动卖继续按逐笔成交 `B/S` 方向统计，且单笔成交金额需达到当前阈值。
  - 被动买/被动卖不再使用成交对手方镜像金额。
  - `S` 主动卖成交时，按 `buyNo` 累计被动买挂单的成交金额；同一个 `buyNo` 累计达到阈值后计入被动买。
  - `B` 主动买成交时，按 `sellNo` 累计被动卖挂单的成交金额；同一个 `sellNo` 累计达到阈值后计入被动卖。
  - 这样可以覆盖“一个大挂单被多笔低于阈值的小主动单逐步吃掉”的情况。
- 前端调整：
  - 明细恢复显示被动买、被动卖。
  - 新增被动买单、被动卖单数量。
  - 明细说明改为：主动按单笔阈值统计；被动按同一挂单订单号累计阈值统计。
- 验证：
  - `/health` 返回 200。
  - `/kpl` 页面包含“被动买单”和“被动按同一挂单订单号累计”。
  - `/api/strategy/focus-l2-scan` 返回 `configured=true`。

### 2026-06-30 补充：L2 明细仅保留四类买卖金额

- 调整：
  - 用户确认不需要展示笔数、订单数、净主动、涨幅排名、扫描批次等辅助字段。
  - L2 明细只展示四类金额：主动买、被动买、主动卖、被动卖。
  - 保留一行口径说明：主动按单笔阈值统计；被动按同一挂单订单号累计阈值统计。
- 验证：
  - 本地和云端 `/kpl` 页面均包含主动买、被动买、主动卖、被动卖。
  - 本地和云端 `/kpl` 页面均不再包含净主动、主动买笔、被动买单、扫描批次等辅助字段。

### 2026-06-30 补充：L2 一次扫描同时统计 50万/500万

- 调整：
  - L2 扫描窗口内保留 50 万以上主动成交明细；主动买/卖按单笔成交金额分档统计。
  - 被动买/卖继续按同一个挂单订单号累计，且累计时包含低于 50 万的小成交，避免漏掉被多笔小单吃掉的大挂单。
  - 每次扫描结算时同时输出 `thresholds.500000` 和 `thresholds.5000000` 两组结果。
  - 页面展开明细改为两组展示：`≥50万`、`≥500万`，每组只显示主动买、被动买、主动卖、被动卖四个金额。
- 验证：
  - 本地 `node --check l2-focus-scanner.js` 通过。
  - 本地 HTML 内联脚本解析通过。
  - 本地 `/kpl` 返回页面已包含 `≥50万`、`≥500万` 和被动挂单累计说明。
  - 云端已备份并上传 `l2-focus-scanner.js`、`kpl-dashboard_17_apple.html`，通过计划任务重启服务。
  - 云端 `/health` 返回正常，`/kpl` 返回页面已包含 `≥50万`、`≥500万` 和被动挂单累计说明。

### 2026-06-30 补充：手工同步 TGB 湖南人 6.30 涨停复盘

- 来源确认：
  - TGB 文章：`https://www.tgb.cn/a/2t3hhE3rtQY`
  - 使用的正式图片：`https://image.tgb.cn/img/2026/06/30/zu8alkftgohl.png_max.png`
  - 只使用 `@TGB湖南人` 图；没有使用同花顺数据可视化图，也没有使用 OCR 作为正式底层库。
- 入库口径：
  - 原图顶部 `市场连板股 19只 306亿` 是重复汇总区，不写入正式来源行。
  - 原图底部 `涨停炸板 25只 999亿` 不属于涨停主因底层库，不写入。
  - 正式写入从 `半导体 29只 484亿` 开始，到 `其他个股` 结束。
- 写入结果：
  - 云端文件：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-06-30.json`
  - TGB 底层库总数：138 行，无重复代码。
  - 板块数量：半导体 29、存储 7、机器人 27、商业航天 10、算力+数据中心 10、大消费 8、光通信 8、玻璃基板 6、AI硬件 4、锂电池 4、液冷服务器 4、其他热点 12、其他个股 9。
- 云端操作：
  - 写入前备份目录：`C:\PandaDashboard\backups\tgb-hunan-20260630-manual-20260630-204944`
  - 备份后上传新的 TGB 结构化底层库，并执行 6.30 单日综合主因库重建。
- 验证：
  - 后端重建返回 `rebuilt=1`，综合主因库 `count=140`。
  - `/api/limit-up-main-reason-db/source-view?day=2026-06-30&force=1` 返回正常。
  - 来源标签数量：综合归纳 140、复盘啦 138、选股宝 139、韭研 140、淘股吧 138。

### 2026-06-30 补充：修正 6.30 四个涨停复盘来源数量不一致

- 问题：
  - 6.30 来源标签数量不一致：复盘啦 138、选股宝 139、韭研 140、淘股吧 138。
  - 差异股票只有 3 只：`001399 C惠科`、`000004 国华退`、`002808 恒久退`。
  - 其中 `C惠科` 属于 C 字头新股/无完整主因样本；`国华退`、`恒久退` 属于退市整理期，不应进入涨停主因底层库。
- 修复：
  - 后端统一复盘排除规则扩展为：北交所、ST、退市/名称以“退”结尾、C/N 新股前缀均不进入涨停复盘来源层和综合层。
  - 修复位置：`C:\PandaDashboard\kpl-stats-server.js`
  - 写入前后端备份目录：`C:\PandaDashboard\backups\source-count-filter-20260630-210335`
  - 韭研 6.30 源文件也物理清理为 138 行，备份目录：`C:\PandaDashboard\backups\jyg-20260630-filter-20260630-210820`
- 重建与验证：
  - 强制重建 6.30 综合主因库，结果 `count=138`。
  - `/health` 正常。
  - `/api/limit-up-main-reason-db/source-view?day=2026-06-30&force=1` 验证：综合归纳 138、复盘啦 138、选股宝 138、韭研 138、淘股吧 138。
  - 四个来源代码集合完全一致：union=138，intersection=138。
  - 实际源文件验证：`xuangubao-limit-up`、`jiuyangongshe-structured`、`tgb-hunan-structured`、`kaipanla-fupanla` 的 6.30 文件均为 138 行，且无 `C` 新股/退市整理异常行。

### 2026-06-30 补充：综合主因 v12 增加“四源分歧时按细分原因再判定”

- 需求：
  - 当复盘啦、选股宝、韭研、淘股吧四个来源给出的主因板块不一致时，不能直接采用某一个来源。
  - 先统计四源的细分涨停原因里是否有一致项。
  - 细分原因一致时，还必须能和至少一个来源的涨停卡片板块对应上，才归入该具体板块。
  - 如果主因板块无一致、细分原因也无可验证一致，则该股归入 `其他`。
- 修复：
  - 后端综合主因规则从 `multi-source-main-reason-v11` 升级为 `multi-source-main-reason-v12`。
  - 修改位置：`C:\PandaDashboard\kpl-stats-server.js`
  - 写入前备份目录：`C:\PandaDashboard\backups\main-reason-detail-consensus-20260630-211448`
  - 聚合逻辑新增三层判断：
    1. 来源板块有 2 个及以上来源一致，按板块共识。
    2. 来源板块无共识时，用细分涨停原因做 2 源及以上共识，并要求该细分能匹配至少一个来源的涨停卡片板块。
    3. 仍无共识时，降级为 `其他`，置信度降为低置信。
- 6.30 重建验证：
  - 强制重建 6.30 综合主因库，结果 `count=138`，规则版本 `multi-source-main-reason-v12`。
  - `/health` 正常。
  - `/api/limit-up-main-reason-db/source-view?day=2026-06-30&force=1` 验证：综合归纳 138、复盘啦 138、选股宝 138、韭研 138、淘股吧 138。
  - v12 下 6.30 有 7 只股票通过“细分原因共识 + 卡片板块匹配”归入具体板块，有 6 只股票因无有效共识归入 `其他`。

### 2026-06-30 补充：策略页隐藏单独“强势板块”区

- 需求：
  - 用户判断策略页里单独的“强势板块”区可以不需要。
  - 现阶段保留“今日热点榜”和“强势板块共振榜”，因为共振榜已经承担了“板块强 + 涨停主因一致”的交叉验证作用。
- 修改：
  - 前端文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 页面不再渲染策略页中间的单独 `强势板块` section，也不再生成 `strongBody`。
  - 后端 `/api/strategy/today`、`/api/strategy/snapshot` 仍可返回 `strong` 数据，暂不删除，以免影响快照、后续恢复或其他引用。
  - “重点关注”、“QI 龙头作战室”、“今日热点榜”、“强势板块共振榜”、“题材校准”均保留。
- 备份：
  - 上传前备份目录：`C:\PandaDashboard\backups\strategy-no-strongboards-20260630-213709`
- 验证：
  - 远端文件检查：仍包含 `今日热点榜`、`强势板块共振榜`、`重点关注`。
  - `/kpl` 页面请求验证：不存在 `const strongBody` 和 `🔥 强势板块` 单独区块。

### 2026-06-30 补充：今日热点榜卡片显示“近15交易日主因Top2”

- 需求：
  - 策略页 `今日热点榜` 每张题材卡片，除了当天涨停龙头外，增加显示最近 15 个交易日里，该题材作为最终涨停主因出现次数最多的 2 只股票。
- 后端修改：
  - 文件：`C:\PandaDashboard\kpl-stats-server.js`
  - 接口：`/api/limit-up-main-reason-db/hot-themes`
  - 新增 `buildHotThemeRecentTopStocks(endDay, themes, 15, 2)`：
    - 使用 `getRecentTradingDays()` 回看最近 15 个交易日，自动避开周末/非交易日。
    - 只读取已保存的综合主因库，不额外抓外部源。
    - 按 `finalBoardTopic` 与今日热点卡片题材精确一致统计。
    - 每个题材返回 `recentTopStocks`，包含 `code/name/count/days/latestDay/latestLianban/maxLianban/latestDetail`。
  - 接口响应新增 `recentDays`、`recentWindow`。
- 前端修改：
  - 文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 今日热点榜卡片新增一行：`近15交易日主因Top：股票A 5次 / 股票B 4次`。
  - 保留原来的当天涨停龙头行。
- 备份：
  - 上传前备份目录：`C:\PandaDashboard\backups\hot-theme-recent-top2-20260630-214220`
- 启动方式补充：
  - 这次重启时发现直接从 SSH 启动 Node 进程会随 SSH 会话结束而退出，导致外部访问短暂 502。
  - 已创建/更新 Windows 计划任务：`Panda Dashboard Server`
  - 计划任务动作：`C:\PandaDashboard\run-kpl-stats-server.cmd`
  - 运行用户：`SYSTEM`
  - 用途：云服务器开机或手动运行任务时启动 `kpl-stats-server.js`，避免依赖 SSH 会话。
- 验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 语法通过。
  - `/health` 返回 `{ ok: true }`。
  - `/api/limit-up-main-reason-db/hot-themes?day=2026-06-30` 返回 `recentWindow=15`，样例：
    - `半导体`：`华亚智能 5次`、`昊华科技 5次`
    - `人形机器人`：`天娱数科 4次`、`威派格 3次`
  - `/kpl` 页面文件中已包含 `.rht-recent` 样式和 `近${recentWindow}交易日主因Top` 模板。

### 2026-06-30 补充：策略页隐藏 QI 作战室，强势共振改为严格主因对齐

- 需求：
  - 用户认为 `QI 龙头作战室` 当前效果不好，先从策略页删除/隐藏。
  - 用户指出 `强势板块共振` 口径错误：例如 `AI PC` 卡片里出现 `TCL科技`，但 TCL 当日涨停主因是 `玻璃基板封装`，不是 AI PC。
- 前端修改：
  - 文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 策略页不再渲染 `renderStrategyQiWarRoom(entry.data || {})`，页面不再显示 `QI 龙头作战室` 区块。
  - 保留“今日热点榜”、“强势板块共振榜”、“重点关注”等其他策略内容。
- 后端修改：
  - 文件：`C:\PandaDashboard\kpl-stats-server.js`
  - 接口：`/api/strong-board-resonance`
  - 新增严格对齐函数：
    - `strategyResonanceTopicKey(raw)`
    - `strategyBoardTopicAligned(boardName, mainTheme)`
  - 强势共振新口径：
    1. 板块仍需满足涨停家数 >= 2 且净流入 > 0。
    2. 个股最终主因必须有 `strong` 或 `majority` 共识。
    3. 个股 `finalBoardTopic` 必须和板块名称映射到同一标准题材。
    4. 每张共振卡片至少需要 2 只主因对齐的涨停股才展示。
  - `getStrongThemeMap()` 同步改为严格对齐，避免股票详情里的“强势”标也被宽松主导题材污染。
- 备份：
  - 上传前备份目录：`C:\PandaDashboard\backups\strategy-resonance-strict-no-qi-20260630-215911`
- 验证：
  - `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - `/health` 返回 `{ ok: true }`。
  - `/api/strong-board-resonance?day=2026-06-30` 严格口径下返回 `strongCount=3`。
  - 6/30 剩余共振板块：
    - `共封装光学(CPO)` -> `光模块`，11 只坐实。
    - `MCU芯片` -> `半导体`，3 只坐实。
    - `机器人执行器` -> `人形机器人`，5 只坐实。
  - `AI PC` 不再出现在强势共振结果里，`TCL科技` 不再被错误归入 AI PC 共振。

### 2026-06-30 补充：策略页视觉优化，未改业务逻辑

- 需求：
  - 用户希望把行情页里的 `策略` 页面设计得更清楚、干净、美观一点。
  - 明确要求：不要动逻辑。
- 修改：
  - 文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - 仅调整前端展示结构和 CSS：
    - 顶部标题从 `候选板块` 改为 `策略看板`。
    - 新增 `strategy-signal-grid`，把 `今日热点榜` 和 `强势板块共振榜` 放进双栏信号区；移动端自动变单栏。
    - 优化顶部策略控制区、热点卡片、共振卡片、重点关注卡片、L2 按钮、底部说明条的间距、边框、层级和响应式表现。
    - 保留原来的 `strategy-hot-themes`、`strategy-strong-resonance` DOM id，接口加载逻辑不变。
  - 未修改：
    - 未修改 `kpl-stats-server.js`。
    - 未修改任何策略筛选、热点统计、强势共振、L2 扫描、题材校准逻辑。
    - 未恢复已隐藏的 `QI 龙头作战室` 和单独 `强势板块`。
- 备份：
  - 上传前备份目录：`C:\PandaDashboard\backups\strategy-page-visual-polish-20260630-220737`
- 验证：
  - `/health` 返回 `{ ok: true }`。
  - `/kpl` 页面返回内容包含 `strategy-signal-grid` 和新视觉样式标记 `Strategy page visual polish 2026-06-30`。
  - 页面返回内容中不存在旧的 `renderStrategyQiWarRoom(entry.data` 和单独 `🔥 强势板块` 渲染。
### 2026-06-30 补充：策略页 Figma 风格视觉再优化，未改业务逻辑

- 需求：
  - 用户通过 Figma 插件要求继续优化行情页里的 `策略` 页面视觉。
  - 明确要求：页面更好看、更清楚、更干净；不要改逻辑。
- Figma 处理：
  - 已创建 Figma 设计文件：
    - `https://www.figma.com/design/twVqAE0wuhugv9MlIIO1dO`
  - 创建文件后，Figma MCP 返回 Starter 计划调用额度已用完，无法继续把可编辑稿写入画布。
  - 因此本次实际落地在云端网页前端文件，按 Figma 风格做视觉层优化。
- 修改位置：
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 修改内容：
  - 新增 `Strategy page Figma polish 2026-06-30` 样式块，全部使用 `body.view-strategy` 前缀限制在策略页内。
  - 优化策略页顶部区域、日期/阈值控制区、今日热点榜、强势板块共振榜、重点关注卡片、L2 扫描按钮和说明条的间距、边框、层级、响应式表现。
  - 给重点关注 section 增加 `strategy-focus-section` class，便于单独排版。
  - 今日热点榜和强势板块共振榜仍保留原来的 DOM id：
    - `strategy-hot-themes`
    - `strategy-strong-resonance`
  - 未恢复已隐藏的 `QI 龙头作战室`。
  - 未恢复单独的 `强势板块` 区块。
- 未修改内容：
  - 未修改 `kpl-stats-server.js`。
  - 未修改策略筛选、今日热点统计、强势共振统计、L2 扫描、题材校准、账号权限、同步逻辑。
  - 未修改任何数据库、Token、Cookie、API Key 或云服务器专用配置。
- 云端备份：
  - `C:\PandaDashboard\backups\strategy-page-figma-polish-20260630-222711`
- 验证：
  - `/health` 返回 `{"ok":true}`。
  - 云端文件与公网 `/kpl` 返回内容均包含：
    - `Strategy page Figma polish 2026-06-30`
    - `strategy-focus-section`
    - `strategy-signal-grid`
  - 页面返回内容不包含旧的 `renderStrategyQiWarRoom(entry.data` 渲染入口。
  - 页面返回内容不包含单独 `🔥 强势板块` 渲染区。
  - 云端 HTML 内联脚本解析通过。
  - `/api/strong-board-resonance?day=2026-06-30` 仍返回 `ok=true`，说明后端业务接口未受影响。
- 备注：
  - 本地尝试用 Playwright 截图时，依赖包存在但浏览器执行文件未安装，所以没有生成截图；本次以脚本解析、公网页面内容和接口健康作为验证。

## 2026-06-30 晚：策略页新增“今日主线榜”与龙头综合判断

本次在云端直接修改并部署：
- 后端：`C:\PandaDashboard\kpl-stats-server.js`
- 前端：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端备份：`C:\PandaDashboard\backups\strategy-mainline-20260630-224116`

主要变更：
1. 新增策略页接口：`GET /api/strategy-mainlines?day=YYYY-MM-DD`。
2. “今日主线榜”不替代底层明细，而是综合已有数据：今日热点主因、强势板块共振、近 15 个交易日题材活跃度、题材净流入。
3. 新增“今日龙头”综合评分：连板高度为高权重；板块共振、多源主因一致、近 15 日辨识度、今日涨幅作为加分；首封时间只作为小幅辅助和同分排序，不把“谁先涨停”当作龙头定义。
4. 策略页视觉优化：在策略页第一信号区新增“今日主线榜”卡片，原“今日热点榜”和“强势板块共振榜”保留为下方明细；新增 CSS 标记 `Strategy mainline board 2026-06-30`。
5. 发现计划任务实际启动 `C:\PandaDashboard\run-kpl-stats-server.cmd`，cmd 内部会 `cd /d "%~dp0"`，所以入口仍是 `C:\PandaDashboard\kpl-stats-server.js`。重启脚本避免使用 PowerShell 特殊变量 `$pid`，改用 `$ownerPid`。

验证结果：
- `node --check C:\PandaDashboard\kpl-stats-server.js`：通过。
- `http://124.222.188.68:8765/health`：`{"ok":true}`。
- `http://124.222.188.68:8765/kpl`：已包含 `strategy-mainlines`、`/api/strategy-mainlines`、`今日主线榜`、`Strategy mainline board 2026-06-30`。
- `GET /api/strategy-mainlines?day=2026-06-30`：返回 `ok=true`，`count=10`，`stockCount=138`。
- 2026-06-30 主线榜前五示例：
  - 1 半导体：今日龙头 兴业股份，依据 3连板。
  - 2 人形机器人：今日龙头 昊志机电，依据 板块共振、4源高度一致。
  - 3 光模块：今日龙头 锐捷网络，依据 板块共振、4源高度一致。
  - 4 大消费：今日龙头 勤上股份，依据 2连板。
  - 5 商业航天：今日龙头 魅视科技，依据 2连板。

给公司主机同步提醒：
- 这次既改了前端页面，也改了后端接口逻辑。公司端要获得“今日主线榜”，不能只同步数据库，需要同步前端网页和后端程序文件。
- 同步后建议检查 `/api/strategy-mainlines?day=当天日期` 是否返回 `ok=true`，再打开行情页策略板块确认“今日主线榜”显示。

## 2026-06-30 晚：今日主线榜补充板块涨幅、资金与10日涨幅主因股

本次在云端直接修改并部署：
- 后端：`C:\PandaDashboard\kpl-stats-server.js`
- 前端：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端备份：`C:\PandaDashboard\backups\strategy-mainline-metrics-20260630-230356`

主要变更：
1. `GET /api/strategy-mainlines` 新增字段：
   - `boardGainPct`：该主因对应看板板块中的最高板块涨幅。
   - `boardGainName`：贡献该涨幅的板块名。
   - `netInflowBoard`：贡献主线资金流入的板块名。
   - `topGainStocks`：该主因题材下近 10 日涨幅前列股票，默认最多 5 只。
   - `gainBaseDay`：10 日涨幅计算基准日。
2. “活跃”口径保持为：近 15 个交易日内，同一最终主因题材在涨停主因库中反复出现的次数排行；前端显示为“活跃15日”，并加鼠标提示说明。
3. “10日涨幅”与“活跃”拆开：
   - 活跃：看主因反复出现次数。
   - 10日涨幅：看该主因题材下股票近 10 个交易日价格涨幅。
4. 前端主线卡片顶部调整：把“板块涨幅”和“资金”小指标放到“主线分”左侧。
5. 近10日涨幅计算使用本地收盘价库 `eastmoney-close-db`，不调用慢速逐股行情接口。

验证结果：
- `node --check C:\PandaDashboard\kpl-stats-server.js`：通过。
- `/health` 返回 `{"ok":true}`。
- `/kpl` 已包含 `ml-scoreline`、`ml-score-pill`、`活跃15日`、`10日涨幅`。
- `/api/strategy-mainlines?day=2026-06-30` 返回 `ok=true`、`count=10`、`stockCount=138`。
- 2026-06-30 示例：
  - 半导体：`boardGainPct=5.62`，`boardGainName=汽车芯片`，`netInflow=31782000000`，`topGainStocks` 返回 5 只。
  - 人形机器人：`boardGainPct=5.88`，`boardGainName=机器人执行器`，`netInflowBoard=机器人执行器`，`topGainStocks` 返回 5 只。
  - 光模块：`boardGainPct=8.02`，`boardGainName=3D摄像头`，`netInflowBoard=共封装光学(CPO)`，`topGainStocks` 返回 5 只。

给公司主机同步提醒：
- 本次仍属于前端页面 + 后端接口逻辑变更，必须同步前端网页和后端程序文件；只同步数据库不会出现新的主线榜字段和页面样式。

## 2026-07-01 晚：恢复 TGB 湖南人复盘原始证据同步入口

本次在云端直接处理 TGB 湖南人复盘同步问题。

修改文件：
- `C:\PandaDashboard\kpl-stats-server.js`

云端备份：
- `C:\PandaDashboard\backups\tgb-sync-restore-20260701-215238`

修改内容：
1. 恢复 `--tgb-hunan-raw-evidence` 命令行入口，用于只抓淘股吧湖南人原文和图片，不写 OCR/半成品数据。
2. 将后台 review source artifact 的 `tgb` 分支从“disabled-source”改为走 `ensureTgbHunanStructuredArtifactDay()`。
3. 将 `--tgb-vision-sync` 从旧的 Qwen 覆盖路径切换到新的 source-structurer 结构化通道。
4. 未启用旧 Qwen 覆盖路径；不会把低质量识别结果写入正式 TGB 底层库。

本次同步结果：
- 已抓到 2026-07-01 文章：`https://www.tgb.cn/a/2t4TRmvkaMo`
- 标题：`7.1湖南人涨停复盘+晚间消息汇总`
- 已保存原始证据：1 篇文章、16 张图片。
- 主要复盘长图已保存到：
  - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-01\image-01-06.png`
- 后台标准 raw manifest 已生成，`--tgb-hunan-raw-evidence --day=2026-07-01 --days=1 --force` 返回成功。

未完成项：
- 2026-07-01 的 `tgb-hunan-structured\2026-07-01.json` 尚未生成。
- 原因：云端未配置 `C:\PandaDashboard\source-structurer-config.json`，新的 TGB 视觉结构化通道返回：`TGB vision structurer is not configured`。
- 临时试跑旧 Qwen 路径被安全闸拒绝：只识别出 92 行中的 82 行，命中率 89.1%，未写入正式库，未污染数据库。

后续要真正入库：
- 需要在后台配置 source-structurer 的兼容视觉模型接口，或提供人工校验后的结构化文件：
  - `C:\PandaDashboard\tgb-hunan-manual-structured\2026-07-01.json`
  - 或 `C:\PandaDashboard\tgb-2026-07-01-structured-source.json`
- 配置完成后重新运行 TGB 结构化同步，校验通过才会写入 `kpl-limitup-main-reason-sources\tgb-hunan-structured` 并折入综合主因库。

验证：
- `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
- `/health` 返回 `{"ok":true}`。

## 2026-07-01 晚：TGB 湖南人复盘同步与网站后台启动修复

- 已恢复云端网站服务对外访问：`http://124.222.188.68:8765/health` 和 `/kpl` 外网测试均返回 200。
- 发现原因：通过 SSH 远程会话直接后台启动 Node，SSH 断开后进程会被系统清理，导致 8765 停止服务。
- 已新增系统计划任务：`PandaDashboard-KPL-Server`，开机自动启动，运行用户 `SYSTEM`，不限制运行时长。
- 已新增启动脚本：`C:\PandaDashboard\run-kpl-stats-server-task.ps1`，固定以 `0.0.0.0:8765` 启动 `kpl-stats-server.js`。
- 已同步 TGB 湖南人 2026-07-01 原始证据：文章 `https://www.tgb.cn/a/2t4TRmvkaMo`，标题 `7.1湖南人涨停复盘+晚间消息汇总`。
- TGB 原始证据目录：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-01`，共 1 篇文章、16 张图片；主长图为 `image-01-06.png`。
- 当前未生成正式 TGB 结构化底层库：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-01.json` 不存在。
- 未入库原因：云端当前没有可用的 `source-structurer-config.json` 图片结构化识别配置。旧 Qwen 识别曾只命中 82/92，低于准确入库标准，因此未写入正式库，避免污染涨停主因库。
- 后续如要让 TGB 自动正式入库，需要在后台重新配置可靠的图片结构化服务，或提供人工校验后的结构化 JSON；配置前只保存 TGB 原文/原图证据，不写入综合主因库。

## TGB 湖南人复盘每日处理规则（固定日常流程）

以后每天处理 TGB 湖南人复盘，统一按这个流程，不再随意换方法：

1. 先确认云端网站服务正常：`/health` 返回 `{"ok":true}`，计划任务 `PandaDashboard-KPL-Server` 正在运行。
2. 等湖南人当天复盘文章发布后，先同步原始证据，不直接入库：
   - 文章 HTML、所有图片保存到：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\YYYY-MM-DD`
   - 每天要确认主涨停复盘长图已经保存。
3. 正式结构化底层库只允许写入这里：
   - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\YYYY-MM-DD.json`
4. 如果云端没有可用的图片结构化服务配置，TGB 只保存原文/原图，不写入正式结构化库。
5. 如果启用了图片结构化服务，必须做质量闸门：图片标注涨停总数、解析行数、匹配股票数必须基本一致；识别缺行、错股、漏板块时，不得写入正式库。
6. 不再使用低准确率 OCR 或旧 Qwen 结果强行入库。宁可保留“原始证据已保存、结构化待完成”，也不能污染涨停主因库。
7. 结构化成功后，再检查涨停复盘页面的 TGB 标签：TGB 数量、板块卡片、个股明细必须能展示。
8. 每次处理完成后，都要把当天结果写入本 MD：是否已保存原图、是否已正式入库、失败原因、是否影响综合主因库。

当前状态提醒：2026-07-01 已保存 TGB 原文/原图，但因云端未配置可靠图片结构化服务，尚未生成正式 `tgb-hunan-structured` 文件。

## 2026-07-01 晚：TGB 湖南人复盘 7月1日手动结构化入库完成

- 按用户说明，沿用此前“手动同步 TGB 湖南人复盘图”的方式，不使用低质量 OCR 强行入库。
- 原图来源：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-01\image-01-06.png`。
- 正式结构化文件已生成：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-01.json`。
- 总行数：149 行，与图片顶部“涨停149家”一致。
- 处理规则：顶部 `市场连板股` 是重复摘要，不作为单独板块入库；底部 `涨停炸板` 不入库。
- 板块数量校验：机器人25、半导体22、算力11、医疗医药11、大消费10、其他热点10、养殖9、其他个股9、大金融6、存储5、氟化工5、地产5、电力4、化工4、业绩增长4、电池产业链3、光通信3、商业航天3，合计149。
- 已更新 raw manifest 的 structured 状态。
- 页面接口验证：`/api/limit-up-main-reason-db/source-view?day=2026-07-01` 中 TGB 标签返回 `count=149`。
- `/health` 返回 `{"ok":true}`。

后续提醒：日常如果没有可靠自动结构化服务，TGB 当天复盘仍按“先同步原图，再手动结构化校验入库”的方式处理，不能把低命中识别结果直接写入主因库。

## 2026-07-01 22:47:24 策略页简约视觉优化
- 修改文件：C:\PandaDashboard\kpl-dashboard_17_apple.html
- 备份目录：C:\PandaDashboard\backups\strategy-visual-20260701-224309
- 改动性质：只追加/覆盖策略页 CSS 视觉样式，不改任何策略计算、L2扫描、日期切换、登录权限、接口和同步逻辑。
- 主要效果：策略页改为更简洁的深色工作台风格；统一候选板块卡片、QI 龙头作战室、强势热点、强势共振、输入框和 L2 扫描按钮的边框、间距和悬浮状态。
- 验证：云端 http://127.0.0.1:8765/health 返回 200，http://127.0.0.1:8765/kpl 返回 200。
- Figma：已创建文件 Panda 策略页面简约改版稿 2026-07-01，地址 https://www.figma.com/design/lhVS39GaUiWKWC8T5s98lD；本次写入设计画面时触发 Figma Starter 调用次数限制，网页实际样式已先完成。

## 2026-07-01 22:59:56 策略页第二轮舒适视觉优化
- 修改文件：C:\PandaDashboard\kpl-dashboard_17_apple.html
- 备份目录：C:\PandaDashboard\backups\strategy-comfort-20260701-225829
- 改动性质：继续仅调整策略页 CSS 视觉层，不改策略业务逻辑、L2扫描、日期/阈值控件、登录权限、接口和同步逻辑。
- 主要效果：降低纯黑和强边框压迫感；统一策略页背景、候选板块卡片、QI 龙头作战室、强势热点/强势共振、按钮和输入框；增加舒适留白、稳定卡片高度和更清晰的段落标题识别。
- 验证：云端 http://127.0.0.1:8765/health 返回 200，http://127.0.0.1:8765/kpl 返回 200，外网 http://124.222.188.68:8765/kpl 返回 200。

## 2026-07-01 23:07:42 策略页恢复到 6月30日晚最终结构
- 原因：用户发现当前策略页内容比 6月30日晚完成时多，检查确认云端前端文件已回到较早结构，重新出现 QI 龙头作战室 和单独 强势板块，且缺失 今日主线榜。
- 判断：这不是策略逻辑自动变回，而是 C:\PandaDashboard\kpl-dashboard_17_apple.html 曾被旧版前端覆盖；2026-07-01 22:47/22:59 的视觉优化是在这个旧结构上追加 CSS，所以看起来像“改完又变回”。
- 恢复来源：C:\PandaDashboard\backups\strategy-mainline-metrics-20260630-230356\kpl-dashboard_17_apple.html。
- 恢复前备份：C:\PandaDashboard\backups\strategy-restore-before-previous-20260701-230639。
- 恢复后状态：前端包含 今日主线榜、strategy-mainlines、strategy-signal-grid、strategy-focus-section；不包含 
enderStrategyQiWarRoom(entry...) 渲染入口和单独 🔥 强势板块。
- 验证：/health 返回 200，/kpl 返回 200，/api/strategy-mainlines?day=2026-06-30 返回 200，外网 /kpl 返回 200。
- 后续提醒：如果公司端或本地端再执行“前端网页同步到云端”，需要确认同步来源也是 6月30日晚之后的新结构，否则会再次把云端前端覆盖回旧结构。

## 2026-07-01 23:20:32 策略页恢复后舒适 UI 优化
- 修改文件：C:\PandaDashboard\kpl-dashboard_17_apple.html
- 备份目录：C:\PandaDashboard\backups\strategy-ui-comfort-after-restore-20260701-231942
- 前提：先确认策略页已恢复到 6月30日晚最终结构，包含 今日主线榜 和 strategy-signal-grid，不包含 
enderStrategyQiWarRoom(entry...) 和单独 🔥 强势板块。
- 改动性质：仅追加策略页 CSS 视觉优化块 Strategy page comfort polish after restore 2026-07-01，不改任何接口、策略计算、L2扫描、日期/阈值控件、账号权限或同步逻辑。
- 主要效果：主线榜、今日热点榜、强势板块共振榜、重点关注卡片统一成更柔和的深色工作台风格；弱化红色强调和重阴影；统一边框、按钮、输入框、指标块、留白和移动端表现。
- 验证：/health 返回 200，/kpl 返回 200，/api/strategy-mainlines?day=2026-06-30 返回 200，外网 /kpl 返回 200。文件检查：今日主线榜 存在，
enderStrategyQiWarRoom(entry...) 为 0，单独 🔥 强势板块 为 0。

## 2026-07-02 01:23:23 云端行情页视觉统一记录
- 文件：C:\PandaDashboard\kpl-dashboard_17_apple.html
- 备份：C:\PandaDashboard\backups\ui-natural-terminal-20260702-012147\kpl-dashboard_17_apple.html
- 本次仅追加 CSS 样式覆盖，标记为：Natural trading terminal polish 2026-07-02: visual only。
- 目标：让行情首页、涨停复盘、策略页更像专业看盘终端，降低 AI 模板感：减少大面积渐变、玻璃拟态、发光阴影和过圆卡片；统一卡片、表格、标签、按钮、输入框的边框、圆角和密度。
- 未修改：后端服务、数据库、同步接口、采集逻辑、管理员权限、API Key、Cookie、策略计算逻辑。
- 保留：2026-07-01 恢复后的策略页结构，今日主线榜仍在，旧的 renderStrategyQiWarRoom/强势板块结构未恢复。
- 验证：云端 /health、/kpl、/api/strategy-mainlines?day=2026-06-30 均返回 200；外网 http://124.222.188.68:8765/kpl 返回 200。
- 公司主机同步提醒：如果要带回这次视觉变化，需要同步前端网页文件；数据库同步不会带回 CSS/HTML 前端样式。

## 2026-07-02 01:38:27 云端行情页大众化视觉优化记录
- 文件：C:\PandaDashboard\kpl-dashboard_17_apple.html
- 备份：C:\PandaDashboard\backups\ui-broad-appeal-before-20260702-013732\kpl-dashboard_17_apple.html
- 本次仅追加 CSS 样式覆盖，标记为：Broad appeal trading UI polish 2026-07-02: visual only。
- 目标：在不动业务逻辑的前提下，让行情首页、涨停复盘、策略页更像成熟金融产品：顶部更紧凑、数据密度更稳定、卡片层次更克制、表格更清晰、按钮和输入框更统一。
- 具体视觉调整：压缩顶部 Logo/KPI/市场环尺寸；降低口号视觉权重；统一导航、分段按钮、日期选择、搜索框；优化板块卡片、复盘来源标签、复盘主题卡、策略主线卡和登录注册弹窗的圆角、边框、阴影、间距。
- 未修改：后端服务、数据库、同步接口、采集逻辑、管理员权限、注册/验证码/忘记密码逻辑、策略计算逻辑。
- 保留：今日主线榜结构继续保留；旧的 renderStrategyQiWarRoom/强势板块结构未恢复。
- 验证：云端 /health、/kpl、/api/strategy-mainlines?day=2026-06-30 均返回 200；外网 http://124.222.188.68:8765/kpl 返回 200；页面包含 Broad appeal trading UI polish 标记。
- 公司主机同步提醒：如果要带回这次 UI 变化，需要同步前端网页；后台数据库同步不会带回 CSS/HTML。

## 2026-07-02 03:12:37 云端主页备案号修改记录
- 文件：C:\PandaDashboard\Qi\qi-home.jsx
- 文件：C:\PandaDashboard\Qi\qi-home.compiled.js
- 备份：C:\PandaDashboard\backups\home-icp-before-20260702-031136\
- 修改：主页右下角备案号由占位内容改为“沪ICP备2026029617号”。
- 未修改：主页结构、登录逻辑、行情页、后端服务、数据库、同步接口。
- 验证：云端文件中 2026029617 出现 1 次，旧 0000000 为 0；外网 /qi-home.compiled.js 与 /qi-home.jsx 均已包含 2026029617。
- 公司主机同步提醒：如果公司主机要带回该变化，需要同步前端网页文件。

## 2026-07-02 03:22:43 云端域名 dreamerqi.com 接入记录
- 现象：dreamerqi.com 和 www.dreamerqi.com 已解析到 124.222.188.68，但 80 端口原来由 IIS Default Web Site 占用，所以直接输入域名看到的是 IIS 默认页面，不是 Panda/Qi 主页。
- 备份：C:\PandaDashboard\backups\domain-http80-before-20260702-032017\
- 修改文件：C:\PandaDashboard\kpl-stats-server.js，新增可选环境变量 KPL_PUBLIC_HTTP_PORT；主服务保留 8765，同时可额外监听 80。
- 修改文件：C:\PandaDashboard\run-kpl-stats-server.cmd、run-kpl-stats-server-task.ps1、restart-kpl-stats-server.ps1，设置 KPL_PUBLIC_HTTP_PORT=80，保证重启后仍开放域名默认 HTTP 访问。
- 服务器配置：停止 IIS Default Web Site，停止 W3SVC，并将 W3SVC 启动类型改为 Manual，避免重启后再次抢占 80 端口。
- 防火墙：新增/确认 Windows 防火墙规则 Panda Dashboard HTTP 80，允许 TCP 80 入站。
- 当前监听：Node 进程同时监听 0.0.0.0:80 和 0.0.0.0:8765；SSH 仍监听 443。
- 验证：http://dreamerqi.com、http://www.dreamerqi.com、http://dreamerqi.com/kpl、http://dreamerqi.com/admin、http://dreamerqi.com/health 均返回 200；/health 返回 {"ok":true}。
- 备注：当前只是 HTTP 域名访问。HTTPS 还未配置，因为 443 端口现在用于 SSH；如后续要 https://dreamerqi.com，需要先调整 SSH 端口或做独立 HTTPS 代理/证书配置。
- 公司主机同步提醒：这次涉及后端程序和启动脚本，不只是前端/数据库。如果公司端也要相同域名/80端口逻辑，需要同步 kpl-stats-server.js 和启动脚本；但公司内网未必需要开放 80。

## 2026-07-02 11:21:20 云端 HTTPS / Caddy 接入记录
- 目标：让 dreamerqi.com 支持 HTTPS，并让 http 自动跳转到 https。
- SSH 调整：sshd 已从 443 迁移到 2222；当前远程维护入口为 administrator@124.222.188.68:2222。请不要再用 443 作为 SSH 端口。
- HTTPS 代理：安装 Caddy 到 C:\PandaDashboard\tools\caddy\caddy.exe，版本 v2.11.4。
- Caddy 配置：C:\PandaDashboard\Caddyfile，域名 dreamerqi.com 和 www.dreamerqi.com 反向代理到 127.0.0.1:8765。
- 启动脚本：新增 C:\PandaDashboard\run-caddy.cmd。
- 计划任务：新增 Panda Caddy HTTPS，系统启动时运行，运行时间限制已改为不自动停止。
- Node 服务：Panda Node 仍监听 0.0.0.0:8765；已将 KPL_PUBLIC_HTTP_PORT 改为 0，避免 Node 抢占 80。
- 端口分工：80/443 由 Caddy 监听；8765 由 Node 监听；2222 由 SSH 监听。
- 证书：Let's Encrypt 已成功签发 dreamerqi.com / www.dreamerqi.com 证书，当前证书有效期 2026-07-02 至 2026-09-30，Caddy 会自动续期。
- 验证：https://dreamerqi.com、https://www.dreamerqi.com、https://dreamerqi.com/kpl、https://dreamerqi.com/admin、https://dreamerqi.com/health 均返回 200；http://dreamerqi.com 自动 308 跳转 https。
- 备份：C:\PandaDashboard\backups\https-caddy-before-20260702-111732\。
- 公司主机同步提醒：这次涉及云服务器专用运维配置，不建议直接同步到公司主机。公司 Codex 需要知道：云端公网访问地址建议改为 https://dreamerqi.com；SSH 端口改为 2222；80/443 由 Caddy 管理。


## 2026-07-02 行情复盘/策略页面宽度与今日主线榜修正
- 调整文件：C:\PandaDashboard\kpl-dashboard_17_apple.html、C:\PandaDashboard\kpl-stats-server.js。
- 备份目录：C:\PandaDashboard\backups\strategy-review-mainline-before-20260702-114327。
- 复盘页、策略页宽屏容器取消 1280px 窄宽限制，使用全宽布局，卡片按宽屏自适应展开。
- 策略页隐藏单独的“今日热点榜”和“强势板块共振榜”展示区，不再单独渲染；内容统一并入“今日主线榜”。
- /api/strategy-mainlines 增加最近有效交易日回退：例如 2026-07-02 无当日涨停主因库时，自动使用 2026-07-01 数据，避免今日主线榜空白。
- 今日主线榜种子扩展为“主因热点 + 强势共振”合集，强势共振中独有的题材也可以进入主线候选。
- 验证：node --check 通过；https://dreamerqi.com/health 返回 ok；https://dreamerqi.com/api/strategy-mainlines?day=2026-07-02 返回 day=2026-07-01、count=10；/kpl 与 /admin 返回 200。


## 2026-07-02 涨停复盘默认日期作用域修正
- 调整文件：C:\PandaDashboard\kpl-dashboard_17_apple.html。
- 备份目录：C:\PandaDashboard\backups\review-date-scope-before-20260702-121251。
- 修正口径：只有“涨停复盘”在当日主因库未生成前默认显示最近有效交易日；看板和策略默认仍显示当天。
- 前端实现：新增 reviewDateOverride 和 resolveReviewLoadDay，复盘页使用独立显示日期，不再把全局 state.date 改成昨天。
- 日期选择器行为：在复盘页选择日期只影响复盘页；在看板/策略选择日期才影响全局 state.date。
- 验证：页面脚本抽取后 node 检查通过；https://dreamerqi.com/kpl 返回 200；线上页面包含 reviewDateOverride/resolveReviewLoadDay；/api/strategy/today?day=2026-07-02 返回当天策略数据；/api/limit-up-main-reason-db/source-view?day=2026-07-02 当前 count=0，复盘页会自动使用最近有效交易日。


## 2026-07-02 看板永久删除黑名单修复
- 调整文件：C:\PandaDashboard\kpl-stats-server.js、C:\PandaDashboard\kpl-dashboard_17_apple.html、C:\PandaDashboard\kpl-permanent-hidden-boards.json。
- 备份目录：C:\PandaDashboard\backups\permanent-hidden-sync-before-20260702-122111。
- 问题原因：云端永久黑名单文件存在中文截断/重复尾巴，JSON 无法解析，后台降级为空名单；同时前端启动时没有先拉云端黑名单，实时看板排行会只按浏览器本地黑名单过滤。
- 后端修复：新增 GET /api/permanent-hidden-boards，返回云端永久删除黑名单；POST /api/permanent-hidden-board 保持管理员写入。
- 前端修复：启动时先读取并合并云端永久黑名单，再加载看板；syncAllPermanentHiddenBoards 改为先拉云端名单、再把本机名单补同步到云端。
- 黑名单文件修复：重建 kpl-permanent-hidden-boards.json 为合法 UTF-8 JSON，当前共 16 条永久隐藏项。
- 验证：node --check 通过；页面脚本检查通过；https://dreamerqi.com/api/permanent-hidden-boards 返回 count=16；/api/dashboard-live?zs_type=6 返回的板块不包含 BK0815、BK1645、BK1675、BK1638、BK1050、BK1051、BK1674、BK1713、BK1637、BK1630、BK1717、BK1632、BK0816、BK0705；https://dreamerqi.com/kpl 返回 200 且包含新同步逻辑。

## 2026-07-02 云端运维与同步体验增强

- 后端新增管理员运维接口：
  - `/api/admin/cloud-health`：检查云端关键配置、JSON 文件、SMTP、同步配置、回退备份、永久隐藏名单、30 个交易日清理规则和交接日志状态。
  - `/api/admin/review-source-health`：检查最近 30 个交易日涨停复盘底层来源和综合主因库完整性。
  - `/api/admin/ops-log`：读取云端交接日志尾部内容。
  - `/api/permanent-hidden-board/delete`：管理员可从后台恢复永久隐藏板块。
- 管理员后台 `/admin` 新增“运维中心”页签：
  - 显示云端配置健康、涨停复盘数据源健康、永久隐藏板块列表、云端交接日志。
  - 支持手动执行 30 个交易日清理。
  - 支持补齐最近 30 个交易日涨停复盘底层库，再生成综合主因库。
  - 支持恢复永久隐藏板块。
- 行情页 `/kpl` 涨停复盘增加日期提示：
  - 看板和策略仍默认当天。
  - 只有涨停复盘在当天主因库未生成时自动显示最近有效交易日，并在页面提示“当前自动显示最近有效交易日”。
- 验证：
  - 云端后端 `node --check kpl-stats-server.js` 通过。
  - 云端 `panda-admin.html` 和 `kpl-dashboard_17_apple.html` 脚本解析通过。
  - 云端服务已重启，`/health` 返回 `{"ok":true}`。
  - `https://dreamerqi.com/admin`、`https://dreamerqi.com/kpl` 返回 200。
  - 永久隐藏名单接口正常，当前 16 个隐藏板块。

## 2026-07-02 行情页看板/策略命名调整

- 调整文件：C:\PandaDashboard\kpl-dashboard_17_apple.html。
- 备份目录：C:\PandaDashboard\backups\rename-dashboard-strategy\20260702-151548。
- 修改内容：
  - 顶部导航“看板”改为“今日实时”。
  - 顶部导航“策略”改为“今日策略”。
  - 默认页面标题“强势板块”改为“今日实时”。
  - 策略页标题改为“今日策略”，辅助标题改为“实时主线与选股”。
  - 未登录权限提示改为“登录后查看今日实时 / 今日策略”。
- 未修改：后端接口、数据库、同步逻辑、策略计算逻辑、涨停复盘默认日期逻辑。
- 验证：https://dreamerqi.com/kpl 返回 200，线上页面已包含“今日实时”“今日策略”。

## 2026-07-02 涨停复盘“无共识归其他、不进待手填”规则

- 调整文件：C:\PandaDashboard\kpl-stats-server.js。
- 备份目录：C:\PandaDashboard\backups\main-reason-auto-other\20260702-162052。
- 规则调整：
  - 四个复盘来源没有相同热点主因，且个股细分原因也没有形成一致证据时，综合主因自动归入“其他”。
  - 这种“多源无共识”的股票继续保留来源证据和原话，但不再进入待手填主因清单。
  - 同花顺孤撑等被系统自动降级为“其他”的情况，也不再要求手填。
- 验证：
  - 后端 `node --check kpl-stats-server.js` 通过。
  - 云端服务已重启，`/health` 返回 `{"ok":true}`。
  - `2026-07-01` 待手填清单从 5 个降为 0。
  - 申通快递、炜冈科技、远望谷、浩物股份、宏发股份仍保留在涨停复盘“其他”里，来源为 `review-no-consensus-demoted`，不再进入待手填。

## 2026-07-02 策略页解释能力

- 调整文件：
  - C:\PandaDashboard\kpl-dashboard_17_apple.html
  - C:\PandaDashboard\kpl-stats-server.js
- 备份目录：C:\PandaDashboard\backups\strategy-explain\20260702-163003。
- 改动内容：
  - 今日主线榜增加“为什么上榜”，解释涨停数、高度、连板、共振、近15日活跃度、资金流入、板块涨幅等贡献。
  - 后端 `/api/strategy-mainlines` 增加 `explain` 和龙头 `explain` 字段，其他页面或公司主机同步后也可复用。
  - 重点关注卡片增加“为什么关注”，解释确认关注、涨幅、涨停数、净流入、QI 龙头、L2筛选结果等依据。
  - QI 龙头卡片增加简短依据，例如 10日/30日QI 命中、连板、近10日涨停次数、今日新晋、跨板块。
  - L2扫描个股展开明细时增加“入选依据”，展示主动买/主动卖、被动买/被动卖、买方支撑/卖压等比值。
- 未修改：
  - 策略排序、主线分计算、重点关注确认逻辑、L2扫描逻辑、权限逻辑均未改变。
- 验证：
  - 后端 `node --check kpl-stats-server.js` 通过。
  - 云端服务已重启，`/health` 返回 `{"ok":true}`。
  - `/api/strategy-mainlines?day=2026-07-02` 已返回解释字段；因 2026-07-02 为非交易日/无当日涨停复盘，接口回退使用最近可用数据日 2026-07-01。
  - `https://dreamerqi.com/kpl` 返回 200，线上页面包含“为什么上榜”“为什么关注”“入选依据”。

## 2026-07-02 数据源健康日期保护

- 调整文件：C:\PandaDashboard\kpl-dashboard_17_apple.html。
- 备份目录：C:\PandaDashboard\backups\data-health-date-guard\20260702-163619。
- 问题：
  - 数据源健康里，来源覆盖数会优先读取缓存中的 `sourceStats`。
  - 当今日某个来源没有生成归纳结果时，页面可能拿昨天/上一交易日的来源统计数量来显示，造成“没归纳出结果却显示覆盖数量”的误导。
- 修正：
  - 来源覆盖数必须和当前卡片对应的主因库日期一致。
  - 日期不一致的缓存来源统计不再参与今日/指定日期展示。
  - 某个来源当日没有归纳结果时，显示“无结果”或“待同步”，不再显示旧日期覆盖数。
  - 主因库综合覆盖率也加了同日校验，避免拿非当前日期的覆盖率补显示。
- 未修改：
  - 未改同步按钮逻辑。
  - 未改主因库采集、归纳、数据库文件。
  - 未改涨停复盘展示数据。
- 验证：
  - 本地和线上页面脚本语法检查通过。
  - `https://dreamerqi.com/kpl` 返回 200。
  - `/health` 返回 `{"ok":true}`。
  - 模拟缓存中存在 2026-07-01 TGB 149 只时，查看 2026-07-02 不再显示 149，只显示 0/无结果。

## 2026-07-02 策略页今日主线榜精修

- 调整文件：C:\PandaDashboard\kpl-dashboard_17_apple.html。
- 备份目录：C:\PandaDashboard\backups\strategy-mainline-refine\20260702-172729。
- 改动内容：
  - 不新增独立驾驶舱、不新增个股详情抽屉，而是把相关信息整合进策略页“今日主线榜”。
  - 今日主线榜顶部新增“主线快读”：
    - 最强主线
    - 高度方向
    - 持续活跃
    - 资金推动
  - 每张主线卡新增驱动标签，例如扩散驱动、高度驱动、资金驱动、持续驱动等。
  - 每张主线卡新增“今日看点”，把涨停扩散、连板高度、活跃度、资金等压缩成一句交易结论。
  - 每张主线卡新增“龙头候选”，展示该主线下排名靠前的个股及其入选依据。
- 未修改：
  - 未改主线分计算。
  - 未改排序逻辑。
  - 未改策略后端接口。
  - 未改涨停复盘、数据源健康、L2扫描逻辑。
- 验证：
  - 本地和线上页面脚本语法检查通过。
  - `https://dreamerqi.com/kpl` 返回 200。
  - `/health` 返回 `{"ok":true}`。
  - `/api/strategy-mainlines?day=2026-07-02` 正常返回主线数据；当前使用最近可用数据日 2026-07-01，第一主线为“半导体”，龙头候选包含多氟多、新迅达、格科微。

## 2026-07-02 策略页“今天为什么看它”主线解释

- 调整文件：
  - C:\PandaDashboard\kpl-dashboard_17_apple.html
  - C:\PandaDashboard\kpl-stats-server.js
- 备份目录：C:\PandaDashboard\backups\strategy-why-watch\20260702-173259。
- 改动内容：
  - 将“为什么今天该看它”做进策略页“今日主线榜”，不新增独立驾驶舱，不新增个股详情抽屉。
  - `/api/strategy-mainlines` 增加主线角色字段：
    - `prevCompare`：较上一交易日的涨停数、高度、连板数变化。
    - `roles.height`：负责打高度的个股。
    - `roles.spread`：负责扩散的个股。
    - `roles.followers`：跟风确认数量和示例。
  - 前端每张主线卡新增“今天为什么看它”模块：
    - 打高度
    - 负责扩散
    - 跟风确认
    - 较上日变化提示
- 未修改：
  - 未改主线分计算。
  - 未改排序逻辑。
  - 未改涨停复盘底层数据。
  - 未改数据源健康、同步按钮、L2扫描逻辑。
- 验证：
  - 后端 `node --check kpl-stats-server.js` 通过。
  - 云端服务已重启，`/health` 返回 `{"ok":true}`。
  - `https://dreamerqi.com/kpl` 返回 200，线上页面包含“今天为什么看它”。
  - `/api/strategy-mainlines?day=2026-07-02` 已返回 `prevCompare` 和 `roles`；当前第一主线为“人形机器人”，高度股包含福莱新材、富春染织，扩散股包含天娱数科、宏昌科技，跟风确认 16 只。

## 2026-07-02 策略页主线去重与精准输出

- 调整文件：
  - `C:\PandaDashboard\kpl-stats-server.js`
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 备份目录：`C:\PandaDashboard\backups\strategy-mainline-family\20260702-175720`
- 改动内容：
  - `/api/strategy-mainlines` 增加“策略主线族归并层”，先把容易重复展示的题材分支合并，再输出策略页前 10 条主线。
  - 合并范围包括：算力AI、机器人、半导体、医药、消费、化工材料、PCB与连接、被动元件、光通信、消费电子/显示。
  - 资源、新能源等过宽大类暂不合并，避免把黄金、小金属、锂矿等错误归成同一条。
  - 合并后保留 `mergedThemes` 和 `childMainlines`，页面能看到该主线包含哪些分支。
  - 策略页主线卡新增“合并分支”标签，例如“算力AI”下展示“AI应用 / 算力”，“化工材料”下展示“化工 / 氟化工”。
- 未修改：
  - 未改涨停复盘底层库。
  - 未改四来源采集逻辑。
  - 未改同步按钮。
  - 未改主线基础打分项，只在最终策略输出层做同族归并和展示。
- 验证：
  - 本地 `node --check kpl-stats-server.js` 通过。
  - 本地页面脚本检查通过。
  - 云端 `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 已重启 `Panda Dashboard Server`。
  - `https://dreamerqi.com/health` 返回 `{"ok":true}`。
  - `https://dreamerqi.com/api/strategy-mainlines?day=2026-07-02` 正常返回，重复分支已归并。
  - `https://dreamerqi.com/kpl` 返回 200，线上页面包含 `ml-merged-themes` 和 `strategyMergedThemesHTML`。


## 2026-07-02 TGB 湖南人复盘手动结构化入库
- 事项：按昨日同样方式，手动录入 2026-07-02 淘股吧湖南人涨停复盘。
- 来源文章：https://www.tgb.cn/a/2t6xeVH7WnY
- 标题：7.2湖南人涨停复盘+晚间消息汇总
- 正式底层库：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-02.json`
- 原始证据目录：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-02\`
- 录入口径：只录湖南人官方复盘白底长图里的题材分组区；不录顶部“市场连板股”汇总区，避免重复；不使用 OCR；不混用同花顺图片。
- 校验：结构化文件 91 行、91 只唯一股票；与原图表头“涨停91家”一致。
- 板块计数：机器人22、半导体10、其他个股10、大消费7、医疗医药7、ST摘帽6、化工5、其他热点4、算力4、AI应用4、海南3、黄金3、业绩增长3、AI硬件3。
- 处理：上传正式 JSON 后，调用本机后台 `exact=1&force=true&day=2026-07-02` 强制重建主因库。
- 验证：`/api/limit-up-main-reason-db/source-view?day=2026-07-02` 返回综合归纳91；TGB 标签91；sourceStats 中 `review/tgb-hunan-structured` rowCount=91、coveragePct=100。
- 备注：期间 SSH 一度返回 `Exceeded MaxStartups`，等待后恢复；截图里的 PowerShell 报错是变量 `$p`/`$dir` 为空导致的空路径错误，不影响网站数据。



## 2026-07-02 顶部横向位置补修
- 问题：slogan 样式已恢复，但顶部右侧账号/管理区域仍被最终视觉优化样式覆盖为 `margin-left: 0`，导致横向位置没有靠右。
- 修改文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 备份：`C:\PandaDashboard\backups\topbar-fix\kpl-dashboard_17_apple.20260702-222026.html`
- 修改内容：将最终覆盖样式中的 `.topbar-actions { order: 5; margin-left: 0; ... }` 改为 `margin-left: auto`。
- 验证：线上 `https://dreamerqi.com/kpl` 已确认最终样式为 `margin-left: auto`；旧覆盖块不存在；slogan 蓝色样式仍保留；无历史 `` `r`n `` 字符残留。


## 2026-07-02 策略页主线卡片精简与封板金额
- 需求：取消策略页“今日看点”“今天为什么看它”两块重复说明；在“主线分”旁显示板块涨幅和资金流入；“今日龙头”右侧的“封”显示封板金额。
- 修改文件：
  - `C:\PandaDashboard\kpl-dashboard_17_apple.html`
  - `C:\PandaDashboard\kpl-stats-server.js`
- 备份目录：`C:\PandaDashboard\backups\strategy-mainline-ui-seal\20260702-224512`
- 后端改动：
  - `/api/strategy-mainlines` 的龙头候选新增 `sealAmount` 字段。
  - `sealAmount` 优先从涨停底库的封单/封板资金字段读取：`sealAmount / limitUpFund / sealedAmount / fund / raw.fund`。
  - 主因库重建记录也保留 `sealAmount`，方便后续策略页和公司端同步使用。
- 前端改动：
  - 主线卡片不再渲染“今日看点”文案。
  - 主线卡片不再渲染“今天为什么看它”角色模块。
  - “主线分”旁新增两个小标签：相关板块涨幅、相关强势板块资金净流入/净流出。
  - “今日龙头”和“龙头候选”里的 `封` 优先显示封板金额，例如 `封5697万`；如果底库没有金额，再回退显示封板时间。
- 重启方式：
  - 云端没有带 Panda 名称的 Windows 服务；后端实际由 `C:\PandaDashboard\run-kpl-stats-server.cmd` 启动。
  - 本次重启时发现普通 SSH `Start-Process` 启动会随会话退出，最终使用 Windows `Win32_Process.Create` 脱离 SSH 会话启动。
  - 当前后端进程：`cmd.exe /c ""C:\PandaDashboard\run-kpl-stats-server.cmd""`，子进程 `node.exe "kpl-stats-server.js"`。
- 验证：
  - 云端 `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - `https://dreamerqi.com/health` 连续 3 次返回 `{"ok":true}`。
  - `https://dreamerqi.com/kpl` 返回 200；页面源码不再包含“今日看点”“今天为什么看它”，包含 `ml-score-wrap`、`strategyMainlineScoreMetaHTML`、`strategySealAmountText`。
  - `https://dreamerqi.com/api/strategy-mainlines?day=2026-07-02` 返回正常；前 3 条主线已带封板金额：人形机器人/福莱新材 `56965708`，算力AI/德冠新材 `45469671`，医药/海南海药 `120544483`。


## 2026-07-02 涨停主因统计来源数口径修正
- 问题：涨停复盘“涨停主因统计”综合归纳卡片里，“来源数”有时显示 3，但后端 2026-07-02 实际已有 4 个有效来源：韭研、复盘啦、淘股吧、选股宝。
- 原因：前端原来从综合表每只股票的“最终采用来源/selectedSource”去重统计来源数；这个字段只表示最终展示采用哪条证据，不等于参与综合归纳的全部来源，所以会少算手动上传的淘股吧等来源。
- 修改文件：`C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 备份目录：`C:\PandaDashboard\backups\review-source-count\20260702-225928`
- 修改内容：
  - “来源数”改为优先读取后端 `sourceStats` 中有效来源数量。
  - 如果 `sourceStats` 不存在，再回退按非综合归纳来源标签页数量统计。
  - 页面副标题改为：按复盘啦、选股宝、韭研、淘股吧拆分查看来源库，并保留四方综合归纳结果。
- 验证：
  - `https://dreamerqi.com/api/limit-up-main-reason-db/source-view?day=2026-07-02` 返回 4 个有效来源：`jiuyangongshe`、`kaipanla`、`tgb`、`xuangubao`，且均为 91/91、覆盖率 100%。
  - 线上 `https://dreamerqi.com/kpl` 已包含新副标题和 `reviewSourceCount` 口径，不再包含旧的 `sourceSet.size` 来源数算法。


## 2026-07-03 数据源健康来源覆盖误报修复
- 问题：涨停复盘页面 2026-07-03 已能看到部分来源底层数据，但“数据源健康”仍显示“无结果”。
- 原因：
  - 涨停复盘来源页读取的是 `source-view` 的来源标签页。
  - 数据源健康读取的是盘后状态接口里的 `sourceCoverage.reviewAutoSources`。
  - 今日主因库保存时 `sourceCoverage.reviewAutoSources` 为空，但 `source-view` 标签页后来已经有来源数据，所以健康面板误判为无结果。
- 修改文件：`C:\PandaDashboard\kpl-stats-server.js`
- 备份目录：`C:\PandaDashboard\backups\data-health-source-coverage\20260703-200104`
- 修改内容：
  - `source-view`：即使原始 `sourceStats` 为空，也会根据已经过滤后的来源标签页补算来源统计。
  - `after-close-status`：如果主因库保存的 `reviewAutoSources` 为空，但 source-view 已有来源标签页数据，则实时补入 `sourceCoverage.reviewAutoSources`，供数据源健康面板显示。
- 验证：
  - 云端 `node --check C:\PandaDashboard\kpl-stats-server.js` 通过。
  - 已用 `Win32_Process.Create` 常驻方式重启后端。
  - `https://dreamerqi.com/health` 返回 `{"ok":true}`。
  - `source-view?day=2026-07-03` 返回来源统计：韭研 104、复盘啦 104、选股宝 104，淘股吧 0。
  - `after-close-status?day=2026-07-03&mainReasonMode=same-day` 的 `sourceCoverage.reviewAutoSources` 同步返回韭研、复盘啦、选股宝三源覆盖，健康面板不应再把这三源显示为“无结果”。


## 2026-07-03 运维中心黑名单与 7 月 2 日复盘源丢失修复
- 用户反馈：
  - 运维中心“永久隐藏黑名单”状态异常。
  - 数据源健康里今天还有来源缺失，但整体仍显示正常。
  - 昨天 2026-07-02 原本做过四方复盘源，今天突然只剩 1 个来源。
- 排查结果：
  - `kpl-permanent-hidden-boards.json` 当前文件不是空，但 JSON 尾部被重复追加了一段，导致解析失败；接口因此降级为空，显示 0 条。
  - 2026-07-02 的主因库和多个来源 JSON 已缺失：
    - 缺：`kpl-limitup-main-reason-db\2026-07-02.json`
    - 缺：韭研、复盘啦、淘股吧结构化来源
    - 仅剩：选股宝 `xuangubao-limit-up\2026-07-02.json`
  - 日志存在 `cleanup old local data: deleted 19`，结合代码判断，自动清理在“最新交易日识别滞后”时可能误删当前日期附近的新文件。
- 已修复：
  - 备份并修复永久隐藏黑名单 JSON：
    - 损坏文件备份目录：`C:\PandaDashboard\backups\permanent-hidden-repair\20260703-200654`
    - 修复后接口返回 21 条：`5` 类 2 条、`6` 类 18 条、`7` 类 1 条。
  - 重新补齐 2026-07-02 来源文件：
    - 复盘啦恢复 91 条。
    - 韭研恢复 92 条，按复盘口径过滤后 source-view 显示 91 条。
    - 选股宝恢复 91 条。
    - 淘股吧只恢复到 raw 原文和 19 张图，结构化 JSON 仍缺；原因是 TGB 结构化 API 未配置，且原手工结构化 JSON 没有备份可直接恢复。
  - 重建 2026-07-02 综合主因库：
    - `--main-reason-backfill --day=2026-07-02 --days=1`
    - 重建结果：91 只、覆盖 100%。
  - 修复自动清理保护：
    - 修改 `C:\PandaDashboard\kpl-stats-server.js`
    - 备份目录：`C:\PandaDashboard\backups\cleanup-retention-guard\20260703-200948`
    - 在“最近 30 交易日”之外，强制额外保留最近 14 个自然日的日期文件，防止最新交易日接口/缓存滞后时误删昨天或今天的数据。
  - 修复数据源健康整体状态：
    - 修改 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
    - 备份目录：`C:\PandaDashboard\backups\data-health-source-summary\20260703-201136`
    - 健康总状态现在同时检查 4 个涨停复盘来源；如果缺 TGB，会显示来源 `3/4`，不再显示纯 OK。
- 验证：
  - `https://dreamerqi.com/health` 返回 `{"ok":true}`。
  - `https://dreamerqi.com/api/permanent-hidden-boards` 返回 21 条。
  - `source-view?day=2026-07-03`：韭研 104、复盘啦 104、选股宝 104、淘股吧 0。
  - `source-view?day=2026-07-02`：综合归纳 91；韭研 91、复盘啦 91、选股宝 91、淘股吧 0。
  - 线上 `https://dreamerqi.com/kpl` 已包含 `reviewHealthSourceSummary`，健康摘要会按来源完整性显示。
- 后续待办：
  - 如果要把 2026-07-02 恢复回四方完整，还需要重新生成或手动补回 `tgb-hunan-structured\2026-07-02.json`。
  - 建议后续对“手工结构化 TGB JSON”单独做一份同步外备份，避免自动清理或同步异常后无法直接恢复。

## 2026-07-03 手工补齐 7 月 2/3 日淘股吧湖南人结构化底层库

- 用户要求：
  - 按之前每天的方法，把 2026-07-02 和 2026-07-03 的“淘股吧/湖南人”涨停主因底层库补齐。
  - 不使用 OCR，不混用同花顺/东财/其他来源；按湖南人文章里的原图结构化。
- 操作方式：
  - 使用云端已抓取的 TGB 原文和原图：
    - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-02`
    - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-raw\2026-07-03`
  - 选用文章内“题材为王：主打盘中实时归类”的湖南人统计表原图：
    - 2026-07-02：`image-01-16.png`
    - 2026-07-03：`image-01-16.png`
  - 只录入“以下炸板”以上的涨停股票；炸板/跌停不入库。
  - 左侧股票列表作为股票全集，右侧大题材作为 `boardTopic`，右侧细分格作为 `detailReason`；右侧为空时用大题材兜底，避免空主因。
- 已生成并上传：
  - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-02.json`
    - 91 条，去重后 91 只。
  - `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-03.json`
    - 104 条，去重后 104 只。
  - 同步更新对应 raw `manifest.json` 的 `structured` 标记：
    - 2026-07-02：`exists=true,count=91,method=manual-structured-image-table-no-ocr`
    - 2026-07-03：`exists=true,count=104,method=manual-structured-image-table-no-ocr`
- 后台代码小修：
  - 修改 `C:\PandaDashboard\kpl-stats-server.js`
  - 增加 `--main-reason-backfill --force` 支持。
  - 原因：当天复盘默认等到下一天 09:00 才允许重建；今天 2026-07-03 晚上湖南人数据已补齐，需要强制重建当天综合库落盘。
  - 备份目录：`C:\PandaDashboard\backups\main-reason-backfill-force\20260703-204052`
  - 语法检查：`node --check .\kpl-stats-server.js` 通过。
- 重建结果：
  - 2026-07-02：已重建综合主因库，91 只，覆盖 100%。
  - 2026-07-03：执行 `node .\kpl-stats-server.js --main-reason-backfill --day=2026-07-03 --days=1 --force`
    - 重建 104 只。
    - `reviewCoveragePct=100`
    - `reviewMainReasonCoveragePct=100`
    - `lowConfidenceCount=10`
    - `conflictCount=51`
- 验证：
  - `source-view?day=2026-07-02`
    - 综合归纳 91
    - 复盘啦 91
    - 选股宝 91
    - 韭研 91
    - 淘股吧 91
    - `sourceStats`：韭研/复盘啦/淘股吧/选股宝均为 91。
  - `source-view?day=2026-07-03`
    - 综合归纳 104
    - 复盘啦 104
    - 选股宝 104
    - 韭研 104
    - 淘股吧 104
    - `sourceStats`：韭研/复盘啦/淘股吧/选股宝均为 104。
  - 主因库文件落盘：
    - `C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-02.json`
    - `C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-03.json`


## 2026-07-03 TGB 湖南人复盘来源纠错

- 用户指出 7 月 2 日、7 月 3 日 TGB 入库疑似不是湖南人主贴复盘，而是主贴下方回帖复盘。已确认属实。
- 错误来源：之前入库使用了 image-01-16.png，对应回帖用户 全网题材为王，不是湖南人主贴正文图。
  - 2026-07-02 错误图：https://image.tgb.cn/img/2026/07/02/2jejzz5rn8zq.png_760w.png
  - 2026-07-03 错误图：https://image.tgb.cn/img/2026/07/03/o6pe5rc64irh.png_760w.png
- 正确来源已改为湖南人主贴正文 image-01-06.png，位于跟帖列表之前，水印为 @TGB湖南人。
  - 2026-07-02 主贴：https://www.tgb.cn/a/2t6xeVH7WnY，正确图：https://image.tgb.cn/img/2026/07/02/hsupzwv2sbqh.png_760w.png
  - 2026-07-03 主贴：https://www.tgb.cn/a/2t8cHXqbUn9，正确图：https://image.tgb.cn/img/2026/07/03/z9iu8ckdtrhl.png_760w.png
- 已重建 TGB 底层库：
  - kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-02.json：91 家。
  - kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-03.json：104 家。
- 入库规则：只取湖南人主贴正文涨停复盘图；排除回帖图、炸板、跌停；主贴图中前面的“市场连板股”只作补充，和下面题材分类重复时按股票代码去重，优先保留下方题材分类主因。
- 已强制重建综合主因库：
  - 2026-07-02：综合库 91 家，TGB 分来源 91 家，覆盖率 100%。
  - 2026-07-03：综合库 104 家，TGB 分来源 104 家，覆盖率 100%。
- 本次替换前备份目录：C:\PandaDashboard\backups\tgb-hunan-mainpost-correction\20260703-210544。
- 后续每日手动录入 TGB 湖南人复盘时，必须先确认图片属于湖南人主贴正文，不能使用跟帖区其他用户的复盘图。
### 同步补充：TGB 主贴候选图保护与重启方式

- 已修改 kpl-stats-server.js 的 pickTgbStructuredImageCandidates：TGB 候选图只取主贴正文区域的大图；当主贴日期大图出现后再次遇到头像/小头像，即认为进入跟帖区，后续回帖图片不再作为结构化候选。
- 本地模拟 2026-07-02/2026-07-03 manifest 后，候选第一张分别为：
  - 2026-07-02：image-01-06.png / hsupzwv2sbqh.png_760w.png
  - 2026-07-03：image-01-06.png / z9iu8ckdtrhl.png_760w.png
- 代码替换前备份目录：C:\PandaDashboard\backups\tgb-mainpost-candidate-guard\20260703-211339。
- 
ode --check C:\PandaDashboard\kpl-stats-server.js 已通过。
- 注意：不要通过 SSH 临时 Start-Process node kpl-stats-server.js 作为长期启动方式。该方式会丢失 KPL_STATS_HOST=0.0.0.0 环境，且会话结束后进程可能被回收。
- 正确重启方式：schtasks /Run /TN "Panda Dashboard Server"。本次已用该计划任务恢复，后端监听  .0.0.0:8765，/health 返回 200。
- 公网验证：http://124.222.188.68:8765 和 https://dreamerqi.com 的 2026-07-03 source-view 均返回综合 104、TGB 104。

## 2026-07-03 策略页今日主线口径修正
- 背景：用户明确要求策略页盘中选股不能依赖盘后四源综合主因库；盘后综合归纳只属于“涨停复盘”。
- 已改后端 `kpl-stats-server.js` 的 `/api/strategy-mainlines`：
  - 今日主线榜改为盘中实时口径，优先使用今日实时看板里的板块涨幅、资金净流入、板块内涨停成分股。
  - 近 15 个交易日涨停复盘/主因库只作为历史延续性和解释加分，不再作为今日主线的生成主轴。
  - 接口返回新增/明确：`mode=intraday-mainline`，`basis=realtime-board-gain-inflow-limitups-plus-history`，`sourceDay.realtime` 为今日实时数据日，`sourceDay.history` 为历史复盘参考日。
  - 合并相关主线时，按今日股票代码去重计算涨停数，降低机器人/人形机器人/智能驾驶等相关板块重复计数风险。
- 已改前端 `kpl-dashboard_17_apple.html`：
  - 今日主线榜说明改为“实时板块涨幅 × 资金净流入 × 成分股涨停 × 近N交易日复盘延续”。
  - 空状态改为提示同步今日实时看板，不再提示先同步涨停复盘。
- 验证：
  - `node --check kpl-stats-server.js` 通过。
  - 服务通过计划任务 `Panda Dashboard Server` 重启，监听 `0.0.0.0:8765`。
  - `/health` 返回 OK，`https://dreamerqi.com/kpl` 返回 200。
  - `/api/strategy-mainlines` 返回 `mode: intraday-mainline`；2026-07-03 示例：实时日 2026-07-03，历史参考日 2026-07-02，前列主线包含机器人、军工、长安汽车、汽车热管理、华为汽车等。
- 备份：`C:\PandaDashboard\backups\strategy-intraday-mainline-20260703-214730`。



## 2026-07-03 策略页主线口径二次修正：历史四源综合用于盘中主因预判
- 用户更正：当天以前的“盘后四源综合归纳”不是简单历史延续性，而是用于发现/预测今天涨停个股的主因可能属于哪个板块，再结合今日实时强度分析今日可能主线。
- 已改后端 `/api/strategy-mainlines`：
  - 新增“历史主因预判层”：对今日涨停股逐个回查最近 30 个交易日内的四源综合主因，按股票代码找出其历史最常归属/最近归属的主因板块。
  - 今日主线榜现在由：实时板块涨幅、资金净流入、板块内涨停成分股、历史四源主因预判共同生成。
  - 新增计分项 `priorReason`，并返回 `priorReasonCount`、`priorReasonStocks`、`sourceDay.priorReason`。
  - 合并大主线时，对今日股票代码去重；历史主因预判单独计分，不再误算成实时板块共振。
  - 合并大类后的持续性、资金、涨幅分重新按大类汇总计算，避免历史分过度放大。
- 已改前端策略页说明：今日主线榜展示口径为“实时板块涨幅 × 资金净流入 × 成分股涨停 × 历史四源主因预判”。
- 验证：
  - `node --check` 通过。
  - 服务已用计划任务 `Panda Dashboard Server` 重启，监听 `0.0.0.0:8765`。
  - `https://dreamerqi.com/kpl` 返回 200。
  - `/api/strategy-mainlines` 返回 `basis=realtime-board-gain-inflow-limitups-plus-prior-main-reason`，`sourceDay.priorReason=2026-07-02`。
  - 2026-07-03 示例：机器人主线含今日涨停 57、历史主因预判 18、实时成分 57；半导体含今日涨停 6、历史主因预判 6。
- 备份：`C:\PandaDashboard\backups\strategy-prior-reason-mainline-20260703-220136`。



## 2026-07-03 Claude(Mac) 接入交接

- 背景：用户旧 Claude 账号丢失，新 Claude 已在用户新 Mac 上恢复全部旧项目上下文并接入本项目。
- 已做：
  - 从备份完整恢复旧账号项目资料与本机开发副本（Mac 路径：/Users/qi/claude-projects/dreamerqi/claudecode）。
  - SSH 改走 2222 端口连接本服务器（443 已让给 Caddy/HTTPS dreamerqi.com），密钥仍为 panda_tencent_codex_auto_ed25519。
  - 已通读 PROJECT_HANDOFF.md 与本日志全部记录（截至「2026-07-03 策略页主线口径二次修正」）。
  - 已把云端最新 kpl-stats-server.js / kpl-dashboard_17_apple.html / strategy-backend.js / l2-focus-scanner.js 拉回 Mac 本机开发副本。
  - 未修改任何云端业务代码、数据、配置；未重启服务。
- 约定：此后 Claude 每次开工前先读本日志了解他人改动，完工后在此追加交接记录；部署走 _pdeploy-helper.js 备份+记日志流程；重启只用计划任务 Panda Dashboard Server。


## 2026-07-04 行情入口改为 market.dreamerqi.com 子域名
- 用户要求：首页点击“行情”时，浏览器显示为 `market.dreamerqi.com`，不要影响行情页逻辑和内部数据。
- 已改 Caddy：
  - `C:\PandaDashboard\Caddyfile` 增加 `market.dreamerqi.com` 站点。
  - 子域名根路径 `/` 内部 rewrite 到 `/kpl`，地址栏保持 `https://market.dreamerqi.com`。
  - 仍然反代到同一个后端 `127.0.0.1:8765`，未改数据库/API/行情业务逻辑。
- 已改首页：
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - 生产环境 `MARKET_URL` 从 `/kpl?v=6` 改为 `https://market.dreamerqi.com`。
  - 本地 file 打开仍保留 `http://127.0.0.1:8765/kpl?v=6`，不影响本地调试。
  - `C:\PandaDashboard\Qi\index.html` 的 JS 版本号更新为 `qi-home.compiled.js?v=20260704-market`，避免浏览器缓存旧链接。
- 验证：
  - Caddy 配置 `caddy validate` 通过，并已 reload。
  - `https://dreamerqi.com/` 返回 200，加载的 JS 已包含 `https://market.dreamerqi.com`。
  - `https://dreamerqi.com/kpl` 返回 200，`https://dreamerqi.com/health` 返回 200。
  - 使用 Host 头测试 `market.dreamerqi.com`，Caddy 已识别该域名并返回 HTTPS 跳转。
- 注意：当前外部 DNS 尚未添加 `market.dreamerqi.com` 解析。需要在域名后台添加 A 记录：主机记录 `market`，记录值 `124.222.188.68`。DNS 生效后，Caddy 会自动申请 HTTPS 证书。
- 备份：`C:\PandaDashboard\backups\market-subdomain-entry-20260704-183027`。



## 2026-07-04 market.dreamerqi.com DNS/HTTPS 生效确认
- 用户反馈 `market.dreamerqi.com` 打开时报 `ERR_SSL_PROTOCOL_ERROR`。
- 排查：
  - 初始 DNS 记录误填完整主机名，生成了 `market.dreamerqi.com.dreamerqi.com`，正确记录应为主机记录 `market`。
  - 修正后多家 DNS（223.5.5.5 / 119.29.29.29 / 114.114.114.114 / 8.8.8.8）均解析 `market.dreamerqi.com -> 124.222.188.68`。
  - Caddy 在 DNS 未生效时已多次申请证书失败并进入退避等待，导致浏览器 SSL 错误。
- 处理：
  - 重启 Caddy，立即重新触发 ACME 证书申请。
  - Let’s Encrypt 已成功签发 `market.dreamerqi.com` 证书。
- 验证：
  - `https://market.dreamerqi.com/` 返回 200，内容为行情页 `/kpl`。
  - `https://market.dreamerqi.com/health` 返回 200。
  - `https://dreamerqi.com/` 仍返回 200。
  - 证书 CN 为 `market.dreamerqi.com`，有效期至 2026-10-02。



## 2026-07-04 行情页文档云端保存修复

- 问题现象：行情页「文档」卡片此前只写入浏览器 localStorage，未写入云端文件；换浏览器、换电脑或清缓存后会感觉“云端没有保留”。
- 后端改动：`kpl-stats-server.js` 新增 `panda-docs-cards.json` 数据文件和 `/api/docs-cards` 接口。
  - `GET /api/docs-cards`：读取云端文档卡片。
  - `POST /api/docs-cards`：管理员登录后保存文档卡片。
- 同步范围：`panda-docs-cards.json` 已加入后台数据库同步清单；它不是云服务器专用配置。公司主机从云端同步后台数据库时可带回该文档数据。
- 前端改动：`kpl-dashboard_17_apple.html` 的文档页改为优先读取云端；管理员编辑时自动保存到云端，同时保留浏览器本地备份；云端保存失败会提示“本机已保留，云端保存失败”。
- 兼容旧内容：如果云端还没有文档文件，但当前浏览器已有旧 localStorage 文档，管理员登录后会自动迁移保存到云端。
- 备份目录：`C:\PandaDashboard\backups\docs-cloud-persist-20260704-190240`。
- 验证结果：`node --check C:\PandaDashboard\kpl-stats-server.js` 通过；已重启 `Panda Dashboard Server`；`/health` 返回 200；`https://market.dreamerqi.com/kpl` 返回 200；`https://market.dreamerqi.com/api/docs-cards` 返回 200。



## 2026-07-04 行情页主页按钮修复

- 问题现象：访问 `https://market.dreamerqi.com/` 后点击行情页「主页」仍停留在行情页。
- 原因：行情页 `goHome()` 原来跳 `/`；在 `market.dreamerqi.com` 子域名下，根路径 `/` 被 Caddy 重写到 `/kpl`，所以又回到行情页。
- 修复：`kpl-dashboard_17_apple.html` 中 `goHome()` 的线上跳转改为 `https://dreamerqi.com/`；本地 file 打开时仍保持 `Qi/index.html`。
- 备份目录：`C:\PandaDashboard\backups\market-home-link-20260704-191125`。
- 验证：`https://market.dreamerqi.com/kpl` 和 `https://dreamerqi.com/` 均返回 200；公网源码确认 `goHome()` 指向 `https://dreamerqi.com/`。



## 2026-07-04 主站新增联系/关于/隐私/条款页面

- 需求：主站增加「联系我们」「关于我们」「隐私政策」「服务条款」页面；联系我们邮箱为 `service@dreamerqi.com`；关于页需要更好地概括当前网站在做什么。
- 改动文件：
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - `C:\PandaDashboard\Qi\index.html`
- 页面入口：
  - 关于我们：`https://dreamerqi.com/#about`
  - 联系我们：`https://dreamerqi.com/#contact`
  - 隐私政策：`https://dreamerqi.com/#privacy`
  - 服务条款：`https://dreamerqi.com/#terms`
- 内容设计：
  - 关于页重新总结 DreamerQi：今日实时观察盘中强势，涨停复盘沉淀多来源主因库，今日策略结合实时强弱、资金、涨停和历史主因预测主线，文档沉淀原则。
  - 联系页加入服务邮箱 `service@dreamerqi.com`，并说明问题反馈、合作建议和安全提醒。
  - 隐私政策加入账号、邮箱、手机号、登录记录、文档保存、验证码邮件、本地/云端保存、行情策略数据和删除咨询说明。
  - 服务条款加入账号责任、数据说明、禁止行为、非投资建议、服务变更、知识产权和联系入口。
- 导航与页脚：顶部导航新增「联系」；页脚链接改为真实入口，包含行情、今日实时、涨停复盘、今日策略、关于我们、联系我们、隐私政策、服务条款。
- 缓存处理：`Qi/index.html` 的脚本版本号更新为 `qi-home.compiled.js?v=20260704-info-pages`。
- 备份目录：`C:\PandaDashboard\backups\home-info-pages-20260704-191751`。
- 验证：`node build-home.js` 编译通过；`node --check qi-home.compiled.js` 通过；`https://dreamerqi.com/` 返回 200；公网首页已加载 `20260704-info-pages`；公网编译 JS 确认包含 `service@dreamerqi.com`、关于我们、联系我们、隐私政策、服务条款。



## 2026-07-04 主站 Stanning/探索子域名入口调整

- 需求：
  - 原「娱乐」改名为 `Stanning`，入口使用 `https://stanning.dreamerqi.com`。
  - 原「发现」改名为「探索」，入口使用 `https://explore.dreamerqi.com`。
  - 首页下方三张入口卡片整张可点击：01 行情跳行情页，02 Stanning 跳 Stanning 子域名，03 探索跳探索子域名。
- 改动文件：
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - `C:\PandaDashboard\Qi\index.html`
  - `C:\PandaDashboard\Caddyfile`
- 前端改动：
  - 新增 `STANNING_URL=https://stanning.dreamerqi.com` 和 `EXPLORE_URL=https://explore.dreamerqi.com`。
  - 顶部导航改为：行情 / Stanning / 探索 / 关于 / 联系。
  - `stanning.dreamerqi.com` 默认显示 Stanning 页面；`explore.dreamerqi.com` 默认显示探索页面。
  - 首页三张 pillar 卡片从仅右侧箭头可点，改为整卡可点击。
  - 首页 showcase 三张小卡也改为对应子域名跳转。
  - 首页脚本缓存版本更新为 `qi-home.compiled.js?v=20260704-subdomains`。
- Caddy 改动：新增 `stanning.dreamerqi.com, explore.dreamerqi.com` 站点，反代到 `127.0.0.1:8765`。
- DNS 待用户配置：当前查询显示 `stanning.dreamerqi.com` 和 `explore.dreamerqi.com` 还没有 A 记录；需要在域名后台添加：
  - 主机记录：`stanning`，类型：A，记录值：`124.222.188.68`
  - 主机记录：`explore`，类型：A，记录值：`124.222.188.68`
- 备份目录：`C:\PandaDashboard\backups\home-stanning-explore-20260704-192438`。
- 验证：`node build-home.js` 编译通过；`node --check qi-home.compiled.js` 通过；Caddy `validate` 通过并已 reload；`https://dreamerqi.com/` 和 `https://market.dreamerqi.com/kpl` 返回 200；公网 JS 已包含 `stanning.dreamerqi.com`、`explore.dreamerqi.com`、`Stanning`、`探索`。



## 2026-07-04 关于/联系页面文案平衡调整

- 需求：关于我们不要过度偏行情，需要均衡介绍行情、Stanning、探索；联系我们不需要继续写行情相关内容。
- 改动文件：
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - `C:\PandaDashboard\Qi\index.html`
- 关于我们改动：
  - intro 改为“市场观察、兴趣内容和本地探索”的综合数字平台。
  - lead 改为行情、Stanning、探索、文档四个方向并列说明。
  - 四张介绍卡改为：行情 / Stanning / 探索 / 文档与沉淀，避免只写今日实时、涨停复盘、今日策略。
  - sections 改为平台愿景、设计原则、未来方向，更均衡描述不同栏目。
- 联系我们改动：
  - intro 改为账号使用、页面访问、内容展示、功能体验或合作沟通。
  - 合作与建议去掉“数据源、策略模块、数据准确性”等偏行情措辞，改为产品体验、内容栏目、城市探索、兴趣内容或合作方式。
- 缓存处理：`Qi/index.html` 脚本版本更新为 `qi-home.compiled.js?v=20260704-copy-balance`。
- 备份目录：`C:\PandaDashboard\backups\home-copy-balance-20260704-192910`。
- 验证：`node build-home.js` 编译通过；`node --check qi-home.compiled.js` 通过；`https://dreamerqi.com/` 返回 200；公网 JS 已确认包含新文案。



## 2026-07-04 Stanning 内部路由统一

- 问题：用户反馈「娱乐」链接名改成 Stanning 后，页面里仍看到娱乐字样。
- 修复：
  - `STANNING_URL` 本地 hash 从 `#entertainment` 改为 `#stanning`。
  - `HOME_PAGES` 内部页面名从 `entertainment` 改为 `stanning`。
  - `stanning.dreamerqi.com` 默认页面从 `entertainment` 改为 `stanning`。
  - 顶部导航高亮从 `pageLink('entertainment')` 改为 `pageLink('stanning')`。
  - 渲染分支从 `page === 'entertainment'` 改为 `page === 'stanning'`。
  - 保留旧 `#entertainment` 兼容：旧链接会自动显示 Stanning 页面，不再展示中文「娱乐」。
- 缓存处理：`Qi/index.html` 脚本版本更新为 `qi-home.compiled.js?v=20260704-stanning-route`。
- 备份目录：`C:\PandaDashboard\backups\home-stanning-route-20260704-214316`。
- 验证：`node build-home.js` 编译通过；`node --check qi-home.compiled.js` 通过；`https://dreamerqi.com/` 返回 200；公网首页已加载 `20260704-stanning-route`；公网 JS 已无中文「娱乐/休闲娱乐」，仅保留一行旧 `#entertainment` 到 Stanning 的兼容逻辑。



## 2026-07-04 关于页卡片隐藏与娱乐命名调整

- 需求：关于我们页右侧 DreamerQi 卡片不需要；除网址外，页面上其他 `Stanning` 都改回「娱乐」。
- 改动文件：
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
  - `C:\PandaDashboard\Qi\index.html`
- 具体改动：
  - 顶部导航显示从 `Stanning` 改为「娱乐」，链接仍指向 `https://stanning.dreamerqi.com`。
  - 首页 hero、三张入口卡片、showcase 小卡、关于页文案、页脚、娱乐页标题等可见文案全部改为「娱乐」。
  - 保留内部路由名 `stanning` 和网址 `stanning.dreamerqi.com`，不影响已有子域名跳转。
  - `SpbInfoPage` 新增 `showSummaryCard = pageKey !== 'about'`，关于我们页不再显示右侧 DreamerQi 总结卡片；联系我们、隐私政策、服务条款页面仍保留该卡片。
- 缓存处理：`Qi/index.html` 脚本版本更新为 `qi-home.compiled.js?v=20260704-entertainment-copy`。
- 备份目录：`C:\PandaDashboard\backups\home-entertainment-copy-20260704-214930`。
- 验证：`node build-home.js` 编译通过；`node --check qi-home.compiled.js` 通过；`https://dreamerqi.com/` 返回 200；公网首页已加载 `20260704-entertainment-copy`；公网 JS 确认显示文案为「娱乐」，`Stanning` 仅保留在 URL/内部变量相关位置。


### 2026-07-04 21:59:19 子域名 DNS/HTTPS 验证
- 用户已在 DNS 后台新增 stanning.dreamerqi.com、explore.dreamerqi.com 解析到 124.222.188.68。
- 外部验证：stanning.dreamerqi.com、explore.dreamerqi.com 均已解析到 124.222.188.68。
- Caddy 已为两个新子域名完成 HTTPS 访问，公网 https://stanning.dreamerqi.com/、https://explore.dreamerqi.com/ 均返回 200。
- https://market.dreamerqi.com/ 同时验证正常，保持跳进行情页逻辑不变。

### 2026-07-04 22:23:57 首页/行情 UI 与普通用户体验优化
- 备份目录：C:\PandaDashboard\backups\ui-polish-20260704-221546。
- 首页 Qi/qi-home.jsx：
  - 首屏说明改为更明确的 DreamerQi 三入口表达：行情、娱乐、探索。
  - 首屏主按钮改为直接进入行情；次按钮进入关于我们。
  - 增加三入口说明小卡片，去掉未实现的“搜索框”表达，顶部右侧改为 DreamerQi.com 品牌标识。
  - 重新构建 Qi/qi-home.compiled.js，Qi/index.html 缓存版本更新为 qi-home.compiled.js?v=20260704-ux-polish。
- 行情页 kpl-dashboard_17_apple.html：
  - 普通用户体验：隐藏后台、同步、删除、恢复、永久隐藏、确认机会板块、文档新增等管理痕迹；普通用户文档区显示只读提示。
  - 数据源健康：折叠条恢复显示昨日/今日摘要；展开面板宽度和移动端排版优化。
  - 复盘/策略页：继续保持全宽显示，补充最终宽度和移动端覆盖，避免只占半屏。
  - 文档页：未登录/普通用户更明确显示只读，管理员登录后仍可编辑并自动保存云端。
- 未改动：本次没有改主因库采集、策略计算、同步规则、Caddy、数据库结构和后端接口算法。
- 验证：
  - 
ode .\build-home.js 成功，
ode --check .\qi-home.compiled.js 通过。
  - kpl-dashboard_17_apple.html 内嵌脚本本地 
ode --check 通过。
  - 公网 https://dreamerqi.com/ 已加载 20260704-ux-polish。
  - 公网 https://market.dreamerqi.com/kpl 返回 200，并包含本次 UI 覆盖与健康源摘要修正。
  - https://stanning.dreamerqi.com/、https://explore.dreamerqi.com/ 继续正常加载新首页版本。

### 2026-07-04 22:37:57 今日实时恢复按钮修正
- 备份目录：C:\PandaDashboard\backups\restore-button-fix-20260704-223513。
- 修正原因：上一版 UI 优化后，管理员在“今日实时”标题栏会看到独立的“恢复卡片”按钮，位置和“全量刷新”不协调，也不应该常驻。
- 修正内容：顶部“恢复卡片”按钮保持隐藏；如当天确实存在已删除板块，恢复入口改到下方“已删除板块”面板内，显示为“恢复当天”，更符合上下文。
- 验证：kpl-dashboard_17_apple.html 内嵌脚本 
ode --check 通过；公网 https://market.dreamerqi.com/kpl 返回 200，页面源码包含“恢复当天”且不再有顶部恢复按钮显示覆盖规则。
- 说明：本次只改前端显示，不改永久隐藏黑名单、删除逻辑、后端接口或同步规则。

### 2026-07-04 22:41:37 首页右上角域名标识移除
- 备份目录：C:\PandaDashboard\backups\home-remove-top-domain-20260704-223857。
- 修改原因：右上角 DreamerQi.com 与浏览器地址栏和左上角 Qi Logo 信息重复，视觉上没有必要。
- 修改内容：移除首页顶部右侧的 DreamerQi.com 文案和图标，仅保留登录/注册或账号信息。
- 构建：重新执行 Qi\build-home.js，Qi/index.html 缓存版本更新为 qi-home.compiled.js?v=20260704-no-top-domain。
- 验证：公网 https://dreamerqi.com/ 返回 200，首页 HTML 已引用 20260704-no-top-domain，公网编译 JS 中不再包含右上角 DreamerQi.com 文案。

### 2026-07-04 22:47:04 数据源健康胶囊与热点搜索框压缩
- 备份目录：C:\PandaDashboard\backups\health-search-compact-20260704-224356。
- 修改内容：
  - 今日实时的数据源健康胶囊从上一版的较长宽度收窄到约 420px，仍保留昨日/今日摘要但不再占太长空间。
  - “搜热点板块/细分题材”输入框从大搜索条缩小为约 560px，输入框和按钮高度、圆角、字号同步压缩。
  - 搜索框默认值固定为空，并关闭浏览器自动填充/拼写等行为。
  - 进入“今日实时”页面、hash 切回看板、浏览器页面恢复时都会执行 clearHotSearch()，清空旧搜索词和旧搜索结果，避免出现上次输入过的 panda 残留。
- 验证：kpl-dashboard_17_apple.html 内嵌脚本 
ode --check 通过；公网 https://market.dreamerqi.com/kpl 返回 200，公网内容包含 width: min(420px、max-width:560px、clearHotSearch、pageshow。
- 说明：本次只改前端显示和输入框状态，不改热点搜索接口、不改数据源健康判断逻辑。

### 2026-07-04 22:55:20 今日实时热点搜索框进一步压缩与自动填充修正
- 备份目录：C:\PandaDashboard\backups\hot-search-autofill-fix-20260704-225221。
- 修改原因：用户反馈每次进入“今日实时”搜索框仍可能默认出现 panda，且搜索框仍偏大。
- 修改内容：
  - 热点搜索框从约 560px 进一步压缩到约 390px，文案简化为“搜题材”。
  - 输入框从 	ype="search" 改为 	ype="text"，并使用唯一 name：hot_theme_query_no_autofill_20260704。
  - 设置 utocomplete="new-password"、data-lpignore、data-1p-ignore、data-form-type="other"，降低浏览器/密码管理器自动填充概率。
  - 新增 rmHotSearchAutoClear()：进入今日实时、页面恢复时立即清空，并在 120ms/500ms/1200ms/2500ms 延迟复查清空，防止浏览器在脚本后回填旧值；如果用户已聚焦输入框则不打断输入。
- 验证：kpl-dashboard_17_apple.html 内嵌脚本 
ode --check 通过；公网 https://market.dreamerqi.com/kpl 返回 200，公网内容包含 max-width:390px、hot_theme_query_no_autofill_20260704、rmHotSearchAutoClear、placeholder="搜题材"。
- 说明：本次只改前端输入框尺寸和默认清空逻辑，不改热点搜索接口和统计逻辑。

## 2026-07-04 TGB/Hunan image-structure model evaluation

- Added standalone evaluator: `C:\PandaDashboard\tools\tgb-vision-model-eval.js`.
- Added model test config: `C:\PandaDashboard\source-structurer-model-eval.json`.
- Reports are written under: `C:\PandaDashboard\kpl-limitup-main-reason-quality\`.
- Evaluator only reads raw TGB images and existing structured gold files; it does not write production reason databases.
- Existing cloud runtime has a `qwenApiKey`; key content was not printed or exposed.
- Tested Alibaba Bailian OpenAI-compatible visual endpoint with current runtime [REDACTED] `qwen3-vl-plus`: text ping OK, but TGB long image/base64 and URL tests timed out. Not suitable as direct extractor.
  - `qwen3.7-plus`: official sample image OK, but TGB crop/table image timed out. Not suitable as direct extractor.
  - `qwen-vl-ocr-latest`: best current candidate. It returned rows from TGB images in about 20-60 seconds, including many stock codes and visible reasons, but direct JSON mode is unstable and sometimes malformed; board/detail fields need a two-step pipeline.
- Important finding: TGB source images are very tall, e.g. `image-01-06.png` is `530 x 6345`. Direct general vision models are too slow for this input shape.
- Better future pipeline:
  1. Use original public image URL when possible, not base64.
  2. Use `qwen-vl-ocr-latest` or a stronger document/OCR vision model to extract Markdown/plain text first.
  3. Parse/repair to JSON in a second step.
  4. Score against existing manually confirmed `tgb-hunan-structured` files before writing production DB.
- Current conclusion: among configured Alibaba models, only `qwen-vl-ocr-latest` is worth continuing. It is not yet production-ready without a Markdown/OCR-first parser and quality gate.
## 2026-07-04 Strategy mainline title alignment

- Updated `C:\PandaDashboard\kpl-dashboard_17_apple.html` visual CSS only.
- Change: in strategy page, the `今日主线榜` title now stays next to the left blue vertical marker; the subtitle stays right aligned on desktop and wraps cleanly on mobile.
- No strategy calculation/backend logic changed.
- Backup before upload: `C:\PandaDashboard\backups\strategy-mainline-title-left-20260704-235352\kpl-dashboard_17_apple.html`.
- Verified `http://127.0.0.1:8765/kpl` and `https://market.dreamerqi.com/kpl` returned 200 and include the new style.
## 2026-07-05 TGB two-step OCR evaluation

- Added standalone two-step evaluator: `C:\PandaDashboard\tools\tgb-two-step-ocr-eval.js`.
- Purpose: evaluate `qwen-vl-ocr-latest` OCR first, then deterministic/programmatic parsing where possible; does not write production DB.
- Test day: `2026-06-18`.
- Key finding: `qwen-vl-ocr-latest` OCR output for `image-01-11.png` is clean HTML-like table text with board headings and right-side detail reasons preserved.
- Programmatic HTML parser extracted 79 rows from `image-01-11.png`.
  - Score against existing gold: gold 91, predicted 79, code recall 82.4%, code precision 94.9%.
  - Board/detail exact-match scores are low because gold contains simplified/normalized reasons while OCR preserves source-original long reasons; for bottom-layer DB, source-original text is preferable.
- `image-01-13.png` OCR returned Markdown summary table with 91涨停 count but mixed/summary columns and an `以下炸板` section; it needs a dedicated Markdown summary parser and must filter rows after `以下炸板`.
- Conclusion: among currently configured models, `qwen-vl-ocr-latest` is the viable model for TGB/Hunan source. Recommended production approach is not direct vision-to-JSON, but `qwen-vl-ocr-latest -> deterministic parser -> quality gate -> DB`.
- Latest successful report: `C:\PandaDashboard\kpl-limitup-main-reason-quality\tgb-two-step-ocr-eval-2026-06-18-20260705-005453\tgb-two-step-ocr-eval-2026-06-18-20260705-005453.json`.
- OCR text samples are saved under corresponding `tgb-two-step-ocr-eval-*` folders.
## 2026-07-05 TGB Qwen OCR parser quality gate finalized

- Updated standalone evaluator: `C:\PandaDashboard\tools\tgb-two-step-ocr-eval.js`.
- Added OCR cache: `C:\PandaDashboard\kpl-limitup-main-reason-quality\tgb-qwen-ocr-cache\`.
- Implemented deterministic parsers:
  - HTML detail table parser for TGB image `image-01-11.png` style.
  - Markdown summary table parser for TGB image `image-01-13.png` style; stops at `以下炸板`.
- Added limit-up pool validation using `C:\PandaDashboard\kpl-limitup-db\<day>.json`:
  - If OCR code is not in pool but OCR name matches pool name, correct code by name.
  - If row is still not in limit-up pool after correction, drop it and record in report.
- Test day: `2026-06-18`; images: `image-01-11.png,image-01-13.png`.
- Final eval result: gold 91, predicted 91, code recall 100.0%, code precision 100.0%, quality gate passed.
- Latest report: `C:\PandaDashboard\kpl-limitup-main-reason-quality\tgb-two-step-ocr-eval-2026-06-18-20260705-011707\tgb-two-step-ocr-eval-2026-06-18-20260705-011707.json`.
- This is still an evaluation/candidate pipeline only. It has not overwritten official `tgb-hunan-structured` production source files yet.
- Recommended next step: integrate this parser as the new TGB structured generator with backup-before-write and quality gate, replacing the old disabled direct-Qwen vision path.
## 2026-07-05 01:45 云端 TGB 湖南人 Qwen OCR 正式入库接入
- 后端文件：`C:\PandaDashboard\kpl-stats-server.js`
- 先备份：`C:\PandaDashboard\backups\tgb-qwen-ocr-integration-20260705-012529\kpl-stats-server.js`
- 新增 TGB 正式结构化路径：`qwen-vl-ocr-latest -> OCR 原文 -> 确定性表格解析 -> 当日涨停池代码/名称对账 -> 质量闸通过才写入 tgb-hunan-structured`。
- 新增 OCR 缓存目录：`kpl-limitup-main-reason-sources\tgb-hunan-ocr-cache\qwen-table-parser\<day>\`，同一图片后续不重复调用模型。
- 新增写入前备份：覆盖 `kpl-limitup-main-reason-sources\tgb-hunan-structured\<day>.json` 前，会备份到 `backups\tgb-hunan-structured-qwen-ocr\...`。
- 修正候选图选择：新 OCR 路径不再沿用旧的“遇头像后停止正文”的筛选，避免漏掉真正有用的 TGB 长图。
- 修正 TGB OCR HTML 表格解析：兼容两种表格列顺序（代码/名称/时间/连板/原因，以及连板/代码/名称/时间/原因），并支持“板块标题在上一表最后一行”的 TGB 长图格式。
- 手动验证 `2026-06-18`：使用 `image-01-06.png`、`image-01-11.png`、`image-01-13.png` 三张图，最终通过质量闸：91/91，missing=0，extra=0，已写入正式 TGB 底层库并 refold 到综合主因库。
- 当日写入前备份：`C:\PandaDashboard\backups\tgb-hunan-structured-qwen-ocr\2026-07-04T17-36-50-395Z-2026-06-18\2026-06-18.json`
- 同步按钮影响：后台补齐 TGB 来源时会走此新入口；失败时只保留待同步/错误信息，不会污染正式底层库。
- 自动任务影响：`runAutoTgbVisionSyncIfDue` 已改为调用新 OCR 结构化入口；只有配置了 Qwen OCR key 且质量闸通过才自动写库。
- 云端服务修复：发现原先不存在 `Panda Dashboard Server` 计划任务，导致后台重启后网站 502。已创建开机任务 `Panda Dashboard Server`，使用 `C:\PandaDashboard\run-kpl-stats-server.cmd` 以 SYSTEM 启动。
- 验证：`https://market.dreamerqi.com/kpl` 返回 200，`https://market.dreamerqi.com/admin` 返回 200。
### 2026-07-05 视觉统一优化
- 使用 Product Design 工作流做了一轮全站视觉收敛，目标是“更干净、克制、专业”，只改样式，不改行情/复盘/策略/后台业务逻辑。
- 行情页 `kpl-dashboard_17_apple.html` 增加 `Product design convergence pass 2026-07-05` 样式层：统一深色背景、8px 圆角、卡片/导航/按钮/复盘/策略视觉密度，缩短数据源健康胶囊和题材搜索框。
- 主页 `Qi/index.html` 增加同名样式层：统一主页卡片、入口卡片、背景和交互质感；没有改链接、登录、注册、探索、娱乐、行情跳转逻辑。
- 云端备份：`C:\PandaDashboard\backups\ui-polish-20260704-190418`。
- 验证：`https://dreamerqi.com/` 和 `https://market.dreamerqi.com/kpl` 均返回 200，并确认新样式标记已在公网 HTML 中生效。
## 2026-07-06 Codex 云端巡检与湖南人复盘入库
- 先检查云端最近变更：发现 2026-07-06 已有公司/其他 AI 更新娱乐页、探索页、瞎聊聊、首页 live cards、策略资金流颜色、后台内容同步等，记录主要在 `C:\PandaDashboard\_cloud-change-log-20260705.md`；主交接文件此前停在 2026-07-05，本次已补充记录。
- 服务状态：主服务 8765 正常监听；最终重启后 PID 为 7132。公网验证 `https://market.dreamerqi.com/kpl`、`https://market.dreamerqi.com/admin`、`https://market.dreamerqi.com/health` 正常。
- 湖南人 2026-07-06：raw 证据已在云端存在，文章为 `https://www.tgb.cn/a/2tdaOI3pGFi`，标题 `7.6湖南人涨停复盘+晚间消息汇总`。
- 首次运行 `node .\kpl-stats-server.js --tgb-vision-sync --day 2026-07-06 --days 1` 未通过质量闸：旧解析器没有识别湖南人“单表格 + 【板块】标题行”格式，只从总览图解析到 62 行，弱行过多。
- 修复 `kpl-stats-server.js`：新增 `parseTgbQwenOcrSingleTableRows`，支持湖南人原表格格式；识别 `【半导体】11只`、`【其他热点】`、`【其他个股】` 等标题；遇到 `【涨停炸板】` 分区停止，避免把炸板区写入涨停库。
- 修复冲突优先级：同一股票多图冲突时，优先保留湖南人原表格 `hunan-single-table`，总览/摘要图只作补充，避免把原表格板块覆盖成总览图错误 OCR 结果。
- 本次 OCR 修正：`600241 时代万恒` 在原表格中被 OCR 为 `00241`，已通过涨停池名称对账自动修正为 `600241`。
- 最终入库：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-06.json`，count=64，method=`qwen-ocr-table-parser`，model=`qwen-vl-ocr-latest`，declaredTotal=64，baselineCount=64，missing=0，extra=0，weakCount=0。
- 已重折综合主因库；公网 source-view 验证 TGB count=64。
- 备份：`C:\PandaDashboard\backups\codex-tgb-hunan-parser-20260706-053201`，`C:\PandaDashboard\backups\codex-tgb-hunan-priority-20260706-053448`；覆盖 2026-07-06 TGB 正式库前备份：`C:\PandaDashboard\backups\tgb-hunan-structured-qwen-ocr\2026-07-06T12-34-54-398Z-2026-07-06\2026-07-06.json`。

## 2026-07-06 今日策略日期修正
- 现象：早上进入“今日策略/今日主线榜”时，页面可能沿用前一个工作日的日期状态，看起来不像当天盘中分析。
- 修复：`kpl-dashboard_17_apple.html` 前端“今天”统一按北京时间计算；进入“今日实时”或“今日策略”时自动回到北京时间当天。
- 修复：网页长时间打开过夜后，重新显示或聚焦页面时，会自动校正到当天并刷新今日实时/今日策略。
- 保留：涨停复盘仍按原规则，若当日盘后主因库未生成，可自动显示最近有效交易日；这个回退不再影响今日策略和今日实时。
- 增强：今日主线榜标题下方会显示“盘中数据日”和“主因参考日”，避免把历史四源主因参考误认为当前策略日期。
- 云端备份：`C:\PandaDashboard\backups\codex-strategy-today-date-20260706-204502\kpl-dashboard_17_apple.html`
- 验证：`https://market.dreamerqi.com/kpl` 已返回新前端代码；`/api/strategy-mainlines?day=2026-07-06` 返回 `mode=intraday-mainline`，`sourceDay.realtime=2026-07-06`，`sourceDay.priorReason=2026-07-03`。

## 2026-07-06 今日策略涨幅/资金显示修正
- 现象：今日策略主线卡片里，部分“板块涨幅”和“净流入”显示为 0；正涨幅颜色也不符合 A 股红涨绿跌习惯。
- 原因：前端把后端空值 `null` 用 `Number(null)` 转成了 0；后端合并主线时也有同类空值转 0 的判断。
- 修复前端：空值不再显示为 0；板块涨幅大于 0 显示红色，小于 0 显示绿色；净流入正数红色，净流出负数绿色，并显示为“净流出X亿/万”。
- 修复后端：今日策略合并主线时只把真实数字参与计算，空值保持为空；用今日实时板块成员股补齐相关主线的真实板块涨幅和资金，但不再把“2026中报预增”这类泛化板块硬塞进具体主题。
- 验证：`/api/strategy-mainlines?day=2026-07-06` 中，算力AI显示 `netInflow=-735681024`，化工材料显示 `netInflow=-537000000`，wifi6/7显示 `netInflow=209400159`；没有实际板块映射的主题保持 `null`，不再输出假 0。
- 云端备份：`C:\PandaDashboard\backups\codex-strategy-gain-inflow-20260706-205859\`

## 2026-07-06 今日策略刷新停留占位修正
- 现象：收盘后在“今日策略”页点刷新，页面可能停在“正在准备今日策略...”。
- 原因：策略页顶部刷新按钮仍走旧的“今日实时看板全量刷新”流程，只刷新看板数据，没有触发策略页重新渲染；直接打开 `#strategy` 时也可能只保留初始占位。
- 修复：策略页按钮文案改为“刷新策略”；点击后清理当日策略缓存并重新渲染策略页，重新读取 `/api/strategy/today` 与 `/api/strategy-mainlines`。
- 修复：直接进入策略页或页面启动时，如果当前页是策略页，会主动执行 `renderStrategyPage()`，不再误跑看板刷新。
- 验证：`https://market.dreamerqi.com/kpl` 已返回新前端逻辑；`/api/strategy-mainlines?day=2026-07-06` 正常返回 `count=10`。
- 云端备份：`C:\PandaDashboard\backups\codex-strategy-refresh-render-20260706-210835\kpl-dashboard_17_apple.html`

## 2026-07-06 今日策略主线补东财/同花顺完整概念板块
- 背景：部分策略主线卡片（如半导体、PCB、人形机器人、光模块）在东财/同花顺里有真实板块，但此前策略页只看“今日实时看板已抓到的板块”，所以资金/涨幅为空。
- 修复：`kpl-stats-server.js` 增加“主线题材 → 完整概念板块”代表板块匹配。优先同名和强别名，例如：半导体→半导体概念，PCB→PCB，人形机器人→人形机器人，光模块→光通信模块。
- 数据源策略：资金/涨幅兜底优先使用东财概念实时行情；同花顺目前很多概念目录资金字段为空，先作为后备名称库，不强行替代东财资金。
- 防误配：不再用 KPL 全量排行做兜底，避免接口慢和减速器等相邻题材误抢“人形机器人”的代表板块；过滤中报预增、高股息、风格等泛化板块。
- 验证：`/api/strategy-mainlines?day=2026-07-06` 已返回：半导体=半导体概念 `-1.93% / -28778713088`，PCB=PCB `-3.97% / -21157660928`，人形机器人=人形机器人 `-3.18% / -9866460928`，光模块=光通信模块 `-3.57% / -19563226624`。
- 说明：地产链本次东财完整目录未匹配到足够可信的“房地产开发/地产链”代表板块，仍保持空值，不显示假资金。
- 云端备份：`C:\PandaDashboard\backups\codex-strategy-full-board-catalog-20260706-211502\kpl-stats-server.js`

## 2026-07-06 主页入口精简
- 按要求去掉主页首屏的 `DreamerQi · 行情 / 娱乐 / 探索` 小胶囊。
- 去掉首屏下方三枚说明卡片：`行情 / 实时强弱、涨停复盘、策略观察`、`娱乐 / 兴趣内容、热点趋势、轻松浏览`、`探索 / 新店美食、城市好去处`。
- 去掉主页下方三张 Daily routes 入口卡片，不再在主页展示这三个页面入口说明。
- 保留实际子域名和页面路由配置，避免影响 `market.dreamerqi.com`、`stanning.dreamerqi.com`、`explore.dreamerqi.com` 的访问逻辑。
- 更新 `Qi/index.html` 的 `qi-home.compiled.js` 版本号为 `20260706-home-trim`，避免浏览器继续加载旧缓存。
- 云端备份：`C:\PandaDashboard\backups\codex-home-trim-20260706-063430`
## 2026-07-06 主页预览图展示区恢复
- 更正上一轮主页精简：恢复主页下方带预览图的 `SpbShowcase` 展示区。
- 仍保留已删除内容：首屏 `DreamerQi · 行情 / 娱乐 / 探索` 小胶囊、首屏三枚文字说明卡片、四个纯文字入口区 `SpbPillars` 不再渲染。
- 更新 `Qi/index.html` 的脚本版本号为 `20260706-home-preview-restore`，避免浏览器继续加载删多后的缓存。
- 云端备份：`C:\PandaDashboard\backups\codex-home-preview-restore-20260706-064152`
## 2026-07-06 瞎聊聊预览图与帖子流 UI
- 主页 `瞎聊聊` 预览卡片改为可爱插画图：`Qi/assets/chatter-cute-preview.png`。
- `SpbShowcase` 中瞎聊聊卡片从纯文字占位改为图片卡片，文案改为“社区帖子流 / 像帖子一样发图、聊天和回复”。
- `#chat` 页面改造成更像帖子广场：顶部改为 Community Board，发布区改为“发一条帖子”，帖子卡片加入头像、作者、时间、帖子标签、图片和回复摘要。
- 后端静态白名单增加 `/assets/chatter-cute-preview.png` 与 `/qi/assets/chatter-cute-preview.png`，让主页图片能公网访问。
- 注意：`SpbPillars` 函数仍保留在源码里，但主页不再渲染，避免恢复之前被要求去掉的纯文字入口区。
- 重启方式：本次通过计划任务 `Panda Dashboard Server` 恢复服务，当前 KPL 服务进程监听 `0.0.0.0:8765`。
- 验证：`https://dreamerqi.com/`、`https://dreamerqi.com/assets/chatter-cute-preview.png`、`https://dreamerqi.com/api/chatter/posts`、`https://market.dreamerqi.com/kpl`、`https://market.dreamerqi.com/admin` 均返回 200。
- 云端备份：`C:\PandaDashboard\backups\codex-chat-post-ui-20260706-065105`；后端备份：`C:\PandaDashboard\backups\codex-chat-asset-static-20260706-065255`。
## 2026-07-06 瞎聊聊页面二次重设计
- 将 `#chat` 页面从偏卡片瀑布流改成更清晰的社区帖子广场。
- 顶部新增完整介绍区：Community Board、瞎聊聊说明、帖子/图片/回复统计，并保留可爱插画作为右侧视觉。
- 发帖区独立居中，保留原有登录、文字、图片上传、发布逻辑，只优化层级、间距和按钮。
- 帖子区改为单列帖子流，新增筛选按钮：全部、带图、有回复、文字；点击筛选仅影响前端展示，不改后端数据。
- 帖子卡片改为更像帖子：头像、作者、时间、帖子标签、正文、图片、回复摘要和查看入口。
- 保持之前要求：首屏 `DreamerQi · 行情 / 娱乐 / 探索` 和三枚文字说明卡片不恢复，`SpbPillars` 函数仍保留但主页不渲染。
- 更新 `Qi/index.html` 脚本版本号为 `20260706-chat-board-redesign`。
- 验证：`https://dreamerqi.com/`、`https://dreamerqi.com/assets/chatter-cute-preview.png`、`https://dreamerqi.com/api/chatter/posts` 均正常返回。
- 云端备份：`C:\PandaDashboard\backups\codex-chat-board-redesign-final-20260706-070917`。

