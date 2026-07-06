# Panda 云端改动清单 · 2026-07-05

## 娱乐频道上线到云端主页

- 连接方式：SSH 443 当前被远端关闭，本次使用备用端口 2222 和 Codex 专用密钥登录云端。
- 已先阅读本地 `_cloud-ops-19.md`、云端 `PROJECT_HANDOFF.md`、`_cloud-change-log.md`、`_cloud-change-log-20260628.md`。
- 已备份云端相关文件到：
  - `C:\PandaDashboard\backups\codex-yule-cloud-20260705-060624`
- 已上传/更新文件：
  - `C:\PandaDashboard\yule-server.js`
  - `C:\PandaDashboard\yule.html`
  - `C:\PandaDashboard\yule-admin.html`
  - `C:\PandaDashboard\run-yule-server.cmd`
  - `C:\PandaDashboard\yule-data\`
  - `C:\PandaDashboard\Qi\index.html`
  - `C:\PandaDashboard\Qi\qi-home.jsx`
  - `C:\PandaDashboard\Qi\qi-home.compiled.js`
- 已对 `C:\PandaDashboard\kpl-stats-server.js` 做最小补丁：只新增 `/yule`、`/yule-admin`、`/api/yule/*`、`/yule-img/*` 到 127.0.0.1:8766 的薄代理，不覆盖行情、策略、同步、账号等逻辑。
- 已创建计划任务：
  - `Panda Yule Server`
  - 开机启动 `C:\PandaDashboard\run-yule-server.cmd`
  - 娱乐服务监听 `127.0.0.1:8766`
- 已重启：
  - `Panda Yule Server`
  - `Panda Dashboard Server`

## 主页入口

- 云端主页原娱乐入口指向 `https://stanning.dreamerqi.com`。
- 已改为站内 `/yule`，包括：
  - 顶部导航“娱乐”
  - 三大入口“娱乐”
  - “时尚 & 追星”日常入口
  - 页脚“娱乐”
- `Qi/index.html` 脚本版本改为 `qi-home.compiled.js?v=20260705-yule-cloud`，避免浏览器继续用旧缓存。

## 内容与来源显示

- 娱乐前台 `/yule` 和详情页 `/yule/item/:id` 不显示采集源、原文链接或来源标签。
- 公开接口 `/api/yule/list`、`/api/yule/item/:id` 已移除 `source`、`author` 字段。
- 来源和原文链接仍保留在后台 `/yule-admin`，方便后续审核和编辑。

## 验证结果

- `node --check kpl-stats-server.js`：通过。
- `node --check yule-server.js`：通过。
- `node --check Qi\qi-home.compiled.js`：通过。
- `http://124.222.188.68:8765/health`：200，`{"ok":true}`。
- `http://124.222.188.68:8765/yule`：200，返回娱乐页 HTML。
- `http://124.222.188.68:8765/yule-admin`：200，返回娱乐后台 HTML。
- `http://124.222.188.68:8765/api/yule/categories`：6 个栏目均有内容：
  - 明星热点 10
  - 影视综艺 10
  - 时尚穿搭 8
  - 音乐现场 10
  - 社会热点 10
  - 生活方式 10
- 抽查详情页：页面不显示 `采集源`、`weibo`、`douban`、`iqiyi`、`sina-fashion`、`qq-music` 等来源字样；图片返回 200。

## 纠正：娱乐入口沿用 stanning.dreamerqi.com

- 2026-07-05 后续确认：交接日志已明确要求娱乐入口沿用 `https://stanning.dreamerqi.com`，不是把主页入口改成 `/yule`。
- 已纠正主页入口：
  - `STANNING_URL` 恢复为 `https://stanning.dreamerqi.com`。
  - `Qi/index.html` 脚本版本更新为 `qi-home.compiled.js?v=20260705-stanning-content`。
- 已调整主服务代理：
  - `kpl-stats-server.js` 识别 Host 为 `stanning.dreamerqi.com` 时，将请求转发给娱乐独立服务 `127.0.0.1:8766`。
  - 继续保留 `/yule` 作为兼容入口，但不再作为主页娱乐主入口。
- 已调整娱乐服务：
  - `yule-server.js` 支持子域名根路径 `/` 和详情路径 `/item/:id`。
  - `yule.html` 的站内详情链接在 `stanning.dreamerqi.com` 下生成 `/item/:id`，返回按钮回到 `/`。
  - 顶部“行情”链接到 `https://market.dreamerqi.com/`，“首页”链接到 `https://dreamerqi.com/`。
- 验证：
  - `https://dreamerqi.com/` 返回 200，首页加载 `20260705-stanning-content`。
  - 公网 `qi-home.compiled.js` 中 `STANNING_URL` 为 `https://stanning.dreamerqi.com`，不再是 `/yule`。
  - `https://stanning.dreamerqi.com/` 返回 200，标题为 `娱乐 · Qi`，页面包含“热门娱乐”“娱乐热榜”。
  - `https://stanning.dreamerqi.com/api/yule/categories` 返回 200。
  - `https://stanning.dreamerqi.com/item/:id` 返回 200，前台不显示采集源或外部来源名。
  - 端口状态：`0.0.0.0:8765` 监听主服务，`127.0.0.1:8766` 监听娱乐服务。
- 纠正前备份：
  - `C:\PandaDashboard\backups\codex-stanning-fix-20260705-075019`

### 2026-07-05 DreamerQi 鍏ㄧ珯鍏变韩鐧诲綍 + 濞变箰椤堕儴缁熶竴 + 鎺㈢储鍐呭浼樺寲
- 鍏变韩鐧诲綍: 涓婚〉/鎺㈢储椤点€佽鎯呴〉銆佸ū涔愰〉閮芥帴鍏?`.dreamerqi.com` 鍩?[REDACTED] + `panda_account_session`銆傛棫 localStorage 浠嶅吋瀹?浣嗗惎鍔ㄦ椂浼樺厛璇诲叡浜姸鎬?琛屾儏椤靛厛鏄剧ず璐﹀彿蹇収,鍐嶅悗鍙版牎楠?`/api/auth/me`銆?- 濞变箰椤甸《閮? `stanning.dreamerqi.com` 鏀规垚 棣栭〉/琛屾儏/濞变箰/鎺㈢储 + 鍙充晶璐﹀彿鐘舵€佹爮;鏈櫥褰曞彲鎵撳紑鐧诲綍寮圭獥,鐧诲綍璋冪敤 `https://dreamerqi.com/api/auth/login`;璇︽儏椤靛悓鏍蜂繚鐣欓《閮ㄨ处鍙锋爮銆?- 鎺㈢储椤靛唴瀹? `kpl-stats-server.js` 鎵╁睍鏂板簵/棣栧簵/鎺㈠簵/鐢熸椿鏂瑰紡/灞曡/涔版墜搴楃瓑鏌ヨ璇?鏃у簱鍜屾柊閲囬泦閮戒細鐢熸垚 `editorialSummary/tagline/sceneTag/highlights/editorialDetail`,鍘绘帀鐢ㄦ埛渚р€滅嚎绱?寰呮牳楠屸€濊姘斻€?- 鎺㈢储椤靛浘鐗? 鍘熷浘浼樺厛;鏃犲浘鏃舵寜鍜栧暋/椁愬巺/鐢滃搧/闈㈠寘/鑼堕ギ/閰掑惂/涔版墜搴?灞曡绌洪棿琛ラ珮娓呭厹搴曞浘銆傜嚎涓?`/api/discovery` 楠岃瘉鏃犵┖鍥俱€?- 鎺㈢储椤靛墠绔? 鏍囬鏀逛负鈥滃煄甯傛柊搴椾笌濂藉幓澶勨€?缁熻鏀逛负鈥滅珯鍐呭唴瀹光€?鍔犺浇鏂囨鏀逛负鈥滄鍦ㄥ姞杞戒粖鏃ユ帰绱㈠唴瀹?..鈥濄€?- 閮ㄧ讲鏂囦欢: `kpl-stats-server.js`, `kpl-dashboard_17_apple.html`, `yule.html`, `Qi/index.html`, `Qi/qi-home.jsx`, `Qi/qi-home.compiled.js`;涓婚〉鑴氭湰鐗堟湰 `20260705-auth-explore`銆?- 澶囦唤: `C:\PandaDashboard\backups\codex-auth-explore-20260705-232032`銆?- 楠岃瘉: `dreamerqi.com` 鏂拌剼鏈増鏈甯? `stanning.dreamerqi.com` 鏈?`accountArea` 鍜屾帰绱㈤摼鎺? `market.dreamerqi.com` 鏈夊叡浜櫥褰曡鍙栭€昏緫; `explore.dreamerqi.com/api/discovery` 杩斿洖绔欏唴鎽樿銆佹爣绛惧拰鍥剧墖銆?

### 2026-07-05 濞变箰/鎺㈢储鑷姩鏇存柊鏃堕棿璋冩暣
- 鐢ㄦ埛瑕佹眰:濞变箰椤垫湇鍔℃瘡 2 灏忔椂妫€鏌ヤ竴娆?鎺㈢储椤垫瘡澶?12 鐐瑰悓姝ヤ竴娆°€?- `yule-server.js`: `crawl.intervalHours=2`;璋冨害浠庘€滄瘡 10 鍒嗛挓妫€鏌ャ€佹瘡澶?7 鐐硅窇涓€娆♀€濇敼涓衡€滄寜鏈€杩戜竴娆￠噰闆嗘椂闂?姣?2 灏忔椂璺戜竴杞?`interval-schedule` 閲囬泦妫€鏌モ€濄€備繚鐣?`dailyHour` 浣滀负鏃ч厤缃吋瀹瑰瓧娈?涓嶅啀浣滀负涓昏皟搴︺€?- `kpl-stats-server.js`:鎺㈢储鑷姩鍚屾榛樿鏃堕棿浠?10:10 鏀逛负 12:00 (`PANDA_DISCOVERY_AUTO_SYNC_HOUR || 12`, `PANDA_DISCOVERY_AUTO_SYNC_MINUTE || 0`)銆?- 閮ㄧ讲:涓婁紶 `kpl-stats-server.js` + `yule-server.js`,閲嶅惎 `Panda Dashboard Server` 鍜?`Panda Yule Server`銆傚浠? `C:\PandaDashboard\backups\codex-schedule-change-20260705-233627`銆?- 楠岃瘉:浜戠 `findstr` 纭 `intervalHours: 2`銆乣interval-schedule`銆佹帰绱㈤粯璁?12:00; `stanning.dreamerqi.com/api/yule/health` 姝ｅ父; `explore.dreamerqi.com/api/discovery` 姝ｅ父;濞变箰鏃ュ織鍑虹幇 `runCollect 寮€濮?(interval-schedule)`銆?

## 2026-07-05 Codex 探索页数据质量升级
- 备份目录: C:\PandaDashboard\backups\codex-discovery-quality-20260706-001007
- 更新主服务探索采集: 新增百度新闻 JSON 源、图片代理缓存、百度图片补图、质量过滤、城市主题兜底。
- 更新探索数据库: 36 条内容, 覆盖北京/上海/广州/深圳/成都/杭州/重庆/长沙。
- 更新主页探索展示: 新增今日精选区, 脚本版本 20260705-discovery-quality。
- 娱乐服务未修改。

## 2026-07-06 Codex 娱乐页数量上限调整
- 用户要求: 每个娱乐细分最多保留 50 条, 6 类最多约 300 条; 超过 5 天自动清理保持不变。
- 已更新: C:\PandaDashboard\yule-server.js 默认 perCategoryMax=50, 相关 fallback 上限=50; C:\PandaDashboard\yule-data\yule-config.json perCategoryMax=50。
- 备份目录: C:\PandaDashboard\backups\codex-yule-limit-50-20260706-082132
- 已重启 Panda Yule Server。

## 2026-07-06 Codex 首页底部产品列表调整
- 用户要求: 首页底部产品只保留一个 Qi行情, 链接到行情页面; 其他入口不作为产品展示。
- 已更新: Qi/index.html 脚本版本 20260706-footer-product; Qi/qi-home.jsx 与 qi-home.compiled.js 底部产品列仅保留 Qi行情 - 备份目录: C:\PandaDashboard\backups\codex-footer-product-20260706-082624

## 2026-07-06 08:52 Codex discovery real-place refresh
- Updated kpl-stats-server.js discovery pipeline to extract concrete place names per city/category and reject generic list/guide titles.
- Replaced generic discovery fallback with real place seed items and balanced city/category selection.
- Uploaded panda-discovery-db.json with 186 ready items; Shanghai coffee includes Pull Tab, Trung Nguyen Legend, 一尺花园, Punchline Coffee, M Stand.
- Backup: C:\PandaDashboard\backups\codex-discovery-realplaces-20260706-085150
- Restarted Panda Dashboard Server and verified https://explore.dreamerqi.com/api/discovery returns status ready and itemCount 186.

## 2026-07-06 09:04 Codex content sync and chatter
- Added admin content sync panel in panda-admin.html with manual buttons for Yule and Discovery.
- Added protected admin APIs: /api/admin/content-sync/status, /api/admin/content-sync/yule, /api/admin/content-sync/discovery.
- Added Chatter/XiaLiaoLiao public card feed APIs: /api/chatter/posts and /api/chatter/image/*; logged-in users can post text plus one image.
- Added homepage/nav entry and #chat page for 瞎聊聊; images become card previews.
- Backup: C:\PandaDashboard\backups\codex-content-sync-chat-20260706-090335
- Restarted Panda Dashboard Server and verified dreamerqi.com, admin page, compiled homepage script, and /api/chatter/posts.

## 2026-07-06 09:08 Codex home live cards
- Updated homepage Daily routes cards: market card reads /api/dashboard-live涨跌家数, yule card reads /api/yule/home-teaser, discovery card reads /api/discovery top ranked item.
- Uploaded Qi/index.html, Qi/qi-home.jsx, Qi/qi-home.compiled.js with cache version 20260706-live-cards.
- Backup: C:\PandaDashboard\backups\codex-home-live-cards-20260706-090839
- Verified dreamerqi.com HTML references new script and data APIs return market/yule/discovery payloads.

## 2026-07-06 09:12 Codex strategy inflow color
- Updated market strategy page net inflow color rules: positive inflow red, negative inflow green, zero flat.
- Changed 今日主线榜 ml-inflow and inflow score chips to carry up/down/flat classes.
- Backup: C:\PandaDashboard\backups\codex-strategy-inflow-color-20260706-091210
- Uploaded kpl-dashboard_17_apple.html and verified market.dreamerqi.com/kpl returns updated CSS/JS.

## 2026-07-06 Codex discovery image/content refresh
- 探索页后台修复：只有类目兜底图时不再跳过找图，自动按“城市+店名+类目”继续找门店相关图片。
- 探索页图片增强：当前 panda-discovery-db.json 共 186 条，兜底图 0 条；百度图片 182 条，原采集图 4 条；咖啡 27 条兜底图 0 条。
- 上海咖啡重点补图：Pull Tab拉环咖啡、越南中原传奇咖啡、一尺花园静安花房店、Punchline Coffee、M Stand 均有 3 张图片。
- 探索详情页新增 imageCaption 图片说明，并扩展详情文案为看点、路线价值、到店前提醒。
- 前端缓存版本：qi-home.compiled.js?v=20260706-discovery-images。
- 备份目录：C:\PandaDashboard\backups\codex-discovery-images-20260706-182529

## 2026-07-06 Codex chatter comments/high-res refresh
- 瞎聊聊后台新增单帖详情接口 GET /api/chatter/posts/:id，以及评论接口 POST /api/chatter/posts/:id/comments；评论需要登录。
- 帖子数据兼容旧结构，新增 comments、commentCount；每帖最多保留 200 条评论，单条评论最多 600 字。
- 瞎聊聊列表图改为更大预览宽度并使用原图地址，详情页图片改为 contain 完整高清展示，避免裁切成低清预览。
- 点开卡片后新增评论互动区：展示评论列表、回复数量、回复输入框，登录用户可评论。
- 前端缓存版本：qi-home.compiled.js?v=20260706-chat-comments。
- 备份目录：C:\PandaDashboard\backups\codex-chat-comments-20260706-183321

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

