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

## 2026-07-08 - Codex - Improve strategy mainline cards and leaders

Changed:
- Reworked strategy mainline card layout so the mainline name can wrap and key metrics no longer disappear in a cramped header.
- Added a stable four-cell signal strip for limit-ups, big gain/near-limit count, board gain, and net inflow/outflow.
- Added leader trend badges in expanded `龙头候选`.
- Updated backend leader candidate scoring to include recent 10-day limit-up count plus 10-day and 30-day gain.
- Used the latest available close day when today's close DB is not ready, and prevented null trend values from displaying as fake `0.0%`.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Dashboard inline script parsed successfully.
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Cloud dashboard inline script parsed successfully.
- Public `https://market.dreamerqi.com/kpl`
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08`
- Verified page contains `ml-signal-strip`, `ml-trend-pill`, and `10/30日涨幅综合排序`.
- Verified leader rows carry `zt10/gain10` where available and do not show fake `gain30=0`.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\strategy-mainline-card-ui-20260708-210059`.
- Uploaded `kpl-stats-server.js` and `kpl-dashboard_17_apple.html`.
- Restarted only `PandaDashboard-KPL-Server`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- The expanded mainline leader list now uses current strength plus 10-day limit-up count and 10/30-day gain. If 30-day close data is missing or flat/no-signal, the 30-day badge is intentionally omitted.
- The card header now reserves a visible metric strip for net inflow/outflow and board gain; avoid moving these back into the single-line subtitle.

## 2026-07-08 - Codex - Keep enough close-price history for 30-day strategy gains

Changed:
- Fixed the strategy mainline leader trend data issue where 30-day gain could be absent even though the close-price database existed.
- Split close-price database retention from the recap/source database retention: recap sources still keep 30 trading days, while `eastmoney-close-db` now syncs and keeps 35 trading days so 30-day gain has both end and start points.
- Adjusted the strategy gain fallback so if today's close price is not available yet, the 10/30-day gain window is anchored to the latest available close-price day.
- Updated cloud health wording to show the separate close-price retention rule.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Public `https://market.dreamerqi.com/health`
- Public `https://market.dreamerqi.com/kpl`
- Close-price sync completed 35/35 trading days from `2026-05-20` through `2026-07-08`.
- Confirmed no `2026-07-09.json` runtime data files were created during validation.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08` returns 10 mainlines and 24 leader rows with real `gain30`.

Deployment:
- Production touched: yes.
- Backups before upload: `C:\PandaDashboard\backups\close-db-retention-20260708-212435`, `C:\PandaDashboard\backups\close-db-retention-fallback-20260708-213332`.
- Uploaded `kpl-stats-server.js`.
- Restarted only `PandaDashboard-KPL-Server` using the scheduled task so the process survives SSH logout.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- Do not reduce `eastmoney-close-db` back to 30 files; 30-day gain requires at least 31 trading-day endpoints, and 35 gives a small buffer.
- The user's business rule remains unchanged for source databases: TGB, 韭研, 同花顺, 开盘啦, 东财/选股宝-style source files still use the 30-trading-day retention policy.

## 2026-07-08 - Claude - 主线榜第五轮：龙头重构 + 明星/龙头双槽 + 确认主线 + 预判回看

Changed:
- 龙头重构（用户定稿口径）：龙头在「主线相关股票池」内按三榜排名选出——10日涨停次数前5（40分递减）、10日涨幅前10（30分递减）、30日涨幅前10（20分递减），全部按交易日（getRecentTradingDays 自动排除法定假期）；硬门槛=近10日至少一次复盘综合归纳（finalBoardTopic）指向本主线（mainZt10Count≥1），个股涨停必须与板块主因结合，主因不符的最多只能标「今日强势候选」（fallback）。今日状态只作加成：涨停+10、连板×8封顶24、L2明星+15/活跃+8、10点前封板+6。复用 enrichReviewLeaderMetrics（收盘价库 gain10/gain30 + 涨停底库 zt10Count + 主因库 mainZt10Count），全主线合并一次批量计算。
- 龙头依据可核验：如「10日4板(第2) · 10日+38.2%(第2) · 30日+72.5%(第1) · 主因3次 · 今日2板」。
- 明星/龙头双槽：卡片默认视图显示「龙头👑」与「明星⭐」两行（同一只股时合并为「龙头·明星」一行）；龙头=一段时间挣出来的旗手，明星=L2 资金正在攻击的股，可同可异。
- 确认主线（管理员）：新增 /api/strategy-mainline-confirm GET/POST/DELETE（POST/DELETE 需管理员），存 strategy-data/mainline-confirm-日期.json（运行时文件不入Git）；卡片上管理员可见「确认主线/取消确认」按钮，确认后卡片显金色「✔ 当日主线」徽章，每天唯一（后确认覆盖前确认）。
- 预判记录与胜率回看：盘中每次计算主线榜自动落 strategy-data/mainline-predict-日期.json（收盘后冻结不再覆盖，保留收盘前最后一次预判作回测基准）；新增 /api/strategy-mainline-review?days=N——对每个有预判记录的交易日,取当天主线（管理员确认优先，否则榜首）的明星股与龙头股,用收盘价库算「次日收盘涨幅」并判盈亏,输出逐日明细 + 明星/龙头各自胜率;策略页主线榜下方新增「预判回看」区。次日「最高涨幅」暂输出 null（K线 bar 的 high 字段索引未验证,不猜数据）。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过;前端内联脚本编译通过;round-4 测试回归通过。
- 龙头重构单测:今天涨得最猛但近10日主因不符的股被门槛挡住,三榜排名股胜出;依据串含排名与主因次数;全员不满足门槛时进 today-fallback 模式并标注;明星槽与 leaderIsStar 判定正确。

Deployment:
- GitHub branch only。Not deployed. No restart.

Notes for next agent:
- strategy-data/mainline-confirm-*.json 与 mainline-predict-*.json 是运行时文件,严禁提交 Git;云端会随服务自动创建。
- 「次日最高涨幅」补法:确认 KPL K线 bar 数组中 high 的索引(现仅 [1]=close 有代码依据)或由 L2/QMT 侧提供日内高点,填进 getStrategyMainlineReview 的 nextHighGain。
- 龙头三榜的分值(40/30/20 递减)和门槛(mainZt10Count≥1)集中在 strategyMainlineReworkLeaders,实盘后可调。
- 预判回看需要积累数据:部署当天起每天自动落预判文件,第二个交易日开始出现回看行。

## 2026-07-08 - Claude - 概念修正：无门槛不设龙头 + 移除 QMT 遗留

Changed:
- 龙头概念修正（与 owner 讨论定稿）：龙头/明星/候选三角色界限明确——龙头=10日30日涨幅+主因涨停次数综合（历史挣出来的）；明星=纯当日 L2 扫描数据（不看历史）；潜力/候选=盘中大涨临板观察对象。据此删除「今日强势候选顶替龙头槽」的 fallback 逻辑：无人满足主因门槛时 `mainLeader=null`，卡片龙头槽显示说明文字（首日题材→「龙头待产生，先看明星股」；其他→「暂无满足主因门槛的龙头」），不再用今日强势股冒充龙头。
- 移除 QMT 遗留：owner 确认 QMT 已不存在。`qmt-order-stats.js` 经查零代码引用（纯死文件），已删除；`docs/PROJECT_MAP.md` 同步移除该条目。上一条交接里「次日最高涨幅可由 QMT 侧提供」的说法作废——补法仅剩：确认 K线 bar 的 high 字段索引，或由本机 L2 worker 提供日内高点。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `qmt-order-stats.js`（删除）
- `docs/PROJECT_MAP.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过；前端内联脚本编译通过。
- 龙头单测更新并通过：无人过门槛时 mainLeader=null 且 leaderBasisMode='none'；首日题材与非首日各自的说明文案正确；有门槛股时三榜排名照常选出真龙头。
- `grep` 确认仓库内无任何代码引用 qmt-order-stats。

Deployment:
- GitHub branch only（并入 PR #6）。Not deployed. No restart.

Notes for next agent:
- 龙头槽为空是正常状态（尤其首日新题材），不是 bug；不要再引入任何「用今日表现顶替龙头」的逻辑。
- QMT 已从项目移除，后续任何数据源规划不要再考虑 QMT。

## 2026-07-08 - Claude - 龙头1-3个 + 潜力→明星生命周期展示

Changed:
- 龙头槽从单个改为综合打分选出的 1-3 个最佳可能龙头：首位👑高亮（主龙头，用于预判记录/回看），其余为次龙头候选，均须过主因门槛。
- 潜力定义明确为「有望成为明星的观察股」（如涨停前的华勤技术→封板后升级明星）：潜力/明星/龙头三行标签都加了悬停口径说明；明星行最多显示 2 只（确认级优先，与主龙头重复时不重复显示）。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过；前端内联脚本编译通过；龙头单测回归通过。

Deployment:
- GitHub branch only（并入 PR #6）。Not deployed. No restart.

Notes for next agent:
- 潜力→明星是自动升级链路：同一只股 L2 达标后自然从潜力行消失、出现在明星行，无需人工操作。

## 2026-07-08 - Claude - 角色标签可叠加（龙头/明星/潜力同株共存）

Changed:
- 同一只股可同时是龙头、明星、潜力：三行独立展示不再互斥去重,芯片上叠加角标——龙头行的股若同时是明星加⭐,明星行的股若同时是龙头加👑,潜力行同理叠加👑/⭐;行标签悬停说明补充角标含义。

Files:
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前端内联脚本编译通过;`node --check` 通过。

Deployment:
- GitHub branch only（并入 PR #6）。Not deployed. No restart.

## 2026-07-08 - Claude - 潜力股展示放宽到6个

Changed:
- 潜力行展示上限 3→6（owner 口径:潜力股 3-6 个等待升级明星;明星每板块 2 个左右,展示已符合）。后端 focusStocks 上限本就是 6,仅前端放开。

Files:
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated: 前端内联脚本编译通过。
Deployment: GitHub branch only（并入 PR #6）。Not deployed. No restart.

## 2026-07-08 - Codex - Refine Explore page around city new shops and places

Changed:
- Repositioned the Explore page around `城市新店与好去处` as a city-guide experience rather than a plain item list.
- Added four reader-facing editorial principles: `新店雷达`, `口碑校验`, `路线价值`, and `到店提醒`.
- Improved featured cards with source tone, reason text, source labels, and clearer `查看详情` affordance.
- Improved city item rows and detail modal so users can see source type, why the place matters, and what to confirm before going.
- Strengthened discovery data quality filters to remove editorial/search noise such as broad ranking names, local-guide timestamps, activity boilerplate, marketing slogans, and malformed HTML entity titles.
- Adjusted discovery scoring so concrete places and curated place records rank ahead of vague public-search snippets.

Files:
- `Qi/index.html`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`
- `node --check kpl-stats-server.js`
- `node --check Qi/qi-home.compiled.js`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Cloud `node --check .\Qi\qi-home.compiled.js`
- Public `https://explore.dreamerqi.com/`
- Public `https://explore.dreamerqi.com/api/discovery`
- Public discovery API now returns 168 items for 2026-07-08, with obvious false names like `本地宝`, `活动亮点`, `必吃榜`, `潮人装`, `锚定`, malformed HTML entity titles, and similar search-noise phrases filtered from the sampled output.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\discovery-city-guide-20260708-215614`.
- Uploaded `kpl-stats-server.js`, `Qi/index.html`, `Qi/qi-home.jsx`, and `Qi/qi-home.compiled.js`.
- Restarted only `PandaDashboard-KPL-Server` using the scheduled task.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- The Explore page still uses the existing public-search/curated-place architecture. Good next source directions are: city/local official activity feeds for exhibitions and markets, trusted local公众号/媒体, review/ranking sources for shops, and map/POI-style sources for address/opening-hour verification.
- Avoid making the page a generic travel guide. Keep it focused on recent new shops, city places, weekend routes, and concrete decision details.

## 2026-07-08 - Codex - Add optional Explore POI verification layer

Changed:
- Added an optional map/POI verification layer for the Explore page so concrete city places can be enriched with verified address, coordinate string, telephone, district/business-area, provider, confidence, and checked time.
- Added local-only `panda-discovery-config.json` support plus admin API `/api/admin/discovery/poi-config`; the public response masks the key and never returns the raw secret.
- Added the discovery POI config to the site-sync local-only exclusion list so cloud-only map service credentials are not synced to company hosts.
- Added data-source health reporting for `探索地图 POI 校验`.
- Updated Explore UI to show `地图已校验`, address, telephone, and visit-confirmation text when POI verification exists; without a map key the page keeps the existing public-search behavior.

Files:
- `kpl-stats-server.js`
- `Qi/index.html`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`
- `node --check kpl-stats-server.js`
- `node --check Qi/qi-home.compiled.js`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Cloud `node --check .\Qi\qi-home.compiled.js`
- Public `https://explore.dreamerqi.com/`
- Public `https://explore.dreamerqi.com/api/discovery`
- Public discovery API returned `ready`, `generatedDay: 2026-07-08`, `itemCount: 168`, and `poiVerifiedCount: 0` because no cloud map key is configured yet.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\discovery-poi-verify-20260708-221945`.
- Uploaded `kpl-stats-server.js`, `Qi/index.html`, `Qi/qi-home.jsx`, and `Qi/qi-home.compiled.js`.
- Restarted only `PandaDashboard-KPL-Server` using the scheduled task; new listener PID was `12660`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- To enable POI verification on the cloud server, save a Gaode/AMap Web Service key through `/api/admin/discovery/poi-config` or set `PANDA_DISCOVERY_AMAP_KEY` / `AMAP_WEB_SERVICE_KEY` on the server, then run Explore sync.
- Do not commit `panda-discovery-config.json`; it is a runtime-only secret-bearing config.
- The POI layer is a verification/enrichment layer only. It should not replace the Explore source-selection logic or turn the page into a generic travel guide.

## 2026-07-08 - Codex - Add Explore routes, sections, and recommendation scoring

Changed:
- Refined Explore wording so the user-facing page no longer presents this as a map feature; verified places now read as `地址已核验` and focus on address, phone, and business-area details.
- Added backend recommendation fields for every Explore item: `recommendationScore`, `recommendationLevel`, `bestVisitTime`, `visitAudience`, and `nearbySuggestion`.
- Added a `周末可以这样逛` section that automatically builds city route cards from visible Explore items: light start, main destination, and evening/meal finish.
- Added an `按主题先看` section that groups top items by category and gives each category a quick drill-in button.
- Updated featured and city cards to show recommendation score/level more prominently.
- Expanded the item detail modal with practical decision details: recommendation score, before-going check, address, phone, business area, best visit time, audience fit, and nearby pairing. Removed the `信息来源` detail card per user request.

Files:
- `kpl-stats-server.js`
- `Qi/index.html`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`
- `node --check kpl-stats-server.js`
- `node --check Qi/qi-home.compiled.js`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Cloud `node --check .\Qi\qi-home.compiled.js`
- Public `https://explore.dreamerqi.com/`
- Public `https://explore.dreamerqi.com/api/discovery`
- Public discovery API returned `ready`, `generatedDay: 2026-07-08`, `itemCount: 168`, and all 168 items had recommendation scores. First sampled item had `recommendationScore: 89`, `recommendationLevel: 优先安排`, and populated best-visit-time/audience fields.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\discovery-routes-score-20260708-223941`.
- Uploaded `kpl-stats-server.js`, `Qi/index.html`, `Qi/qi-home.jsx`, and `Qi/qi-home.compiled.js`.
- Restarted only `PandaDashboard-KPL-Server` using the scheduled task; new listener PID was `15296`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- Keep Explore focused on city new shops and places. Do not turn it into a generic tourism guide.
- User explicitly does not want a map surface here; use address, phone, business area, and practical trip-planning fields instead.
- Detail modal should not re-add an `信息来源` card unless the user asks for it.
## 2026-07-08 - Claude - PR #6 与 main 最终同步（含 Explore 工作保全）

Changed:
- 将 main `17c6564`（Explore 路线与评分、POI 校验层、城市指南、周末路线、品类聚焦、地址/电话/商圈文案）合并进 PR #6 分支。
- 冲突仅 docs/DAILY_HANDOFF.md（双方追加），已按时间顺序双保留：Claude 策略条目在前、Codex Explore 条目在后，零删除。
- kpl-stats-server.js 自动合并成功：Codex 的 Explore/discovery 代码与 Claude 的策略主线代码物理不重叠。

Files:
- `docs/DAILY_HANDOFF.md`（冲突解决）

Validated:
- `node --check kpl-stats-server.js` 通过。
- 策略页内联脚本编译通过；round-4 与龙头重构测试套件全部回归通过。
- qmt-order-stats.js 删除仍生效（文件不存在、PROJECT_MAP 无条目、零代码引用）。
- `git ls-files` 确认无任何 strategy-data 运行时文件被提交。
- Explore 内容完整性抽查：discovery/explore 相关代码 159 处、周末路线与品类聚焦标记均在合并结果中。

Deployment:
- GitHub branch only。Not deployed. No restart.

Notes for next agent:
- PR #6 已与 main 无冲突，转为可合并状态。

## 2026-07-08 - Codex - Limit formal review sources to current four-source model

Changed:
- Merged Claude PR #6 into `main` by fast-forwarding from `origin/claude/dreamerqi-orientation-yuiha3`.
- Restricted formal limit-up review source handling to the current four-source model: TGB Hunan, Jiuyangongshe, Kaipanla/Fupanla, and Xuangubao.
- Removed Tonghuashun from formal source-view tabs, source-view merge chain, auto review source collection, unmapped-theme scan, source-stat remapping, and formal source retention whitelist.
- Removed Eastmoney/Tonghuashun deprecated source directories from formal retention handling. Legacy helper functions remain in code for now, but they are not part of the formal four-source pipeline.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Frontend inline script compilation check for `kpl-dashboard_17_apple.html`
- `git diff --check`
- Cloud `node --check .\kpl-stats-server.js`
- Cloud frontend inline script compilation check for `kpl-dashboard_17_apple.html`
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08` returned `ok: true`, `count: 10`; first theme was `算力AI`.
- Public `https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=2026-07-08` returned only five tabs: final, kaipanla, xuangubao, jiuyangongshe, tgb.
- Public `https://market.dreamerqi.com/api/limit-up-main-reason-db/day?day=2026-07-08` returned four review auto sources only, each with `stockCount: 46` and `coveragePct: 100`.

Deployment:
- Production touched: yes.
- Backup before upload: `C:\PandaDashboard\backups\deploy-main-pr6-four-sources-20260708-231833`.
- Uploaded `kpl-stats-server.js`, `kpl-dashboard_17_apple.html`, `docs/DAILY_HANDOFF.md`, and `docs/PROJECT_MAP.md`.
- Removed deprecated cloud file `C:\PandaDashboard\qmt-order-stats.js` after backing it up when present.
- Restarted only `PandaDashboard-KPL-Server`; new listener PID was `15132`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- Current formal review sources are exactly: `review/tgb-hunan-structured`, `review/jiuyangongshe-structured`, `review/kaipanla-fupanla`, and `review/xuangubao-limit-up`.
- Do not re-add Eastmoney or Tonghuashun to the formal source tabs or auto consensus pipeline unless the owner explicitly changes the source policy.

## 2026-07-09 - Claude - React 换 production.min 并自托管（Codex 方案执行）

Changed:
- 按 Codex 定稿方案执行：React/ReactDOM 保持 18.3.1 不升级，仅从 unpkg 开发版换成本地自托管生产版。
- 新增 `Qi/vendor/react.production.min.js`（10.7KB）与 `Qi/vendor/react-dom.production.min.js`（131.8KB），合计 142KB，对比原开发版 ~1.19MB 缩小约 8 倍；文件经 unpkg 与 jsdelivr 双源 sha256 校验一致后入库。
- `Qi/index.html` 两个 script 标签改为相对路径 `vendor/react*.production.min.js`，移除对 unpkg 的运行时依赖（白屏单点风险消除）。
- `kpl-stats-server.js` 静态映射表新增 4 条（/vendor/* 与 /qi/vendor/* → Qi/vendor/*），保证根路径与 /qi/ 路径都能取到文件。
- 未改任何业务逻辑与视觉；`Qi/build-home.js` 的构建期 Babel unpkg 依赖按 Codex 意见留待后续。

Files:
- `Qi/vendor/react.production.min.js`（新增）
- `Qi/vendor/react-dom.production.min.js`（新增）
- `Qi/index.html`
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- 本地 Chromium 真实渲染（无任何 CDN 拦截）：`window.React.version === '18.3.1'` 且为生产构建；主页与 #chat 页渲染正常、视觉与改前一致；唯一 console 错误为测试中主动屏蔽的 Google Fonts 请求，与本改动无关。
- vendor 文件双源（unpkg/jsdelivr）sha256 完全一致。

Deployment:
- GitHub branch only。Not deployed. No restart（部署时需上传 Qi/vendor/ 两个新文件 + 更新 index.html 与 kpl-stats-server.js，后端改了静态映射表需重启主服务）。

Notes for next agent:
- 部署验证点：`https://dreamerqi.com/vendor/react.production.min.js` 返回 200；主页正常渲染；浏览器控制台不再有 React 开发版警告。
- 若未来升级 React 版本,同步更新 Qi/vendor/ 两个文件即可,不要改回 CDN 加载。

## 2026-07-09 - Codex - Review, merge, and deploy Claude React self-hosting change

Changed:
- Reviewed Claude branch `claude/dreamerqi-orientation-yuiha3` at `cc80c03` and fast-forwarded `main`.
- Confirmed the change only self-hosts React/ReactDOM production UMD files for the homepage and adds static mappings for those files.
- No business logic, market logic, auth flow, review-source policy, strategy logic, or visual layout was intentionally changed.

Files:
- `Qi/index.html`
- `Qi/vendor/react.production.min.js`
- `Qi/vendor/react-dom.production.min.js`
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Verified local vendor file sha256 matches both unpkg and jsdelivr official React 18.3.1 production UMD builds.
- Public `https://dreamerqi.com/vendor/react.production.min.js` returned 200.
- Public `https://dreamerqi.com/vendor/react-dom.production.min.js` returned 200.
- Public homepage HTML now loads `vendor/react.production.min.js` and `vendor/react-dom.production.min.js` instead of unpkg React development builds.
- Public `https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=2026-07-08` returned only final, kaipanla, xuangubao, jiuyangongshe, and tgb tabs.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08` returned `ok: true`, `count: 10`, first mainline `算力AI`.

Deployment:
- Production touched: yes.
- Git main deployed: `cc80c03`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-react-self-host-20260709-070407`.
- Uploaded `Qi/index.html`, `Qi/vendor/react.production.min.js`, `Qi/vendor/react-dom.production.min.js`, `kpl-stats-server.js`, and `docs/DAILY_HANDOFF.md`.
- Restarted only `PandaDashboard-KPL-Server`; new listener PID was `13076`.
- Did not restart Caddy or `yule-server.js`.

Notes for next agent:
- The old Claude entry above correctly says Claude did not deploy it. This Codex entry records the later merge and production deployment.
- Keep Eastmoney/Tonghuashun out of the formal limit-up review tabs unless the owner explicitly changes the current four-source policy.

## 2026-07-09 - Codex - Self-host site font bundle

Changed:
- Replaced runtime Google Fonts links with a local font bundle served from `Qi/vendor/`.
- Added local font CSS plus Space Grotesk, Space Mono, IBM Plex Mono, and JetBrains Mono font files.
- Updated homepage, market dashboard, Stanning/entertainment page, logo page, and the Guandan game page to use the local font CSS.
- Added main-server static routes for `/vendor/dreamerqi-fonts.css`, `/qi/vendor/dreamerqi-fonts.css`, and `/vendor/fonts/*`.
- Added Yule server static handling for `/vendor/dreamerqi-fonts.css` and `/vendor/fonts/*` so `stanning.dreamerqi.com` can load the same local font files through the entertainment service.
- No visual redesign, business logic, review-source policy, auth flow, or strategy scoring logic was intentionally changed.

Files:
- `Qi/index.html`
- `Qi/logo.html`
- `Qi/games/掼蛋.html`
- `Qi/vendor/dreamerqi-fonts.css`
- `Qi/vendor/fonts/*`
- `kpl-dashboard_17_apple.html`
- `kpl-dashboard_17_apple_hierarchy.html`
- `kpl-stats-server.js`
- `yule.html`
- `yule-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- `node --check yule-server.js`.
- Target pages no longer contain `fonts.googleapis.com` or `fonts.gstatic.com`.
- Local font CSS references 13 local font files and all files exist.
- Public `https://dreamerqi.com/vendor/dreamerqi-fonts.css` returned 200.
- Public `https://dreamerqi.com/vendor/fonts/space-grotesk-600.ttf` returned 200.
- Public `https://stanning.dreamerqi.com/vendor/dreamerqi-fonts.css` returned 200.
- Public `https://stanning.dreamerqi.com/vendor/fonts/space-mono-700.ttf` returned 200.
- Public homepage, market page, and Stanning HTML now reference `vendor/dreamerqi-fonts.css` and do not reference Google Fonts.
- Public `https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=2026-07-08` kept the current five tabs: final, kaipanla, xuangubao, jiuyangongshe, tgb.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08` returned `ok: true`, `count: 10`, first mainline `算力AI`.

Deployment:
- Production touched: yes.
- Git main deployed: `9a63ccf`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-local-fonts-20260709-080314`.
- Uploaded changed pages, `Qi/vendor/`, `kpl-stats-server.js`, `yule-server.js`, and `docs/DAILY_HANDOFF.md`.
- Restarted `PandaDashboard-KPL-Server`; new listener PID was `13736`.
- Restarted `Panda Yule Server`; new listener PID was `15212`.
- Did not restart Caddy.

Notes for next agent:
- The font bundle is now the shared source for homepage, market, and Stanning pages. Do not reintroduce Google Fonts runtime links unless explicitly requested.
- `Qi/build-home.js` may still use network resources at build time; this task only removed runtime font dependencies.

## 2026-07-09 - Codex - Animate market header Qi logo spark

Changed:
- Fixed the market page top-left Qi logo spark so it uses SVG native `animateMotion` instead of relying only on CSS `offset-path`.
- The change affects the shared market header, so it applies across 今日实时, 涨停复盘, and 今日策略.
- No strategy logic, data APIs, source policy, auth, or page layout was changed.

Files:
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- Frontend inline script compilation check for `kpl-dashboard_17_apple.html`.
- Public `https://market.dreamerqi.com/kpl` contains `qi-spark-svg-motion`, `animateMotion`, and `keyPoints` for the top-left Qi logo spark.

Deployment:
- Production touched: yes.
- Git main deployed: `432e781`.
- Backup before upload: `C:\PandaDashboard\backups\market-logo-motion-20260709-081317`.
- Uploaded `kpl-dashboard_17_apple.html` only.
- No service restart needed or performed.

Notes for next agent:
- Homepage logo still uses the CSS offset-path implementation. Market header now uses SVG native motion because it is more reliable inside the larger dashboard stylesheet.

## 2026-07-09 - Codex - Freeze strategy mainline daily snapshots

Changed:
- Changed 今日策略 / 今日主线榜 lifecycle so it no longer regenerates historical dates on every open.
- Today before market open or during call auction now returns a clear not-open state instead of generating from stale prior-day data.
- During trading hours it still builds the live predictive mainline list from 今日实时强势板块, capital flow, big-gainer/near-limit constituents, and prior reason history.
- After 15:30 China time the server writes one frozen strategy mainline snapshot for the day; historical date queries read only that frozen snapshot.
- Added daily cleanup coverage for strategy mainline snapshot/predict/confirm files under the existing recent-trading-day retention policy.
- Backfilled a production-only frozen snapshot for 2026-07-08 so yesterday can still be viewed after the lifecycle change.
- No changes to review-source policy, TGB/韭研/复盘啦/选股宝 source collection, auth, Caddy, or Stanning/Yule.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Inline script compilation check for `kpl-dashboard_17_apple.html`.
- Local `/api/strategy-mainlines?day=2026-07-09` returned `ok:false`, `reason: market-not-open`, `sessionPhase: 盘前`, `count: 0`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09` returned `ok:false`, `reason: market-not-open`, `sessionPhase: 盘前`, `count: 0`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-08` returned `ok:true`, `snapshotState: frozen`, `count: 10`, first mainline `算力AI`.
- Public `https://market.dreamerqi.com/kpl` contains the updated loading text and frozen snapshot label handling.

Deployment:
- Production touched: yes.
- Git main deployed: `28a7968`.
- Backup before upload: `C:\PandaDashboard\backups\strategy-mainline-snapshot-20260709-082939`.
- Uploaded `kpl-stats-server.js`, `kpl-dashboard_17_apple.html`, and production runtime snapshot `C:\PandaDashboard\strategy-data\strategy-mainline-snapshot-2026-07-08.json`.
- Restarted `PandaDashboard-KPL-Server`; current listener process is `5212`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- Strategy mainline history is now deliberately frozen. If a historical date has no `strategy-mainline-snapshot-YYYY-MM-DD.json`, the API should say the snapshot is missing instead of rebuilding from newer data.
- The 2026-07-08 snapshot is runtime data on the cloud server and is intentionally not committed to Git.

## 2026-07-09 - Codex - Derive live strategy limit-up counts

Changed:
- Fixed a misleading intraday strategy count issue where live ranking-only board rows were given fake `ztCount: 0`.
- Unhydrated live ranking rows now leave `ztCount` empty instead of showing a false zero.
- 今日主线榜 now hydrates the live candidate board pool by reading constituent stocks and deriving real limit-up members before building mainline counts.
- No review-source policy, snapshot lifecycle, TGB/manual review data, auth, homepage, Caddy, or Stanning/Yule logic was changed.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09` returned `ok:true`, `sessionPhase: 早盘`, `count: 10`.
- After the fix, 今日主线榜 examples: 半导体 `count: 19`, 算力AI `count: 6`, 消费电子/显示 `count: 6`.
- Public `https://market.dreamerqi.com/api/strategy/today?day=2026-07-09` no longer reports fake `ztCount: 0` for unhydrated 医药-related boards; those values are `null` until a board is specifically hydrated.

Deployment:
- Production touched: yes.
- Git main deployed: `6f16a8c`.
- Backup before upload: `C:\PandaDashboard\backups\strategy-live-zt-count-20260709-101754`.
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process is `7944`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- The remaining limitation is intentional for now: `/api/strategy/today` returns many ranking-only boards, and only displayed/focused/mainline-candidate boards should be hydrated because hydrating every board would be too slow during trading.
- If a specific searched board needs exact intraday `ztCount`, add a lazy board-metric endpoint or hydrate selected search results, not all 800+ live ranking rows.

## 2026-07-09 - Codex - Make live strategy mainlines responsive

Changed:
- Follow-up to the live strategy count fix: bounded 今日主线榜 live hydration and rising-stock scans so the page does not wait on every candidate board.
- Parallelized the live board-source pass for 东财/同花顺/KPL ranking data when no same-day snapshot exists.
- Kept unknown intraday board limit-up counts as `null` in mainline cards instead of turning them into false `0`.
- Added short memory/file caching for today's live mainline payload and a non-blocking refresh path: the API can return a recent cached result or a clear `strategy-mainline-preparing` state while the server refreshes in the background.
- No changes to review-source collection policy, TGB/韭研/复盘啦/选股宝 data, auth, homepage, Caddy, or Stanning/Yule.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `https://market.dreamerqi.com/api/strategy/today?day=2026-07-09` no longer reports fake `ztCount: 0` for unhydrated 医药-related ranking boards; those fields are `null`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09` now returns from live cache in about 0.07s after refresh.
- Latest observed 2026-07-09 mainline cache: `count: 7`, top mainline `半导体`, `hasMedicine: false`; example board counts include `先进封装 zt: 8`, `存储芯片 zt: 3`, and unknown catalog-only boards as `zt: null`.

Deployment:
- Production touched: yes.
- Git main deployed through `156056a`.
- Backups before upload:
  - `C:\PandaDashboard\backups\strategy-mainline-hydrate-bound-20260709-102641`
  - `C:\PandaDashboard\backups\strategy-mainline-live-speed-20260709-103501`
  - `C:\PandaDashboard\backups\strategy-mainline-live-cache-20260709-103804`
  - `C:\PandaDashboard\backups\strategy-mainline-nonblocking-20260709-104034`
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process is `11744`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- 今日主线榜 is intentionally predictive during the session. Its `count` is the unique stock-code count collected into the mainline family, not the simple sum of the visible board chips.
- Runtime live cache file `C:\PandaDashboard\strategy-data\mainline-live-cache-2026-07-09.json` is production data and is not committed to Git.
- If the user wants exact `ztCount` for a searched board outside the mainline candidate pool, add selected-board lazy hydration instead of hydrating all ranking boards.

## 2026-07-09 - Codex - Fallback 今日实时 search to concept boards

Changed:
- Fixed 今日实时 top search for cases where the query is a real 东财/同花顺 concept board but not a recent-30-day review main-reason word.
- `/api/hot-theme-search` still searches the recent main-reason DB first; if it finds no stocks, it now falls back to 东财/同花顺 concept catalogs and returns the matched board constituents.
- Frontend search result label now shows `东财板块` / `同花顺板块` plus the matched board name and constituent count.
- No change to review-source collection, strategy mainline scoring, auth, homepage, Caddy, or Stanning/Yule.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Inline dashboard script compilation check passed.
- Public `https://market.dreamerqi.com/api/hot-theme-search?q=中国AI%2050&day=2026-07-09` returned `ok:true`, `matchMode: board`, `matchedBoard.label: 同花顺板块`, `plateId: 309187`, `stockCount: 50`.
- Same validation returned sample constituents including 锐捷网络, 盛科通信, 紫光股份, 浪潮信息, with near-10/30-day gain and limit-up count fields populated.

Deployment:
- Production touched: yes.
- Git main deployed: `5cd2b4b`.
- Backup before upload: `C:\PandaDashboard\backups\hot-search-concept-board-20260709-104916`.
- Uploaded `kpl-stats-server.js` and `kpl-dashboard_17_apple.html`.
- Restarted `PandaDashboard-KPL-Server`; current listener process is `14540`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- 今日实时 top search is still not a full board-management UI. It now uses concept board fallback only when the main-reason DB search is empty.
- Board fallback currently computes each constituent's 10/30-day gain by pulling K-line data, so first-time searches for 50-stock boards can take noticeable time.

## 2026-07-09 - Codex - Add AI read-only strategy live endpoint

Changed:
- Added `GET /api/ai/strategy-live` for external AI analysis without SSH or admin access.
- The endpoint is read-only and protected by a runtime-only AI read token from environment/config, never from Git.
- The payload gives a controlled analysis bundle across three areas: 今日实时 board summaries, 涨停复盘 source/final summaries, and 今日策略 mainline/L2 status.
- Sanitized the response so it does not include API keys, cookies, admin/user data, sync tokens, runtime config values, or server file paths.
- Extended CORS allowed headers to support `x-ai-read-token` for this AI-only read path.
- No write actions, no config mutation endpoint, and no raw full-database dump were added.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/api/ai/strategy-live?day=2026-07-09` without token returns `403` and `invalid ai read-only token`.
- Public request with `x-ai-read-token` returns `ok:true`, `access:"ai-read-only"`, `reviewDay:"2026-07-08"`, four review source statuses, strategy mainlines, and L2 status.
- Response inspection found no secret-like strings for API keys, cookies, passwords, sync token, AI read token, or runtime key names.
- Source status output is sanitized and does not expose `C:\...` server paths.

Deployment:
- Production touched: yes.
- Git main deployed: `1f7225a`.
- Backup before upload: `C:\PandaDashboard\backups\ai-readonly-strategy-live-20260709-114405`.
- Uploaded `kpl-stats-server.js`.
- Configured `aiReadOnlyToken` in `C:\PandaDashboard\kpl-runtime-config.json`; token value is intentionally not logged or committed.
- Restarted `PandaDashboard-KPL-Server`; latest verified listener process was `916`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- Use `x-ai-read-token` header for Claude or other AI readers; only share the token out-of-band with trusted agents.
- This endpoint is intentionally not a raw DB export. If deeper inspection is needed, add a narrow read-only endpoint such as source/date/board detail with capped rows and sanitized fields.
- The endpoint is intended for analysis of strategy, review, and realtime market context; it must not become an admin or sync surface.

## 2026-07-09 - Claude - Fix historical lianban counted as today's leader signal

Changed:
- Fixed a 今日策略 leader-scoring bug found during live review: a candidate stock could carry historical `maxLianban/latestLianban` into the `lianban` field, then be scored and explained as if it had a same-day 连板.
- Same-day signals now require `todayLimit === true` before adding 今日涨停 points, 连板 points, early-seal points, or 今日X板/今日涨停 explanation text.
- If the stock is not actually in today's limit-up set, `lianban` is normalized to `0`, `firstLimitTime` does not contribute to scoring, and the explanation falls back to same-day gain when available.
- Historical 10-day/30-day gains, historical main-reason counts, and leader gating still work as before.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Claude reported `node --check` passed.
- Claude reported a regression case for the 长源东谷-style bug: historical `maxLianban=2` but no same-day limit-up no longer receives same-day 连板 text or bonus.
- Codex reviewed the diff before merging to main and confirmed it does not touch review-source policy, AI read-only endpoint, auth, homepage, Caddy, or Stanning/Yule.

Deployment:
- GitHub main only at merge time. Not deployed by this entry. No production restart for this merge yet.

Notes for next agent:
- Treat `lianban` and `firstLimitTime` on candidate rows as potentially historical unless `todayLimit` is true.
- Any future 今日状态 scoring must first prove membership in today's limit-up set.

## 2026-07-09 - Codex - Deploy historical lianban leader-scoring fix

Changed:
- Deployed Claude-authored main commit `3566e3c` to production after Codex review.
- The deployed fix prevents historical 连板 values from being used as same-day leader-scoring signals unless `todayLimit` is true.
- No other backend logic, review-source policy, AI read-only endpoint, homepage, Caddy, or Stanning/Yule behavior was changed.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09` returned `ok:true`, `count:8`, session phase `午后`, and top mainline `半导体`.
- AI read-only endpoint still returned `ok:true`, `access:"ai-read-only"`, four review sources, strategy data, and L2 availability after the restart.

Deployment:
- Production touched: yes.
- Git main deployed: `3566e3c`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-historical-lianban-fix-20260709-132602`.
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process after restart was `5252`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- Claude branch and `origin/main` were both at `3566e3c` before deployment.
- If checking the bug manually, verify that a stock not in today's limit-up set never displays `今日X板` and does not receive same-day 连板 or early-seal bonus.

## 2026-07-09 - Claude - 龙头评分v2:公平计分+主因新鲜度+当日在场+池子补全

Changed:
- 涨停次数改按值给分(每次14分封顶40,同次数同分),废除平局抽签——此前紫光股份与长源东谷同为10日2板,却因数组排序先后一个拿40一个拿16。
- 涨幅榜平局共名次(数值相同→同名次同分);排序平局细则:总分→主因新鲜→当日涨幅→代码,全确定性。
- 新增主因新鲜度分:最近一次本主线主因涨停 ≤3交易日+10 / ≤6日+6 / 10日内+2(owner:"紫光最近一次涨停主因是算力")。
- 新增当日在场分:今日涨停或大涨≥3% +6。
- 池子补全:近10日凡因本主线主因涨停过的股全部入池参赛(此前当天休息的股可能漏池);依据串新增"最近X日前"。
- 真实案例回归测试:07-08算力AI,紫光92(10日2板28+涨幅第1 30+30日第2 18+新鲜10+在场6)>长源81(28+27+20+6+0),同次数同分验证通过。

Files: kpl-stats-server.js / docs/DAILY_HANDOFF.md
Validated: node --check 通过;v2回归测试(紫光vs长源真实数据)通过。
Deployment: GitHub branch only。Not deployed. No restart(部署需更新 kpl-stats-server.js 并重启主服务)。
Notes for next agent: 分值常量集中在 strategyMainlineReworkLeaders;30日涨幅已双源核验(长源+25.4%/紫光+16.6%);预判回看攒数据后按胜率调参。

## 2026-07-09 - Codex - Deploy leader scoring v2

Changed:
- Reviewed and fast-forwarded Claude commit `501c079` into `main`, then deployed it to production.
- The deployed strategy leader scoring v2 adds fair same-value scoring, main-reason freshness, present-day participation, deterministic tie-breaking, and a fuller 10-trading-day candidate pool.
- No review-source policy, sync logic, AI read-only endpoint, auth, homepage, Caddy, or Stanning/Yule behavior was changed.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- After restart, the first strategy request briefly returned `strategy-mainline-preparing` while live refresh ran; follow-up polling returned stable `ok:true`.
- Public `https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-09` returned `ok:true`, `count:6`, phase `午后`; observed top mainlines included `半导体` with leader `新亚强` and `光模块` with leader `星网锐捷`.
- AI read-only endpoint still returned `ok:true`, `access:"ai-read-only"`, four review sources, strategy data, and L2 availability.
- Cloud `kpl-stats-server.js` SHA256 matches Git main after upload.

Deployment:
- Production touched: yes.
- Git main deployed: `501c079`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-leader-score-v2-20260709-142749`.
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process after restart was `3528`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- The immediate `strategy-mainline-preparing` response after a backend restart is expected while live cache refreshes; verify with a second request before treating it as failure.
- Watch real-session results before changing score constants again; v2 intentionally shifts leaders toward recent main-reason evidence and present-day participation.

## 2026-07-09 - Codex - Fix review source health using source-view tabs

Changed:
- Fixed a mismatch where 涨停复盘 source-view showed 选股宝 rows, but 数据源健康 still showed 选股宝 as missing.
- Extracted the source-view tab statistics rebuild into `recomputeReviewSourceStatsFromTabs()` and reused it from `after-close-status`.
- The shared helper now filters disabled sources, removes ST/北交所/excluded rows, recalculates each tab count/topics, rebuilds `sourceStats`, and drops stale source errors for sources that now have rows.
- No source collection, source-view display policy, review-source policy, strategy scoring, AI read-only endpoint, auth, homepage, Caddy, or Stanning/Yule behavior was changed.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `https://market.dreamerqi.com/api/after-close-status?day=2026-07-09&mainReasonMode=same-day` now returns `reviewAutoSources` with 选股宝 `stockCount:74`, `rowCount:74`, `coveragePct:100`.
- Public `https://market.dreamerqi.com/api/limit-up-main-reason-db/source-view?day=2026-07-09&force=1` returns matching tabs: 综合归纳 74, 选股宝 74, 韭研 74, 复盘啦 0, 淘股吧 0.
- Cloud `kpl-stats-server.js` SHA256 matches Git main after upload.

Deployment:
- Production touched: yes.
- Git main deployed: `dbc8f97`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-review-health-source-tabs-20260709-163051`.
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process after restart was `15156`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- 数据源健康 should read `sourceCoverage.reviewAutoSources`; if a source tab has rows, its health count should come from the same source-view tab stats.
- 2026-07-09 still has 复盘啦 and 淘股吧 source gaps; this entry only fixed stale health reporting for sources already present in source-view.

## 2026-07-09 - Codex - Harden review health against stale main DB coverage

Changed:
- Removed the last early-return path where 数据源健康 could skip source-view tab recomputation when the saved 综合主因库 was stale or missing stocks.
- `resolveAfterCloseSourceCoverage()` now always attempts to derive source coverage from source-view tabs, then falls back to saved coverage only if no source tab has rows.
- The coverage denominator now falls back to final tab count or max source tab count when saved main DB totals are unavailable.
- This is intended to make the rule hard: if 涨停复盘 source tabs show a source with rows, 数据源健康 should show that source as present too.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`.
- Public `https://market.dreamerqi.com/health` returned `ok:true`.
- Public `after-close-status` for 2026-07-09 returns health sources: 韭研 74 and 选股宝 74.
- Public `source-view` for 2026-07-09 returns matching tabs: 综合归纳 74, 选股宝 74, 韭研 74, 复盘啦 0, 淘股吧 0.
- Cloud `kpl-stats-server.js` SHA256 matches Git main after upload.

Deployment:
- Production touched: yes.
- Git main deployed: `6f6f73a`.
- Backup before upload: `C:\PandaDashboard\backups\deploy-review-health-stale-main-db-guard-20260709-163830`.
- Uploaded `kpl-stats-server.js`.
- Restarted `PandaDashboard-KPL-Server`; current listener process after restart was `11012`.
- Did not restart Caddy or `Panda Yule Server`.

Notes for next agent:
- If this mismatch appears again, check whether the source tab itself is actually nonzero first. If the tab is nonzero but health is zero, it is a bug in `resolveAfterCloseSourceCoverage()` or `recomputeReviewSourceStatsFromTabs()`.
- Current 2026-07-09 remaining source gaps are real source gaps: 复盘啦 0 and 淘股吧 0.

## 2026-07-09 - Codex - Establish AI discussion group protocol

Changed:
- Added a formal AI discussion group protocol for high-impact product and strategy decisions.
- The protocol explicitly rejects simple task splitting. Agents must answer the same owner question, write independent views, challenge each other, revise views, and converge before major implementation.
- Added a reusable discussion template and the first 今日主线榜 discussion thread.
- Added a GitHub issue template for future strategy discussions.
- Updated `CLAUDE.md` and `docs/COLLABORATION_WORKFLOW.md` so future agents read and follow the discussion protocol.

Files:
- `docs/strategy/AI_DISCUSSION_GROUP.md`
- `docs/strategy/DISCUSSION_TEMPLATE.md`
- `docs/strategy/discussions/2026-07-09-mainline-ranking-discussion.md`
- `.github/ISSUE_TEMPLATE/strategy-discussion.yml`
- `CLAUDE.md`
- `docs/COLLABORATION_WORKFLOW.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Reviewed the new protocol content for the owner requirement: "not division of labor, but joint discussion before deciding how to achieve the goal."
- Confirmed the discussion thread is seeded for 今日主线榜 and leaves agent views as `Pending` until each agent participates.

Deployment:
- Production touched: no.
- GitHub documentation/process change only.
- No cloud upload or service restart required.

Notes for next agent:
- For important strategy work, especially 今日主线榜, start or update a discussion thread before implementation unless the owner explicitly asks for an immediate experiment.
- Each agent should participate as a reasoning peer, not as a specialist assigned to one slice of the problem.

## 2026-07-09 - Claude - 主线榜保温:后台定时刷新,打开秒出

Changed:
- 问题(owner 反馈):每次打开策略页,今日主线榜要等很久。根因:Codex 的缓存链(内存90s→文件→5分钟陈化+后台刷→preparing)只由用户请求触发刷新——第一个访问者永远垫背等冷构建;盘中超过5分钟无人访问,下一位又成为"第一个"。
- 修复:新增保温循环——交易时段(早盘/上午盘/午后/尾盘)每 2.5 分钟后台自动刷新当日主线榜缓存;服务启动 15 秒后先预热一次(重启后不冷场)。复用 startStrategyMainlineRefresh(自带同日去重,重入安全),非交易日/收盘后不跑,不改任何缓存语义与打分逻辑。

Files: kpl-stats-server.js / docs/DAILY_HANDOFF.md
Validated: node --check 通过;保温条件与缓存链逻辑走查(交易时段判定复用 sessionPhase,与请求路径同源)。
Deployment: GitHub branch only。Not deployed(部署需更新 kpl-stats-server.js 并重启主服务;验证:盘中任意时间打开策略页主线榜应秒出,cacheState 为 live-memory/live-file)。
Notes for next agent: 保温间隔常量 STRATEGY_MAINLINE_KEEP_WARM_MS=150s,略小于文件缓存 90s+陈化窗口,保证缓存常温;若构建单次耗时超过 2.5 分钟,去重机制会自然跳过下一拍,不会堆积。本改动属基础设施,不涉打分语义,未走 AI 讨论组流程;主线榜语义类改动请按 docs/strategy/AI_DISCUSSION_GROUP.md 先讨论。

## 2026-07-09 - Codex - Start discussion on 今日主线榜 speed

Changed:
- Created a dedicated AI discussion group thread for optimizing how quickly `今日主线榜` appears.
- Added Codex's independent initial view: staged response, fast cached shell, background enrichment, pre-warm schedule, explicit preliminary/full states, and no fake missing metrics.
- Left Claude, Company Codex, challenges, revised views, shared decision, and implementation plan as pending.
- No code behavior was changed.

Files:
- `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Confirmed this follows `docs/strategy/AI_DISCUSSION_GROUP.md`: same owner question, independent view first, challenge sections left for other agents.

Deployment:
- Production touched: no.
- GitHub documentation/discussion change only.
- No cloud upload or service restart required.

Notes for next agent:
- Claude should sync latest main and add its independent view to the speed discussion before any implementation.
- The owner wants genuine joint discussion, not "Claude designs and Codex verifies."

- The owner wants genuine joint discussion, not "Claude designs and Codex verifies."

## 2026-07-09 - Codex - Respond to Claude mainline speed discussion

Changed:
- Pulled Claude's independent view into `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md`.
- Added Codex's challenges to Claude's cache-first proposal.
- Revised Codex's view: cache lifecycle and explicit staleness metadata should be first; full staged fast/full API redesign should wait for measurements.
- Explicitly marked Claude's keep-warm timer code experiment as not yet accepted for deployment until the discussion converges or the owner asks for an experiment.
- No production code was merged from Claude in this step.

Files:
- `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Reviewed Claude branch diff and confirmed it contains both discussion updates and a backend timer experiment.
- Chose to carry forward the discussion content only, not the backend code, because the owner asked for a group discussion before deciding implementation.

Deployment:
- Production touched: no.
- GitHub discussion/documentation change only.
- No cloud upload or service restart required.

Notes for next agent:
- Claude should read Codex's challenges/revised view and either revise its view or defend the keep-warm timer experiment with the requested metadata/guardrails.
- The next discussion step should converge on stale/expired thresholds and the minimum metadata contract before implementation.

- The next discussion step should converge on stale/expired thresholds and the minimum metadata contract before implementation.

## 2026-07-09 - Codex - Implement mainline cache staleness Step A

Changed:
- Implemented the accepted Step A for `今日主线榜`: same-day usable cache is returned instead of blank/preparing, with explicit freshness metadata.
- Added backend response fields: `generatedAt`, `ageSeconds`, `staleness`, `cacheState`, `refreshState`, and `quality`.
- Same-day cache older than 10 minutes is still displayed as `expired` while a background refresh is triggered.
- Pre-market continues to show a not-open message and does not show yesterday's snapshot as today's strategy view.
- Added a compact strategy-page status row showing cache age, stale/expired state, refresh state, and quality summary.
- Updated the speed discussion with the owner's final rules: do not force many mainlines, allow labeled >10 minute same-day cache, no pre-market yesterday snapshot, and do not deploy Claude's keep-warm timer in Step A.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- Parsed the inline script in `kpl-dashboard_17_apple.html` with `new Function(...)` for syntax validation.

Deployment:
- Production touched: yes.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\mainline-step-a-20260709-192831`.
- Uploaded `kpl-stats-server.js`, `kpl-dashboard_17_apple.html`, `docs/DAILY_HANDOFF.md`, and `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md` to `C:\PandaDashboard`.
- Restarted `PandaDashboard-KPL-Server`; verified `/health` and `/api/strategy-mainlines?day=2026-07-09`.
- Verified strategy response metadata includes `generatedAt`, `ageSeconds`, `staleness`, `cacheState`, `refreshState`, and `quality`.

Notes for next agent:
- Claude's keep-warm timer experiment remains unmerged and undeployed. Step B should only be revisited after observing real trading-day cache age and `preparing` frequency.
- `mainlineCount >= 1` is enough for a usable cache; do not force the page to show many themes when the market only has one or two real mainlines.

- `mainlineCount >= 1` is enough for a usable cache; do not force the page to show many themes when the market only has one or two real mainlines.

## 2026-07-09 - Codex - Default strategy discussions to Chinese

Changed:
- Added a language rule to the AI discussion group protocol: Git discussion files should use Chinese by default unless the owner explicitly asks for English or an external quote/technical identifier requires English.
- Converted the strategy discussion template to a Chinese, timeline-based format so future discussions can record Owner, Codex, Claude, and Company Codex messages in order.

Files:
- `docs/strategy/AI_DISCUSSION_GROUP.md`
- `docs/strategy/DISCUSSION_TEMPLATE.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Documentation-only change; reviewed the template structure for future "question first, no answers yet" discussions.

Deployment:
- Production touched: no.
- GitHub documentation/process change only.
- No cloud upload or service restart required.

Notes for next agent:
- Future Git discussion files should be written in Chinese by default.
- When starting a discussion, create the question/context first and leave independent-agent answer sections empty until the owner says to begin independent answers.
## 2026-07-09 - Claude - 主线榜提速:日文件缓存 + Step B 护栏版保温心跳

Changed:
- 背景:owner 点明"实时/复盘/策略三者结合——实时里现成的数据要复用"。排查发现主线榜冷构建要连读约 50 个日文件(30日主因回溯+10日龙头指标+10日池子补全),其中 readLimitUpMainReasonDbDay 每次都重新 读盘+解析+套override(缓存只写不读),readLimitUpDbDay 完全无缓存——历史日文件几乎不变,纯浪费 IO。
- 优化A(日文件 60s TTL 缓存):主因库与涨停底库日文件读取加短 TTL 缓存(含 ENOENT 负缓存);60s 保证管理员改主因也及时可见;收盘价库原有缓存不动。冷构建的文件 IO 从 ~50 次降到每分钟每文件至多 1 次。
- 优化B(Step B 契约落地):按速度讨论帖共识给保温心跳补齐护栏——失败退避×2(150s→300s→…→上限15min,成功复位)保护外部数据源;可观测字段 keepWarm(lastTickAt/lastResult/consecutiveFailures/currentDelayMs)随主线榜响应输出;setInterval 改自调度 setTimeout;无效时段跳过与同日去重保持。
- 更大的"复用实时卡片成分统计选龙头"属语义级改动,已按协议归入题材族/龙头池讨论议题,不在本次实施。

Files: kpl-stats-server.js / docs/DAILY_HANDOFF.md
Validated: node --check 通过;round-4 与龙头 v2 回归测试通过。
Deployment: GitHub branch only(PR #10)。Not deployed. No restart yet。
Notes for next agent: 日文件写入路径(回补/override 保存)未主动失效 timed 缓存,最坏 60 秒陈化,属设计内;若未来 TTL 调大需补主动失效。keepWarm 字段可用于验证心跳实际运行节奏。
