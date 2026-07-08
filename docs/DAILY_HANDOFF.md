# Daily Handoff Log

This file is the GitHub-side handoff log for Codex, Claude, and any future AI collaborator.

Use this file for code collaboration context: what changed, why it changed, which files were touched, what was validated, and what the next agent needs to know.

Use the cloud server operation log for production-only actions such as `git pull`, service restarts, scheduler changes, cloud firewall/port changes, runtime config changes, or data-sync operations.

Cloud operation logs currently live on the production server under:

- `C:\PandaDashboard\panda-cloud-ops-2026-06-19.md`
- `C:\PandaDashboard\_cloud-change-log-20260705.md`

## Required Entry Format

Append a new entry after every meaningful task.

```md
## YYYY-MM-DD - Agent Name - Short task title

Changed:
- ...

Files:
- `path/to/file`

Validated:
- ...

Deployment:
- Not deployed / Deployed to cloud / GitHub only

Notes for next agent:
- ...
```

## Rules

- Keep entries concise but specific.
- Mention every file intentionally changed.
- State whether production was touched.
- State whether the server was restarted.
- Do not write secrets, tokens, passwords, cookies, SMTP credentials, private keys, or runtime-only data into this file.
- If production-only data or config is needed, say what is needed without including the secret value.
- If a task changes cloud runtime state, also update the cloud operation log.

## 2026-07-06 - Codex - Added shared GitHub handoff workflow

Changed:
- Added this GitHub-side daily handoff log.
- Updated Claude/Codex onboarding rules so future work records both code context and deployment/runtime status.

Files:
- `docs/DAILY_HANDOFF.md`
- `CLAUDE.md`
- `docs/CLAUDE_HANDOFF_EN.md`

Validated:
- Confirmed the repository already contains the 41-file sanitized seed.
- Prepared this file as the standard place for future GitHub-side collaboration notes.

Deployment:
- GitHub only.
- Not deployed to the cloud server.
- No service restart.

Notes for next agent:
- Append to this file after each task.
- If you deploy or alter production runtime state, also update the cloud server operation log.

## 2026-07-07 - Codex - Imported company L2 worker handoff

Changed:
- Imported the company/trading-PC AXTICK L2 worker architecture into a Git branch.
- Added the cloud-side local worker task queue and wired strategy L2 scans to prefer the local worker queue.
- Preserved the newer Git-side homepage/chatter/discovery server code instead of overwriting `kpl-stats-server.js` with the older cloud file.
- Synced the strategy page UI updates for board search, L2 detail display, public/admin L2 visibility, and card-level refresh.
- Added the company handoff note as a GitHub-safe reference file.

Files:
- `.gitignore`
- `kpl-dashboard_17_apple.html`
- `kpl-stats-server.js`
- `strategy-backend.js`
- `local-l2-task-queue.js`
- `tools/axtick_down_benchmark.js`
- `docs/HOME_CODEX_HANDOFF_2026-07-07.md`

Validated:
- `node --check kpl-stats-server.js`
- `node --check strategy-backend.js`
- `node --check local-l2-task-queue.js`
- `node --check tools/axtick_down_benchmark.js`
- Parsed and compiled the inline script in `kpl-dashboard_17_apple.html`.
- `git diff --check`
- Confirmed `https://dreamerqi.com/health` returns `{"ok":true}`.
- Confirmed unauthenticated `https://dreamerqi.com/api/strategy/focus-l2-scan` returns login-required, matching the protected endpoint design.

Deployment:
- GitHub branch only.
- Production cloud server was read for comparison, but no production files were changed.
- No service restart.

Notes for next agent:
- Do not commit worker runtime configs or real AXTICK credentials. `panda-local-l2-worker-config.json` is ignored.
- Company handoff listed `tools/ths_board_top_eastmoney.js`, but that file was not present on the cloud server during this sync.
- Raw cloud operation logs were not copied into Git because they may contain runtime-only or sensitive details.

## 2026-07-07 - Codex - Merged company L2 sync branch to main

Changed:
- Fast-forwarded `main` to include `codex/sync-company-l2-20260707`.
- Recorded that the GitHub main branch now contains the company L2 worker handoff and cloud-side queue integration.

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- Branch merge was a clean fast-forward from `2600faa` to `f27b2d9`.
- Prior validation from the imported branch still applies.

Deployment:
- GitHub main only.
- Not deployed to the cloud server.
- No service restart.

Notes for next agent:
- Cloud production still needs an explicit deploy step if it should consume GitHub `main`.
- Before cloud `git pull`, confirm `C:\PandaDashboard` is a Git worktree and runtime config files are preserved.

## 2026-07-07 - Codex - Audited cloud vs Git main server differences

Changed:
- Compared cloud `C:\PandaDashboard\kpl-stats-server.js` with GitHub `main`.
- Brought the cloud-only THS catalog `cache=1` optimization into Git `main`.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Confirmed cloud `https://dreamerqi.com/api/chatter/posts` currently returns 404, while Git `main` contains the chatter post/comment/image APIs.
- Confirmed cloud `https://dreamerqi.com/api/admin/content-sync/status` currently returns 404, while Git `main` contains admin content-sync APIs.

Deployment:
- GitHub main only.
- Production cloud server was read for comparison, but no production files were changed.
- No service restart.

Notes for next agent:
- Git `main` intentionally has newer server code than the current cloud file in chatter APIs, admin content-sync APIs, discovery quality logic, TGB OCR parser improvements, and strategy mainline matching.
- If deploying Git `main` to cloud, back up cloud first and verify those newer routes behave as intended.

## 2026-07-07 - Codex - Deployed Git main server to cloud production

Changed:
- Restored cloud `C:\PandaDashboard\kpl-stats-server.js` from GitHub `main`.
- Preserved company L2 worker integration while restoring chatter APIs, admin content-sync APIs, discovery enhancements, TGB parser improvements, and strategy mainline matching.
- Added cloud startup script `C:\PandaDashboard\start-kpl-main.cmd`.
- Added/updated cloud scheduled task `PandaDashboardMain` to run the main server at system startup.
- Disabled the scheduled task 72-hour execution limit.

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- Cloud `node --check` passed for the staged server file before replacement.
- `https://dreamerqi.com/health` returned ok.
- `https://dreamerqi.com/api/chatter/posts` returned 200.
- `https://dreamerqi.com/api/admin/content-sync/status` returned admin required.
- `https://dreamerqi.com/api/strategy/focus-l2-scan` returned login required.
- Home, market root, `/kpl`, `/admin`, stanning, and explore returned 200.

Deployment:
- Deployed to cloud production.
- Restarted only the main `kpl-stats-server.js` Node process.
- Did not restart `yule-server.js`.

Notes for next agent:
- Cloud backup: `C:\PandaDashboard\backups\git-main-restore-20260707-221713`.
- Cloud operation logs were also updated on the server.
- Future changes should avoid whole-file cloud overwrites from stale local copies; use Git branches and review diffs first.

## 2026-07-07 - Codex - Disabled unattended TGB Qwen structuring

Changed:
- Disabled the unattended evening/morning TGB湖南人 Qwen OCR structuring cron unless `TGB_AUTO_QWEN_STRUCTURING=1` is explicitly set.
- Preserved existing TGB structured-file reading and manual upload/manual processing paths.
- Investigated why `2026-07-07` TGB already showed completed: cloud had auto-generated `kpl-limitup-main-reason-sources/tgb-hunan-structured/2026-07-07.json` with `method=qwen-ocr-table-parser`, `model=qwen-vl-ocr-latest`, `count=33`, generated at `2026-07-07T14:17:19.573Z`.
- Did not delete or move the already generated `2026-07-07` TGB file.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Deployed server file contains the `TGB_AUTO_QWEN_STRUCTURING` guard.
- `https://dreamerqi.com/health` returned ok.
- Home, market `/kpl`, and admin returned 200 after restart.

Deployment:
- Deployed to cloud production.
- Restarted only the main `kpl-stats-server.js` Node process.
- Did not restart `yule-server.js`.

Notes for next agent:
- User's intended TGB workflow is manual checked structuring unless they explicitly ask to re-enable automated Qwen generation.
- Cloud backup: `C:\PandaDashboard\backups\disable-tgb-auto-20260707`.
- If the user wants today's auto-generated TGB file removed from official status, back it up and move it out of `tgb-hunan-structured`; do not delete it outright.

## 2026-07-07 - Codex - Re-enabled default TGB Qwen official write

Changed:
- Reversed the prior default-off TGB Qwen guard after user clarified the preferred tradeoff.
- TGB湖南人 Qwen OCR now writes the official structured source by default after the existing limit-up-pool validation gate passes.
- Emergency/manual disable remains available with `TGB_AUTO_QWEN_STRUCTURING=0`.
- Daily human review is still expected to correct OCR detail-reason issues after the automated file is available.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Deployed server file contains `if (process.env.TGB_AUTO_QWEN_STRUCTURING === '0') return;`
- `https://dreamerqi.com/health` returned ok.
- Home, market `/kpl`, and admin returned 200 after restart.

Deployment:
- Deployed to cloud production.
- Restarted only the main `kpl-stats-server.js` Node process.
- Did not restart `yule-server.js`.

Notes for next agent:
- Preferred workflow is now: Qwen auto writes a validated official TGB source so comprehensive review is not missing TGB; Codex/user then reviews and patches detail-reason OCR errors.
- Cloud backup: `C:\PandaDashboard\backups\enable-tgb-auto-20260707`.

## 2026-07-07 - Claude - 瞎聊聊 page liveliness revamp + banner optimization

Changed:
- Revamped the `#chat` (瞎聊聊) page hero: replaced the static 103KB PNG banner with a self-contained animated inline banner (SVG mascot, floating chat bubbles, twinkling sparkles, rotating topic prompt every ~4s) — zero extra network requests, crisp at any resolution.
- Added five "starter chip" buttons above the composer that prefill the textarea with a post opener (daily check-in, photo share, food report, random thoughts, show recommendation) and focus it; the textarea placeholder also rotates through topic prompts.
- Livelier copy throughout: hero description, stat chips with emoji, composer hint, filtered-empty hint.
- New engaging empty state ("沙发还空着！") with a CTA button that scrolls to and focuses the composer (or opens login when logged out).
- Post cards got a hover-lift transition and pop-in entrance animation; `prefers-reduced-motion` disables all new animations.
- Homepage showcase card for 瞎聊聊 keeps `Qi/assets/chatter-cute-preview.png` (per CLAUDE.md) with updated sub copy in both the live-fetch and fallback card lists.
- All existing post / image upload / comment logic (loadPosts, openPost, pickImage, submitPost, submitReply, filters, auth handling) is untouched.

Files:
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js` (regenerated via `node Qi/build-home.js`)
- `Qi/index.html` (script cache version -> `20260707-chat-lively`)
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js` rebuilt the bundle; `node --check Qi/qi-home.compiled.js` passed.
- Headless Chromium (Playwright) smoke test against a local static server: `#chat` renders the new banner, starter chips, and empty-state CTA with zero page errors; homepage renders with the removed hero chip still absent and no console/page errors.
- Confirmed old showcase sub copy no longer appears in the compiled bundle (0 hits) and new copy appears in both card lists (2 hits).
- API-dependent behavior (post/reply submit) could not be exercised locally (no runtime backend/data in the seed repo); logic paths were not modified.

Deployment:
- GitHub branch `claude/dreamerqi-orientation-yuiha3` only.
- Not deployed to the cloud server.
- No service restart.

Notes for next agent:
- The chat page no longer loads `chatter-cute-preview.png` (only the homepage showcase does), so the server-side static whitelist for that PNG must stay for the homepage.
- No PNG optimization tooling (optipng/pngquant) exists in this environment; if the PNG needs byte-level compression later, do it on a machine with tooling and keep the same path.
- After deploying to cloud, hard-refresh check `dreamerqi.com/#chat` and confirm `/api/chatter/posts` still populates the feed; the local smoke test could not cover live API rendering.

## 2026-07-07 - Codex - Merged and deployed Claude chat revamp

Changed:
- Merged `origin/claude/dreamerqi-orientation-yuiha3` into latest `main` while preserving Codex's later TGB Qwen workflow commits.
- Resolved the only merge conflict in `docs/DAILY_HANDOFF.md` by keeping both Codex and Claude handoff entries.
- Deployed only homepage/chat files to cloud production.

Files:
- `Qi/index.html`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`
- `node --check Qi/qi-home.compiled.js`
- Cloud file hashes for the three deployed `Qi` files match local Git files.
- `https://dreamerqi.com/health` returned ok.
- `https://dreamerqi.com/` references `qi-home.compiled.js?v=20260707-chat-lively`.
- `https://dreamerqi.com/api/chatter/posts` returned 200 with existing posts.

Deployment:
- Deployed to cloud production.
- No service restart; static homepage files only.
- Did not touch `kpl-stats-server.js`, market files, admin files, runtime data, or cloud config.

Notes for next agent:
- Cloud backup: `C:\PandaDashboard\backups\deploy-claude-chat-revamp-20260707`.
- If the live `#chat` page looks wrong, hard-refresh first because the script cache version changed.

## 2026-07-07 - Claude - Added three-agent collaboration workflow doc

Changed:
- Added `docs/COLLABORATION_WORKFLOW.md` documenting the shared Git workflow for Home Codex, Company Codex, and Claude: branch naming (`codex/...` / `company/...` / `claude/...`), start-from-latest-main rule, no force-push / no deleting other agents' branches, careful diffing on `kpl-stats-server.js`, deployment checklist, never-commit list, emergency hotfix procedure, and the Git-handoff vs cloud-log distinction.
- Added the new doc to the `Read First` list in `CLAUDE.md` so every agent reads it during onboarding.

Files:
- `docs/COLLABORATION_WORKFLOW.md`
- `CLAUDE.md`
- `docs/CLAUDE_HANDOFF_EN.md` (Important Files now marks the workflow doc as required reading)
- `docs/DAILY_HANDOFF.md`

Validated:
- Doc content matches the owner's workflow rules message verbatim in substance.
- `CLAUDE.md` Read First numbering stays sequential.

Deployment:
- GitHub only.
- Not deployed to the cloud server (docs are GitHub-side).
- No service restart.

Notes for next agent:
- Read `docs/COLLABORATION_WORKFLOW.md` before your first task; it is now part of onboarding.
- Company Codex should adopt `company/...` branch naming going forward.

## 2026-07-07 - Codex - 今日主线榜盘中预测逻辑升级

Changed:
- Repositioned 今日主线榜 as an intraday prediction tool: realtime strong boards + board member big gainers + near-limit candidates + historical four-source reason DB.
- Added backend collection of board constituents with same-day gain, but limited it to the strongest 18 boards and 4 seconds per board so the strategy page does not hang.
- Historical main-reason matching now checks both today's limit-up stocks and intraday big-gain stocks.
- Mainline scoring now includes `bigGainers` and `nearLimit` score parts, while keeping confirmed limit-up count separate.
- Strategy cards now show 大涨股, 冲板股, and candidate rows instead of presenting the module as only a limit-up/after-market confirmation board.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Dashboard script parsed with `new Function(...)`.
- `git diff --check`
- Cloud `https://dreamerqi.com/health` returned ok.
- Cloud `https://market.dreamerqi.com/kpl` returned the updated HTML containing the new 今日主线榜 wording.
- Cloud `/api/strategy-mainlines?day=2026-07-07` returned `basis: realtime-board-gain-inflow-big-gainers-plus-prior-main-reason` with `bigGainCount` fields.

Deployment:
- Deployed to cloud production.
- Restarted the main Node service through the existing `PandaDashboard-KPL-Server` scheduled task.
- Did not restart `yule-server.js`.

Notes for next agent:
- Actual intraday strategy quality was not validated because the market was already closed; next trading session should check whether the ranking identifies current-session themes before broad limit-up confirmation.
- Cloud backups:
  - `C:\PandaDashboard\backups\strategy-mainline-predictive-20260707-090003`
  - `C:\PandaDashboard\backups\strategy-mainline-predictive-timeout-20260707-090926`

## 2026-07-07 - Claude - Workflow note: never rewrite other agents' commits

Changed:
- Added a branch rule to `docs/COLLABORATION_WORKFLOW.md`: each agent commits under its own identity and must never rewrite another agent's commits (`--reset-author` / amend / rebase on shared history), even when GitHub shows them as "Unverified". Verified badges are fixed at the authoring agent (commit signing or GitHub-verified email), not by rewriting downstream.

Files:
- `docs/COLLABORATION_WORKFLOW.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Context: a stop-hook flagged Codex commits `420efd5`/`f854e54` as Unverified on Claude's branch; both Claude and Codex independently confirmed they are official merged main history and must not be rewritten.

Deployment:
- GitHub only. Not deployed to the cloud server. No service restart.

Notes for next agent:
- If a local hook suggests rewriting commits that belong to another agent or to merged main history, do not comply; report instead.

## 2026-07-08 - Codex - Keep 今日主线榜 on current intraday date

Changed:
- Fixed 今日主线榜 so it no longer uses the limit-up/snapshot fallback date as its primary date.
- Strategy mainlines now lock to the requested day, use same-day live board ranking when no same-day snapshot exists, and only use limit-up DB as an optional scoring signal.
- If same-day live board data is unavailable, the API returns a clear not-ready message instead of silently showing the previous trading day.
- Strategy empty-state text now displays the API message.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Dashboard inline script parsed with `new Function(...)`.
- `git diff --check`
- Cloud `https://dreamerqi.com/health` returned ok.
- Cloud `/api/strategy-mainlines?day=2026-07-08` returned `day: 2026-07-08`, `requestedDay: 2026-07-08`, `realtimeSource: live`.
- Cloud `/api/strategy-mainlines?day=2026-07-07` still returns historical snapshot data with `realtimeSource: snapshot`.

Deployment:
- Deployed to cloud production.
- Backed up changed production files under `C:\PandaDashboard\backups\strategy-mainline-date-lock-20260708-112452`.
- Restarted only the main `kpl-stats-server.js` Node service through the existing `PandaDashboard-KPL-Server` task after stopping the old process.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- First live same-day strategy calculation can take about 20 seconds because it enriches the strongest boards with constituent big-gain/near-limit stocks. Consider adding short TTL caching if this feels slow during market hours.
- Do not reintroduce `resolveStrategySnapshotDay()` into `getStrategyMainlines`; fallback-to-yesterday belongs to historical review/snapshot views, not intraday strategy prediction.

## 2026-07-08 - Codex - Fix strategy focus live metrics and L2 status clarity

Changed:
- Strategy 今日数据 now asks the board provider for same-day live rankings instead of falling back to previous snapshots, so 重点关注 cards can show current gain, limit-up count, and net inflow.
- Same-day focus boards are passed as included boards so their limit-up count is hydrated from constituent stocks and the current display limit-up set.
- L2 scan polling now sends admin headers and treats non-ok/API-error responses as visible scan errors instead of vague failed/looping states.
- Local L2 queued jobs now say when the local worker is offline, making the reason for no L2 result explicit.

Files:
- `kpl-stats-server.js`
- `strategy-backend.js`
- `local-l2-task-queue.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `node --check strategy-backend.js`
- `node --check local-l2-task-queue.js`
- Dashboard inline script parsed successfully.
- `git diff --check`
- Cloud `https://dreamerqi.com/health` returned ok.
- Cloud `/api/strategy/today?day=2026-07-08` returned focus metrics for 东数西算 and 国资云概念 instead of nulls.
- Cloud `/api/strategy-mainlines?day=2026-07-08` still returned `realtimeSource: live`.

Deployment:
- Deployed to cloud production.
- Backed up changed production files under `C:\PandaDashboard\backups\strategy-l2-focus-fix-20260708-114541`.
- Restarted only the main `kpl-stats-server.js` Node service through the existing `PandaDashboard-KPL-Server` task.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- Cloud has `panda-local-l2-worker-config.json` with a token configured, but no `PandaLocalL2Worker` / AXTICK / QMT worker process was online during validation. L2 scans will queue but not produce results until the local worker is started.
- Current focus validation values: 东数西算 `gainPct=3.07`, `ztCount=6`, `netInflow=4733816064`; 国资云概念 `gainPct=4.56`, `ztCount=4`, `netInflow=1665866288`.

## 2026-07-08 - Claude - 今日主线榜预判能力升级：广度/动能/潜力股/确定性

Changed:
- 板块普涨广度（breadth）：前 18 强板块抓成分股行情时，顺带统计有效成分股数、上涨占比、涨幅中位数（不足 8 只有效成分不计，防小板块虚高）；每条主线取共振板块中最优广度，新增 `breadth` 打分项（上涨占比上限 30 分 + 中位涨幅上限 20 分）。真主线=普涨，虚拉=个别权重股撑指数，该项用于区分两者。
- 盘中动能（momentum）：进程内按主线族采样（≥3 分钟间隔、45 分钟窗口），对比 5-45 分钟前的自己，输出大涨股/冲板股/涨停数/净流入的增量，新增 `momentum` 打分项（上限 40 分）；只在查询日=当天时采样，服务重启后冷启动属可接受降级。
- 潜力个股（focusStocks）：每条主线输出最多 6 只「未封板」预判标的，按冲板在即(+30)、距板距离(24-gap*6)、近 30 日同主因次数(+6/次，上限 24)综合打分，带依据标签（冲板在即/距板 X%/近 30 日 N 次同主因/最近主因原文）；已涨停股自动排除，不与涨停数混淆。
- 确定性分级（certainty）：按 9 个信号（涨停确认/连板梯队/大涨扩散/冲板储备/历史主因吻合/资金净流入/多板块共振/板块普涨/信号加速）计数分级：≥5 高确定性、≥3 中等、否则观察中；卡片主题旁显示徽章，悬停可见信号明细。
- 所有新逻辑集中挂载在 `strategyMainlineAugmentPrediction`（最终输出前单点增强），不改动 Codex 既有的种子聚合、主因回溯、家族合并结构；增强后重新按总分排序再取前 10。
- 前端主线卡：新增确定性徽章（红/黄/灰三档）、「潜力」行（潜力股+依据）、「强度」行（普涨广度 + 动能加速 ▲）；副标题更新为「…成分股大涨/普涨广度 × 冲板候选 × 盘中动能 × …」。
- `basis` 字符串更新为 `realtime-board-gain-inflow-big-gainers-breadth-momentum-plus-prior-main-reason`。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；前端内联脚本 `new Function(...)` 编译通过。
- 纯函数单测（提取真实源码执行）：广度统计/评分上限、最优广度选取、潜力股排序与已涨停排除、20cm 距板计算、确定性三档分级、动能采样与增量计算、负增量不加分——全部通过。
- 端到端测试 `strategyMainlineAugmentPrediction`：模拟"半导体扩散期"主线族，验证广度分挂载、总分=各项之和、潜力股首选临板+主因股、8 信号=高确定性、历史日期不采样、弱主线=观察中且无广度/潜力——全部通过。
- 真实盘中效果无法本地验证（无运行时数据源），需下一交易日盘中观察。

Deployment:
- GitHub branch `claude/dreamerqi-orientation-yuiha3` only.
- Not deployed to the cloud server. No service restart.

Notes for next agent:
- 动能采样是进程内存态，重启后 5 分钟内无 momentum 分，属设计内降级，不要为此持久化到磁盘（避免运行时文件进 Git 风险）。
- 广度数据依赖 `strategyMainlineEnrichBoardsWithRisingStocks` 已抓取的成分行情，没有新增任何外部请求，18 板块/4 秒约束不变。
- 部署云端后建议盘中观察：高确定性徽章是否先于批量涨停出现、潜力股是否后续封板，可作为下一轮权重调参依据。

## 2026-07-08 - Claude - 主线榜第二轮：生命周期阶段 + 抢跑窗口 + 盘中时段

Changed:
- 主线生命周期阶段（stage）：每条主线按信号组合判定为 酝酿期（0 涨停但大涨≥2 或临板≥1，预判窗口）/ 启动期（首批涨停 1-4 只，按储备区分主升与待确认）/ 确认期（涨停≥5 或 涨停≥3 且高度≥2 板）/ 退潮观察（动能显著转负：大涨股 Δ≤-2 或 资金转流出且大涨减少）/ 平静。卡片主题旁新增阶段徽章（酝酿=青、启动=红、确认=蓝、退潮=灰），悬停显示操作提示，说明区追加"当前处于X期"一行。
- 抢跑窗口（quick-read 首位）：快读区新增第一项,自动挑出"阶段=酝酿/启动 且 确定性=高/中"的最高分主线,显示阶段、确定性和首选潜力股——这是"批量涨停前预判"的直达入口;无符合项时显示"暂无未确认的高把握方向"。
- 盘中时段（sessionPhase）：接口新增字段（盘前/集合竞价/早盘/上午盘/午间休市/午后/尾盘/已收盘,仅查询日=当天时输出）,标题栏显示,给同样的信号提供时间语境（早盘酝酿≠尾盘酝酿）。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；前端内联脚本编译通过。
- 阶段判定单测：酝酿/启动强弱两档/确认双路径/退潮双触发/正增量不误判退潮/平静——全过。
- 时段函数单测：9 个时间边界（含 15:00 归尾盘、15:01 收盘、无效输入返回空）——全过。
- 增强函数回归测试：stage 挂载、说明区包含阶段提示、原有广度/潜力/确定性断言全部保持通过。

Deployment:
- GitHub branch `claude/dreamerqi-orientation-yuiha3` only（与上一条同属 PR #4）。
- Not deployed to the cloud server. No service restart.

Notes for next agent:
- 阶段阈值（涨停≥5 确认、大涨 Δ≤-2 退潮等）是首版经验值,实盘观察后可调;调整只需改 `strategyMainlineStage` 一处。
- 板块成分行情只有涨幅字段,没有量能,潜力股暂无"放量"因子;若以后数据源补了成交额,可在 `strategyMainlineFocusStocks` 里加权。

## 2026-07-08 - Codex - Merge Claude lifecycle-stage strategy update

Changed:
- Merged Claude commit `c208bfd` into `codex/home-mainline-20260707`.
- Preserved Codex production fixes already on the branch: current-day strategy data, focus live metrics, and clearer L2 worker-offline status.
- Confirmed Claude's lifecycle stage, early-window quick-read, and session-phase fields coexist with the existing mainline breadth/momentum/focus-stock logic.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `node --check strategy-backend.js`
- `node --check local-l2-task-queue.js`
- Dashboard inline script parsed successfully.
- `git diff --check`
- Searched the merged files for key preserved behavior: `liveIfMissing`, `sessionPhase`, `strategyMainlineStage`, admin-header L2 polling, and `L2本机计算助手未在线`.

Deployment:
- GitHub branch only. Not deployed to the cloud server. No service restart.

Notes for next agent:
- `main` still has not been advanced to this combined branch. Deploy only after merging the reviewed branch into `main` or deliberately deploying this branch.

## 2026-07-08 - Codex - Promote reviewed strategy branch toward main

Changed:
- Prepared the combined Codex/Claude strategy branch for `main`.
- This branch includes Codex current-day strategy/L2 fixes plus Claude mainline breadth, momentum, focus-stock, lifecycle-stage, early-window, and session-phase updates.
- No production code was changed in this step; this entry records the Git promotion step only.

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- Confirmed `origin/main` is an ancestor of `origin/codex/home-mainline-20260707`, so `main` can be fast-forwarded without conflict.
- Prior merged branch checks already passed: backend syntax, dashboard inline script, and `git diff --check`.

Deployment:
- GitHub only. Not deployed to the cloud server. No service restart.

Notes for next agent:
- After `main` is updated, Claude/company agents should pull latest `main` and verify before cloud deployment.

## 2026-07-08 - Claude - 主线榜第三轮：预判分与抢跑雷达（预判优先）

Changed:
- 背景：用户再次强调主线榜的使命是「预测哪个方向会成为今天的主线——等涨停底库出来就晚了」。现有总分中确认类权重（涨停×10/高度×22/连板×9）偏重，榜首容易被已明牌题材占据。
- 预判分（predictScore）：每条主线新增字段 = 总分剔除涨停/高度/连板三项确认类得分，只保留前瞻信号（大涨扩散、冲板储备、普涨广度、盘中动能、历史主因、连续性、资金、板块涨幅、共振）。不改动任何现有权重与主榜排序，零回滚风险。
- 抢跑雷达（前端）：快读区下方新增横条,列出最多 3 个「阶段=酝酿/启动」的未确认方向,按预判分排序,每项显示题材、阶段、确定性、预判分、首选潜力股;附一句提示「等涨停底库出来就晚了」。无符合项时整条隐藏。
- 卡片右上角主线分旁新增预判分小徽章（青色,悬停有口径说明）。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过;前端内联脚本编译通过。
- 单测:确认期主线 predictScore = 总分-确认三项（247.1→174.1）;纯酝酿主线 predictScore≈总分（46→46）;此前全部回归断言保持通过。

Deployment:
- GitHub branch `claude/dreamerqi-orientation-yuiha3` only.
- Not deployed to the cloud server. No service restart.

Notes for next agent:
- 主榜默认排序仍按总分（主线强度）,预判视角通过抢跑雷达+预判分呈现;若实盘验证预判分靠谱,下一步可考虑给用户加「按预判分排序」切换,再往后才考虑动总分权重。
- 抢跑雷达只认 stage=brewing/launch,确认期题材即使预判分高也不进雷达（已明牌）。

## 2026-07-08 - Claude - 主线榜第四轮：L2明星股 + 自动扫描 + 首日题材 + 卡片简化

Changed:
- 明星股 L2 判定（用户定稿规则）：档位只看 50万/300万/800万（低价股大单档常无成交，缺档跳过不判负）。未涨停且涨幅≥5%：各有效档主动比、被动比都 ≥1.5 → 「资金活跃」；已涨停：50万档 主动比/被动比/主动+被动比 三者至少 2 个 ≥2 → 「明星确认」（涨停瞬间吃光堆积卖单的特征）。只匹配主线内相关股票（涨停/大涨/潜力股），邻板块扫描结果不误挂。
- 明星股入分入信号：新增 `star` 打分项（确认 15/只、活跃 8/只，上限 40）；确定性新增「明星股确认/资金活跃股」信号；说明区新增 L2 比值一行。
- 自动 L2 扫描（消费现有本机 worker 队列，不新增外部依赖）：目标 = 今日实时中 净流入≥8亿 且 板内涨停≥2 的前排板块；节流 = 仅交易时段、5 分钟窗口最多 2 个、严格串行（上一任务 queued/running 时不派新）、当天扫过不重扫、无合格目标不扫；单任务最多扫 50 只成分股。worker 不在线时任务只是排队，无副作用。
- 首日新题材修正：近 15 日零热度且无主因股、但盘面有实质信号（大涨≥2/涨停≥1/临板≥1）→ 标记 `isNewTheme`，确定性补「首日新题材」信号对冲缺失的主因信号，卡片显「首日」徽章，说明区注明「暂无历史主因属正常」。
- 卡片简化（默认视图只留 5 样）：题材+合并徽章（阶段·把握度，原两枚徽章合一）+首日徽章；预判分（主位）/主线分（副位）；一行核心数（涨停·冲板·大涨·净流入）；明星行+潜力行；一句话理由。其余（驱动因子、打分明细、四格指标、今日龙头、依据、完整说明、龙头列表、候选/强度/共振/活跃）全部收进「展开详情」。快读区删除与抢跑雷达重复的「抢跑窗口」项。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；前端内联脚本编译通过。
- 明星判定单测：未涨停达标/不达标、涨幅<5% 忽略、涨停 2/3 达标确认、涨停未达标、20cm 阈值、全档无成交——全过。
- 自动扫描单测（模拟真实队列语义）：非交易时段不扫、按流入优先派发、串行（前任务未完不派）、5 分钟窗口上限 2、已扫板块跨窗口不重扫、新合格板块正常派发、历史日期不扫——全过。
- 增强集成测试：明星股注入并按确认优先排序、邻板股过滤、star 分挂载、确定性信号、首日题材识别与说明——全过。

Deployment:
- GitHub branch `claude/dreamerqi-orientation-yuiha3` only（并入 PR #5）。
- Not deployed to the cloud server. No service restart.

Notes for next agent:
- 明星股数据依赖本机 L2 worker 在线；worker 离线时自动扫描任务会排队等待，主线榜正常出榜只是没有明星标注，属设计内降级。
- 今日主线榜与「重点关注」的 L2 扫描共用同一队列与结果（latest(plateId, day)），两边天然共享；用户已点出两者在做同一件事，后续可考虑归并入口。
- 自动扫描参数集中在 STRATEGY_MAINLINE_AUTO_SCAN_* 常量（8亿/2涨停/5分钟2个/50只），实盘后可调。

## 2026-07-08 - Codex - Review Claude strategy update and preserve live focus metrics

Changed:
- Reviewed Claude's lifecycle-stage, early-window, and session-phase strategy update after it landed in `main`.
- Fixed a follow-up edge case in `getStrategyBoardsForDay`: when a same-day snapshot exists, strategy focus cards can still merge live board metrics for included focus boards instead of staying with stale/null snapshot values.
- The fix preserves existing QI snapshot data where present, but refreshes live `gainPct`, `ztCount`, and `netInflow` for requested focus boards.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `node --check strategy-backend.js`
- `node --check local-l2-task-queue.js`
- Dashboard inline script parsed successfully.
- `git diff --check`

Deployment:
- GitHub only. Not deployed to the cloud server. No service restart.

Notes for next agent:
- The cloud server still needs a deliberate deploy after Claude/Codex review. Current production may not yet include the merged `main` strategy enhancements.
## 2026-07-08 - Claude - 策略页视觉打磨（本地真实渲染验证）

Changed:
- 用无头 Chromium + 模拟 API 数据在本地真实渲染了策略页（登录态、主线榜、雷达、明星/首日徽章全部注入验证），按截图逐项打磨：
- 预判分/主线分主次分明：预判分保持绿色主位,主线分徽章改为中性灰,不再抢视觉重心。
- 纯预判题材（预判分==主线分,即无任何确认分）不再重复显示两个相同数字,只显示预判分。
- 主线卡「展开详情」按钮底部对齐（margin-top:auto）,三卡并排时按钮在同一水平线。
- 快读四宫格瘦身：去掉 74px 最小高度、收紧内边距,信息密度提升约一倍。

Files:
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前端内联脚本编译通过。
- 本地 Chromium 渲染验证：登录门、主线榜、抢跑雷达、明星⭐行、首日徽章、卡片折叠/展开全部正常;三卡等高、按钮对齐;展开态各明细区顺序完整。

Deployment:
- GitHub branch only（并入 PR #5）。Not deployed. No restart.

Notes for next agent:
- 本地渲染方法可复用：静态服务 + Playwright route 拦截 /api/*（注意 Playwright 后注册路由优先,兜底路由要最先注册）,mock 见会话记录;适合以后前端改动的自查。

## 2026-07-08 - Codex - Deploy combined strategy main to cloud

Changed:
- Deployed `main` commit `e073fed` to the cloud production server.
- Uploaded the combined Codex/Claude strategy changes for current-day mainline prediction, lifecycle labels, early-window quick-read, live focus metrics, and clearer L2 offline status.
- Wrote matching deployment notes into the cloud operation logs.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `strategy-backend.js`
- `local-l2-task-queue.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Local checks passed: `git diff --check`, server syntax, strategy backend syntax, local L2 queue syntax, and dashboard inline script syntax.
- Cloud checks passed after upload for the same production files.
- Public checks passed: `https://dreamerqi.com/health`, `https://market.dreamerqi.com/kpl`, `https://market.dreamerqi.com/api/strategy/today?day=2026-07-08`, and `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08`.
- Verified strategy focus metrics returned same-day values for sampled focus boards, and mainline API returned the new `breadth-momentum` basis plus `sessionPhase`.

Deployment:
- Production touched: yes.
- Backup created before upload: `C:\PandaDashboard\backups\main-strategy-merge-20260708-182229`.
- Restarted only `PandaDashboard-KPL-Server`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- `api/strategy-mainlines` completed successfully but took about 23 seconds during public verification; consider performance tuning if the page feels slow during trading hours.
- L2 scan still depends on the separate local L2 worker being online; this deployment only improved queue/auth handling and user-facing offline status.

## 2026-07-08 - Codex - TGB Hunan recap and Jiuyangongshe health source fix

Changed:
- Fixed data-source health coverage for the limit-up recap: same-day health now refreshes source coverage from source-view stats instead of trusting stale saved `sourceCoverage` when real source files already exist.
- Fixed TGB Hunan structuring validation to use the same review exclusion rule as the recap page, so Beijing exchange/ST/new-listing/retiring names are excluded from the validation baseline.
- Collected and structured the 2026-07-08 TGB Hunan recap on the cloud server.
- Wrote matching cloud operation notes on the production server.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- TGB raw evidence collected from `https://www.tgb.cn/a/2tgsKpIqhjy` with 18 images downloaded.
- TGB structured validation passed for 2026-07-08: declared 46, baseline 46, parsed 46, no missing codes, no extra codes, weakCount 0.
- Public `source-view` for 2026-07-08 shows: final 46, kaipanla 46, xuangubao 46, jiuyangongshe 46, tgb 46.
- Public same-day `after-close-status` for 2026-07-08 shows all four recap source groups at 46 with 100% coverage.

Deployment:
- Production touched: yes.
- Backup before code upload: `C:\PandaDashboard\backups\tgb-jyg-health-fix-20260708-195005`.
- Uploaded `kpl-stats-server.js`.
- Restarted only `PandaDashboard-KPL-Server`.
- Did not restart Caddy or `yule-server.js`.
- Runtime data written on cloud only: `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-08.json`.

Notes for next agent:
- The 2026-07-08 raw limit-up DB still contains 47 because it includes Beijing exchange code `920857`; the recap/source-view business layer correctly excludes it and uses 46.
- If the data-health panel appears stale in the browser, hard refresh the market page; the backend now returns the corrected source coverage.

## 2026-07-08 - Codex - Merge and deploy Claude strategy mainline update

Changed:
- Fast-forwarded `main` to Claude branch commit `b240949`.
- Deployed the strategy mainline prediction, early-radar, L2 star-stock, first-day-theme, and card-polish update to the cloud server.
- Wrote matching cloud operation notes.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `git diff --check`
- `node --check kpl-stats-server.js`
- `node --check local-l2-task-queue.js`
- `node --check strategy-backend.js`
- Dashboard inline script parsed successfully.
- Cloud `node --check .\kpl-stats-server.js`
- Cloud dashboard inline script parsed successfully.
- Public `/health`, `/kpl`, `/api/strategy-mainlines?day=2026-07-08`, `/api/limit-up-main-reason-db/source-view?day=2026-07-08&force=1`, and `/api/after-close-status?day=2026-07-08&mainReasonMode=same-day`.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\claude-strategy-main-20260708-201351`.
- Uploaded `kpl-stats-server.js` and `kpl-dashboard_17_apple.html`.
- Restarted only `PandaDashboard-KPL-Server`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- This release adds automatic strategy L2 scan queuing during trading sessions when the local L2 worker token is configured; watch the first live session for queue volume and whether the worker is online.
- The 2026-07-08 source-view and same-day health checks still show all four recap sources at 46.

## 2026-07-08 - Codex - Fix strategy mainline topic leakage

Changed:
- Fixed short English taxonomy keyword matching so `IP` no longer incorrectly matches `IPv6`.
- Kept `短剧游戏` as its own strategy mainline instead of merging it into the broad `消费` card.
- Tightened realtime board attachment so a related board only contributes the matched stocks to a mainline, instead of absorbing every big-gain stock from that board.
- Deployed the fix to the cloud server.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `git diff --check`
- Local taxonomy spot check: `IPv6` no longer maps to `短剧游戏`; `IP`, `短剧游戏`, `VR/AR/MR`, `AI眼镜`, `AIPC`, `800G光模块`, and `R32制冷剂` still map as expected.
- Cloud `node --check .\kpl-stats-server.js`
- Public `https://dreamerqi.com/health`
- Public `https://market.dreamerqi.com/kpl`
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09`: top themes now include `IPv6` as an independent theme and no longer show a false `消费/短剧游戏` technology-stock card.
- Public 2026-07-08 recap source-view remains 46/46 across final, kaipanla, xuangubao, jiuyangongshe, and tgb.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\strategy-mainline-topic-fix-20260708-203223`.
- Uploaded `kpl-stats-server.js`.
- Restarted only `PandaDashboard-KPL-Server`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- This fix addresses the reported issue where the strategy `消费` card contained technology stocks such as 网宿科技、电科网安、紫光股份 because `IPv6` was misclassified through the short keyword `IP`.
- If similar leakage appears later, check both taxonomy keyword boundary behavior and whether `strategyMainlineAttachRealtimeBoardToSeed` is receiving the intended matched code set.
