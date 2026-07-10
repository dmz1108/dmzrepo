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

## 2026-07-09 - Codex - 固化 TGB 湖南人每日复盘 SOP 并补录 7.9

Changed:
- Added a fixed daily SOP for manually handling `@TGB湖南人` recaps so future runs do not rediscover the method or accidentally use the wrong image.
- The SOP explicitly requires the official white `@TGB湖南人` table image, excludes 同花顺红色数据可视化图、回帖图、二维码、广告图、炸板区, and requires count/missing/extra/duplicate validation before writing the formal source file.
- Forced the cloud TGB evidence refresh for `2026-07-09`; raw article/image evidence was saved from `https://www.tgb.cn/a/2ti94HvHhhA`.
- Qwen OCR/vision was configured but failed with provider `Arrearage`, so the formal file was manually transcribed from the official image `image-01-06.png`.
- Uploaded the formal TGB source file for `2026-07-09` and rebuilt the multi-source main-reason DB.

Files:
- `docs/ops/TGB_HUNAN_DAILY_SOP.md`
- `docs/DAILY_HANDOFF.md`
- Runtime only on cloud: `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-09.json`

Validated:
- Local structured file validation passed: declared total `74`, baseline count `74`, missing `0`, extra `0`, duplicates `0`, weak rows `0`.
- TGB board counts from the official image: 半导体 `19`, 长鑫科技 `13`, AI硬件 `10`, 业绩 `8`, PCB `6`, 机器人 `6`, 其他热点 `6`, 其他个股 `6`.
- Public source-view after upload shows `2026-07-09`: 综合归纳 `74`, 复盘啦 `74`, 选股宝 `74`, 韭研 `74`, 淘股吧 `74`.

Deployment:
- Production touched: yes, runtime data only.
- No application code was deployed.
- No service restart was required.
- Cloud operation log appended to `C:\PandaDashboard\_cloud-change-log-20260705.md`.

Notes for next agent:
- For future “湖南人复盘” requests, read `docs/ops/TGB_HUNAN_DAILY_SOP.md` first.
- Do not select TGB images by file size; the larger red 同花顺 image is not the TGB source.
- If the admin health panel still shows a missing TGB source while source-view shows TGB rows, investigate the health endpoint/cache/口径, not the formal TGB file first.

## 2026-07-09 - Claude - PR#10 评审修复:日文件缓存失效 + force 旁路

Changed:
- 按 Codex 评审意见补齐缓存失效:writeLimitUpDbDay 写后即更新 timed 缓存;writeLimitUpMainReasonDbDay 写后删除对应 timed 缓存(读取时重建以套 override);setLimitUpMainReasonOverride 同时失效 mainReasonDbCache 与 mainReasonDbDayTimedCache——同步/回补/手动TGB上传/管理员改主因不再有最长60秒陈化窗口。
- 两个日文件读函数支持 options.force 旁路 timed 缓存;/api/limit-up-main-reason-db/day 接入 force=1(source-view 原有 force 链路不变)。
- DAILY_HANDOFF 格式清理:压缩多余空行、确保结尾换行;经查无重复条目标题。

Files: kpl-stats-server.js / docs/DAILY_HANDOFF.md
Validated: node --check 通过;round-4 与龙头 v2 回归通过;新增缓存失效静态断言(三写路径失效语句、force 旁路、day 端点接线)全过。
Deployment: GitHub branch only(PR #10)。Not deployed. No restart yet。

## 2026-07-09 - Claude - PR#10 二审修复:源视图 force 补全 + 保温只在服务进程启动

Changed:
- `buildDaySourceViewWithConsensus` 的 `dbPayload` 读取补传 `{ force: !!opts.force }`,此前 force 只传给了证据/质量重建,底层 DB 读仍可能吃到 60s 陈缓存。
- `ensureLimitUpMainReasonEvidenceAndQualityDay` 内部的 `readLimitUpMainReasonDbDay` 补传 `{ force: !!options.force }`,force 重建时证据/质量基于最新 DB 文件。
- 主线榜保温启动从模块顶层挪进 `startStrategyMainlineKeepWarm()`,只在 `server.listen` 分支调用;CLI 任务(--main-reason-backfill、--tgb-vision-sync 等)不再可能在盘中长任务里误启保温。
- `docs/DAILY_HANDOFF.md` 补齐 4 处正文条目标题前缺失的空行(625/1062/1738/1780 行附近),模板代码块内示例未动。

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check kpl-stats-server.js` 通过。
- 缓存失效静态断言、round4 回归、龙头 v2 回归全部通过。
- grep 断言:两处 force 传参就位;顶层不再有 `setTimeout(strategyMainlineKeepWarmTick...)`,仅 `server.listen` 分支调用 `startStrategyMainlineKeepWarm()`。

Deployment:
- GitHub only(PR #10)。未部署云端,无服务重启。

Notes for next agent:
- 合并 PR #10 后云端只需部署 `kpl-stats-server.js` 并重启主服务;保温心跳会在服务启动 15 秒后自动预热一次。
- CLI 模式下保温不会启动,属预期行为。

## 2026-07-09 - Claude - 开主线语义议题集讨论文档(仅列议题,未写观点)

Changed:
- 新建 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`,集中列出 6 个待讨论的语义议题:主线族边界归并、主线粒度切换现象(owner 案例:半导体→存储芯片)、个股细分原因是否算主因门槛、龙头 10 日涨停次数口径、一股双主线、复用实时卡片成分股统计分析龙头。
- 按 owner 要求只列议题、现状事实与口径差异,所有 agent 观点区留 Pending,待各自独立填写。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码。确认无 secrets/runtime 数据。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- Codex / Company Codex 请在该文档各自的 Independent View 区写独立观点(先不看对方的),之后进入互相质疑与修正阶段;owner 批准 Shared Decision 前不动代码。
- 议题 2 的 owner 案例是第一手证据,讨论时按协议作为 case 对待,不作为可忽略的偏好。

## 2026-07-09 - Codex - 回复主线语义议题集独立观点

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 的 `Codex Independent View` 区写入独立观点。
- 观点核心:今日主线榜应是盘中预测系统,不强行凑很多主线;建议采用 `主线族 family + 当日活跃粒度 active node` 两层语义;支持半导体向存储芯片这类粒度下沉;个股细分原因应作为分层证据参与主线与龙头判断;龙头展示应区分本主线10日涨停与全部10日涨停;实时卡片数据用于盘中快速信号、扩池和交叉验证,不直接替代主因库。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 文档变更检查完成。
- 未改代码,未加入 secrets/runtime 数据。

Deployment:
- GitHub branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude / Company Codex 应在各自 Independent View 区继续独立写观点,然后进入 Challenges 阶段。
- owner 批准 Shared Decision 前不要开始改策略代码。

## 2026-07-09 - Codex - 将主线语义讨论改成横向矩阵

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 顶部加入 `横向讨论矩阵`。
- 矩阵列为 `问题 / 细节点`、`Codex 观点`、`Claude 观点`、`Owner 评论 / 方向`、`暂定结论`,方便 owner 横向查看每个细节点的多方观点。
- Codex 已先在 6 个议题行填入简版观点;Claude 和 Owner 列保持 `Pending`,等待后续补充。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude 下一步应直接在同一张 `横向讨论矩阵` 的 `Claude 观点` 列填写对应 6 个议题的观点,不要另开平行文件。
- Owner 后续可以直接在 `Owner 评论 / 方向` 列补充自己的判断,再由各 agent 继续评论和收敛。

## 2026-07-09 - Claude - 填写主线语义议题矩阵的 Claude 观点列(6/6)

Changed:
- 在中立讨论分支 `discussion/3party-mainline-semantics-20260709` 的 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 横向讨论矩阵中,填写全部 6 行的 Claude 观点列;基于此前独立分析写成,未参照 Codex 列,未改动 Codex 观点。
- Claude Independent View 区改为指向矩阵列的说明。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码、无部署。核对矩阵表格管道符列数完整、Codex 列原文未动。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- 下一步进入互相质疑环节(Codex Challenges Claude / Claude Challenges Codex);Owner 评论与暂定结论列待 owner 填。

## 2026-07-09 - Claude - 主线语义讨论:提交对 Codex 的质疑(6 条)

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 的 Claude Challenges Codex 区填写 6 条质疑:同族 parent/child 重复占位无互斥规则、细分证据继承依赖尚未定义的成分集合(且细分级资金数据不可得)、细分证据能否单独过硬门槛需二值表态、本主线次数与议题2存在计算顺序循环依赖且公平原则未写入、唯一第一龙头三标准无优先序(另补一股两挂的复盘胜率重复计算问题)、实时卡复用的"提速"收益不成立应从决议依据中移除并与 Step A 新鲜度语义对齐。
- 开头明确列出认同项(两层结构、分层计权、双口径、收敛顺序),不重复论证。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码、无部署。Codex 观点原文未改动。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- 等 Codex 的 Challenges Claude 与双方 Revised View;质疑 3(门槛二值表态)和质疑 4(计算顺序)是收敛的关键分歧点,建议优先回应。

## 2026-07-09 - Codex - 为主线语义讨论补横向质疑矩阵

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 的观点矩阵下方新增 `横向质疑 / 回应矩阵`。
- 将 Claude 已写的 6 条质疑按 6 个议题压缩进表格行,并预留 `Codex 回应 / 修正`、`Codex 对 Claude 的质疑`、`Claude 回应 / 修正`、`Owner 判断 / 方向` 列。
- 这样讨论流程从"独立观点矩阵"进入"质疑/回应矩阵",避免质疑只散落在长段落里。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- 下一步 Codex 应在 `Codex 回应 / 修正` 列逐条回应 Claude 的 6 条质疑,并在必要时补 `Codex 对 Claude 的质疑`。
- Owner 可以直接在 `Owner 判断 / 方向` 列给最终交易判断。

## 2026-07-09 - Codex - 将主线语义讨论矩阵改为交错行布局

Changed:
- 按 owner 反馈,取消"观点矩阵"和"质疑/回应矩阵"上下分离的布局。
- 将 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 顶部改为一张交错行表:每个议题第一行是双方观点,第二行紧跟该议题的互评/回应。
- 新表列为 `编号`、`行类型`、`问题 / 互评重点`、`Codex`、`Claude`、`Owner 评论 / 方向`、`暂定结论`,避免 owner 阅读时上下翻找。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- 后续发言应直接填同一张表的相邻行:观点写在 `观点` 行,质疑/回应写在紧跟的 `互评` 行。
- 不要再把同一议题的观点和质疑拆成两张相隔很远的表。

## 2026-07-09 - Codex - 回复 Claude 的主线语义互评

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 的 6 个 `互评` 行中填写 Codex 回应/修正和 Codex 对 Claude 的反向质疑。
- 接受并细化多项 Claude 质疑:同族 parent/child 需要互斥展示规则;细分集合应由历史细分原因生成;细分证据可以单独过主线关联门槛;本主线次数需先做证据继承再统计;唯一第一龙头需要优先序;实时卡复用价值主要是扩池/交叉验证而非提速。
- 继续保留待 owner 判断的关键点:同族何时允许多 child 并列、细分原因早期低置信通道、唯一第一龙头是否强制唯一、实时卡是否需要盘中增量刷新。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude 下一步应在同一张交错行表的 Claude 互评文本里回应 Codex 的反向质疑,或直接协助整理 `暂定结论`。
- Owner 可以优先看 3 个最关键判断:细分证据能否单独过门槛、parent/child 是否默认互斥、实时卡是否只做历史扩池而非盘中实时依据。

## 2026-07-09 - Codex - 将主线讨论改为逐议题贴身块

Changed:
- 按 owner 反馈,将 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 顶部从宽表格改成逐议题小块。
- 每个议题块内固定顺序为:问题、Codex 观点、Claude 观点、互评/回应、Owner 评论、暂定结论。
- 互评/回应内按 `Claude 质疑 Codex` -> `Codex 回应/修正` -> `Codex 质疑 Claude` -> `Claude 回应/修正` 排列,让回应直接贴着质疑。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- 后续不要再使用过宽的横向 Markdown 表格记录讨论;优先使用逐议题小块,保证回应贴着对应质疑。
- Claude 下一步应在每个议题块的 `Claude 回应/修正` 处填写回应。

## 2026-07-09 - Codex - 写入 Owner 主线榜补充观点并修正 Codex 回应

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 新增 `Owner 最新补充` 区,明确讨论可多轮继续,不是走完独立观点/质疑/回复就结束。
- 将 Owner 对 6 个议题的方向写入对应 `Owner 评论 / 方向`。
- 修正 Codex 在议题 1 的回应:不再把 parent/child 设为默认展示互斥,而是允许盘中预测阶段同时展示同一主线族下的大主题、产业链细分、事件/核心公司链条等多粒度候选;半导体、先进封装、存储芯片/长鑫存储只作为示例,不能写死成特殊规则。真正需要控制的是重复计分和解释依据。
- 修正议题 4:龙头不是只能显示一个,可展示 1-3 个供参考分析。
- 修正议题 6:今日实时卡不只是历史扩池,还应为策略页提供当天板块涨幅、资金净流入、成分股涨停次数、10日/30日涨幅等信号。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude 下一步应结合 Owner 最新补充,不要继续把同族主线理解成默认展示互斥;重点讨论如何防重复计分、如何解释贡献依据、后台如何整理细分原因/别名/股票集合,以及今日实时卡到策略页的数据契约。

## 2026-07-10 - Claude - 主线语义讨论:填写六个议题块的 Claude 回应/修正

Changed:
- 在讨论分支的 `2026-07-09-mainline-semantics-topics.md` 六个议题块中填写 Claude 回应/修正,吸收 Owner 泛化指引(大主题/产业链细分/事件链条/核心公司链条为通用粒度抽象,示例不写死):
- 议题1:收回展示互斥主张,改为"防重复计分"三处落点(predictScore 族内代表、quality 主线数、复盘胜率);命名接受 alias/family 配置为准。
- 议题2:接受三条件共同成立;提出通用"细分证据索引库"方案(四源细分原因归一 -> 证据词/别名/股票集合/来源数,滚动30日,别名自动候选+人工确认),回应 Owner 的后台整理问题。
- 议题3:接受早期低置信通道;门槛二值已收敛(细分证据可单独过门槛);要求低置信候选复盘胜率分开统计并定义升级规则。
- 议题4:澄清新鲜度是资格保护+加分非覆盖;计算顺序与公平原则双方已一致,可进暂定结论。
- 议题5:收回唯一归属强规则;提出卡内胜率按卡记、全局胜率按股去重计最强卡的统计口径;接受 Codex 优先序并提出低置信命中降半级的联动问题。
- 议题6:给出实时卡->策略页数据契约草案(A直接复用/B实时重算/C交叉验证扩池 + 字段口径元数据规则);标注待核对项:实时卡涨停统计与 enrichReviewLeaderMetrics 是否同一实现。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码、无部署。Codex/Owner 原文未改动。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- 已可收敛项(建议写入暂定结论):门槛二值(细分可单独过门槛)、计算顺序、公平原则、Step A 新鲜度语义复用。
- 仍开放:族内代表去重规则、下沉阈值回测标定、低置信升级规则、全局胜率归因、A类字段实现是否同源(需 Codex 核对)、B类实时重算与 top-18 扫描的覆盖差距。

## 2026-07-10 - Codex - 主线语义讨论收敛整理

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 顶部新增 `收敛整理`。
- 整理出 9 条已可进入暂定结论:多轮讨论机制、多粒度候选展示、防重复计分、细分证据可单独过门槛、先证据继承再统计次数、龙头候选不强制唯一、公平原则、实时卡到策略页数据契约、复用 Step A 新鲜度语义。
- 整理出 8 条仍需继续讨论的问题:族内代表去重、quality 主线数量、低置信升级、低置信胜率单独统计、全局胜率归因、下沉阈值标定、细分证据索引人工确认、实时卡覆盖与主线榜扫描范围。
- 整理出 6 条 Codex 需要核对的代码/数据口径:实时卡与 `enrichReviewLeaderMetrics` 是否同源、主线榜扫描范围/超时、实时卡字段新鲜度、四源细分原因字段和保存粒度、alias/family 复用点、预测复盘胜率计数口径。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- 下一步不应直接实现;先由 Codex 核对真实代码/数据口径,把事实补进讨论文件。
- Claude 后续应基于核对事实再回应,然后再进入 Shared Decision。

## 2026-07-10 - Claude - 复核 Codex 的主线语义收敛整理

Changed:
- 在讨论文档"收敛整理"下新增"Claude 复核"小节:确认 9 条暂定结论均未越过讨论达成范围,Owner 五点补充全部体现;提出 2 点措辞补强(结论5写明按股票集合继承;待核对清单补 consensusTier 是否覆盖细分原因字段)。
- 先行提供 2 条已验证代码事实:盘中成分股增强仅取前 5 板块(STRATEGY_MAINLINE_RISING_BOARD_LIMIT=5,排序 涨停数>涨幅>净流入,每板块 1.5s 超时),涨停数优先导致"大涨但涨停少"的新发板块可能漏扫;热门题材搜索路径的统计与 enrichReviewLeaderMetrics 为两套实现(cardData 快照路径待 Codex 核到底)。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,代码仅做只读核查(grep/Read),无代码改动、无部署。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- 收敛整理已获 Claude 复核通过(含两点补强建议);等 Codex 完成其余待核对项后,可整理 Shared Decision 与第一阶段实现计划,交 Owner 批准。

## 2026-07-10 - Codex - 主线语义讨论代码事实核对

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 接受 Claude 的两点补强:结论 5 写明历史证据按股票集合继承;待核对清单新增 `consensusTier` 是否覆盖个股细分原因。
- 新增 `Codex 代码事实核对(2026-07-10)` 小节,补齐 7 条事实:
- 实时卡展开指标与策略页 `enrichReviewLeaderMetrics` 不是同一套实现,字段不能直接当同口径复用。
- 主线榜盘中增强实际是 top-5 板块,不是 top-18,新发强势方向可能漏扫。
- 今日主线榜盘中不回退昨日,但实时字段和快照字段必须显式区分 `source/staleness/cutoff`。
- 四源细分原因字段已保留,但还没有统一 30 日细分证据索引库。
- 现有 taxonomy/canonical/family 函数可复用,但缺主线族/active node 可审计配置。
- 预测复盘胜率当前是每日单主预测事件口径,不支持同股多卡去重或低置信单独统计。
- `consensusTier` 主要覆盖板块主因共识,不能直接当细分原因多源共识使用。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 只读核查 `kpl-stats-server.js` 相关函数,未改代码。
- 纯文档变更,未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude 下一步应基于这些代码事实继续回应:尤其是 top-5 漏扫、字段口径拆分、细分证据索引库、低置信胜率和同股多卡去重。
- 还不应直接实现;建议先整理 `Shared Decision` 草案和第一阶段实现计划,再由 Owner 确认。

## 2026-07-10 - Claude - 基于 Codex 核对事实回应,起草 Shared Decision 与第一阶段计划

Changed:
- 讨论文档新增"Claude 基于核对事实的回应":top-5 漏扫用补选通道修(不动语义);两套指标实现第一阶段不合并只隔离(改名+source/cutoff 元数据);细分证据索引库为三议题共同前置且可复用现有归一/词典设施;细分层多源确认由索引"来源数"承担而非改 consensusTier;复盘改造记录先行、规则后定。
- 起草 Shared Decision(4 条,含被否决方案记录)与第一阶段 Implementation Plan(P1-A 索引库 / P1-B 扫描补选 / P1-C 预测记录扩展 / P1-D 口径元数据,全部"只加不改"、单项可回滚)及 Validation Plan;均标注为草案,待 Codex 会签、Owner 批准。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码、无部署。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- Codex 请会签或修改 Shared Decision / Implementation Plan 草案;Owner 批准后才开实现分支。第二阶段语义项(下沉识别、族内去重、打分口径、胜率规则)明确等第一阶段数据积累后另行讨论。

## 2026-07-10 - Codex - 会签主线语义第一阶段草案

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 新增 `Codex 会签与补充约束(2026-07-10)`。
- Codex 同意 Claude 的阶段划分:第一阶段只加不改,先补观测和记录,不直接改主线定义、龙头打分或胜率算法。
- 补充 5 条落地约束:
- P1-A 只建衍生索引,不反写 TGB 湖南人、选股宝、开盘啦、韭研等来源底层库。
- P1-B 补选通道必须可解释、可关闭、可配置上限。
- P1-B 不能把历史快照伪装成盘中实时补选。
- P1-C 先扩预测记录,暂不改胜率展示。
- P1-D 字段命名和元数据必须区分盘中 K 线、收盘口径、快照口径。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- 当前讨论已形成 Codex/Claude 都可接受的第一阶段草案,但仍需 Owner 批准后再开实现分支。
- 若 Owner 批准,建议 P1-C 或 P1-A 先做:想尽快积累样本就先 P1-C;想先解决语义基础就先 P1-A。

## 2026-07-10 - Claude - 确认 Codex 五条落地约束,讨论进入 Owner 批准阶段

Changed:
- 讨论文档新增"Claude 确认 Codex 约束":5 条约束全部接受并并入 Implementation Plan 作为实现 PR 的验收标准;开工顺序建议 P1-C 先行(样本积累机会成本随时间流逝)、P1-A 紧随,再 P1-B、P1-D。
- 声明讨论内容完备,等待 Owner 批准;批准前不动代码,批准后每项单独开实现分支,不在讨论分支改代码。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更,无代码、无部署。

Deployment:
- GitHub only。未部署云端,无服务重启。

Notes for next agent:
- 三方讨论闭环:独立观点 -> 互相质疑 -> 修正 -> 收敛整理 -> 事实核对 -> Shared Decision 草案 -> Codex 会签(5 约束)-> Claude 确认。现在只差 Owner 批准。批准后第一个实现分支建议从 P1-C 开始。

## 2026-07-10 - Owner/Codex - 批准主线语义第一阶段实现顺序

Changed:
- 在 `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md` 新增 `Owner 批准(2026-07-10)` 小节。
- 将 Shared Decision 状态从草案改为已获 Codex 会签与 Owner 批准,允许进入第一阶段实现。
- 将第一阶段顺序明确为: **P1-C -> P1-A -> P1-B -> P1-D**。
- 记录 Owner 原因: P1-C 改动最小但样本等不来,晚一天少一天回测数据;P1-A 是第二阶段语义优化地基;第二阶段等 P1-A/P1-C 跑约 10 个交易日后再回讨论分支定规则并二次批准。

Files:
- `docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 纯文档变更,未改代码。
- 未加入 secrets/runtime 数据。

Deployment:
- GitHub discussion branch only。未部署云端,无服务重启。

Notes for next agent:
- Claude 可以先开独立实现分支做 P1-C 预测记录扩展。
- P1-C 要遵守已会签约束:只扩记录,暂不改胜率展示、不改主线定义、不改龙头打分。
- P1-C 完成后再评审/合并/部署;随后进入 P1-A。

## 2026-07-10 - Claude - 开明星股/龙头预判讨论:Owner 口述 L2 知识留痕 + 现状事实卡 + 六议题

Changed:
- 新建 `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`(讨论分支):Owner 口述四组第一手知识原话留痕(L2 档位与股价关系/最大可统计档、明星判定口径(+5%→涨停窗口三比值 2/3>1.8,封板 2/3>2)、预期明星股 ≥3亿主动买入预判信号、真主线必须有 1-2 明星股);系统现状事实卡 9 条(代码逐条核验,标注与口述的冲突点:只用 3 档且非最大档、无窗口概念、无3亿信号、明星非主线门槛、扫描 5min/2板瓶颈、数量与挂载单位偏差);议题 A-F(最大可统计档、判定口径升级、L2版潜力预判、明星主线门槛、扫描调度、数量收敛)。
- 所有 agent 观点区 Pending,待 Codex 与 Claude 独立填写。

## 2026-07-09 - Codex - 合并并部署 PR #10 主线榜 Step B 保温

Changed:
- Merged Claude PR #10 into `main` and cleaned duplicate handoff note lines.
- Deployed the Step B strategy mainline keep-warm backend changes to the cloud server.
- The deployed behavior now includes 60s day-file read caches with write/override invalidation, `force=1` passthrough for source-view DB reads, and server-mode-only keep-warm startup.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`
- `docs/strategy/discussions/2026-07-09-mainline-speed-discussion.md`
- `docs/strategy/discussions/2026-07-09-mainline-ranking-discussion.md`

Validated:
- Local `node --check kpl-stats-server.js`.
- Cloud `node --check C:\PandaDashboard\kpl-stats-server.js`.
- Cloud `/health` and `https://market.dreamerqi.com/health` returned `ok`.
- Cloud `/api/strategy-mainlines?day=2026-07-09` returned `ok: true`, `cacheState: snapshot`, `mainlineCount: 8`, and `keepWarm` metadata.
- Since China market was already closed, `keepWarm.lastResult` was `skipped-off-session`, which is expected; tomorrow during trading it should become `ok` if refresh succeeds.
- Cloud `source-view?day=2026-07-09&force=1` returned 综合归纳/复盘啦/选股宝/韭研/淘股吧 all `74`.
- Cloud `kpl-stats-server.js` SHA-256 matched local.

Deployment:
- Production touched: yes.
- GitHub main pushed through `c969ad4` before deployment.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\pr10-step-b-20260709-233333`.
- Uploaded `kpl-stats-server.js`, `docs/DAILY_HANDOFF.md`, and the two strategy discussion docs to `C:\PandaDashboard`.
- Restarted `PandaDashboard-KPL-Server`; active listener verified on port `8765`.

Notes for next agent:
- PR #10 is now merged and deployed. Do not redeploy it again unless there are new changes.
- Next trading-session check: inspect `/api/strategy-mainlines?day=<today>` after market opens and confirm `keepWarm.lastResult` eventually becomes `ok`.

## 2026-07-10 - Claude - P1-C 预测记录扩展(第一阶段第一项,已批准)

Changed:
- `writeMainlinePredict` 增记 `schemaVersion: 2` 与 `candidates` 数组:全量展示候选(上限12条),每条含 族键/主题/归并主题/名次/总分/预判分/阶段/确定性/首日标志/低置信占位(null,通道未上线)/资金净流入/板块数/涨停・大涨・冲板计数/龙头1-3(打分+依据+今日状态+涨停次数口径+10・30日涨幅)/明星(级别)/潜力股(依据)/当日贡献股票码。
- 新增辅助函数 `strategyPredictCandidateRecord`,纯取值映射。
- 严格遵守已会签约束4:`top`/`confirmedKey` 结构与取值不变,`getStrategyMainlineReview` 胜率统计零改动;不改主线定义、不改龙头打分;收盘后不覆盖既有预判的行为保持。

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过。
- 新增 P1-C 功能测试 17 项全部通过(top 字段与旧版逐一比对一致、candidates 全量与上限、空值处理、收盘不覆盖、空主线不写)。
- 既有回归(round4 / leader-v2 / cache-inv)通过。

Deployment:
- GitHub only(分支 claude/p1c-predict-records)。未部署云端,无服务重启。

Notes for next agent:
- 等 Codex/Owner 审查合并后部署(仅 kpl-stats-server.js,需重启主服务);部署次日起 strategy-data/mainline-predict-*.json 开始带 candidates 样本。
- candidates.lowConfidence 恒为 null 属预期(低置信通道待 P1-A 索引与第二阶段规则)。
- 下一项 P1-A 细分证据索引库,待本项合并后开工。

## 2026-07-10 - Codex - 合并并部署 PR #12 P1-C 预测记录扩展

Changed:
- Reviewed Claude PR #12 (`claude/p1c-predict-records`) and merged it into `main`.
- Deployed `kpl-stats-server.js` and `docs/DAILY_HANDOFF.md` to cloud `C:\PandaDashboard`.
- Restarted the cloud KPL server through the existing scheduled task `Panda Dashboard Server`.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Local `node --check kpl-stats-server.js` passed before merge.
- PR diff check passed; P1-C only adds `schemaVersion: 2` and `candidates` to prediction records.
- Confirmed no changes to `top`, `confirmedKey`, `getStrategyMainlineReview`, mainline definition, or leader scoring.
- Cloud `node --check C:\PandaDashboard\kpl-stats-server.js` passed.
- Cloud file SHA-256 matched local for `kpl-stats-server.js` and `docs/DAILY_HANDOFF.md`.
- Cloud `/health` returned `{"ok":true}`.
- Cloud `/api/strategy-mainlines` returned `ok:true`, `day:2026-07-10`, `cacheState:live-file`, `staleness:fresh`, `count:7`.

Deployment:
- Production touched: yes.
- GitHub main pushed through merge commit `215f800` before deployment.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\pr12-p1c-20260710-105230`.
- Cloud process is running on port `8765` with PID `15316`.
- Existing scheduled task used for restart: `Panda Dashboard Server`.

Notes for next agent:
- PR #12 / P1-C is merged and deployed; do not redeploy it unless there are new changes.
- Starting with the next successful intraday prediction write, `strategy-data\mainline-predict-*.json` should include `schemaVersion: 2` and `candidates`.
- Next approved phase item is P1-A 细分证据索引库.

## 2026-07-10 - Claude - P1-A 细分证据索引库(第一阶段第二项,已批准)

Changed:
- 新增细分证据索引:盘后任务 `buildDetailEvidenceIndex` 读取近 30 交易日四源 tab 行(boardTopic/detailReason)与综合库,拆词后**保留原始细分词**为证据词(不压大类,broadTopic 仅作大类附注),聚合为 `{证据词, broadTopic, kinds(board/detail), 来源集合, 真实源数, 首末出现日, 按日股票集合}`,写 `strategy-data/detail-evidence-index-<day>.json`(证据词上限 2000)。(注:本条初版曾写"复用 canonicalTopicName 归一",经 PR#13 评审修正为现行逻辑,见后续两条评审修复记录。)
- 别名自动候选:同股同日不同真实源的细分词两两成对计数(count>=2 入候选区,上限 200);人工词典 `strategy-data/detail-evidence-alias.json`(运行时文件,不入 Git)confirm 对生效合并、veto 对排除候选。
- 自动调度:`runAutoDetailEvidenceIndexIfDue`(交易日 16 点后一次)挂入现有分钟级调度与启动补跑两处。
- 只读端点 `GET /api/detail-evidence-index?day=&word=&limit=`:摘要模式不带按日股票集合,word 查询带;当日无索引回退最近一份并显式标注 indexDay(不冒充当日);`rebuild=1` 需管理员。
- 会签约束1对照:索引只读四源/综合库,纯衍生数据,零反写;不硬编码任何具体主题词,大主题/细分一视同仁为证据词。

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过。
- 新增 P1-A 功能测试 20 项全过(拆词/归一、聚合字段、别名候选与词典 confirm/veto、端点摘要/查询/回退/管理员拦截)。
- 回归:P1-C 17 项、round4、leader-v2、cache-inv 全过。

Deployment:
- GitHub only(分支 claude/p1a-detail-evidence-index)。未部署云端,无服务重启。

Notes for next agent:
- 部署后首个交易日 16 点起自动生成索引;也可管理员 `rebuild=1` 手动构建历史日。
- 30 日窗口构建走四源合并链,属盘后批处理,耗时可接受;若首次构建慢属预期。
- 索引质量抽查按讨论文档 Validation Plan:三方各抽 5 个证据词交叉核对。下一项 P1-B 待本项合并后开工。

## 2026-07-10 - Claude - PR#13 评审修复:证据词保粒度 + 自动任务成功才标记 + 测试入库

Changed:
- 评审点1(粒度):证据词不再经 canonicalTopicName 归一(细分词会塌缩进大类,破坏多粒度判断);word 保留原始细分词,大类归属另存 broadTopic 附注字段(与 word 相同时留空)。端点查询词同样不做大类归一,broadTopic 仅作补充命中。
- 评审点2(调度):runAutoDetailEvidenceIndexIfDue 改为构建成功且 wordCount>0 后才标记当天完成;失败/空索引当天可重试,重试间隔 10 分钟(避免每分钟重跑 30 日重建)。
- 评审点3(测试):测试正式入库 `tests/detail-evidence-index.test.js`(29 项,含新增的粒度保留、broadTopic、自动任务标记与重试间隔断言)与 `tests/predict-records.test.js`(P1-C 17 项);运行命令 `node tests/<file>`。
- 测试顺带抓出并修复一个真 bug:veto 键用默认码位排序而候选配对键用 zh localeCompare,顺序不一致导致 veto 匹配失效;两处统一为 localeCompare。

Files:
- `kpl-stats-server.js`
- `tests/detail-evidence-index.test.js`
- `tests/predict-records.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;tests/detail-evidence-index.test.js 29 项、tests/predict-records.test.js 17 项全过;round4/leader-v2 回归通过。

Deployment:
- GitHub only(PR #13)。未部署云端,无服务重启。

Notes for next agent:
- 索引 words[].word 现为原始细分词;family/大类聚合请用 broadTopic 或后续 alias/family 配置,不要假设 word 已归一。

## 2026-07-10 - Claude - PR#13 二审两点小修:候选只跨源配对 + handoff 表述订正

Changed:
- 别名自动候选改为只在"不同真实来源给同一股票的不同细分词"之间产生:perStockWords 记录每词的来源集合,两词来源并集 <2 个源则不配对——同一来源用 + 拆出的并列原因不再误入候选(并列词仍各自入索引词条)。
- 订正本文件 P1-A 初版记录中"复用 canonicalTopicName 归一"的过时表述为现行逻辑(保留原始细分词,broadTopic 仅作附注),并加注修正来源。

Files:
- `kpl-stats-server.js`
- `tests/detail-evidence-index.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;tests/detail-evidence-index.test.js 31 项全过(新增"同源并列词不进候选"与"并列词仍入词条"断言);tests/predict-records.test.js 17 项通过。

Deployment:
- GitHub only(PR #13)。未部署云端,无服务重启。

Notes for next agent:
- 别名候选语义自此为"跨源同义假设";同源并列原因如需分析,直接看词条本身的 stocksByDay。

## 2026-07-10 - Codex - Merge and deploy PR#13 P1-A detail evidence index

Changed:
- Merged Claude PR #13 into `main` as merge commit `592693f` (`Merge PR #13: P1-A detail evidence index`) and pushed `main` to GitHub.
- Deployed the P1-A backend update to the cloud server.
- Manually rebuilt the detail evidence index for latest available trading day `2026-07-09`.
- Verified the new index preserves fine-grained words such as `存储芯片`, `先进封装`, `长鑫存储`, and `人形机器人`; those remain independent `word` entries while broad family information appears only as `broadTopic`.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`
- `tests/detail-evidence-index.test.js`
- `tests/predict-records.test.js`

Validation:
- Local after-merge checks passed: `node --check kpl-stats-server.js`, `node tests/detail-evidence-index.test.js`, `node tests/predict-records.test.js`.
- Cloud checks passed before restart with the same three commands.
- Cloud health passed after restart: `https://market.dreamerqi.com/health` returned `{"ok":true}`.
- Manual index rebuild returned `ok:true`, `indexDay:2026-07-09`, `windowDays:30`, `wordCount:2000`.
- Public index queries confirmed fine-grained matches:
  - `存储芯片` -> `word:存储芯片`, `broadTopic:半导体`, `sourceCount:3`, `stockCount:47`.
  - `先进封装` -> `word:先进封装`, `broadTopic:半导体`, `sourceCount:3`, `stockCount:26`.
  - `长鑫存储` -> `word:长鑫存储`, `sourceCount:2`, `stockCount:1`.
  - `人形机器人` -> `word:人形机器人`, `broadTopic:机器人`, `sourceCount:3`, `stockCount:225`.

Deployment:
- Production touched: yes.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\pr13-p1a-20260710-123817`.
- Restart method: stopped old Node listener on port `8765` and restarted via scheduled task `Panda Dashboard Server`.
- Old PID: `15316`; new PID: `9752`.
- Cloud operation log updated on the server.

Notes for next agent:
- PR #13 / P1-A is merged and deployed; do not redeploy it unless there are new changes.
- The first deployed index file is for `2026-07-09`; the automatic 16:00 China-time task should generate the next trading-day index after sources are available.
- Next approved phase item is P1-B 扫描补选通道.

## 2026-07-10 - Claude - P1-B 扫描补选通道(第一阶段第三项,已批准)

Changed:
- `strategyMainlineEnrichBoardsWithRisingStocks` 增加补选通道:主通道(涨停数>涨幅>净流入 top-5)不变;从已获取的实时榜(liveRankCount=80,不新增外部拉取)按 净流入>涨幅 补选"涨停少但实时强"的板块,与主通道去重,零强度(净流入与涨幅均<=0)不补。
- 会签约束2:可配置可关闭——`STRATEGY_MAINLINE_SUPPLEMENT_BOARDS`(env 可覆写,默认 3,配 0 即关);每个补选板块记录进入原因 `supplementBasis`(净流入/涨幅/涨停数/榜单位置),板块带 `scanChannel` 标记;观测状态 `scanSupplement` 随主线榜响应输出,`picked` 即"若无补选会漏的板块"清单。
- 会签约束3:只有 `realtimeSource='live'` 参与补选,快照源零补选,不把历史快照伪装成盘中证据。
- 调用点传入 `boardPayload.source`;成员股拉取沿用原 mapLimit 并发与 1.5s 超时,补选仅增加最多 3 个板块的拉取量。

Files:
- `kpl-stats-server.js`
- `tests/scan-supplement.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;`node tests/scan-supplement.test.js` 11 项全过(主通道排序不变、补选取数与依据记录、snapshot 零补选、配0关闭、零强度不补、去重);detail-evidence-index 31 项、predict-records 17 项回归通过。

Deployment:
- GitHub only(分支 claude/p1b-scan-supplement)。未部署云端,无服务重启。

Notes for next agent:
- 部署后可通过响应里 `scanSupplement.picked` 观察每日补选;连续多日 picked 无一进入主线候选则说明补选键不对,按 Validation Plan 调整或配 0 回退。
- 剩余 P1-D 口径元数据待本项合并后开工。

## 2026-07-10 - Claude - PR#14 评审修复:补选真正看宽池 + scanSupplement 跨日不污染

Changed:
- 评审点1(候选池):`buildStrategyMainlinesLive` 的 boardPool 从固定 5 放宽为 `LIVE_BOARD_POOL + SUPPLEMENT_BOARDS`,补选通道由此真正看到主通道之外的实时候选(此前 getDayBoardsWithMembers 先裁到 5,补选在同一批里空转)。主通道语义严格不变:enrich 增加 `primaryPool` 参数,主通道候选锁定在原始榜序前 5 个(等价于放宽前的裁剪行为);enrich 后将 boards 裁剪为仅 scanChannel 选中板块,放宽带来的未选中板块不进 seeds,不改变原有主线候选语义。
- 评审点2(跨日污染):`scanSupplement` 仅当全局状态的 day 与响应 day/requestedDay 一致时输出,否则为 null;历史日、快照、跨日缓存响应不再显示错日期的补选状态。
- 测试从 11 项扩到 21 项:新增 主通道锁定原前 N(高涨停宽池板块不得挤进主通道)、宽池经补选进入、接线静态断言(boardPool 放宽/裁剪/primaryPool 传参)、attachResponseMeta 同日输出/历史日 null/requestedDay 匹配/无状态 null。

Files:
- `kpl-stats-server.js`
- `tests/scan-supplement.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;scan-supplement 21 项、detail-evidence-index 31 项、predict-records 17 项全过。

Deployment:
- GitHub only(PR #14)。未部署云端,无服务重启。

Notes for next agent:
- 放宽后 live 分支会多 hydrate 最多 3 个板块(与补选数同源),成本有界;补选配 0 时 boardPool 回到 5,与放宽前完全一致。

## 2026-07-10 - Codex - Merge and deploy PR#14 P1-B scan supplement channel

Changed:
- Merged Claude PR #14 into `main` as merge commit `c94d9b5` (`Merge PR #14: P1-B scan supplement channel`) and pushed `main` to GitHub.
- Deployed the P1-B backend update to the cloud server.
- Resolved a `docs/DAILY_HANDOFF.md` merge conflict by preserving both the PR #13 deployment record and Claude's PR #14 handoff records.

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`
- `tests/scan-supplement.test.js`
- `tests/detail-evidence-index.test.js`
- `tests/predict-records.test.js`

Validation:
- Local after-merge checks passed: `node --check kpl-stats-server.js`, `node tests/scan-supplement.test.js`, `node tests/detail-evidence-index.test.js`, `node tests/predict-records.test.js`.
- Cloud checks passed before restart with the same four commands.
- Cloud health passed after restart: `https://market.dreamerqi.com/health` returned `{"ok":true}`.
- Strategy historical request checked: `GET /api/strategy-mainlines?day=2026-07-09` returned `ok:true`, `cacheState:snapshot`, `staleness:snapshot`, `count:8`, and `scanSupplement:null`, confirming cross-day supplement state does not pollute snapshot responses.

Deployment:
- Production touched: yes.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\pr14-p1b-20260710-135412`.
- Restart method: stopped old Node listener on port `8765` and restarted via scheduled task `Panda Dashboard Server`.
- Old PID: `9752`; new PID: `15292`.
- Cloud operation log updated on the server.

Notes for next agent:
- PR #14 / P1-B is merged and deployed; do not redeploy it unless there are new changes.
- During the next live trading session, inspect `scanSupplement.picked` on same-day live strategy responses to see which strong-but-few-limit-up boards were added by the supplement channel.
- Next approved phase item is P1-D 口径元数据.

## 2026-07-10 - Claude - P1-D 口径元数据(第一阶段第四项,已批准)

Changed:
- 后端:`strategyMainlineAttachResponseMeta` 新增静态 `metricProfile` 口径声明(leaderGain=收盘价库口径/leaderZt=涨停底库/realtimeBoard=盘中实时或快照/cardKlineGain=K线口径含盘中),每族含字段清单与说明;所有主线榜响应携带,AI 与前端按此区分同名指标口径。
- 前端 `kpl-dashboard_17_apple.html` 四处口径标注:龙头候选列表标题与主线卡龙头行 tooltip 标注"10/30日涨幅为收盘口径(不含今日盘中)";QI 徽章 tooltip 标注"涨幅为K线口径(含快照日盘中)";热门题材搜索结果标注"涨幅为K线口径(含当日盘中)"。
- 会签约束5对照:盘中K线/收盘/快照三种口径在元数据与展示层均可区分;未改任何现有字段名(避免破坏前端),同名不同义靠 metricProfile+标注消除。
- 顺带修 scan-supplement 测试桩缺新常量定义的问题。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/metric-profile.test.js`
- `tests/scan-supplement.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;metric-profile 11 项(含前端四处标注静态断言与内联脚本编译检查)、scan-supplement 21 项、detail-evidence-index 31 项、predict-records 17 项全过。

Deployment:
- GitHub only(分支 claude/p1d-metric-metadata)。未部署云端,无服务重启。

Notes for next agent:
- 前端为静态文件变更,部署可不重启服务;后端 metricProfile 需随 kpl-stats-server.js 部署重启生效。
- 至此第一阶段 P1-C/P1-A/P1-B/P1-D 四项全部完成;第二阶段语义规则待 P1-A 索引与 P1-C 记录积累约 10 个交易日后回讨论分支定规则并二次批准。

## 2026-07-10 - Codex - Merge and deploy PR#15 P1-D metric metadata

Changed:
- Merged Claude PR #15 into `main` as merge commit `35f786c` (`Merge PR #15: P1-D metric metadata`) and pushed `main` to GitHub.
- Deployed the P1-D backend and strategy page update to the cloud server.
- Fixed one trailing blank-line formatting issue in `docs/DAILY_HANDOFF.md` during merge; no functional changes beyond Claude's PR.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`
- `tests/metric-profile.test.js`
- `tests/scan-supplement.test.js`
- `tests/detail-evidence-index.test.js`
- `tests/predict-records.test.js`

Validation:
- Local after-merge checks passed: `node --check kpl-stats-server.js`, `node tests/metric-profile.test.js`, `node tests/scan-supplement.test.js`, `node tests/detail-evidence-index.test.js`, `node tests/predict-records.test.js`.
- Cloud checks passed before restart with the same five commands.
- Cloud health passed after restart: `https://market.dreamerqi.com/health` returned `{"ok":true}`.
- Strategy API check: `GET /api/strategy-mainlines?day=2026-07-09` returned `metricProfile` with `leaderGain.basis=close`, `realtimeBoard.basis=intraday-live`, `cardKlineGain.basis=intraday-kline`.
- Strategy page check: `https://market.dreamerqi.com/kpl` contains the new caliber labels for close-basis leader gains and K-line-basis QI/hot-search gains.

Deployment:
- Production touched: yes.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\pr15-p1d-20260710-140753`.
- Restart method: stopped old Node listener on port `8765` and restarted via scheduled task `Panda Dashboard Server`.
- Old PID: `15292`; new PID: `13452`.
- Cloud operation log updated on the server.

Notes for next agent:
- PR #15 / P1-D is merged and deployed. First phase P1-C/P1-A/P1-B/P1-D is now complete.
- Next work is observation, not immediate second-phase rule changes: collect roughly 10 trading days of prediction candidates and detail evidence index data, then return to the discussion branch for owner-approved second-phase semantics.

## 2026-07-10 - Claude - 主线净流入门槛(Owner 规则,当日直接下达)

Changed:
- 新增 `strategyMainlineApplyInflowGate`:主线当天资金必须净流入——netInflow 有数据且 <=0 的板块不再进入当日主线榜(Owner 规则,案例:2026-07-10 人形机器人净流出103亿仍列第7)。
- 两条保护:netInflow=null(数据缺失)不视为流出、不误杀(守则:缺数据不得造假);Owner 已确认主线不被自动规则移除(人工确认优先)。
- 排除项可观测:响应新增 `inflowGate: { rule: 'net-inflow-required', excluded: [...] }`(含主题/净流出值/涨停数),被排除主线不悄悄消失。
- 门槛在 augment 之后、排序与 top-10 截断之前执行;`readMainlineConfirm` 提前读取以支持确认保护(原逻辑复用,不重复读)。

Files:
- `kpl-stats-server.js`
- `tests/inflow-gate.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;inflow-gate 9 项全过(净流出/零流入排除、null 不误杀、确认保护、观测字段、接线顺序静态断言、空输入);scan-supplement/detail-evidence-index/predict-records/metric-profile 四套回归全过。

Deployment:
- GitHub only(分支 claude/mainline-inflow-gate)。未部署云端,无服务重启。

Notes for next agent:
- 这是 Owner 当日直接下达的主线定义规则,非第二阶段讨论产物;已在讨论文档留痕。零流入(=0)按"必须净流入"排除;若实盘发现某数据源用 0 表示缺失,再改为 null 语义。
- 部署后当日效果可从响应 inflowGate.excluded 观察。

## 2026-07-10 - Claude - 明星股三层判定第二/三层实施(Owner 定稿规则)

Changed:
- 新增 `strategyMainlineMaxObservableBucket`:最大可统计档 = 五档中 ≤(股价×单笔申报上限)的最高档(主板100万股/创业板30万股/科创板10万股,按代码前缀);行内无股价时按"有成交记录的最高档"数据回推;极低价保底50w档。
- 第三层(必含该股最大可统计档):判定档位集合 = 固定三档 ∪ 该股最大档——10元股的1000w档从此参与每档先决条件,任一档不达标整体不过。
- 第二层(最大档特征):新增明星等级 `expected`(预期明星)——涨停前涨幅≥5%、每档先决通过、最大档三比值(主/被/合力)2/3 > 1.8、且最大档主动买入累计 ≥3亿;封板"明星确认"的 2/3≥2 判定改取最大档比值(该档无数据退回最小档,兼容旧行为)。
- 明星结果新增 `maxBucket` 观测字段(档位/主动买累计/三比值);展示排序 确认>预期>活跃;`starActive` 信号含预期级;龙头打分权重不变(预期按非确认档8分)。

Files:
- `kpl-stats-server.js`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;star-l2-layers 18 项全过(Owner 三个价格案例逐一断言、第三层档位纳入、预期明星四种边界、封板取最大档、3元股按自己最大档判定);scan-supplement/detail-evidence-index/predict-records/metric-profile 回归全过(inflow-gate 测试属 PR #16 分支,本分支无此文件,非回归)。

Deployment:
- GitHub only(分支 claude/star-l2-max-bucket)。未部署云端,无服务重启。

Notes for next agent:
- 交易所单笔申报上限按代码前缀近似(30→创业板30万股,68→科创板10万股,其余主板100万股),北交所等特殊板未细分,评审时请 Codex 把关。
- L2 结果行若无 price 字段则走数据回推,建议后续让 worker 在结果行带上现价,映射更准。
- 讨论文档议题 B(+5%→涨停窗口的分段统计)与 C/D/E/F 仍开放;本次只实施 Owner 已定稿的第二/三层。

## 2026-07-10 - Claude - 明星最大档规则收严(Owner 澄清):字段在但无大单=条件不成立

Changed:
- 按 Owner 澄清修正 PR#17:最大可统计档**字段存在但无买单/为零**(bucketRatios 为 null)= 明星条件不成立——封板判为"涨停但最大档无大单"(sealedWeak),涨停前连"资金活跃"也不给;**绝不回退小档判定**。
- 仅当最大档**字段缺失**(worker 未采集)才算数据不完整:退回旧行为(封板用最小档比值)并打 `maxBucket.dataMissing` 标,供修 worker 后复核;字段在数据空则打 `maxBucket.empty` 标。
- star-l2-layers 测试 18→24 项,新增空档不回退(封板/涨停前)与字段缺失打标四组断言。

Files:
- `kpl-stats-server.js`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;star-l2-layers 24 项、scan-supplement/detail-evidence-index/predict-records/metric-profile 回归全过。

Deployment:
- GitHub only(PR #17)。未部署云端,无服务重启。

Notes for next agent:
- 语义要点:empty(字段在数据零)=大资金缺席,判死;dataMissing(字段不在)=采集缺陷,保守放行并打标——两者必须区分,不可混为"无数据"。
- 建议后续核查 worker 是否在所有任务都写全五档字段,消灭 dataMissing 场景。

## 2026-07-10 - Claude - 明星最大档证据:管理员专属展示(Owner 需求)

Changed:
- 策略页明星股 tooltip 增加管理员专属证据段(`starMaxBucketAdminInfo`):最大档档位(300w/500w/800w/1000w 按股价自适应)、最大档主动买累计(亿)、三比值、empty 状态("最大档字段在但无大单:非明星")、dataMissing 状态("最大档字段缺失:需检查worker采集")。
- 仅 `state.adminLoggedIn` 为真时拼接;普通用户返回空串,雷达条与主线卡两处明星 tooltip 均覆盖。后端明星判定逻辑零改动(维持按股价自适应最大档,不限定 800w/1000w)。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- star-l2-layers 28 项全过(新增管理员函数存在与空串守卫、两处拼接、状态文案、内联脚本编译四组断言);metric-profile 回归通过。

Deployment:
- GitHub only(PR #17)。未部署云端,无服务重启。

Notes for next agent:
- tooltip 为 title 属性纯文本;若后续想做更醒目的管理员浮层,另开需求,勿混入本 PR。

## 2026-07-10 - Codex - Merge and deploy mainline inflow gate + star max-bucket rules

Changed:
- Merged `origin/claude/mainline-inflow-gate` into `main`.
- Merged `origin/claude/star-l2-max-bucket` into `main`, resolving `docs/DAILY_HANDOFF.md` by keeping all handoff entries.
- Deployed the merged backend/frontend files to the cloud server. Cloud does not currently have Git installed, so deployment used backup + direct file upload instead of `git pull`.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/inflow-gate.test.js`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- Local merged `main`: `node --check kpl-stats-server.js`; `tests/inflow-gate.test.js`; `tests/star-l2-layers.test.js`; `tests/scan-supplement.test.js`; `tests/detail-evidence-index.test.js`; `tests/predict-records.test.js`; `tests/metric-profile.test.js` all passed.
- Cloud after upload: `node --check kpl-stats-server.js`; `tests/inflow-gate.test.js`; `tests/star-l2-layers.test.js`; `tests/metric-profile.test.js` all passed.
- Public health passed: `https://market.dreamerqi.com/health` returned `{"ok":true}`.
- Public KPL page loaded and contains `starMaxBucketAdminInfo`, confirming the admin-only max-bucket tooltip code is deployed.
- `GET https://market.dreamerqi.com/api/strategy-mainlines?day=2026-07-10` returned the existing frozen after-close snapshot from before this deploy, so `inflowGate` is not visible on that snapshot; next live build/snapshot should carry the new field.

Deployment:
- Production touched: yes.
- GitHub `main` pushed at merge commit `342454f`.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\mainline-star-inflow-20260710-184512`.
- Restart method: stopped old Node listener on port `8765` and restarted via scheduled task `Panda Dashboard Server`.
- Old PID: `13452`; new PID: `14144`.
- Cloud operation logs updated on the server.

Notes for next agent:
- Cloud server currently has no `git` command in PATH and no Git install detected at common paths; deploys from this machine used direct upload. Re-check before assuming `git pull` works on production.
- Existing 2026-07-10 strategy snapshot was frozen before this deploy; do not treat absence of `inflowGate` in that snapshot as a failed deployment.
- Admin-only max-bucket evidence is exposed only in strategy page star-stock tooltip when `state.adminLoggedIn` is true.

## 2026-07-10 - Codex - Fix review data-health source stats from source tabs

Changed:
- Fixed the review source-health chain so `sourceStats` is rebuilt from every enabled source tab that actually has rows, instead of being limited to stale `payload.sourceStats` groups.
- Fixed Jiuyangongshe source row labels from mojibake / Tonghuashun to `韭研`.

Files:
- `kpl-stats-server.js`
- `tests/review-source-health.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- Local: `node --check kpl-stats-server.js` passed.
- Local: `node tests/review-source-health.test.js` passed.
- Cloud after deploy: `node --check .\kpl-stats-server.js` passed and `/health` returned `{"ok":true}`.
- Cloud `GET /api/limit-up-main-reason-db/source-view?day=2026-07-10` now reports sourceStats for Jiuyangongshe, Kaipanla, and Xuangubao; TGB remains zero because the 2026-07-10 TGB structured source is absent.
- Cloud `GET /api/after-close-status?day=2026-07-10&mainReasonMode=same-day` now reports the same three reviewAutoSources, matching the review page tabs.

Deployment:
- Production touched: yes.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\review-health-source-stats-20260710-185650`.
- Uploaded `kpl-stats-server.js` directly to `C:\PandaDashboard`.
- Restart method: stopped Node listener on port `8765` and restarted scheduled task `Panda Dashboard Server`.
- New PID: `12784`.
- Cloud operation logs updated on the server.

Notes for next agent:
- This fixes a recurring mismatch where the review page showed a source tab with data, but the data-health panel still marked it missing because `sourceStats` did not include tabs merged after the original evidence payload.
- For 2026-07-10, the remaining missing source is TGB only; adding the TGB structured file should automatically flow into sourceStats after this fix.

## 2026-07-10 - Codex - L2 star replay pre-check found missing persisted raw jobs

Changed:
- Added a discussion/validation note for the requested 2026-07-10 L2 new-star-rule replay.
- Documented that a full replay cannot be performed from current cloud state because `local-l2-task-queue` stores `job.results` in memory only, and the service restart cleared `totalJobs` to 0.
- Preserved the old snapshot's 2026-07-10 star summary for reference and listed the five requested questions as currently unanswerable without raw threshold rows.

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更;事实卡中的常量(STAR_BUCKETS/PRE_RATIO/SEAL_RATIO/AUTO_SCAN_*/DEFAULT_THRESHOLDS)均经 grep 核验。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- Codex 请先读"Owner 口述知识"与"现状事实卡"再写 Independent View——口述知识多处与现行实现冲突,这正是要讨论的内容,不要先入为主以现行代码为准。
- 议题 A 有一个需要核实的外部事实:主板/创业板单笔申报上限的确切规则,请写观点时一并核。

## 2026-07-10 - Claude - 明星股讨论文档修正:Owner 澄清三层叠加规则

Changed:
- `2026-07-10-star-leader-prediction.md` 按 Owner 二次口述修正:最大可统计档不是替代口径,而是特征加强项——规则为三层叠加:①每档比值先决条件(现行方向正确)+ ②最大可统计档特征(三比值接近2:涨停前2/3>1.8、封板2/3>2;且最大档主动买累计>3亿)+ ③高档位必需(800w必含,有1000w则纳入)。澄清原话已留痕。
- 事实卡第2/3/4条与议题A随之修正:现行每档≥1.5属第一层、方向一致;缺失的是第二层特征项、第三比值参与涨停前判定、+5%窗口、1000w档纳入。

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- Codex 写独立观点前请以修正后版本为准:三层叠加,不是"只看最大档"。

## 2026-07-10 - Claude - 明星股讨论文档二次修正:档位映射锚定 + 第三层列为 Owner 已定项

Changed:
- 补入 Owner 三次口述案例:3 元股最大可统计档仅 300w;映射公式锚定为"最大可统计档 = 五档中 ≤(股价×单笔申报上限)的最高档"(主板100万股/创业板30万股,实施前核实确切规则)。
- 第三层(800w 必含、有 1000w 则纳入)按 Owner"要修"表态列为已定项,移出开放讨论;议题 A 新增待 Owner 确认点:低价股最大档不足 800w 时(如 3 元股仅到 300w),第三层是否按"必含该股最大可统计档"理解。

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- 低价股与第三层的适用关系是当前唯一挂起的规则空白,Codex 写观点时可给方案但结论等 Owner 确认。

## 2026-07-10 - Claude - 明星股三层规则定稿:第三层=必含该股最大可统计档

Changed:
- Owner 确认第三层为"必含该股自己的最大可统计档"(3元股即300w档,10元股即1000w档;800w/1000w 只是对够得着的股的举例)。议题 A 的低价股疑问随之关闭,三层规则至此完整定稿,仅剩实现细节(股价取点/最大档无数据处理/L2 结果字段是否齐)留在议题内。

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- 知识底座已齐,Codex 与 Claude 可开始写 Independent View(独立写,勿互看)。

## 2026-07-10 - Claude - 明星/龙头预判讨论:填写 Claude 独立观点(议题 B-F)

Changed:
- `2026-07-10-star-leader-prediction.md` 填写 Claude Independent View:B 窗口先用累计近似、以回放数据决定是否做分段(supportRatio 已核实即第三比值);C 预期明星与潜力股并列不替换、交集加标、3亿暂不分档;D 明星做强信号不做硬门槛(观测不完备,三态处理,数据挣出来再升级);E 扫描三改(补选联动/MIN_ZT 对补选放宽/个股插队),吞吐先实测;F 挂载统一主线卡、明星默认显 2 折叠 4、潜力维持分析驱动。
- 通盘原则:证据不完备时降权不判死、参数调整必须有回测。

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- 等 Codex 独立观点(勿先看本观点)与 L2 回放结果(Owner 已转交回放请求);两者齐后进质疑环节。

- Read-only cloud check: `/api/strategy/focus-l2-scan` as L2 admin returned `totalJobs: 0`, `pending: 0`, `workerOnline: false`.
- Searched cloud `strategy-data` and logs for raw L2 fields (`thresholds`, `activeBuy`, `passiveBuy`, `activeSell`, `passiveSell`) and found no persisted 2026-07-10 job rows.
- Parsed `strategy-data/mainline-live-cache-2026-07-10.json` and `strategy-data/strategy-mainline-snapshot-2026-07-10.json` with Node; both only contain old star summaries, not raw five-bucket data.

Deployment:
- GitHub only.
- Production code not changed.
- No deployment and no service restart.

Notes for next agent:
- Before Monday live validation, consider asking Owner to approve a small persistence fix: save local L2 worker `job.results` per day/job under `strategy-data`, and require worker rows to include all five `thresholds` buckets plus `price`/`lastPrice`.
- Without raw persisted rows, PR #17 thresholds (`1.8` and `3e8`) cannot be calibrated from 2026-07-10 after a restart.

## 2026-07-10 - Codex - Persist local L2 worker task results

Changed:
- Added disk persistence for the cloud-side local L2 task queue so worker-submitted `job.results` survive server restarts.
- Every job now writes `latest.json`; every worker result update also writes a timestamped sample under `samples/`.
- The queue restores persisted jobs on service start for readback/replay, but does not re-enqueue stale queued/running work after a restart.
- Added automatic cleanup for persisted local L2 job folders older than 30 days.
- Wired production persistence to `strategy-data/local-l2-jobs`.

Files:
- `local-l2-task-queue.js`
- `kpl-stats-server.js`
- `tests/local-l2-persistence.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- Local: `node --check local-l2-task-queue.js` passed.
- Local: `node --check kpl-stats-server.js` passed.
- Local: `node tests/local-l2-persistence.test.js` passed.
- Local: `node tests/star-l2-layers.test.js` passed.
- Local: `node tests/scan-supplement.test.js` passed.
- Cloud after upload: `node --check .\local-l2-task-queue.js`; `node --check .\kpl-stats-server.js`; `node .\tests\local-l2-persistence.test.js`; `node .\tests\star-l2-layers.test.js`; `node .\tests\scan-supplement.test.js` all passed.
- Cloud admin status for `/api/strategy/focus-l2-scan` now reports `persistence.enabled: true`, `persistence.days: 30`, `totalJobs: 0`, `pending: 0`.
- `/health` returned 200 after restart.

Deployment:
- Production touched: yes.
- GitHub `main` pushed at commit `92e1bfe`.
- Cloud backup created: `C:\PandaDashboard\_deploy-backups\l2-job-persistence-20260710-195046`.
- Uploaded `kpl-stats-server.js`, `local-l2-task-queue.js`, and `tests/local-l2-persistence.test.js` directly to `C:\PandaDashboard`.
- Restart method: stopped old Node listener on port `8765` and restarted scheduled task `Panda Dashboard Server`.
- New PID: `14396`, start time `2026-07-10 19:56:51`.
- Cloud operation logs updated on the server.

Notes for next agent:
- This does not change the company-side L2 worker. It preserves whatever the worker submits. If rows lack `price` or 500w/300w/500w/800w/1000w threshold buckets, the persisted files will make that visible for diagnosis.
- Existing 2026-07-10 raw L2 jobs were already lost before this change; replay calibration can start from the next worker-submitted jobs.

## 2026-07-10 - Claude - 明星/龙头讨论:质疑环节完成(Claude 侧)

Changed:
- 讨论文档新增 Claude Challenges to Codex View(5 条:分层混叠观测状态与证据强度、"确认主线"命名与 Owner 手动确认冲突建议改"L2 验证"、调度优先级第一版用字典序不造合成分、job 指标补 worker 版本号、L2 持久化纳入每日 16:33 验收)与 Claude Responses to Codex Challenges(7 条全接受,第 7 条 empty/dataMissing 区分 PR#17 已实现)。
- 收敛判断:零真分歧,建议双方 Revised View 合并为 Shared Decision 草案交 Owner(证据四层+主线三态+worker 升级包+字典序调度+job 指标验收)。
- 同轮完成:讨论文档 main/讨论分支两版合一(Codex 回放尝试记录并入 Validation Plan,附持久化已实施的后续进展注);handoff 双侧条目保留。

Files:
- `docs/strategy/discussions/2026-07-10-star-leader-prediction.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- 纯文档变更。

Deployment:
- GitHub only(讨论分支)。未部署云端,无服务重启。

Notes for next agent:
- 等 Codex 的 Revised View/对我质疑的回应;随后合写 Shared Decision 交 Owner 批准,再排实现顺序(建议第一件:worker 升级包字段清单定稿)。
