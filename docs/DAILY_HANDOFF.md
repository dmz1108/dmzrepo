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
