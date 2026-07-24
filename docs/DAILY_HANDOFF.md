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

## 2026-07-10 - Claude - 实施 Shared Decision 第②项:QI 主线三态 + 预期明星行(第①项 Owner 指示暂缓)

Changed:
- 后端:`strategyMainlineCollectStars` 返回 `{byCode, scannedPlates}`;augment 推导独立字段 `l2VerificationStatus`(unscanned=待验证不惩罚 / qi=已扫且有预期明星或明星确认 / scanned-no-star=已扫无明星);已扫无明星时确定性封顶"中等"(定性降级,不造打分常量,只封顶不叠罚);P1-C 预测记录携带该状态。
- 前端:主线卡新增三态徽章(QI 主线/L2 未见明星/L2 待验证),与 Owner 手动"当日主线"徽章并列独立;明星行只展示 明星确认/预期明星 至多 3 只(资金活跃不再占卡位);"潜力"行退役(Owner 定稿,focusStocks 后端数据保留供第③项调度用)。
- 第①项 worker 升级包 Owner 指示暂缓:worker 现仅产出 50w/500w 两档,多数股最大档将走 dataMissing 保守路径,预期明星/QI 态实盘触发受限,主线多显示"L2 待验证"——属诚实状态,待①实施后自然激活(依赖关系已告知 Owner)。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;qi-mainline-states 16 项全过(certainty 封顶四例、后端接线六项、前端四项、内联编译);全部七套既有回归通过。

Deployment:
- GitHub only(分支 claude/qi-mainline-states)。未部署云端,无服务重启。

Notes for next agent:
- 第③项(字典序调度+priorityCodes)待本项合并后开工;第①项恢复时 worker 需产五档+price,QI 态即可实际触发。

## 2026-07-10 - Claude - PR#18 评审修复:判负门槛(完成+覆盖)+ 潜力股彻底退役

Changed:
- 评审点1:新增 `strategyMainlineDeriveL2Status` 独立推导函数——发现预期明星/明星确认立即 QI;只有扫描完成(job.status=done)且主线相关股确实被结果覆盖(小主线全覆盖,大主线至少3只)才判 scanned-no-star;queued/running/分批未完/覆盖不足一律 unscanned 不降权。collectStars 增返 completedPlates/coveredCodes。
- 评审点2:explain"潜力股X只待冲板"改为"预期明星X只,首选…(盘中涨幅、最大档主动买)",无预期明星不补位;抢跑雷达 focusStocks 改为 预期明星/明星确认,无则不显示个股;阶段建议"盯潜力股能否首板"→"盯预期明星能否首板";卡片 focus 芯片死代码删除。focusStocks 仅存后台(调度输入)。
- 测试扩至 29 项:新增行为测试七例(运行中不判负/完成+覆盖才判负/无关覆盖不判负/覆盖不足不判负/预期明星立即QI/小主线全覆盖规则)与文案断言五例(前端用户可见零"潜力"字样)。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;qi-mainline-states 29 项、全部七套回归通过。

Deployment:
- GitHub only(PR #18)。未部署云端,无服务重启。

## 2026-07-10 - Codex - Merge and deploy PR #18 QI mainline states

Changed:
- Reviewed Claude's QI mainline three-state implementation and two follow-up fixes.
- Merged `claude/qi-mainline-states` into `main` as `835d26c`.
- Deployed the independent `l2VerificationStatus` states, expected-star display, conservative completed-scan negative gate, and removal of user-visible potential-stock copy.

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Merged `main`: `node --check` and all nine repository test suites passed.
- Cloud staging and production paths: QI states, star layers, scan supplement, prediction records, metric profile, and L2 persistence tests passed.
- Production file SHA-256 values match Git `main`.
- Internal `/health` and `/kpl`, plus public `https://market.dreamerqi.com/` and `/kpl`, returned 200; public page contains the QI mainline markup and TLS verification passed.

Deployment:
- Production touched: yes.
- Backup: `C:\PandaDashboard\_deploy-backups\qi-mainline-pr18-20260710-234714`.
- Restarted scheduled task `Panda Dashboard Server`; PID `13612` -> `7196`, start time `2026-07-10 23:53:03`.
- An initial post-restart task-state query failed and triggered the automatic rollback; the previous version remained healthy. The corrected deployment then completed successfully.
- Cloud operation logs updated; no secrets were recorded.

Notes for next agent:
- This deployment does not modify the company-side L2 worker. The cloud queue supports five thresholds, but the current worker still needs its separate five-bucket/price/version upgrade before all QI expected-star paths have complete data.

## 2026-07-10 - Claude - PR#18 二审修复:判负只认 done 覆盖 + pending 门

Changed:
- `collectStars` 增返 `pendingPlates`(排队/运行中的相关板块)与 `completedCoveredCodes`(仅 done 任务结果覆盖的股票);无结果的 queued/running 任务也计入 pending。
- `strategyMainlineDeriveL2Status` 两道新门:相关板块存在 pending 任务 → 一律 unscanned(结论未定);判负覆盖只统计 `completedCoveredCodes`,running 分批回传的覆盖不给判负凑数。
- 测试 29→33 项:新增二审组合场景四例(一done一running 不判负、done覆盖够但仍有running 不判负、无pending且done覆盖达标可判负、done覆盖不足running残留不计)。

Files:
- `kpl-stats-server.js`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;qi-mainline-states 33 项、全部回归通过。

Deployment:
- GitHub only(PR #18)。未部署云端,无服务重启。

## 2026-07-10 - Claude - 实施 Shared Decision 第③项:扫描字典序优先队列 + priorityCodes

Changed:
- 板块级字典序(不做加权公式):补选来源 > 净流入 > 大涨数(memberRows 内涨幅≥5% 计数);补选板块豁免"涨停≥2"门槛(仍需净流入达标)。
- 个股猎场优先列表 `strategyMainlineScanPriorityCodes`:板内涨幅 5%~涨停前(Owner 定义猎场),字典序 距板距离 > 当日涨幅 > 历史主因命中,上限 20 只,随任务下发。
- 队列 `start()` 接受 priorityCodes:优先股排到任务最前(组内保持涨幅序),分批回传时猎场股最先出结果;job 记录 priorityCodes。
- job 指标(SD 第5条):claim/update 盖 workerVersion;firstResultAt;metrics{resultRows, rowsWithPrice, rowsWithAllBuckets}——吞吐扩容(5min/2板)依据这些指标实测后另议。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `tests/scan-priority.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 两文件通过;scan-priority 15 项全过(猎场过滤与三键排序、板块豁免与字典序静态断言、队列真实实例行为:优先排序/版本盖章/指标);其余八套回归全过。

Deployment:
- GitHub only(分支 claude/scan-priority-queue)。未部署云端,无服务重启。

Notes for next agent:
- rowsWithPrice/rowsWithAllBuckets 在第①项(worker 升级包)实施前会偏低,属预期——这两个指标正好用于量化①的必要性。
- 第④项(每日验收扩项)为定时器提示词更新,不动代码,待本项合并后由 Claude 直接调整 Routine。

## 2026-07-10 - Claude - PR #19 评审四点修复(Codex 复审前)

Changed:
- 修正1(截断吃掉优先股):队列 `start()` 改为先按涨幅排全量、再按优先组/普通组分组、最后才做 limitStocks 截断——原排第4的优先股在 limitStocks=2 时也能入选;`job.priorityCodes` 只保留最终任务中真实存在的代码(无效代码剔除)。
- 修正2(第三键无真实数据):`strategyMainlineScanPriorityCodes(board, priorByCode)` 改为吃 `buildStrategyMainlinePriorReasonContext` 的 byCode Map(code→count),不再依赖 memberRows 行上不存在的 priorReason 字段;`strategyMainlineMaybeAutoScan` 增 priorByCode 参数,调用点传 `priorReason?.byCode`。
- 修正3(workerJob 缺字段):`workerJob()` 显式返回 `priorityCodes`(旧 worker 忽略该字段亦兼容)。
- 修正4(空对象档误计):`rowsWithAllBuckets` 要求五档中每档 activeBuy/activeSell/passiveBuy/passiveSell 四项均为有限数值(0 合法,空对象/缺档不算)。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `tests/scan-priority.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 两文件通过;scan-priority 重写为 18 项全过(真实链路测主因上下文喂第三键、limitStocks=2 截断保优先股、claim 下发 priorityCodes、全零档合法/空对象档不算);qi-mainline-states、star-l2-layers、scan-supplement、detail-evidence-index、predict-records、metric-profile、inflow-gate 七套回归全过。
- 已同步最新 main(835d26c..73019b4),DAILY_HANDOFF 双方记录均保留。

Deployment:
- GitHub only(PR #19 分支)。未部署云端,无服务重启。

Notes for next agent:
- 待 Codex 复审 PR #19;合并后 Claude 执行第④项(两个每日 Routine 提示词扩项,不动代码)。

## 2026-07-10 - Claude - PR #19 二审两点修复

Changed:
- 二审修正1(第三键题材未对齐板块):`strategyMainlineScanPriorityCodes` 的历史主因命中改为只累计与当前 `board.name` 同题材的次数——复用 `strategyMainlineBoardThemeRelated` 对 `prior.topics`(top-3 题材统计)逐项过滤求和,无同题材命中计0。历史"算力"10次不再给"消费"板块的个股加权。
- 二审修正2(rowsWithPrice 口径不齐):队列指标价格覆盖改为 `Number(r?.price ?? r?.close ?? r?.lastPrice) > 0`,与策略取价口径(kpl-stats-server 明星判定同链)完全一致;只回传 lastPrice 的有效行不再误计为缺价格。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `tests/scan-priority.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 两文件通过;scan-priority 18→20 项全过(新增:无关题材10次不得压过相关题材1次、多题材只累计同题材次数、题材过滤复用 strategyMainlineBoardThemeRelated 静态断言、lastPrice-only 行计入 rowsWithPrice);题材匹配在测试中走真实 strategyMainlineBoardThemeRelated(仅 stub topicKey/分类学依赖);七套回归全过。
- main 已是最新(73019b4),无需再合。

Deployment:
- GitHub only(PR #19 分支)。未部署云端,无服务重启。

Notes for next agent:
- prior.topics 为 top-3 题材统计;个股历史题材超过3个且相关题材恰在第4位之后时会漏计(按0处理,偏保守方向)。如实测出现此场景再议放宽。
- 待 Codex 最终复审;合并后 Claude 执行第④项(Routine 提示词扩项)。

## 2026-07-10 - Codex - 复审、合并并部署 PR #19 L2 扫描优先队列

Changed:
- 最终复审 Claude PR #19:确认补选板块、净流入和大涨数的板块字典序，以及距涨停、涨幅、同题材历史主因次数的个股字典序接线正确。
- 确认优先股票会在任务截断前进入队列，`priorityCodes` 可下发给 worker，五档完整率和价格覆盖指标按统一口径统计。
- 合并到 `main`，merge commit `6a26d54`，并将云端两份运行文件及新增测试更新到该版本。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `tests/scan-priority.test.js`
- `docs/DAILY_HANDOFF.md`

Validation:
- 合并后的 `main` 通过两份 `node --check` 和 10 组回归测试；云端暂存与生产路径再次通过扫描优先级、L2 持久化、补选通道、明星三层和 QI 主线状态测试。
- 云端三份部署文件 SHA-256 与 `main` 一致；内网 `/health`、`/kpl` 均为 200；公网 `https://market.dreamerqi.com/kpl` 与主页均为 200，TLS 校验正常。

Deployment:
- 已部署云端并重启计划任务 `Panda Dashboard Server`；PID `7196 -> 5200`。
- 回退备份：`C:\PandaDashboard\_deploy-backups\scan-priority-pr19-20260711-004208`。
- 公司电脑上的 L2 worker 未修改；其 50w/300w/500w/800w/1000w 五档、现价和版本字段升级仍是独立后续任务。

Notes for next agent:
- PR #19 只改善云端扫描选择、队列优先级和观测指标，不会凭空补出公司 worker 尚未回传的五档数据。
- 下一个交易日应观察 `priorityCodes`、`firstResultAt`、`rowsWithPrice`、`rowsWithAllBuckets` 的实际值，再判断扫描吞吐是否需要调整。

## 2026-07-10 - Claude - 第④项:每日验收 Routine 提示词扩项(无代码变更)

Changed:
- 删旧建新两个每日定时验收(周一至周五,自动触发到 Claude 会话):
  - 主线观察-14:59北京(新 ID trig_012D2BHTN4rqRBQmtwneFPA3):原有补选转化/keepWarm/新鲜度/质量检查之外,新增 inflowGate.excluded 名单核对(疑似误伤单独指出)、QI 三态分布与预期明星名单记录(供次日复盘)、maxBucket empty/dataMissing 比率趋势、扫描优先队列观察(priorityCodes 下发、firstResultAt、rowsWithPrice/rowsWithAllBuckets,接口未暴露则标"数据不可得")。
  - 索引验收-16:33北京(新 ID trig_01W3aUYs9gU7KP6Y6PCSe7k3):原有细分证据索引验收之外,新增 预期明星次日命中率复盘(对照前日14:59名单,维护滚动统计——"真主线必有1-2明星"规则的核心验证数据)、inflowGate 排除板块收盘复盘(反例详细记录)、L2 持久化验收(当日任务落盘 rows>0,非交易日/worker 未启标不适用)、maxBucket 当日汇总。
- Shared Decision v1 四步计划状态:①公司端 L2 worker 五档升级,等待公司 Codex 实施,属于下一优先级 ②QI 三态(PR #18 已合并部署)③扫描优先队列(PR #19 已合并部署)④本项完成。

Files:
- `docs/DAILY_HANDOFF.md`(仅此文件,Routine 为服务端配置,不在仓库内)

Validation:
- 两个新 Routine 创建成功,下次触发 2026-07-13(周一)14:59 / 16:33 北京时间。

Deployment:
- 无代码、无部署、无服务重启。PR #19 已由 Codex 合并进 main 并部署云端(3f4006c)。

Notes for next agent:
- 预期明星命中率从 7-13(周一)起开始积累;L2 回放/回测也从 7-13 的持久化数据起可用。
- 第①项(公司端 L2 worker 五档升级)等待公司 Codex 实施,属于下一优先级;rowsWithPrice/rowsWithAllBuckets 实测数据可作为其实施前后的对照验收指标。

## 2026-07-10 - Claude - 静态缓存 + 认证安全加固(整站优化第1、4项)

Changed:
- 静态缓存(第1项):`sendStatic` 从一律 no-cache 改为分层缓存 + ETag(size+mtime),If-None-Match 命中回 304 不读文件体。回头客加载量预计降 90%+(仅字体就 1.3MB 不再重复下载)。(缓存分层规则见下方二审修正条目,以二审后为准。)
- 认证限流(第4项):新增纯内存滑动窗限流器(单机部署,重启清零;只记失败,成功清零)。接入六个入口:用户/管理登录(单 IP+账号 8 次/10分钟 + 单 IP 30 次/10分钟;刻意不做纯账号级锁定,避免第三者用错误密码恶意锁死他人账号)、注册/重置验证码邮件(单 IP 5 封/小时 + 单邮箱 3 封/小时,防轰炸)、注册/重置验证码确认(IP+邮箱 10 次/15分钟,封 6 位数字码穷举——原先可无限尝试)。超限回 429,登录事件记 rate-limited。
- yule 管理接口漏洞修复(第4项核查发现,线上可复现):`/api/yule/admin/*`(列隐藏项/改/删)与 `/api/yule/collect`(POST 触发采集)经 stanning 域代理完全无鉴权,任何人可增删改娱乐内容。修复:主服务代理层强制 admin 会话(`requireAdmin`)。admin cookie 域为 .dreamerqi.com,owner 在市场页登录后 stanning 管理页照常可用。
- 管理接口权限审计:主服务 14 个 admin handler 全部确认有服务端门控(requireAdmin/isAdminRequest),无需改动。
- 密扫复核:docs/SECRET_SCAN_REVIEW_REQUIRED.txt 的命中全部为字段名(与 CLAUDE.md 预期一致);全仓库长字符串赋值扫描仅一处命中且为测试夹具,无真实密钥。

Files:
- `kpl-stats-server.js`
- `tests/static-cache-auth-hardening.test.js`(新增,22 项)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;新测试 22 项全过(缓存分层、ETag/304 不读文件体、限流触发/清零/窗口过期、六入口接线、yule 门控);其余十套回归全过。
- 线上漏洞在部署前仍存在:`stanning.dreamerqi.com/api/yule/admin/items` 当前无凭据返回 200,建议尽快合并部署。

Deployment:
- GitHub only(分支 claude/static-cache-hardening)。未部署云端,无服务重启。**本 PR 合并后需要 Codex 部署并重启主服务才能封住 yule 漏洞。**

Notes for next agent:
- 限流为纯内存,多实例部署时需改共享存储(当前单机,不适用)。
- yule-server 自身仍无鉴权,依赖主服务代理层门控;若未来 8766 端口直接对外,需在 yule-server 内补鉴权。
- 前端登录页 429 时会显示英文 error 文案,与现有 401 文案风格一致,未做本地化。

## 2026-07-11 - Claude - PR #21 二审四点修复(Codex 复审前)

Changed:
- 限流 Map 硬上限(二审1):AUTH_RATE_MAX_KEYS=5000,写满先清过期键、仍满按插入序淘汰最老键(宁可放过一次,不允许内存无界);新增 authRatePrune 每 10 分钟定期清扫(setInterval.unref);注册/重置验证码确认新增 confirm-ip 单 IP 总闸(30 次/15分钟,两入口共用),封"换邮箱制造无限 key"。
- 静态缓存改版本化(二审2):强缓存(一年 immutable)只给带 ?v= 参数的请求;无版本参数的字体/react 退回 no-cache + ETag 协商。引用方全部版本化:dreamerqi-fonts.css 内 13 个字体 URL、Qi/index.html 的 react/react-dom/字体CSS、两个 kpl 页/logo/掼蛋/yule 的字体CSS 均加 ?v=1(改文件时 bump 版本号即换 URL,天然无脏缓存)。
- 登录限制表述修正(二审3):实际维度是"单 IP+账号 8 次/10分钟",非"单账号";两处代码注释注明刻意不做纯账号级锁定(否则任何人可用错误密码恶意锁死管理员账号),handoff 原条目已同步修正。
- 真实行为测试(二审4):yule 门控抽成具名函数 yuleProxyNeedsAdmin 并接线;测试走真实 readAdminToken→adminSessionFromToken→isAdminRequest→requireAdmin 链(仅 stub 会话存储与磁盘 IO):未登录 403、管理员 cookie/头放行、普通用户 403、伪造 token 403;限流 Map 12000 个不同 key 压测有界(峰值=上限 5000);换邮箱穷举第 31 次被 IP 总闸拦截。

Files:
- `kpl-stats-server.js`
- `Qi/vendor/dreamerqi-fonts.css`、`Qi/index.html`、`Qi/logo.html`、`Qi/games/掼蛋.html`、`kpl-dashboard_17_apple.html`、`kpl-dashboard_17_apple_hierarchy.html`、`yule.html`(仅引用 URL 加 ?v=1)
- `tests/static-cache-auth-hardening.test.js`(22→40 项)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;hardening 40 项全过;其余十套回归全过(含前端内联脚本编译检查)。

Deployment:
- GitHub only(PR #21 分支)。未部署云端。合并部署重启后 yule 漏洞才封住(线上仍可复现,建议尽快)。

Notes for next agent:
- 字体/react 文件若替换内容,必须同步 bump 引用处 ?v= 版本号,否则老访客最长一年不更新;不 bump 就别改文件内容。
- 限流仍为单机内存版;多实例部署需换共享存储。

## 2026-07-11 - Claude - PR #21 三审两阻塞项修复(Codex 终审前)

Changed:
- requestIp 信任边界(阻塞1):X-Forwarded-For 仅当 socket.remoteAddress 为回环(127.0.0.1/::1/::ffff:127.0.0.1,即 Caddy 本机转发)时才读取,取链尾(Caddy 追加的真实客户端,链首是客户端可自报的任意值)并经 net.isIP 校验;公网直连 8765 的请求一律用 socket IP。修复前公网直连可伪造 XFF 绕过全部限流。
- staticCacheControl 收紧(阻塞2):HTML/JSX/manifest 无论是否带 ?v= 一律 no-cache(/kpl?v=1、/?v=1、/admin?v=1 不再可能被强缓存);一年 immutable 只给带版本参数的 JS/CSS/字体/图片。
- HEAD 优化(建议项):sendStatic 对 HEAD 请求不再读取文件正文(仅 stat 出 ETag)。

Files:
- `kpl-stats-server.js`
- `tests/static-cache-auth-hardening.test.js`(40→53 项)
- `docs/DAILY_HANDOFF.md`

Validation:
- 新增测试:公网直连伪造 XFF 不生效/本机转发生效/伪造链首取链尾/net.isIP 拒非法值/IPv6 与 IPv4-mapped 各形态 8 项;HTML/JSX/manifest 带 ?v= 仍 no-cache 及 /kpl?v=1 行为验证 5 项;HEAD 不读正文。hardening 53 项全过,其余十套回归全过,`node --check` 通过。

Deployment:
- GitHub only(PR #21 分支)。待 Codex 终审合并部署(yule 漏洞线上仍可复现,建议尽快)。

Notes for next agent:
- 若未来在非回环地址部署反代,需把代理地址加进 TRUSTED_PROXY_IPS。

## 2026-07-11 - Codex - 终审、合并并部署 PR #21 静态缓存与认证加固

Changed:
- 终审 Claude PR #21 三轮实现，确认娱乐管理/采集代理权限门、登录与验证码限流、限流 Map 上限、可信代理 IP 边界、版本化静态缓存和 ETag/304 行为正确。
- 合并 `claude/static-cache-hardening` 到 `main`，merge commit `78e186e`。
- 将主服务、主页/行情/娱乐静态引用和安全回归测试部署到云服务器；未修改数据库、L2 worker 或娱乐服务程序。

Files:
- `kpl-stats-server.js`
- `Qi/index.html`
- `Qi/logo.html`
- `Qi/games/掼蛋.html`
- `Qi/vendor/dreamerqi-fonts.css`
- `kpl-dashboard_17_apple.html`
- `kpl-dashboard_17_apple_hierarchy.html`
- `yule.html`
- `tests/static-cache-auth-hardening.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地 `node --check`、53 项 hardening 测试及仓库其余 10 组回归全部通过。
- 云端暂存包 SHA-256 校验一致，Windows 暂存/生产 hardening 测试通过。
- 公网主页、行情、后台、娱乐页和娱乐公开列表均返回 200；未登录娱乐管理列表与手动采集 POST 均返回 403。
- `/kpl?v=1` 保持 `Cache-Control: no-cache`；版本化 React 返回一年 immutable；携带匹配 ETag 的行情页面请求返回 304。
- 公网 `https://market.dreamerqi.com/health` 返回 200。

Deployment:
- Production touched: yes。
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr21-static-auth-20260711-110758`。
- 第一次替换因 Windows 解包损坏中文文件名而在完整性检查阶段自动回退，服务恢复正常；改用 ASCII 暂存名单独传输后重新部署成功，无半部署状态。
- 重启计划任务 `Panda Dashboard Server`；最终 PID `3360 -> 14620`。
- 云端两份运维日志已更新。

Notes for next agent:
- 字体、React 或其他带 `?v=` 的强缓存资源内容变化时必须同步提升引用版本号；HTML/JSX/manifest 始终保持 no-cache。
- 当前只信任回环地址上的 Caddy 转发头；若以后反代不再通过回环连接，需要显式更新 `TRUSTED_PROXY_IPS` 并补测试。

## 2026-07-11 - Codex - 手工补录 2026-07-10 TGB 湖南人复盘

Changed:
- 按固定 SOP 强制抓取 `2026-07-10` 淘股吧湖南人文章和 20 张原始图片，只采用官方白底 `@TGB湖南人` 表格 `image-01-06.png`。
- 排除顶部重复的“市场连板股”摘要、后部“涨停炸板”区域、同花顺红色可视化图和其他作者/回帖图片。
- 按源图原版题材块和个股细分原因手工录入 88 行正式 `review/tgb-hunan-structured`，随后重建综合主因库。
- 修正 TGB 手工 SOP 命令参数为 `--day=... --days=1`；CLI 只识别等号形式，避免空格形式回退到默认近 10 日范围。

Files:
- `docs/ops/TGB_HUNAN_DAILY_SOP.md`
- `docs/DAILY_HANDOFF.md`
- Runtime only on cloud: `C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-10.json`

Validated:
- 官方文章：`https://www.tgb.cn/a/2tjSxizcIDW`，标题 `7.10湖南人涨停复盘+晚间消息汇总`。
- 正式源文件：88 行、88 个唯一代码、missing 0、extra 0、duplicates 0、weak 0；SHA-256 `24b4a7d9b948753331a8458853ad0e14abc8b949bacee93e84047fe677783443`。
- 题材块：商业航天 27、医药 11、业绩 10、半导体 9、机器人 8、算力 6、AI应用 3、玻璃基板封装 3、智能电网 3、猪肉 3、其他个股 5，合计 88。
- 公网 source-view：综合归纳/复盘啦/选股宝/韭研/淘股吧均为 88；四个正式来源均 100% 覆盖，TGB 低置信 0。
- after-close-status：主因库 88、四源各 88、sourceErrors 为空。

Deployment:
- Production data touched: yes；未部署应用代码，未重启服务。
- 备份目录：`C:\PandaDashboard\backups\tgb-hunan-manual-20260710-20260711-112531`。
- 自动 Qwen 路径因阿里云 `Arrearage` 被质量闸拒绝，未写入正式库；正式文件来自人工逐行核对。
- 首次重建命令使用空格参数，CLI 回退默认近 10 日并安全重建 9 个已有交易日；各日均沿用现行 v12 来源数据且成功。SOP 已改为等号参数，后续只重建目标日。
- 云端两份运维日志已更新。

Notes for next agent:
- 下次 Owner 说“按之前一样手工复盘淘股吧”时，直接读 `docs/ops/TGB_HUNAN_DAILY_SOP.md`，不要重新猜图，也不要用同花顺图或炸板区。
- 当前 Qwen 账户欠费不影响手工 SOP；不得用失败的自动结果覆盖本次人工正式库。

## 2026-07-11 - Claude - 字体 WOFF2 化 + 预览图 WebP + yule-server 缓存对齐(整站优化 A/B 项)

Changed:
- A1 字体:13 个 TTF 全部转出同名 WOFF2(fontTools,元数据逐一校验:字体名/字重与源一致,wOF2 魔数)。总大小 1249KB→423KB(34%)。TTF 保留为后备;`dreamerqi-fonts.css` 每组 src 改为 WOFF2(?v=1)在前、TTF(?v=1)在后,font-family/font-weight/font-display: swap 不变。
- A2 版本提升:CSS 内容变化,六个页面(Qi/index、logo、掼蛋、kpl 两页、yule)对该 CSS 的引用从 ?v=1 升到 ?v=2。
- A4/A5 预览图:仅 `Qi/assets/chatter-cute-preview.png`(100KB)转出 WebP(23KB,quality 85,尺寸一致 1200×720),PNG 保留回退;qi-home.jsx 改 `<picture>`(WebP source + PNG img,均带 ?v=1),经 `node Qi/build-home.js` 重新生成 compiled(未手改);主服务 `staticContentType` 补 image/webp,STATIC_FILES 注册 .webp 路由。favicon/Logo/娱乐运行时图片未动。
- B yule-server:`serveFile` 增加 ETag(size+mtime)、If-None-Match→304、HEAD 不读正文;HTML 一律 no-cache(原 no-store,带 ?v= 也绝不 immutable);一年 immutable 只给带版本号的字体/CSS/JS/图片;未版本化资产维持 1 天。4 个调用点补传 req。`sendJson`(全部 JSON API 含管理接口)保持 no-store 未动;采集/内容/权限/代理逻辑零改动。

Files:
- `Qi/vendor/fonts/*.woff2`(13 个新增)、`Qi/vendor/dreamerqi-fonts.css`
- `Qi/assets/chatter-cute-preview.webp`(新增)、`Qi/qi-home.jsx`、`Qi/qi-home.compiled.js`(构建产物)
- `Qi/index.html`、`Qi/logo.html`、`Qi/games/掼蛋.html`、`kpl-dashboard_17_apple.html`、`kpl-dashboard_17_apple_hierarchy.html`、`yule.html`(仅 ?v=2)
- `kpl-stats-server.js`(webp MIME+路由)、`yule-server.js`(serveFile)
- `tests/font-woff2-yule-cache.test.js`(新增,42 项)

Validation:
- 新测试 42 项全过;其余十一套回归全过;`node --check` 三个 JS 通过。
- 浏览器实测(Chromium+playwright-core,本地静态服):首页真实加载走 WOFF2(4 请求全 200 font/woff2、0 TTF)、13 个字重逐一 document.fonts.load 成功、WebP 被 `<picture>` 选用(200 image/webp,1200×720,PNG 零请求)。
- 上一轮部署验收结果一并归档:yule 管理接口未登录 403、/kpl 304 协商 0B、登录限流 20 连测第 17 次起 429、三主页 200。

Deployment:
- GitHub only(分支 claude/font-woff2-yule-cache)。未部署云端。合并后部署需分别重启并验证主服务与 Panda Yule Server 两个进程。

Notes for next agent:
- 字体如再更新内容:字体文件 URL bump ?v=,同时 CSS 引用版本必须继续上调(本次 v1→v2 即此原因)。
- WOFF2 转换脚本一次性使用未入库;需要重转时用 fontTools(flavor='woff2')并校验 name/OS_2 元数据。

## 2026-07-11 - Claude - 7-08 算力AI 龙头数据修复方案(方案2,待 Codex 审)

Changed:
- 背景:7-08 快照采集不完整,紫光股份(000938)缺席 cardData zt10/gain10/gain30,龙头评分池无它;v2(PR #9)已核定 紫光 90 第一/长源东谷 79 第二,但历史日重算补不出缺失源数据。Owner 决定方案2:修数据本身,统计按真实龙头计(非策略错误,是采集设计疏漏;尚未到对外公信力阶段)。
- 新增修复脚本 `tools/patch-20260708-suanli-leaders.js`:锚点(603950 所在统计表)定位算力板块,三表补入紫光(双源核验值),不动 ztList(不伪造涨停);默认 dry-run,--apply 先备份再原子替换,幂等。已在合成快照上测试(预览/写入/幂等/不污染无关板块)。
- 新增方案文档 `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(执行步骤/验证/回滚/统计口径)。

Files:
- `tools/patch-20260708-suanli-leaders.js`(新增)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(新增)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;合成快照全流程测试通过。未动服务端代码,现有测试不受影响。

Deployment:
- GitHub only。合并后由 Codex 在云端 dry-run → --apply → API 验证(无需重启服务);结果记云端操作日志。

Notes for next agent:
- 若补数后紫光仍未上榜,说明历史日龙头池另有入口未吃 cardData,Claude 跟进代码侧。
- 预判回看版块(Owner 已同意方向)设计中,修正档机制因走方案2暂不需要,回看统计将自然吃修复后数据。

## 2026-07-11 - Claude - 7-08 修复方案更正:最终龙头为星网锐捷+紫光(Owner 纠正)

Changed:
- Owner 纠正修复目标:最终统计龙头是 2 只,第二只不是长源东谷。回查完整记录确认:"紫光90/长源79"是 Claude 手工残缺池的中间结论(漏了星网锐捷),已被推翻;v2 全量池终稿=星网锐捷 86 第一、紫光股份 73 第二。
- 7-08 存档补充诊断:星网锐捷当日真实涨停(主因=算力)却只挂在网络安全主线,算力板块 ztList/统计表均无它且 kline 统计为 0——双主线股涨停归因只记单边,是第二类疏漏(题材族边界议题的实证)。
- 脚本升级为双股修复:星网锐捷补三表+ztList(当日真实涨停,todayCodes 事实还原);紫光补三表不进 ztList(未涨停不伪造);不删星网在网络安全的既有归属。合成快照双股全流程测试通过(幂等/无关板块零污染)。
- 方案文档同步更正(含修正目标溯源,防止中间结论再次被当终稿)。

Files:
- `tools/patch-20260708-suanli-leaders.js`(双股版)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;合成快照:双股写入、ztList 规则(星网进/紫光不进)、幂等重跑、白酒板块零污染全部通过。

Deployment:
- GitHub only(PR #23)。合并后 Codex 云端 dry-run → --apply → 验证(算力AI 龙头=星网第一/紫光第二),无需重启。

Notes for next agent:
- 教训:引用历史结论前先确认它是否被后续讨论推翻——本次"紫光90/长源79"被当成终稿引用了两次。
- 若修复后排名仍不符,可能是主线归属映射把 002396 的 7-08 涨停留在网络安全,需代码侧跟进。

## 2026-07-11 - Codex - 复审、合并并部署字体/WebP/yule 缓存优化

Changed:
- 逐项复审 Claude 分支 `claude/font-woff2-yule-cache`，未发现需要退回的代码问题；以 merge commit `560e97d` 合入并推送 `main`。
- 将同一版本部署到 `C:\PandaDashboard`，主服务与 Panda Yule Server 均已重启。

Files:
- Git 代码文件沿用上一条 Claude 记录；本条只更新 `docs/DAILY_HANDOFF.md` 的审查与部署状态。
- 云端运行目录已部署上一条列出的 27 个文件；未触碰业务数据库、账号库、密钥、Cookie 或运行时配置。

Validated:
- 独立执行 `node --check` 三个 JS 和仓库 12 套测试，全部通过；`node Qi/build-home.js` 后构建产物无差异。
- 本地 Chromium 实测 13/13 字重成功加载 WOFF2；瞎聊聊卡片实际选择 WebP、尺寸保持正常，PNG 回退仍存在。
- 云端回归测试 42 项全过；公网主页、行情、后台、娱乐、探索均为 200。
- 公网 CSS/WOFF2/WebP 的 MIME 与一年 immutable 正确；娱乐 HTML ETag 协商返回 304，JSON 保持 no-store，未登录娱乐管理接口保持 403。
- 云端 `kpl-stats-server.js` 与 `yule-server.js` SHA-256 和 `main` 完全一致。

Deployment:
- Production touched: yes；主服务新 PID 13164，娱乐服务新 PID 14676。
- 最终回退备份：`C:\PandaDashboard\backups\deploy-font-woff2-yule-cache-20260711-120619`。
- 前两次部署包装器分别因 Windows PowerShell 中文文件名编码和只读 `$HOME` 变量名冲突而触发自动回退；两次均确认旧服务恢复 200，未留下半部署状态。第三次部署完整成功。
- 云端两份运维日志均已更新。

Notes for next agent:
- 生产现已运行 `560e97d` 对应代码；后续 agent 从最新 `main` 开始。
- 以后 Windows PowerShell 5.1 部署脚本不要依赖无 BOM 的中文字符串，也不要使用 `$home` 这类与内置只读变量大小写冲突的变量名。

## 2026-07-11 - Codex - 拒绝 7-08 算力龙头数据补丁并完成真实链路核验

Changed:
- 复审 Claude 分支 `claude/data-repair-0708-ziguang`；本次只记录审查结论，未合并该分支、未执行补丁。
- 通过 SSH 只读下载云端 2026-07-08 三套快照，并交叉核对策略 API、涨停底库和综合主因库。

Files:
- `docs/DAILY_HANDOFF.md`
- Reviewed only: `tools/patch-20260708-suanli-leaders.js`、`docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`

Validated:
- 阻断 1：补丁读取 `strategy-data/snapshots/<zsType>/...`，真实三源快照位于 `kpl-snapshots/<zsType>/...`；当前脚本会全部跳过。
- 阻断 2：真实 zs5/zs6/zs7 快照的 cardData 中均没有锚点长源东谷 `603950`；即使只改目录，锚点筛选仍然零命中。
- 阻断 3：紫光股份已存在于云计算等 cardData 三张统计表；星网锐捷也已有 5 次总涨停和 K 线统计。脚本所谓“完全缺失”与云端事实不符。
- 阻断 4：脚本硬编码星网锐捷 gain10/gain30 为 54.87/22.97，而云端统一口径为 54.05/25.32；`ztCount=5` 也混淆了“总涨停次数 totalCount”和“该板块主因次数 ztCount”。
- 真实异常是语义链路：综合主因库已把星网锐捷 7-08 主因归为“算力”，策略 API 却仍把它放在网络安全 todayCodes；紫光数据存在但未进入前三龙头。应诊断主线归属/龙头池逻辑，而不是向快照盲补硬编码行。

Deployment:
- GitHub documentation only。生产代码和数据均未改动，服务未重启。

Notes for next agent:
- Claude 应先同步最新 `main`，废弃当前补丁假设，使用真实路径/真实字段做只读诊断与回归测试。
- 修复应从“为何综合主因=算力却只进入网络安全 todayCodes”及“紫光为何未进入龙头前三”入手；未经真实 API 回放验证，不得提交历史快照写入脚本。

## 2026-07-11 - Claude - 7-08 方案 v3:废弃快照盲补,改为只读诊断 + 机制复现(Codex 五点核验全采纳)

Changed:
- 废弃 v2 盲补脚本(路径臆测 kpl-snapshots 写成 strategy-data/snapshots、锚点零命中、紫光并非缺失、星网指标硬编码错值)。教训:没有云端真实数据时不做数据写入方案。
- 代码侧核实三事实:①归属链路(todayCodes)只走实时板块成分+历史主因,当日综合主因库不参与;②入池与 mainZt10 门槛都依赖族清单(canonical(theme)+mergedThemes);③历史日对外展示走冻结快照,最终修复必含重建 7-08 快照。
- 新增 admin 只读诊断端点 /api/strategy-mainline-leader-debug?day=&codes=:live 即时重算(leaderDebug=族清单+龙头池全量打分明细,空池也暴露族清单;debugTrace=个股板块携带/当日主因/历史主因/落入主线四方对照)+ frozenSummary 冻结快照摘要对照。严格只读:不写预测、不派扫描、不动快照。
- ReworkLeaders 增 options.debug 采集(正常调用零变化,行为回归有断言)。
- 新增 tests/leader-pool-debug.test.js(18 项):真实 ReworkLeaders+合成夹具复现归属丢失/族清单缺口两条根因链与修复后自动登顶,无真实行情硬编码。

Files:
- `kpl-stats-server.js`(debug 采集 + 诊断端点 + traceCodes,均只在诊断参数下生效)
- `tests/leader-pool-debug.test.js`(新增)
- `tools/patch-20260708-suanli-leaders.js`(删除)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(重写为诊断先行方案)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;新测试 18 项全过;其余十二套回归全过(共 13 套)。
- 已同步 main 2dddb77(含 Codex 否决记录,双方 handoff 保留)。

Deployment:
- GitHub only(PR #23)。合并部署后 Codex 跑诊断端点取 7-08 真实 JSON,三方确认根因,再由 Claude 出底库自动计算的代码修复 + 重建当日快照。

Notes for next agent:
- 修复原则(Codex 评审定):最终指标必须由涨停底库/主因库/收盘价库自动计算,不得硬编码。
- 预期根因:归属=当日主因库未参与 todayCodes;紫光=族清单未含其主因题材(云计算/光模块→算力AI)。以诊断端点输出为准。

## 2026-07-11 - Codex - 二审拒绝 7-08 龙头诊断端点

Changed:
- 二次复审 Claude 分支 `claude/data-repair-0708-ziguang` 的 v3 只读诊断方案；盲补脚本已正确删除，但诊断准确性和只读边界仍有阻断问题，未合并、未部署。

Files:
- `docs/DAILY_HANDOFF.md`
- Reviewed only: `kpl-stats-server.js`、`tests/leader-pool-debug.test.js`、`docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`

Validated:
- `node --check` 与仓库 13 套测试均通过，但新增测试未复现生产语义。
- 历史诊断仍调用 `getStrategyBoardRealtimeStocks`；该函数忽略传入历史日期并读取当前实时成分股涨幅，因此所谓 7-08 live 回放会混入今天数据。
- 诊断调用仍会覆盖全局 `strategyMainlineSupplementState`，会抹掉当前交易日的补选观测，不符合“严格只读”。
- 诊断仍复用正式请求的 1.2 秒龙头重算超时，超时后可能返回缺失/半成品 leaderDebug；目标股也可能因 pool 只截前 30 而不可见。
- `boardsWithCode` 在板块过滤后才生成，只能看到主通道/补选通道选中的板块，不是该股在原始快照中的全部板块归属。
- 测试把 `canonicalTopicName` stub 成原样返回；生产中 `canonicalTopicName('算力AI')` 实际返回“算力”，所以测试制造的“族清单不含算力”并不存在。
- 测试交易日列表错误包含周六 2026-06-27、遗漏交易日 2026-06-29；并把星网锐捷 7-08 当日一板写成 `lianban=5`，混淆近10日五次涨停与当日连板数，虚增评分。

Deployment:
- GitHub documentation only。生产代码、数据、运行时状态均未修改，服务未重启。

Notes for next agent:
- Claude 需使用生产 `canonicalTopicName` 和正确交易日/当日一板夹具；补充“历史诊断绝不访问当前实时行情、绝不写全局状态、无超时半结果”的行为测试。
- 诊断应保留过滤前的全量板块归属，并保证 `codes=` 指定股票即使排名低于 30 也始终出现在诊断结果中。

## 2026-07-11 - Codex - 为三方 agent 增加统一生产策略证据能力

Changed:
- 新增 Token 保护的 `GET /api/ai/strategy-evidence`：必须按 1-20 只股票筛选，返回三套快照匹配行、近 30 日涨停/综合主因/收盘价、已保存策略归属、题材规范化和指标口径；不开放完整数据库、用户数据、配置、文件路径或写能力。
- 新增 `strategy-evidence.js` 纯函数模块，统一字段白名单、股票代码归一、控制字符清理、稳定 JSON SHA-256、完整性校验和按股票离线审计。
- 新增 `tools/capture-strategy-case.js` 与 `tools/replay-strategy-case.js`。证据默认写入 Git 忽略的 `tmp/strategy-cases/`，Token 只从环境变量读取，不进入参数或文件。
- 新增 `docs/AI_PRODUCTION_READ.md`，并接入 Claude 入门、协作流程、项目地图和策略讨论协议。以后策略归属/龙头评分/明星股/历史修复 PR 必须记录真实证据参数、bundle SHA-256、完整性和使用字段；合成测试不能单独作为生产结论。
- 所有市场来源文本明确标记为不可信数据，禁止 agent 执行其中的命令或凭据请求。

Files:
- `kpl-stats-server.js`
- `strategy-evidence.js`
- `tools/capture-strategy-case.js`
- `tools/replay-strategy-case.js`
- `tests/strategy-evidence-tools.test.js`
- `docs/AI_PRODUCTION_READ.md`
- `CLAUDE.md`
- `docs/COLLABORATION_WORKFLOW.md`
- `docs/strategy/AI_DISCUSSION_GROUP.md`
- `docs/PROJECT_MAP.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过主服务、新模块和两个工具。
- 仓库全部 13 套测试通过；新测试覆盖股票过滤、字段白名单、控制字符、哈希防篡改、10/30 交易间隔涨幅、HTTP Token 门控、抓取和离线回放。
- 本地端到端：无 Token 返回 403；有 Token 返回 `access=ai-read-only-evidence`、明确完整性/缺失来源和 bundle SHA-256。
- 使用云端公开的 2026-07-08 三套真实快照做临时结构验证：星网锐捷 `todayGain=10.02`、紫光股份 `todayGain=6.8` 及其 `zt10/gain10/gain30` 板块证据可被抓取并离线复现；临时数据验证后已删除，未进入 Git。
- 变更文件未发现疑似真实密钥、Cookie、密码或 Token 值。

Deployment:
- GitHub branch only；生产未修改，服务未重启。
- 合并部署时 `kpl-stats-server.js` 与新增 `strategy-evidence.js` 必须原子部署并重启主服务；只部署主文件会因缺少模块而启动失败。

Notes for next agent:
- Claude 应先读 `docs/AI_PRODUCTION_READ.md`，用 `day=2026-07-08`、`codes=002396,000938`、`themes=算力AI`、`window=30` 独立复审本 PR；不要提交抓到的证据 JSON。
- 部署后再用云端运行时 Token 执行一次远端 capture/replay，确认 `complete:true`；Token 通过安全环境注入，不得发到聊天或 PR。

## 2026-07-11 - Codex - 采纳 Claude approved 并加固策略证据边界

Changed:
- 接受 Claude 对 `codex/ai-strategy-evidence@4e2de6f` 的正式 `approved` 结论；其三条非阻断观察作为合并前加固处理，不改变方案主体。
- 抓取工具仅允许 `market.dreamerqi.com` 与本机回环地址，生产入口强制 HTTPS，并在任何跨域重定向前停止，避免转发 AI Token。
- 新证据接口只接受请求头/Bearer Token；既有 `/api/ai/strategy-live` 查询参数兼容行为保持不变。
- 策略快照保留主线级上下文，但 `todayCodes`、`mainLeader`、`leaders` 严格过滤为请求股票。
- `complete` 改为核验完整历史窗口：中间任一必要交易日缺涨停库、主因库或收盘价库都会进入 `missingSources`；响应增加明确 coverage。
- 整包 SHA-256 现在覆盖 `complete`、缺失源和错误等全部元数据；replay 新增 `--expect-sha`，用于与 PR/交接中独立记录的哈希比对。文档明确 SHA-256 是内容校验而非数字签名。

Files:
- `kpl-stats-server.js`
- `strategy-evidence.js`
- `tools/capture-strategy-case.js`
- `tools/replay-strategy-case.js`
- `tests/strategy-evidence-tools.test.js`
- `docs/AI_PRODUCTION_READ.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增行为测试覆盖不可信 base、跨域重定向 Token 阻断、历史窗口中间日缺失、策略个股过滤、完整性元数据篡改和固定预期 SHA。
- `node --check` 通过主服务、证据模块和两个工具；仓库全部 13 套测试通过，`git diff --check` 与差异密钥扫描无异常。

Deployment:
- GitHub only；生产未修改，服务未重启。

Notes for next agent:
- 合并后 Claude 必须从最新 `main` 开始，并在取得安全注入的 Token 后使用默认可信入口抓取证据；不得通过自定义外部 host 中转。
- 云端部署仍需同时部署 `kpl-stats-server.js` 与 `strategy-evidence.js`，备份、重启、远端 capture/replay 和云端日志尚未执行。

## 2026-07-11 - Codex - 部署 AI 策略证据接口并完成云端验收

Changed:
- 将 GitHub `main@e1c7750` 的 `kpl-stats-server.js` 与新增 `strategy-evidence.js` 作为同一部署单元上传云端；随后以 `a92ecf3` 排除纯抓取时间对整包哈希的影响，使相同历史证据重复抓取保持同一 SHA-256。
- 将 `docs/AI_PRODUCTION_READ.md` 的 7 月 8 日初始化验收窗口改为 20 日：云端业务底库只滚动保留最近 30 个交易日，旧目标日再回看完整 30 日时最早边界可能已清理，接口应诚实返回缺失而不是冒充完整。
- 确认当前 SSH 端口为 2222；443 已由 HTTPS/Caddy 使用，旧交接中的 SSH 443 已过时。

Files:
- Cloud runtime: `C:\PandaDashboard\kpl-stats-server.js`
- Cloud runtime: `C:\PandaDashboard\strategy-evidence.js`
- Git documentation: `docs/AI_PRODUCTION_READ.md`
- Git/cloud handoff: `docs/DAILY_HANDOFF.md`

Validated:
- 部署前云端暂存 SHA-256 与 Git 完全一致；两个文件 `node --check` 通过。
- 两次受控重启均成功：端口 8765 监听 PID `13164 -> 8604 -> 352`，本机与公网 `/health` 均返回 200/`ok:true`。
- 无 Token 与 URL 查询参数假 Token 请求证据接口均返回 403；云端内部从受保护运行时配置读取 Token 后，请求返回 `access=ai-read-only-evidence`、三套快照和稳定整包 SHA-256。
- 7 月 8 日、20 日窗口连续两次验收：`complete:true`、`missingSources=[]`、`sourceErrors=[]`，请求股票为 `002396/000938`，三源共命中 13 张板块卡，两次 bundle SHA-256 均为 `b29c43c5b53358dd851adf3b008b73d9faf7c23558588f9100690e23621388f0`。
- 30 日窗口按设计返回 `complete:false`，明确指出 5 月 27/28 日涨停库与主因库已超出当前滚动保留边界；缺失未被当成 0。

Deployment:
- Production touched: yes；主服务已重启，Caddy 与 Panda Yule Server 未重启。
- 回退备份：`C:\PandaDashboard\_deploy-backups\ai-evidence-e1c7750-20260711-051734`。
- 部署后主文件 SHA-256：`BC8FD1DCAF798B18FD54308B193FF78E650237BF9CFCF88D0446767C2601BD3D`；最终模块 SHA-256：`74612E9019D6F8C12C8D9FB8D19DB3084A4F4596DA12EFAF3D704E2AC727176F`。
- Token 值未输出、未写 Git、未进入部署日志或聊天。

Notes for next agent:
- 云端接口能力已就绪；Claude 仍需在其自身安全执行环境注入 `PANDA_AI_READONLY_TOKEN`，同步最新 main 后运行 20 日窗口的 capture/replay 验收。
- 证据 JSON 仍只允许写入 Git 忽略的 `tmp/strategy-cases/`，不得提交仓库。

## 2026-07-11 - Claude - PR #23 三审九点修复(v4,Codex 复审前)

Changed:
- 修正1(历史混入实时数据):getStrategyBoardRealtimeStocks 增 historicalOnly——历史诊断直接返回空,东财/同花顺/KPL 成分接口零调用(它们全是"当前时刻"数据且盘中行情无历史存档,getStrategyBoardStocks 兜底同样是实时接口,不能用);catalog 榜同理禁用;debugMeta.historicalOnly 明示 risingStocks 为空属预期,成分证据以冻结快照 ztList 为准。
- 修正1补堵(自检发现):getDayBoardsWithMembers 的 liveIfMissing 回退在历史诊断下同样是实时数据入口(快照缺失时拉当前板块榜)——诊断历史日改为宁空勿混(liveIfMissing:false),判定在板块加载前完成。
- 修正2(全局状态):enrich 增 recordState:false,诊断不覆盖 strategyMainlineSupplementState;配对照行为测试(正式请求照常记录)。
- 修正3(超时半结果):诊断模式成分抓取 fullWait 完整等待、龙头池重构绕开 1.2s 超时直接 await;debugMeta.fullWait=true;行为测试用 5ms 超时+30ms 慢数据证明"正式路径截成空/诊断路径拿全量"。
- 修正4(过滤前板块):allBoardsForTrace 在 scanChannel 过滤前快照,boardsWithCode 用它,不漏未进主通道的原始板块。
- 修正5(trace 股必现):codes= 指定股排 30 名外强制补入 pool 明细;不在池记 tracedMissing(空池场景含)。
- 修正6-8(测试真实性):改用生产 canonicalTopicName+PRIMARY_TOPIC_CLUSTERS(实测 canonical('算力AI')='算力',云计算/光模块独立→紫光族缺口真实成立);交易日含 06-29 周一、剔除 06-27 周六;星网 7-08 当日 lianban=1(5 是近10日总涨停,在 zt10Count),按一板重测:归属修复后评分 98→128 仍第一。
- 修正9(行为测试):历史模式实时接口零调用、recordState:false 全局状态不动、fullWait 无半结果,均有正反对照断言。

Files:
- `kpl-stats-server.js`(historicalOnly/recordState/fullWait/allBoardsForTrace/tracedMissing/debugMeta)
- `tests/leader-pool-debug.test.js`(18→37 项)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(补三审修正章节)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;leader-pool-debug 37 项全过;十三套全回归通过;已同步 main 6b9d724(保留双方记录)。

Deployment:
- GitHub only(PR #23)。不部署云端;合并部署后 Codex 跑诊断端点取 7-08 真实 JSON,三方确认根因。

Notes for next agent:
- 历史日盘中成分行情无存档是硬约束:诊断回放的板块成分证据只有 ztList;若未来要完整回放,需把盘中成分榜纳入快照存档(另立议题)。

## 2026-07-11 - Claude - PR #23 四审三阻断项修复(v5,Codex 复审前)

Changed:
- 阻断1(快照证据不可丢):historicalOnly 从"返回空"改为快照还原——成分行取自当日冻结快照 cardData.ztList(已记录的当日涨幅保留,未记录不伪造);新增 collectSnapshotCardStatsForCode,debugTrace.snapshotStats 原值带出某股在三套源快照 zt10/gain10/gain30/ztList 的板块携带证据(紫光案的直接证据通道)。
- 阻断2(动能采样全局):strategyMainlineTrackTrend 增 record 参数,AugmentPrediction 贯通 recordTrend;诊断今天只读既有采样算动能,不写 strategyMainlineTrendSamples。
- 阻断3(不吞错):debugErrors 贯通五个吞错点(enrich 整体/单板成分/catalog/rework/rework 内指标充实);debugMeta 增 complete + debugErrors,出错时明细照常输出但如实标不完整;快照损坏(非缺失)也入账。

Files:
- `kpl-stats-server.js`
- `tests/leader-pool-debug.test.js`(38→53 项:快照还原/三表证据/损坏入账、record=false 只读采样、指标失败入 debugErrors 三组行为测试)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(四审修正章节)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;leader-pool-debug 53 项全过;十三套全回归通过。

Deployment:
- GitHub only(PR #23)。不部署云端。

Notes for next agent:
- 诊断端点输出契约至此定型:live(leaderDebug+debugTrace.snapshotStats)+frozenSummary+debugMeta{complete,debugErrors,historicalOnly,fullWait,recordState}。

## 2026-07-11 - Claude - 接口取证补课:7-08 根因预验 + todayGain 还原补强 + 只读接口清单(v6)

Changed:
- Owner 指出"云端真实数据你有接口可以看到"——属实且已验证:`/api/snapshot?day=&zs_type=` 公开接口即可读快照原文,前两轮所有被云端核验推翻的臆测本可自查。教训从"先要样本"升级为"先穷尽已有只读接口取证",清单落库 docs/ops/AI_READONLY_DATA_INTERFACES.md(仅公开/管理员接口,凭据类永不入库)。
- 三套源快照(zs6/5/7)预验 7-08 根因:①星网 002396 涨停(ztList)仅被 网络安全/数字货币/IPv6 携带,无任何算力族板块——todayCodes 归属根因用公开数据坐实;②紫光 000938 在 10+ 个板块 cardData 三表齐全(todayGain=6.8 记录在案)但全部不在 ztList,不在任何算力族板块;③长源东谷 三套源 cardData 全缺席(Codex 核验一致);④实测行结构:zt10 行 totalCount/ztCount 双口径+todayGain+days,gain10/gain30 行 gain=区间涨幅、todayGain=当日涨幅。
- 代码补强(真实结构暴露的缺口):getStrategyBoardSnapshotStocks 从"只取 ztList"改为四表合并去重——三表行的 todayGain 是当日合法证据(紫光型股不在 ztList 但 todayGain 在案),区间 gain 绝不混入;测试夹具同步为实测行结构(53→54 项)。

Files:
- `kpl-stats-server.js`(getStrategyBoardSnapshotStocks 四表还原)
- `tests/leader-pool-debug.test.js`(夹具实测结构化,54 项)
- `docs/ops/AI_READONLY_DATA_INTERFACES.md`(新增)
- `docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;54 项全过;十三套全回归通过。

Deployment:
- GitHub only(PR #23)。预验报告已发 PR 供 Codex 对照;诊断端点上线后只需确认族门槛判定与池明细两项。

Notes for next agent:
- 紫光 7-06 主因归属(算力 or 云计算数据中心→canonical 后是否入族)是剩余的关键未知,以诊断端点 leaderDebug 为准。

## 2026-07-11 - Claude - PR #23 五审两阻断项修复(v7,Codex 复审前)

Changed:
- 阻断1:历史诊断 breadth=null(涨停名单≠完整成分,不产生虚高普涨分,广度函数零调用);三表 todayGain 在场信号照常参与 risingStocks/评分(紫光 6.8 实测结构行为测试)。
- 阻断2:新增 strategyMainlineDiagAwait——boardPayload/priorReason/history/gainLeaders 四关键读取诊断失败必入 debugErrors;gainLeaders 诊断完整等待;板块榜失败早退带 complete:false 的 debugMeta。正式路径与原兜底行为一致(对照断言)。

Files:
- `kpl-stats-server.js`、`tests/leader-pool-debug.test.js`(54→65 项)、`docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`、`docs/DAILY_HANDOFF.md`

Validation:
- `node --check` 通过;65 项全过;十三套全回归通过。

Deployment:
- GitHub only(PR #23)。

## 2026-07-11 - Claude - PR #23 六审修复(v8,诊断错误贯穿底层 + 诚实超时)

Changed:
- 新增 AsyncLocalStorage 诊断上下文 strategyMainlineDiagStore + note 函数(scrub 路径、区分 ENOENT=missing / 其它=readErrors)。低层读取函数 readLimitUpDbDay / readLimitUpMainReasonDbDay / 三处快照读取在 throw 前把真实错误压进上下文——调用方 .catch(()=>null) 吞掉控制流也不再静默。
- strategyMainlineWithTimeout 增 label + 超时事件记录;debugMeta 改由 diagBuildMeta 按真实事件计算 fullWait/partial/complete/timeouts/missing,删除所有静态 fullWait:true。
- collectSnapshotCardStatsForCode 去掉 debugErrors 参数(改用上下文);统一 buildStrategyMainlinesLive 的 debugErrors 到 diagStore.readErrors。
- 函数级场景测试三例(损坏快照 / 历史主因 EACCES+ENOENT / 成分抓取超时),均带"无上下文时正式请求行为不变"对照(真实读取函数+真实 store+注入真实 error/timeout)。真正的 HTTP 端点测试见七审新增文件。

Files:
- kpl-stats-server.js、tests/leader-pool-debug.test.js(65→79 项)、docs/ops/DATA_REPAIR_20260708_ZIGUANG.md、docs/DAILY_HANDOFF.md

Validation:
- node --check 通过;leader-pool-debug 79 项全过;十三套全回归通过。
- 本地起服务冒烟:/health 200、/api/strategy-mainlines?day=历史 200(正式路径不受影响)、诊断端点无 admin 返回 403(门控完好)、AsyncLocalStorage 未影响启动。

Deployment:
- GitHub only(PR #23)。诊断端点成功路径需 admin token,本地无法验证,依赖 Codex 部署后云端跑;函数级测试已覆盖底层错误/超时路径。

Notes for next agent:
- enterWith 选型:整函数体包 run() 回调 diff 过大,enterWith 是官方支持的"设置到当前执行剩余部分"用法;admin-only + 每请求独立异步上下文,并发安全。

## 2026-07-11 - Claude - PR #23 七审修复(v9,合并最新 main + complete 正确性 + run() + 真实 HTTP 端点测试)

Changed:
- 合并 origin/main(落后 5 提交,含 AI 证据接口 4e2de6f..89bd594)。冲突两处均保留双方:kpl-stats-server.js 顶部(AsyncLocalStorage + strategy-evidence require 并存)、DAILY_HANDOFF.md(AI 证据部署记录 + 六审记录都留)。
- 七审1:diagBuildMeta 增 ok 入参 + requiredMissing(本请求日快照/主因缺失)。complete=!(ok=false || readErrors || timeouts || requiredMissing);partial 同源。修复 Codex 复现:三套快照全缺 ok=false 时 complete 曾误为 true。
- 七审2:补齐三处空吞——getDayBoardsWithMembers 实时回退 catch、getStrategyBoardRealtimeStocks catch、hydrateStrategyLiveBoardsForMembers 的 Promise.race 超时,均 note 进上下文,label 稳定(board-rank-live/board-members-live/board-hydrate)。
- 七审3:buildStrategyMainlinesLive 拆为薄壳(run 包裹)+ buildStrategyMainlinesLiveImpl;去掉 enterWith,改 strategyMainlineDiagStore.run() 严格包单次诊断执行。STRATEGY_MAINLINE_LIVE_HYDRATE_TIMEOUT_MS 改为可用 env 注入(仅测试)。
- 七审4:新增 tests/leader-debug-endpoint.test.js——拷仓库到临时目录起真实服务,临时 KPL_ADMIN_USERNAME/PASSWORD 真实登录,覆盖损坏快照/缺文件/主因损坏/主因 EISDIR/并发隔离/诊断后普通请求无残留(16 项)。文档"端点级测试"表述改为区分函数级与真实 HTTP 级。

Files:
- kpl-stats-server.js、tests/leader-pool-debug.test.js、tests/leader-debug-endpoint.test.js(新增)、docs/ops/DATA_REPAIR_20260708_ZIGUANG.md、docs/DAILY_HANDOFF.md

Validation:
- node --check 通过;全部 15 套测试通过(14 原有 + 新增 leader-debug-endpoint;leader-pool-debug 与 endpoint 双层覆盖诊断路径)。
- 与 origin/main 合并干净(a99bbb2),AI 证据接口功能与日志均保留。

Deployment:
- GitHub only(PR #23)。root 环境 chmod 不产生 EACCES,HTTP 层用 EISDIR 走同一非 ENOENT 分支,纯 EACCES 由函数级注入覆盖;实时超时:函数级用真实 store+真实 withTimeout 覆盖,hydrate 超时已 note 接线(端点真超时需外网,不可离线确定性复现,已在 PR 说明)。

## 2026-07-11 - Claude - PR #23 八审修复(v10,最后一轮)

Changed:
- 八审1:readEastmoneyCloseDbDay 空 catch → strategyMainlineDiagNoteRead(`close ${normalizedDay}`, err),ENOENT 进 missing、其它进 readErrors(龙头 gain10/gain30 依赖该库,不再吞损坏/权限/EISDIR)。
- 八审2:requiredMissing 从"仅请求日快照/主因"扩为龙头评分实际输入——请求日全套快照 + 近10日涨停库/主因库 + 当前/10日/30日收盘价基准(离线交易日历同步算出,不依赖网络);盘中当天尚未生成的盘后主因/收盘价单列 traceMissing,不使 complete=false。complete 现同时要求 ok=true。
- 八审3:leader-debug-endpoint.test.js 增真实 board-hydrate 超时场景——注入板块榜(绕过外网)+ HYDRATE_TIMEOUT=1 触发,断言 timeouts 含 board-hydrate、fullWait=false、partial=true、complete=false。为此加两个仅在 `NODE_ENV=test` 时生效的测试 env 种子:STRATEGY_MAINLINE_DIAG_TODAY(诊断"今日"覆盖,应对周末机器)、STRATEGY_MAINLINE_TEST_BOARD_RANKING(注入板块榜绕过受限外网);STRATEGY_MAINLINE_LIVE_HYDRATE_TIMEOUT_MS 已可 env 注入。
- 八审4:并发干净请求补断言 complete===true / partial===false(不止检查未串入损坏错误)。干净日铺满 45 工作日的近日库+收盘价,确保必要输入齐全。

Files:
- kpl-stats-server.js、tests/leader-debug-endpoint.test.js(16→20 项)、tests/leader-pool-debug.test.js、docs/DAILY_HANDOFF.md

Validation:
- node --check 通过;全部 15 套测试通过;与 origin/main 0 behind。
- 端点测试实测:board-hydrate 超时确定性触发(注入板块榜避开容器代理 hang,hydrate 自身网络被 1ms race 掉);干净日 complete=true;损坏/缺失/主因错误 → complete=false/partial=true。

Deployment:
- GitHub only(PR #23)。两个数据/日期测试 env 仅在 `NODE_ENV=test` 时生效,生产即使误设也不会注入;容器预置 agent 代理无法覆盖(HTTPS_PROXY 不生效),故用板块榜注入而非慢代理实现确定性。

## 2026-07-11 - Codex - PR #23 最终复审、合并与云端部署

Changed:
- 完成 Claude PR #23 的最终复审；保留八轮诊断正确性修复，并在生产合并前将 `STRATEGY_MAINLINE_TEST_BOARD_RANKING` 与 `STRATEGY_MAINLINE_DIAG_TODAY` 两个测试钩子再次硬限制为仅 `NODE_ENV=test` 生效。
- `main` 已快进到 `d196aad`；管理员只读诊断接口 `/api/strategy-mainline-leader-debug` 已部署云端，不改变现有主线评分、快照写入或普通用户页面行为。
- 云端三份运维日志均已追加本次部署、重启、回退备份和验证结果；未记录任何 Token 或管理员会话值。

Files:
- `kpl-stats-server.js`
- `tests/leader-debug-endpoint.test.js`
- `docs/DAILY_HANDOFF.md`
- 云端运行文件：`C:\PandaDashboard\kpl-stats-server.js`、`C:\PandaDashboard\strategy-evidence.js`

Validated:
- 本地 `node --check` 通过，全部 15 套测试通过；最终主服务 SHA-256 为 `DE601BE9E7C6F37959AADEB659B5529E8B7D4B27633D88E0B27C8FCF84F424D8`。
- 云端本机与公网 `/health` 均返回 200；证据接口和管理员诊断接口未授权请求均返回 403。
- 真实证据样本 `2026-07-08`、`002396/000938`、window 20：`complete=true`，零 `missingSources/sourceErrors`，完整性哈希存在。
- 管理员诊断成功态：HTTP 200，`live.ok=true`、`complete=true`、`partial=false`、`fullWait=true`，必要输入零缺失、零读错误、零超时；返回 10 条主线。3 个非必要 trace 文件缺失按设计不降低完整性。

Deployment:
- 已部署云端并重启 `PandaDashboard-KPL-Server`，PID `352 -> 9136`；Caddy 与 Panda Yule Server 未重启。
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr23-leader-debug-d196aad-20260711153459`。

Notes for next agent:
- 公司端 Codex 最近未上线不影响本次部署；下次上线先同步最新 `main` 并阅读本条交接即可。
- 诊断端点只供管理员排查真实策略输入完整性；市场源文本继续按不可信数据处理，禁止把凭据、证据 JSON 或运行时数据库提交 Git。

## 2026-07-11 - Claude - 当日综合主因权威归属代码修复(claude/mainline-attribution-fix)

Changed:
- 落地 7-08 根因①的正式代码修复:涨停股按「当日多源综合主因(finalBoardTopic)」权威归属到主线,不再只靠板块共成分。新增纯函数 `strategyMainlineApplyCurrentReasonAttribution(seedByKey, currentReasonDb, todayLimitCodes)`,在 `buildStrategyMainlinesLiveImpl` 历史主因归属之后、板块附着之前调用:①把当日综合主因确有归类的涨停股并入其主因所属 seed.codeSet;②从家族不同的其它 seed.codeSet 剔除该股(家族判定复用生产 `strategyMainlineFamilyInfo`,零新造映射/零硬编码指标)。
- 效果:星网锐捷(002396)7-08 综合主因=算力 → 进入算力AI 主线 todayCodes 并从网络安全/数字货币剔除;同族不同 key 的液冷/云计算 seed 保留(合并去重)。龙头池评分链路未改——星网因此拿到当日封板分评为第一,紫光(7-06 主因算力、当日未涨停)由既有近10日池子补全为第二。
- 语义边界:只作用于当日综合主因库确有归类的涨停股;无当日主因(含盘中当天尚未生成盘后主因,ENOENT)完全走原板块成分归属,行为不变。综合主因库为持久化盘后文件,历史回放读取属证据复现,不涉实时行情。

Files:
- `kpl-stats-server.js`(新增纯函数 + 一处调用)
- `tests/mainline-attribution.test.js`(新增,17 项)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(追加「代码修复」段)
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过;`tests/mainline-attribution.test.js` 17 项全绿(用生产家族判定复现,不 stub 归属逻辑)。
- 既有 leader-pool-debug / leader-debug-endpoint / inflow-gate / qi-mainline-states / scan-priority / scan-supplement / strategy-evidence-tools / metric-profile / star-l2-layers / predict-records 全部通过,无回归。
- 根因用云端真实证据核对:星网 7-08 finalBoardTopic=算力(002396 涨停,gain 10.02);紫光 7-06 finalBoardTopic=算力、7-08 未涨停;冻结快照当前将星网记在网络安全 todayCodes、算力AI 为空——与修复方向一致。

Deployment:
- 仅 GitHub,未部署云端、未重启任何服务。

Notes for next agent(Codex):
- 合并后请部署,并跑 `?day=2026-07-08` 只读诊断端点核验 live 归属(星网→算力AI、移出网络安全);随后**重建 2026-07-08 主线冻结快照**(冻结旧账不会自动刷新),使历史页展示星网第一 / 紫光第二。
- 本次不改龙头池评分与快照写入的既有行为;仅新增当日综合主因这一归属信号。禁止把凭据、证据 JSON 或运行时数据库提交 Git。

## 2026-07-11 - Claude - PR #24 按 Codex 复审重构:盘后归属复核 ≠ 盘中预测

Changed(承接上一条,Codex 复审否决初版"直接把当日综合主因写进 build"——数据穿越):
- **严格分离两条链路**。`buildStrategyMainlinesLiveImpl` 新增 `options.postCloseReview` 门,默认不进,盘中预测/写冻结快照行为零变化(修正初版穿越)。当日综合主因(收盘后答案)只在 review 模式读。
- 归属函数 `strategyMainlineApplyCurrentReasonAttribution` 仅 review 调用,加两道 Codex 要求的护栏:
  - **置信度门槛** `strategyMainlineReasonAttributionConfidence`:strong/majority 档 或 agreeCount≥2 或(候选源≥2 且至少一源板块题材同族)→ hard 可跨族改判;孤源/来源不足 → soft 只记软证据、不删。
  - **彻底剔除** `strategyMainlineDetachCodeFromSeed`:codeSet/realtimeCodeSet/risingCodeSet/nearLimitCodeSet/risingStockMap/nearLimitStockMap 六集合全部同步,错误主线的 todayCodes/count/bigGainCount/risingStocks/leaders 不再受该股贡献。〔二审勘误:本条当时还写了"countFallback 实时成分-1",该做法不成立已移除——countFallback 按板块 zt 数重复累计同一股;盘后复核 count 改取去重 todayCodes.length,见下方二审条目。〕
- `/api/strategy-mainline-leader-debug` 增 `review=1`:额外 postCloseReview 重算,返回 review(盘后复核)/live(盘中口径)/frozenSummary(冻结)三方对照,`reviewAttribution` 明示 hard/soft。
- **不重建 7-08 冻结盘中预测快照**(Codex 第7点);盘后复核只作并列对照。

Files:
- `kpl-stats-server.js`(postCloseReview 门 + 三个纯函数 + 端点 review 参数)
- `tests/mainline-attribution.test.js`(重写,36 项:置信度门槛/六集合彻底剔除/soft 不改写/行为不变)
- `tests/leader-debug-endpoint.test.js`(新增场景八 build-level:live 保留误记、review 归回算力AI 并剔除、reviewAttribution)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`、`docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过;mainline-attribution(36)+ leader-debug-endpoint(含场景八)全绿;leader-pool-debug / inflow-gate / qi-mainline-states / scan-priority / scan-supplement / strategy-evidence-tools / metric-profile / star-l2-layers / predict-records / detail-evidence-index / review-source-health 全部通过,无回归。

Deployment:
- 仅 GitHub,未部署、未重启服务。

Notes for next agent(Codex):
- 盘中预测链路默认不读当日盘后主因(已消除穿越);复核仅 admin `?review=1`,只读不写快照。合并后可跑 `?day=2026-07-08&review=1` 看盘后归属复核对照。
- 不要重建 7-08 冻结预测快照。后续若增强盘中归属,只能用「≤上一交易日主因库 + 细分证据索引 + 今日实时行情」,严禁当日盘后答案。

## 2026-07-11 - Claude - PR #24 二审两阻断项修复(真实主因结构 + count 语义)

Changed:
- **阻断1 置信度读真实嵌套结构**:`strategyMainlineReasonAttributionConfidence` 改读 `sourceEvidence.candidates`(真实库顶层无 candidates),聚合候选真实来源展开 `sourceSupport.groups`(星网实测 jiuyangongshe+tgb);兜底回落源(kpl-zt-reason/limit-up-db-reason/multi-source-consensus)不计入多源门槛,与主因评选 NON_REVIEW_FALLBACK 口径一致;导出包展平结构保持兼容。旧实现会把真实星网误判 soft 使修复失效。
- **阻断2 count 不回退 countFallback**:countFallback 按板块 zt/成分数重复累计同一股,detach 按股减 1 不成立——已移除;盘后复核(postCloseReview)模式 count 直接取去重 todayCodes.length,跨族清空后 count=0,错误主线被 count>0||bigGain||nearLimit 过滤器整体移出。live 盘中口径两处语义均未动。

Files:
- `kpl-stats-server.js`(置信度函数重写 + detach 去掉 countFallback 减 1 + count 计算加 postCloseReview 分支)
- `tests/mainline-attribution.test.js`(夹具改真实嵌套形态,39 项:含二审回归"真实星网→hard"、仅兜底源→soft、单 group→soft、展平兼容、countFallback 不动)
- `tests/leader-debug-endpoint.test.js`(场景八扩展:三板块重复携带 + 数字货币 ztCount=3 过累计 → review 中 todayCodes=[] 且 count=0;live 保留误记)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`、`docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过;mainline-attribution 39 项、leader-debug-endpoint(含扩展场景八)全绿;leader-pool-debug / inflow-gate / qi-mainline-states / scan-priority / scan-supplement / strategy-evidence-tools / metric-profile / star-l2-layers / predict-records / detail-evidence-index / review-source-health 全部通过。

Deployment:
- 仅 GitHub;PR #24 保持 Draft,未部署、未重启。等 Codex 三审。

Notes for next agent(Codex):
- 真实来源计数口径为「groups 展开 ∪ 非兜底候选源」,兜底三源不计入;若你认为 kpl-zt-reason/limit-up-db-reason 应计入多源门槛,请在复审中明示,改动只涉一处正则引用。
- confidence 数值(星网 0.975)本轮刻意未用作 hard 门槛——避免发明魔法阈值;如需启用请给出阈值依据。

## 2026-07-12 - Claude - PR #24 三审修复:置信度禁止跨候选拼接来源与题材

Changed:
- 重写 `strategyMainlineReasonAttributionConfidence`(Codex 三审阻断:二审实现会把「其他候选的多源」+「兜底候选的同族题材」跨候选拼成 hard,上海石化 6-04 反例):
  - **首选 `mainReasonSummary.supportGroups`**(选中候选自身支持组,与最终题材天然同一候选):只统计 REQUIRED_REVIEW_SOURCE_GROUPS 四真实复盘源(kaipanla/jiuyangongshe/xuangubao/tgb),去重 ≥2 → hard;字段存在即权威,不足即 soft、不回退候选。
  - **旧库回退**:仅当记录无该字段才逐候选独立判定,「≥2 真实源」与「同族题材」必须出自同一候选;候选题材看自身 boardTopic/primaryRawTopic/primaryTopic(其他/待定不算)——雷曼光电 6-05 的 boardTopic=芯片(玻璃基板) 映射偏族但 primaryTopic=玻璃基板封装与最终主题一致,应 hard。
  - strong/majority/agreeCount≥2 快捷档保留。
- 新增三例真实结构回归(镜像云端真实记录构造;上海石化/雷曼光电记录用只读证据接口捕获核对,bundleSha256=5cded9ff29c1…/f2c4c2f2c15d…,证据 JSON 未入库,仅入夹具最小字段):星网 7-08→hard、上海石化 6-04→soft、雷曼光电 6-05→hard。另:supportGroups 仅 1 组→soft 不回退、ths/eastmoney 组不计入。
- 清掉仍声称「countFallback 减 1」的旧注释/文档(DATA_REPAIR 改动段、DAILY_HANDOFF 一审条目加勘误注)。

Files:
- `kpl-stats-server.js`(置信度函数重写 + STRATEGY_MAINLINE_REQUIRED_REVIEW_GROUP_SET/strategyMainlineRequiredReviewGroups)
- `tests/mainline-attribution.test.js`(44 项,含三例真实回归与 supportGroups 权威性断言)
- `tests/leader-debug-endpoint.test.js`(DAY_REVIEW 两股补 mainReasonSummary,首选路径 build-level 走通)
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`(三审段 + 改动段勘误)、`docs/DAILY_HANDOFF.md`

Validated:
- `node --check`;mainline-attribution 44 项全绿;leader-debug-endpoint(场景八)全绿;其余 11 套相关测试无回归。

Deployment:
- 仅 GitHub;PR #24 保持 Draft,未部署。等 Codex 四审。

Notes for next agent(Codex):
- 上海石化/雷曼光电夹具按你三审描述+导出证据的候选题材构造(导出层不含 sourceSupport/mainReasonSummary,组名按你给的真实来源填),四审请对照云端真实记录确认夹具形态无偏差。

## 2026-07-12 - Codex - PR #24 最终复审与合并

Changed:
- 完成 PR #24 四审，确认盘中预测与盘后归属复核严格隔离；盘后多源门槛优先使用最终选中主因的 `mainReasonSummary.supportGroups`，旧库回退时也要求题材与来源来自同一候选。
- 将 `claude/mainline-attribution-fix` 快进合并到 `main`；顺手修正三处仍误写“同步清理 countFallback”的注释，未改运行逻辑。

Files:
- `kpl-stats-server.js`
- `tests/mainline-attribution.test.js`
- `tests/leader-debug-endpoint.test.js`
- `docs/ops/DATA_REPAIR_20260708_ZIGUANG.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过，全部 16 套 `tests/*.test.js` 通过，`git diff --check` 通过。
- 只读扫描云端最近 30 份主因文件、2,653 条记录，新门槛与每条已存储的最终支持组口径 0 不一致；星网锐捷=hard、上海石化=soft、雷曼光电=hard。

Deployment:
- GitHub only；未部署云端，未重启任何服务。

Notes for next agent:
- 云端部署后用管理员只读端点 `strategy-mainline-leader-debug?day=2026-07-08&codes=002396,000938&review=1` 验证 live/frozen/review 三方对照；不重建 2026-07-08 冻结盘中预测快照。

## 2026-07-12 - Codex - PR #24 云端部署与真实盘后复核验证

Changed:
- 将 `main` 5450ea8 的 `kpl-stats-server.js` 部署到 `C:\PandaDashboard`，仅重启主服务；Caddy 与 Panda Yule Server 未重启。
- 创建回退备份 `C:\PandaDashboard\_deploy-backups\pr24-mainline-attribution-20260712-094921`，记录部署前后哈希、最终 PID 与验证状态。
- 首次使用一次性 `Start-Process` 启动的进程随 SSH 启动会话结束，造成 Caddy 短暂 502；已立即改用既有 Windows 计划任务 `PandaDashboard-KPL-Server` 启动并恢复，最终监听 PID 12940，SSH 断开后持续运行，未触发文件回滚。

Files:
- 云端运行文件：`C:\PandaDashboard\kpl-stats-server.js`
- 云端日志：`panda-cloud-ops-2026-06-19.md`、`_cloud-change-log-20260705.md`、`_cloud-change-log.md`
- Git 交接：`docs/DAILY_HANDOFF.md`

Validated:
- 部署前云端文件与 Git d196aad/40e840d 完全同哈希，无未回填代码差异；上传文件通过云端 `node --check`，最终 SHA-256 为 `0158A67E7A06ECA7C866A7680485F799A5AF8EA67D6505082C8328FFC0A03C31`。
- `dreamerqi.com`、`market.dreamerqi.com`、`/kpl`、`/admin`、`/health` 均返回 200；未授权的管理员诊断请求返回 403。
- 管理员只读诊断 `day=2026-07-08&codes=002396,000938&review=1`：live/review 均 `ok=true`、`complete=true`、`partial=false`。星网锐捷在 live 属 `IPv6`、冻结快照属 `网络安全`、盘后 review 正确归入 `算力AI`；复核龙头依次为星网锐捷、祥鑫科技、紫光股份。
- 诊断前后 2026-07-08 冻结快照 SHA-256 均为 `9958E897504FFCF8CBE3647506A55F91208760653D6470019DAEB2DF51A7BB0A`，确认盘后复核链路只读。

Deployment:
- 已部署云端并重启 `PandaDashboard-KPL-Server`；最终公网和本机健康检查均通过。

Notes for next agent:
- 不重建 2026-07-08 冻结盘中预测快照；需要追溯时使用管理员 `review=1` 三方对照。云端真实 Token、会话值、数据库和诊断证据 JSON 均未进入 Git。

## 2026-07-12 - Codex - 为 Claude 增加受限主线三方对照接口

Changed:
- 新增 AI 只读 `strategy-mainline-review` 接口，让 agent 使用现有 AI Token 对已收盘交易日执行 live / frozen / review 三方对照，无需管理员 Token。
- 固定只读参数：不写预测、不修改快照、不派发 L2；请求限制为 1-10 只股票，响应按白名单脱敏并附 SHA-256 完整性校验。
- 新增安全抓取工具与使用文档；Token 只从环境变量读取，不支持命令行 Token 参数。

Files:
- `kpl-stats-server.js`
- `strategy-evidence.js`
- `tools/capture-mainline-review.js`
- `tests/leader-debug-endpoint.test.js`
- `tests/strategy-evidence-tools.test.js`
- `docs/AI_PRODUCTION_READ.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 覆盖主服务、证据模块和新工具；全部 16 套 `tests/*.test.js` 通过；`git diff --check` 通过。
- 真实 HTTP 测试确认：AI Token 可访问、无 Token/URL Token 被拒绝、休市日和缺少股票参数被拒绝、未请求股票及未知字段不出现在响应、整包哈希可校验。

Deployment:
- GitHub only；尚未部署云端，未重启任何服务。

Notes for next agent:
- 合并部署后运行 `node tools/capture-mainline-review.js --day=2026-07-08 --codes=002396,000938` 验证生产接口；证据 JSON 只留在被 Git 忽略的 `tmp/strategy-cases/`。

## 2026-07-12 - Codex - AI 主线三方对照接口云端部署

Changed:
- 将 Git `main` 的 AI 只读主线复核接口部署云端；部署前确认云端旧文件与上一版 `main` 哈希完全一致，无未回填热修复。
- 原子更新主服务与共享证据模块，只重启正确的 `PandaDashboard-KPL-Server` 计划任务；Caddy 与娱乐服务未重启。

Files:
- 云端：`C:\PandaDashboard\kpl-stats-server.js`
- 云端：`C:\PandaDashboard\strategy-evidence.js`
- 云端运维日志三份
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端暂存文件 `node --check` 通过，部署后公网 `/health` 与 `/kpl` 均为 200；新接口无 Token 返回 403。
- 使用云端运行时 AI Token 内部调用 2026-07-08、002396/000938：HTTP 200、`complete=true`、live/review 均无必要缺失、读取错误或超时；星网锐捷盘后 hard 归属为算力 AI。
- 2026-07-08 冻结快照测试前后 SHA-256 不变，确认接口只读；证据包 SHA-256 已记入云端日志，Token 未输出或入库。

Deployment:
- Deployed to cloud；主服务最终监听 PID 13356。
- 回退备份：`C:\PandaDashboard\_deploy-backups\ai-mainline-review-20260712-021949`。

Notes for next agent:
- 同步最新 `main` 后，在已安全注入 `PANDA_AI_READONLY_TOKEN` 的环境运行 `node tools/capture-mainline-review.js --day=2026-07-08 --codes=002396,000938`；不要申请或使用管理员 Token。

## 2026-07-12 - Claude - 策略页「预判回看」整合升级(主线命中评估)

Changed:
- Owner 7-11 需求"在策略页单独设计一个内容,把预判回看也一起整合进去"落地。原区块只回看「明星/龙头次日涨幅」,从不评判**主线预判本身**是否命中(7-08 问题正是主线归属错了)。本次在既有 `/api/strategy-mainline-review` 上做加法:
  - 新增纯函数 `strategyMainlineActualFamilyRanking`:当日盘后主因库按主线家族(strategyMainlineFamilyInfo,与主线榜合并口径一致)统计涨停数排名 = 当日实际格局;
  - 每行新增 `phase`(预判冻结时点)、`actualTop`(实际前三家族+涨停数)、`mainlineHitTop1/Top3`(预判主线家族==实际第一家族 / 实际第一家族∈预判前三家族);盘后主因库缺失(含当日盘中)→ 命中记 null、不计分母,不装有数据;
  - 预判明星补 `star.sealedSameDay`(盘中预判的明星最终是否进当日涨停底库 = 预期明星→明星确认);
  - stats 新增主线命中 top1/top3 次数与百分比;**旧字段与旧胜率口径原样保留**。
- 前端(kpl-dashboard_17_apple.html)预判回看区块升级:头部加「主线命中/前三命中」徽章,每行显示 预判主线(冻结时点)→ 实际第一家族(✓命中/△前三/✗脱靶/—无数据)+ 明星当日封板(封✓/未封)+ 原次日涨幅;新增 mlr-chip/mlr-hit/mlr-actual/mlr-phase/mlr-seal 样式,沿用现有设计语言,无结构重排。

Files:
- `kpl-stats-server.js`(strategyMainlineActualFamilyRanking + getStrategyMainlineReview 扩展)
- `kpl-dashboard_17_apple.html`(renderMainlineReviewHTML + CSS)
- `tests/mainline-review.test.js`(新增 18 项:家族格局过滤/同族命中/top3 命中/缺库 null/封板确认/旧字段旧胜率兼容,家族链走生产实现)
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 服务端通过;dashboard 内联脚本抽出后 `node --check` 通过;渲染函数用夹具跑通(含空数据、旧后端无主线统计字段时不渲染新徽章的兼容分支)。
- 全部 14 套相关测试通过(mainline-review 18 项新增,其余无回归)。
- 接口向后兼容:旧字段不动,前端对 null/缺字段全部容错——server 与 html 同仓同部署,无版本错配窗口。

Deployment:
- 仅 GitHub,未部署、未重启。合并后 Codex 正常部署即可,无需数据迁移;预判文件(mainline-predict-*.json)与主因库为既有产物,端点纯读。

Notes for next agent:
- 主线命中分母只含「盘后主因库已生成」的日子;当天盘中永远显示"—",这是口径而非 bug。
- predict-records 攒满 10 天后(约 7-24),此区块的主线命中率即可作为 phase-2 语义讨论的输入。

## 2026-07-12 - Claude - 7-08 盘后归属复核三方对照验收(AI 只读接口,真实云端数据)

Changed:
- 无代码改动。用 Codex 新增的 AI 只读三方对照接口完成 7-08 验收:`node tools/capture-mainline-review.js --day=2026-07-08 --codes=002396,000938`(Token 走环境变量,未用管理员 Token)。

Validated(bundleSha256=4b542ebc474c43471800d95d6095fba99255c72c2a50ece5006603fd956c9374,complete=true、零 missingSources、零 sourceErrors;证据 JSON 未入 Git):
- **frozen(冻结盘中预测,未动)**:星网 002396 仍在网络安全 todayCodes,算力AI todayCodes 为空——冻结旧账保留,符合"不重建"约定;
- **live(现行代码盘中口径)**:归属仍按板块成分(002396 落 IPv6 todayCodes),算力AI todayCodes 为空——盘中不吃当日盘后主因,零穿越;龙头池已由近10日主因自动补全:算力AI leaders=星网90/紫光65;
- **review(盘后归属复核)**:`reviewAttribution.hard=[{002396→group:算力AI}]`、soft 空;星网进入算力AI todayCodes 并从网络安全/IPv6 等跨族主线全部剔除(两者已不在 review 榜单携带 002396);**算力AI leaders=星网锐捷114 第一、紫光股份62 第二——与 Owner 核定的最终龙头排序完全一致**。

Deployment:
- 无部署动作。7-08 修复链路(PR #23 诊断 → PR #24 复核 → AI 只读对照接口)至此闭环。

Notes for next agent:
- 追溯任何历史日的三方对照用同一工具:`capture-mainline-review.js --day=YYYY-MM-DD --codes=...`(1-10 只,已收盘交易日)。

## 2026-07-12 - Claude - PR #25 二审六项统计口径修复

Changed(Codex 复审发现的口径问题全部修复,PR 保持 Draft):
- **①回看窗口**:循环改从最新交易日起——最新收盘日无次日收盘价时 `nextCloseGain=null`,但当日主线命中与封板结果照常;当日盘中标 `pendingReview`(待盘后验证),即使数据凑巧齐全也不计命中率分母。
- **②只计真实盘中预测**:命中率分母仅接受 早盘/上午盘/午间休市/午后/尾盘;盘前/集合竞价/已收盘记录展示但带 `sampleValid=false + sampleInvalidReason`,不计任何分母(明星/龙头次日胜率同样受此门控)。`writeMainlinePredict` 在已收盘阶段**既不覆盖也不首次创建**(7-08 已收盘文件的成因已堵死);7-08 历史文件不删不改,统计时诚实排除。
- **③预期明星封板验证**:预测记录落盘 `star.level`(预测时点等级);回看按等级分流——expected 进"后来是否封板"统计,confirmed 只展示"当时已确认"不算预判成功,active 与旧记录无 level(等级未知)不进统计。`sealedSameDay`:当日未收盘→null(待验证);终盘涨停库缺失/不完整(isSavedAfterMarketClose+isReliableLimitUpDbPayload)→null(数据不足,绝不冒充 false);库完整→true/false。新增 `expectedSealWins/Total/Rate` 统计。
- **④并列第一**:实际家族格局按密集名次分层,最大涨停数相同的家族全部并列第一;预判命中任意并列第一即 top1 命中;Top3 取前三个名次层级(actualTop 完整含全部并列第一,带 rankTier);前端显示"并列第一"。
- **⑤盘后主因库完整性**:命中评判前置校验——`isCompatibleMainReasonDb`(兼容版本)+ 主因库完整覆盖当日终盘涨停 universe(剔除 ST/北交所/新股,复用 afterCloseStatus 口径);不完整 → 命中 null、不计分母、返回 `mainReasonMissingCount`。前端口径文案统一为"盘后涨停主因家族格局",不再可能被读作"整个市场实际主线"。

Files:
- `kpl-stats-server.js`(writeMainlinePredict 已收盘禁创建 + star.level 落盘 + getStrategyMainlineReview 重写)
- `kpl-dashboard_17_apple.html`(等级/封板状态/并列第一/不计样本/待盘后验证渲染 + 样式)
- `tests/mainline-review.test.js`(重写 28 项:六项修复回归 + 真实镜像——07-08 已收盘剔除/07-09 尾盘命中/07-10 尾盘预判医药 vs 实际商业航天脱靶/当日盘中 pending)
- `tests/predict-records.test.js`(+3:已收盘不首次创建、star.level 落盘、旧形态 level=null)
- `docs/DAILY_HANDOFF.md`

Validated:
- 全部 15 套相关测试通过;dashboard 内联脚本 node --check 通过;渲染函数夹具覆盖全部新状态(脱靶/命中/当时已确认/预期封✓/活跃/等级未知/数据不足/待验证/待盘后验证/并列第一/不计样本/缺 N 只)与旧后端字段兼容分支。

Deployment:
- 仅 GitHub;PR #25 保持 Draft,未合并未部署。等 Codex 复审。

Notes for next agent(Codex):
- 有效样本口径:sampleValid 同时门控主线命中与明星/龙头次日胜率(已收盘记录不是任何意义上的预测);若你认为次日胜率应保留旧口径,请复审时明示。
- 真实镜像按你给的三天构造(7-08 已收盘/7-09 命中/7-10 医药 vs 商业航天脱靶);测试还含额外有效样本日,故断言分别验证三天各自行为而非全局 1/2。

## 2026-07-12 - Codex - PR #25 预期明星事件轨迹修复

Changed:
- 修复盘中预测文件反复覆盖导致成功样本消失的问题:首次出现 `expected` 时建立事件,后续转为 `confirmed` 时保留 `firstExpectedAt` 并记录 `confirmedAt`。
- 事件采集遍历前 12 条主线的全部明星候选,不再只看最终快照的第一只明星;`confirmed-from-start` 与 `active` 不冒充预期样本。
- 回看统计按所选主线的累计事件计算“预期后封板”,最终快照的单只明星字段继续保留用于兼容旧前端和旧数据。
- 策略回看行增加预期明星汇总和逐股状态提示;测试夹具改为真实交易日,不再把周末当交易日。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/predict-records.test.js`
- `tests/mainline-review.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- `tests/predict-records.test.js` 与 `tests/mainline-review.test.js` 通过,覆盖非首位预期明星、跨快照状态迁移和预期转封计胜。
- `tests/*.test.js` 全套 17 个测试文件通过;行情页内联脚本编译检查与 `git diff --check` 通过。
- 挂载云端真实数据本地回放:7-08 已收盘样本排除、7-09 命中、7-10 脱靶,有效主线命中仍为 `1/2=50%`;旧文件无事件轨迹时预期转封保持 `0/0`,未伪造历史。

Deployment:
- 仅 Git 分支修改;未合并 main、未部署云端、未重启服务。

Notes for next agent:
- 旧预测文件没有事件轨迹,无法事后还原盘中曾出现过的全部 `expected`;部署后开始形成可靠样本。
- 请独立复审事件去重、跨快照迁移、旧数据兼容和回看分母口径,批准后再合并部署。

## 2026-07-12 - Codex - PR #25 合并与云端部署

Changed:
- Owner 转达 Claude 复审结论 approved;将 codex/pr25-final-fix 快进合并到 main 3941f2a 并推送。
- 部署 kpl-stats-server.js 与 kpl-dashboard_17_apple.html,启用主线命中回看、完整性门控、并列第一、有效盘中样本门控和预期明星事件轨迹。
- 云端三份运维日志已同步记录本次备份、部署、验证和短暂故障经过。

Files:
- kpl-stats-server.js
- kpl-dashboard_17_apple.html
- tests/mainline-review.test.js
- tests/predict-records.test.js
- docs/DAILY_HANDOFF.md
- 云端运行文件与三份云端运维日志

Validated:
- 合并后 tests/*.test.js 全套 17 个测试文件通过;后端 node --check、行情页内联脚本编译和 git diff --check 通过。
- 部署前云端运行文件与旧 main 1c290c0 哈希完全一致,无未回填热修复;云端临时主文件通过 node --check。
- 部署后 dreamerqi.com、行情、后台和健康检查均为 HTTP 200;主服务最终 PID 11248。
- 生产回看接口返回 ok:true、有效主线命中 1/2=50%,并包含 expectedStars 与预期转封统计字段。
- 最终 SHA-256:主服务 CD89614B9A61A48B9E660FDEAE4ED25A39F36AD0B37E25943376E37B2FD5A15E;行情页 2E39C30435238B5DD13458D8740710439625F8580D17C09C2083BFFA1A96C8F4。

Deployment:
- 已部署云端并重启计划任务 \PandaDashboard-KPL-Server;Caddy 与 Panda Yule Server 未重启。
- 回退备份:C:\PandaDashboard\_deploy-backups\pr25-lookback-20260712-124720。
- 首次交互式重启脚本在 schtasks /Run 输入处被 Windows 终端截断,服务短暂 502;当时文件尚未替换,已立即恢复旧服务。随后改用独立非交互命令完成实际替换和重启,最终验证全部通过,未修改运行时数据库。

Notes for next agent:
- 旧预测文件没有 starTransitions,历史预期转封保持 0/0;从部署后的交易日开始形成样本,不得倒推旧数据。
- 后续 Windows 云端部署不要通过交互式 powershell -Command - 一次发送长重启脚本;使用独立 schtasks /End、文件替换、schtasks /Run 和健康检查命令。

## 2026-07-12 - Claude - 勘误:撤回 7-08 算力AI「生产完整池」龙头结论(白名单误读)

Changed:
- 无代码改动。**正式撤回**本人 2026-07-12 早间条目及会话中的三个结论:①"星网114/紫光62 是生产完整池龙头榜"——那是 `strategy-evidence.js` 白名单按请求股票过滤后的切片,不是完整池;②"紫光完整榜第二"——错误,补测证明祥鑫科技(002965,在我列出的候选名单中但漏测)leadScore=64 > 紫光 62;③"其余候选均确认不在榜"——仅对已请求候选成立。
- 方法学教训:AI 只读接口的 `leaders/todayCodes` 均按请求股票过滤,**"请求了且出现"是有效正证、"请求了且未出现"是有效反证,"未请求"不能得出任何结论**;跨批并集只能收窄、永远不能闭合完整榜。

Validated(勘误后的诚实状态,81 只候选、11 个证据包全部 complete=true,哈希在 tmp 证据文件):
- 已请求候选中命中 leaders:星网锐捷 114 > 祥鑫科技 64 > 紫光股份 62;**不排除仍有未请求股票占据其余榜位**;
- 家族当日成员已确认 23/25(新增四方科技 603339);
- 星网第一暂无反例,但完整名次(含紫光/祥鑫相对次序的最终确认)必须以 `leaderDebug.pool` 全池为准。

Notes for next agent(Codex):
- `leaderDebug.pool` 只存在于 admin 诊断端点,`sanitizeStrategyDiagnosticPayload` 整段不透出——只读通道无法完成全池验证。请在云端跑 admin `?day=2026-07-08&codes=002396,000938,002965&review=1`,把 review 段算力AI 的 `leaderDebug.pool` 全表(每股原始排名/leadScore/分项:mainZt10/zt10/g10Rank/g30Rank/新鲜度/在场/todayLimit/lianban/star/seal)回贴讨论,三方以此为最终口径。
- 可选的长期修复:在 AI 只读脱敏层增加 `leaderDebugPool` 白名单段(仅 code/name/rank/leadScore/分项数值,不含文本),让全池验证以后可由只读 Token 独立完成——需你与 Owner 批准后另开 PR。

## 2026-07-12 - Codex - 第0阶段完整池诊断名次契约

Changed:
- 管理员 leaderDebug 增加 resultScope/rankScope/fullLeaderCount/fullPoolCount/returnedRowCount;每个返回行增加完整正式池 originalRank 和完整候选池 poolRank。
- AI 主线复核接口继续只返回请求股票,但现在保留完整池人数和请求股真实原始名次;顶层与主线均明示 resultScope=requested-codes。
- 未请求股票及未知字段继续由白名单剔除;正常策略请求、候选池、正式排序和用户页面完全未改。
- 修正文档中把“前30+指定股”误称为全量池的旧表述,补充 originalRank/fullLeaderCount 的准确语义。

Files:
- kpl-stats-server.js
- strategy-evidence.js
- tests/leader-pool-debug.test.js
- tests/leader-debug-endpoint.test.js
- tests/strategy-evidence-tools.test.js
- docs/AI_PRODUCTION_READ.md
- docs/ops/AI_READONLY_DATA_INTERFACES.md
- docs/ops/DATA_REPAIR_20260708_ZIGUANG.md
- docs/DAILY_HANDOFF.md

Validated:
- node --check kpl-stats-server.js / strategy-evidence.js通过。
- leader-pool-debug、strategy-evidence-tools、leader-debug-endpoint定向测试通过。
- tests/*.test.js全套17个测试文件通过,未发现正式策略、L2、复盘健康、权限或静态页面回归。
- git diff --check通过。

Deployment:
- Git分支实现中;未合并main、未部署云端、未重启服务。

Notes for next agent:
- 请重点复审 originalRank 仅对 gated 正式龙头池编号、未过门槛行为 null,以及 AI 白名单不泄露未请求股票。合并部署后用7月8日算力AI请求002396/002965/000938核对完整池真实名次。

## 2026-07-12 - Codex - 龙头评分v3三方讨论正式收敛

Changed:
- 将议题A-F全部从Pending改为可执行Topic Decision,汇总Shared Decision、分阶段实施计划与验证计划。
- 固化Owner裁决:每日20/15/8互斥且不递减;盘后1-2主线;家族净流入>0、明星、至少2只家族涨停和数据完整为硬门槛。
- 明确家族历史门槛、historyScore/todayScore时间边界、持久化证据要求、完整池诊断和影子上线流程。
- 删除已解决的旧Open Questions,仅保留必须由完整样本校准的权重参数。

Files:
- docs/strategy/discussions/2026-07-12-leader-scoring-v3.md
- docs/DAILY_HANDOFF.md

Validated:
- git diff --check通过;文档变更不涉及生产代码。

Deployment:
- Git文档分支;未部署、未重启服务。

Notes for next agent:
- 后续PR必须遵守Implementation Plan顺序,不可把家族纠错、事件持久化和v3正式替换合并成一次上线。

## 2026-07-12 - Codex - 龙头历史主因按生产家族归属

Changed:
- `mainZt10Count` 从按股票单一主题改为按「股票 + 主线家族」独立累计,同一股票出现在多张主线卡片时不再互相覆盖。
- 近10日历史主因补池改用 `strategyMainlineFamilyInfo` 的稳定家族键;云计算等同族证据可进入算力AI池,网络安全和光通信等不同族保持隔离。
- 管理员龙头诊断增加 `familyKeys`,同时保留可读的 `familyTopics` 标签。

Files:
- kpl-stats-server.js
- tests/leader-pool-debug.test.js
- tests/leader-family-metrics.test.js
- docs/DAILY_HANDOFF.md

Validated:
- `node --check kpl-stats-server.js`通过。
- leader-family-metrics、leader-pool-debug、mainline-attribution定向回归通过。
- 同一股票的算力AI/网络安全行分别只累计本家族主因;总涨停次数和10/30日涨幅口径不变。

Deployment:
- Git分支实现中;未合并main、未部署云端、未重启服务。

Notes for next agent:
- 本改动只修家族归属和历史计数,不改任何评分常数、实时板块、涨停复盘底库或前端展示。

## 2026-07-12 - Codex - 30交易日策略事件与盘后主线持久化

Changed:
- 新增独立 `strategy-daily-events.js`,按日保存盘中观察、首次共振/明星时间、盘后家族硬门槛和互斥20/15/8股票事件。
- 盘中记录接入现有150秒主线保温刷新;16:00后自动盘后定稿,数据未齐每10分钟重试,盘后证据仅允许下一交易日起使用。
- 盘后最多确认两个不同家族;每个家族独立要求净流入>0、至少1明星、至少2家族涨停及主因/涨停数据完整。
- 新增管理员查询/重建接口;`strategy-data`纳入数据库同步,新模块及既有证据模块纳入后端程序同步。
- 运行文件沿用 `strategy-data` 最近30交易日清理,不改四源复盘底库和正式v2排序。

Files:
- strategy-daily-events.js
- kpl-stats-server.js
- tests/strategy-daily-events.test.js
- docs/strategy/STRATEGY_DAILY_EVENTS.md
- docs/strategy/discussions/2026-07-12-leader-scoring-v3.md
- docs/DAILY_HANDOFF.md
- .gitignore

Validated:
- `node --check kpl-stats-server.js`和`strategy-daily-events.js`通过。
- strategy-daily-events纯函数测试覆盖多时点观察、两主线、净流出否决、20/15/8互斥、缺数据和同步接线。
- `tests/*.test.js`全套19个测试文件通过;`git diff --check`通过。

Deployment:
- Git分支实现中;未合并main、未部署云端、未重启服务。

Notes for next agent:
- 这是v3证据层PR2,尚未实现historyScore/todayScore或替换正式排序。后续只能先做离线双跑与影子字段,不得直接改用户榜单。
- 云端部署必须原子包含`kpl-stats-server.js`与`strategy-daily-events.js`;缺模块时主服务会快速失败。

## 2026-07-12 - Codex - PR29/PR30/PR31云端部署与真实日回放

Changed:
- PR #29家族归属修复、PR #30每日策略事件和PR #31覆盖率诊断已合并main并部署到`C:\PandaDashboard`。
- 云端历史日2026-07-10通过管理员接口完成真实重建;底库、主因库、收盘库和策略快照均为完整状态。
- 补充`eventCoverageComplete`、归属覆盖率和未归属数量,区分“必需来源完整”与“每只涨停股都有有效主线家族”。

Files:
- strategy-daily-events.js
- tests/strategy-daily-events.test.js
- docs/strategy/STRATEGY_DAILY_EVENTS.md
- docs/DAILY_HANDOFF.md

Validated:
- 云端主服务PID 13772监听8765;主页、行情、后台和health均HTTP 200;管理员接口无会话返回403。
- 云端正式文件SHA-256:`kpl-stats-server.js`=`C7F2FACA...A63983`,`strategy-daily-events.js`=`796E820E...607761`。
- 2026-07-10回放生成schema 1/rule `leader-scoring-v3-events-v1`;来源完整,确认1条过硬门槛主线,股票事件为明星涨停2、普通涨停77、大涨未板1、不可归属9。
- 回放归属覆盖率87.78%(79只可归属、9只不可归属),`complete=true`且`eventCoverageComplete=false`,两种完整性语义已验证。
- 历史日`intradayObservation=not-recorded`符合预期:盘中采样功能在该日尚未上线,系统未倒推伪造旧样本。
- 同步清单实测:backend包含`strategy-daily-events.js`和`strategy-evidence.js`;database包含每日事件及预测文件。

Deployment:
- 已部署并重启主服务。备份:`C:\PandaDashboard\_deploy-backups\pr29-pr30-20260712-204833`、`C:\PandaDashboard\_deploy-backups\pr31-20260712-205843`。
- 运行时生成:`C:\PandaDashboard\strategy-data\strategy-daily-events-2026-07-10.json`。

Notes for next agent:
- 顶层`complete`表示必要来源库完整;历史计分仍必须逐行检查`historyEligible`。`eventCoverageComplete=false`时不得把未归属行按0计分。
- 2026-07-10的9个dataMissing来自有效源记录但无法映射到主线家族(如其他/事件类),不是底库缺文件。

## 2026-07-12 - Codex - 龙头评分v3互斥影子评分

Changed:
- 新增独立v3影子评分纯函数:历史窗口严格排除目标日,每日明星涨停20/普通涨停15/大涨未板8/无事件0互斥取最高,不再叠加v2的当日在场、今日涨停、连板、早封、明星奖金和主因新鲜度。
- 新增绝对趋势影子层:10日正涨幅1倍、30日正涨幅0.25倍;锚日必须早于目标日,防止目标日涨幅与当天事件重复计分。
- 新增完整池排名和离线v2/v3双跑工具,输出scoreVersion、锚日、完整分项、dataMissing、原始名次/百分位及稳定输入SHA-256。
- 规则版本不兼容、未知事件、缺交易日、缺趋势值均保持null/dataMissing;威尔高7月8日机制夹具验证两连板只按两个交易日各15分。

Files:
- `strategy-leader-scoring-v3.js`
- `tools/replay-leader-scoring-v3.js`
- `tests/leader-scoring-v3.test.js`
- `docs/strategy/LEADER_SCORING_V3_SHADOW.md`
- `docs/strategy/discussions/2026-07-12-leader-scoring-v3.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增测试覆盖同日20/15互斥、8分大涨未板、目标日不进历史、无上限累积、旧重复信号不计分、规则/事件/交易日缺失、锚日穿越阻断、单家族完整池排名和证据SHA校验。
- `tests/*.test.js`全套20个测试文件通过;两个新增运行文件`node --check`与`git diff --check`通过。

Deployment:
- 仅Git分支;未合并main、未部署云端、未重启服务。正式用户榜仍使用v2。

Notes for next agent:
- 本次是实施计划PR3,只提供纯函数与离线双跑。PR4才能把影子分接入管理员诊断/冻结记录;替换正式榜仍需至少10个新交易日影子观察和Owner再次批准。
- 10/30日趋势系数与负涨幅处理仍是影子校准参数;本版明确标记规则版本,不得把影子分解释成概率或正式生产结论。

## 2026-07-12 - Codex - 龙头评分v3复审阻断修复

Changed:
- 按Claude独立复审修复PR #33的两项阻断:趋势锚必须等于历史窗口最后一个交易日;删除事件生产器从不产出的`big-gain-not-limit-up`别名。
- 修复完整池候选静默继承池顶层个股涨幅的问题;池级只共享日期、家族和每日事件记录,每只候选必须提供自己的趋势字段。
- 新增陈旧趋势锚、幽灵事件别名和候选趋势字段缺失三组回归测试,同步收紧影子规则文档。

Files:
- `strategy-leader-scoring-v3.js`
- `tests/leader-scoring-v3.test.js`
- `docs/strategy/LEADER_SCORING_V3_SHADOW.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check strategy-leader-scoring-v3.js`和`tests/leader-scoring-v3.test.js`通过。
- 龙头评分v3定向测试28项通过;陈旧锚、未定义事件和池级趋势串值均明确进入`dataMissing`。
- `tests/*.test.js`全套20个测试文件通过;`tools/replay-leader-scoring-v3.js`语法检查与`git diff --check`通过。

Deployment:
- 仅Git分支;未合并main、未部署云端、未重启服务。正式用户榜仍使用v2。

Notes for next agent:
- 请复审PR #33最新提交;重点确认三项评审意见均被回归测试覆盖,不要据此提前启用正式v3排名。

## 2026-07-12 - Codex - v3目标日盘后家族资格修正

Changed:
- 按Owner澄清拆分历史积分与正式资格:目标日继续排除出历史10日积分,但盘后完整事件已确认同家族且当天普通/明星涨停时,可零加分通过正式龙头资格。
- 新增`priorFamilyLimitGate`、`todayConfirmedFamilyLimitGate`、`formalEligibilityGate`及资格来源诊断;排名改用正式资格门。
- 盘中投影仍只能作为候补;首日仅大涨未板不能单独过家族涨停资格。7月8日星网锐捷类场景不再因历史窗口为0被排除。

Files:
- `strategy-leader-scoring-v3.js`
- `tests/leader-scoring-v3.test.js`
- `docs/strategy/LEADER_SCORING_V3_SHADOW.md`
- `docs/strategy/discussions/2026-07-12-leader-scoring-v3.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 龙头评分v3定向测试31项通过,覆盖目标日盘后涨停过门、盘中投影不得过门、仅大涨未板不得过门。
- `tests/*.test.js`全套20个测试文件通过;评分器和回放工具语法检查、`git diff --check`通过。

Deployment:
- 仅PR #33分支;未合并main、未部署云端、未重启服务。正式用户榜仍使用v2。

Notes for next agent:
- Claude复审时需确认目标日事件只作一次20/15计分且资格门零加分,并确认`persisted-intraday-projection`不能误过正式资格。

## 2026-07-12 - Claude/Codex - 预判回看卡片视觉重构

Changed:
- 将策略页“预判回看”改为紧凑的两行日卡片:首行串联预判主线、命中状态和盘后家族,次行独立展示明星、龙头及预期转封结果。
- 使用左侧状态线区分命中、前三、脱靶、待验证和无效样本;头部集中展示主线命中率、前三率及预期明星封板率。
- Codex复审补齐静态标签语义、项目圆角和字距约束;数据字段、统计口径、转义与接口调用均未改变。

Files:
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用云端真实`/api/strategy-mainline-review?days=10`响应,在1440x1000与390x844视口运行实际`renderMainlineReviewHTML`;均无页面错误、横向滚动、元素越界或文字重叠。
- 补充模拟命中/前三/脱靶/待验证/无效及长题材名状态,1440/900/390三档视口均通过布局检查。
- `tests/*.test.js`全套20个测试文件通过;最终三档Playwright复验零页面错误、零越界且静态表单`label`为0;`git diff --check`通过。

Deployment:
- PR #34分支验证中;未合并main、未部署云端、未重启服务。

Notes for next agent:
- 本改动只调整预判回看视觉层;不得据此解释或修改命中率、明星转封和次日胜率口径。

## 2026-07-12 - Codex - PR34预判回看云端部署

Changed:
- 无代码变更;记录PR #34合并后的云端静态前端部署、备份及公网验收结果。
- 云端两份运维日志已同步追加同一部署记录。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端与公网`/kpl`文件SHA-256均为`C49A15E6C89C76975992978282FFAAA0BC4DC15B05BE03EC5DE5A0D885FE9FAB`,与Git main一致。
- 公网策略回看接口HTTP 200、`ok=true`;响应包含3个交易日记录和2个有效主线样本。
- 主服务仍由PID 13772监听8765,部署前后未重启。

Deployment:
- 已部署`C:\PandaDashboard\kpl-dashboard_17_apple.html`。
- 回退备份:`C:\PandaDashboard\_deploy-backups\pr34-20260712-232721\kpl-dashboard_17_apple.html`。
- 已更新`panda-cloud-ops-2026-06-19.md`和`_cloud-change-log-20260705.md`。

Notes for next agent:
- 本次只替换静态行情HTML;v3评分模块虽已合并main,仍未接入或部署,云端正式龙头榜继续使用v2。

## 2026-07-13 - Claude - P6 规格:事件档案 v2 状态转换表与测试案例(仅文档)

Changed:
- 新增 `docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md`:P6 完整性收窄的精确状态转换表(日级 S1-S5、行级 R1-R7、评分器 E1-E8)、迁移与再生成规则、14 个必备测试案例、两日验收重跑预期。
- 采纳 Owner 四点修正:污染快照不改名不删除、由 data-quality 清单隔离并在生成器读取前查验(SNAP 定义);明星不可考日 starEvidenceStatus 必须为 unscanned;reconstructed 确认主线默认不进计分,等家族级 canonicalSource 裁定;联合污染检测归 P1 范围引用。
- 核心原则成文:收窄只在生成器层做(行级证据写细 + R5 显式不确定行),评分器保持偏执、零新增数据源依赖;DAILY_EVENT_POINTS 与趋势系数零改动;v1 档案走 E2 兼容旧闸。

Files:
- docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(新增)
- docs/DAILY_HANDOFF.md

Validated:
- 仅文档,无代码改动;规格与 06-23/07-02 两个实证日(07-01 替代验收 0/74、07-08 验收 0/90 的共同根因)逐一对齐;S2 行级三分法此前已用 07-08 批次1 真实数据实测(20 只:18 无事件确定、1 涨停确定、1 不可判定)。

Deployment:
- 无。未部署、未重启、未改 v2 榜、未启动 PR4。

Notes for next agent:
- Codex:按本规格实现 P6(先 S2+S5,S4 定义保留),T1-T14 全覆盖,S1 黄金不变性是硬门;实现 PR 保持 Draft 交 Claude 复审。
- 悬决两项(规格 §6)需 Owner 拍板:S4 启用时机;reconstructed 是否随 canonicalSource 裁定升级为可计分。

## 2026-07-13 - Claude - P6 规格 rev2:按 Codex 首轮评审六项阻断修订

Changed:
- 规格修订(全部采纳):生产迁移收缩为仅重生成 06-23/07-02 两个 S2 日,S1 黄金不变性改为离线 golden 不安装;starEvidenceAvailable 改为纯显式元数据判定,删除一切日期条件;快照术语拆为三层(kpl-snapshots 原始/strategy-data 综合/冻结主线)并明确 S2 检查对象与 data-quality 条目最少字段;scoreVersion 升 leader-scoring-v3-shadow-v2;首个实现 PR 范围统一为 S2 only(S4/S5 规范保留待 Owner 批准);两日 complete 数改标测算预期。
- 按评审要求把 2026-07-09-mainline-semantics-topics.md 移出本 PR;内容保留在分支 claude/mainline-semantics-topics-scaffold(commit d0fe304),未丢弃。

Files:
- docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(rev2)
- docs/strategy/discussions/2026-07-09-mainline-semantics-topics.md(移出)
- docs/DAILY_HANDOFF.md

Validated:
- 仅文档;六项阻断逐条对照修订,非阻断项(测算预期措辞)一并处理。

Deployment:
- 无。不合并、不实现、不部署、不启动 PR4,等 Codex 复审。

Notes for next agent:
- Codex:请复审 PR #37 rev2;实现仍等规格定稿 + Owner 对 §7 两项拍板。

## 2026-07-13 - Claude - P6 规格 rev3:按 Codex 二审三项阻断修订

Changed:
- 明星证据改为按家族三值 `starEvidenceStatusByFamily`(positive/scanned-no-star/unscanned),空 stars/starTransitions 数组不提升状态,R2a/R2b 按家族状态区分;
- data-quality 清单改判别联合:contaminated 绑 observedSha256/observedSourceDay,missing 绑 expectedPath 且 sha256=null,禁止伪 SHA;
- 隔离查验上移到加载/编排层(finalizeStrategyDailyEvents/回填加载器),生成器保持纯函数只信 quality.snapshotStatus/snapshotEvidence,零新增文件 I/O;T6 拆双断言、新增 T6b/T9b。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(rev3)、docs/DAILY_HANDOFF.md

Validated: 仅文档;三项阻断逐条修订;PR #37 描述同步更新。

Deployment: 无。等 Codex 复审后进入 Owner 拍板;不实现、不部署、不启动 PR4。

## 2026-07-13 - Claude - P6 规格 rev4:按 Codex 三审两项状态机闭合修订

Changed:
- 明星证据从家族级升级为逐股三分 starEvidenceStatusForStock(positive/scanned-no-star/unscanned),R1/R2a/R2b 与三值一一对应无漏行空洞;明文两条反证禁令(空数组不算证据;同族他股明星不证明 X 被扫描);家族级映射降为诊断字段;新增 T8b(positive 家族中 B 股 15/unscanned 不丢行)。
- SNAP=ok 补全链 provenance:冻结层+综合层+当日必需原始 kpl-snapshots/{5,6,7} 全部无 missing/contaminated 且原始层齐全;层级豁免须显式 provenance 元数据,禁止默认忽略;T6/T6b 补依赖链断言。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(rev4)、docs/DAILY_HANDOFF.md

Validated: 仅文档;两项闭合问题逐条修订。

Deployment: 无。等 Codex 复审;通过后进入 Owner 对 §7 的规格拍板;不实现、不部署、不启动 PR4。

## 2026-07-13 - Claude - P6 规格 rev5:按 Owner 口径修正扩展 S4/S5 为按股票/按字段闸

Changed:
- 废止「S2 only」范围:S2/S4/S5 均实现,唯一全日闸保留 S3(涨停事实不可信);核心原则成文「缺某类数据 ≠ 当天已确定事件不得分」。
- S4:归属可靠涨停股正常 15/20,仅缺归属股 dataMissing;S5:涨停+归属不依赖 CL/SNAP 正常 15/20,8分/none 按字段阻断,禁止反向清除已确认事件。
- 两条档案级不变量:所有可独立确认的 15/20 事件及 provenance 必存档;总分 incomplete 时已确认事件分在 knownPoints/evidence 中完整可审计。
- §7 第 1 项标记已裁定;新增 T15(S4 逐股)、T16(S5 字段阻断+不反清)、T17(incomplete 审计不变量)。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(rev5)、docs/DAILY_HANDOFF.md

Validated: 仅文档;rev4 派生标志(mainlineKnowable/noneDeterminable/逐股三分)对 S4/S5 本已推导出与 Owner 裁定一致的行为,本轮为范围放开+状态表补行+测试补三条,无机制重设计。

Deployment: 无。等 Codex 复核 rev5;§7 仅余 reconstructed 一项待裁;不实现、不部署、不启动 PR4。

## 2026-07-13 - Claude - P6 规格 rev6:按 Codex 五审两项阻断修订

Changed:
- 新增 §2.1 逐股事件决策树为唯一真值(LU→逐股涨停→逐股家族证据→CL→主线可知性);S1-S5 降为诊断标签不作互斥控制流;五审反例(mainlineKnowable∧¬CL 把成分股误判 0)以 R5b 显式行修复,E7 原因改为 ['closePrice','confirmedMainlineUnknown']。
- 新增 familyEvidenceForStock(X) ∈ {reliable, missing} 显式判定(missingMainReasonCodes 优先;provenance 落 sourceReason;多家族分别发行);T15 改用该状态。
- 一处精化待 Codex 复核:mainlineKnowable∧¬CL 下非成分股判 none 0(8 分因非成分即被排除,不依赖涨幅),成分股按建议阻断;若 Codex 不接受可整支退回保守口径。
- T16 修正、新增 T16b(五审反例夹具)、T17 收紧为「同窗含已确认事件+缺失事件」双条件断言。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(rev6)、docs/DAILY_HANDOFF.md

Validated: 仅文档;两项阻断逐条修订;noneDeterminable 布尔保留但仅在 R5b 如约发射前提下与决策树等价(已注明)。

Deployment: 无。等 Codex 复核 rev6;不实现、不部署、不启动 PR4。

## 2026-07-13 - Claude - P6 规格 rev6 收尾:Codex 六审通过,四处非语义文字修正

Changed:
- §0 修正措辞(rev6 决策树+R5b 修正确立,rev5 布尔有缺口见 T16b);S5 条件简写 LU∧¬CL 并注明可与 S4 重叠、仅诊断标签;§5 迁移时间表述理顺;R5b 明确「对当前评分家族 G:X ∈ confirmedMainlineMembers[G],行携带 familyKey=G」防实现误解。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md、docs/DAILY_HANDOFF.md

Validated: 仅文字,语义零改动(Codex 六审已确认语义通过、R5b 精化接受)。

Deployment: 无。规格只待 Owner 确认最后一项默认值(reconstructed 主线只展示/审计、不参与评分)即可定稿合并;不实现、不部署、不启动 PR4。

## 2026-07-13 - Claude - P6 规格定稿:Owner §7 终裁落档

Changed:
- reconstructed 终裁写入 §2/§7:重建主线只展示/审计,不产生主线8分;可靠15/20事件不受影响照常进历史窗口;formalScore 可 incomplete 但已确认事件分必须保留于 knownPoints/evidence;升级计分须待 canonicalSource/sourceDay/防污染/重建可信标准全部定稿后另开讨论。
- 规格标记定稿:六轮 Codex 评审(13项阻断+R5b精化接受)+ Owner §7 两项拍板全部完成;§7 改为决策记录,无悬决项。

Files: docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md(定稿)、docs/DAILY_HANDOFF.md

Validated: 仅文档;六审四处文字收尾已在上一提交完成,本次仅落档 Owner 终裁与定稿标记。

Deployment: 无。PR #37 待合并(合并由 Codex/Owner 执行);合并后 Codex 另开 P6 实现 Draft PR(S2/S4/S5 逐股闸 + T1-T17)交 Claude 复审;不实现、不部署、不启动 PR4。

## 2026-07-13 - Codex - 公司端 L2 worker 实盘能力复核

Changed:
- 未修改代码或运行配置;通过云端内部管理接口和持久化任务文件复核公司端 L2 worker 的实际输出能力。
- 更正旧交接结论:当前 worker 已能同时返回 50万、300万、500万、800万、1000万五档,不再是仅 50万/500万两档。
- 云端两份运维日志已记录同一验证结论。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- 北京时间约 10:28-10:35,worker `qi-local-l2-worker` 在线,版本 `0.1.0`,云端队列 Token、30日持久化和心跳均正常。
- 3只股票的小样本五档完整率 3/3,现价字段覆盖 0/3。
- 同时完成的创新药板块任务共41行,五档完整率 41/41,`price/close/lastPrice` 覆盖 0/41。
- 41行当前按“最高非零成交档”回推最大档:25行落在50万、10行300万、4行500万、1行800万、1行1000万;这不能替代按股价和申报上限计算真实最大可统计档。
- 验证任务均已完成并落盘;服务健康,无 pending,未重启服务。

Deployment:
- 生产运行时产生了 L2 验证任务和持久化结果文件;未部署代码、未修改配置、未重启服务。
- 云端操作日志已更新;未记录任何 Token、账号、密码或原始证据文件。

Notes for next agent:
- 公司 worker 的五档汇总已经完成,无需重做五档计算。
- 进一步代码核对确认:东财、同花顺、KPL 的实时成分接口本身已有现价,但 `strategyNormRealtimeStocks`、KPL 实时映射和 `local-l2-task-queue.normalizeStock` 当前会丢弃该字段。优先修法应是云端保留任务股票的 `price`,worker 结果缺价时再按 code 从任务快照补回;让公司 worker 直接回传 `price/lastPrice` 可作为兼容路径,但不再是唯一方案。
- 修复后复测 `rowsWithPrice == resultRows`,并给结果保留价格来源/任务时间,避免历史任务混入当前价。
- 在现价覆盖完成前,明星最大档会按最高非零档倒推。高档字段存在但为零时可能被错误绕过,因此预期明星/明星确认结果只能视为待复核,不能据此校准阈值。

## 2026-07-13 - Codex - P6 每日事件档案 v2 实现草案

Changed:
- 按 PR #37 定稿规格实现 `leader-scoring-v3-events-v2`:S2/S4/S5 改为逐股、逐字段闸;唯一全日闸仍是涨停底库不可信。
- 可独立确认的涨停事件不再因快照、全局主因覆盖或收盘库缺失被清除:可靠归属普通涨停记15,自身 expected/confirmed 明星正证据记20;逐股扫描状态严格区分 confirmed/not-confirmed/unscanned。
- 实现 R5/R5b:主线不可知时大涨未板显式记录 `confirmedMainlineUnknown`;主线可知但收盘库缺失时仅阻断确认主线成员的 `closePrice`,非成员仍可确定 none 0。
- 新增独立快照质量加载模块。加载器先读 data-quality 清单,再检查冻结/综合/zs5-zs6-zs7 全链 provenance;命中 missing/contaminated 时不读取任何快照内容。
- v3 评分器同时接受 v1/v2 档案;v1 保持旧闸,v2 只信 rowsAuthoritative/noneDeterminable/行级状态;评分版本升为 `leader-scoring-v3-shadow-v2`。
- 新增 T1-T17 自动化覆盖,包括污染隔离、逐股明星反证、S4/S5、R5b、v1兼容、重复行互斥与 incomplete 时 knownPoints/provenance 保留。

Files:
- `kpl-stats-server.js`
- `strategy-daily-events.js`
- `strategy-daily-event-quality.js`
- `strategy-leader-scoring-v3.js`
- `tests/strategy-daily-events.test.js`
- `tests/strategy-daily-events-v2.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 四个运行文件 `node --check` 通过。
- `tests/*.test.js` 全仓21套测试全部通过;`git diff --check` 通过。
- 只读核对云端目录: `strategy-data/snapshots`、`kpl-snapshots/{5,6,7}` 和冻结主线快照层均真实存在,不是文档中的虚拟路径。

Deployment:
- 未部署云端、未重启服务、未生成或改写任何生产事件档案/快照/清单。
- 实现保持 Draft 交 Claude 复审;生产部署必须与 data-quality 清单原子完成,随后只备份并重生成 2026-06-23、2026-07-02 两日,不得重写其他 v1 档案。

Notes for next agent:
- 重点复审逐股明星证据是否足够保守、R5/R5b 发射边界、v1 eventForCode 是否逐字段保持旧行为,以及 snapshot manifest 的路径匹配/先查后读约束。
- `reconstructed` 只展示/审计,不进入8分;代码保留显式 `snapshotReconstructed` 支持,但本 PR 不创建任何重建数据。
- PR4 仍未启动;本实现通过复审、生产两日重生成和离线双跑前不得切正式榜。

## 2026-07-13 - Codex - P6 Draft 按 Claude 首轮复审修正

Changed:
- 修复跨家族明星降级:expected/confirmed 正证据恢复为按股票代码携带,不再绑定盘中家族;盘后主因改归其他家族时仍按股票自身明星证据记20。
- 恢复 `stockEvents.complete` 的 v1 运维语义:三库来源完整即 true;不可归属个股只令 coverageComplete=false并保留行级 dataMissing,不再污染日级来源完整状态。
- R4/R5b 主线成员循环补 `isExcluded` 过滤,避免排除股票生成8分或 closePrice 阻断行。
- 新增跨家族明星和「完整日+不可归属股」两条回归探针。

Files:
- `strategy-daily-events.js`
- `tests/strategy-daily-events-v2.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Claude 两个阻断项均用对应探针复现后修复。
- 定向每日事件 v1/v2 与 v3 评分测试通过;待推送前再跑全仓21套。

Deployment:
- 未部署、未重启、未改生产档案。推送后继续等待 Claude 复审 PR #40。

## 2026-07-13 - Codex - L2 任务现价补全实现

Changed:
- 东财、同花顺、KPL 实时成分标准化现在保留现价及来源,KPL 使用实时成员行 `row[5]`。
- 本地 L2 队列把任务创建时的现价、来源和快照时间下发并持久化;公司 worker 未返回现价时,结果按 code 从任务快照补回。
- worker 自带 `price/close/lastPrice` 时仍优先使用,并记录 `worker-result` 来源;五档金额、买卖比、扫描门槛和公司 worker 协议保持兼容。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `tests/scan-priority.test.js`
- `tests/local-l2-persistence.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 两个运行文件通过。
- `scan-priority` 覆盖任务保价、缺价按 code 回填、worker 价格优先、三源实时映射和价格覆盖指标。
- `local-l2-persistence` 覆盖回填价格与来源落盘、重启恢复。
- `star-l2-layers` 与 `qi-mainline-states` 回归通过;`git diff --check` 通过。

Deployment:
- GitHub Draft PR 阶段;未部署云端、未修改运行配置、未重启服务。

Notes for next agent:
- 部署后用公司 worker 重跑至少一个板块,验收 `rowsWithPrice == resultRows`、`rowsWithAllBuckets == resultRows`,并抽查低价主板/创业板/高价股的最大档映射。
- 价格来自任务创建时实时成分快照,用于最大可统计档映射;不得用历史任务补当前价格。

## 2026-07-13 - Codex - PR39/PR40 云端部署与 P6 v2 双跑验收

Changed:
- 将已合并并经 Claude 复审的 PR #39/#40 从 `main@b8699ae940cac872b8094b405f84c09b3f4427fd` 原子部署到云端；事件规则升级为 `leader-scoring-v3-events-v2`，正式 v2 榜未切换。
- 先安装生产数据质量清单，再部署代码；清单按真实生产实况隔离 06-23 缺失链和 07-02 污染链，不改写或删除任何快照原件。
- 只备份并重建 2026-06-23、2026-07-02 两份事件档案；其他 17 份档案 SHA-256 全部保持不变。
- 使用原锁定的 07-01/07-08 算力AI完整候选池，仅替换对应历史日为 v2 逐股投影后重新离线双跑；完整逐行 v2/v3 对照见独立验证文档，证据 JSON 仍只保存在云端隔离目录。
- 完成 PR #39 真实公司 Worker 小样本验收：先进封装 3 股现价和五档均 3/3 完整。

Files:
- `docs/strategy/validation/2026-07-13-p6-events-v2-replay.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端部署文件哈希与 Git main 一致；本机和公网 `/health` 均为 `{"ok":true}`，新主服务 PID=2836。
- 质量清单 SHA-256=`1edd7ebd05cb288449c9ed91e648755d1c4fe94a4c833eef3afc38f2787fe2a7`；加载结果严格为 06-23 `missing`、07-02 `quarantined`。
- 06-23 v2 档案 SHA=`400003120d761e0368b95e2a9a476b1354ddbc7b87d8f9e6cff14fb4a1a5a704`：三库来源完整，283 行，可靠普通涨停15分事件85行；07-02 SHA=`c113c2fb460928cd980b908ead220d59188d504d7f1bb8204c7f0d42c0f85d1e`：三库来源完整，215行，可靠普通涨停15分事件71行。历史无明星正证据，star20 均为0，未造分。
- 07-01：74股中62股 complete/formal；剩余12股缺10/30日趋势，碧兴物联另有06-23主线归属不可知。输入文件SHA=`9f067b85278d64ad0c9f73117ad01b48c8ed9bcc885440d6d559c048fdc6c830`，规范输入SHA=`a5a90f5d968090c6ba465ff41bb73630e368262f7f024e60e10e6906d2282d90`，报告SHA=`b0044ac665bc822e4dc8a831d44de7889e8c963124281cbb8c48fd92e7ee25e3`。
- 07-08：90股中86股 complete、84股 formal；东方锆业/鸿合科技保留07-02主线归属不可知，动力源缺趋势，振华股份缺07-06主因归属。输入文件SHA=`218ba6028bb1f44b1e85006301842c2cd84f1246afafc3a283508ba6022665a5`，规范输入SHA=`000856e734d4fe7fa472bacd45aa8c88fe98395fead85265922405d3ed0b02f4`，报告SHA=`408f70d9791951b7d31793f7a3cbd50e9318f4ec003b483f03151f38b650fb04`。
- 星网锐捷002396：v2第1/114分 → v3第3/56.22分（历史0+当日15+趋势41.22），资格依据为`confirmed-target-day-family-limit-up`；威尔高301251：v2第3/76分 → v3第68/15分（历史0+当日15+趋势0）。
- 两个全池的 `--require-complete` 均因残余真实缺失按设计退出1；没有放宽闸门。Git 归档对照文档 SHA=`679bddfdde07118cc6bde9f4b40c2aefaeb4ea35e6cb67a010e15201dc183f8c`；云端生成原件 SHA=`ac316dc76dedafed4a3af4856a99cbdff23616a753f9e532443a9d32ef8e33f9`，两者内容相同，仅 Git 归档规范化了末尾空行。
- L2任务`0287a6eebde1aa4d`：worker `0.1.0`，resultRows=3、rowsWithPrice=3、rowsWithAllBuckets=3，价格来源均为`eastmoney-board-realtime`；抽查价格15.98/74.30/102.03，五档各5档。

Deployment:
- 已部署并重启计划任务 `Panda Dashboard Server`；回退备份：`C:\PandaDashboard\_deploy-backups\pr39-pr40-20260713-121701`。
- 云端离线证据：`C:\PandaDashboard\_offline\main-b8699ae\tmp\p6-v2-validation-20260713`，不入 Git。
- 三份云端运维日志均已更新；日志回退备份：`C:\PandaDashboard\_deploy-backups\pr39-pr40-logs-20260713-1300CST`。
- 受控重建最初的 PowerShell 汇总器因 Windows 默认编码无法解析大型无 BOM UTF-8 JSON；立即停止后改用 Node 原生 UTF-8 验证，确认生成档案 JSON 完整有效。此后所有摘要、哈希和对照均由 Node 读取。

Notes for next agent:
- 请 Claude 独立复核锁定双跑、四个残余不完整样本及完整对照表；复核前不启动 PR4，不让 v3 参与正式排序。
- 07-01/07-08 已形成首批真实可比较样本，但只说明 P6 逐股闸恢复了可用样本，不能仅凭两天宣称 v3 优于 v2。
## 2026-07-13 - Codex - v3前置事件回填与7-08完整池离线双跑

Changed:
- 以Git main `7e028ea6fc73ca6384fc37e0e3af7e36ea41eedc`建立云端隔离工作区,使用已合并的`leader-scoring-v3-events-v1`生成器回填2026-06-24至2026-07-08共11个交易日的每日事件档案。
- 运行时只新增11份`strategy-daily-events-YYYY-MM-DD.json`;安装前逐份校验日期、规则版本、清单SHA及目标不存在,没有覆盖既有7-10档案、冻结快照或v2文件。
- 7-08算力AI候选池不再把接口默认的top30冒充全池:通过管理员只读`codes`追踪分批闭合90/90唯一池行,再用`tools/replay-leader-scoring-v3.js`离线双跑v2/v3。
- 三份云端运维日志已记录运行时新增档案、逐日覆盖率、证据哈希、完整性阻断与不重启边界。PR4没有启动。

Files:
- Git:`docs/DAILY_HANDOFF.md`
- 云端新增:`C:\PandaDashboard\strategy-data\strategy-daily-events-2026-06-24.json`至`2026-07-08.json`中的11个交易日文件
- 云端隔离证据:`C:\PandaDashboard\_offline\main-7e028ea\tmp\pr33-v3-preflight\`(不入Git)
- 云端日志:`panda-cloud-ops-2026-06-19.md`、`_cloud-change-log-20260705.md`、`_cloud-change-log.md`

Validated:
- 逐日涨停主因家族归因覆盖率:06-24 96.94%(95/98)、06-25 94.19%(81/85)、06-26 96.67%(58/60)、06-29 93.40%(99/105)、06-30 95.65%(132/138)、07-01 90.67%(136/149)、07-02 77.17%(71/91)、07-03 84.11%(90/104)、07-06 81.25%(52/64)、07-07 81.82%(27/33)、07-08 80.85%(38/46)。未归因行保持`dataMissing`,没有造“其他”归属。
- 11天涨停/主因/收盘底库质量检查均完整;07-02独缺`zs6/zs5/zs7`三份原始快照,且云端目录和压缩备份均无原件,所以该日档案如实为`complete=false`,未生成或改写冻结快照。所有历史家族L2证据为`unscanned`,未伪造明星20分。
- 安全只读参数:`day=2026-07-08&review=1&codes=<每批最多10只规范代码>`;未记录管理员Token。接口声明`fullPoolCount=90/fullLeaderCount=88`,最终回收90个唯一`poolRank`;97个种子中的7个`tracedMissing`不属于正式池。
- 输入原始文件SHA-256=`58666790301b314ce61fb5ba99b8dee01844eb9896f83373ac5f4f2e2d90e1d0`;回放规范化inputSha256=`1083c59b1824a880690624213041b5bfa46c07b2edf192d5a4f25150399a02b8`;报告文件SHA-256=`8943bff72ce36a87721a7a0bb8ee468cb30f7974fc573d80e6e53eab01ab57cd`。证据JSON仅在云端隔离目录。
- 无`--require-complete`回放得到0/90 complete(0%):90行均缺历史日07-02;600405另缺gain10/gain30;603067另缺07-06`mainReasonFamily`。因此合规的v2/v3完整名次对照表为0行,没有样本进入效果统计;带`--require-complete`时工具按设计拒绝。
- 002396得到`todayConfirmedFamilyLimitGate=true`和`formalEligibilityBasis=confirmed-target-day-family-limit-up`,但07-02使`formalEligibilityGate=null`,未进入正式v3池,所以“进入正式池”验收未通过。301251的v2为第3/76分;v3当日仅保留互斥普通涨停15分、趋势0分,但因同一缺日不产生正式分或名次,未虚构名次变化。
- `strategy-daily-events`与`leader-scoring-v3`定向测试均通过;`--require-complete`阻断通过。主服务PID保持13772;本机/公网health=200。既有07-10事件档案及07-08/09/10冻结快照SHA与操作前完全一致。

Deployment:
- 只发生生产运行时“新增历史每日事件档案”和运维日志追加;没有部署代码、没有重启服务、没有修改正式v2榜。
- 云端日志回退备份:`C:\PandaDashboard\_deploy-backups\v3-preflight-logs-20260713-0025`。

Notes for next agent(Claude independent review):
- 请独立复核两点后回传结论:①07-02整日`complete=false`按当前评分器会阻断所有90只股票,这是预期的全局完整性闸还是应在不造数据前提下收窄为逐股证据闸;②历史L2全部`unscanned`时,事件生成器将“无确认明星证据的真实涨停”保守记普通15分,是否与三方定稿的`unscanned=dataMissing`边界一致。
- 同时核对完整池重建契约(90唯一`poolRank`,而非默认top30)及三组SHA。由于complete样本为0,不得根据knownPoints、下界分或v2名次宣称v3优劣。
- PR4继续暂停;只有独立复核、Owner确认完整性处理后才可建Draft,且v3只能挂影子字段,不得参与正式排序。

### Locked 90-row v2/v3 comparison

- 下表来自上述锁定输入与报告SHA。由于`complete=true`为0/90,`v3正式名次/分`必须全部为空;“历史已知分”和趋势分仅用于定位缺失,不得相加后冒充正式v3分数或效果结论。
- 事件缩写:`limit15`=目标日普通涨停15分,`none0`=该家族无目标日事件;`H:07-02`等为历史日缺失,`T:g10/g30`为趋势字段缺失。

|池序|代码|名称|v2正式名次/分|v3正式名次/分|历史已知分|目标日事件|趋势(g10/g30→分)|资格依据|complete|dataMissing|
|---:|---|---|---:|---:|---:|---|---|---|---|---|
|1|002396|星网锐捷|1/114|-/-|0|limit15|38.55/10.67→41.22|confirmed-target-day-family-limit-up|false|H:07-02|
|2|603661|恒林股份|2/86|-/-|0|limit15|9.11/8.41→11.21|confirmed-target-day-family-limit-up|false|H:07-02|
|3|301251|威尔高|3/76|-/-|0|limit15|-0.61/-5.79→0|confirmed-target-day-family-limit-up|false|H:07-02|
|4|002951|金时科技|4/70|-/-|0|limit15|-6.25/-15.83→0|confirmed-target-day-family-limit-up|false|H:07-02|
|5|002965|祥鑫科技|5/61|-/-|15|none0|23.68/44.88→34.90|-|false|H:07-02|
|6|000938|紫光股份|6/59|-/-|15|none0|16.98/1.63→17.39|-|false|H:07-02|
|7|000977|浪潮信息|7/58|-/-|0|limit15|11.03/2.69→11.70|confirmed-target-day-family-limit-up|false|H:07-02|
|8|000811|冰轮环境|8/54|-/-|30|none0|16.97/52.91→30.20|-|false|H:07-02|
|9|603956|威派格|9/54|-/-|30|none0|16.53/-11.49→16.53|-|false|H:07-02|
|10|002167|东方锆业|10/52|-/-|15|none0|14.45/74.73→33.13|-|false|H:07-02|
|11|300369|绿盟科技|11/51|-/-|0|limit15|-7.22/-22.75→0|confirmed-target-day-family-limit-up|false|H:07-02|
|12|301516|中远通|12/51|-/-|15|none0|22.27/-9.21→22.27|-|false|H:07-02|
|13|603861|白云电器|13/50|-/-|15|none0|7.27/-4.70→7.27|-|false|H:07-02|
|14|603950|长源东谷|14/49|-/-|30|none0|10.52/20.84→15.73|-|false|H:07-02|
|15|600172|黄河旋风|15/46|-/-|0|none0|8.32/51.86→21.28|-|false|H:07-02|
|16|603067|振华股份|16/46|-/-|15|none0|14.04/-3.24→14.04|-|false|H:07-02,H:07-06|
|17|300454|深信服|17/40|-/-|0|limit15|-7.71/-23.24→0|confirmed-target-day-family-limit-up|false|H:07-02|
|18|300017|网宿科技|18/40|-/-|0|limit15|-13.82/-27.82→0|confirmed-target-day-family-limit-up|false|H:07-02|
|19|002467|二六三|19/40|-/-|0|limit15|-18.08/-29.93→0|confirmed-target-day-family-limit-up|false|H:07-02|
|20|002642|荣联科技|20/40|-/-|0|limit15|-10.31/-31.34→0|confirmed-target-day-family-limit-up|false|H:07-02|
|21|600602|云赛智联|21/40|-/-|0|limit15|-16.11/-28.79→0|confirmed-target-day-family-limit-up|false|H:07-02|
|22|002757|南兴股份|22/40|-/-|0|limit15|-17.70/-38.18→0|confirmed-target-day-family-limit-up|false|H:07-02|
|23|603296|华勤技术|23/40|-/-|0|limit15|-6.43/-9.88→0|confirmed-target-day-family-limit-up|false|H:07-02|
|24|603496|恒为科技|24/40|-/-|0|limit15|-14.23/-17.03→0|confirmed-target-day-family-limit-up|false|H:07-02|
|25|600094|大名城|25/38|-/-|0|limit15|-0.78/-17.06→0|confirmed-target-day-family-limit-up|false|H:07-02|
|26|000892|欢瑞世纪|26/38|-/-|15|none0|-0.55/-12.74→0|-|false|H:07-02|
|27|002929|润建股份|27/34|-/-|30|none0|-3.07/-33.15→0|-|false|H:07-02|
|28|000818|航锦科技|28/34|-/-|45|none0|27.12/-4.77→27.12|-|false|H:07-02|
|29|002518|科士达|29/34|-/-|30|none0|-7.37/-23.54→0|-|false|H:07-02|
|30|002955|鸿合科技|30/34|-/-|15|none0|1.84/42.02→12.35|-|false|H:07-02|
|31|603019|中科曙光|31/34|-/-|30|none0|7.40/-2.68→7.40|-|false|H:07-02|
|32|603757|大元泵业|32/32|-/-|15|none0|9.35/21.67→14.77|-|false|H:07-02|
|33|603819|神力股份|33/30|-/-|15|none0|10.35/-4.41→10.35|-|false|H:07-02|
|34|301607|富特科技|34/30|-/-|15|none0|18.47/34.51→27.10|-|false|H:07-02|
|35|605060|联德股份|35/30|-/-|15|none0|7.08/1.38→7.42|-|false|H:07-02|
|36|000948|南天信息|36/24|-/-|0|limit15|-10.94/-17.49→0|confirmed-target-day-family-limit-up|false|H:07-02|
|37|002152|广电运通|37/24|-/-|0|limit15|-8.12/-17.70→0|confirmed-target-day-family-limit-up|false|H:07-02|
|38|002350|北京科锐|38/24|-/-|0|limit15|-3.11/-13.28→0|confirmed-target-day-family-limit-up|false|H:07-02|
|39|301202|朗威股份|39/24|-/-|0|limit15|-11.32/-23.46→0|confirmed-target-day-family-limit-up|false|H:07-02|
|40|600756|浪潮软件|40/24|-/-|0|limit15|-10.76/-24.39→0|confirmed-target-day-family-limit-up|false|H:07-02|
|41|603285|键邦股份|41/24|-/-|0|limit15|-11.96/-15.35→0|confirmed-target-day-family-limit-up|false|H:07-02|
|42|603339|四方科技|42/24|-/-|0|limit15|-3.43/4.23→1.06|confirmed-target-day-family-limit-up|false|H:07-02|
|43|603380|易德龙|43/24|-/-|0|limit15|0.26/6.73→1.94|confirmed-target-day-family-limit-up|false|H:07-02|
|44|603881|数据港|44/24|-/-|0|limit15|-17.60/-30.40→0|confirmed-target-day-family-limit-up|false|H:07-02|
|45|002042|华孚时尚|45/24|-/-|15|none0|-2.37/-24.78→0|-|false|H:07-02|
|46|301317|鑫磊股份|46/24|-/-|15|none0|-11.93/-30.29→0|-|false|H:07-02|
|47|603090|宏盛股份|47/24|-/-|15|none0|-9.62/-26.16→0|-|false|H:07-02|
|48|603269|海鸥股份|48/24|-/-|15|none0|-16.51/13.20→3.30|-|false|H:07-02|
|49|002536|飞龙股份|49/24|-/-|30|none0|17.92/16.67→22.09|-|false|H:07-02|
|50|002771|真视通|50/24|-/-|15|none0|-6.76/-0.88→0|-|false|H:07-02|
|51|600841|动力新科|51/24|-/-|15|none0|-3.98/-12.72→0|-|false|H:07-02|
|52|603798|康普顿|52/24|-/-|15|none0|-10.51/-16.94→0|-|false|H:07-02|
|53|000890|法尔胜|53/20|-/-|0|none0|-19.75/-36.39→0|-|false|H:07-02|
|54|001378|德冠新材|54/20|-/-|0|none0|-4.74/-9.83→0|-|false|H:07-02|
|55|002580|圣阳股份|55/20|-/-|15|none0|-19.02/-22.24→0|-|false|H:07-02|
|56|002798|帝欧水华|56/20|-/-|0|none0|-7.50/-35.84→0|-|false|H:07-02|
|57|002995|天地在线|57/20|-/-|0|none0|-17.07/-17.11→0|-|false|H:07-02|
|58|300071|福石控股|58/20|-/-|0|none0|-1.06/-15.23→0|-|false|H:07-02|
|59|600156|华升股份|59/20|-/-|0|none0|-5.48/-29.52→0|-|false|H:07-02|
|60|600449|宁夏建材|60/20|-/-|0|none0|6.40/-10.14→6.40|-|false|H:07-02|
|61|605286|同力天启|61/20|-/-|0|none0|-14.30/-35.47→0|-|false|H:07-02|
|62|002052|同洲电子|62/20|-/-|15|none0|-3.29/-26.23→0|-|false|H:07-02|
|63|002123|梦网科技|63/20|-/-|15|none0|5.03/-16.34→5.03|-|false|H:07-02|
|64|002313|日海智能|64/20|-/-|15|none0|-7.37/-23.06→0|-|false|H:07-02|
|65|003007|直真科技|65/20|-/-|15|none0|-3.17/-25.20→0|-|false|H:07-02|
|66|300287|飞利信|66/20|-/-|15|none0|-6.37/-21.40→0|-|false|H:07-02|
|67|600673|东阳光|67/20|-/-|15|none0|3.34/-8.85→3.34|-|false|H:07-02|
|68|600825|新华传媒|68/20|-/-|15|none0|-7.65/-12.57→0|-|false|H:07-02|
|69|605289|罗曼股份|69/20|-/-|15|none0|-8.76/11.64→2.91|-|false|H:07-02|
|70|000967|盈峰环境|70/20|-/-|30|none0|-3.69/-25.31→0|-|false|H:07-02|
|71|002600|领益智造|71/20|-/-|30|none0|-0.75/-0.99→0|-|false|H:07-02|
|72|002830|名雕股份|72/20|-/-|15|none0|-1.63/8.54→2.13|-|false|H:07-02|
|73|002849|威星智能|73/20|-/-|15|none0|-8.96/-12.94→0|-|false|H:07-02|
|74|300270|中威电子|74/20|-/-|15|none0|1.05/-12.93→1.05|-|false|H:07-02|
|75|300563|神宇股份|75/20|-/-|15|none0|-1.44/-8.19→0|-|false|H:07-02|
|76|600405|动力源|76/20|-/-|15|none0|null/null→null|-|false|H:07-02,T:g10,T:g30|
|77|603322|超讯科技|77/20|-/-|15|none0|-4.75/-21.16→0|-|false|H:07-02|
|78|603985|恒润股份|78/20|-/-|15|none0|-8.78/-11.50→0|-|false|H:07-02|
|79|002990|盛视科技|79/18|-/-|30|none0|10.87/12.01→13.87|-|false|H:07-02|
|80|603516|淳中科技|80/16|-/-|15|none0|-17.98/-7.06→0|-|false|H:07-02|
|81|001210|金房能源|81/16|-/-|15|none0|-13.37/-1.76→0|-|false|H:07-02|
|82|300264|佳创视讯|82/16|-/-|15|none0|-10.26/-17.56→0|-|false|H:07-02|
|83|600481|双良节能|83/16|-/-|15|none0|-1.77/-39.48→0|-|false|H:07-02|
|84|000034|神州数码|84/16|-/-|15|none0|6.68/-9.15→6.68|-|false|H:07-02|
|85|002558|巨人网络|85/16|-/-|15|none0|15.48/10.56→18.12|-|false|H:07-02|
|86|600186|莲花控股|86/16|-/-|15|none0|-22.76/-14.15→0|-|false|H:07-02|
|87|600516|方大炭素|87/16|-/-|15|none0|-14.56/5.41→1.35|-|false|H:07-02|
|88|605318|法狮龙|88/16|-/-|15|none0|-22.98/-2.44→0|-|false|H:07-02|
|89|603171|税友股份|-/16|-/-|0|none0|-14.06/-28.07→0|-|false|H:07-02|
|90|688561|奇安信|-/6|-/-|0|none0|-6.58/-22.30→0|-|false|H:07-02|

### Claude read-only sampling parameters

- 固定目标:`day=2026-07-08`,`familyKey=group:算力AI`,`themes=算力AI`,`gainAnchorDay=2026-07-07`;完整池代码按v2 `poolRank`顺序如下。

```text
002396,603661,301251,002951,002965,000938,000977,000811,603956,002167,300369,301516,603861,603950,600172,603067,300454,300017,002467,002642,600602,002757,603296,603496,600094,000892,002929,000818,002518,002955,603019,603757,603819,301607,605060,000948,002152,002350,301202,600756,603285,603339,603380,603881,002042,301317,603090,603269,002536,002771,600841,603798,000890,001378,002580,002798,002995,300071,600156,600449,605286,002052,002123,002313,003007,300287,600673,600825,605289,000967,002600,002830,002849,300270,300563,600405,603322,603985,002990,603516,001210,300264,600481,000034,002558,600186,600516,605318,603171,688561
```

- `/api/ai/strategy-evidence`每次最多20只;按以下5批抓取。`window=10`抽查10日事件/主因和gain10,`window=30`仅补查gain30收盘序列(旧滚动源缺失时必须照实保留`complete=false`)。Token只从`PANDA_AI_READONLY_TOKEN`环境变量读取。
  - batch1: `002396,603661,301251,002951,002965,000938,000977,000811,603956,002167,300369,301516,603861,603950,600172,603067,300454,300017,002467,002642`
  - batch2: `600602,002757,603296,603496,600094,000892,002929,000818,002518,002955,603019,603757,603819,301607,605060,000948,002152,002350,301202,600756`
  - batch3: `603285,603339,603380,603881,002042,301317,603090,603269,002536,002771,600841,603798,000890,001378,002580,002798,002995,300071,600156,600449`
  - batch4: `605286,002052,002123,002313,003007,300287,600673,600825,605289,000967,002600,002830,002849,300270,300563,600405,603322,603985,002990,603516`
  - batch5: `001210,300264,600481,000034,002558,600186,600516,605318,603171,688561`

```bash
node tools/capture-strategy-case.js --day=2026-07-08 --codes=<batch20> --themes=算力AI --window=10
node tools/capture-strategy-case.js --day=2026-07-08 --codes=<batch20> --themes=算力AI --window=30
```

- `/api/ai/strategy-mainline-review`每次最多10只;用于独立核对v2 `originalRank/leadScore`和目标日盘后算力AI归属,将同一清单依次每10只分为9批。
  - review1: `002396,603661,301251,002951,002965,000938,000977,000811,603956,002167`
  - review2: `300369,301516,603861,603950,600172,603067,300454,300017,002467,002642`
  - review3: `600602,002757,603296,603496,600094,000892,002929,000818,002518,002955`
  - review4: `603019,603757,603819,301607,605060,000948,002152,002350,301202,600756`
  - review5: `603285,603339,603380,603881,002042,301317,603090,603269,002536,002771`
  - review6: `600841,603798,000890,001378,002580,002798,002995,300071,600156,600449`
  - review7: `605286,002052,002123,002313,003007,300287,600673,600825,605289,000967`
  - review8: `002600,002830,002849,300270,300563,600405,603322,603985,002990,603516`
  - review9: `001210,300264,600481,000034,002558,600186,600516,605318,603171,688561`

```bash
node tools/capture-mainline-review.js --day=2026-07-08 --codes=<batch10>
```

- 能力边界:现有AI只读接口可独立抽查涨停、主因、收盘价、10/30日涨幅及v2池行,但当前不返回`strategy-daily-events`档案或v3评分结果。Claude可用这些原始字段逐项复核上表,却不能仅靠现有接口重新下载服务器上的同一锁定v3输入文件。复核时必须同时核对三组SHA与本表,不得声称已执行同文件完整重放。复核通过前不为此扩接口、不启动PR4。
- 只读连通性实测样本`002396,301251,000938,002965,600405,603067`:evidence `window=10`为HTTP200/complete=true/零缺失,hash=`61664387d20c499c313f198c6452af3b463f9570fa186fb3e45a3a2a6697a51c`;`window=30`为HTTP200/complete=false,仅缺已超滚动保留边界的05-27/05-28涨停与主因,hash=`0060ec60df86b4cf68176b07285965c9826e022733d7fe7d98d5bddec45cbdbe`;mainline-review为HTTP200/complete=true/零缺失,hash=`f8d325105d799438821b0f8c747996842d5d0fe29db6d88b7ac97fcfcea4c2fa`。测试只输出状态/哈希,未输出Token或证据正文。

## 2026-07-13 - Codex - 回填2026-07-09每日事件档案

Changed:
- 使用锁定main `7e028ea6fc73ca6384fc37e0e3af7e36ea41eedc`和正式`leader-scoring-v3-events-v1`生成器,只读生产来源回填07-09档案。
- 目标此前不存在;校验日期、规则版本和SHA后以add-only方式原子新增,未覆盖档案、预测或冻结快照。
- 三份云端运维日志已追加同一运行时变更记录。

Files:
- Git:`docs/DAILY_HANDOFF.md`
- 云端新增:`C:\PandaDashboard\strategy-data\strategy-daily-events-2026-07-09.json`
- 离线原件:`C:\PandaDashboard\_offline\main-7e028ea\tmp\pr36-v3-event-backfill-2026-07-09\events\strategy-daily-events-2026-07-09.json`

Validated:
- limit-up/main-reason/close三源质量均complete,主因缺码为空;管理员只读review为ok=true/complete=true/partial=false,10条主线且无requiredMissing。
- 家族归因覆盖率89.19%(66/74):ordinary15=66、dataMissing=8、star20=0、bigGain8=0;8只未归属代码为001395/002274/002414/300469/600418/603137/603329/603813。
- 盘后状态`no-qualified-mainline`;12个家族的L2均为`unscanned`,未倒推明星或大涨事件。档案SHA-256=`fd1b99111ba8575bfbbc1395d029dd2c559c2c3ce8e342bd8d55ec1d0c11ca64`。
- 07-09冻结快照和07-10既有事件档案SHA未变;主服务PID仍为13772,公网health=200。

Deployment:
- 仅新增07-09生产运行时事件档案并追加云端日志;未部署代码、未重启服务、未改v2榜或PR4。
- 云端日志备份:`C:\PandaDashboard\_deploy-backups\v3-event-0709-logs-20260713-0641`。

Notes for next agent:
- 该档案补齐后续目标日的历史窗口,但07-09晚于07-08,不会改变已锁定的07-08双跑;07-02缺快照阻断仍存在。
- 历史L2 `unscanned`如何影响普通15分仍按PR #36独立复核议题处理,本次没有自行修改评分规则。

## 2026-07-13 - Codex - 扩展06-16至06-23事件回填与07-01替代验收

Changed:
- 将v3上线前每日事件回填向前扩展到2026-06-16至06-23;交易日为06-16/17/18/22/23,06-19为非交易日且未创建空档案。
- 使用锁定main `7e028ea6fc73ca6384fc37e0e3af7e36ea41eedc`和正式`leader-scoring-v3-events-v1`生成器只读生产来源;5份目标均原先不存在,校验日期/schema/规则/SHA后add-only原子安装。
- 按Owner指定用07-01算力AI替代验收:管理员只读review分批追踪闭合74/74完整候选池,生成锁定输入并运行正式v3 replay及`--require-complete`闸。
- 07-01仍未形成可用正式对照:窗口中的06-23缺三份原始快照,档案必须保持`complete=false`,导致74行全部不完整。没有伪造快照、放宽完整性闸或自行修改评分规则;PR4继续暂停。

Files:
- Git:`docs/DAILY_HANDOFF.md`
- 云端新增:`C:\PandaDashboard\strategy-data\strategy-daily-events-2026-06-16.json`、`06-17`、`06-18`、`06-22`、`06-23`
- 云端隔离证据:`C:\PandaDashboard\_offline\main-7e028ea\tmp\pr37-v3-preflight-2026-07-01\`(不入Git)
- 云端日志:`_cloud-change-log.md`、`_cloud-change-log-20260705.md`、`panda-cloud-ops-2026-06-19.md`

Validated:
- 家族归因覆盖率及档案SHA-256:06-16 88.89%(104/116),`abb6e277905f43a991237acb33fb4570d0450dc8b909af31624531c13a0723da`;06-17 90.70%(78/85),`c4971e73d56d8bb89c6d20939cb61096f76587c9f0fc82b64aee859c21eb2e5d`;06-18 97.80%(89/91),`f804750914c7d2b7cd94c8db1a44f0f620287683fa33d40660dbf0f838b42228`;06-22 94.78%(127/132),`02fd2d36d34314e05fad2129bee9c78b30e58d7c76e1b9510a3b7e9224553afa`;06-23 88.54%(85/94),`1d4e9fd93f2d81b674492b63699bcd3e28fc71a3e41e1836f920cbb55f7d6910`。
- 五天涨停/主因/收盘来源质量均完整且主因缺码为空;06-16/17/18/22档案`complete=true`。06-23缺原始`snapshot-zs6/zs5/zs7`,云端目录及备份均无原件,因此档案如实`complete=false`;所有历史L2为`unscanned`,未虚构明星20分。
- 07-01管理员review声明`fullPoolCount=74/fullLeaderCount=74`,分批追踪取得74个唯一poolRank;历史窗口严格为06-16/17/18/22/23/24/25/26/29/30,趋势锚06-30。62/74可从生产持久化Kline缓存取得gain10/gain30。
- 锁定输入原始SHA-256=`13e3f2b1d392e077b4d284e550b0c0ea266b292ec4708577bbf17921f0365ed8`;规范化inputSha256=`5127f713ec0698b12f9ef9ed53d6dcda2c3cfd64d5096afffded1187ffbd82d6`;报告SHA-256=`c99d12fcc91f5e1b7611a7a98726a94b4b39ff4cdfe5371e9e25800572482b0d`。
- replay结果0/74 complete(0%):74行均缺`history:2026-06-23`;000839/002421/002803/002918/300735/600192/600234/600825/603322/603533/688323/688671另缺`trend:gain10`和`trend:gain30`。带`--require-complete`按设计退出1。
- 合规的v2/v3正式名次对照表为0行;报告中的v2原名次、history knownPoints和不完整趋势仅供定位证据,不进入效果统计,不得组成或宣传v3正式分数。
- 主服务PID部署前后均为13772,本机/公网health=200。07-08/09/10冻结快照SHA及07-10事件档案SHA完全未变。

Deployment:
- 生产仅新增5份历史事件档案并追加三份运维日志;未部署代码、未重启服务、未改冻结快照、正式v2榜或PR4。
- 云端日志回退备份:`C:\PandaDashboard\_deploy-backups\v3-preflight-0701-logs-20260713-0720`。

Notes for next agent(Claude independent review):
- 固定复核目标:`day=2026-07-01`,`familyKey=group:算力AI`,`gainAnchorDay=2026-06-30`;安全请求只使用日期和每批最多10只规范代码,Token仅从环境变量读取。
- review1:`000034,000534,000811,000818,000839,000889,000967,001210,001339,002046`
- review2:`002052,002123,002158,002167,002313,002418,002421,002432,002518,002536`
- review3:`002558,002580,002600,002631,002803,002830,002849,002871,002885,002918`
- review4:`002929,002955,002965,002990,003007,003018,300166,300264,300270,300287`
- review5:`300319,300563,300735,301396,301607,600186,600192,600234,600405,600481`
- review6:`600506,600516,600673,600825,603012,603019,603045,603067,603322,603496`
- review7:`603516,603533,603629,603757,603950,603956,603985,605060,605069,605168`
- review8:`605289,605318,688323,688671`
- 请独立核对74股确属07-01 review完整池、06-23原始快照确实不可恢复、12股趋势缺失原因,并复核“单个历史日全局complete=false是否应让全部个股不可评分”的语义。现有只读接口不返回云端锁定v3 JSON,不得声称执行了同文件重放。
- 本替代日没有弥补7-08的正式对照缺口。未经Owner确认完整性设计及Claude复核,不得启动PR4或让v3参与排序。

## 2026-07-13 - Codex - 旧 v1 前置回放记录归档说明

Changed:
- 将旧 PR #36 中尚未进入 `main` 的三段真实云端回填/回放记录原样并入当前交接，避免关闭冲突 PR 时丢失历史。
- 上述 v1 记录描述的是 P6 实施前的 `0/74`、`0/90` 全局阻断现状；最新结论以本文件前文“PR39/PR40 云端部署与 P6 v2 双跑验收”及 `docs/strategy/validation/2026-07-13-p6-events-v2-replay.md` 为准。

Deployment:
- 仅整理 Git 交接；未再次修改云端、未重启服务、未发起新的 L2 任务。PR4 仍暂停，等待 Claude 独立复核 P6 v2 锁定双跑。

## 2026-07-13 - Codex - 修正v3十日窗口与跨题材涨停计分

Changed:
- 按Owner定稿把滚动10日从“目标日前10日另加当天”修正为严格“前9个交易日+目标日”,总窗口恰好10日。
- gain10/gain30改为目标日内含:盘中要求目标日实时价及asOf,盘后要求目标日最终收盘价及asOf;前一交易日锚不再通过完整性闸。
- 将主线家族资格与真实涨停活跃度分离:窗口内至少一次可靠同族涨停确认资格后,该股窗口内所有可靠真实涨停按当日明星20/普通15计分,不因某日细分主因归到另一家族而漏算;同日仍严格互斥。
- 主因家族缺失但涨停事实可靠的日,只有在窗口内另一日已确认目标家族后才恢复普通15分下界,不虚构明星20分。评分消费者版本升级为`leader-scoring-v3-shadow-v3`,事件档案规则仍为events-v2且不改写。

Files:
- `strategy-leader-scoring-v3.js`
- `tests/leader-scoring-v3.test.js`
- `tests/strategy-daily-events-v2.test.js`
- `docs/strategy/discussions/2026-07-12-leader-scoring-v3.md`
- `docs/strategy/LEADER_SCORING_V3_EVENTS_V2_SPEC.md`
- `docs/strategy/validation/2026-07-13-v3-inclusive-window-replay.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 锁定07-08算力AI完整池90股;原始证据raw SHA=`218ba6028bb1f44b1e85006301842c2cd84f1246afafc3a283508ba6022665a5`,新口径派生输入canonical SHA=`fa8e31b6fda6057694c743faf2ec2d3382f7764ec077203ed93c31fa4874b3c2`;除目标日内含涨幅/锚/对应tie-break字段外,其余证据规范化SHA两边均为`b60e47aeec9eecd934a41dcf8c9784fef1298d637f654893a6a8dd2e10aca7ec`。
- 完整86/90、正式84、缺失4与P6锁定回放一致,未放松完整性闸。紫光股份两次真实涨停计30、趋势25.70、总55.70、完整池第5;航锦科技06-24出窗后两次涨停计30、趋势5.42、总35.42、第17。
- `node --check`通过;`leader-scoring-v3`和`strategy-daily-events-v2`定向测试通过;全量`tests/*.test.js`全部通过。

Deployment:
- Git代码和文档变更,尚未部署云端、未重启服务、未改运行时事件档案/冻结快照/正式v2榜,PR4仍未启动。

Notes for next agent:
- 请使用同一canonical SHA复核完整池,重点检查紫光06-30跨族普通涨停、07-06算力涨停及航锦06-24出窗;不得用手工股票特判解释结果。
- 后续PR4/实时调用方必须显式提供`gainPriceState`和`gainAsOf`;盘中使用当日实时价,盘后使用当日终盘价。正式v2取数路径继续冻结,Owner再次批准前v3不得参与线上排序。
## 2026-07-13 - Codex - 修正v2目标日价格与日期口径

Changed:
- 保留正确的10/30交易日累计收益基准:窗口包含目标日,但收益基准是窗口首日前一交易日收盘;未误改成首日收盘。
- v2盘中使用目标日实时价/实时涨幅,盘后只使用日期匹配、完整且收盘后保存的目标日收盘库;历史缺失不再退回残留`gain`冒充。
- 评分、排序、诊断和说明统一读取显式`targetDayGain`;修复紫光7月8日已有`todayGain=6.8%`却漏掉6分在场分的问题。
- 更新前端和响应元数据,明确10/30日涨幅盘中含目标日实时、盘后含目标日最终收盘。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/leader-family-metrics.test.js`
- `tests/leader-pool-debug.test.js`
- `tests/metric-profile.test.js`
- `docs/strategy/validation/2026-07-13-v2-target-day-inclusive.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 锁定证据参数:`day=2026-07-08`,`familyKey=group:算力AI`,`code=000938`;90股原始证据SHA-256=`0511d6e7ff2ce3fbe95217612f7a6cc6273037ff83551fcbb29de1c3d6e5bcd8`,规范输入SHA-256=`fa8e31b6fda6057694c743faf2ec2d3382f7764ec077203ed93c31fa4874b3c2`。
- 只读核对云端收盘库:紫光06-24=`27.66`,06-25=`28.39`,07-08=`33.62/+6.8%`;10交易日累计涨幅必须为`33.62/27.66-1=21.55%`,不能错用06-25收盘得到18.42%。
- 锁定v2行由59分补回在场6分为65分,预期由第6升至第5;权重、硬门槛、涨停次数和家族规则均未修改。
- `node --check kpl-stats-server.js`、三个针对性测试及指标口径测试通过;全部21个`tests/*.test.js`文件通过。

Deployment:
- 未部署云端,未修改生产文件/运行时数据库/冻结快照,未重启服务;仅通过SSH只读核验证据。

Notes for next agent:
- 请独立复核“10个交易日事件窗口”与“10日累计收益基准收盘”两个概念,不要把06-25首日收盘误当收益基准。
- 合并和部署前应使用相同证据参数复核紫光目标日涨幅、v2在场分和历史缺失不回退行为。

## 2026-07-13 - Codex - 去除v2同一涨停重复积分

Changed:
- 按 Owner 裁定,目标日涨停只通过`zt10Count`计分一次;涨停股不再叠加“当日在场+6”“当日涨停+10”“连板每板+8”和“早封+6”。
- `present +6`仅用于目标日未涨停但上涨≥3%的股票;连板和封板时间继续展示,不参与龙头总分。
- L2明星信号暂保留为独立资金证据,本次未改变主因硬门槛、家族归属和10日涨停事实。
- 用同一份7月8日算力AI 90股锁定池重算,前五变为:星网锐捷84、紫光股份65、恒林股份62、祥鑫科技61、长源东谷55。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/leader-pool-debug.test.js`
- `docs/strategy/validation/2026-07-13-v2-target-day-inclusive.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增回归证明:同一股票从当日一板改为二板、保留09:30封板时间,总分不变;今日涨停/二板文字仍正常展示。
- 锁定证据 SHA-256=`0511d6e7ff2ce3fbe95217612f7a6cc6273037ff83551fcbb29de1c3d6e5bcd8`;未更换候选池或行情证据。
- `git diff --check`、`node --check kpl-stats-server.js`通过;全部21个`tests/*.test.js`文件通过。

Deployment:
- 未部署云端,未修改生产文件/运行时数据库/冻结快照,未重启服务;PR #43 需重新独立复核。

## 2026-07-13 - Codex - v2涨停分取消封顶并收紧在场阈值

Changed:
- 按 Owner 最新裁定,`zt10Count`改为每次涨停14分且不封顶;仍保证同一目标日涨停只计一次。
- 未涨停股票的目标日在场奖励由涨幅≥3%收紧为≥5%加6分;涨停股票即使涨幅超过5%也不重复取得该奖励。
- 连板与早封继续仅展示;L2明星信号、主因硬门槛、家族归属不变。
- 同一90股锁定池重算前五:星网锐捷114、紫光股份65、恒林股份62、祥鑫科技61、威派格56。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/leader-pool-debug.test.js`
- `docs/strategy/validation/2026-07-13-v2-target-day-inclusive.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增回归证明近10日5次涨停按`5×14=70`计分,不再封顶40。
- 新增4.99%/5.00%阈值边界测试;只有未涨停且达到5.00%才增加6分。
- 锁定证据 SHA-256=`0511d6e7ff2ce3fbe95217612f7a6cc6273037ff83551fcbb29de1c3d6e5bcd8`,候选池与行情证据未改变。
- `git diff --check`、`node --check kpl-stats-server.js`通过;全部21个`tests/*.test.js`文件通过。

Deployment:
- 未部署云端,未改生产数据库或冻结快照,未重启服务;PR #43 必须按最新提交重新复核。
## 2026-07-13 - Codex - 修复 L2 扫描完成但策略页不可见

Changed:
- 为管理员策略页新增“今日 L2 扫描记录”，展示当日自动/手动任务、状态、扫描与入选数量，并可展开查看入选股票的五档主动/被动比值。
- 扫描队列新增按日历史读取与“最近一次有效结果”查询；后发的空任务不再遮蔽同板块较早的有效任务。
- 主线明星回接同时支持精确板块 ID 和标准主线家族，解决 KPL、东财、同花顺板块 ID 不同导致任务已完成却无法挂回主线卡片的问题；最终仍用本主线股票集合做交集，防止跨题材错挂。
- 自动任务开始记录 trigger、familyKey、scanChannel 和 zsType，历史旧任务按 legacy 兼容读取。
- L2 日历史接口只允许管理员访问，返回前继续移除任务原始成分股和 worker 标识。

Files:
- `local-l2-task-queue.js`
- `strategy-backend.js`
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/local-l2-persistence.test.js`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`
- `node --check local-l2-task-queue.js`
- `node --check strategy-backend.js`
- 全部 21 套 `tests/*.test.js` 通过。
- 新增回归覆盖：空重试不遮蔽有效结果、重启后历史恢复、跨来源同家族挂载、无关家族隔离、管理员接口与前端权限门控、HTML 内联脚本编译。

Deployment:
- PR #44 已合并至 `main@c4a5f3c`，四个运行文件已原子部署到 `C:\PandaDashboard`；回退备份为 `C:\PandaDashboard\_deploy-backups\pr44-l2-visible-20260713-2058`。
- 仅重启计划任务 `Panda Dashboard Server`，主服务 PID `2836 -> 8188`；Caddy、娱乐服务和公司端 L2 worker 均未重启。
- 本机/公网 health、`/kpl`、`/admin` 均为 HTTP 200；未登录请求 L2 日历史接口返回 403。使用服务器内有效管理员会话仅在本机验收接口：07-13 共 6 个任务、5 个有结果，创新药有效任务 41 条结果/20 条入选，后续空任务仍同时保留但不再遮蔽有效结果。
- 三份云端运维日志已追加部署、备份、重启和验收结果；未记录 Token 或管理员会话值。

Notes for next agent:
- 2026-07-13 生产上已有一份创新药自动任务完成 41/41，后续另有同板块空手动任务；它是本修复“有效任务不得被空任务遮蔽”的真实验收样本。
- 07-13 已收盘主线榜继续读取既有冻结快照，因此不改写当日历史主线卡片；管理员扫描记录已立即可见，跨来源主线回接从下一次实时构建起生效。
- 本次只修结果可见性和回接，不改变 L2 阈值、明星判定、主线评分或 worker 计算逻辑。

## 2026-07-13 - Codex - 补全 L2 扫描记录五档金额明细

Changed:
- 将管理员“今日 L2 扫描记录”的五档展开内容由仅显示主动/被动比值，补全为与“重点关注”一致的主动买、主动卖、被动买、被动卖具体金额及对应比值。
- 增加主动按单笔成交、被动按同一挂单订单号累计的口径说明；不改变任务结果、筛选阈值或明星判定。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node tests/star-l2-layers.test.js` 通过。
- 全部 21 套 `tests/*.test.js` 通过；HTML 内联脚本编译检查通过，`git diff --check` 无误。

Deployment:
- PR #46 已合并至 `main@6a26602`；`kpl-dashboard_17_apple.html` 已部署到 `C:\PandaDashboard`，回退备份为 `C:\PandaDashboard\_deploy-backups\pr46-l2-history-details-20260713-2255`。
- 部署后文件 SHA-256 为 `CBCCBE1BDDEE4AD4FC53B9D78AB47E0A652FF08225571D77046890597DB34746`；公网 `/kpl` 已包含金额明细，`/health` 返回正常。
- 仅静态页面更新，未重启主服务、Caddy、娱乐服务或公司端 L2 worker；三份云端运维日志均已追加本次备份、部署和验收记录。

## 2026-07-13 - Codex - 主线明星硬闸、预判回看扩展与 TGB 日更

Changed:
- 明星确认与预期明星统一要求该股自身最大可统计档主动买累计不少于 3 亿元；封板但最大档金额不足、最大档字段缺失或现价缺失时只标记证据不足，不再回退小档或用最高非零档确认明星。
- 新增主线 L2 硬闸：相关扫描尚未完成或覆盖不足时继续保留候选；扫描已完成、覆盖达标且没有预期明星/明星确认时，板块从当日主线榜排除并返回可审计原因。2026-07-13 医药真实任务 41/41 完成，旧口径下的 3 只“确认”最大档主动买仅约 0.46 亿、0.46 亿、0.12 亿元，新口径下合格明星为 0。
- 盘中预测记录开始保存前两名龙头候选，同时保留旧 `leader` 字段兼容历史文件。
- 预判回看扩展为前两名龙头，逐股展示下一交易日最高涨幅、下一交易日收盘涨幅和第三个后续交易日收盘涨跌幅；次日最高读取复权日 K，收盘指标读取每日收盘价库。
- 2026-07-13 淘股吧湖南人正式来源按固定 SOP 手工结构化入云：文章 `2toMnuZPt5y` 的官方白底涨停表，27 只终盘涨停全部匹配云端底库，医药 8、半导体 4、业绩 3、其他 12；未使用同花顺图片、市场连板图、炸板表、回帖或 OCR 猜测。
- 7 月 8 日历史预测记录的算力AI龙头迁移方案锁定为当前正式 v2 前两名：星网锐捷 002396/114 分、紫光股份 000938/65 分；部署时只改该运行时预测文件，先备份，不改冻结快照。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `tests/qi-mainline-states.test.js`
- `tests/predict-records.test.js`
- `tests/mainline-review.test.js`
- `tests/inflow-gate.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 目标测试覆盖最大档不足 3 亿、最大档缺失、扫描完成无明星硬排除、两名龙头落盘和三项回看收益；全部通过。
- `node --check kpl-stats-server.js`、`git diff --check`、全部 21 个 `tests/*.test.js` 文件通过；行情页内联脚本编译通过。
- TGB 源文件与云端底库核对 missing/extra/duplicate/weak/name mismatch 均为 0；结构化源和综合主因库均为 27/27、覆盖 100%。生产源文件 SHA-256=`291d1364922f03a94e3fcf4af82f90d3101ffe2a341e5fd3b2a84a042f519558`。

Deployment:
- TGB 2026-07-13 运行时源文件已写入云端并强制重建当天综合主因库；未重启服务。
- PR #49 已合并至 `main@ea8363b`。随后统一部署 PR #42、#43、#49 的 `kpl-stats-server.js`、`kpl-dashboard_17_apple.html`、`strategy-leader-scoring-v3.js`；部署后 SHA-256 依次为 `03C831CD90111D37893BEC0F9F55A0132BF1982176E4507F98DE1454D8A9E479`、`02F18A4FC60D7388196AAA3B5420A505D8AE38D5A6229801E8EBA6F9777B6E2D`、`9EDFF25F726C023A63C03E981206E81B984357A46A8866634AA4299A98B0EB50`。
- 成功回退备份为 `C:\PandaDashboard\_deploy-backups\pr42-pr43-pr49-mainline-review-20260714-012223`，包含三份旧运行文件与迁移前的 7 月 8 日预测记录。Windows 首次不兼容 `File.Replace` 时自动回滚并验证健康，兼容方式二次部署成功；首次尝试备份 `...-012048` 同样保留。
- 仅重启计划任务 `Panda Dashboard Server`，主服务 PID `7252 -> 12724`；Caddy、娱乐服务和公司端 L2 worker 均未重启。公网 `/health`、`/kpl`、`/admin` 均为 HTTP 200。
- 7 月 8 日运行时预测记录只迁移算力AI一行：兼容 `leader` 为星网锐捷，`leaders` 为星网锐捷 114 分、紫光股份 65 分；新文件 SHA-256=`33AE267E9426E2DEDF0B5F37FDA7E66C6081034085F270B5EBF2651027A9F3B2`，未改冻结快照。
- 公网回看验收：星网锐捷次高 `+0.34%`、次收 `-0.48%`、3日 `-0.38%`；紫光股份次高 `+6.34%`、次收 `+6.13%`、3日 `+14.22%`。医药真实任务按部署代码复算合格明星 `0/41`；7 月 13 日旧预测继续保留作当时预测的真实审计证据，不倒改历史，硬闸从后续实时构建生效。
- 三份云端运维日志已追加备份、回滚尝试、成功部署、重启、数据迁移和验收记录；未记录 Token、Cookie、账号或管理员会话。

Notes for next agent:
- “封板”不是明星确认的替代条件；该股自己的最大可统计档必须同时满足比值规则和主动买累计不少于 3 亿元。
- L2 未扫描不等于无明星。硬排除只允许发生在相关任务完成且成分覆盖达标之后，不能因为 worker 尚未返回就提前移除主线。
- 预判回看的 3 日指标指第三个后续交易日收盘相对预判日收盘的累计涨跌幅，不是三个自然日。

## 2026-07-14 - Codex - 预判回看无明星时显示今日无主线

Changed:
- 将盘中候选档案与预判回看的“正式主线”分离：schema v2 记录只有存在 L2 预期明星或明星确认正证据时，才能进入正式主线回看。
- `unscanned`、`scanned-no-star` 和仅 `active` 的候选继续保留作审计，但不再产生正式主线、明星、龙头或主线命中统计。
- 预判记录的 `top` 从本次起直接保存 `l2VerificationStatus`；旧 schema v1 档案因缺少可验证字段继续按历史口径展示，不反向伪造结论。
- 行情页对无正式主线的日期明确显示“今日无主线”，并提示候选未通过 L2 明星验证。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/mainline-review.test.js`
- `tests/predict-records.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端真实 `mainline-predict-2026-07-13.json` 的原始前三为医药、特色药、独家药品，但三者均为 `unscanned` 且无明星正证据，按新口径 `formalTop=[]`。
- 全部 21 个 `tests/*.test.js` 文件通过，新增回归锁定 2026-07-13 显示“今日无主线”、明星/龙头为空且不进入命中判断。
- `node --check kpl-stats-server.js`、`git diff --check` 和行情页内联脚本编译均通过。

Deployment:
- PR #51 已合并至 `main@fc5d097`；部署前确认云端两份运行文件与上一版 `main@68764ed` SHA-256 完全一致，无云端漂移。
- `kpl-stats-server.js` 与 `kpl-dashboard_17_apple.html` 已部署到 `C:\PandaDashboard`；回退备份为 `C:\PandaDashboard\_deploy-backups\pr51-review-no-mainline-20260714-0800`。
- 仅重启计划任务 `Panda Dashboard Server`，主服务 PID `12724 -> 11640`；Caddy、娱乐服务和公司端 L2 worker 均未重启。
- 公网 `/health` 正常；预判回看接口对 2026-07-13 返回 `noMainline=true`、主题为空、明星/龙头为空、命中结果为空。未改写原始预测档案、冻结快照、L2 任务或业务数据库。
- 三份云端运维日志均已追加本次备份、部署、重启和验收记录，未记录 Token、Cookie、账号或管理员会话。

Notes for next agent:
- 盘中“候选方向”仍可在今日主线实时分析中出现；回看中的“正式主线”必须有 expected/confirmed 明星正证据，两者不要再混用。
- 2026-07-13 的原始医药预测文件保持不变作为审计证据，展示层根据其已保存的候选状态得出“今日无主线”。
## 2026-07-13 - Claude - P1 板块跨日污染止血(草案 PR,待 Codex 复核)

Changed:
- 起点:07-02 综合快照被证实携带 07-01 东财资金(券商 BK0711 +106.34亿=昨值)。根因:`getStrategyBoardsForDay` 默认 allowFallback=true → `resolveStrategySnapshotDay` 回退最近有快照的交易日 → `buildPayload` 对非当日(历史/重建)以 allowFallback 取到昨日板块,`saveSnapshot` 写进目标日文件名。
- 更正:盘中实时主线路径(kpl-stats-server.js:24894,allowFallback:false+liveIfMissing)本就安全,不会拿昨日冒充今日;污染只发生在历史/重建的复合快照写入。危害是持续腐蚀历史存档与回测可比性,非实时误导。
- 修:①`getStrategyBoardsForDay` 给每块板块标 `sourceDay`(快照读=useDay,实时=requestedDay)②`strategy-backend.buildPayload` 检测 boardsSourceDay≠day 即判 `boardsStale`,抑制板块/strong/focus指标/qiBoard(避免 QI 聚合二次回退绕回污染),落盘为诚实空档并带 `boardsSourceDay/boardsStale/boardsUnavailableReason`,绝不把回退数据当本日事实 ③新增 `tools/scan-board-snapshot-contamination.js` 离线普查:逐板 netInflow+gainPct+ztCount 联合相等(排除0/null假相等)判 suspected-stale,产出判别联合 contaminated 清单条目。

Files:
- kpl-stats-server.js(板块 sourceDay 标注,2 处)
- strategy-backend.js(buildPayload 跨日抑制)
- tools/scan-board-snapshot-contamination.js(新增,只读普查)
- tests/board-snapshot-contamination.test.js(新增,14 断言)

Validated:
- node --check 三文件通过;新测试 14/14;全仓 22 个测试文件全过。
- 未部署、未重启、未改任何现存快照文件;普查工具只读。

Notes for next agent(Codex 复核):
- 行为变更仅限「历史/重建日无自有快照」场景:原本静默显示昨日板块,现改为诚实空档 + boardsStale 标记。今日路径(allowFallback:false)不受影响。
- 建议合并后在云端跑 `node tools/scan-board-snapshot-contamination.js --emit-manifest` 对全部历史 snapshots 普查,把命中日并入 data-quality 清单(P6 的 SNAP 层即可自动隔离)。
- 顺带发现(未修,超出本 PR 范围):`createStrategyBackend` 第 198 行 `canRunL2Scan` 默认分支引用尚未初始化的 `isAdmin`(const TDZ),仅在未注入 canRunL2Scan 时触发;生产始终注入故不发作,建议后续把 `const isAdmin` 提到引用之前。

## 2026-07-14 - Codex - 合并并部署 PR #48 板块跨日污染止血

Changed:
- 复核并合并 PR #48；历史/重建日板块回退数据现在携带真实 `sourceDay`，跨日或来源未知的行不会再冒充目标日事实，且不会通过 QI 聚合二次回退绕回。
- 云端新增只读普查工具并扫描 18 个复合快照日，识别出 7 个逐板资金、涨幅和涨停数与前一存档日完全相同的跨日复制日：2026-06-27、06-28、06-29、07-01、07-03、07-05、07-06；`suppressed=0`。
- 将普查结果按 `targetDay + path` 结构化合并进现有质量清单：旧 10 条全部原样保留，新增 7 条后共 17 条（missing 9、contaminated 8）；没有改写或删除任何原始、复合、冻结快照。

Files:
- `kpl-stats-server.js`
- `strategy-backend.js`
- `tools/scan-board-snapshot-contamination.js`
- `strategy-data/strategy-data-quality.json`（仅云端运行时，不入 Git）
- 三份云端运维日志（仅云端运行时）
- `docs/DAILY_HANDOFF.md`

Validated:
- PR 最终 head `28c0052` 与上一轮已审功能补丁 patch-id 完全一致；`git diff --check`、专项 32 项、全仓 22 个测试文件通过。
- 部署前云端两份运行文件与 prior main `24ca370` 哈希完全一致，确认无云端漂移；上传后再次校验三份文件 SHA-256，并在云端完成 `node --check`。
- 公网 `/health`、`/kpl`、`/admin` 和 `dreamerqi.com` 均为 HTTP 200；2026-07-13 预判回看仍返回 `noMainline=true`、无正式明星/龙头。
- 质量加载器验收：2026-07-01、07-02、07-03 均为 `quarantined / snapshotUsable=false`；干净对照日 2026-07-10 仍为 `ok / snapshotUsable=true`。

Deployment:
- PR #48 已合并至 `main@33aad213156290c2f64d183557d3fcb7016b171b`。
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr48-cross-day-20260714-085506`，包含旧运行文件、旧质量清单和三份日志备份。
- 部署后 SHA-256：`kpl-stats-server.js=35F8D4BD6ED2E895D137DAFB1F7B212845631011236830DE3306BAF1DE684B2F`，`strategy-backend.js=418FE8F6DF006972DE7BB54D740AB73E64D6A2F729B90289826907104A9B1FAA`，普查工具 `CA56B6223307FDD5B3972A8F003B1DC8DE88591705684B40D2A67AC773C49A92`。
- 仅重启 `Panda Dashboard Server`，PID `11640 -> 12756`；Caddy、娱乐服务和公司端 L2 worker 均未重启。
- 质量清单 SHA-256：合并前 `1EDD7EBD05CB288449C9ED91E648755D1C4FE94A4C833EEF3AFC38F2787FE2A7`，合并后 `8699D2218052C2CF87BC233579C4B8901581FC45523511A9005F8730871CD978`；所有 contaminated 证据 SHA 均在安装前与云端原文件逐项核对。
- 三份云端日志已记录完整部署、备份、扫描、清单合并和验收信息；未记录任何 Token、Cookie、账号或管理员会话。

Notes for next agent:
- `--emit-manifest` 只输出本次扫描 entries；以后再次运行时必须与现有质量清单按键合并，禁止重定向覆盖整个文件。
- 周末遗留复合快照也被记录为污染证据，但非交易日不会进入正常交易日评分；保留这些条目用于审计，不删除历史原件。

## 2026-07-14 - Codex - 同花顺实时主线名称、资金口径与成分股读取修正

Changed:
- 实时同花顺细分板块不再被宽口径分类覆盖：例如“医药电商”继续显示原板块名，仅在内部家族键中归并至医药。
- 主线种子和家族合并均停止叠加成分高度重叠的概念板资金；统一采用单个净流入最高的代表板块值，并保留板块名、`zsType` 和 `representative-board-max` 口径元数据。
- 策略卡片显示“资金口径 板块名·来源（单板）”，AI 只读证据接口同步携带来源及聚合口径。
- 同花顺成分股优先读取云端持久化板块成员库，只刷新实时行情；持久化库不存在时才抓多页网页，并增加30分钟成员缓存，避免20至30秒网页请求被策略1.5秒保护超时反复丢为空数组。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/ths-strategy-correctness.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端旧口径实证：2026-07-14“算力AI”显示35.58亿元，来自CPO 101.25亿元、AI应用-41.84亿元、液冷-23.84亿元直接相加，并非任何真实板块原始值；修正后将显示单一代表板块及来源。
- 新增专项测试覆盖细分名称、代表单板资金、来源保留、持久化成员库优先级及前端脚本编译；全仓23个测试文件全部通过，`node --check` 与 `git diff --check` 通过。

Deployment:
- PR #55 已合并至 `main@5e7f33ec8af735e23ee5978bb726f5932b7a739e` 并部署云端；部署前两份运行文件与基线 `main@7a08ec55` 哈希完全一致，无云端漂移。
- 回退备份为 `C:\PandaDashboard\_deploy-backups\pr55-ths-20260714-175544`；仅重启 `Panda Dashboard Server`，PID `12756 -> 2864`，未重启 Caddy、娱乐服务或公司端 L2 worker。
- 公网 `/health`、`/kpl`、`/admin`、主页均为 HTTP 200；同花顺 `301565` 成分接口由部署前约26秒/49只改善为0.21秒/169只；两份云端运维日志均已追加，未改运行时数据库。

Notes for next agent:
- 本次没有改同花顺原始 `zjjlr` 单位；官方原始排名中该字段按亿元返回，现有乘以 `1e8` 的转换正确。
- 持久化板块成员库解决盘中超时，但其历史更新时间仍需由每日同花顺板块同步任务持续维护；不得把成员库的新鲜度与实时资金值的新鲜度混为一谈。

## 2026-07-14 - Codex - Deploy PR #57 frozen strategy inflow display

Changed:
- Deployed the already-merged PR #57 frontend fix to production. This is the follow-up to PR #55 for old frozen strategy snapshots: cards now display a representative source-board inflow from `resonanceBoards` instead of the legacy overlapping-board summed value.

Files:
- kpl-dashboard_17_apple.html deployed to `C:\PandaDashboard` only; no source code change in this handoff entry.

Validated:
- Public `/kpl` SHA-256 is `8d6e4726aeeea4a2b7b5b08ff137de895fb0befdbe03a9c50b5ed52313568adb` and includes `strategyMainlineDisplayInflow`.
- Public `/health` returned HTTP 200.

Deployment:
- Production touched: yes. Backup `C:\PandaDashboard\_deploy-backups\pr57-frozen-inflow-20260714-204209`.
- Service restart: no. Main Node PID remained `2864`; Caddy, yule-server, and company L2 worker were not restarted.

Notes for next agent:
- PR #57 is display-only. It does not rewrite frozen snapshots or change strategy ranking, L2, prediction records, user data, or any runtime database.

## 2026-07-13 - Claude - 涨停复盘:搜索个股当日未涨停时自动跳到最近涨停日

Changed:
- 需求(Owner):在涨停复盘搜个股,若当日未涨停,下方涨停明细表自动跳到该股最近一次涨停日(如搜紫光股份→跳到 7-06),搜索词保留使该股直接出现在表里。Owner 选定「自动跳」方案。
- 实现(纯前端,kpl-dashboard_17_apple.html,仅 review 页):`loadReviewStockDetail` 拿到个股详情后调用新函数 `maybeAutoJumpToRecentLimitUp(data, day)`——仅在搜索态、该股当日未涨停(`!data.isSelectedDay`)、有更早 `data.referenceDay` 且 ≠ 当前复盘日时,设 `state.reviewDateOverride=referenceDay` 并 `refreshLimitupReviewPage()`(内部 setDatePickerValue + 重渲染)。
- 防坑:用 `state.reviewAutoJumpKey='搜索词@最近涨停日'` 去重——手动把日期切回其它日不会被反复拽走;跳到目标日后该股当日已涨停(isSelectedDay=true)→ 不再二次跳,无循环。referenceDay/isSelectedDay 复用后端 `/api/limit-up-main-reason-db/stock` 已有字段,无接口改动。

Files:
- kpl-dashboard_17_apple.html(state 新增 reviewAutoJumpKey;新增 maybeAutoJumpToRecentLimitUp;loadReviewStockDetail 调用)
- docs/DAILY_HANDOFF.md

Validated:
- 内联脚本 node --check 通过;dashboard 相关测试(qi-mainline-states/metric-profile/star-l2-layers/static-cache-auth-hardening)通过;全仓 22 个测试文件全过。
- 逻辑推演(紫光 7-14 搜索→跳 7-06)稳定无循环;仅 review 页行为,不涉数据/接口/其它页。

Deployment:
- 未部署;纯前端静态改动,合并后需部署 kpl-dashboard_17_apple.html,无需重启 Node 服务。

Notes for next agent(Codex 复核):
- 重点:自动跳只在搜索态触发;reviewAutoJumpKey 去重防手动切日被反复拽;无二次跳循环。
- 若 Owner 后续想要「点按钮跳」而非自动,改为在卡片渲染一个链接调用同一逻辑即可。

## 2026-07-13 - Claude - 涨停复盘:卡片涨停日可点切换(方案 B,叠加在自动跳之上)

Changed:
- Owner 选定方案 B:保留搜索自动跳最近涨停日,同时把卡片近10天轨迹里的**每个涨停日格子做成可点**——点哪天就把下方明细切到哪天(可达任意历史涨停日,非仅最近);当前复盘日在轨迹上高亮(accent 环)。
- 新增全局 `switchReviewDayFromCard(day)`:设 reviewDateOverride 并 refresh;并把 reviewAutoJumpKey 置为「搜索词@点选日」→ 手点后自动跳不会把它再拽走。未涨停日格子保持不可点。

Files: kpl-dashboard_17_apple.html(renderReviewStockDetailHTML 轨迹格子可点+高亮;新增 switchReviewDayFromCard)、docs/DAILY_HANDOFF.md

Validated: 内联脚本 node --check 通过;dashboard 测试 + 全仓 22 文件全过。纯前端 review 页,无接口改动。

## 2026-07-14 - Codex - 主线确认状态动态叠加与错误反馈

Changed:
- 修复管理员确认记录已写入、但冻结快照和缓存主线响应仍返回 `confirmedMainline:null` 的问题；接口读取时动态叠加确认记录，不改写冻结快照。
- 公开主线接口与 AI 只读策略接口使用同一确认口径；取消确认后旧快照上的确认标志也会立即清除。
- 前端确认/取消操作不再静默吞掉 403、登录失效或网络错误，管理员会看到明确失败原因。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/mainline-confirm.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- `node tests/mainline-confirm.test.js` 与前端内联脚本编译检查通过。

Deployment:
- 本条记录提交时尚未部署；合并后需原子部署后端与行情页并重启主服务，随后用已存在的 2026-07-14 确认记录验证冻结响应。

Notes for next agent:
- 确认状态是管理员可变状态，不属于冻结快照历史事实；以后不得把它永久烘焙进快照后停止动态读取。

## 2026-07-14 - Codex - 部署 PR #53 与 PR #59 主线确认修复

Changed:
- 复核 `f7bae7a` 后确认 PR #59 已由外部合并至 `main@89f96988dfc00801c5befce8376c322743c45a1b`；本次没有重复创建 PR。
- 从确认后的 `main` 同时部署 `kpl-stats-server.js` 与 `kpl-dashboard_17_apple.html`，因此云端也已包含此前仅合并未部署的 PR #53 复盘卡片日期切换功能。
- 冻结/缓存主线响应现按读取时的管理员确认记录动态叠加；确认/取消失败在行情页显示明确错误，不改写历史快照。

Files:
- `kpl-stats-server.js`（云端部署）
- `kpl-dashboard_17_apple.html`（云端部署）
- `docs/DAILY_HANDOFF.md`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 部署前云端后端与行情页 SHA-256 精确匹配 PR #55/#57 已部署基线，无未回填云端漂移；暂存文件、部署文件哈希与 `main@89f9698` 一致，云端 `node --check` 通过。
- 复核阶段通过主线确认专项、QI 主线状态、指标口径、同花顺资金口径、静态缓存/认证权限专项测试及行情页内联脚本编译；`git diff --check` 通过。
- 公网 `/health`、`/kpl`、`/admin` 与主页均为 HTTP 200；公网 `/kpl` SHA-256 与 Git 主线一致。
- 2026-07-14 冻结 `/api/strategy-mainlines` 返回 `confirmedMainline=PCB`，且恰有一条 PCB 主线 `isConfirmedMainline=true`；AI 只读策略接口返回同一确认主题。
- 未登录认证请求被拒绝，管理员用户接口返回 HTTP 403；登录、注册、找回密码入口及普通用户管理员权限门控仍在。

Deployment:
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr53-pr59-20260714-074509`。
- 部署 SHA-256：`kpl-stats-server.js=855AD06AD9C2834601294F334E6AA283EECB7EB5D2E9C9AB5AE00DD358E2EB0D`；`kpl-dashboard_17_apple.html=9BFD4167858AB4C12C47824CBB4E03016351398DDEBDB213C1ED2B89FEA96A6C`。
- 仅重启计划任务 `Panda Dashboard Server`，PID `2864 -> 14484`；未重启 Caddy、娱乐服务或公司端 L2 worker。
- 未修改确认记录、冻结快照、预测档案、L2 任务、业务数据库、用户数据或运行时配置；两份云端运维日志已追加且未记录任何敏感值。

Notes for next agent:
- 云端运行代码现与 `main@89f9698` 的两份部署文件一致，PR #53 与 PR #59 均已落地；确认状态继续视为可变管理员状态，读取时动态叠加。

## 2026-07-14 - Codex continuation - PR #59 并发部署最终对账

Changed:
- 共享工作区在部署期间出现同版本并发操作；保留上一条未提交交接，不覆盖其记录。两边均部署 `origin/main@89f9698` 的相同文件哈希，无代码冲突。
- 云端同时保留两份有效回退备份：`C:\PandaDashboard\_deploy-backups\pr53-pr59-20260714-074509` 与 `C:\PandaDashboard\_deploy-backups\pr53-pr59-mainline-confirm-20260714-074410`。
- 两份云端运维日志已追加并发归因更正：`2864 -> 14484` 来自并行部署；continuation 复验后最终受控重启为 `14484 -> 7856`。

Validated:
- 最终生产 SHA-256 仍为 `kpl-stats-server.js=855AD06AD9C2834601294F334E6AA283EECB7EB5D2E9C9AB5AE00DD358E2EB0D`、`kpl-dashboard_17_apple.html=9BFD4167858AB4C12C47824CBB4E03016351398DDEBDB213C1ED2B89FEA96A6C`；云端语法检查、内网及公网健康均通过。
- 公网市场首页、`/kpl`、`/admin` 与 DreamerQi 首页均为 HTTP 200；`/kpl` 哈希与 Git 主线一致，并包含 PR #53 日期跳转及 PR #59 错误反馈代码。
- 2026-07-14 冻结主线响应返回 PCB `confirmedMainline`，PCB 行为 `isConfirmedMainline=true`；AI 只读策略接口返回同一 PCB 确认主题。未登录用户管理与运维日志接口均返回 403。

Deployment:
- 最终主服务 PID 为 `7856`，仅操作 `Panda Dashboard Server`；回退未触发，未重启 Caddy、娱乐服务、Consistency Gate 或公司端 L2 worker。
- 未修改确认记录、冻结快照、预测档案、L2 任务、业务数据库、用户数据或运行时配置；云端两份当前运维日志均已记录部署与并发更正，未写入敏感值。

Notes for next agent:
- 生产最终运行文件与 `main@89f9698` 一致。若再次部署，应先确认共享工作区和云端是否已有并发执行者，避免对同一版本重复重启。

## 2026-07-14 - Codex - 固化任务路由与四类运维 SOP

Changed:
- 把任务入口加入 `CLAUDE.md`：TGB 湖南人、L2 worker、行情资金源、复盘健康各自必须先读对应 SOP。
- 新增统一执行规范，明确大文件禁止走 GitHub Contents API、精确读取、分阶段测试、长步骤进度汇报和无进展接管规则。
- 固化 L2 云端队列与公司 worker 的五档结果契约、心跳/任务状态、最大可统计档和明星股数据质量边界。
- 固化东财/同花顺/KPL 板块资金字段语义、来源独立、重叠概念不相加及快照边界。
- 固化四源复盘健康定义、当天口径、行数重算、缺失/过期/未发布状态、手动补齐和 30 个交易日保留规则。

Files:
- `CLAUDE.md`
- `docs/COLLABORATION_WORKFLOW.md`
- `docs/PROJECT_MAP.md`
- `docs/ops/AGENT_EXECUTION_SOP.md`
- `docs/ops/L2_WORKER_RUNBOOK.md`
- `docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md`
- `docs/ops/REVIEW_SOURCE_HEALTH_SOP.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 文档事实已对照当前 `local-l2-task-queue.js` 五档/45 秒心跳、`strategyMainlineStarStatus`、东财 `f62`、同花顺 `zjjlr`、KPL 接口和 `tests/review-source-health.test.js`。
- `git diff --check` 通过；新增文档未包含 Token、Cookie、密码、私钥或运行时数据库内容。

Deployment:
- 纯 Git 文档变更，未部署生产，未重启任何服务，未修改运行时数据。

Notes for next agent:
- 新任务不应依赖长聊天记忆；从 `CLAUDE.md` 的任务路由进入对应 SOP。长 OCR/子任务两分钟无可见进展时必须检查并由主任务接管，不能静默等待。

## 2026-07-14 - Codex - 手工补录 2026-07-14 TGB 湖南人复盘

Changed:
- 严格按 `docs/ops/TGB_HUNAN_DAILY_SOP.md` 强制刷新当天淘股吧原文和 18 张原始图片，仅采用官方白底 `@TGB湖南人` 表格 `image-01-06.png`。
- 排除“市场连板股”重复摘要、20 行涨停炸板区、同花顺红色可视化图、回帖图、广告和二维码；按原图逐行手工录入 79 行正式 `review/tgb-hunan-structured`。
- 原图红色板块标题确实写成字序异常的 `其热点他`，按来源忠实原则原样保留，没有擅自改写为“其他热点”。
- 写入正式源后只强制重折 `2026-07-14` 综合主因库，没有触碰其他日期。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-14.json`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-14.json`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 官方文章：`https://www.tgb.cn/a/2tqr78PROTL`，标题 `7.14湖南人涨停复盘+晚间消息汇总`；使用图片 `image-01-06.png`。
- 题材块：业绩 24、医药 8、机器人 7、石油化工 6、PCB板 5、半导体 3、被动元件 4、公告 3、其热点他 4、其他个股 15，合计 79。
- 写入前在本机和云端分别对账终盘涨停池：正式 79、基准 79、missing 0、extra 0、duplicate 0、weak 0、规范化名称不一致 0。
- 正式 TGB 源 SHA-256：`489156551d80a78166e075d09545bffca8b19d6c6c42df37108a5fa8d9738570`；重折后综合主因库 SHA-256：`2a6f55a6564b28eddea467b9720f61695fd79eab5ae5bc3aaf819074f0a359ab`。
- 公网强制刷新 `source-view` 后，综合归纳/复盘啦/选股宝/韭研/淘股吧均为 79；TGB 覆盖 100%、主因覆盖 100%、低置信 0、`sourceErrors` 为空；公网 `/health` 为 HTTP 200。

Deployment:
- 生产运行时数据已更新；未部署应用代码，未重启任何服务，`Panda Dashboard Server` PID 保持 `7856`。
- 回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260714-20260714-084735`，包含重折前综合主因库、raw manifest、官方图片和修改前云端日志；此前不存在当天正式 TGB 文件。
- 自动 Qwen OCR 仍因服务商 `Arrearage` 被质量闸拒绝，未写任何正式行；最终正式文件全部来自人工读图和双重对账。
- 两份云端运维日志均已更新并复读确认，未记录 Token、Cookie、密码、私钥、用户数据或管理员会话。

Notes for next agent:
- 2026-07-14 四个正式复盘源现均为 79/79。后续继续每日执行同一 SOP，不能用自动 OCR 失败结果、同花顺红图或炸板区覆盖人工正式库。

## 2026-07-14 - Codex - 修复策略后端默认权限初始化并审计同花顺成员库

Changed:
- 修复 `createStrategyBackend()` 无显式 `canRunL2Scan` 注入时先引用、后初始化 `isAdmin` 的暂时性死区错误；默认 L2 读写权限继续委托同一个 `isAdmin`，没有改变生产显式注入路径。
- 新增端到端权限回归测试，覆盖无 L2 权限函数注入时管理员放行、普通用户拒绝；删除跨日快照测试为绕开旧错误而保留的临时注入。
- 对生产同花顺概念目录和成员文件做只读新鲜度审计，没有触发同步、刷新、写库或服务重启。

Files:
- `strategy-backend.js`
- `tests/strategy-backend-permissions.test.js`
- `tests/board-snapshot-contamination.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新回归测试在修复前稳定复现 `ReferenceError: Cannot access 'isAdmin' before initialization`；修复后权限专项、跨日快照、L2 持久化、静态缓存/认证和明星股分层专项均通过。
- 合并前全仓 25 个测试文件全部通过，`node --check strategy-backend.js` 与 `git diff --check` 通过。
- 公网同花顺状态显示 2026-07-14 北京时间 15:00 自动任务成功：目录 382、标记同步 382、失败 0。
- 云端逐文件只读对账：当前目录 382 个板块文件全部存在且 JSON 有效，目录计数与文件成员数不一致 0；381 个非空，唯一空名单为按规则排除的 `ST板块`。另有 262 个不在当前目录的历史遗留文件。
- 成员新鲜度不能用目录状态代替：当前 382 个板块中仅 86 个成员文件保存于 2026-07-14，296 个沿用更早名单，其中 295 个早于 2026-07-08，最早保存于 2026-06-15。现有 382/382 表示目录覆盖完整，不表示 382 份成员名单当天重新验证。

Deployment:
- 本条记录提交时策略后端修复尚未部署；同花顺审计全程只读，生产应用、成员库、资金快照和服务状态均未改变。

Notes for next agent:
- 权限修复合并后只需部署 `strategy-backend.js` 并重启主服务，随后复核健康、页面和未登录/普通用户权限边界。
- 同花顺 `zjjlr` 实时资金口径本次没有问题也没有改动；成员关系是另一条新鲜度链。当前自动任务会复用任何非空且未判不完整的旧成员文件，后续若改为轮换或分批刷新，应先按 AI 讨论/生产证据流程设计限速、失败回退和真实新鲜度指标，不能在盘中直接强刷全部 382 个多页页面。

## 2026-07-14 - Codex - 部署 PR #64 策略默认权限初始化修复

Changed:
- PR #64 已合并至 `main@ec5dec5b256c44826009bdc8a4c6c28f1c47cf3b`；从该已复核主线仅部署 `strategy-backend.js`。
- 生产 `createStrategyBackend()` 现可在未显式注入 L2 权限函数时安全回退到 `isAdmin`，生产现有显式 `canRunL2Scan` / `canReadL2Scan` 行为保持不变。
- 两份云端运维日志已追加部署记录并复读确认。

Files:
- `strategy-backend.js`（云端部署）
- `docs/DAILY_HANDOFF.md`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 部署前云端文件 SHA-256 精确匹配修复前主线 `418fe8f6df006972de7bb54d740ab73e64d6a2f729b90289826907104a9b1faa`，无云端漂移；暂存、部署文件与新主线 SHA-256 均为 `5633b3b79a7f85bb7f7a06646a014442b69ce8c7ed00a2273a4b98d8677e43dd`，云端 `node --check` 通过。
- PR 合并前全仓 25/25 测试文件通过；公网 `/health`、`/kpl`、`/admin` 与主页均为 HTTP 200。
- 未登录后台运维、云健康、用户管理和 L2 扫描接口均返回 HTTP 403，`/api/auth/me` 返回 HTTP 401；认证/注册/找回密码接线与普通用户管理员门控专项测试通过。
- 重启后同花顺目录状态仍为 2026-07-14、382/382、失败 0；成员库审计保持只读，没有触发刷新或写库。

Deployment:
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr64-strategy-permissions-20260714-163544`，包含旧 `strategy-backend.js` 和追加前两份云端日志。
- 仅重启计划任务 `Panda Dashboard Server`，PID `7856 -> 11092`；未重启 Caddy、娱乐服务、Consistency Gate 或公司端 L2 worker。
- 未修改策略快照、管理员确认、预测档案、L2 任务、同花顺成员库、行情数据库、用户数据、会话或运行时配置。

Notes for next agent:
- 生产 `strategy-backend.js` 已与 `main@ec5dec5` 一致，PR #64 无待部署文件。
- 同花顺审计结论仍有效：382/382 是目录覆盖，不是成员名单当天复核；后续刷新机制改造需先走 AI 讨论与生产证据流程，不得把实时 `zjjlr` 资金新鲜度和成员关系新鲜度混为一谈。

## 2026-07-14 - Codex - 固化 TGB 湖南人复盘只允许人工逐行转录

Changed:
- 按 Owner 最新决定，TGB 湖南人正式复盘永久改为官方原图人工逐行转录；Qwen、OCR 和其他自动视觉结果不得用于生成、补全、猜测或校验正式行。
- 自动补源路径现在最多保存官方文章、raw manifest 和原始图片；缺少手工结构化文件时明确返回 `manual-hunan-table-required`，不会再调用视觉结构化或写正式库。
- 原自动 TGB 视觉任务改为固定跳过；旧 `--tgb-vision-sync` 参数只保留为 raw-evidence 兼容别名，不读取 Qwen 配置、不重折综合主因库。
- TGB SOP 固化逐题材块处理、双遍人工复核、每块累计计数、最长两分钟进度汇报、看不清即明确阻断及最终池 missing/extra/duplicate/weak 全为 0 的一致性标准。

Files:
- `CLAUDE.md`
- `docs/ops/TGB_HUNAN_DAILY_SOP.md`
- `kpl-stats-server.js`
- `tests/tgb-manual-only.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增专项测试确认正式补源、自动任务和旧 CLI 三条生产可达路径均不读取 Qwen 配置、不调用视觉结构化、不自动写 TGB 正式库；旧视觉构建器只剩历史定义、无生产调用者。
- TGB 人工-only、复盘源健康和细分证据索引专项测试通过；合并前全仓 26/26 测试文件全部通过，`node --check kpl-stats-server.js` 与 `git diff --check` 通过。

Deployment:
- 本条记录提交时尚未部署生产；没有修改任何 TGB 正式文件、raw evidence、综合主因库、策略数据、用户数据或运行时配置，也未重启服务。

Notes for next agent:
- 后续每日先运行 `--tgb-hunan-raw-evidence` 抓官方证据，再由 Codex 按 SOP 人工录入和完整对账；禁止恢复 Qwen/OCR 自动路径或把 raw evidence 误报为完成。
- 这是 TGB 来源质量和写入权限收紧，不改变市场归因算法，因此本次不需要 AI 讨论组协议。

## 2026-07-14 - Codex - 部署 PR #66 TGB 人工-only 规则

Changed:
- PR #66 已合并至 `main@c8c6c41ee2fff818bd70b4bc4484ec1595fb4e35`；从该已复核主线仅部署 `kpl-stats-server.js`。
- 生产 TGB 自动流程现只保存官方 raw evidence；正式行必须按 SOP 由 Codex 人工逐行转录。旧 `--tgb-vision-sync` 只作为 raw-evidence 兼容别名，不读取 Qwen 配置、不写正式库、不重折综合主因库。
- 两份云端运维日志已追加并复读确认。

Files:
- `kpl-stats-server.js`（云端部署）
- `docs/DAILY_HANDOFF.md`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 部署前云端后端 SHA-256 精确匹配旧主线 `855ad06ad9c2834601294f334e6aa283eecb7eb5d2e9c9ab5ae00dd358e2eb0d`，无云端漂移；暂存、部署文件与新主线 SHA-256 均为 `564ced7d1b7602f8dd90c9cc0dac08cdd1aa3ad64c1e7dbc5e5ad33d6a1af34c`，云端 `node --check` 通过。
- 生产源码包含 `manual-hunan-table-required` 和旧 CLI raw-only 标记；历史视觉构建器仅剩定义、生产调用数为 0。
- 公网 `/health`、`/kpl`、`/admin` 与主页均为 HTTP 200；未登录后台运维、用户管理和 L2 扫描接口仍为 HTTP 403。
- 2026-07-14 TGB 正式文件 SHA-256 仍为 `489156551d80a78166e075d09545bffca8b19d6c6c42df37108a5fa8d9738570`，综合主因库仍为 `2a6f55a6564b28eddea467b9720f61695fd79eab5ae5bc3aaf819074f0a359ab`；公网四个正式源继续全部 79/79，TGB 覆盖和主因覆盖 100%、低置信 0、`sourceErrors` 为空。

Deployment:
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr66-tgb-manual-only-20260714-165303`，包含旧后端和追加前两份云端日志。
- 仅重启计划任务 `Panda Dashboard Server`，PID `11092 -> 12600`；未重启 Caddy、娱乐服务、Consistency Gate 或公司端 L2 worker。
- 未修改 TGB 正式行、raw evidence、综合主因库、策略数据、用户数据、会话或运行时配置。

Notes for next agent:
- 生产后端已与 `main@c8c6c41` 一致，PR #66 无待部署文件。后续 TGB 每日复盘必须保持人工逐行、逐块计数、双遍复核和完整终盘池对账标准。

## 2026-07-14 - Codex - Claude 管理员生产运维通道

Changed:
- 为 Claude 建立独立的生产 SSH 身份；公钥已登记到云端，私钥仅进入 GitHub `production` 加密环境，未写入聊天、Git 或普通环境变量。
- 新增仅允许从 `main` 手动触发的生产工作流。操作脚本必须位于 `ops/production/`、固定 SHA-256，并经过 GitHub `production` 环境人工批准后才会以管理员身份执行。
- 新增管理员权限自检、主服务重启、基于已批准 `main` 源码归档的备份/部署/健康检查/自动回退脚本；特殊数据库维护通过合并到 `main` 的日期化请求脚本执行。
- 新增 Claude 生产权限使用、审计和紧急撤销说明。

Files:
- `.github/workflows/production-ops.yml`
- `ops/production/verify-access.ps1`
- `ops/production/restart-main.ps1`
- `ops/production/deploy-from-main.ps1`
- `ops/production/manifests/example.json`
- `ops/production/requests/README.md`
- `docs/ops/CLAUDE_PRODUCTION_ACCESS.md`
- `tests/production-ops-workflow.test.js`
- `CLAUDE.md`
- `docs/COLLABORATION_WORKFLOW.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- Claude 专用密钥已实测可通过云端 SSH 管理入口登录为 Administrator；项目目录写入/删除、三个运行时数据目录读取、Node 与主服务计划任务可见性均通过。
- 三个 PowerShell 运维脚本均通过云端 Windows PowerShell 语法解析；`tests/production-ops-workflow.test.js` 和 YAML 解析通过。
- GitHub `production` 环境只允许 `main`，配置 Owner 必审和单任务并发锁；SSH 主机指纹固定，checkout action 使用提交 SHA 固定。
- 仓库和输出未包含私钥、Token、Cookie、密码或运行时数据库。

Deployment:
- 云端仅增加独立 SSH 公钥并保留修改前 authorized-keys 备份；未部署网站代码、未重启服务、未修改业务数据库。
- GitHub `production` 环境已保存加密 SSH 凭据和固定主机指纹；工作流合并后仍需执行一次 `verify-access` 端到端验收。

Notes for next agent:
- Claude 获得的是完整但可审计的管理员执行能力，不应索取私钥。每次生产操作先把脚本/manifest 合并进 `main`，固定脚本 SHA，然后触发工作流并等待 Owner 批准。

## 2026-07-14 - Codex - 落地 DreamerQi 次级页面 1 号编辑社区方案

Changed:
- 按 Product Design 已选 1 号视觉方案，统一重做首页导航、`瞎聊聊`、`探索`、`关于`、`联系` 的深色编辑社区语言；保留现有品牌色、账号体系、探索数据链和聊天发布/图片/回复逻辑。
- `瞎聊聊` 改为连续双栏：左侧题头、筛选和帖子列表，右侧发布框、社区数据与发帖提示；修复列表被发布框高度下压、分类回复数口径不一致、详情/回复失败在弹层后不可见等问题。
- `探索` 加强路线、主题和地点层级，统一 8–10 px 圆角和选中态对比度；移动端方法卡横向滑动，使城市与类别筛选回到首屏。
- `关于` 改为产品叙事与四种使用状态，`联系` 改为明确邮箱入口、问题反馈、合作建议和安全提醒；移动导航压缩为单行横向浏览。
- 增加导航/筛选/输入框/详情弹层的可访问语义、键盘焦点与 Escape 关闭；更新首页 bundle 缓存版本。
- 合并前复核补齐聊天与探索详情弹层的初始焦点、Tab/Shift+Tab 焦点环、背景滚动锁定和关闭后焦点恢复。

Files:
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`（由 `node Qi/build-home.js` 自动生成）
- `Qi/index.html`
- `design-qa.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`、`node --check Qi/qi-home.compiled.js`、`tests/font-woff2-yule-cache.test.js`、`tests/static-cache-auth-hardening.test.js` 和 `git diff --check` 通过；合并前 26/26 个 `tests/*.test.js` 文件全部通过，完整输出仅保存在忽略的临时日志。
- 使用真实公开聊天/探索数据完成 1440×1024、1487×1058 和 390×844 浏览器验收；聊天筛选/详情/评论、探索城市筛选/地点详情、两类弹层 Escape 关闭均正常，最终聊天和探索状态控制台错误均为 0。
- 登录、注册、忘记密码三种表单均可切换；首页 `SpbShowcase` 预览图仍在；关于、联系、隐私、条款均正常；未登录状态无后台入口。
- Product Design 源图与实现已完成全屏和右栏聚焦并排对照，`design-qa.md` 最终结果为 `passed`。
- 浏览器复验确认两类详情弹层打开后焦点进入关闭按钮，键盘焦点不会越出弹层，Escape 关闭后回到原触发卡片。
- 公网主页、`/health`、`/kpl`、`/admin` 均返回 HTTP 200。

Deployment:
- 未部署生产，未修改云端运行时状态，未重启任何服务。

Notes for next agent:
- 当前工作在 `codex/redesign-qi-secondary-pages-20260714`；合并前复核与 26/26 全套均已通过，下一步从已确认 `main` 备份并部署三个 `Qi` 静态文件。
- 本次仅涉及首页/公共次级页面，不改变行情、策略、归因或生产数据，因此不需要 AI 讨论组协议。

## 2026-07-14 - Codex - 部署 PR #68 DreamerQi 次级页面设计

Changed:
- PR #68 已以 merge commit `f5344025feda5cc1dd27bc41aea276912fa7410c` 合并至 `main`；生产只从该已确认主线导出并部署三个首页静态文件。
- 已将 `瞎聊聊`、`探索`、`关于`、`联系` 和共享导航的新编辑社区设计同步到 GitHub 与云端。

Files:
- 云端 `C:\PandaDashboard\Qi\index.html`
- 云端 `C:\PandaDashboard\Qi\qi-home.jsx`
- 云端 `C:\PandaDashboard\Qi\qi-home.compiled.js`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 部署前现网三文件均与新主线哈希不同；暂存文件、部署文件与 `main@f534402` 的 SHA-256 逐一一致，云端 `node --check Qi\qi-home.compiled.js` 通过。
- 公网主页、新 bundle、`/health`、聊天接口、探索主页、探索接口、`/kpl` 和 `/admin` 均返回 HTTP 200；两处健康检查均为 `ok=true`。
- 公网 bundle SHA-256 为 `36d90c07e756542f837104f808e7ec9a63073d7884e45c1270bf5461bc463981`，首页含新缓存版本，聊天返回 1 条公开帖子，探索返回 8 个城市。
- 云端两份运维日志均只追加一次 PR #68 记录；未修改市场数据、策略数据、账号数据或运行时数据库。

Deployment:
- 生产已变更；回退备份为 `C:\PandaDashboard\_deploy-backups\pr68-secondary-pages-20260714-180747`，包含三份旧静态文件和追加前的两份云端运维日志。
- 部署后 SHA-256：`index.html=bba0a9334d05c134a0ce0573cc37d3985b24a93808ba32245dac199fa15502c6`、`qi-home.jsx=30636033868b6d65527126702a08725b882d56d44c268dfac1b6c7f85c21f086`、`qi-home.compiled.js=36d90c07e756542f837104f808e7ec9a63073d7884e45c1270bf5461bc463981`。
- 三份文件均为静态资源，按项目规范未重启 `Panda Dashboard Server`，也未重启 Caddy、娱乐服务、Consistency Gate 或 L2 worker。

Notes for next agent:
- PR #68 已完成 GitHub 合并、生产部署和公网验收；当前无该设计任务遗留部署项。
- 后续继续改首页时仍以 `Qi/qi-home.jsx` 为源码并运行 `node Qi/build-home.js`，不要手改编译产物。

## 2026-07-14 - Codex - 加速 Claude 生产工作流并修正远端路径展开

Changed:
- 只在部署清单存在时创建源码归档，且归档仅包含清单与其明确列出的源码文件；权限自检和单纯重启不再上传源码。
- 修正 Bash 生成 Windows PowerShell 路径时反斜杠转义变量的问题，统一使用 Windows PowerShell 可识别的正斜杠临时路径。
- 增加清单结构、已跟踪文件、符号链接、路径穿越和选择性归档检查。

Files:
- `.github/workflows/production-ops.yml`
- `docs/ops/CLAUDE_PRODUCTION_ACCESS.md`
- `tests/production-ops-workflow.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 工作流全部 Bash 步骤通过语法解析，YAML、专项测试与 `git diff --check` 通过。
- 示例部署归档实测只包含清单和 `strategy-backend.js`，没有打包仓库其他文件。
- 首次端到端自检在远端脚本执行前主动取消；两个可能残留的临时文件已清理并确认剩余 0。
- 修复后 GitHub production run `29381350328` 在 20 秒内完成：Administrator、项目写入/删除、主服务计划任务、三个运行时数据目录和 Node 检查全部通过，远端临时脚本清理成功。

Deployment:
- 仅执行无业务写入的 `verify-access` 探针；没有部署网站、没有重启服务、没有修改业务数据库或运行时配置。
- 两份云端运维日志已备份后追加本次验收记录；备份目录为 `C:\PandaDashboard\_deploy-backups\claude-production-access-20260715-092229`。

Notes for next agent:
- 不要恢复整仓归档；只读检查和重启操作应只上传已固定 SHA-256 的运维脚本。
- Claude 生产管理员通道已可用。部署、重启和数据库维护仍必须使用合并到 `main` 的受审脚本并等待 Owner 批准，禁止索取或输出私钥。

## 2026-07-15 - Codex - 优化同花顺实时与策略取数延迟

Changed:
- 将同花顺实时概念目录由 30 秒阻塞缓存改为 60 秒新鲜期、5 分钟容错期的 stale-while-revalidate；过期请求先返回同日完整缓存，后台再刷新。
- 修复缓存到期时间从慢抓取开始计算的问题，改为抓取完成后开始计时；增加同日磁盘热缓存，服务重启后可直接恢复。
- 增加刷新任务合并，实时页、策略页和后台预热并发请求只共享一轮同花顺抓取；策略补充目录冷启动时不再阻塞等待。
- 盘中自动预热同花顺目录，正式手动/盘后同步仍强制等待完整新抓取；普通实时刷新跳过慢速目录发现，目录发现只保留在正式同步。
- 分页并发从固定 4 提升为可配置且上限 8 的默认 6，并增加分页完整性闸门；任一分页失败时保留上一份完整缓存，不用残缺数据覆盖。
- 同花顺状态和目录响应增加缓存状态、采集时间、年龄、刷新状态与上次耗时，便于后续确认是否命中新链路。

Files:
- `kpl-stats-server.js`
- `tests/ths-realtime-performance.test.js`
- `ops/production/manifests/ths-performance-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产改动前实测：`/api/dashboard-preview?zs_type=5` 冷请求约 26.65 秒，紧接缓存请求约 0.07 秒；`/api/ths-concepts/catalog` 冷请求约 22.76 秒，持久化目录约 0.17 秒，确认瓶颈为重复整目录抓取。
- `node --check kpl-stats-server.js`、`tests/ths-realtime-performance.test.js`、`tests/ths-strategy-correctness.test.js` 和 `git diff --check` 通过。
- 28/28 个 `tests/*.test.js` 文件全部通过；同花顺资金代表单板口径、策略归因、权限、L2 和现有页面行为均未改变。

Deployment:
- 尚未部署生产，未修改运行时数据，未重启服务；清单已准备为仅部署 `kpl-stats-server.js` 并重启主服务。

Notes for next agent:
- 部署后先触发一次完整同花顺目录刷新生成 `ths-concepts-db/realtime-cache.json`，再连续验证实时页与策略页；正常请求应稳定命中内存/同日磁盘热缓存。
- 昨日实时数据不会冒充今日；同日 15:00 后完成的最终缓存当天保持新鲜，次日会重新抓取。

## 2026-07-15 - Codex - 修复 Node 24 生产部署语法校验

Changed:
- 修复通用生产部署脚本把 JavaScript 暂存为 `.tmp` 后执行 `node --check` 的兼容问题；Node 24 会拒绝未知 `.tmp` 扩展，现改为校验归档中保留 `.js` 扩展的同一 SHA-256 目标文件，因此不降低完整性保护。

Files:
- `ops/production/deploy-from-main.ps1`
- `tests/production-ops-workflow.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 首次同花顺性能部署 run `29384113774` 在停止服务前的预校验阶段退出，错误为 Node 24 `ERR_UNKNOWN_FILE_EXTENSION .tmp`；部署脚本未替换生产文件、未停止或重启主服务。
- `tests/production-ops-workflow.test.js` 和 `git diff --check` 通过；当前 macOS 环境没有 `pwsh`，合并后的受保护工作流将用云端 Windows PowerShell 实际执行验证。

Deployment:
- 本条仅修复部署工具；网站代码仍待重新执行同花顺性能部署，生产业务文件尚未变化。

Notes for next agent:
- 合并本修复后须使用新脚本 SHA-256 重新触发同一清单；不要 rerun 旧 workflow，因为旧 run 固定的是修复前脚本。

## 2026-07-15 - Codex - 适配同花顺上游限流并保持页面非阻塞

Changed:
- 现网发现同花顺在 6 路并发时会返回 HTTP 200 但空页面；将目录分页恢复为已验证的最高 4 路，并把失败页改为单路、换 Cookie、递增等待后重试。
- 实时目录、今日实时板块榜和策略补充目录在没有同日热缓存时立即返回安全的持久化目录并后台预热，不再让用户请求等待整轮抓取。
- 保留分页完整性闸门：重试后仍缺页则整轮不写热缓存，绝不把残缺板块榜标记成实时结果。

Files:
- `kpl-stats-server.js`
- `tests/ths-realtime-performance.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #73 已由受保护 workflow run `29384346219` 成功部署并重启；首次 run `29384113774` 的 Node 24 `.tmp` 校验问题由 PR #74 修复。
- 现网 PR #73 首轮预热返回 `THS realtime catalog incomplete: 34/38 pages failed`，质量闸门使 `realtime=false` 且继续返回 382 个持久化目录项，未生成残缺热缓存、未冒充今日实时数据。
- `node --check kpl-stats-server.js`、同花顺性能/正确性专项测试和 `git diff --check` 通过。

Deployment:
- PR #73 主服务代码已在生产；本次上游稳定性修复尚未部署，需合并后再次按同一清单部署并重启主服务。

Notes for next agent:
- 部署后观察 `realtimeCache.cacheState/status/lastDurationMs/lastError`；只有 `realtime=true` 且 `boardCount` 与目录规模相符才算预热成功。
- 页面请求必须保持非阻塞，即使同花顺上游继续限流，也只能显示“等待今日数据”，不能回退昨日数值冒充今天。

## 2026-07-15 - Codex - 将同花顺实时抓取收敛为强势候选窗口

Changed:
- 根据现网限流边界，将同花顺实时抓取从全部约 39 页收敛为按涨幅排序的前 4 页（约 40 个最强板块）；盘后 `catalog.json` 继续提供全部 382 个板块名称、ID 和成员映射。
- 实时与策略排序只消费前 4 页的真实涨幅/资金，其余目录行保持数值 `null`，不会用旧值或估算值填充；正式盘后同步仍通过导航发现完整目录。
- 缓存状态增加 `realtimeMetricCount`、`realtimePageLimit` 和当前刷新开始时间，刷新期间保留上一条错误，便于判断热缓存是否真正形成。

Files:
- `kpl-stats-server.js`
- `tests/ths-realtime-performance.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 现网完整目录为 382 个板块、39 页；6 路并发时只有前约 4 页可稳定返回，继续请求会触发大量 HTTP 200 空内容。
- 新口径仍保留全部目录行，但只把前 4 页标成实时指标覆盖；策略当前候选池和今日实时前排均处于该窗口内。
- `node --check kpl-stats-server.js`、同花顺性能/正确性专项测试和 `git diff --check` 通过。

Deployment:
- 尚未部署本次页数收敛；生产当前仍运行 PR #75，页面非阻塞但后台预热会因尝试全 39 页而失败。

Notes for next agent:
- 部署后成功标准：`realtime=true`、`cacheState=fresh`、`realtimeMetricCount` 约 35-40、总目录仍约 382，目录接口和今日实时连续请求维持亚秒级。
- 如果未来策略需要捕捉“涨幅不在前 40 但资金异常流入”的板块，应另加少量按资金排序的候选页，不能恢复每分钟全 39 页抓取。

## 2026-07-15 - Codex - 完成同花顺性能部署与现网验收

Changed:
- PR #73、#74、#75、#76 均已合并至 `main`；最终生产版本为 `main@a8b7835`，包含同花顺热缓存、上游限流适配、Node 24 部署兼容和强势候选窗口。
- 受保护 workflow run `29385047147` 只部署 `kpl-stats-server.js`，重启主服务并通过本机健康检查；部署器自动更新两份云端运维日志。

Files:
- 云端 `C:\PandaDashboard\kpl-stats-server.js`
- 云端 `C:\PandaDashboard\ths-concepts-db\realtime-cache.json`（运行时自动生成，不入 Git）
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 热缓存于启动后约 1.83 秒形成：`day=2026-07-15`、`realtime=true`、`cacheState=fresh`、总目录 382、实时指标覆盖 294、`lastError` 为空。
- 同花顺目录连续三次为 0.068/0.073/0.075 秒；改动前冷请求约 22.76 秒。
- 今日实时同花顺连续两次为 0.143/0.069 秒；改动前缓存过期后的首请求约 26.65 秒。
- 策略接口连续两次为 0.064/0.059 秒，返回当日 2 条主线且 `staleness=fresh`；健康接口 HTTP 200。
- 自动预热随后约 2.94 秒完成下一轮，页面请求始终保持约 0.06-0.09 秒，没有再次暴露后台抓取耗时。

Deployment:
- 生产已变更并重启 `Panda Dashboard Server`；最终备份目录为 `C:\PandaDashboard\_deploy-backups\github-29385047147-1`。
- 最终 workflow：https://github.com/dmz1108/dmzrepo/actions/runs/29385047147 。
- 首次 run `29384113774` 在替换/停服前因 Node 24 拒绝 `.tmp` 扩展退出；没有改变生产文件。后续成功 run 均按清单备份、部署、健康检查并清理暂存文件。

Notes for next agent:
- 同花顺性能任务已完成。后续不要恢复 30 秒阻塞式全 39 页刷新，也不要把并发提高到 4 以上。
- 监控以 `/api/ths-concepts/status` 的 `realtime` 为准；若 `lastError` 非空，保留同日完整缓存并检查上游，不得用昨日指标冒充今日。

## 2026-07-15 - Codex - 修复 L2 完成后仍显示待验证旧主线

Changed:
- 将“构建成功但 0 条主线”视为已完成的有效结果，使 L2 排除全部候选后能够覆盖先前的正数缓存，而不是继续展示旧卡片和 `L2 待验证`。
- 保温任务对有效空结果恢复正常 150 秒刷新，不再按失败退避到 15 分钟；空结果带明确原因与用户可见说明。
- 收盘快照允许保存有效的“今日无主线”，历史回看不会因为没有主线卡片而丢失当日结论。
- 每日事件档案同步把有效空快照记为完整的 `no-qualified-mainline`，不再误记为 `dataMissing`。

Files:
- `kpl-stats-server.js`
- `strategy-daily-events.js`
- `tests/mainline-empty-state.test.js`
- `tests/strategy-daily-events.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端 2026-07-15 `细胞免疫治疗` 自动 L2 任务已完成 50/50；按正式明星规则重算，没有 `expected`/`confirmed`，5 只涨停股均为 `sealedWeak`，因此正确结论是今日暂无通过 L2 明星闸的主线。
- `node --check kpl-stats-server.js`、新增空状态测试、主线三态/预测记录/盘后回看专项测试通过。
- `tests/*.test.js` 共 29 套全部通过，`git diff --check` 通过。

Deployment:
- 尚未部署；需合并至 `main` 后通过受保护生产工作流部署 `kpl-stats-server.js` 并重启主服务。

Notes for next agent:
- 数据未准备或读取失败仍为 `ok:false`，不会写缓存；只有构建契约完整的 `ok:true + mainlines:[]` 才代表真实“无主线”。
- 部署后确认今日接口返回 `count=0`、`reason=no-l2-qualified-mainline`，且不再返回旧的 `细胞免疫治疗 · L2 待验证`。

## 2026-07-15 - Codex - 探索页改为城市生活编辑式布局

Changed:
- 保留探索页现有数据接口、城市/主题筛选、周末路线、地点详情与图片代理逻辑，重新组织为“编辑导语 → 今日精选 → 周末路线 → 主题索引 → 城市清单”的阅读顺序。
- 首屏直接展示真实地点照片；旧版五张同权重说明卡收拢为低干扰整理流程带，周末路线和主题区去除卡片套卡片。
- 已核验地点在城市清单与详情中强化商圈、地址和电话；详情弹窗改为桌面/手机双端响应式信息布局。
- 增加键盘焦点、减少动态效果适配、横向筛选和手机端滚动卡片，并更新首页脚本缓存版本。

Files:
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `Qi/index.html`
- `tests/explore-editorial-layout.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用现网 `/api/discovery` 数据完成 1440×1000 与 390×844 的 Playwright 视觉检查；桌面和手机页面均无横向溢出，5 张精选图正常渲染。
- 验证精选地点打开详情、Escape 关闭、手机详情信息重排和图片加载；浏览器无页面脚本错误。
- `node Qi/build-home.js`、`node --check Qi/qi-home.compiled.js`、探索页专项测试、静态缓存与鉴权回归测试、`git diff --check` 均通过。

Deployment:
- 当前仅 GitHub 工作分支变更，尚未部署生产，未重启服务。

Notes for next agent:
- 生产部署应原子更新 `Qi/qi-home.jsx`、`Qi/qi-home.compiled.js`、`Qi/index.html`；本次不涉及后端或运行时数据。
- 部署后分别检查 `https://explore.dreamerqi.com` 的桌面/手机首屏、筛选、详情弹窗与图片代理。

## 2026-07-15 - Codex - 探索页新版完成生产发布

Changed:
- PR #80 已合并探索页城市生活编辑式布局；PR #81 已合并只包含三份首页文件的受保护部署清单。
- GitHub 生产工作流原子更新云端 `Qi/qi-home.jsx`、`Qi/qi-home.compiled.js`、`Qi/index.html`，未改后端和运行时数据。

Files:
- 云端 `C:\PandaDashboard\Qi\qi-home.jsx`
- 云端 `C:\PandaDashboard\Qi\qi-home.compiled.js`
- 云端 `C:\PandaDashboard\Qi\index.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 生产 `https://explore.dreamerqi.com` 已返回缓存版本 `20260715-explore-editorial`。
- 生产桌面 1440×1000 与手机 390×844 验收通过：页面无横向溢出，5 张精选图片均加载，筛选、详情打开和 Escape 关闭正常，浏览器无脚本错误。

Deployment:
- 受保护工作流 run `29389881566` 成功，`restart=none`，没有重启任何服务。
- 该工作流执行前先完成队列中已获批准的主线空状态部署 run `29387589967`，两次运行均成功。

Notes for next agent:
- 探索页 UI 任务已上线完成；后续改版继续以 `Qi/qi-home.jsx` 为源，重新生成 compiled 文件并同步提高 `Qi/index.html` 的缓存版本。

## 2026-07-15 - Claude - 只读取证脚本:核对今日 L2 sealedWeak 是数据缺失还是真弱

Changed:
- 新增只读生产取证脚本 `ops/production/requests/2026-07-15-medical-l2-star-evidence.ps1`，用于回答 Owner 疑问「今日主线榜为什么只显示一个」。
- 脚本加载当日持久化 L2 job（`strategy-data/local-l2-jobs/<day>/<jobId>/latest.json` 的 `job.results`），用与 `tests/star-l2-layers.test.js` 完全一致的 extract-and-eval 手法抽取生产真逻辑（`strategyMainlineStarStatus` 及其常量/辅助），逐股打印：最大可统计档、present/empty/dataMissing、activeBuy、三比值、判定 level，以及 job 的 `resultRows/rowsWithPrice/rowsWithAllBuckets/status`。
- 目的：区分 Codex 2026-07-15「no-l2-qualified-mainline」结论下那些 `sealedWeak` 到底是「最大档主动买不足3亿/比值未达标」（真弱、板面正确）还是「最大档数据缺失」（worker 未回该股最大档 → 假阴性、误藏真主线）。

Files:
- `ops/production/requests/2026-07-15-medical-l2-star-evidence.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地 `node --check` 通过内嵌 JS；用合成 job 树端到端跑通：满档+主动买4亿→`confirmed`；缺1000万档→`dataMissing`/`sealedWeak`「涨停但最大档数据缺失」；主动买<3亿→`sealedWeak`「主动买不足3亿」。判定与生产逻辑一致。
- 脚本纯只读：仅读 `C:\PandaDashboard` 项目文件，写一个临时 .js 到 %TEMP% 并在 finally 删除；不写、不重启、不改任何生产文件/服务/运行时库；只打印聚合的逐股档位金额（与 admin leader-debug 同口径），不含原始逐笔、Token 或凭据。

Deployment:
- 未改任何生产状态；仅通过受保护生产工作流执行只读脚本，restart=none。执行结果只回读到 Actions 日志与本 handoff，不落原始 L2 到 Git。

Notes for next agent:
- 若结果显示 sealedWeak 主因是 `dataMissing`，则今日「无主线」是假阴性、需查 worker 最大档回传或 `ALL_BUCKETS`/`STAR_BUCKETS` 档位匹配；若主因是 activeBuy<3亿/比值未达标，则 Codex「今日暂无 L2 明星主线」结论成立、板面正确。
## 2026-07-14 - Codex - 娱乐页编辑部式视觉升级

Changed:
- 将娱乐频道从基础聚合页升级为与 PR #68 一致的深色编辑社区风格：强化主标题、动态内容概览、头条与编号热榜层级、频道区块和阅读详情排版。
- 分类按钮继续使用真实服务计数，新增站内“只看此频道 / 返回全部频道”路径；移除分类 emoji 与卡片按钮式箭头，保留所有真实娱乐图片和数据链。
- 移动端导航压缩为单行，频道筛选保持横向浏览；登录与内容弹层补齐 dialog 语义、Escape 关闭、焦点约束和关闭后焦点恢复。

Files:
- `yule.html`
- `design-qa.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用相同实时公开娱乐数据完成改版前/后 `1440 × 1024` 同屏对照，以及频道页和详情页 `390 × 844` 浏览器复核；最终控制台错误为 0。
- 分类筛选、返回全部频道、头条详情、返回娱乐频道和登录弹层链路均通过；内联脚本语法与 `git diff --check` 通过。
- 变基到最新 `origin/main` 后，`node --test tests/*.test.js` 全套 30/30 通过；`design-qa.md` 最终结果为 `passed`。

Deployment:
- 未部署生产，未修改云端运行时状态，未重启任何服务。

Notes for next agent:
- 当前工作在 `codex/redesign-yule-editorial-20260714`；本次只改娱乐页前端与交接/QA 文档，未改变娱乐 API、采集、账号权限、行情或策略逻辑。
- 该任务不涉及市场策略、归因或历史修复，因此不需要 AI 讨论组协议。

## 2026-07-15 - Codex - 部署娱乐页编辑部式改版

Changed:
- PR #84 已以 merge commit `c8e3e65cfa379a49f000688f9658986437542eb2` 合并娱乐页改版；PR #85 已以 merge commit `90720a06473932411062a9fc51c00b7bc04aec91` 合并只包含 `yule.html` 的生产部署清单。
- 受保护生产工作流从固定 `main@90720a0` 原子替换云端 `yule.html`，同步上线编辑式主视觉、动态内容概览、编号热榜、频道筛选、详情页和移动端优化。

Files:
- 云端 `C:\PandaDashboard\yule.html`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`（部署器自动追加）
- Git `ops/production/manifests/yule-editorial-20260715.json`
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 run `29393365631` 成功，批准提交为 `90720a06473932411062a9fc51c00b7bc04aec91`，部署器返回 `health=ok`。
- 公网 `yule.html` SHA-256 与主线完全一致，均为 `ab0caa9bb6f670bdc34b23a8753eaf74c78dd974b999ad75f4be9d45df975708`；页面包含新版标题、英文编辑眉题和编号热榜样式。
- 公网娱乐首页、健康检查、分类接口和明星热点列表均为 HTTP 200；未登录管理列表仍为 HTTP 403；HTML 保持 `Cache-Control: no-cache`。

Deployment:
- 生产已变更；回退备份为 `C:\PandaDashboard\_deploy-backups\github-29393365631-1`。
- 清单使用 `restart=none`，未重启娱乐服务、主服务、Caddy、Consistency Gate 或公司端 L2 worker；未修改娱乐数据库、账号数据、会话、行情或策略数据。

Notes for next agent:
- 娱乐页视觉任务已完成 GitHub 合并、生产部署与公网验收；当前无待部署文件。
- 后续若修改 `yule.html`，继续使用受保护清单部署，并保持娱乐 API、管理权限门和真实图片数据链不变。

## 2026-07-15 - Codex - 娱乐页导航统一与真实更新时间待发布

Changed:
- 修复生产娱乐页仍使用独立顶部栏的问题：移除额外“首页”，按主页统一为“行情 / 娱乐 / 探索 / 瞎聊聊 / 关于 / 联系”，同时对齐 Logo、桌面/手机高度、留白和登录/注册按钮。
- 娱乐页内容概览增加真实 `UPDATED` 状态，读取 `/health` 的 `state.lastCollectAt` 并按北京时间显示；缺失或读取失败时明确显示暂不可用，不伪造时间。
- 新增只包含 `yule.html`、无需重启服务的受保护生产清单。

Files:
- `yule.html`
- `tests/yule-nav-consistency.test.js`
- `ops/production/manifests/yule-navigation-updated-at-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地桌面与手机对照确认娱乐页顶部栏和主页顺序、尺寸、账号入口一致，手机栏目可横向浏览且页面无横向溢出。
- 娱乐页真实健康数据可显示北京时间更新时间；接口缺失和失败状态有明确回退。
- 娱乐页内联脚本语法、导航专项测试、`git diff --check` 和全仓测试通过；首页、行情、后台和娱乐入口均可访问。

Deployment:
- 本条记录提交时尚未部署生产，未修改云端运行时状态，未重启任何服务。

Notes for next agent:
- 本次仅发布娱乐页静态文件，不修改娱乐数据库、采集服务、账号数据、行情或策略；生产清单 `restart=none`。
- 合并至 `main` 后运行受保护生产工作流，并在公网桌面/手机检查六项导航、娱乐当前态、登录/注册和更新时间。

## 2026-07-15 - Codex - 娱乐页导航与更新时间完成生产发布

Changed:
- PR #89 已合并娱乐页顶部导航统一、真实更新时间、导航回归测试与单文件生产清单。
- 受保护生产工作流从固定 `main@86d43bc93adf759d0df9a2c19a8da787d7f48295` 原子替换云端 `yule.html`。

Files:
- 云端 `C:\PandaDashboard\yule.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 run `29399731652` 成功，部署器返回 `health=ok`；生产与 `main` 的 `yule.html` SHA-256 均为 `55626cb29e2476f43a476238428fedc3626eee3658680d95177c5464cc324721`。
- 公网页面源码按顺序包含“行情 / 娱乐 / 探索 / 瞎聊聊 / 关于 / 联系”，不再包含额外“首页”；娱乐 `/health` 返回真实 `lastCollectAt`。
- 生产首页、行情和后台均为 HTTP 200。

Deployment:
- 生产已变更；回退备份为 `C:\PandaDashboard\_deploy-backups\github-29399731652-1`。
- 清单使用 `restart=none`，未重启娱乐服务、主服务、Caddy、Consistency Gate 或公司端 L2 worker；未修改任何运行时数据库。

Notes for next agent:
- 本次娱乐页顶部栏问题已完成 Git 合并、生产发布和公网验收；若浏览器仍显示旧版，先强制刷新以清除旧文档缓存。

## 2026-07-15 - Codex - 首页瞎聊聊改用四人室外预览图

Changed:
- 按用户最终选择，将首页“瞎聊聊”卡片替换为蓝调屋顶、四人一起看手机的室外场景。
- 保持卡片布局、文案、遮罩、跳转和响应式规则不变；PNG/WebP 均输出为 `1200 × 720`，资源缓存版本升为 `v=3`，首页编译脚本缓存键同步更新。
- 新增仅包含首页静态文件、无需重启服务的受保护生产清单。

Files:
- `Qi/assets/chatter-cute-preview.png`
- `Qi/assets/chatter-cute-preview.webp`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `Qi/index.html`
- `tests/font-woff2-yule-cache.test.js`
- `tests/explore-editorial-layout.test.js`
- `ops/production/manifests/chat-rooftop-preview-20260715.json`
- `design-qa.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 桌面 `1440 × 1024` 和手机 `390 × 844` 实页对照通过，四个人物、手机和屋顶夜景均在卡片裁切内；手机无横向溢出，浏览器控制台错误为 0。
- 浏览器实际选择 `v=3` WebP，天然尺寸为 `1200 × 720`；卡片仍指向 `#chat`。
- `node Qi/build-home.js`、编译脚本语法、专项测试、`git diff --check` 和全仓测试 `32/32` 均通过。

Deployment:
- 本条记录提交时尚未部署生产，未修改云端运行时状态，未重启任何服务。

Notes for next agent:
- 本次仅更换首页静态视觉资源和缓存版本，不涉及账号、权限、行情、策略或运行时数据库，不需要 AI 讨论组协议。
- 合并至 `main` 后使用 `ops/production/manifests/chat-rooftop-preview-20260715.json` 运行受保护生产工作流，并在公网确认图片 `v=3` 命中及首页卡片裁切。

## 2026-07-15 - Codex - 四人室外瞎聊聊预览图完成生产发布

Changed:
- PR #91 已合并用户选定的蓝调屋顶四人室外图、PNG/WebP 缓存版本、首页构建产物、回归测试、设计验收和静态生产清单。
- 受保护生产工作流从固定 `main@c08b405ebfe8d34f285ed00ff9b2963fab624717` 原子替换首页两份图片、JSX、编译脚本和入口 HTML。

Files:
- 云端 `C:\PandaDashboard\Qi\assets\chatter-cute-preview.png`
- 云端 `C:\PandaDashboard\Qi\assets\chatter-cute-preview.webp`
- 云端 `C:\PandaDashboard\Qi\qi-home.jsx`
- 云端 `C:\PandaDashboard\Qi\qi-home.compiled.js`
- 云端 `C:\PandaDashboard\Qi\index.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 run `29400873545` 成功，部署器返回 `health=ok`，批准提交为 `c08b405ebfe8d34f285ed00ff9b2963fab624717`。
- 公网 PNG SHA-256 与 `main` 同为 `8a1e2fcf6480ef57a3fb12909ce8437032b8537f692629bdca10db10e5adf040`；公网 WebP SHA-256 与 `main` 同为 `a20cfd61ae9d8f3d257742a8017c3fc6f32dd00626a203f750ee213c924f4b98`。
- 公网首页已引用 `qi-home.compiled.js?v=20260715-chat-rooftop`；首页、预览图、行情、后台和娱乐页均为 HTTP 200。

Deployment:
- 生产已变更；回退备份为 `C:\PandaDashboard\_deploy-backups\github-29400873545-1`。
- 清单使用 `restart=none`，未重启主服务、娱乐服务、Caddy、Consistency Gate 或公司端 L2 worker；未修改任何运行时数据库。

Notes for next agent:
- 四人室外瞎聊聊首页预览图已完成 GitHub 合并、生产部署和公网哈希验收；当前无待发布文件。
- 若浏览器仍显示旧图，使用带版本的首页链接或强制刷新，资源地址应命中 `chatter-cute-preview.webp?v=3`。

## 2026-07-15 - Codex - 涨停复盘首字母搜索稳定化（海思科 hsk）

Changed:
- 修复涨停复盘股票简称首字母搜索依赖访问者浏览器 `Intl` 拼音排序实现的问题：主服务的近 N 日股票池新增只读 `initials` 字段，前端将服务端索引与本地计算结果合并匹配。
- `resolveReviewUniverseCode` 统一复用完整搜索文本，股票名称、代码、服务端首字母、浏览器首字母及原有原因字段保持同一匹配口径；未写死“海思科”特例。
- 新增同时部署主服务与行情前端、只重启主服务的受保护生产清单。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/review-stock-search.test.js`
- `ops/production/manifests/review-hsk-search-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产只读核对 `2026-06-29 / 002653`：近 30 日股票池返回 `002653 / 海思科`，未发现源数据缺名；当前生产响应尚无 `initials`，证明问题是搜索索引兼容而非股票底库缺失。
- 新增回归模拟浏览器无法生成拼音首字母时，服务端 `海思科 -> hsk` 且前端 `hsk -> 002653`；专项测试通过。
- `node --check kpl-stats-server.js`、行情页内联脚本语法、`git diff --check` 和全仓测试 `32/32` 通过；生产行情页、后台和近 30 日股票池接口均为 HTTP 200。

Deployment:
- 本条记录提交时尚未部署生产，未修改云端运行时数据，未重启任何服务。

Notes for next agent:
- 本次是复盘搜索兼容性修复，不改变复盘原始库、四源归纳、题材归因、龙头评分或历史数据，因此不需要 AI 讨论组协议或策略证据回放。
- 合并后使用 `ops/production/manifests/review-hsk-search-20260715.json` 发布，并在复盘页选择有海思科记录的日期，用 `hsk` 与 `002653` 对照验收。

## 2026-07-15 - Codex - 首页娱乐“今日值得看”与移动联系我们回顶

Changed:
- 首页娱乐预览卡改为“今日值得看”，沿用娱乐内容的真实标题、摘要和图片，并显示可读栏目名称。
- 娱乐首页预览接口移除“明星优先”的旧规则，改为优先选择北京时间当天、跨栏目的带图内容；当天无内容时回退到数据中的最新日期。
- 首页内部页面切换统一滚动到新页面顶部，修复手机从首页底部点击“联系我们”后仍停留在旧滚动位置的问题。
- 更新首页编译产物和脚本缓存版本，并新增接口选取与页面回顶回归测试及受保护生产清单。

Files:
- `yule-server.js`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `Qi/index.html`
- `tests/home-preview-contact.test.js`
- `tests/explore-editorial-layout.test.js`
- `ops/production/manifests/home-today-contact-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node Qi/build-home.js`、首页编译产物和娱乐服务语法、专项测试、`git diff --check` 与全仓测试均通过。
- 手机 `390 × 844` 实页确认娱乐卡显示 2026-07-15 的 `Sweety《樱花草》`、真实 `800 × 800` 图片和“今日值得看”文案。
- 手机从首页底部点击“联系我们”后，地址切换为 `#contact`，滚动位置从 `1600` 回到 `0`，联系我们首屏完整显示且浏览器无报错。

Deployment:
- 本条记录提交时尚未部署生产，未修改云端运行时状态，未重启任何服务。

Notes for next agent:
- 本次不涉及账号权限、行情、策略、娱乐采集数据库或历史修复，不需要 AI 讨论组协议。
- 合并至 `main` 后使用 `ops/production/manifests/home-today-contact-20260715.json` 发布；该清单会更新首页静态文件和娱乐接口，并只重启娱乐服务。

## 2026-07-15 - Codex - PR #93/#94 生产发布与策略 PR #87/#88 审核

Changed:
- 从固定 `main@1ae6b546fe3fc0d187eaf908f934ab970d798279` 运行两次受保护生产工作流，先发布 PR #93 的海思科首字母搜索，再发布 PR #94 的首页“今日值得看”和移动联系我们回顶。
- 工作流 run `29403351866` 原子替换主服务与行情页并只重启主服务；run `29403507709` 原子替换娱乐服务与首页文件并只重启娱乐服务。
- 对策略草稿 PR #87、#88 在最新 `main` 上完成冲突合并模拟、代码审查和全仓测试，并将正式 `COMMENTED` 审核写入 GitHub；两项均明确为“暂不批准”。

Files:
- 云端 `C:\PandaDashboard\kpl-stats-server.js`
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端 `C:\PandaDashboard\yule-server.js`
- 云端 `C:\PandaDashboard\Qi\qi-home.jsx`
- 云端 `C:\PandaDashboard\Qi\qi-home.compiled.js`
- 云端 `C:\PandaDashboard\Qi\index.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 两次工作流均通过脚本哈希、固定提交、管理员连接、备份、原子替换、定向重启和本机健康检查；两个 run 均为 `success`、`health=ok`。
- 生产近 30 日复盘股票池返回 `002653 / 海思科 / initials: hsk`，主服务健康检查为 `ok`。
- 生产首页已引用 `qi-home.compiled.js?v=20260715-home-today-contact`，娱乐推荐为 2026-07-15 的 `Sweety《樱花草》` 和 `800 × 800` 图片；首页、行情、后台、娱乐均为 HTTP 200。
- 公网首页 `index.html`、首页编译脚本和行情 HTML 的 SHA-256 均与 `main` 对应文件一致。
- PR #87 合并模拟全仓测试 `33/33` 通过；PR #88 合并模拟全仓测试 `34/34` 通过；两者仅 `docs/DAILY_HANDOFF.md` 与最新 `main` 冲突，代码可自动合并。
- PR #88 审核确认真实主线链路 `getDayBoardsWithMembers` 仍遍历 `[6,5,7]`，且按板块名跨来源去重会丢失东财/同花顺其中一源；现有测试没有覆盖这两个 P1 问题。
- PR #87 审核确认公式实现与描述基本一致，但缺标准生产证据包、正向翻转案例和自动扫描行为测试；当前 reviewer 环境未注入 AI 只读 Token，未伪造独立生产证据结论。

Deployment:
- 生产已变更；主服务发布备份为 `C:\PandaDashboard\_deploy-backups\github-29403351866-1`，娱乐与首页发布备份为 `C:\PandaDashboard\_deploy-backups\github-29403507709-1`。
- 仅重启主服务和娱乐服务；未重启 Caddy、Consistency Gate 或公司端 L2 worker，未修改任何运行时数据库。

Notes for next agent:
- PR #87 审核：`https://github.com/dmz1108/dmzrepo/pull/87#pullrequestreview-4702711567`；PR #88 审核：`https://github.com/dmz1108/dmzrepo/pull/88#pullrequestreview-4702711558`。GitHub 不允许仓库账号对自己名下 PR 设置 `REQUEST_CHANGES`，因此状态为 `COMMENTED`，正文已明确阻断。
- Claude 需要同步最新 `main`、解决交接文档冲突并逐项回复审核；#87 必须补齐可重放证据与行为测试，#88 必须先修真实主线链路仍消费 KPL、同名跨源丢失和 KPL-only 日期判可用的问题。
- 部署后通过接口与文件哈希完成公网验收；in-app browser 新标签连接两次超时，因此未把部署后手机点击冒充已重跑成功，手机点击回顶的实页交互证据来自部署前同一编译产物的 `390 × 844` 验收。

## 2026-07-15 - Codex - 修复 hsk 搜索名录窗口

Changed:
- 定位到生产页面虽已支持服务端首字母，但前端只请求近 10 个交易日股票名录；海思科最近记录已超出该窗口，因此 `hsk` 无法解析为 `002653`。
- 将复盘搜索名录扩展为服务端已支持的近 30 个交易日，并增加回归断言防止退回 10 日。
- 新增受保护生产发布清单，只更新行情页并重启主服务。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/review-stock-search.test.js`
- `ops/production/manifests/review-hsk-window-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产只读对照确认 `days=10` 返回 535 只且无海思科，`days=30` 返回 1428 只且包含 `002653 / 海思科 / hsk`。
- 复盘搜索专项测试、行情页内联脚本语法检查、`git diff --check` 和全仓 33 个测试文件全部通过。
- 发布后公网行情 HTML 的 SHA-256 与 `main@98898ce6f7f76c035dac80b43190db0796002862` 完全一致；线上包含一处 `days=30`、零处旧 `days=10`。
- 发布后主服务健康检查为 `ok`，首页、行情、后台和娱乐均为 HTTP 200。
- 变更不涉及登录、管理员权限、复盘原始数据、策略归因或运行时数据库。

Deployment:
- 已通过受保护工作流 run `29404801196` 从固定 `main@98898ce6f7f76c035dac80b43190db0796002862` 部署，工作流返回 `health=ok`。
- 只更新 `kpl-dashboard_17_apple.html` 并重启主服务；备份目录为 `C:\PandaDashboard\_deploy-backups\github-29404801196-1`，未修改任何运行时数据库。

Notes for next agent:
- 本次是搜索窗口修复，不需要 AI 讨论组协议或策略证据回放。
- in-app browser 在重载超大行情页时持续超时，因此不冒充已完成部署后点击验收；公网文件、接口、哈希与健康检查已完整通过。若用户仍保留发布前已打开的页面，需先强制刷新再用 `hsk` 验证。

## 2026-07-15 - Codex - 修复 hsk 历史命中跳转

Changed:
- 确认上一次 30 日名录修复后，`hsk` 已能解析为 `002653`，但后续单股详情接口仍固定只回看 10 个交易日，返回 `ok:false / referenceDay:null`，因此页面无法跳到海思科的历史复盘日。
- 30 日股票名录现在同时返回每只股票的 `latestDay`；前端对名称、代码或首字母的精确命中直接跳到最近涨停日，不再依赖 10 日详情回退。
- 仅精确命中触发自动跳转，避免用户输入单个字母时被模糊命中提前拉走。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/review-stock-search.test.js`
- `ops/production/manifests/review-hsk-reference-day-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产只读复现：`/recent-universe?days=30` 包含 `002653 / 海思科 / hsk`，但修复前 `/stock?code=002653&day=2026-07-15` 返回 `windowDays:10 / ok:false / referenceDay:null`。
- 专项回归已覆盖 `hsk -> 002653 -> latestDay 2026-06-29 -> reviewDateOverride 2026-06-29 -> 刷新`完整链路。
- `node --check kpl-stats-server.js`、`git diff --check`、行情页内联脚本检查与全仓 33 个测试文件全部通过。
- 发布后生产 30 日名录实际返回 `002653 / 海思科 / hsk / latestDay: 2026-06-29`；公网行情 HTML 包含新跳转函数且 SHA-256 与 `main@31c6a088fd5ad16d386eda115a76dcb1596ba9cf` 一致。
- 主服务健康检查为 `ok`，首页、行情、后台和娱乐均为 HTTP 200。

Deployment:
- 已通过受保护工作流 run `29407600277` 从固定 `main@31c6a088fd5ad16d386eda115a76dcb1596ba9cf` 发布，返回 `health=ok`。
- 只更新 `kpl-stats-server.js` 和 `kpl-dashboard_17_apple.html` 并重启主服务；备份为 `C:\PandaDashboard\_deploy-backups\github-29407600277-1`，未修改任何运行时数据库。

Notes for next agent:
- 这是复盘搜索导航修复，不改变四源归纳、策略评分或历史库，不需要 AI 讨论组协议。
- 公网文件、接口、哈希和健康检查已通过；受 in-app browser 重载行情页超时限制，未冒充部署后输入点击已通过。

## 2026-07-15 - Claude - 明星门槛下调 + 自动扫描门槛下调/高流入直通(Owner 定稿)

Changed(kpl-stats-server.js,两项 Owner 2026-07-15 定稿):
- ① 明星判定改单一最大档判据:该股最大可统计档 主动买 > 1.5亿(旧 3亿)且 activeRatio(主动买/主动卖) > 1.65;封板满足→明星确认,未封大涨(≥5%)满足→预期明星。不再看 passiveRatio/supportRatio,不再要求逐档先决。最大档无大单/数据缺失/现价缺失一律不确认。取证脚本 run 已确认旧 3亿+2-of-3 口径把今日医药(最大档主动买最高仅 0.62亿)全判 sealedWeak;新口径亦不误放(0.62亿<1.5亿)。
- ② 自动扫描准入门槛 净流入 8亿→5亿;新增高流入直通 `AUTO_SCAN_HIGH_INFLOW_OVERRIDE=10e8`:净流入≥10亿时无视"涨停≥2"直接排队 L2 验证(救大消费这类钱多涨停少、原先恒挂"L2待验证"的主线)。补选板豁免与限流不变。

Files:
- `kpl-stats-server.js`
- `tests/star-l2-layers.test.js`(按新明星规则重写)
- `tests/scan-priority.test.js`(静态断言适配新过滤式,校验补选豁免仍在 + 高流入直通存在)
- `ops/production/manifests/strategy-star-auto-scan-gates-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；Codex 在同步最新 `main` 的最终 PR 提交上重跑全仓 33 个测试文件全绿；`git diff --check` 通过。
- 生产实证(只读 ops run 29392424725):今日医药各涨停股最大档主动买 0.05~0.62亿,均 < 1.5亿——新星标口径下今日医药仍无明星(如实,非漏报);验证了 sealedWeak 主因是金额而非 dataMissing(worker 五档齐全 withAllBuckets==rows)。
- 发布后 `/api/strategy-mainlines?day=2026-07-15` 返回 `ok:true`、`mode:intraday-mainline`、6 条主线、`quality.ok:true`，无顶层错误；首页、行情、后台和娱乐均为 HTTP 200。

Deployment:
- PR #87 已经 Owner 批准、Codex 复核并合并 `main`；已通过受保护工作流 run `29410694213` 从固定 `main@daa1bd030a1881a2053ae101962dcd8d1cfc0554` 发布，返回 `health=ok`。
- 只更新 `kpl-stats-server.js` 并重启主服务；备份为 `C:\PandaDashboard\_deploy-backups\github-29410694213-1`，未修改历史或运行时数据库，未重启 Caddy、Consistency Gate 或公司端 L2 worker。

Notes for next agent(Codex 复核重点):
- 明星口径:确认"只看最大档 activeBuy>1.5亿 且 activeRatio>1.65、丢弃 passive/support 与逐档先决"符合 Owner 定稿;旧常量 STAR_SEAL_RATIO/PRE_RATIO/MAX_PRE_RATIO 已停用但保留定义以兼容提取脚本。
- 自动扫描:高流入直通阈值 10亿 为 Claude 建议默认值,Owner 可调;仅放宽"涨停数"闸,金额下限仍 5亿、限流(每5分钟2个/单任务在飞)不变,不至于压垮 worker。
- Owner 已明确接受此 PR 未补齐标准生产证据包与 10 亿边界行为测试的风险；下一交易时段应关注新规则实际入队与明星结果，异常时使用本次备份回滚。
- KPL 剔除 + 策略卡片 R2 同源配对是另一个独立 PR,不在本 PR 内。

## 2026-07-15 - Codex - 手工补录 2026-07-15 TGB 湖南人复盘

Changed:
- 严格按 `docs/ops/TGB_HUNAN_DAILY_SOP.md` 强制刷新当天淘股吧原文和 17 张原始图片，只采用官方白底 `@TGB湖南人` 表格 `image-01-06.png`；全程未调用 OCR、Qwen 或其他自动视觉识别。
- 排除顶部重复的“市场连板股”摘要、底部 20 行“涨停炸板”、同花顺可视化图和非官方图片，按原图题材块与细分原因人工逐行录入 71 行正式 `review/tgb-hunan-structured`。
- 写入正式源后只强制重折 `2026-07-15` 综合主因库，没有修改其他日期。
- 已在 Codex App 建立工作日自动任务“每日淘股吧湖南人复盘”，当前按北京时间每个工作日 19:30 执行同一人工-only SOP；非交易日跳过，任何对账或清晰度失败都停止写入并报告。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-15.json`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-15.json`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 官方文章：`https://www.tgb.cn/a/2ts6SAZffqJ`，标题 `7.15湖南人涨停复盘+晚间消息汇总`；使用图片 `image-01-06.png`。
- 题材块：业绩 23、医药 15、大消费 11、机器人 7、其他热点 6、其他个股 9，合计 71。
- 本机与云端分别对账终盘涨停池：正式 71、基准 71、missing 0、extra 0、duplicate 0、weak 0；唯一名称差异为原图“迪哲医药”与终盘池“迪哲医药-U”，按来源忠实保留原图名称并显式记录。
- 正式 TGB 源 SHA-256：`e01446e4c489e5463ffb0495a09fda8a428df0550e7c485a29aa2b8434a16ac3`；重折后综合主因库 SHA-256：`8132fc983b69dc3ba739ed3605b49216c2b0e2e42076d4d7251d4418ed08ea7f`。
- 公网强制刷新 `source-view` 后，综合归纳/复盘啦/选股宝/韭研/淘股吧均为 71；TGB 71 行均为 `manual-structured-image`、`confidence=0.99`、`reasonQuality=clear`、低置信 0，`sourceErrors` 为空。
- 同日 `after-close-status?mainReasonMode=same-day` 返回涨停库、主因库、收盘价、东财概念、同花顺概念全部正常；TGB 覆盖和主因覆盖均为 100%，公网 `/health` 为 HTTP 200。

Deployment:
- 生产运行时数据已更新；未部署应用代码，未重启任何服务。
- 回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260715-20260715-194530`，包含写入前综合主因库、raw manifest、官方图片和单日重折输出；此前不存在当天正式 TGB 文件。
- 两份云端运维日志均已追加记录；未记录 Token、Cookie、密码、私钥、用户数据或管理员会话。

Notes for next agent:
- 2026-07-15 四个正式复盘源现均为 71/71。后续每日继续同一 SOP，不能用自动视觉结果、同花顺图、摘要重复区或炸板区覆盖人工正式库。
- 默认 `/api/after-close-status` 仍按 previous-trading-day 展示上一交易日；验证当天人工重折结果时应显式使用 `mainReasonMode=same-day`，正式 `source-view?day=2026-07-15&force=1` 已确认当天五个标签均为 71。
## 2026-07-15 - Claude - 策略页剔除 KPL + 卡片 R2 同源配对(Owner 定稿)

Changed(Owner 2026-07-15 两部分,一个 PR):
- KPL 剔除:新增 `STRATEGY_ZS_TYPES = [6, 5]`,`getStrategyBoardsForDay`(快照+实时两处)与 `collectStrategyQiCodes` 改用它——策略主线的候选识别、共振、板块数、净流入、涨幅、明星判定、QI 新晋基线全部只用东财(6)+ 同花顺(5),KPL(7)不统计不展示。(`getStrategyBoardStocks` 的逐 plateId 查表保留 [6,5,7],因策略已不传 KPL plateId,无副作用。)
- R2 同源配对:新增 `strategyMainlineSourcePairs(boards)`——按源各取净流入最大板,`{board, netInflow, gainPct}` 三项取自同一个板(同源一一对应,绝不跨源拼)。合并路径 + seeds 路径 + AI 只读证据 均输出 `sourcePairs:{eastmoney, ths}`。
- 前端 `kpl-dashboard_17_apple.html`:新增 `strategyMainlineSourcePairsHTML(m)`,卡片在原「资金口径 单板」行下并列显示东财、同花顺两组(缺一源只显示有的那组);配套 `.ml-srcpairs` 样式。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/strategy-source-pairs.test.js`(新增:配对逻辑 + KPL 剔除 + 前后端静态断言)
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过(server + 内联脚本);全仓 **31 个测试文件全绿**;`git diff --check` 通过。
- 配对单测:东财组取净流入最大的东财板且涨幅同板(不取涨幅更高的另一东财板);同花顺同理;KPL 板即便钱最大也不成组;缺源该组 null。

Deployment:
- 未部署;策略核心+展示改动,合并 main 后经受保护生产工作流部署 `kpl-stats-server.js` + `kpl-dashboard_17_apple.html`,重启主服务(HTML 静态但后端同改,需重启)。等 Codex 复核。

Notes for next agent(Codex 复核重点):
- KPL 剔除是否彻底(候选/共振/净流入/涨幅/明星/新晋 均不含 7);`getStrategyBoardStocks` 保留 [6,5,7] 是否可接受。
- R2:每组净流入与涨幅是否严格同板;`sourcePairs` 是否随合并/seeds/AI 三条路径都透出(响应经 `...mainline` 展开透传)。
- 卡片两组并列展示与旧「资金口径 单板」行共存;如需去掉旧行 Owner 再定。
- 与 PR #87(星标门槛 + 自动扫描)相互独立,合并顺序无依赖。

## 2026-07-15 - Claude - 修正 #88 P1:KPL 剔除挪到真实主线取板链路(Codex 复核发现)

Changed:
- Codex 复核指出前一版把 `STRATEGY_ZS_TYPES` 只加在 `getStrategyBoardsForDay`/`collectStrategyQiCodes`,而真实主线链路是 `buildStrategyMainlinesLiveImpl → getDayBoardsWithMembers`(仍固定 [6,5,7])——KPL 实际未被剔除。**属实,已修**。
- `getDayBoardsWithMembers` 新增 `options.zsTypes`(默认 [6,5,7],看板/复盘等共享调用者不变、不误伤);`buildStrategyMainlinesLiveImpl` 的取板调用传 `zsTypes: STRATEGY_ZS_TYPES`,主线候选/板块数/资金/涨幅/排序/L2 的板源现在真实剔除 KPL。
- 新增 `tests/strategy-kpl-exclusion.test.js`:**贯穿真实 `getDayBoardsWithMembers`**(仅 stub 磁盘 IO),断言 zsTypes=[6,5] 时 KPL 独有板+同名 KPL 板均不进候选、同名“医药”取自东财;默认口径 KPL 仍在(不误伤)。

Files:
- `kpl-stats-server.js`(getDayBoardsWithMembers + buildStrategyMainlinesLiveImpl 取板调用)
- `tests/strategy-kpl-exclusion.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check` 通过;全仓 33 个测试文件全绿;`git diff --check` 通过。

尚未处理(按 Owner「先只修 P1」决定,留后续):
- Codex 点 2:`getDayBoardsWithMembers` 按板名跨源去重(`bmap.get(name)`)会让同名东财/同花顺板塌成一条,R2 `sourcePairs` 仍常拿不到两源——需改 source-aware 身份(zsType+name/plateId)+ 贯穿上游的行为测试。
- 点 3 snapshot-day 可用性把 KPL-only 快照算数;点 4 冻结历史快照不受本次影响、PR 文案勿称历史已完全剔除;点 5 证据包 + 讨论组记录。
- getStrategyStrongResonance / getDayThemeBoardStats / getStrongThemeMap 等其它策略面板仍走默认 [6,5,7](本次只修主线 P1)。

## 2026-07-15 - Claude - #88 点2:同源塌板保留 bySource,R2 配对可靠成对

Changed:
- Codex 复核点2 属实:`getDayBoardsWithMembers` 按板名去重会让同名东财/同花顺板塌成一条,`strategyMainlineSourcePairs` 之后按板自身 zsType 过滤往往只剩胜出源一组。
- 去重仍按板名(板块数/排名口径不动),但每源各留一份净流入/涨幅到 `winner.bySource[zsType]`;`strategyMainlineSourcePairs` 优先读 `bySource[zs]`(塌板后仍同源还原),无则回退板自身 zsType,绝不跨源拼。
- `seed.boards` 与 `resonanceBoards` 映射透传 `bySource`,合并与种子两条路径均可用。

Files:
- `kpl-stats-server.js`(getDayBoardsWithMembers 去重 + strategyMainlineSourcePairs + seed/resonance 透传)
- `tests/strategy-kpl-exclusion.test.js`(扩充:塌成一条的“医药”仍能同源还原东财 8亿/3% 与同花顺 6亿/4%;KPL zt20/50亿 不进策略口径不污染配对)

Validated:
- `node --check` 通过;全仓 33 个测试文件全绿。

尚未处理(按 Owner 分阶段决定,留后续):
- 点 3 snapshot-day 可用性把 KPL-only 快照算数;点 4 冻结历史快照 PR 文案勿称历史已完全剔除;点 5 证据包 + 讨论组记录。

## 2026-07-15 - Claude - #88 点3/4/5:快照日可用性 + 历史边界澄清 + 生产证据/讨论组

Changed:
- 点3(代码):`strategySnapshotDayHasSnap` 从遍历 `[6,5,7]` 改为 `STRATEGY_ZS_TYPES`——仅有 KPL(7) 快照、缺 zs5/zs6 的日期对策略页视为空板日不可用,避免 `resolveStrategySnapshotDay` 选到策略板块为空的日子。三处调用(getStrategyBoardsForDay / getDayBoardsWithMembers 策略路径 / getStrategyQiBoard)均策略口径,不误伤看板/复盘。
- 点4(文案边界):明确本改动仅影响新生成快照 + 实时 live 口径,不改历史冻结快照;PR 文案与讨论记录不宣称历史展示已完全剔除 KPL。历史迁移/重建另起经审核方案。
- 点5(证据+讨论组):按 AI_PRODUCTION_READ.md 抓取标准证据包并回放校验,新增讨论组收敛记录。

Files:
- `kpl-stats-server.js`(strategySnapshotDayHasSnap)
- `tests/strategy-kpl-exclusion.test.js`(新增点3断言:有东财/同花顺快照的日可用、仅 KPL 的日不可用、无快照日不可用)
- `docs/strategy/discussions/2026-07-15-strategy-kpl-exclusion-r2-pairing.md`(新增讨论组记录)

Validated:
- 生产证据包:`day=2026-07-15 codes=002396,000566 themes=算力AI,大消费 window=30`,`bundleSha256=c5acd5e9779b91044795248c103793f399fc9b7501c0ba38706883f2f654f60c`,`complete=true`,`missingSources=[]`,`sourceErrors=[]`;`replay --require-complete --expect-sha` 通过。
- 快照对照:KPL(7) 今日 8 板板名全部不在东财∪同花顺(21 名)集合内→证实旧口径把 8 个 KPL 独有板算进策略。
- `node --check` 通过;全仓 33 个测试文件全绿。
- Token 仅由安全环境注入,未写入任何文件/命令参数/PR/文档;证据 JSON 留在 tmp 未入 Git,仅记录参数、哈希与结论。

Notes for next agent:
- #88 P1/点2/点3 已修并测,点4 边界已澄清,点5 证据+讨论组已补;等 Codex 重新复核。
- 历史冻结快照仍含 KPL(本 PR 不动);`getStrategyBoardStocks` 逐 plateId 保留 [6,5,7](策略不传 KPL plateId,无副作用)——是否统一待 Owner 定。

## 2026-07-15 - Claude - #88 v2:东财/同花顺两套独立主线预测(Owner 取代 R2)

Changed:
- Owner 最终口径:策略页拆两套独立预测,各只用本源数据,绝不跨源借资金/涨幅/板块数;KPL 不进任一边,也不进策略辅助指标(热点/共振)。
- 后端:`buildStrategyMainlinesLiveImpl` 增 `options.boardZsTypes`;`buildStrategyMainlinesLive` 正常页面路径并行跑东财[6]/同花顺[5],composed `mainlinesBySource:{eastmoney,ths}`(各带 available/count/mainLeaderTheme/mainlines,缺源 available=false 不借值;dualResonance 标双源共振不合并卡)。顶层 mainlines 保留为两套并集(带 source/sourceRank,不跨源重打分)供缓存/确认/AI 兼容;盘中预测用并集写一次。诊断/盘后复核路径口径不变。
- 确认标记落到东财/同花顺各自 mainlines;AI live 证据链输出 strategy.mainlinesBySource。
- 策略辅助指标剔除 KPL:共振榜(已改)+ 今日热点榜资金/涨幅补充 getDayThemeBoardStats 传 STRATEGY_ZS_TYPES(题材列表仍源自四源复盘主因库)。
- 前端:今日主线榜「东财主线预测 | 同花顺主线预测」两栏(桌面并列 ≤900px 上下),缺源显示暂缺,🔗双源共振标;旧冻结快照无 mainlinesBySource 时回退单列。

Files:
- `kpl-stats-server.js`(buildStrategyMainlinesLiveImpl/Live + compose/assemble/slim + getStrategyMainlinesWithConfirm + AI live + getDayThemeBoardStats)
- `kpl-dashboard_17_apple.html`(renderStrategyMainlinesHTML 两栏 + CSS)
- `tests/strategy-two-source-mainlines.test.js`(新增:5 条必测行为——A#1/B#1 分列、源独有题材不串、同名不交叉取值、缺源不借值、KPL 不进任一边)
- `tests/strategy-kpl-exclusion.test.js`(增热点榜剔除 KPL 静态断言)
- `docs/strategy/discussions/2026-07-15-strategy-kpl-exclusion-r2-pairing.md`(v2 Shared Decision + 生产证据)

Validated:
- 生产证据:`bundleSha256=c5acd5e9779b91044795248c103793f399fc9b7501c0ba38706883f2f654f60c`,`complete=true`;`replay --expect-sha` 通过。两源净流入前5不同(东财第1=创新药76.56亿,同花顺第1=仿制药一致性评价43.08亿)——实证两套独立预测的必要性;KPL 8 板全为独有,两套均不含。
- `node --check` 通过;前端内联脚本可编译;全仓 36 个测试文件全绿。
- Token 仅环境注入,证据 JSON 留 tmp,均未入 Git。

Deployment:
- 未部署。核心策略引擎 + 前端结构变更,合并后经 production-ops.yml 部署 kpl-stats-server.js + kpl-dashboard_17_apple.html 并重启主服务。等 Codex 复核。

Notes for next agent:
- 两套预测目前实现为「并行各跑一遍 impl」;性能上两源板块盘约各半、总量与旧合并相近,但共享证据读取翻倍——如盘中压力大可后续抽公共佐证层单读。
- 历史冻结快照无 mainlinesBySource → 前端回退单列(与 Codex 点4「不动历史」一致)。
- getStrongThemeMap(复盘💪强势标)仍默认三源——属复盘页非策略辅助指标,不误伤。

## 2026-07-15 - Claude - #88 v2 性能:配对运行期「按日只读」共享缓存

Changed:
- 两套独立预测并行各跑一遍引擎时,「按日、与板块来源无关」的磁盘读取会被读两遍。新增
  `strategyMainlineReadCache`(AsyncLocalStorage)+ `strategyMainlineReadCachedCall`:仅在
  `buildStrategyMainlinesLive` 成对构建两套预测的 run() 作用域内生效,把同一天的
  涨停库/主因库/收盘库/主线确认只读一次(缓存 Promise,天然去重并发)。
- 四个按日只读函数(readLimitUpDbDay / readEastmoneyCloseDbDay / readLimitUpMainReasonDbDay /
  readMainlineConfirm)拆成公开薄壳 + `...Impl`;壳走缓存,Impl 是原逻辑。其它任何调用者
  (不在该作用域)一律绕过缓存,行为零变化;带非默认 options 的读取也绕过。
- 关键:只共享「与来源无关」的按日读取,来源相关的取板/富化/评分/排序仍各跑各的——两套预测
  结果字节不变,不改任何口径。主因上下文的 30 日读取(经 readLimitUpMainReasonDbDay)因此
  从「两源×30 天」降到「30 天」。

Files:
- `kpl-stats-server.js`(ReadCache/CachedCall + 四个 reader 薄壳 + buildStrategyMainlinesLive 包 run 作用域)
- `tests/strategy-two-source-mainlines.test.js`(增缓存去重/结果一致/options 绕过/kind 不串键)
- `tests/leader-pool-debug.test.js`(EACCES/ENOENT 诊断改测 ...Impl 真身)

Validated:
- `node --check` 通过;全仓 36 个测试文件全绿。缓存结果与真读字节一致(测试断言),预测口径不变。

Notes for next agent:
- 缓存作用域仅限成对构建;历史/诊断/盘后复核路径不进该作用域,不受影响。
- 若未来把两套预测拆到不同请求(非并行),该缓存自然失效退回真读,无副作用。

## 2026-07-15 - Claude - #88 二审三项修复(动能隔离/预测按源/暂缺语义)

Changed(Codex 二审 head b2b9eba 提出,已逐项修复并同步最新 main):
- P1 动能采样按来源隔离:strategyMainlineTrackTrend 之前按 familyKey 存全局采样,东财/同花顺
  同题材共用键→先跑一边写基线、另一边拿它算假 delta,串改两套分数排名。augmentPrediction 增
  trendKeyPrefix,调用点按 'zs'+activeBoardZsTypes 组装(zs6::/zs5:: 各一套)。
- P1 盘中预测/回看按来源落库:不再把跨源并集当预测真值。writeMainlinePredictBySource 存
  bySource 两块(schema v3),同题材两份分块不互相覆盖、各源第2名保留;顶层兼容层=东财单源。
  getStrategyMainlineReview 按 bySource 分源评各自第1主线命中,row.bySource + stats.bySource。
- P2 区分"源不可用"与"源可用但无合格主线":slim available=ok(含有效零结果),新增
  hasMainlines;前端有 mainlinesBySource 不走单列空态早退,双栏三态(有主线/无合格主线/暂缺)。

Files:
- kpl-stats-server.js(trackTrend 键/augment/两套预测落库+回看/slim 语义/AI compact)
- kpl-dashboard_17_apple.html(空态早退守卫 + renderColumn 三态)
- tests/strategy-two-source-mainlines.test.js(动能隔离真实回归 + 有效零结果 + 前端三态)
- tests/predict-records.test.js(同题材双源重复 + 两边第2名)
- tests/leader-pool-debug.test.js(augment 新签名)

Validated:
- node --check 通过;前端内联脚本可编译;全仓 36 个测试文件全绿。
- 已 rebase 到最新 main(2f45121),DAILY_HANDOFF 冲突按时间线保留双方。

Notes for next agent:
- 回看 star/leader 封板胜率暂仍走主口径(顶层=东财单源);per-source 的封板胜率数据已在
  bySource.*.starTransitions 落库,如需分源封板统计可后续扩展 reader。
- 生产证据 bundleSha256=c5acd5e9…f654f60c(2026-07-15)不变。等 Codex 三审。

## 2026-07-15 - Codex - 追踪并修复 L2 已扫描仍显示未扫描

Changed:
- 生产只读复核确认 2026-07-15 不是没有自动扫描：共 15 个 `strategy-auto` 任务，14 个 `done`，1 个肝炎同花顺任务虽已 50/50 完整回传，但漏发最终 `done` 而停在 `running`。
- 队列重启恢复改为严格核验任务总数、唯一股票覆盖、结果行、现价和五档完整率；全部满足才自动恢复为 `done`，否则统一恢复为 `queued` 并真正重新入队。
- 主线三态覆盖率不再把 worker 合同明确排除的科创板/北交所代码计入分母，修复 CAR-T 两只可扫描股票已经全部覆盖、却被两只 `688` 股票永久卡在 `unscanned` 的问题。
- 新增紧急缺陷讨论记录；Claude 与 Company Codex 独立复核仍为 Pending，未评审前不合并、不部署。

Files:
- `local-l2-task-queue.js`
- `kpl-stats-server.js`
- `tests/local-l2-persistence.test.js`
- `tests/star-l2-layers.test.js`
- `tests/qi-mainline-states.test.js`
- `docs/strategy/discussions/2026-07-15-l2-scan-status-reconciliation.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 标准生产证据：`day=2026-07-15`，`codes=603387,600664,603538,000566,600721,300149`，`themes=肝炎,CAR-T细胞疗法`，`window=20`；`complete=true`，`missingSources=[]`，`sourceErrors=[]`，`bundleSha256=422fbec028beb5560bc47ae2ba4ff5e8ff8d0e644f3cc84beda18d5745bc7ad4`；本地完整性回放通过，证据 JSON 只在忽略目录，未进入 Git。
- 生产任务摘要：肝炎东财任务 `done` 且覆盖 4 个当日题材代码；肝炎同花顺任务 `running` 但 `scanned/results/resultRows/rowsWithPrice/rowsWithAllBuckets` 全为 `50/50`；CAR-T 东财任务 `done 18/18`，覆盖两只允许扫描的题材股。
- `node --check local-l2-task-queue.js`、`node --check kpl-stats-server.js`、L2 专项测试通过；全仓 `node --test tests/*.test.js` 为 33/33 通过。
- 云端主服务和队列配置正常；检查时公司 worker `workerOnline=false`、`pending=0`。这是当前心跳状态，不否定其盘中已完成 14 个任务。
- Codex App 自动任务“每日淘股吧湖南人复盘”为 `ACTIVE`，工作日 04:30 America/Los_Angeles（北京时间 19:30）在本机项目独立执行。

Deployment:
- 未部署代码、未修改生产配置或市场数据库、未重启任何服务；仅做只读生产检查和标准证据抓取。
- 2026-07-15 冻结主线快照未改写；历史快照是否重建需另行审批，默认保持冻结证据不漂移。

Notes for next agent:
- 独立复核应使用同一证据参数和哈希，重点挑战“完整 running 自动转 done”的五项条件与“排除代码不进覆盖分母”的边界。
- 合并部署后主服务重启会把 50/50 肝炎任务恢复为 `done`；只有中国时区当天的残缺任务会重新入队，公司 worker 仍需在线才能消费 pending。
- 湖南人自动任务无需用户每天发消息或保持本任务打开，但依赖本机 Codex、网络和云端访问可用；原文未发布、图片不清或对账失败时必须停止写入并报告，不得猜测。

## 2026-07-15 - Codex - 收敛 PR103 的 L2 重启续扫日期

Changed:
- 接受 Claude 对 PR103 的 P2 阻断：30 天是持久化记录保留期，不是 L2 可重扫窗口；实时 L2 不能用今天盘口补写历史任务。
- 队列启动时按中国时区确定唯一续扫日。任意日期的完整落盘任务仍可修正为 `done`；只有当天残缺任务恢复排队，历史残缺任务保留原记录并转为终止状态，不进入 worker 队列。
- 新增 25 天前残缺任务回归：重启后 pending 只含当天任务，worker 领取当天任务后不能再领取历史任务。
- 同步更新 L2 状态归并讨论，记录 Claude 挑战、Codex 修订和 Owner 明确要求修复的共同边界。

Files:
- `local-l2-task-queue.js`
- `tests/local-l2-persistence.test.js`
- `docs/strategy/discussions/2026-07-15-l2-scan-status-reconciliation.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check local-l2-task-queue.js` 通过。
- `node tests/local-l2-persistence.test.js` 通过，覆盖中国日期、当天续扫、历史终止和 worker 不领取历史任务。
- L2 专项测试全部通过；`node --test tests/*.test.js` 为 33/33 通过，`git diff --check` 通过。
- 变更只包含代码、测试和安全文档；敏感词扫描新增命中仅为既有测试假 Token，未加入密钥、运行时任务文件或原始 L2 数据。

Deployment:
- 未部署生产、未修改运行时数据或配置、未重启服务；PR103 继续保持 Draft，等待 Claude 复核。

Notes for next agent:
- 复核重点是 `persistDays` 与 `resumeDay` 已完全解耦；历史完整任务只做状态修正，历史残缺任务永不入队。
- 本次没有改变 L2 明星阈值、自动扫描门槛、策略评分、主线排名或冻结快照。

## 2026-07-15 - Codex - PR88 四审收敛并同步 PR103

Changed:
- 将 PR88 merge 同步到已包含 PR103 的最新 `main`（`d27a350`）；`DAILY_HANDOFF` 冲突按时间线保留 Claude 的 PR88 记录与 Codex 的 PR103 记录，没有丢弃任一方内容。
- 修正两套预测的源码注释与契约：东财/同花顺 impl 都不直接落库，外层按 `bySource` 两块写 schema v3；顶层仅为东财单源兼容层，跨源并集不作为预测真值。
- “预判回看”改为逐日分别显示东财/同花顺主题、无主线状态、命中/前三结果，并分别显示 `stats.bySource`；旧 schema v1/v2 继续走原单来源展示。
- schema v3 在盘中待验证或盘后主因不完整时仍返回两源 `theme/noMainline`，命中保持 `null` 且不进入分母；修复“东财空、同花顺有预测，页面却整体显示今日无主线”。
- schema v3 各来源块新增落库 `available/hasMainlines/reason/message/zsType`，永久区分“来源暂缺”和“来源可用但无正式主线”；早期 v3 空块无元数据时显示“历史状态未知”，不猜测。
- 分源行的明星/龙头收益仍只有东财兼容字段，因此行内显式标注“东财”；跨日期聚合可能同时含旧 schema，统一标为“历史兼容口径”，不把旧样本误冠名为东财。
- 数据不足、来源暂缺、历史状态未知均改为可见文字；两源一边命中、一边脱靶时整行使用中性强调，避免只取最好结果显示绿色。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/mainline-review.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `docs/strategy/discussions/2026-07-15-strategy-kpl-exclusion-r2-pairing.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js`、`node --check local-l2-task-queue.js`、前端回看渲染行为测试与 `git diff --check` 通过。
- 全仓 `node --test tests/*.test.js` 为 36/36 通过；新增覆盖东财空+同花顺有预测、来源暂缺落库/回看、早期 v3 未知态、两源统计芯片、旧 schema 回退、混合 schema 聚合标签、双源混合命中强调、盘后主因不完整仍保留两源主题。
- 标准生产证据回放通过：`bundleSha256=c5acd5e9779b91044795248c103793f399fc9b7501c0ba38706883f2f654f60c`，`complete=true`，`missingSources=[]`，`sourceErrors=[]`；证据 JSON 仍只在忽略目录，未进入 Git。

Deployment:
- 尚未部署生产、未修改生产运行时数据或配置、未重启服务；先等待 PR88 最新 head 复核并合入 `main`。

Notes for next agent:
- PR88 合并后，需用新 manifest 从最新 `main` 一次部署 `kpl-stats-server.js`、`local-l2-task-queue.js`、`kpl-dashboard_17_apple.html` 并重启主服务；现有 manifest 均不完整，不能复用。
- 部署后重点验证：策略主线两栏、两源回看、东财空/同花顺有预测边界、L2 完整任务恢复 `done`、仅当天残缺任务可续扫且历史残缺任务不重新派发。
- 同花顺明星/龙头收益明细尚未分源返回；如后续扩展必须读取同花顺自己的预测块与收益，不能借东财兼容值补齐。

## 2026-07-15 - Codex - 准备 PR103 + PR88 受保护生产部署清单

Changed:
- PR103 与 PR88 已按顺序合入 `main`：PR103=`d27a350`，PR88=`71d9919`。
- 新增单次生产部署 manifest，明确只发布 `kpl-stats-server.js`、`local-l2-task-queue.js`、`kpl-dashboard_17_apple.html`，重启目标仅为 `main`。
- 未复用旧 manifest，避免漏发 PR103 的队列恢复修复或 PR88 的双来源后端/前端改动。

Files:
- `ops/production/manifests/pr103-pr88-strategy-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- manifest 为合法 JSON；3 个 source 均为 Git 跟踪的普通文件，destination 无绝对路径、父目录跳转或重复项；`restart=main` 在受保护脚本允许列表内。
- `production-ops.yml` 将从触发时锁定的最新 `main` 归档 manifest 与 3 个源码文件，部署前校验两个 JavaScript 文件语法，部署后校验文件哈希和本机主服务健康；失败自动回滚。

Deployment:
- 本条仅准备清单，尚未触发生产工作流、未修改生产文件或数据、未重启服务。

Notes for next agent:
- 清单合入 `main` 后重新计算 `ops/production/deploy-from-main.ps1` 的 SHA-256，再以 `RUN_PRODUCTION` 触发受保护工作流；不得沿用本地或旧提交的哈希。
- 工作流完成后验证公网健康、主页/行情/后台、两源主线与回看、L2 完整/残缺/历史任务恢复边界，并把实际 run URL、部署提交、备份目录、重启与验证结果再次写入 Git handoff。

## 2026-07-15 - Codex - PR103 + PR88 生产部署与只读验收完成

Changed:
- 按顺序完成并合入 PR103（merge `d27a350`）、PR88（merge `71d9919`）和生产清单 PR104（merge `9b32ef8`）。
- 从受保护的 `main@9b32ef8512153f75b6cd840b8af2111720763bd4` 一次发布 PR103 的 L2 重启归并修复与 PR88 的东财/同花顺双来源策略、回看前后端改动。
- 部署后的只读 L2 证据确认 2026-07-15 共 15 个自动任务全部为 `done`；此前卡在 `running` 的肝炎同花顺 `308915` 已恢复为 `done`，其 50 条结果均含现价和完整五档。

Files:
- `kpl-stats-server.js`（生产发布）
- `local-l2-task-queue.js`（生产发布）
- `kpl-dashboard_17_apple.html`（生产发布）
- `docs/DAILY_HANDOFF.md`（本次验收记录）

Validated:
- 生产部署工作流 `29461921089` 成功；锁定提交、脚本 SHA、manifest 和部署后文件哈希校验均通过，云端本机健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `{"ok":true}`；行情主页、`/kpl`、`/admin` 和 `https://dreamerqi.com/` 均返回 HTTP 200。
- 只读 L2 审计工作流 `29462278151` 成功：15/15 任务均为 `done`，627 条结果全部含现价和完整五档；肝炎同花顺为 50/50/50，肝炎东财为 45/45/45，CAR-T 东财为 18/18/18。全量等级为 `active=51`、`none=547`、`sealedWeak=29`、`confirmed=0`；因此“没有 L2 确认主线”符合完整证据，继续显示“L2 未扫描”则不符合实际任务状态。
- 中国交易日 2026-07-16 检查时仍为盘前，策略接口正确返回 `market-not-open`；回看接口可返回 `stats.bySource`，但现有 6 个历史日仍全是旧 schema，东财/同花顺来源样本均为 0。因此双来源实时榜和新 schema 回看需在开盘并形成首个新预测日后再做最终在线验收，当前不能伪称已有生产样本。
- 本次 Git 变更仅为安全交接文字；未加入令牌、Cookie、运行数据库、原始 L2 明细或其他敏感运行文件。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29461921089`；备份：`C:\PandaDashboard\_deploy-backups\github-29461921089-1`。
- 仅重启主服务 `main`；未重启 Caddy、娱乐服务、Consistency Gate 或公司端 L2 worker。部署脚本已自动更新两份云端运维日志。
- L2 审计工作流 `https://github.com/dmz1108/dmzrepo/actions/runs/29462278151` 使用受审脚本 `ops/production/requests/2026-07-15-medical-l2-star-evidence.ps1`（SHA-256 `977c90b0ab39ca25ec74da8799985a3264cb4fa9eb68f79ecf153153b86bd1fa`）只读执行，未改生产配置、任务数据、行情数据库或服务状态。

Notes for next agent:
- 下一个交易时段优先验证 `/api/strategy-mainlines` 同时返回 `mainlinesBySource.eastmoney` 与 `mainlinesBySource.ths`，并检查“来源暂缺”和“可用但无主线”两种状态不会混淆。
- 首个 schema v3 预测落盘后，再验证 `/api/strategy-mainline-review` 的逐日双栏与 `stats.bySource` 分母/命中；旧 schema 继续显示兼容口径属于预期。
- 2026-07-15 的 L2 恢复验收已完成，无需再重启服务或改写冻结主线快照。

## 2026-07-15 - Codex - 统一首页娱乐预览与“今日值得看”主卡

Changed:
- 生产只读复现确认不是缓存问题：首页 `/api/yule/home-teaser` 为北京时间当天且有图的“哈哈哈哈哈第6季”，娱乐页“今日值得看”却从多日全局榜取到“灿如繁星”。
- 保留既定的“北京时间当天、跨频道、优先有图”推荐规则；娱乐页默认“全部”频道改为读取同一个 `/api/yule/home-teaser`，按内容 ID 置顶并从侧栏去重。
- 推荐接口失败或返回空时继续回退娱乐页原排行第一名；切换单独频道时仍使用该频道自身榜首，不被全站推荐覆盖。
- 新增仅发布 `yule.html`、无需重启服务的受保护生产清单。

Files:
- `yule.html`
- `tests/home-preview-contact.test.js`
- `ops/production/manifests/yule-home-teaser-consistency-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增覆盖同一推荐置顶、按 ID 去重、分类列表尚未出现新推荐、接口失败回退和单频道不受影响；专项测试通过。
- `yule.html` 内联脚本可编译；`node Qi/build-home.js` 后首页构建产物无差异，首页源文件和缓存版本无需改动。
- 全仓 `node --test tests/*.test.js` 为 36/36 通过；`git diff --check` 通过。
- 本次不改娱乐数据库、采集调度、账号权限、行情或策略，不需要 AI 讨论组协议。

Deployment:
- 本条记录提交时尚未部署生产、未改云端文件或数据、未重启任何服务。

Notes for next agent:
- 合入 `main` 后使用 `ops/production/manifests/yule-home-teaser-consistency-20260715.json` 受保护发布；`restart=none`。
- 公网验收应同时读取首页 teaser ID 与娱乐页默认“今日值得看”主卡 ID，二者必须一致；再抽查一个单频道仍展示自己的榜首。

## 2026-07-15 - Codex - 首页与娱乐“今日值得看”一致性完成生产发布

Changed:
- PR #106 已以 squash commit `222a4583f018310df2ab7c050586c497766d2ff5` 合入 `main`。
- 受保护生产工作流从固定 `main@222a458` 原子替换云端 `yule.html`，娱乐页默认“全部”频道现与首页复用同一 `home-teaser` 对象。

Files:
- 云端 `C:\PandaDashboard\yule.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 `29463485735` 成功，返回 `health=ok`；生产与 `main` 的 `yule.html` SHA-256 均为 `bb4caed894c07294c8a1a356951ec79b96ee06a7a7ebf4586a0635acf8c3012a`。
- 公网首页代理与娱乐服务的 `home-teaser` ID 均为 `a7f0f922fb00c3d8`，标题均为“哈哈哈哈哈第6季”；该 ID 存在于公开列表，生产页面源码已包含同对象置顶和按 ID 去重逻辑。
- 公网主页、娱乐页、行情页和后台均为 HTTP 200；娱乐 `/health` 返回 `ok=true`，登录/注册/忘记密码入口仍在。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29463485735`；备份：`C:\PandaDashboard\_deploy-backups\github-29463485735-1`。
- `restart=none`；未重启娱乐服务、主服务、Caddy、Consistency Gate 或公司端 L2 worker，未修改娱乐数据库、账号、会话、采集配置、行情或策略数据。

Notes for next agent:
- 本次展示一致性问题已完成代码、测试、Git 合并、生产发布和公网接口/文件验收；无需再次部署或重启。
- 若页面会话首次请求 `home-teaser` 失败，会按设计回退原排行；刷新页面会重新请求。后续若要会话内自动重试，应单独评估，不要改动本次推荐口径。

## 2026-07-15 - Codex - 娱乐分类改为最新日期优先

Changed:
- 按 Owner 要求将娱乐分类排序改为“日期降序、同一天热度降序”：有当天内容先显示当天最高热度；当天没有则自然回退最近一个有内容的日期。
- 分类页“今日值得看”主卡、侧栏和下方内容网格共用同一排序，避免主卡与列表再次出现不同日期口径；默认“全部”频道仍优先使用与首页一致的 `home-teaser`。
- 页面排序说明改为“最新日期优先 · 同日按热度排序”，分类区同步显示“日期优先 · 同日热度排序”。
- 新增只发布 `yule.html`、无需重启服务的受保护生产清单。

Files:
- `yule.html`
- `tests/home-preview-contact.test.js`
- `ops/production/manifests/yule-latest-day-first-20260715.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产只读样本证明旧逻辑把 2026-07-14 高热内容排在 2026-07-15 内容之前；新逻辑将明星热点首条确定为 2026-07-15 中热度最高的“都说了在肖战剧组不要谈恋爱”。
- 回归覆盖旧日超高热不能压过新日、新日内仍按热度、无日期元数据时按北京时间回退、首页 teaser 置顶去重和分类主卡/网格共用排序。
- `yule.html` 内联脚本可编译；专项测试和全仓 `node --test tests/*.test.js` 36/36 通过，`git diff --check` 通过。
- 不改采集服务、娱乐数据库、账号权限、行情或策略，不需要 AI 讨论组协议。

Deployment:
- 本条记录提交时尚未部署生产、未修改云端文件或数据、未重启任何服务。

Notes for next agent:
- 合入 `main` 后使用 `ops/production/manifests/yule-latest-day-first-20260715.json` 发布，`restart=none`。
- 公网验收明星热点首卡应为最新可用日期 2026-07-15 的最高热度内容；若后续采集到 2026-07-16 明星内容，应自动切换到 2026-07-16。

## 2026-07-15 - Codex - 娱乐日期优先规则已部署

Changed:
- PR #108 已合并到 `main`（`a156d910b7d93304b9727084dc420abfb626cf12`），并通过受保护生产流程只发布 `yule.html`。
- 生产部署器已自动把本次变更追加到云端两份运维日志。

Files:
- 云端 `C:\PandaDashboard\yule.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 `29465292464` 成功并返回 `health=ok`；线上与 `main` 的 `yule.html` SHA-256 均为 `dcd3030bbf71ea1ae13f851c48e9298e8f7730e885a24de9f23f47cc46e946c6`。
- 公网页面和明星热点 API 均为 HTTP 200，页面源码已包含“最新日期优先 · 同日按热度排序”和北京时间日期回退逻辑。
- 当前明星热点尚无 2026-07-16 新条目，因此按规则回退到最新可用日期 2026-07-15，首条为“都说了在肖战剧组不要谈恋爱”（ID `5e76c512a3d82e32`）。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29465292464`；备份：`C:\PandaDashboard\_deploy-backups\github-29465292464-1`。
- `restart=none`；未重启娱乐服务、主服务或其他服务，未修改娱乐数据库、采集配置、账号、行情或策略数据。

Notes for next agent:
- 本次日期优先问题已完成代码、测试、独立复核、Git 合并、生产发布和公网验收，无需再次部署。
- 后续一旦采集到 2026-07-16 的明星热点，页面会自动改为展示该日期中综合热度最高的内容；无需再改页面。
## 2026-07-16 - Claude - 修复两套预测的 catalog 跨源泄漏(boardCount/共振板/分数/净流入)

Changed:
- 开盘后在线验收(2026-07-16 早盘)发现:同花顺主线(如 AI手机、MLOps)boardCount=2,resonanceBoards
  混进同名东财板(AI手机 BK1162 zsType6),违反 Owner「两边不能交叉借…板块数量」。
- 根因:`getStrategyMainlineRealtimeCatalogBoards` 返回东财(6)+同花顺(5)全源概念榜,
  `strategyMainlineAttachBestCatalogBoard` 按题材贴最优板给 seed 而不看来源→同花顺 seed 被贴东财板,
  经 resonance 评分分与 recordNetInflow 还会污染分数/净流入。
- 修复:`buildStrategyMainlinesLiveImpl` 在贴 catalog 前按 `activeBoardZsTypes` 过滤
  (`catalogBoardsForSource`);单源 [6]/[5] 只贴本源,默认合并 [6,5] 仍两源(看板/诊断/合并路径不变)。

Files:
- `kpl-stats-server.js`(catalog 贴板前按来源过滤)
- `tests/strategy-source-catalog-boards.test.js`(新增:贯穿真实 attach 复现缺陷 + 证明修复 + 静态断言)

Validated:
- `node --check` 通过;全仓 37 个测试文件全绿。
- 生产实证(只读 `/api/ai/strategy-live?day=2026-07-16`):修复前同花顺 AI手机/MLOps boardCount=2 含 zsType6 板;
  其余核心口径本来就干净(netInflowZsType 同花顺全 5、东财全 6,KPL 全无,两源第1主线不同=算力 vs 智能音箱)。

Deployment:
- 未部署。#88 已上生产,本修复需另经受保护工作流部署 `kpl-stats-server.js` 并重启主服务。
- 影响范围:仅两套独立预测(单源)路径;合并/诊断/看板口径不变。

Notes for next agent:
- 部署后在线复核同花顺 AI手机/MLOps 的 boardCount 应只计同花顺板(不再含 zsType6);两源第1主线不受影响。

## 2026-07-16 - Codex - 准备 PR #110 跨源过滤生产部署

Changed:
- PR #110 已完成独立复核并合并至 `main`（`c996d874722b80418b8430170ade715d271f8759`）。
- 新增受保护生产清单，只发布已审核的 `kpl-stats-server.js` 并仅重启主服务。

Files:
- `ops/production/manifests/pr110-source-catalog-filter-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #110 合并前通过语法检查、来源过滤专项测试及全仓 37 个测试文件；`git diff --check` 通过。
- 清单只包含主服务文件，未包含数据库、前端、娱乐服务、Caddy 或公司端 L2 worker 文件。

Deployment:
- 本条记录提交时尚未部署；未修改云端文件或运行时数据，未重启任何服务。

Notes for next agent:
- 清单合入 `main` 后，使用 `ops/production/deploy-from-main.ps1` 和该清单运行受保护生产流程。
- 部署后检查主服务健康，并确认同花顺单源结果不再包含 `zsType=6` 的共振板，东财单源不再包含 `zsType=5`。

## 2026-07-16 - Codex - PR #110 跨源过滤已部署并验收

Changed:
- PR #110 与部署清单 PR #112 均已合并至 `main`；受保护生产流程按精确提交 `9bca6f0b570e8012d2cf9704052169d4bc267ab5` 完成发布。
- 本次只更新主服务 `kpl-stats-server.js`，修复东财、同花顺两套独立预测的共振板、板块数量、分数和净流入跨来源污染。

Files:
- 云端 `C:\\PandaDashboard\\kpl-stats-server.js`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 `29477564908` 成功，主服务重启完成且返回 `health=ok`；备份目录为 `C:\\PandaDashboard\\_deploy-backups\\github-29477564908-1`。
- 公网 `/health`、`/kpl` 与主页均为 HTTP 200。
- 线上 2026-07-16 独立预测复核：东财 5 条主线、3 个共振板，错误来源板 0、错误净流入来源 0；同花顺 4 条主线、3 个共振板，错误来源板 0、错误净流入来源 0。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29477564908`；`restart=main`。
- 未修改数据库、前端、娱乐服务、Caddy、公司端 L2 worker 或运行时业务数据。

Notes for next agent:
- PR #110 已完成代码审查、合并、生产发布与线上业务验收，无需再次部署。
- PR #111 是独立的 L2 补全任务，仍按其自己的评审结论处理，不属于本次发布。
## 2026-07-16 - Claude - 板级涨停数成份股精确回填(修「全员L2待验证」根因)

Changed:
- 现象(Owner 报告):2026-07-16 策略页两栏所有主线卡都显示「L2待验证」。只读诊断:worker 在线、
  pending=0,但当日无任何主线家族的板被派发——盘中实时板块榜 ztCount 普遍为 null,旧行为
  Number(null)=0 使自动扫描门槛「涨停≥2」腿盘中形同虚设,实际只剩 ≥10亿直通;医药代表板
  9.67亿(<10亿)+ zt unknown → 不派发 → 全员待验证。昨日肝炎24.69亿/CAR-T13.93亿 均过直通线
  所以能扫,印证该缺口。
- Owner 定稿:不是把 unknown 当 0 或绕过门槛,而是用成份股逐只精确统计是否涨停。
- 新增 strategyMainlineBackfillBoardZt:仅当板 zt 为 null 时回填——成份 ∩ 当日涨停底库(权威)
  为主;底库没有该股时用实时涨幅 ≥ limitUpThreshold(code,name)(主板9.75/创业科创北交19.5/ST4.75)
  兜底;两路并集去重;标 ztSource='member-join'。已知 zt(快照/来源自带,含 0)绝不覆盖;无成份行
  保持 null 不伪造 0。
- impl 在涨停底库建好后、种子/统一扫描前调用;回填结果同时供派发门槛、种子 countFallback 与展示。

Files:
- `kpl-stats-server.js`(strategyMainlineBackfillBoardZt + impl 调用)
- `tests/strategy-board-zt-backfill.test.js`(新增:底库为主/阈值兜底/ST/去重/不覆盖已知/不伪造0
  + 端到端复现今日医药 9.67亿 zt-null 不派发→回填后派发)

Validated:
- `node --check` 通过;全仓 37 个测试文件全绿。
- 生产只读实证:2026-07-16 13:56 实时榜 160 板 ztCount 全 unknown(limitUpLeaders 空),
  两栏主线卡全部 unscanned,队列 pending=0——与根因推断一致。

Deployment:
- 未部署;合并后经 production-ops.yml 部署 kpl-stats-server.js 并重启主服务。
- 与 PR #110(catalog 跨源过滤,Codex 已 Approved 待合并)相互独立,同文件不同函数。

Notes for next agent:
- 部署后盘中验证:5~10亿 区间、成份有 ≥2 只涨停的主线板应能被派发(不再全员待验证);
  快照日(盘后)行为不变。
- 本修复不改门槛数值(5亿/涨停2/10亿直通均保持 Owner 定稿),只把「涨停数未知」变成「精确统计」。

## 2026-07-16 - Claude - 自动扫描门槛去豁免(Owner 定稿:5亿 且 涨停≥2,无任何豁免)

Changed:
- Owner 2026-07-16 定稿:自动 L2 扫描门槛只有一条——板净流入≥5亿 且 板内涨停≥2,不需要豁免。
- 移除 10亿高流入直通(STRATEGY_MAINLINE_AUTO_SCAN_HIGH_INFLOW_OVERRIDE,原为救"钱多涨停少"而设;
  涨停数缺失已由成份股精确回填解决,不再需要金额直通绕过涨停腿)。
- 移除补选板豁免涨停≥2(补选板同样过门槛;补选仅保留派发排序优先级,非门槛豁免)。

Files:
- kpl-stats-server.js(auto-scan filter + 常量与注释)
- tests/scan-priority.test.js(静态断言:门槛无豁免、两豁免已移除;补选第一键仅为排序)
- tests/strategy-board-zt-backfill.test.js(行为:99亿 zt=1 不派发、补选板 zt=1 不派发)
- tests/strategy-two-source-mainlines.test.js(清理已删常量)

Validated:
- node --check 通过;全仓 37 个测试文件全绿。

Notes for next agent:
- 与本分支的板级涨停回填同属 PR #111,一起复核部署;门槛金额线 5亿/涨停 2 保持 Owner 原定值。

## 2026-07-16 - Codex - 准备 PR #111 板级涨停回填生产部署

Changed:
- PR #111 已完成独立复核并合并至 `main`（`563714a`）。
- 新增受保护生产清单，只发布已审核的 `kpl-stats-server.js` 并仅重启主服务。

Files:
- `ops/production/manifests/pr111-board-zt-backfill-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前次 `NaN` 阻断已修复；未知涨停数规范为 `null`，真实 `zt=0` 保持不覆盖，`NaN/undefined` 均有回归。
- `node --check`、相关专项及全仓 38 个测试文件通过；与最新 `main` 合并无业务代码冲突。
- 清单只包含主服务文件，未包含数据库、前端、娱乐服务、Caddy 或公司端 L2 worker。

Deployment:
- 本条记录提交时尚未部署；未修改云端文件或运行时数据，未重启任何服务。

Notes for next agent:
- 清单进入 `main` 后通过受保护生产工作流发布。
- 部署后核对主服务健康，并确认满足“净流入≥5亿且板内涨停≥2”的未知涨停板块可进入 L2 自动扫描，任一门槛不满足时不派发。

## 2026-07-16 - Codex - PR #111 板级涨停回填已部署

Changed:
- PR #111 已合并（`563714a2944b83278d170744c11b6f3b71109898`），部署清单随 `main` 提交 `3d8c9991fa7e7c45faf4a53f1a469698bf72b034` 发布。
- 本次只更新主服务 `kpl-stats-server.js`：未知板级涨停数由成分股与当日涨停底库回填；L2 自动扫描严格执行“净流入≥5亿且板内涨停≥2”，无高资金或补选豁免。

Files:
- 云端 `C:\\PandaDashboard\\kpl-stats-server.js`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 `29479237471` 成功，主服务重启完成且返回 `health=ok`；备份目录为 `C:\\PandaDashboard\\_deploy-backups\\github-29479237471-1`。
- 公网 `/health`、`/kpl` 与主页均为 HTTP 200；`/api/strategy-mainlines?day=2026-07-16` 返回 200。
- 部署时市场已经收盘，当前结果中没有同时满足“净流入≥5亿且板内涨停≥2”的新候选，因此本次不能制造盘中任务来冒充实盘验收；自动派发留待下一交易时段按真实行情确认。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29479237471`；`restart=main`。
- 未修改数据库、前端、娱乐服务、Caddy、公司端 L2 worker 或运行时业务数据。

Notes for next agent:
- PR #111 已完成审查、合并和生产发布，无需再次部署。
- 下一交易时段只需做真实验收：合格板应出现 L2 queued/running/done；低于净流入或涨停门槛的板不得派发。

## 2026-07-16 - Codex - 策略页东财资金改用超大单净流入

Changed:
- 东财板块接口同时读取并保留 `f62` 主力净流入、`f66` 超大单净流入、`f69` 超大单净占比、`f72` 大单净流入和 `f75` 大单净占比。
- 今日实时仍使用原有 `f62`，只在策略取板、主线评分、双源配对及策略证据中把东财资金切换为 `f66`；同花顺口径不变。
- 策略输出新增 `netInflowMetric/netInflowLegacy`。字段上线前的东财历史快照允许读取 `f62`，但明确标成“旧主力”，不冒充超大单；实时响应缺 `f66` 时保持缺失。
- 策略卡片、来源配对和资金追溯文案明确显示“东财·超大单”；首页/今日实时展示及原有 `netInflow` 字段没有被替换。
- 前端实时预览和人工快照保存链路透传东财四个新增分档字段，后续快照可稳定复现该口径。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/strategy-eastmoney-superlarge-flow.test.js`
- `tests/strategy-kpl-exclusion.test.js`
- `tests/strategy-source-pairs.test.js`
- `ops/production/manifests/strategy-eastmoney-superlarge-flow-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- 东财超大单、策略来源配对、KPL 剔除、同花顺策略专项测试通过。
- 全仓 39 个 `tests/*.test.js` 全部通过；行情页内联脚本编译通过。

Deployment:
- 本条记录提交时尚未部署；未修改云端运行时文件或数据库，未重启服务。

Notes for next agent:
- 生产发布需同时部署 `kpl-stats-server.js` 与 `kpl-dashboard_17_apple.html`，并重启主服务。
- 旧冻结快照不会被改写，页面会如实显示“旧主力”；新生成快照开始携带 `f66` 并显示“超大单净流入”。

## 2026-07-16 - Codex - 策略页东财超大单资金口径已部署

Changed:
- PR #115 已合并到 `main`（`0c1d9771225bf91375f6946a4f407546ba4165a8`）。
- 通过受保护生产工作流发布 `kpl-stats-server.js` 与 `kpl-dashboard_17_apple.html`，主服务已重启。
- 生产东财目录接口已确认同时返回 `netInflow(f62)`、`superLargeNetInflow(f66)` 和 `largeNetInflow(f72)`；策略页静态资源已包含新口径与旧快照标签。

Files:
- 云端 `C:\PandaDashboard\kpl-stats-server.js`
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 工作流 `29485428952` 成功，主服务重启完成且返回 `health=ok`；备份目录为 `C:\PandaDashboard\_deploy-backups\github-29485428952-1`。
- 公网 `https://market.dreamerqi.com/health` 返回 `{"ok":true}`，`/kpl` 返回 HTTP 200。
- 公网东财板块接口返回当日实时分档资金；线上行情页包含“东财超大单/同花顺资金净流入”“东财·旧主力”和口径标签函数。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29485428952`；`restart=main`。
- 未修改业务数据库、历史快照、Caddy、娱乐服务或公司端 L2 worker。

Notes for next agent:
- 2026-07-16 的策略主线快照在本次部署前已冻结，继续保留原数据并按旧主力口径展示；不要为了新口径回写历史冻结快照。
- 下一交易日盘中抽查一张东财策略卡：接口 `netInflowMetric` 应为 `eastmoney-super-large-net-inflow`，页面应显示“超大单净流入/流出”。

## 2026-07-16 - Codex - 策略卡拆分 L2 扫描六态

Changed:
- 自动 L2 扫描门槛保持不变：单个板块净流入必须达到 5 亿元且板内涨停至少 2 只；不合格卡片不会勉强派发扫描。
- 将原先含糊的“L2 待验证”拆成六种页面状态：未达扫描条件、等待公司端、扫描中、覆盖不足、L2未见明星、QI主线。
- 新增 `l2ScanState/l2ScanDetail` 解释字段；原 `l2VerificationStatus` 继续独立负责评分、确定性封顶和主线硬闸，本次不改变主线计算结果。
- 自动派发和页面资格提示复用同一个门槛函数，防止以后两处条件漂移；预测记录同步保存六态，便于回看。
- 兼容部署前已冻结的旧快照：若旧卡片已有净流入和涨停数，则按同一 5 亿+2 涨停门槛区分“未达扫描条件”与“覆盖不足”，不改写历史文件、不伪装成公司端排队。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/qi-mainline-states.test.js`
- `tests/scan-priority.test.js`
- `tests/predict-records.test.js`
- `tests/strategy-board-zt-backfill.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；行情页内联脚本编译通过。
- 六态行为、门槛、预测记录、涨停回填和双来源统一派发专项测试通过。
- 全仓 39 个 `tests/*.test.js` 全部通过。

Deployment:
- 本条记录提交时尚未部署；未修改云端运行时文件、业务数据库或公司端 L2 worker，未重启服务。

Notes for next agent:
- 生产发布需同时部署 `kpl-stats-server.js` 与 `kpl-dashboard_17_apple.html` 并重启主服务。
- 下一交易时段验收六态迁移：不达门槛→未达扫描条件；queued→等待公司端；running→扫描中；done 但相关股覆盖不足→覆盖不足；done 且覆盖达标无明星→L2未见明星；出现 expected/confirmed 明星→QI主线。

## 2026-07-16 - Codex - 策略卡 L2 六态已部署

Changed:
- PR #118 已合并并发布后端六态字段与策略页六态徽章；PR #120 补充旧冻结快照的门槛兼容判断。
- 生产主服务与行情页已更新；旧冻结快照保持只读，前端根据已有板块指标区分“未达扫描条件”和“覆盖不足”。

Files:
- 云端 `C:\PandaDashboard\kpl-stats-server.js`
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 功能发布工作流 `29489400735` 成功，主服务重启并返回 `health=ok`；备份 `C:\PandaDashboard\_deploy-backups\github-29489400735-1`。
- 旧快照前端兼容工作流 `29490357804` 成功，仅更新静态行情页、未重启；备份 `C:\PandaDashboard\_deploy-backups\github-29490357804-1`。
- 公网 `/health` 返回正常；`/kpl` 已包含六种状态文案和 `legacyL2Eligible` 兼容逻辑。
- 发布前本地 `node --check`、行情页内联脚本编译及全仓 39 个测试文件全部通过。

Deployment:
- 功能工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29489400735`，`restart=main`。
- 兼容工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29490357804`，`restart=none`。
- 未修改业务数据库、历史快照、Caddy、娱乐服务或公司端 L2 worker。

Notes for next agent:
- 7 月 16 日冻结快照早于本次部署，因此接口本身没有新六态字段；页面已用只读兼容逻辑正确显示，不要回写该快照。
- 下一个交易日的新实时响应应原生带 `l2ScanState/l2ScanDetail`；按六态迁移表做一次实盘抽查即可。

## 2026-07-16 - Codex - 正式主线榜严格启用 L2 明星门槛

Changed:
- 正式主线榜只保留 `l2VerificationStatus=qi` 且明星证据包含 `expected` 或 `confirmed` 的方向。
- 未达扫描条件、等待公司端、扫描中、覆盖不足及扫描无明星的方向继续保留为内部候选并照常参与 L2 调度，但不再进入正式榜。
- 正式接口在返回旧缓存和旧冻结快照时再次执行同一门槛，避免历史候选绕过新规则。
- 管理员复核、AI 证据接口和龙头归属回放继续保留完整候选池及排除原因，不被正式榜过滤影响。
- 预期明星首次出现后写入当日不可逆轨迹；后续 L2 变弱或资金转弱不再删除该主线，收盘未转为明星确认时明确显示“预期明星·未兑现”。
- 卡片醒目展示盘中预期明星；首次涨幅、L2 比值和最大档证据随轨迹保存，供当日复盘解释。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/inflow-gate.test.js`
- `tests/mainline-confirm.test.js`
- `tests/mainline-empty-state.test.js`
- `tests/predict-records.test.js`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- 严格 QI 门槛、预期明星资格不可逆、未兑现标签、旧快照轨迹恢复、自动扫描先于展示门槛、有效空状态及管理员/AI 诊断隔离测试通过。
- 全仓 39 个 `tests/*.test.js` 全部通过；`git diff --check` 通过。

Deployment:
- 本条记录提交时尚未部署；未修改云端运行时文件、业务数据库、历史快照或公司端 L2 worker，未重启服务。

Notes for next agent:
- 5 亿元且至少 2 只涨停的自动扫描资格未改变；本次只收紧“什么能显示为正式主线”。
- 严格 QI 门槛从 2026-07-16 实施日起生效；之前已冻结的历史主线保持原口径，不倒溯清空。实施日起若没有可核验的 expected/confirmed 明星证据，会显示有效的“今日无主线”；若同日预测轨迹记录过 expected，则保留该主线并展示最终是否兑现。管理员诊断仍可查看全部被排除候选。
- 历史预期证据挂载已改为幂等：同一响应被再次收紧时不会重复说明，也不会把真实当前 L2 状态覆盖为 `qi`。

## 2026-07-16 - Claude - 策略页同花顺资金口径切换为 DDE 大单金额(Owner 定稿)

Changed:
- 发现并校准同花顺板块级 DDE 大单金额数据源:d.10jqka realhead 字段 527198(单位元)。
  收盘校准 国资云 10.415亿/智慧政务 20.375亿,Owner 用 APP「DDE大单金额」逐板对照一致
  (同日 zjjlr 仅 1.79亿/0亿)。
- strategyBoardFundFlowForSource zsType=5 分支:ddeBigOrderAmount 优先(metric
  ths-dde-big-order-amount),未覆盖回退 zjjlr(metric 如实,不冒充)。
- 新增 fetchThsBoardDdeAmount(90s 缓存)/thsDdeIndexCodeMap(THS 目录 plateId→885xxx,
  10min 缓存)/strategyApplyThsDdeFundFlow(覆盖 zsType5 主板 + 塌板 bySource[5])。
- getDayBoardsWithMembers 返回前接线:仅显式策略口径(zsTypes 不含 7)且含 5 时覆盖;
  仅当日(历史日在函数内拒绝——realhead 是当前值,回填历史=数据穿越);单板失败记诊断、保持 zjjlr。
- 看板/复盘/默认三源调用与 zs5 快照文件不动;原 zjjlr 留档 netInflowZjjlr 供审计。

Files:
- kpl-stats-server.js(选择器 5 分支 + DDE 抓取/映射/覆盖三函数 + getDayBoardsWithMembers 接线)
- tests/strategy-ths-dde-netinflow.test.js(新增:解析/选择器/覆盖行为/历史拒绝/失败保持/静态接线)
- docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md(THS 节新增 DDE 口径契约与校准记录)
- docs/strategy/discussions/2026-07-16-ths-dde-netinflow.md(讨论定稿)

Validated:
- node --check 通过;全仓 40 个测试文件全绿。
- 与东财超大单口径(Codex 同日改)互不影响(选择器分支隔离,专项断言覆盖)。

Deployment:
- 未部署;合并后经 production-ops.yml 部署 kpl-stats-server.js 并重启主服务。

Notes for next agent:
- 次交易日 14:59 验收重点:同花顺主线卡资金应为 DDE 量级(对照 APP),netInflowMetric 可溯;
  L2 扫描同花顺侧达标板会因口径变大而变多,限流不变,观察派发密度。

## 2026-07-16 - Claude - PR#117 Codex 复审两项 P1 修复(DDE 请求纪律)

Changed:
- [P1] realhead 单请求加 AbortSignal 截止(4s,悬挂请求真正被中止);strategyApplyThsDdeFundFlow
  加 8s 总预算截止线(thsDdeRaceBudget + deadline),超预算板按已定规则保持 zjjlr——DDE overlay
  任何情况下不再卡住 getDayBoardsWithMembers/策略构建。
- [P1] fetchThsBoardDdeAmount 加 in-flight Promise 去重(thsDdePendingFetch):并发消费者冷启动
  同板只发一次网络请求;成功/失败都清理 pending,仅成功写 90s 缓存(失败不污染重试)。
- 补确定性测试:悬挂请求预算内回退、并发同 code 单请求、失败后可重试(真实函数贯穿,非整体 stub)。
- 讨论文档措辞修正:「策略候选板」→「策略板块池」(覆盖对象是策略口径调用中的板池,不止最终卡片)。

Files:
- kpl-stats-server.js(超时/预算/去重)
- tests/strategy-ths-dde-netinflow.test.js(24 项断言)
- docs/strategy/discussions/2026-07-16-ths-dde-netinflow.md

Validated:
- node --check 通过;全仓 40 个测试文件全绿。

Deployment:
- 未部署;仍走 PR #117,等 Codex 复审通过后 Owner 合并、production-ops.yml 发布。

Notes for next agent:
- 预算定时器是 unref 的(不阻服务退出);测试进程自带保活,新增用例时注意。

## 2026-07-16 - Claude - 复核 Codex PR#123(正式主线榜严格 QI 门槛)

Changed:
- 仅复核,未改代码。结论:无阻断 bug;一项需 Owner 拍板(P2)+ 两项 P3,已评论在 PR#123。
- P2:/api/strategy-mainlines 历史日查询也走严格闸,07-13 前的冻结快照无 qi/轨迹字段
  会被追溯清空主线展示——需 Owner 决定按实施日切还是接受追溯。
- P3:实时构建+统一返回层双重 attach 导致 explain 首行重复、l2CurrentVerificationStatus
  被二次覆盖;预期明星首现恰逢流出周期会丢资格(低概率,备查)。
- 核过并通过:跨源轨迹隔离(bySource 恒带 starTransitions 数组,回退仅旧 schema)、
  自动扫描派发独立于硬闸、缓存/快照先补证据后过滤且不改写文件、leaderDebug 保留完整池。

Files:
- docs/DAILY_HANDOFF.md(本条)

Validated:
- 在独立 worktree 对 PR#123 分支跑 node --check + 39 个测试文件全绿。

Deployment:
- 无。

Notes for next agent:
- PR#117(THS DDE)仍等 Codex 对三项修复的复审;PR#123 等 Owner 对 P2 拍板。

## 2026-07-16 - Codex - 手工补录 2026-07-16 TGB 湖南人复盘

Changed:
- 按 `docs/ops/TGB_HUNAN_DAILY_SOP.md` 强制刷新当天淘股吧官方原文和 17 张原始图片，只采用标题、日期、白底表格和 `@TGB湖南人` 水印均匹配的 `image-01-06.png`。
- Codex 对官方原图按题材块逐行、逐字段人工转录并进行第二遍人工复核；未调用 OCR、Qwen 或其他自动视觉识别，排除了顶部重复“市场连板股”、底部“涨停炸板”、同花顺红图、回帖图、头像、二维码和广告。
- 云端前置闸通过后写入 40 行正式 `review/tgb-hunan-structured`，并只强制重折 `2026-07-16` 综合主因库。
- 两份云端运维日志均已追加安全记录；首次生产脚本因 Windows PowerShell 编码解析在任何写入前停止，转为 UTF-16 后同一脚本成功完成，未留下部分写入。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-16.json`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-16.json`
- 云端 `panda-cloud-ops-2026-06-19.md` 与 `_cloud-change-log-20260705.md`

Validated:
- 官方文章：`https://www.tgb.cn/a/2ttP1slRNKP`，标题 `7.16湖南人涨停复盘+晚间消息汇总`；使用图片 `image-01-06.png`。
- 题材块：医药 8、AI手机 5、大消费 3、国产芯片 3、机器人 3、影视 3、云计算数据中心 3、其他热点 4、其他个股 8，合计 40。
- 当日终盘原始池 41，按统一口径剔除北交所 `920701 豪声电子` 后基准 40；正式 40、`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0，题材块计数和等于 40。
- 正式 TGB 源 SHA-256：`b38dd5d04961e1a16a295396ed8ecd1bd9f64a303fddfd93e6fdfc180d6f96cc`；重折后综合主因库 SHA-256：`e5f9a62b9814169b3147c3799fbfddf217a4c651b77a4ecd679a7baa2daf04d8`。
- 公网强制刷新 `source-view` 显示综合归纳 40、复盘啦 40、选股宝 40、韭研 0、淘股吧 40；TGB 覆盖和主因覆盖均 100%、低置信 0、`sourceErrors` 为空。韭研当日仍缺失，属于本任务之外的既有来源缺口，未伪报四源全健康。
- 同日 `after-close-status?mainReasonMode=same-day` 确认交易日且已收盘，涨停库、主因库、收盘价、东财概念和同花顺概念均正常，主因库 40、复盘覆盖 100%；公网 `/health` 为 HTTP 200 且 `ok=true`。

Deployment:
- 生产运行时数据已更新；未部署应用代码，未重启任何服务。
- 回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260716-20260716-213559`，包含写入前正式文件（如存在）、重折前综合主因库、raw manifest、官方图片和两份云端日志。
- Git 交接 PR：`https://github.com/dmz1108/dmzrepo/pull/124`。

Notes for next agent:
- 2026-07-16 TGB 正式来源已完成官方证据、双遍人工转录、终盘池对账、备份、写入、综合主因重折与公网验收，无需再次覆盖或重启服务。
- 当前四源中只有韭研为 0；若要补齐四源健康，应按韭研自己的正式来源流程单独修复，不能改写或回退本次已健康的 TGB 文件。

## 2026-07-16 - Codex - 准备同花顺 DDE 与严格 QI 主线门槛生产部署

Changed:
- 独立复核 PR #117：真实同花顺 `527198` 响应、单请求超时、8 秒总预算、in-flight 去重、失败重试、历史日防穿越和口径来源标记均通过；PR 已合并。
- 修正并复核 PR #123：严格 QI 门槛只从 2026-07-16 起生效，不倒溯清空旧历史；预期明星轨迹重复挂载保持幂等；PR 已合并。
- 新增受保护部署清单，同时发布主服务与策略页，确保后端字段和前端展示原子切换。

Files:
- `ops/production/manifests/strategy-ths-dde-strict-qi-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #117 专项测试及全仓 40 个测试文件通过；真实 `bk_885977` 响应含 `527198=1041518380.000`。
- PR #123 合并最新 main 后，`node --check`、全仓 40 个测试文件和 `git diff --check` 通过。
- 部署清单仅包含 `kpl-stats-server.js`、`kpl-dashboard_17_apple.html`，`restart=main`。

Deployment:
- 本条提交时尚未执行；待清单合入 main 后通过 `production-ops.yml` 执行。

Notes for next agent:
- 部署后验证公开策略接口从 2026-07-16 起只返回带 expected/confirmed 明星证据的主线；2026-07-15 及以前保持原历史口径。
- 同花顺 DDE 只覆盖当日策略链，历史日、今日实时看板、复盘和默认三源调用不变。

## 2026-07-16 - Codex - 修复云端 DDE Cookie 启动依赖

Changed:
- 首次部署后线上发现：云服务器无法及时访问 `raw.githubusercontent.com` 的同花顺 Cookie 脚本，DDE overlay 因此跑满 8 秒并回退旧 `zjjlr`。
- 已验证 `d.10jqka.com.cn/v6/realhead/...` 在云端无需 Cookie 可直接访问，改为直连，避免无关 GitHub 依赖。
- HTTP 200 但缺少 `527198` 时不再缓存 `null`，后续调用可以立即重试恢复。

Files:
- `kpl-stats-server.js`
- `tests/strategy-ths-dde-netinflow.test.js`
- `ops/production/manifests/strategy-ths-dde-direct-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 云端无 Cookie 请求 realhead 返回 HTTP 200，耗时约 0.2 秒；Cookie 脚本源请求超时。
- DDE 专项测试、`node --check`、全仓 40 个测试文件、部署工作流测试与 `git diff --check` 全部通过。

Deployment:
- 本条提交时尚未执行；部署只更新 `kpl-stats-server.js` 并重启主服务。

## 2026-07-16 - Codex - 同花顺 DDE 与严格 QI 主线门槛已部署

Changed:
- PR #117、#123 及云端直连补丁 PR #126 均已合并到 main 并完成生产发布。
- 正式主线从 2026-07-16 起必须有 L2 预期明星或明星确认；盘中出现过的预期明星当日资格保留，收盘未兑现会明确标记。
- 同花顺策略资金使用板块 DDE 大单金额 `527198`；东财仍使用超大单净流入，历史快照与今日实时看板不改口径。

Files:
- 云端 `C:\PandaDashboard\kpl-stats-server.js`
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 初次原子部署工作流 `29503523748` 成功，主服务健康；备份 `C:\PandaDashboard\_deploy-backups\github-29503523748-1`。
- DDE 直连补丁工作流 `29505412388` 成功，主服务健康；备份 `C:\PandaDashboard\_deploy-backups\github-29505412388-1`。
- 云端后端与 HTML 的 SHA-256 均和获批 main 文件一致。
- 公网 `/health` 返回 `ok=true`；2026-07-16 正式策略接口返回 0 条并明确 `no-l2-qualified-mainline`，符合当日没有 L2 明星证据的事实。
- 2026-07-15 历史接口仍保留 6 条旧口径主线，证明实施日前历史没有被倒溯清空。
- 同花顺策略链“短剧游戏”资金为 `1,891,366,300` 元，与同花顺 raw `527198` 完全一致；接口总耗时约 `0.236s`，修复前为约 `8.2s` 且回退 `zjjlr=3,313,000,000` 元。

Deployment:
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29503523748`、`https://github.com/dmz1108/dmzrepo/actions/runs/29505412388`。
- 两次均只重启主服务；未修改业务数据库、冻结快照、公司端 L2 worker、Caddy 或娱乐服务。

Notes for next agent:
- 下一交易日抽查同花顺主线卡 `netInflowMetric=ths-dde-big-order-amount`，并观察 DDE 口径放大后自动 L2 派发密度；现有限流不变。
- Git 记录与云端两份运维日志均已补齐，不需要手工再写云端日志。

## 2026-07-16 - Codex - 优化今日策略主线卡与 L2 扫描记录

Changed:
- 今日主线卡重排信息层级，优先展示板块涨幅和来源明确的资金指标，其后展示涨停数与大涨/冲板数。
- 明星信号改为独立区域，明确区分“预期”“已确认”“未兑现”，同时保留龙头身份与主动/被动比证据；卡片左侧用不同强调色区分预期明星和已确认明星。
- 管理员可见的 L2 扫描历史改为不可展开的紧凑记录列表，只保留板块、状态、时间、扫描/结果/入选数量与入选股票摘要。
- 调整桌面和移动端网格、间距与换行规则，不改变主线判断、L2 扫描、管理员权限或数据接口逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `ops/production/manifests/strategy-ui-mainline-l2-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前端内联脚本编译通过，`git diff --check` 通过。
- 全仓 40 个测试文件全部通过，包括主线六态、严格 QI 门槛、双来源主线和 L2 明星分层测试。
- 使用真实结构的模拟数据完成桌面与手机端截图，并进行调整前后并排对照；主线卡、明星状态和 L2 紧凑记录均无溢出、遮挡或错误换行。

Deployment:
- 本条提交时尚未部署；清单仅更新静态策略页，`restart=none`，不重启主服务。

Notes for next agent:
- 本次只优化展示层；不要把已移除的 L2 五档逐股展开卡重新加回扫描历史，详细金额仍由重点关注的正式扫描视图承担。
- 主线卡的资金标签必须继续跟随来源口径：同花顺 DDE、东财超大单或旧主力、KPL 净流入，不能合并成无来源的“净流入”。

## 2026-07-16 - Codex - 今日策略视觉优化已部署

Changed:
- PR #128 已合并到 `main`，静态策略页视觉优化已通过受保护生产流程发布。
- 线上今日主线卡已采用新的指标层级和明星状态表达，L2 扫描历史已改为不可展开的紧凑记录。

Files:
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 生产工作流 `29513525185` 成功，批准提交为 `8f53019a1e359a7f778a3bc2287cb6b3a8202b93`。
- 公网 `/health` 返回 `ok=true`，`https://market.dreamerqi.com/?view=strategy` 返回 HTTP 200。
- 线上页面包含新的 L2 紧凑记录、明星信号和来源资金标签；线上 HTML SHA-256 `8ac96c314adc4c9e88990c7964054d33a5cbaa6d86c963867d1c915e2e9421f6`，与获批 `main` 文件一致。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，未重启任何服务。
- 自动备份：`C:\PandaDashboard\_deploy-backups\github-29513525185-1`。
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29513525185`。

Notes for next agent:
- 本次上线已完成且云端与 `main` 一致，不需要再次部署或重启。

## 2026-07-16 - Codex - 精修今日主线卡首行与展开详情

Changed:
- 将板块涨幅和来源明确的资金净流入移到板块名旁，形成同一阅读焦点；东财旧资金口径改用更清楚的“东财主力（旧口径）”名称。
- 将卡片次级指标收敛为“涨停 / 大涨 / 冲板 / 共振”四项，避免与首行涨幅、资金重复。
- 展开详情重组为强度拆解、今日龙头、为什么上榜、龙头候选和盘面证据；桌面候选改为三列，手机保持单列。
- 保留资金代表板块、来源、指标和单板聚合口径的悬停说明；没有改动主线计算、L2、确认权限、接口或数据源逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `design-qa.md`
- `ops/production/manifests/strategy-card-header-detail-ui-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用相同模拟数据完成桌面 `1440×1100` 与手机 `390×844` 的调整前后并排对照，无横向溢出或标题溢出。
- 展开详情高度桌面由 `775px` 降至 `630px`，手机由 `1181px` 降至 `1019px`。
- 前端内联脚本编译、`git diff --check`、主线专项测试及全仓 `40/40` 个测试文件全部通过。

Deployment:
- 本条提交时尚未部署；清单仅更新静态策略页，`restart=none`，不重启任何服务。

Notes for next agent:
- 首行资金标签继续跟随来源口径，不能改回无来源的“净流入”；详细资金口径保留在悬停说明中。
- 本轮是纯展示优化，后续代码不得借此改变主线榜、明星股或 L2 的业务判断。

## 2026-07-16 - Codex - 今日主线卡第二轮视觉精修已部署

Changed:
- PR #130 已合并到 `main`，板块名旁的涨幅与资金、紧凑次级指标和重组后的展开详情已发布到生产。
- 线上静态文件与获批 `main` 内容一致，没有改动后端、数据文件或运行时配置。

Files:
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（受保护部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 生产工作流 `29516810519` 成功，批准提交为 `4c991135ca801c774db84481f86a18047fbf63d7`。
- 公网 `/health` 返回 `ok=true`；`https://market.dreamerqi.com/?view=strategy` 返回 HTTP 200。
- 线上页面包含 `ml-head-pulse`、`ml-detail-grid`、`ml-leader-list-grid` 和“东财主力（旧口径）”标记。
- 线上 HTML SHA-256 `7dc9dd826cce6f4881350a6eb80909dde3178a931882509a6a1fa17389fd6bf0`，与获批 `main` 文件完全一致。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，`restart=none`，未重启任何服务。
- 自动备份：`C:\PandaDashboard\_deploy-backups\github-29516810519-1`。
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29516810519`。

Notes for next agent:
- 本次上线已完成且云端与 `main` 一致，不需要再次部署或重启。

## 2026-07-16 - Codex - 精修预判回看明星状态卡

Changed:
- 为预判回看中已确认的明星股增加克制的红色阶段强调、左侧状态轨和“明星确认 + 个股名”首行信号。
- 为预期明星增加独立的琥珀色观察态、左侧状态轨和“预期明星 + 个股名”首行信号，避免与已确认状态混淆。
- 普通回看记录保持原样；命中、盘后主因、次日最高、次日收盘、3日表现和预期转封统计的位置与逻辑均未改变。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/strategy-two-source-mainlines.test.js`
- `design-qa.md`
- `ops/production/manifests/strategy-review-star-card-ui-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用同一组三行数据完成桌面 `1440×1000` 与手机 `390×844` 的调整前后并排对照；确认态、预期态各一行，普通态一行，均无页面或回看区域横向溢出。
- 新增回归断言，锁定明星确认、预期明星与普通记录的行级状态不会互相误用。
- 前端内联脚本编译、`git diff --check`、专项回看测试及全仓 `40/40` 个测试文件全部通过。

Deployment:
- 本条提交时尚未部署；清单仅更新静态策略页，`restart=none`，不重启任何服务。

Notes for next agent:
- 红色只表示预测时已经确认的明星股，琥珀色只表示预测时仍是预期明星；不能把两者合并成同一种“明星”视觉状态。
- 本轮仅改变回看展示，不得借此改变明星判定、主线命中或收益统计口径。

## 2026-07-16 - Codex - 预判回看明星状态卡已部署

Changed:
- PR #132 已合并到 `main`，明星确认红色阶段态与预期明星琥珀色观察态已发布到生产。
- 线上仅替换策略静态页面，没有修改后端程序、业务数据、运行时配置或评分规则。

Files:
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（受保护部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 生产工作流 `29544905096` 成功，批准提交为 `dedf922dd5bc2751611118ea67951eb067f1e7af`。
- 公网 `/health` 返回 `ok=true`；`https://market.dreamerqi.com/?view=strategy` 返回 HTTP 200。
- 线上页面包含 `mlr-star-signal`、`star-confirmed` 和 `star-expected` 标记。
- 线上 HTML SHA-256 `34b3763c7668ef6e65087d2b5ff82cba34ff5a691f8a9b0b0e214d83f9aef809`，与获批 `main` 文件完全一致。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，`restart=none`，未重启任何服务。
- 自动备份：`C:\PandaDashboard\_deploy-backups\github-29544905096-1`。
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29544905096`。

Notes for next agent:
- 本次上线已完成且云端与 `main` 一致，不需要再次部署或重启。

## 2026-07-16 - Codex - 明星证据与预判命中视觉层级精修

Changed:
- 今日主线榜的明星证据改为独立标题层，汇总确认/预期数量，并直接展示每只明星股的主动比、被动比和合计比。
- 明星确认继续使用红色确认态，预期明星使用琥珀色观察态；两种阶段不再挤在普通标签中。
- 预判回看将“主线命中/进入前三”改为卡片内部的独立结论徽标，整张卡片的红/金底色只表达明星确认/预期证据；没有明星证据的命中记录保持中性。
- 仅优化展示层，没有改动主线、明星、L2、命中率、收益、权限、接口或数据源逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/strategy-two-source-mainlines.test.js`
- `tests/qi-mainline-states.test.js`
- `design-qa.md`
- `ops/production/manifests/strategy-star-review-visual-20260716.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用相同数据完成今日主线榜与预判回看的桌面、手机前后并排对照；确认态、预期态、仅命中态均无横向溢出或状态混淆。
- 新增回归断言，锁定明星证据标题、三项 L2 比值、确认/预期数量汇总和独立“主线命中”文案。
- 前端内联脚本编译、`git diff --check`、专项测试及全仓 `40/40` 个测试文件全部通过。

Deployment:
- 本条提交时尚未部署；清单仅更新静态策略页，`restart=none`，不重启任何服务。

Notes for next agent:
- “明星确认/预期明星”是预测时的 L2 证据阶段；“主线命中/进入前三”是盘后结果，必须继续独立表达。
- 不能因为某日盘后命中就把整张无明星证据的历史卡片改成确认态。

## 2026-07-16 - Codex - 明星证据与预判命中视觉精修已部署

Changed:
- PR #134 已合并到 `main`，今日主线榜明星证据层和预判回看独立命中结论已发布到生产。
- 线上只替换策略静态页面，没有修改后端程序、策略逻辑、业务数据、运行时配置或评分规则。

Files:
- 云端 `C:\PandaDashboard\kpl-dashboard_17_apple.html`
- 云端两份运维日志（受保护部署器自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 生产工作流 `29546908609` 成功，批准提交为 `010cd2b6eac64914a3b5701de747780e94997713`。
- 公网 `/health` 返回 `ok=true`；`https://market.dreamerqi.com/?view=strategy` 返回 HTTP 200。
- 线上页面包含 `ml-star-proof-head`、`ml-star-ratios`、“主线命中”和“进入前三”标记。
- 线上 HTML SHA-256 `28094d847f2922d3da713c8414de552d27c9a64d61ea49a831398d6fb11d71d7`，与获批 `main` 文件完全一致。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，`restart=none`，未重启任何服务。
- 工作流：`https://github.com/dmz1108/dmzrepo/actions/runs/29546908609`。

Notes for next agent:
- 本次上线已完成且云端与 `main` 一致，不需要再次部署或重启。

## 2026-07-16 - Codex - 准备回填7月8日与7月9日回看明星

Changed:
- 新增受保护生产修复脚本，按 Owner 指定将 2026-07-09 半导体主线的长电科技（600584）与 2026-07-08 算力AI主线的紫光股份（000938）写为历史回看“明星确认”。
- 修复目标是两天的 `strategy-data/mainline-predict-*.json`；不在前端硬编码股票，不修改冻结快照、L2任务、评分逻辑或来源数据库。
- 脚本会先校验日期和主线族，备份两个原文件，再同步修正兼容顶层、来源块与候选块；原明星保存在审计元数据中，失败自动恢复备份。

Files:
- `ops/production/requests/2026-07-16-review-star-backfill.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 嵌入式修复程序通过语法检查，并用包含兼容顶层、来源块和候选块的本地样本验证修复、审计保留、回滚结构与二次运行幂等性。
- 实际运行结果、前后哈希、备份目录和公网回看结果需在受保护生产工作流完成后补记。

Deployment:
- 本条提交时尚未执行生产修复；运行该脚本不部署代码、不重启服务。

Notes for next agent:
- 两条确认状态属于 Owner 对历史回看的人工校正，脚本会写入 `manualCorrection/reviewCorrection` 元数据，后续不得误称为自动重算所得。

## 2026-07-16 - Codex - 修复历史回看脚本的 Windows 编码兼容性

Changed:
- 将受保护生产脚本可执行区内的中文常量改为 Unicode 转义，使脚本在 Windows PowerShell 5.1 按本地代码页读取时仍能生成正确的 UTF-8 Node 修复程序。

Files:
- `ops/production/requests/2026-07-16-review-star-backfill.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产工作流 `29548147348` 在 Node 解析阶段因中文常量被 Windows 代码页破坏而退出；失败发生在读取预测文件之前，未产生数据写入、日志追加或服务重启。
- 修复后脚本的可执行内容不再包含非 ASCII 字符，避免同类编码故障。

Deployment:
- 本条提交时修复后的生产操作尚未重跑，云端两份预测记录仍保持原状。

## 2026-07-16 - Codex - 7月8日与7月9日回看明星已回填

Changed:
- 按 Owner 指定修正云端两份历史预测记录：2026-07-09 半导体的明星改为长电科技（600584），2026-07-08 算力AI的明星改为紫光股份（000938），两者均保存为 `confirmed`。
- 修正仅作用于 `strategy-data/mainline-predict-2026-07-09.json` 和 `strategy-data/mainline-predict-2026-07-08.json`，并在预测记录中保留前值和人工校正元数据。

Files:
- 云端 `C:\PandaDashboard\strategy-data\mainline-predict-2026-07-09.json`
- 云端 `C:\PandaDashboard\strategy-data\mainline-predict-2026-07-08.json`
- 云端两份运维日志（脚本自动追加）
- Git `docs/DAILY_HANDOFF.md`

Validated:
- 受保护生产工作流 `29548383458` 成功，批准提交为 `fe36905284004eb189e549a4e2e83bfd75cb3f45`。
- 2026-07-09 文件 SHA-256 从 `e7b489038d27bba512fca331c2cc5548821c0583a922fe8aac54aef5ec8c72c4` 变为 `9e299c7d9920fb47667e22ee6e26b2f64b68e967407379fb255e6b1f4ef02a61`。
- 2026-07-08 文件 SHA-256 从 `33ae267e9426e2dedf0b5f37fda7e66c6081034085f270b5ebf2651027a9f3b2` 变为 `bc72f0cc2b55744340b47493798c809b89d59d1c00604a389935e5768e6d15bf`。
- 公网回看接口已返回长电科技 `predictLevel=confirmed`与紫光股份 `predictLevel=confirmed`；公网 `/health` 仍为 `ok=true`。

Deployment:
- 回滚备份位于 `C:\PandaDashboard\_deploy-backups\review-star-backfill-20260708-09-20260717014925`。
- 未部署应用代码，未重启任何服务。

Notes for next agent:
- 这两条是 Owner 指定的历史回看人工校正，不是系统依现行 L2 规则自动重算的结果。

## 2026-07-17 - Codex - L2扫描记录增加个股五档展开

Changed:
- 策略页管理员可见的「今日 L2 扫描记录」改为逐股折叠行：默认显示该股最大可统计档的主动/被动买卖金额与三种比值，点击后展开 50万、300万、500万、800万、1000万五档明细。
- 扫描结果会先从完整 `results` 中识别明星证据，再与旧 `picked` 合并，因此不会漏掉小档未入选但最大档达标的预期明星。
- 预期明星与明星确认在折叠状态分别使用金色/红色强调，并优先排在可见个股前列。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `tests/*.test.js` 共 40 个测试文件全部通过，前端内联脚本通过编译检查。
- 使用包含「非 picked 预期明星」「明星确认」和普通入选股的模拟五档数据完成 1440x900 与 390x844 页面检查：明星数、五档行数正确，无水平溢出、无页面脚本错误。

Deployment:
- 本条提交时尚未部署云端；改动仅涉及策略页静态 HTML，不修改 L2 扫描、明星判定、队列或后端数据。

## 2026-07-17 - Codex - L2个股五档界面已部署

Changed:
- 将 PR #139 的 L2 个股最大档摘要、五档展开和预期明星/明星确认高亮发布到云端策略页。

Files:
- `kpl-dashboard_17_apple.html`（生产发布）
- `ops/production/manifests/strategy-l2-stock-buckets-20260717.json`

Validated:
- 受保护生产工作流 `29551159628` 成功，批准提交为 `faea99b7fb519a19a51bf952bf358dd68e6fe00b`。
- 公网 `/health` 返回 `ok=true`；公网策略页包含新五档展开组件。
- 公网页面与 `main` 文件 SHA-256 一致：`193987ac9179ed3d0a6e580d4c711fe25c652315de77c06a466927b0670fc8bb`。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，`restart=none`，未重启任何服务。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29551159628-1`。

## 2026-07-17 - Codex - 预判回看保留无主线交易日

Changed:
- 修复双源均正常但正式主线为空时不写预测档案的问题：schema v3 现在会保存 `recordState=no-mainline`、两源 `available=true/hasMainlines=false`，来源故障仍禁止冒充无主线。
- 回看接口不再以 `top` 非空作为日期门槛；明确的无主线档案会入列，前端在东财与同花顺都无主线时合并显示「今日无主线」。
- 新增受保护的一次性修复任务，从 2026-07-16 冻结收盘快照恢复缺失的无主线回看记录；保留 `sessionPhase=已收盘`，因此可见但不计预测命中率。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/predict-records.test.js`
- `tests/mainline-review.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `ops/production/requests/2026-07-17-review-no-mainline-backfill.ps1`
- `ops/production/manifests/strategy-no-mainline-review-20260717.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- `tests/*.test.js` 共 40 个测试文件全部通过；后端语法、部署清单 JSON 与 `git diff --check` 通过。
- 回填任务模拟验证首次原子生成、第二次幂等 no-op；任一来源不可用时会中止，不能误写无主线。
- 公网 2026-07-16 冻结快照已核验：东财、同花顺均 `available=true`、`hasMainlines=false`、`mainlines=[]`。

Deployment:
- 本条提交时尚未部署；合并后先部署后端与前端并重启主服务，再单独运行 2026-07-16 回填任务（回填本身无需重启）。

## 2026-07-17 - Codex - 无主线回看修复已发布

Changed:
- PR #142 已合并并发布，云端回看现在会保留来源可用但没有通过 L2 明星验证的交易日。
- 发布重启后现有 2026-07-16 运行时档案已被新逻辑正确识别，因此没有执行一次性回填任务，也没有覆盖任何运行时数据。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `ops/production/manifests/strategy-no-mainline-review-20260717.json`

Validated:
- 受保护生产工作流 `29553240472` 成功，批准提交为 `79e3abd70a2f101f9e287ca3181768ca44e94019`。
- 公网 `/health` 返回 `ok=true`，策略页已包含双源「今日无主线」展示逻辑。
- 公网 `/api/strategy-mainline-review?days=10` 最新一条为 `2026-07-16`：`noMainline=true`，东财与同花顺均为 `status=no-mainline`。

Deployment:
- 生产工作流更新后端与策略页，`restart=main`，主服务已重启且健康检查通过。
- 自动回退备份由生产工作流保存在 `C:\PandaDashboard\_deploy-backups\github-29553240472-1`。
- `2026-07-17-review-no-mainline-backfill.ps1` 未运行；只作为将来在原档案真正缺失时的受保护修复工具。

## 2026-07-17 - Codex - 7月8日回看恢复明星确认高亮

Changed:
- 预判回看中，已存在明星确认或预期明星证据的记录不再因 `sampleValid=false` 整行变灰。
- 2026-07-08 继续保留「不计样本·已收盘」的真实口径，但「明星确认·紫光股份」视觉强调与 2026-07-09、2026-07-14 一致。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/strategy-two-source-mainlines.test.js`
- `ops/production/manifests/strategy-review-star-highlight-20260717.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 公网回看接口确认 2026-07-08 的紫光股份为 `predictLevel=confirmed`，差异仅来自旧的 `invalid { opacity: 0.5 }` 样式。
- 前端回归测试覆盖 `hit-invalid star-confirmed invalid`：高亮恢复但不计样本标签仍保留。

Deployment:
- 本条提交时尚未部署；静态页发布使用 `restart=none`，不重启服务。

## 2026-07-17 - Codex - 7月8日明星高亮已发布

Changed:
- 将 PR #144 的预判回看明星高亮优先级发布到云端策略页。

Files:
- `kpl-dashboard_17_apple.html`（生产发布）
- `ops/production/manifests/strategy-review-star-highlight-20260717.json`

Validated:
- 受保护生产工作流 `29553693936` 成功，批准提交为 `f3ba3c21593ad2673b634199cd212dbde05b4656`。
- 公网策略页与 `main` 文件 SHA-256 一致：`3733d491f2be0e5adb48a60e143a857d336cb69747e5712f0e2f55a67968a4ad`。
- 公网页面已包含 `star-confirmed.invalid { opacity: 1 }`，`/health` 返回 `ok=true`。

Deployment:
- 仅更新静态 `kpl-dashboard_17_apple.html`，`restart=none`，未重启任何服务。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29553693936-1`。

## 2026-07-17 - Codex - 策略实时事实层与每日质量观察

Changed:
- 完成策略数据层 P2-P5 的旁路实现：新增东财、同花顺、KPL 三源独立板块资金事实库，所有记录携带目标日/来源日/时间点/获取方式/完整度/哈希；禁止跨日值、旧时间点和失败刷新覆盖有效事实。
- 新增统一策略实时上下文：东财是唯一规范计分源，同花顺/KPL 仅作方向佐证，三源资金永不相加；上下文组合涨停库、四源主因库、收盘价库、候选板块成员和 L2 任务，并按用途分别输出完整度。
- 交易时段每 3 分钟运行独立观察旁路，把来源质量接入现有 `strategy-daily-events` 盘中时间线，并生成每日 JSON/Markdown 质量报告，覆盖 L2 扫描率、预期明星转化、主线出现速度及无主线合理性。
- 新增东财历史板块资金重建工具，读取已验证的历史超大单净流入与板块涨幅；重建文件独立保存、默认 `scoreEligible=false`，不覆盖原始事实/冻结快照。同花顺和 KPL 没有已验证历史接口，继续保持缺失，不造数据。
- 新增管理员只读诊断入口 `/api/admin/strategy-realtime-context`。正式 v2 主线取数、评分、排序与页面响应没有改用新上下文。

Files:
- `kpl-stats-server.js`
- `strategy-daily-events.js`
- `strategy-realtime-data.js`
- `strategy-observation-report.js`
- `tools/reconstruct-board-fund-flow.js`
- `tests/strategy-realtime-data.test.js`
- `tests/strategy-observation-report.test.js`
- `docs/ops/STRATEGY_REALTIME_DATA_LAYER.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增测试覆盖跨日/未知日剔除、休市日拒写、时间单调、质量防倒退、双哈希校验、三源不相加、来源成员与涨停/L2 交集、历史重建隔离、盘中质量时间线、明星转化和异常空榜诊断。
- `node --check` 覆盖主服务、两个新模块、每日事件模块及重建工具；`git diff --check` 通过。
- 全仓 `tests/*.test.js` 共 42 个测试文件全部通过，包含真实 HTTP 端点、权限、策略 v2/v3、L2 和现有页面回归。
- Claude 已独立复核 PR #146，结论为通过且无阻断项；按其建议在晋级清单中补充 KPL 只可保留诊断事实、不得进入策略评分/排序/页面辅助指标的边界。

Deployment:
- GitHub only；尚未部署云端、未重启服务、未生成或改写任何生产运行时事实/报告/快照。

Notes for next agent:
- 部署后新数据层只开始积累诊断事实与观察样本，不会改变正式榜。先观察数个交易日并做 golden diff，Owner 批准后才能讨论迁移任何正式消费者。
- 后台程序同步必须原子包含两个新模块；运行事实仍由现有 `strategy-data` 数据库同步范围携带。
- 历史重建只能对东财执行；任何把 THS/KPL 当前数据写入历史日、或让 reconstructed 数据直接参与评分的改动都应阻断。

## 2026-07-17 - Codex - 准备强刷当日 TGB 湖南人原始证据

Changed:
- 新增受保护、日期绑定的一次性生产脚本，用于强制刷新 2026-07-17 `@TGB湖南人` 官方原文与原始图片证据。
- 脚本只输出公开文章和原图元数据；明确不调用 OCR/Qwen/视觉识别，不写正式 TGB 行、不重折综合主因库、不重启服务。
- 若云端已存在当天 raw evidence，脚本会先备份旧目录；成功后追加两份云端运维日志。

Files:
- `ops/production/requests/2026-07-17-tgb-hunan-raw-evidence.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 脚本目标日、生产路径、文章域名、标题、manifest 日期/状态和下载图片数量均设置显式闸门。
- 实际文章链接、图片清单和备份目录需在脚本合并后由受保护生产工作流确认。

Deployment:
- 本条提交时尚未运行；不部署应用代码，预期不重启任何服务。

Notes for next agent:
- raw evidence 成功不代表 TGB 完成；正式行仍必须由 Codex 对匹配的官方白底表格原图逐行人工转录、二次人工复核并与终盘涨停池完整对账。

## 2026-07-17 - Codex - 生产工作流增加 SSH 限流重试

Changed:
- 生产工作流在远程脚本执行和临时文件清理阶段遇到 SSH 连接失败时，按 10/20/30 秒退避重试；固定 `main`、脚本 SHA-256、环境审批、主机指纹和命令内容均保持不变。
- 修复来源于 TGB raw evidence 工作流连续三次在脚本启动前被云端 `kex_exchange_identification` 重置；三次均已完成脚本哈希校验和上传，但没有进入 PowerShell 脚本执行。

Files:
- `.github/workflows/production-ops.yml`
- `docs/DAILY_HANDOFF.md`

Validated:
- Ruby YAML 解析通过，工作流 7 个步骤结构完整；所有 Bash `run` 块均通过 `bash -n`。
- 生产 TGB 强刷仍需在本改动合并后重新触发并由实际工作流验证。

Deployment:
- 本条提交时仅修改 GitHub Actions 工作流，尚未再次执行生产脚本；生产数据、应用代码和服务进程均未变更。

Notes for next agent:
- 重试只处理传输层退出，不改变脚本幂等、备份或业务校验；远程脚本若已开始并返回业务失败，重复执行仍由日期绑定脚本自身的安全闸负责。

## 2026-07-17 - Codex - 修复 TGB 强刷脚本 Windows 编码兼容

Changed:
- 将 TGB 强刷脚本的中文标题闸改为 ASCII Unicode 码点构造，避免 Windows PowerShell 5.1 按本地代码页读取 UTF-8 脚本时破坏引号与解析结构。
- 将生产工作流执行/清理重试收紧为仅在 SSH 退出码 `255` 时退避；PowerShell 解析或业务闸失败会立即停止，不再重复远程业务命令。

Files:
- `ops/production/requests/2026-07-17-tgb-hunan-raw-evidence.ps1`
- `.github/workflows/production-ops.yml`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前一运行 `29578173593` 已证明 SSH 退避能进入远程 PowerShell；随后在脚本解析阶段因中文字面量停止，未执行任何脚本语句或生产写入。
- 修复后脚本 4,593 字节全部为 ASCII；Ruby YAML 解析和全部 Bash `run` 块 `bash -n` 均通过。
- 实际 raw evidence 仍待下一次受保护生产运行。

Deployment:
- 本条提交时未再次执行生产脚本；正式 TGB、综合主因库和服务进程均未改变。

Notes for next agent:
- 若下一次运行失败，先区分 SSH 255 与 PowerShell/业务错误；后者不得以传输重试掩盖。

## 2026-07-17 - Codex - 准备受保护写入当日 TGB 正式库

Changed:
- 新增日期绑定的生产写入脚本：从一次性加密环境 Secret 接收已人工复核的 32 行 JSON，避免把正式市场运行时数据库提交 Git。
- 脚本固定校验输入 SHA-256、官方文章/`image-01-06.png` raw manifest 证据、终盘池 32 股、缺失/多余/重复/弱字段/名称差异、四个题材块计数；通过后才备份、原子写正式 TGB、重折当日综合主因并验证公网 source-view。
- 工作流仅当脚本路径精确等于 `2026-07-17-tgb-hunan-write.ps1` 时上传对应 Secret 临时文件；执行后无论成功失败都从云端临时目录清理。

Files:
- `ops/production/requests/2026-07-17-tgb-hunan-write.ps1`
- `.github/workflows/production-ops.yml`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地正式行对公网终盘池：32/32，`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0；题材计数为电力 9、算力 5、其他热点 8、其他个股 10，合计 32。
- 正式行由 Codex 对官方原图逐块逐行逐字段人工录入并二次人工复核；未使用 OCR、Qwen 或自动视觉结果生成、补全、猜测或校验。
- 生产脚本 15,758 字节全部为 ASCII，内嵌 Node 程序通过 `node --check`；Ruby YAML 解析和全部 Bash `run` 块 `bash -n` 均通过。
- 实际生产写入、重折和公网验证仍待合并后的受保护运行。

Deployment:
- 本条提交时正式库尚未写入、综合主因尚未重折、服务未重启。

Notes for next agent:
- 输入 Secret 只在本次受保护运行存在；成功或失败后都应从 GitHub `production` 环境删除。

## 2026-07-17 - Codex - 生产工作流 SCP 上传增加限流重试

Changed:
- 为生产脚本、部署清单压缩包和日期绑定 TGB payload 三类 SCP 上传统一增加最多 4 次的 10/20/30 秒退避。
- 只对 SCP 退出码 `255` 重试；文件/权限/参数等非传输错误立即返回，不放宽脚本哈希、主机指纹、身份或环境审批。

Files:
- `.github/workflows/production-ops.yml`
- `docs/DAILY_HANDOFF.md`

Validated:
- 前一正式入库运行 `29579126115` 在 SCP 上传阶段因连接关闭退出 255，远程执行步骤被跳过，日期绑定写入脚本没有启动，正式库和综合主因库未改变。
- Ruby YAML 解析和全部 Bash `run` 块 `bash -n` 均通过；实际上传重试仍待下一次受保护运行验证。

Deployment:
- 本条提交时没有生产写入或服务重启；一次性加密 payload Secret 保持待用。

Notes for next agent:
- 上传重试与执行重试分别处理；两者均只覆盖 SSH 传输层 255，不能掩盖生产脚本业务闸失败。

## 2026-07-17 - Codex - 当日 TGB 湖南人复盘已入库

Changed:
- 按 `docs/ops/TGB_HUNAN_DAILY_SOP.md` 通过受保护生产流程强制刷新 `@TGB湖南人` 官方原文与 19 张原始图片，只采用标题、日期、白底表格和水印均匹配的 `image-01-06.png`。
- 排除顶部“市场连板股”重复摘要、底部 9 行“涨停炸板”、同花顺红色可视化图、头像和其他非表格图片；Codex 对原图逐题材块、逐行、逐字段人工录入并二次人工复核，全程未使用 OCR、Qwen 或自动视觉结果。
- 写入 32 行正式 `review/tgb-hunan-structured`，随后只强制重折 2026-07-17 综合主因库；两份云端运维日志已由受保护脚本追加。
- 一次性加密 payload Secret 在成功后已从 GitHub `production` 环境删除，正式运行时 JSON 未进入 Git。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-sources\tgb-hunan-structured\2026-07-17.json`
- 仅云端运行时：`C:\PandaDashboard\kpl-limitup-main-reason-db\2026-07-17.json`
- 云端两份运维日志（受保护脚本追加）

Validated:
- 官方文章：`https://www.tgb.cn/a/2tvqJaeEJcg`，标题 `7.17湖南人涨停复盘+晚间消息汇总`；使用图片 `image-01-06.png`。
- 题材计数：电力 9、算力 5、其他热点 8、其他个股 10，合计 32。
- 云端终盘池与正式行均为 32；唯一代码 32，`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0，题材计数之和等于总数。
- 正式 TGB SHA-256：`35ed81d66ac28742bf002186f8f89ecdda4b0e7e85a07fae72e43f74db306b3d`；重折后综合主因 SHA-256：`163491ac0fd42bd0b6b28ac9109e1f4972bc5a53293f78413467bc82acb2022b`。
- 公网强制刷新 `source-view`：综合归纳/复盘啦/选股宝/韭研/淘股吧均为 32；四源覆盖和主因覆盖均为 100%，低置信均为 0，`sourceErrors=[]`；公网 `/health` 返回 `ok=true`。
- raw 强刷工作流 `29578470061` 与正式写入/重折工作流 `29579363718` 成功；较早失败均发生在脚本启动前或 PowerShell 解析前，没有部分生产写入。

Deployment:
- raw 旧证据备份：`C:\PandaDashboard\backups\tgb-hunan-raw-20260717-20260717-195608`。
- 正式写入回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260717-20260717121215`，包含写入前相关正式/综合/证据/质量/auto 文件（如存在）、raw manifest/原图和云端日志。
- 未部署应用代码，未重启任何服务；只变更生产运行时复盘数据、综合主因和云端日志。

Notes for next agent:
- 生产工作流现只对 SSH/SCP 退出码 255 做退避；业务闸错误立即停止。日期绑定 TGB 写入脚本仍保留审计用途，但对应 payload Secret 已删除，不能无意重跑。
- 本次操作 PR：`#147`（raw 强刷）、`#148`（SSH 退避）、`#149`（Windows 编码）、`#150`（正式写入）、`#151`（SCP 退避）；最终交接 PR：`https://github.com/dmz1108/dmzrepo/pull/152`。

## 2026-07-17 - Codex - 准备发布策略实时事实层与每日质量观察

Changed:
- 为已合并并经 Claude 独立复核通过的 PR #146 新增原子生产发布清单。
- 清单固定从最新 `main` 同时发布主服务、每日事件模块、两个新数据/观察模块和东财历史重建工具，避免主服务先于依赖模块落地。

Files:
- `ops/production/manifests/strategy-realtime-data-observation-20260717.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #146 的 42 个测试文件和全部语法检查已通过；Claude 复核结论为无阻断项。
- 发布清单仅引用仓库内普通文件，目标路径互不重复，`restart=main`；正式 v2 评分、排序和冻结快照仍不使用新 resolver。

Deployment:
- 本条提交时尚未执行生产发布、尚未重启服务，也未生成任何生产事实或观察报告。

Notes for next agent:
- 发布后核对主服务健康、五个文件哈希和管理员诊断端点；新事实层只开始积累诊断数据，不得据此切换正式 v2 消费链路。

## 2026-07-17 - Codex - 策略实时事实层与每日质量观察已发布

Changed:
- 通过受保护生产工作流将 PR #146 的策略实时事实层、统一诊断上下文、盘中观察旁路和东财历史重建工具原子发布到云端。

Files:
- `kpl-stats-server.js`
- `strategy-daily-events.js`
- `strategy-realtime-data.js`
- `strategy-observation-report.js`
- `tools/reconstruct-board-fund-flow.js`
- `ops/production/manifests/strategy-realtime-data-observation-20260717.json`

Validated:
- 受保护生产工作流 `29586712510` 成功，批准提交为 `90e300553581e2ff258066af96c69644eb87c5bc`；工作流逐文件校验部署哈希、重启主服务并通过本机健康检查。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`，`/kpl` 返回 200；未登录访问新管理员诊断入口返回 403，确认路由已加载且权限闸生效。
- 正式 v2 主线取数、评分、排序和冻结快照未切换到新数据层。

Deployment:
- 已重启 `Panda Dashboard Server` 主服务；娱乐、Caddy 和一致性任务未重启。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29586712510-1`。
- 通用部署器已自动把本次运行追加到两份云端操作日志。

Notes for next agent:
- 发布发生在北京时间收盘后，自动观察不会补造当日盘中样本；下一个交易日 09:15 起每 3 分钟开始积累事实与质量报告。
- 先观察数个真实交易日，再做 golden diff 和三方复核；未经 Owner 新批准，不得把诊断 resolver 接入正式 v2，也不得让 KPL 进入策略评分、排序或页面辅助指标。

## 2026-07-18 - Codex - 准备诊断并恢复娱乐独立服务

Changed:
- 新增受保护的娱乐服务恢复操作，在重启前记录计划任务状态、上次结果、8766 监听和任务重启设置。
- 操作仅重启 `Panda Yule Server`，健康恢复后把结果追加到两份云端操作日志；不部署网站文件、不修改娱乐数据库。

Files:
- `ops/production/restart-yule.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 公网主站和行情健康均为 200；`stanning.dreamerqi.com` 根路径及健康入口稳定返回 503 `娱乐频道暂时不可用`，确认故障边界为独立娱乐服务。
- 脚本仅访问固定计划任务、固定本机健康地址和固定运维日志路径，不接收外部路径或命令参数。

Deployment:
- 本条提交时尚未执行恢复操作，未重启任何服务。

Notes for next agent:
- 恢复后根据重启前 `LastTaskResult`、任务状态与 `RestartCount` 判断重复掉线是否来自计划任务缺少失败自愈。

## 2026-07-18 - Codex - 修复娱乐恢复脚本的计划任务定位

Changed:
- 将娱乐恢复脚本从固定根 `TaskPath` 查询改为枚举后按唯一任务名定位，兼容云端现有 Windows 计划任务定义。

Files:
- `ops/production/restart-yule.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 首次受保护运行 `29649170936` 在首个 `Get-ScheduledTask` 查询处退出；没有执行 `schtasks /End` 或 `/Run`，没有修改生产文件、数据或服务状态。
- 修复保留固定任务名、固定 8766 健康检查和日志审计边界。

Deployment:
- 本条提交时尚未重跑恢复操作，娱乐频道仍返回 503。

Notes for next agent:
- 重跑成功后记录重启前任务状态、`LastTaskResult`、任务失败重启设置和新监听 PID。

## 2026-07-18 - Codex - 娱乐恢复改用任务计划程序 COM 接口

Changed:
- 绕开云端已异常的 `Get-ScheduledTask` CIM 枚举，改用 Windows `Schedule.Service` COM 接口直接读取固定娱乐任务及其失败重启设置。

Files:
- `ops/production/restart-yule.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 第二次受保护运行 `29649288589` 仍在首个全局 `Get-ScheduledTask` 枚举处退出；没有执行娱乐任务停止或启动，生产状态未改变。
- COM 读取只访问任务计划程序根目录中的固定任务名；实际重启仍由既有 `schtasks.exe /End` 与 `/Run` 完成。

Deployment:
- 本条提交时尚未重跑恢复操作，娱乐频道仍返回 503。

Notes for next agent:
- 云端某个计划任务的 CIM 定义可能损坏，导致无参数 `Get-ScheduledTask` 整体失败；本次娱乐恢复不扩大为全机任务修复。

## 2026-07-18 - Codex - 准备发布今日实时盘面深度优化

Changed:
- 为已合并并经 Claude 独立复核通过的 PR #167 新增原子生产发布清单。
- 清单固定同时发布行情 HTML、主服务静态映射和新增的今日实时专用样式，避免页面先引用尚未上线的 CSS。

Files:
- `ops/production/manifests/realtime-workbench-ui-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #167 的语法检查、`git diff --check` 和 45 个测试文件均通过；Claude 复核结论为无阻断项。
- 发布清单只包含 `kpl-dashboard_17_apple.html`、`kpl-stats-server.js` 和 `Qi/vendor/realtime-workbench.css`，目标路径互不重复，`restart=main`。
- 本次仅调整今日实时页面的视觉层级、密度、响应式布局和展开态；业务数据、权限、交互行为及策略逻辑均未改变。

Deployment:
- 本条提交时尚未执行生产发布、尚未重启服务。

Notes for next agent:
- 发布后核对公网 `/health`、`/kpl` 和新增 CSS 均返回 200，并在 1440px 与 390px 视口抽查今日实时卡片、搜索栏和展开详情无横向溢出。

## 2026-07-17 - Codex - 深度统一策略页视觉与信息结构

Changed:
- 在不改变策略数据、评分、排序、权限和交互逻辑的前提下，为今日策略建立最终统一的工作台样式层。
- 重组策略页标题区与工具栏的视觉层级，并统一今日主线榜、明星证据、展开详情、预判回看、L2 扫描记录和重点关注的排版、状态色、间距与响应式行为。
- 板块涨幅和资金净流入紧邻板块名称展示；预期明星与明星确认使用不同但一致的证据层级；移动端长板块名、五档 L2 数据和回看记录不再横向撑开页面。
- 新增静态样式路由和视觉契约测试，确保样式文件与页面结构原子发布且关键模块不会被误隐藏。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `kpl-stats-server.js`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地真实渲染检查：桌面 1440px 与手机 390px；主线卡、明星状态、预判回看、L2 五档和重点关注均无横向溢出或内容裁切。
- `node --check kpl-stats-server.js`、CSS 结构检查和 `git diff --check` 通过。
- 仓库全部 43 套测试通过，包含双源主线、明星/L2 分层、预判回看、资金口径、权限和页面结构回归。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 本轮是纯视觉与结构优化；评审时重点检查不同真实数据长度下的视觉表现，不要借机修改主线筛选、L2 门槛或评分逻辑。
- 部署时必须同时发布 HTML、CSS 和主服务静态路由；主服务需重启后新 CSS 路由才会生效。

## 2026-07-18 - Codex - 准备发布策略工作台视觉优化

Changed:
- 为已由 Claude 独立复核通过并合并的 PR #155 新增生产发布清单。
- 清单把策略页 HTML、独立工作台 CSS 和主服务静态路由作为三件套原子发布，并要求重启主服务。

Files:
- `ops/production/manifests/strategy-workbench-ui-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 发布源均来自已批准的 `main`，目标路径互不重复；清单通过 JSON 结构检查。
- PR #155 的 43 套仓库测试、桌面和手机渲染检查均已通过，Claude 复核无阻断项。

Deployment:
- 本条提交时尚未执行生产发布，未重启服务。

Notes for next agent:
- 发布后必须验证 CSS 公网路由返回 200、行情页引用版本正确、主服务健康，并抽查普通用户无管理员控件泄漏。

## 2026-07-18 - Codex - 策略工作台视觉优化已发布

Changed:
- 通过受保护生产工作流把 PR #155 的策略页 HTML、独立工作台 CSS 和主服务静态路由原子发布到云端。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `kpl-stats-server.js`
- `ops/production/manifests/strategy-workbench-ui-20260718.json`

Validated:
- 生产工作流 `29623670093` 成功，批准提交为 `b8d0174a57a260996366e052377c4c4fc870456f`，操作健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`，`/kpl` 与版本化 CSS 路由均返回 200。
- 公网 HTML 已引用 `/vendor/strategy-workbench.css?v=20260717`；线上 CSS SHA-256 与 `main` 一致：`175947ded871c9a3dab3c88a8e22469c81ec190d1e178c6ecd564efe6f47b06c`。

Deployment:
- 已重启 `Panda Dashboard Server` 主服务；娱乐和 Caddy 未重启。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29623670093-1`。
- 受保护部署器已自动把本次操作追加到两份云端运维日志。

Notes for next agent:
- 本轮生产变化仅为策略页视觉与结构；主线、L2、评分、排序、权限和资金口径均未改变。

## 2026-07-18 - Codex - 深度统一涨停复盘页视觉与信息结构

Changed:
- 在不改变四源数据、综合归纳、筛选、日期、权限和交互逻辑的前提下，为涨停复盘建立独立的最终工作台样式层。
- 统一标题指标、来源切换、股票查询、个股证据、主因板块卡片和完整明细表的层级、间距、状态色与信息密度。
- 桌面端保留可扫描的完整表格，手机端改为逐股记录卡；来源、主因、细分原因、证据与时间均完整保留，无横向溢出。
- 新增静态样式路由和视觉契约测试，确保 HTML、CSS 与主服务映射原子发布。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `kpl-stats-server.js`
- `tests/review-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地真实渲染检查：桌面 1440px 与真实手机 390px；手机端页面宽度与视口一致，无控件、卡片或文字越界。
- `node --check kpl-stats-server.js`、CSS 结构检查和 `git diff --check` 通过。
- 仓库全部 44 套测试通过，包含来源健康、股票查询、四源主因、策略双源与同花顺正确性回归。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 本轮只优化复盘页视觉与结构；评审时不要修改来源口径、综合归纳或权限逻辑。
- 部署时必须同时发布 HTML、CSS 和主服务静态路由；主服务需重启后新 CSS 路由才会生效。

## 2026-07-18 - Codex - 准备发布涨停复盘工作台视觉优化

Changed:
- 为已由 Claude 独立复核通过并合并的 PR #158 新增生产发布清单。
- 清单把复盘页 HTML、独立工作台 CSS 和主服务静态路由作为三件套原子发布，并要求重启主服务。

Files:
- `ops/production/manifests/review-workbench-ui-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 发布源均来自已批准的 `main`，目标路径互不重复；清单通过 JSON 结构检查。
- PR #158 的 44 套仓库测试、桌面和手机渲染检查均已通过，Claude 复核无阻断项。

Deployment:
- 本条提交时尚未执行生产发布，未重启服务。

Notes for next agent:
- 发布后必须验证 CSS 公网路由返回 200、行情页引用版本正确、主服务健康，并抽查桌面表格与手机逐股卡片的来源和证据字段完整性。

## 2026-07-18 - Codex - 涨停复盘工作台视觉优化已发布

Changed:
- 通过受保护生产工作流把 PR #158 的复盘页 HTML、独立工作台 CSS 和主服务静态路由原子发布到云端。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `kpl-stats-server.js`
- `ops/production/manifests/review-workbench-ui-20260718.json`

Validated:
- 生产工作流 `29625891520` 成功，批准提交为 `7f5407f25392fef8ffee31f8ab658dfd80fd5059`，操作健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`，`/kpl` 与版本化复盘 CSS 路由均返回 200。
- 公网 HTML 已引用 `/vendor/review-workbench.css?v=20260718`；线上 CSS SHA-256 与 `main` 一致：`2e366d4bfefcd2cb2d6241c771293f499c28d55357523e8441c3c4ed7dc07722`。

Deployment:
- 已重启 `Panda Dashboard Server` 主服务；娱乐和 Caddy 未重启。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29625891520-1`。
- 受保护部署器已自动把本次操作追加到两份云端运维日志。

Notes for next agent:
- 本轮生产变化仅为涨停复盘页视觉与结构；四源数据、综合归纳、筛选、日期、权限和交互逻辑均未改变。

## 2026-07-18 - Codex - 再次精修涨停复盘工作台视觉细节

Changed:
- 在已上线复盘工作台基础上继续收敛视觉层级，优化来源状态、股票查询、个股证据、主因卡片和完整明细表的间距、密度与对比关系。
- 将股票查询与个股证据整理为连续的纵向分析路径；桌面端把四源证据改为横向证据带，窄屏自动降为两列和单列。
- 为来源切换、搜索和详情区域补充无障碍语义；不改变来源数据、综合归纳、日期、权限、筛选和交互逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `tests/review-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 对当前 `main` 生成同数据基线与精修后对照，完成桌面 1440px 和真实手机 390px 渲染检查。
- 390px 视口的页面宽度、内容宽度均为 390px，无横向溢出；来源、证据、主因卡片和手机记录卡完整显示。
- `node --check kpl-stats-server.js`、CSS 结构检查、`git diff --check` 和仓库全部 44 套测试通过。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 本轮只发布 HTML 与现有静态 CSS 文件即可；主服务按请求读取这两份文件，无需重启。
- 评审时重点核对视觉层级与移动端完整性，不要修改四源口径、综合归纳或权限逻辑。

## 2026-07-18 - Codex - 准备发布复盘工作台第二轮视觉精修

Changed:
- Claude 已独立复核 PR #161，无阻断项；PR 已合并至 `main`。
- 新增受保护生产发布清单，原子发布复盘页 HTML 与现有工作台 CSS。

Files:
- `ops/production/manifests/review-workbench-luxury-polish-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #161 为可干净合并状态，Claude 独立运行 44 套测试全部通过。
- 已确认主服务的 `sendStatic` 每次请求读取磁盘文件；本次未新增静态路由，发布无需重启服务。
- 发布清单仅包含已合并 `main` 的 HTML 与 CSS，目标路径无重复。

Deployment:
- 本条提交时尚未执行生产发布，未重启任何服务。

Notes for next agent:
- 发布后验证 `/kpl` 已引用 `review-workbench.css?v=20260718b`，版本化 CSS 返回 200，并核对线上文件哈希与 `main` 一致。
- 抽查复盘页桌面布局与 390px 手机端逐股卡片；四源数据、综合归纳和权限口径不得变化。

## 2026-07-18 - Codex - 复盘工作台第二轮视觉精修已发布

Changed:
- 通过受保护生产工作流把 PR #161 的复盘页 HTML 与工作台 CSS 原子发布到云端。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `ops/production/manifests/review-workbench-luxury-polish-20260718.json`

Validated:
- 生产工作流 `29627412598` 成功，批准提交为 `b6741566712a99f09fa1094417e950d2228c9891`，操作健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`；公网行情页已引用 `/vendor/review-workbench.css?v=20260718b`。
- 线上 HTML SHA-256 与 `main` 一致：`08baa28a7b8d5a8a88dc36f25125e49db927488802408c0b011cdca7513a92aa`。
- 线上 CSS SHA-256 与 `main` 一致：`d3911822d27be7c45e2e06aa4753ad07b78358d7d5c00183fdfa5c9ca0a62936`。

Deployment:
- 已部署生产；按发布清单未重启任何服务。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29627412598-1`。
- 受保护部署器已自动把本次操作追加到两份云端运维日志。

Notes for next agent:
- 本轮生产变化仅为涨停复盘页视觉、排版和无障碍语义；四源数据、综合归纳、日期、筛选、权限与交互逻辑均未改变。

## 2026-07-18 - Codex - 收敛涨停复盘页边框与阅读路径

Changed:
- 继续减少复盘页的外框和嵌套卡片感，把顶部指标改为无外框读数，把来源切换改为轻量下划线标签栏。
- 个股详情改为连续分析区，四源证据使用分隔线组织，不再重复包裹小卡片；综合归纳不再使用警示红色作为选中态。
- 主因板块固定为桌面四列、平板三列或两列、手机单列，避免动态列数产生孤立卡片；同步降低表格和移动端记录卡的边框存在感。
- 不改变四源数据、综合归纳、日期、筛选、权限、查询和交互逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `tests/review-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 在当前 `main` 同数据基线上完成精修前后 1440px 对照检查，来源、个股证据、主因板块与完整明细层级均完整。
- 真实 390px 设备视口检查：`innerWidth`、页面滚动宽度与正文宽度均为 390px，无横向溢出；手机端逐股记录卡信息完整。
- `node --check kpl-stats-server.js`、CSS 结构检查、`git diff --check` 和仓库全部 44 套测试通过。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 本轮是纯视觉收敛，发布时只需原子发布 HTML 与现有 CSS，主服务无需重启。
- 复核重点是层级是否更安静、桌面主因卡片列数是否稳定，以及 390px 手机端内容是否完整。

## 2026-07-18 - Codex - 准备发布复盘页简洁化精修

Changed:
- Claude 已独立复核 PR #164，无阻断项；PR 已合并至 `main`。
- 新增受保护生产发布清单，原子发布复盘页 HTML 与现有工作台 CSS。

Files:
- `ops/production/manifests/review-workbench-simplicity-polish-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- PR #164 为可干净合并状态，Claude 独立运行 44 套测试全部通过。
- 本次只更新现有 HTML 与 CSS，不新增静态映射；主服务按请求读取文件，发布无需重启。
- 发布清单源文件均来自已批准的 `main`，目标路径无重复。

Deployment:
- 本条提交时尚未执行生产发布，未重启任何服务。

Notes for next agent:
- 发布后验证 `/kpl` 已引用 `review-workbench.css?v=20260718c`，线上 HTML/CSS 哈希与 `main` 一致。
- 抽查桌面来源标签栏、四列主因卡片及 390px 手机端单列卡片与逐股明细。

## 2026-07-18 - Codex - 复盘页简洁化精修已发布

Changed:
- 通过受保护生产工作流把 PR #164 的复盘页 HTML 与工作台 CSS 原子发布到云端。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `ops/production/manifests/review-workbench-simplicity-polish-20260718.json`

Validated:
- 生产工作流 `29631875723` 成功，批准提交为 `7f1f65a4422be75a84ca928eb118af5556dcf98b`，操作健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`；公网行情页已引用 `/vendor/review-workbench.css?v=20260718c`。
- 线上 HTML SHA-256 与 `main` 一致：`f7fd23ff1c6a3ef2da2e53f48c30bc83bea345ca25914c524afc6ee13bd3109e`。
- 线上 CSS SHA-256 与 `main` 一致：`3bec3bea936b733645073e3ff90a7f525108e7fa4e31a72a02913bfef3bb8162`。

Deployment:
- 已部署生产；按发布清单未重启任何服务。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29631875723-1`。
- 受保护部署器已自动把本次操作追加到两份云端运维日志。

Notes for next agent:
- 本轮生产变化仅为复盘页视觉层级与响应式布局；四源数据、综合归纳、日期、筛选、权限、查询与交互逻辑均未改变。

## 2026-07-18 - Codex - 深度重构今日实时盘面视觉层级

Changed:
- 新增独立的实时工作台视觉层，把日期、刷新、数据健康和题材搜索组织为紧凑的盘中工具区。
- 折叠板块卡改为稳定的名称、涨停、明星股、涨幅和资金五层信息结构；桌面采用三列扫描布局，超宽屏四列，手机单列。
- 展开板块卡改为全宽四栏数据工作台，平板两栏、手机单栏；保留原有板块 QI、涨停榜、10 日涨停和 10/30 日涨幅内容与交互。
- 修复 390px 手机端原有横向溢出、顶部账户裁切、题材搜索按钮越界和明星股信息挤压。
- 仅增加页面状态类和静态 CSS 路由，不改变板块筛选、数据源、日期、刷新、权限、删除恢复或卡片加载逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `kpl-stats-server.js`
- `Qi/vendor/realtime-workbench.css`
- `tests/realtime-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 对同一组真实页面结构和代表性行情数据完成 1440px 与真实 390px 设备视口的改前/改后对照。
- 桌面视口无横向溢出；真实手机视口 `viewport/root/body=390/390/390`，卡片宽度 362px，内容完整。
- `node --check kpl-stats-server.js`、`git diff --check`、实时工作台 UI 契约测试和仓库全部 45 套测试通过。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 这是纯视觉与响应式改造，复核时重点检查桌面三列扫描效率、展开态四栏可读性和 390px 手机完整性。
- 本轮新增 `/vendor/realtime-workbench.css` 静态映射，首次发布必须原子部署 HTML、主服务和 CSS，并重启主服务后再验证公网 CSS 返回 200。

## 2026-07-18 - Codex - 今日实时盘面深度优化已发布

Changed:
- 通过受保护生产工作流把 PR #167 的行情 HTML、主服务静态映射和今日实时专用样式原子发布到云端。

Files:
- `kpl-dashboard_17_apple.html`
- `kpl-stats-server.js`
- `Qi/vendor/realtime-workbench.css`
- `ops/production/manifests/realtime-workbench-ui-20260718.json`

Validated:
- 生产工作流 `29636307038` 成功，批准提交为 `b2d3e1e71bc686a683de5c92e6a0d332d941acaa`，操作健康检查为 `ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`；`/kpl`、`/vendor/realtime-workbench.css` 和 `/qi/vendor/realtime-workbench.css` 均返回 200。
- 公网 HTML SHA-256 与 `main` 一致：`11180ce734b654c5c710ae71a2d8da36ee3cd0b03251c3afb7cc1d1c0ca96c2b`。
- 公网 CSS SHA-256 与 `main` 一致：`432da197c7b488ee41b188edb72616164c865be449491eda039eb7494fce6264`。

Deployment:
- 已重启 `Panda Dashboard Server` 主服务；娱乐、Caddy、公司端 L2 worker 和其他任务未重启。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29636307038-1`。
- 受保护部署器已自动把本次操作追加到两份云端运维日志。

Notes for next agent:
- 本轮生产变化仅为今日实时页视觉层级、信息密度和响应式布局；行情数据、策略逻辑、权限、筛选、刷新和卡片交互均未改变。

## 2026-07-18 - Codex - 娱乐频道恢复并准备修复72小时自动终止

Changed:
- 受保护恢复运行 `29649414655` 已重新启动独立娱乐服务；公网首页、两条健康入口和分类接口均恢复 200。
- 新增娱乐任务自愈操作，保留原 `SYSTEM` 身份、启动触发器和 `run-yule-server.cmd` 动作，只把持续运行上限改为无限，并增加失败自动重试。

Files:
- `ops/production/harden-yule-task.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 故障前任务为 `ready`、8766 无监听、`LastTaskResult=267014 (0x41306)`；原设置为 `ExecutionTimeLimit=PT72H`、`RestartCount=0`、`StartWhenAvailable=false`。
- 上次任务于北京时间 2026-07-15 17:11:20 启动，72 小时上限在 2026-07-18 17:11:20 到期，和本次掉线时间及“任务被终止”结果完全吻合。
- 恢复后任务为 `running`、新监听 PID `14020`、本机和公网健康均为 200，娱乐库保持 270 条内容。

Deployment:
- 恢复运行只重启 `Panda Yule Server`，未部署网站文件、未修改娱乐数据库、未重启主服务或 Caddy。
- 自愈设置本条提交时尚未执行；目标为 `ExecutionTimeLimit=PT0S`、每 1 分钟失败重试、最多 5 次、`StartWhenAvailable=true`。

Notes for next agent:
- 自愈操作执行后必须重新读取任务定义并逐字段验证；不允许改变任务 principal、action 或触发器。

## 2026-07-18 - Codex - 娱乐服务72小时终止问题已永久修复

Changed:
- 通过受保护生产运行 `29649673009` 更新 `Panda Yule Server` 任务设置：取消 72 小时运行上限，异常退出后每分钟重试、最多 5 次，并启用错过启动后的补启动。
- 保留原 `SYSTEM` principal、`C:\PandaDashboard\run-yule-server.cmd` 动作和原有触发器；运行中服务健康，因此硬化操作没有再次重启进程。

Files:
- `ops/production/restart-yule.ps1`
- `ops/production/harden-yule-task.ps1`
- `docs/DAILY_HANDOFF.md`
- 仅云端：`Panda Yule Server` 计划任务设置与两份运维日志

Validated:
- 工作流逐字段验证设置由 `PT72H / 0 / 空 / false` 变为 `PT0S / 5 / PT1M / true`，principal 仍为 `SYSTEM`、LogonType 仍为 5。
- 独立 SSH 复核任务为 `running`、8766 正常监听，动作仍为 `/d /c C:\PandaDashboard\run-yule-server.cmd`。
- 公网 `https://stanning.dreamerqi.com/`、`/health` 和 `/api/yule/categories` 均返回 200；娱乐采集继续运行，内容数量由恢复时 270 更新为 275。
- 早先运行 `29649170936` 与 `29649288589` 均在查询任务阶段停止，没有执行重启或修改生产状态；成功恢复运行是 `29649414655`。

Deployment:
- 已变更云端娱乐计划任务设置并写入两份运维日志；未部署网站文件、未修改娱乐数据库、未重启主服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 此前重复 503 的根因是任务每运行满 72 小时被 Windows 自动终止且没有失败重试；本次修复后不应再按三天周期掉线。

## 2026-07-18 - Codex - 收紧涨停复盘数据源选择器

Changed:
- 把复盘页横向等分的数据源按钮改为内容宽度的紧凑分段控件；桌面端不再撑满整行，390px 手机端保持单行完整显示，更窄设备可横向触控浏览。
- 保留原数据源标签、数量、选中逻辑和复盘数据行为，仅优化尺寸、间距、计数角标及选中态。

Files:
- `Qi/vendor/review-workbench.css`
- `kpl-dashboard_17_apple.html`
- `tests/review-workbench-ui.test.js`
- `design-qa.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 桌面 `1440px` 与手机 `390px` 使用同一复盘样本完成修改前后全页及聚焦对照，未发现 P0/P1/P2 视觉问题。
- `node --check kpl-stats-server.js`、复盘工作台 UI 契约测试、完整仓库 45 套测试和 `git diff --check` 全部通过。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 复核重点是数据源按钮在桌面是否足够紧凑、手机是否保持单行可读，以及所有数据源切换逻辑是否维持原行为。

## 2026-07-18 - Codex - 策略回看未通过明星验证状态同行显示

Changed:
- 将旧记录的“候选未通过 L2 明星验证，不计正式主线”从独立详情行收拢到“今日无主线”同一行，并精简为“未通过明星验证”。
- 双源均无正式主线的记录同步使用相同文案和视觉状态，替换含义不完整的“未形成”。
- 无盘后结果时不再渲染空箭头或空结果容器，减少回看列表的无效视觉噪音。
- 仅调整策略回看文案和布局，不改变 L2 明星验证、正式主线门槛、命中统计或数据源逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-two-source-mainlines.test.js`
- `tests/strategy-workbench-ui.test.js`
- `design-qa.md`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用同一组旧 schema 与双源无主线样本完成 1440px 桌面和 390px 手机改前/改后对照，状态完整同行显示且无横向溢出。
- Claude 复核指出并已修复双源正式主线记录盘后实际家族被误隐藏的问题；新增断言锁定“盘后实际家族”继续可见。
- `node --check kpl-stats-server.js`、相关策略测试、工作台 UI 契约测试和仓库全部 45 套测试通过。
- `git diff --check` 通过。

Deployment:
- 仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 复核时确认旧记录和双源记录均显示“今日无主线 / 未通过明星验证”，且不再出现旧长说明或无内容箭头。
- 发布时需同步 HTML 与 `Qi/vendor/strategy-workbench.css`；CSS 缓存版本已更新为 `20260718b`，仅静态文件变化，不需要因本次改动重启主服务。

## 2026-07-18 - Codex - 复盘选择器与策略无主线状态已发布

Changed:
- 通过受保护生产工作流一次原子发布 PR #175 与 PR #176 的已审核视觉调整。
- 复盘数据源选择器改为紧凑分段控件；策略回看无主线记录同行显示“未通过明星验证”。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/review-workbench.css`
- `Qi/vendor/strategy-workbench.css`
- `ops/production/manifests/review-strategy-ui-20260718.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 生产运行 `29652228592` 成功，批准提交为 `d713ab598d29ea801f50d596aed76bd3be531377`，部署器返回 `health=ok`。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`；`/kpl` 与两份工作台 CSS 均可正常读取。
- 公网 HTML、复盘 CSS、策略 CSS 的 SHA-256 分别与 `main` 完全一致：`a578f695461e41e84284b1497bc6f1750025389942e5f2d702352fc33deca807`、`448470825f96be089b8d2cafaf4f9c81100783521e3c5a7b3dcdf669d1d5b1c0`、`fee37e887c2966febe9e7b2557bc0af2b265fb13101f6f51d94acc0cc42ba4bc`。
- 公网页面包含 `review-workbench.css?v=20260718d`、`strategy-workbench.css?v=20260718b` 与“未通过明星验证”正式标记。

Deployment:
- 本次 `restart=none`，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 自动回退备份：`C:\PandaDashboard\_deploy-backups\github-29652228592-1`；受保护部署器已自动追加两份云端运维日志。

Notes for next agent:
- PR #175、#176 和部署清单 PR #177 均已合并；本次视觉调整现已在云端生效。

## 2026-07-20 - Codex - 修复今日实时涨停榜主因次数缺失

Changed:
- 修复今日实时板块卡片中，涨停股未进入“近 10 日涨停次数 Top10”时“主”列显示 `--` 的问题。
- 精确统计接口继续以前 10 名作为排名结果开头，同时追加全部今日涨停股并计算严格综合主因匹配次数；当外部当日涨停池短暂延迟时，按不同市场涨停阈值使用实时涨幅兜底。
- 不改变“主”的口径：仍只统计近 10 个交易日内，综合主因库明确匹配当前板块的涨停次数。

Files:
- `kpl-stats-server.js`
- `tests/realtime-main-reason-count.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过。
- 新增回归覆盖涨停池命中、主板实时阈值兜底、创业板阈值隔离、历史日期禁用实时兜底、Top10 顺序保持及今日涨停股去重追加。
- 今日实时、复盘工作台、数据源健康、板级涨停回填及静态缓存/鉴权相关测试均通过。

Deployment:
- 本条提交时仅 GitHub 分支改动；尚未部署云端，未重启服务。

Notes for next agent:
- 发布时只需同步 `kpl-stats-server.js` 并重启主服务；部署后用当日存在涨停股的板块验证 `/api/precise-zt10` 返回 Top10 之外的今日涨停股，页面“主”列应显示数值而非 `--`。

## 2026-07-20 - Codex - 今日实时主因次数修复已发布

Changed:
- PR #179 的今日实时主因次数修复与 PR #180 的部署清单均已合并进 `main`。
- GitHub 生产运行 `29712201283` 获批后持续停留在托管运行器队列、服务器步骤从未开始；为避免重复执行，先取消该运行，再通过 SSH 部署同一已批准 `main` 文件。
- 云端部署前自动备份原后端文件，原子替换后仅重启 `Panda Dashboard Server`，并自动追加两份云端运维日志。

Files:
- `kpl-stats-server.js`
- `ops/production/manifests/realtime-main-reason-count-20260720.json`
- `docs/DAILY_HANDOFF.md`
- 仅云端：`kpl-stats-server.js`、两份运维日志与回退备份

Validated:
- 本地 46 套测试全部通过，`git diff --check` 与后端语法检查通过。
- 云端部署文件 SHA-256 为 `32bf7ba0a619f7160381c854e610fc03d9fd95311ccb216a46bbae0652669f30`，与批准的 `main` 文件一致；公网 `/health` 返回 `ok=true`。
- 真实当日接口验证：`2026-07-20 / zs_type=7 / 在线办公(801625)` 修复前遗漏今日涨停股鸿合科技，修复后返回该股 `totalCount=1`、`ztCount=0`、`days=[20260720]`，今日实时“主”列可显示数值而非 `--`。

Deployment:
- 已部署云端并重启主服务；回退备份位于 `C:\PandaDashboard\_deploy-backups\manual-realtime-main-reason-20260720-101916`。
- 未修改任何运行数据库、前端文件、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- “主”仍是严格近 10 日综合主因匹配次数；显示 `0` 表示统计已完成但没有匹配，`--` 才表示未拿到统计。用户刷新今日实时页面后即可取得新结果。

## 2026-07-20 - Codex - 修正今日实时同花顺资金口径

Changed:
- 确认今日实时同花顺卡片此前展示的是 `q.10jqka.com.cn/gn` 的 `zjjlr`，与同花顺 APP 可核对的 DDE 大单金额不是同一口径。
- 今日实时同花顺榜改为显式请求 realhead 字段 `527198`（DDE 大单金额，单位元），只覆盖当前请求的有限候选板块，保留 90 秒缓存与并发去重。
- 新增源日期、源时间、stale 与状态元数据；DDE 抓取失败、源日期缺失或跨日时显示缺失，不再把 `zjjlr` 混入同一列。
- 原 `zjjlr` 仅保留在 `netInflowZjjlr` 审计字段；旧浏览器预览缓存会被拒绝，卡片口径标识改为“DDE大单”。
- 策略页既有 DDE 逻辑、东财、复盘和历史快照口径不变。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md`
- `tests/strategy-ths-dde-netinflow.test.js`
- `tests/ths-realtime-dde-display.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 2026-07-20 实时对照：国资云旧 `zjjlr=-48.61亿`、DDE `527198=+7.19亿`；煤炭概念旧 `zjjlr=26.02亿`、DDE `527198=13.49亿`，证实是口径混用而非单位换算错误。
- `node --check kpl-stats-server.js` 与行情页内联脚本编译通过。
- DDE 解析、当前日覆盖、跨日拒绝、旧缓存拒绝、失败置空、策略原口径及全仓库测试均通过。
- `git diff --check` 通过。

Deployment:
- 本条提交时仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 发布需同时同步后端和 `kpl-dashboard_17_apple.html`，并重启主服务；部署后检查 `/api/ths-concepts/catalog?fund_metric=dde&limit=20` 的 `fundFlow`、`netInflowMetric`、`netInflowSourceDay` 与页面同花顺卡片。

## 2026-07-20 - Codex - 今日实时同花顺 DDE 修正已发布

Changed:
- PR #182 已合并进 `main`，并将同一批准版本的后端与行情 HTML 原子发布到云端。
- 云端部署前备份两份旧文件；替换后只重启 `Panda Dashboard Server`，部署脚本已在本地和云端清理。
- 两份云端运维日志已追加本次 DDE 口径修正记录。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志与回退备份

Validated:
- 云端后端 SHA-256：`eb90c4ed4161f8c06a3b6d1a28fbe457d3a603242bdf01333f74f39ae5ecba29`；行情 HTML SHA-256：`01cc853edffa8824fe81bdd8e9188ea5c8dff9eb8527126455bb58bda423ef1d`，均与 `main` 一致。
- 公网 `/health` 返回 `ok=true`，公网 `/kpl` 哈希与 `main` 完全一致。
- 公网 `/api/ths-concepts/catalog?fund_metric=dde&limit=20` 返回 `applied=20`、`missing=0`、`stale=0`、`state=ok`，全部记录声明 `sourceDay=2026-07-20` 和同花顺源时间。
- 实例验证：国资云页面资金已改用 DDE `+8.54亿`，原 `zjjlr=-44.83亿` 仅保留于审计字段；煤炭概念 DDE `+15.48亿`，不再显示旧 `zjjlr=+29.54亿`。

Deployment:
- 已部署云端并重启主服务；回退备份位于 `C:\PandaDashboard\_deploy-backups\manual-ths-dde-realtime-20260720-105231`。
- 未修改运行数据库、复盘数据、Caddy、娱乐服务或公司端 L2 worker。

Notes for next agent:
- 今日实时同花顺资金列现在是 DDE 大单金额，不再是 `zjjlr`。若 DDE 源失败或跨日，页面显示缺失是预期保护行为，不应重新回退混用旧口径。

## 2026-07-20 - Codex - 恢复今日实时主因次数可见性

Changed:
- 修复今日实时板块卡片展开后，股票名单元格继承 `display:flex` 并占满固定表格宽度，导致右侧主因次数与涨幅列被裁掉的问题。
- 展开表格恢复标准 `table-cell` 布局，并为涨停榜、涨停次数和涨幅表设置稳定列宽。
- 原缩写“主”改为明确的“主因”，悬停说明仍采用近 10 个交易日综合主因匹配次数口径。
- 更新实时工作台 CSS 缓存版本，避免浏览器继续使用已缓存的旧布局。

Files:
- `Qi/vendor/realtime-workbench.css`
- `kpl-dashboard_17_apple.html`
- `tests/realtime-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 1440px 正式数据回放中，涨停榜首行三列宽度分别为 177.4 / 54.6 / 109.2px，股票、主因次数、今日涨幅均可见。
- 390px 手机视口无横向溢出，三列宽度分别为 187.2 / 57.6 / 115.2px。
- `realtime-workbench-ui`、`realtime-main-reason-count` 及仓库全部 47 套测试通过；`git diff --check` 通过。

Deployment:
- 本条提交时仅 GitHub 分支改动；尚未部署云端，未重启任何服务。

Notes for next agent:
- 发布时同步行情 HTML 与 `Qi/vendor/realtime-workbench.css` 即可；均为静态文件，不需要重启主服务。

## 2026-07-20 - Codex - 发布今日实时主因列布局修复

Changed:
- 将 PR #184（`d7e0b65`）中的行情 HTML 与实时工作台 CSS 发布到云端。
- 发布前保留原文件回退备份，并同步追加两份云端操作日志。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/realtime-workbench.css`
- 仅云端：两份运维日志与回退备份

Validated:
- 云端文件 SHA-256 与 `main` 一致：HTML `4dcb91ca981df62726b84ab244429295b0d9db6612e5720fbbc9d585dcacd9aa`，CSS `feefca8a24f8281cee326330d6f605cb8c7784f655f5c4673bef494908213126`。
- 公网 `/health` 返回 `ok=true`；`/kpl` 已引用 `realtime-workbench.css?v=20260720`，并包含完整“主因”表头及指标说明。

Deployment:
- 已部署云端；仅静态文件，无服务重启。
- 回退备份：`C:\PandaDashboard\_deploy-backups\manual-realtime-main-reason-20260720-034437Z`。

Notes for next agent:
- 今日实时板块卡片仍按现有交互点击展开；展开后股票、主因次数、今日涨幅三列应同时可见。不要重新给 `.stock-name` 设置 `display:flex`。

## 2026-07-20 - Codex - 修复同花顺 DDE 强板候选覆盖

Changed:
- 复盘 `885887 数据中心(AIDC)` 早盘遗漏：同花顺分钟线显示其 09:30–09:45 涨幅约 1.29%–2.34%，全概念排名第 25–55；原策略只保留每源涨幅前 8，因此它虽有强 DDE 仍在成分股和 L2 验证前被裁掉。
- 同花顺策略候选改为“原涨幅前排 + 正涨幅 DDE 大单金额前排”的去重并集；原涨幅候选顺序不变，正式主线仍须满足既有涨停数和 L2 明星门槛。
- 复用同一次 realhead 响应的字段 `199112` 刷新候选板块当前涨幅，避免使用掉出涨幅榜之前的旧值；DDE 失败时策略仍保留原 `zjjlr` 与口径标识，不清零、不冒充 DDE。
- 未写死“数据中心”或任何板块名称，其他“涨幅不在最前但 DDE 强”的正涨幅细分板块同样受益；负涨幅板块不会仅凭绝对大单金额进入候选。

Files:
- `kpl-stats-server.js`
- `tests/strategy-ths-dde-netinflow.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 以同花顺 382 个概念当日分钟线重建排名：数据中心 09:30/09:35/09:40/09:45 分别为第 55/34/25/49，证实源数据存在且原涨幅截断会漏板。
- 实时 direct source `bk_885887` 返回当日 DDE 字段 `527198` 与涨幅字段 `199112`；新增测试覆盖 DDE 补选、涨幅同步刷新、负涨幅拒绝及 DDE 失败保留原资金口径。
- `node --check kpl-stats-server.js`、DDE/实时数据专项测试及仓库全部 47 套测试通过；`git diff --check` 通过。

Deployment:
- 本条提交时仅 GitHub 分支改动；尚未部署云端，未重启服务，未修改运行数据库或公司端 L2 worker。

Notes for next agent:
- 发布后需重启主服务。验收应在交易时段观察同花顺来源的 `scanSupplement.picked`：DDE 前排但非涨幅前 8 的板块应能进入补选，仍只有满足 `净流入≥5亿元 + 涨停≥2 + L2明星` 才能成为正式主线。

## 2026-07-20 - Codex - 发布同花顺 DDE 强板候选覆盖修复

Changed:
- 将 PR #186（`77f64f0`）的同花顺 DDE 强板补选逻辑发布到云端。
- 发布前保留主服务文件备份，发布后同步更新两份云端操作日志并清理临时部署文件。

Files:
- `kpl-stats-server.js`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志与回退备份

Validated:
- 云端 `kpl-stats-server.js` SHA-256 与 `main` 一致：`8cbdd0b6f93c3aef95495c5dab72d61ac2bd6a9ce89801779ffd98b6c0c94877`。
- 主服务计划任务重启成功，PID `14968 -> 15176`；公网 `/health` 返回 `ok=true`。
- 刷新后的 `scanSupplement.picked` 已出现原涨幅截断范围外的同花顺 DDE 补选板块，证明新候选并集已在生产生效。

Deployment:
- 已部署云端并重启主服务。
- 回退备份：`C:\PandaDashboard\_deploy-backups\manual-ths-dde-candidates-20260720-133713`。
- 未修改运行数据库、复盘底库、Caddy、娱乐服务或公司端 L2 worker。

Notes for next agent:
- 数据中心在后续时段转为负涨幅，因此不会被当前补选强行保留；新逻辑只在板块仍为正涨幅且 DDE 居前时补入验证池。正式主线门槛没有放宽。

## 2026-07-20 - Codex - 明星买卖比改为三项取二

Changed:
- 保留最大可统计档主动买入累计严格 `>1.5亿元` 的金额硬门槛，将明星比值闸改为以下三项至少两项严格 `>1.65`：最大档主动买卖比、50 万档主动买卖比、最大档主动+被动合力比。
- 未封且涨幅 `>=5%` 通过同一门槛时仍为预期明星；达到涨停阈值时为明星确认。只有一项比值通过时，封板股明确标为 `sealedWeak`，未封大涨股仅保留资金活跃状态。
- 最大档证据新增 `ratioGate` 审计元数据，记录三项原值、逐项结果和通过数量；管理员提示可直接查看 `2/3` 结论。
- 管理员 L2 扫描历史面板同步同一判定，避免后端正式主线与前端历史记录结论不一致。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 三种两两组合均有行为测试；三项分别等于 `1.65` 均不得通过；最大档主动买正好 `1.5亿元` 仍不得通过。
- 回放浪潮信息 2026-07-20 09:44 真实样本：最大档主动比 `2.05`、50 万档主动比 `1.34`、最大档合力比 `3.58`，按新规则 `2/3` 通过，仍为明星确认。
- `node --check kpl-stats-server.js`、明星专项测试以及仓库全部 47 套测试通过；`git diff --check` 通过。

Deployment:
- 本条提交时仅 GitHub 分支改动；尚未部署云端，未重启服务，未修改运行数据库或公司端 L2 worker。

Notes for next agent:
- 复审需重点确认金额硬门槛未被绕过、三项均为严格大于，以及策略正式判定与管理员历史镜像判定保持一致。通过后需同时发布后端与行情 HTML，并重启主服务。

## 2026-07-20 - Codex - 发布明星买卖比三项取二规则

Changed:
- Claude 对 PR #188 完成独立复核并确认无阻断项后，将合并后的 `main` 双文件原子发布到云端。
- 云端正式明星口径现为：最大档主动买入累计严格 `>1.5亿元`，并且最大档主动比、50 万档主动比、最大档合力比三项中至少两项严格 `>1.65`。
- 同步更新两份云端操作日志并清理临时部署文件。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志与回退备份

Validated:
- Claude 在独立 worktree 复跑 `node --check` 与全部 47 套测试，结论为通过、无阻断项。
- 云端 SHA-256 与 `main` 一致：服务端 `50d5e634170203cda9947bc1c06c3e694ac5b5337155e1538387fc8ccbd36096`，行情 HTML `96f2aaeb5aa4ca67042c85c6d3bd0a0c72ba8b9e6e69a8af5c8e14fbec346747`。
- 主服务 PID `15176 -> 960`；公网 `/health` 返回 `ok=true`，`/api/strategy-mainlines?day=2026-07-20` 返回 `ok=true`。

Deployment:
- 已部署云端并重启主服务。
- 回退备份：`C:\PandaDashboard\_deploy-backups\manual-star-ratio-2of3-20260720-152014`。
- 未修改运行数据库、复盘底库、Caddy、娱乐服务或公司端 L2 worker。

Notes for next agent:
- 2026-07-20 是明星比值规则切换日，跨日前后比较明星转化率时应标注口径断点。浪潮信息 09:44 样本仍以最大档主动比和最大档合力比两项达标而保持明星确认。

## 2026-07-20 - Claude - 明星粘性抗题材漂移 + 东财资金前排补选(Owner 指派 1/2)

Changed:
- [P1] 粘性保留抗漂移:轨迹行新增 mainlineBoardIds(主线当时成分板 plateId,并集保留);
  新增 strategyMainlineResolveExpectedHistory 两级回退匹配——题材经当前归类重新规范化同族、
  或成分板 plateId 交集;attach 改走解析器。生产证据:2026-07-20 上午"算力AI"浪潮信息已
  明星确认(11:15 快照),午后家族并组漂移为"算力"致主线卡消失,违反「出过明星永久保留」。
  不跨来源、不做模糊字符串匹配;TransitionMap 仍是 Map(仅附加 rows 索引),既有直查零破坏。
- [P2] 东财资金前排补选(与 #186 对称):strategyEastFundCandidateUnion——涨幅前5原样保留,
  补入「正涨幅 + f66 超大单净流入为正(带符号,流出板不入)」前排,去重≤2×池。生产证据:
  2026-07-20 国资云概念 rank9/云计算 rank26,紫光股份 +7.29% 领涨全天未被验证。
  门槛/L2 验证一概不放松,只修"未验证先被取数裁掉"。

Files:
- kpl-stats-server.js(transitions 落库/映射/解析器/attach + 东财补选与接线)
- tests/strategy-expected-star-sticky.test.js(新增 10 断言,含实盘缺陷回归)
- tests/strategy-east-fund-candidates.test.js(新增 7 断言)
- tests/qi-mainline-states.test.js(attach 依赖注入更新)

Validated:
- node --check 通过;全仓 49 个测试文件全绿。

Deployment:
- 未部署;PR 待 Codex 复核后 Owner 合并,production-ops.yml 发布 kpl-stats-server.js 并重启。

Notes for next agent:
- 已知边界:若漂移后的家族连候选池都没进(无任何同族/共板候选),粘性仍无法恢复——
  按 #123 规范需要"从预测档案凭空复卡",本次未做,留给 Owner 决定是否要。
- 明日盘中验收:观察东财候选池是否出现资金前排板;若"算力AI"类漂移再现,确认卡片保留。

## 2026-07-20 - Claude - PR#190 Codex 复核 P1 修复(资金补水挂到快照命中路径)

Changed:
- [P1] 东财/同花顺资金前排补水此前只接在「无快照才执行」的实时回退块——生产常态
  (当日快照已存在)完全不运行(Codex 云端核验:zs6 快照 7 块且无 BK1008/BK0579)。
  新增 fundForwardEligible 补水块:当日策略口径 + source===snapshot 时显式拉实时榜做
  并集,把 bmap 缺的资金前排板合并进内存板池(绝不回写快照文件);补入板打 fundForward 标记。
- 集成测试 strategy-fund-forward-augment.test.js:贯穿真实 getDayBoardsWithMembers(仅stub IO),
  预置非空 zs6 快照(无国资云/云计算)+实时榜含二者 → 板池含二者+标记;看板默认调用零变化;
  历史日拒绝;不回写快照;流出板拒入。

Files: kpl-stats-server.js / tests/strategy-fund-forward-augment.test.js / docs/DAILY_HANDOFF.md
Validated: node --check;全仓 50 个测试文件全绿。
Deployment: 未部署;随 PR#190 走。

## 2026-07-20 - Claude - PR#190 Codex 二审 P1 修复(fund-forward 板贯通补选通道)

Changed:
- [P1] fund-forward 板此前进了中间板池但无 scanChannel,在正式构建 filter(b=>b.scanChannel)
  处被全部删除(Codex 二审)。修复:enrich 补选池改为 live→全量 / snapshot→仅 fundForward 板
  (它们本就是当日真实时拉榜数据,普通快照板仍不得伪装);命中板 scanChannel='supplement',
  supplementBasis 带 fundForward 标;补选观测状态如实标 snapshot+fund-forward。
- 集成测试延伸到真实 enrich + 正式 scanChannel 过滤模拟:fund-forward 板存活为 supplement、
  主通道快照前5不变、普通快照板仍被拦、live 路径零回归、状态如实。

Files: kpl-stats-server.js / tests/strategy-fund-forward-augment.test.js / docs/DAILY_HANDOFF.md
Validated: node --check;全仓 50 个测试文件全绿(专项 17 断言)。
Deployment: 未部署;随 PR#190。

## 2026-07-20 - Codex - PR #190 复核、合并与云端部署

Changed:
- 完成 PR #190 最终复核并批准：明星轨迹支持题材名称漂移后的同族/成分板回退匹配；东财资金前排补选贯通快照命中、enrich 与正式 `scanChannel` 过滤链路。
- 将 PR #190 合并至 `main`（merge commit `14f98b1`），随后原子替换云端 `kpl-stats-server.js` 并重启主服务。
- 同步记录两份云端运维日志；未改运行数据库、快照、前端、Caddy、娱乐服务或公司端 L2 worker。

Files:
- `kpl-stats-server.js`
- `tests/strategy-expected-star-sticky.test.js`
- `tests/strategy-east-fund-candidates.test.js`
- `tests/strategy-fund-forward-augment.test.js`
- `tests/qi-mainline-states.test.js`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志与部署回退备份

Validated:
- `node --check kpl-stats-server.js` 通过；全仓 50 个测试文件全部通过；`git diff --check` 通过。
- 公网 `https://market.dreamerqi.com/health` 返回 HTTP 200、`ok=true`。
- 公网 `/api/strategy-mainlines?day=2026-07-20` 返回 HTTP 200、`ok=true`，`realtimeSource=live`，主线结果 3 条。
- 云端服务端 SHA-256 为 `2d7e0a9e4f111ef6959e460ecce8babe43bbf1c138081852b37d393bb3c2b78e`，与合并后本地文件一致；主进程 PID `5276`。

Deployment:
- 已部署云端并重启主服务。
- 回退备份：`C:\\PandaDashboard\\_deploy-backups\\pr190-20260720-212205`。
- 云端部署前已验证旧文件无漂移，部署脚本包含哈希校验、语法检查、失败自动回退和健康检查。

Notes for next agent:
- PR #190 已正式上线，不要再按“未部署”处理。下一个交易日盘中重点观察资金前排补选板是否进入 L2 候选，以及发生题材漂移后已有明星主线卡是否保持。

## 2026-07-20 - Codex - 准备按 Owner 终盘口径写入 TGB 湖南人复盘

Changed:
- Owner 明确当日终盘口径：`600227 赤天化` 未封死，必须排除；`601991 大唐发电`、`603533 掌阅科技` 均封住涨停且出现在湖南人官方原图，必须纳入。人工正式候选因此与当前 53 股终盘池完全一致。
- 新增日期绑定、受保护的一次性生产请求：只接受固定 SHA-256 的 53 行人工载荷，固定校验官方文章、`image-01-06.png` 原图长度与哈希、三股口径、题材块计数及全部质量闸；通过后备份、原子写正式 TGB、强制重折当天综合主因并验证公网四源健康。
- 生产请求失败时逐文件按存在状态和 SHA-256 回退，再按每股代码、名称、最终题材、最终细分原因及来源覆盖验证公开缓存；公网请求有 25 秒硬超时。日期绑定载荷只经 GitHub `production` Secret 和 SCP 传递，清理失败会使工作流失败。

Files:
- `.github/workflows/production-ops.yml`
- `ops/production/requests/2026-07-20-tgb-hunan-write.ps1`
- `tests/tgb-20260720-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 人工候选 53 行、唯一代码 53；`missingCodes=[]`、`extraCodes=[]`、重复 0、弱字段 0；纳入 `601991/603533`、排除 `600227`。
- 题材块为电力 18、算力 7、煤炭 6、油服 4、业绩 3、其他 15，合计 53；仅 `000539 粤电力A/粤电力Ａ` 为 NFKC 等价的已记录名称差异。
- 人工载荷 SHA-256 为 `808264f51913362f64d6989effa4c6cdd2e58606bc1fb97be3e7fc6782f9746d`；官方图片 SHA-256 为 `736c9169f450b4c1819b2d3eaf4f7e1f28315ded7d65e82b88df46b0550f0061`。
- 全仓 51 个测试文件、嵌入 JavaScript、Windows PowerShell ASCII、workflow YAML/Bash 语法、后端语法及 `git diff --check` 均通过；另一 Codex agent 独立审查了生产、回退和密文清理路径。

Deployment:
- 本条记录时尚未执行正式写入、综合主因重折或服务重启；生产请求必须先经独立 `codex/` 分支 PR 合并到 `main`，再按固定脚本哈希走受保护工作流。

Notes for next agent:
- 正式转录来自 Codex 对官方白底原图的逐题材块、逐行、逐字段人工双遍复核；没有使用 OCR、Qwen 或自动视觉结果生成、补全、猜测或校验正式行。
- 这是按 Owner 明确事实修正当日来源与终盘池，不改变策略算法或评分，因此不需要 AI 讨论组协议。

## 2026-07-20 - Codex - 当日 TGB 湖南人复盘已按 Owner 口径入库

Changed:
- Owner 最终确认 `600227 赤天化` 当日未封死，不计入涨停池；`601991 大唐发电`、`603533 掌阅科技` 均封住涨停且出现在湖南人官方白底原图，必须计入。此前“赤天化也应计入、终盘应为 54”的中间判断已被本条明确纠正。
- 通过受保护生产运行 `29751479050` 写入 2026-07-20 `review/tgb-hunan-structured` 正式 53 行，并强制重折当天综合主因库；脚本在任何写入前固定复核官方文章、原图长度/哈希、人工载荷哈希、三股口径与完整质量闸。
- 正式文章为 `https://www.tgb.cn/a/2tAptm3XkHu`（`7.20湖南人涨停复盘+晚间消息汇总`）；使用官方白底表格 `image-01-06.png`，原图 URL 为 `https://image.tgb.cn/img/2026/07/20/z24ph4hon8kl.png_760w.png`，长度 694480 字节。
- 生产脚本把本次安全结果追加到两份云端运维日志；一次性载荷 Secret 已在成功后删除，远端脚本和载荷清理步骤通过。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端：`kpl-limitup-main-reason-sources/tgb-hunan-structured/2026-07-20.json`、当天综合主因/evidence/quality/auto 与四个正式来源折叠产物、两份运维日志和回退备份

Validated:
- 正式 53 行、唯一代码 53；`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称不匹配 0；纳入 `601991/603533`、排除 `600227`。
- 题材计数：电力 18、算力 7、煤炭 6、油服 4、业绩 3、其他 15，合计 53；仅 `000539 粤电力A/粤电力Ａ` 为已记录的 NFKC 等价差异。
- 正式 TGB SHA-256：`8220f9f2a65c241d220bc51b2c895a0d1b625cfd9531d52055df26b5e9509f20`；重折后综合主因 SHA-256：`e7b38728c62bcaa51d3717c7354959677f1bbd89b93261534b9122566db9aca6`；终盘池 SHA-256：`a476fc6be57e3a6a64dcf7daa3503229b4583caf956de4542ecc9b9bd55ef1c8`。
- 独立公网复核显示综合归纳、复盘啦、选股宝、韭研、淘股吧均为 53 行/53 唯一代码，五个标签相对终盘池的 missing/extra 均为空；四源覆盖与主因覆盖均 100%、低置信 0、`sourceErrors=[]`。
- 当天综合主因、evidence 和 quality 均为 53，review 覆盖与主因覆盖 100%；终盘涨停池为 53，公网 `/health` 为 `ok=true`。
- 正式行仍全部来自 Codex 对官方原图的逐题材块、逐行、逐字段人工转录和第二遍人工复核；没有使用 OCR、Qwen 或自动视觉结果生成、补全、猜测或校验正式行。

Deployment:
- 已改变生产运行时复盘数据、重折综合主因并更新云端日志；未部署或替换应用代码，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 写入前回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260720-20260720143858`。
- 受保护写入请求 PR `#195` 已合并，生产执行提交为 `d2b2277f26bafc3a4944c8ff60fcb5a42ab52510`，脚本 SHA-256 为 `24b1a459f647f77aad128bf3a7206a1ed536e3af288321e9a526f10051a3163d`。

Notes for next agent:
- 2026-07-20 TGB 已完整完成，不要再按旧的 52/54 中间判断重复阻断或覆盖正式文件；当日权威复盘口径为 53 只，包含大唐发电、掌阅科技，不包含未封死的赤天化。
- 最终交接通过独立 `codex/tgb-hunan-20260720-handoff` PR 留存；后续只需按正常次日 SOP 继续，不需要为本日数据重启服务。
## 2026-07-20 - Claude - 527198 无方向语义写入数据源合同(待三方会签)

Changed:
- MARKET_DATA_SOURCE_CONTRACTS.md THS 节新增 Directionality 定论段:527198 为无方向量级值,
  绝不当带符号净流向解读;附 7-17 三源交叉证据(国资云 客户端-5亿/zjjlr-3.15亿/板跌 vs 527198+5.54亿,
  智慧政务同型)、校准盲区教训(样本必须含净流出板)、公开字段无法复原客户端带符号列的结论、
  以及接受该口径的后果(同花顺侧5亿腿实为活跃度门槛,方向靠涨停腿+L2明星闸兜底)。
- 三个待会签问题列在 PR 描述,请 Codex 逐条表态:①无方向口径是否终局;②是否加 zjjlr 符号的
  卡面方向警示(仅展示,不混口径);③带符号源寻源(方案H/付费)关闭还是搁置。
- Codex 会签后按其两条阻断修订:证据边界收窄(已验证范围内非负,而非"绝不为负";带符号列
  推定来自认证通道,未证实);删除"后果已接受"表述——5亿腿方向盲区如实标为"现状而非终态",
  涨停腿/明星闸不再称作方向兜底;新增 Codex 组合门槛提案(527198≥5亿 且 zjjlr>0 且 涨停≥2,
  待 Owner 确认,代码另 PR)与寻源"搁置+三触发条件"结论。命名规则:该口径一律称
  DDE 大单金额/活跃度,不得叫净流入。
- Owner 2026-07-20 已拍板采用组合门槛(527198≥5亿 且 zjjlr>0 且 涨停≥2,L2 明星要求不变,
  zjjlr≤0 同时阻断扫描与正式资格);合同已定稿为 approved decision。代码由 Codex 独立分支
  实现(方向提示与方向闸门须拆为两个接口结果字段),交 Claude 复审。

Files: docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md / docs/DAILY_HANDOFF.md
Validated: docs-only,node --check 不适用;全仓测试不受影响。
Deployment: 无(文档)。

## 2026-07-20 - Codex - 同花顺 DDE 活跃度与方向组合门槛

Changed:
- 按 Owner 已批准口径实现同花顺当日实时组合门槛：`527198 DDE 大单活跃度 >= 5亿`、`zjjlr > 0`、板块/主线当日涨停数 `>= 2`，三项全部满足后才允许自动 L2 扫描并进入后续明星闸；L2 预期明星/明星确认规则本身未改。
- 修复 DDE 覆盖时可能把无方向的 `527198` 金额误写进 `netInflowZjjlr` 的链路；同花顺 DDE 活跃度和带符号方向现在分字段贯穿板块、主线、双源载荷、AI 只读证据与诊断排除原因。
- 同花顺组合门槛仅用于当日实时构建，历史冻结快照和预判回看维持原兼容口径；东财超大单净流入门槛保持不变。
- 今日实时与今日策略页面把同花顺 `DDE活跃` 和 `全量方向` 分开显示，避免再把无方向金额标成净流入；方向缺失、净流出、DDE不足、涨停不足均有独立可观测原因。
- Claude 首轮复审后 Owner 拍板保留两条既有正式榜粘性：人工确认与盘中已出现预期/确认明星的同花顺主线不会因组合闸后来失效而下榜；接口仍如实输出 `passed=false`、`exempted=owner-confirm|expected-star-sticky`、失败原因和真实方向。自动 L2 扫描没有任何豁免，仍须三腿全部通过。
- 前端对负方向明确显示“方向已转负”，并对被豁免卡显示“人工确认保留”或“明星粘性保留”；豁免仅保留当日记录，不代表方向闸通过。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/realtime-workbench.css`
- `tests/inflow-gate.test.js`
- `tests/scan-priority.test.js`
- `tests/strategy-board-zt-backfill.test.js`
- `tests/strategy-eastmoney-superlarge-flow.test.js`
- `tests/strategy-kpl-exclusion.test.js`
- `tests/strategy-source-pairs.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `tests/ths-realtime-dde-display.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node --check kpl-stats-server.js` 通过；全仓 51/51 个 `tests/*.test.js` 文件全部通过；`git diff --check` 通过。
- 新增门槛测试覆盖 DDE、方向、涨停三腿的通过/阻断、方向缺失、净流出、DDE 回退不得冒充通过、历史兼容及东财零回归。
- 复审修订测试覆盖普通负方向候选排除、明星粘性保留、人工确认保留、豁免字段与 `outflow` 状态，以及自动扫描继续无豁免。
- 前端可执行测试确认实际 HTML 同时显示 DDE 活跃度与同板 `zjjlr` 方向，两个金额不会互相覆盖。
- 本地临时端口冒烟：`/health`、`/kpl`、两份工作台 CSS 与当日策略 API 均返回 HTTP 200；临时服务已正常停止。

Deployment:
- 未部署云端，未重启任何服务；本次仍为 GitHub Draft PR，等待 Claude 对 Owner 修订的复验。

Notes for next agent:
- 复验重点：自动 L2 派发始终无豁免；正式榜两条粘性仅豁免下榜且必须保留 `passed=false` 与 `exempted`；不得把该门槛倒溯应用到历史回看，也不得改变东财路径。

## 2026-07-21 - Codex - PR #197 合并与云端部署

Changed:
- Claude 对 Owner 修订提交 `c1ee6de` 独立复验通过后，将 PR #197 转为 Ready 并合并到 `main`；合并提交为 `545262e`。
- 部署前逐文件比较云端与 PR #197 前基线：`kpl-stats-server.js`、`kpl-dashboard_17_apple.html`、`Qi/vendor/realtime-workbench.css` 三份哈希全部一致，确认无公司端覆盖或云端热修漂移。
- 备份三份生产文件后原子部署 PR #197 审批版本，仅重启 `Panda Dashboard Server`；部署失败路径包含原文件回退和服务恢复。
- 两份云端运维日志已追加安全部署记录；未改运行数据库、行情快照、复盘数据、Caddy、娱乐服务或公司端 L2 worker。

Files:
- `kpl-stats-server.js`
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/realtime-workbench.css`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志和部署回退备份

Validated:
- 合并前和 Claude 复验均为 `node --check` 通过、全仓 51/51 个测试文件全绿；`git diff --check` 通过。
- 部署暂存文件再次通过 SHA-256 与 `node --check`；部署后三份云端 SHA-256 分别为 `ae1c49c212a746204e8868039ba56250ea1f7a560bc3d894e5cc570691669f76`、`ea6f5706ad8d250a44abf12921e4d3befadddc464586a62544f094d16f3e6a31`、`6e753f7fceced83d4d5b361c408025f4be50f7a44112e43e8c974ccf150eabd6`，与 `main` 完全一致。
- 公网 `https://market.dreamerqi.com/health`、`/kpl` 和 `/vendor/realtime-workbench.css` 均返回 HTTP 200。
- 2026-07-21 盘前策略请求按既有保护返回 `market-not-open`；2026-07-20 历史策略仍正常返回 3 条，证明页面/API 基础链路未回归。

Deployment:
- 已部署云端并重启主服务；部署回执 `health=ok`。
- 回退备份：`C:\PandaDashboard\_deploy-backups\pr197-20260721-091733`。
- 云端暂存目录已清理，两份运维日志均确认写入 PR #197 记录。

Notes for next agent:
- PR #197 已正式上线，不要再按“Draft/未部署”处理。下一个交易日盘中重点观察同花顺卡片的 DDE 活跃度/全量方向双列、组合闸排除原因，以及人工确认/明星粘性保留卡的负方向警示。

## 2026-07-21 - Claude - 主线题材三要件(确认明星+龙头+题材板,Owner 定稿)

Changed:
- 讨论定稿 docs/strategy/discussions/2026-07-21-qi-mainline-three-requirements.md。
- 正式主线三要件(2026-07-21 起,STRATEGY_MAINLINE_THREE_REQ_START_DAY 切界,不追溯):
  确认明星≥1(confirmed) 且 合格龙头≥1(leaders 非空) 且 非风格板。
- strategyMainlineApplyL2StarGate 分层:kept=正式(qiTier=formal)/reserve=预备(qiTier=reserve,
  reserveReasons 如实列缺件)/excluded 原样;impl、缓存/冻结返回层(Restrict,按载荷日期切界)
  两处同规则;l2Gate.rule 切换为 formal-mainline-requires-confirmed-star-and-leader。
- 风格板黑名单(大盘成长/基金重仓/证金持股/茅指数/漂亮100系/上证50等 23 项+含漂亮100兜底):
  种子/扫描消费前统一剔除,不占扫描配额;显式清单可增删。
- 预备主线 reserveMainlines 全链路透出(impl→slim→compose 并集→bySource→Restrict→AI compact);
  预测档案 starTransitions/candidates 并入预备主线(top 仅正式)——命中率飞轮不断粮。
- 前端:双栏各源正式榜下方琥珀"预备主线"区(缺件角标:缺确认明星/缺龙头),与 #200 回看层
  "未兑现候选"同构;空态文案区分"暂无正式主线,N 条预备待确认"。
- 生产证据:2026-07-21 14:59 快照(正式榜 4 卡中 2 张无龙头风格板,其余仅 expected)。

Files:
- kpl-stats-server.js / kpl-dashboard_17_apple.html / Qi/vendor/strategy-workbench.css
- docs/strategy/discussions/2026-07-21-qi-mainline-three-requirements.md
- tests/strategy-three-requirements.test.js(新,20 断言)
- tests/qi-mainline-states.test.js / tests/inflow-gate.test.js(静态断言随新形状更新)

Validated:
- node --check 通过;全仓 52 个测试文件全绿;前端内联脚本编译通过。

Deployment:
- 未部署;PR 待 Codex 复核。发布需 server+HTML+strategy-workbench.css 三件原子+重启说明:
  未动 STATIC_FILES,重启仅因 server 变更。

Notes for next agent:
- 明星规则统计分段点新增 2026-07-21(三要件);命中率复盘按 top(正式)与 candidates(含预备)
  区分口径。风格板黑名单在 STRATEGY_MAINLINE_STYLE_BOARD_NAMES,误伤/漏网直接改清单。
## 2026-07-21 - Codex - 预判回看明星结果层级重构

Changed:
- 将预判回看的首要信息从按日期平铺改为按结果分组：真主线（明星确认）、未兑现候选（预期明星最终未封板）、待验证（最终证据未完整）和其他交易日；真主线固定优先展示。
- 统一明星结果语义：原始 `confirmed` 与预期明星最终 `sealed` 均归入真主线；`notSealed` 明确标为“预期未兑现”；`pending`/`noData` 使用中性待验证样式，不把缺证据误画成失败。
- 用红色实线、克制的琥珀色和中性蓝灰虚线建立三层视觉区分，同时保留明确文字标签，避免只依赖颜色表达状态；页头增加真主线、未兑现和待验证日数摘要。
- 重排手机端股票名称、次日最高/收盘/3日表现和来源明细，保证窄屏可读且不横向溢出；评分、收益统计、主线命中、数据接口及历史记录均未改动。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-two-source-mainlines.test.js`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node tests/strategy-two-source-mainlines.test.js`、`node tests/strategy-workbench-ui.test.js`、`node tests/star-l2-layers.test.js` 通过；全仓 51/51 个 `tests/*.test.js` 文件全部通过；`git diff --check` 通过。
- 使用云端近 10 日真实回看载荷制作只读预览，Playwright 在 1440px 桌面与 390px 手机视口完成视觉核验；页面和各结果组 `scrollWidth === clientWidth`，名称、收益与来源信息无横向溢出。
- 真实样本验证包含 3 个明星确认日、1 个预期未兑现日、1 个证据待补日；分组数量、顺序和状态文案均符合预期。

Deployment:
- 未部署云端，未重启任何服务；等待 Claude 独立复审后再决定合并与部署。

Notes for next agent:
- 复审重点：确认预期明星最终 `sealed` 仅在回看展示层升级为真主线；`notSealed` 与 `noData` 不得混淆；本 PR 不应改变任何评分、冻结记录、命中率或后端业务逻辑。

## 2026-07-21 - Codex - PR #200 合并与云端部署

Changed:
- Claude 对 PR #200 当前提交 `215ad68` 独立复核通过后，将 PR 转为 Ready 并合并到 `main`；合并提交为 `c958122`。
- 部署前在云端为行情 HTML 和策略工作台样式建立同一回退备份；先发布 CSS，再发布引用新缓存版本的 HTML，避免半发布状态。
- 仅更新预判回看的前端分组与视觉层级；没有修改后端、评分、冻结记录、运行数据库、行情快照、Caddy 或公司端 L2 worker。
- 两份云端运维日志均已追加安全部署记录。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `docs/DAILY_HANDOFF.md`
- 仅云端：两份运维日志和部署回退备份

Validated:
- Claude 复核与 Codex 合并前验证均确认全仓 51/51 个测试文件通过，后端文件零改动。
- 部署暂存文件和正式文件的 SHA-256 均与 `main` 一致：HTML `1f16efd4e09cb952ccddb349bea54029d3a3fc1afe39d26b96fe8a0359e8b773`，CSS `00eb430fea6d4c0e778cfb3f405dde85d353713a5ff0f6adab9d312298519431`。
- 公网 `https://market.dreamerqi.com/kpl`、`/vendor/strategy-workbench.css?v=20260721a` 与 `/health` 均正常；线上 HTML 已包含“真主线 / 未兑现候选 / 待验证”三层文案。

Deployment:
- 已部署云端，未重启任何服务；健康检查返回 `ok=true`。
- 回退备份：`C:\PandaDashboard\backups\pr200-review-star-hierarchy-20260721-163648`。

Notes for next agent:
- PR #200 已正式上线，不要再按“Draft/未部署”处理。
- PR #201 并非基于 PR #200；继续处理前应同步最新 `main`，并修复其后端门槛顺序、风格板回流、预备主线回看证据丢失及卡片状态/排版问题。

## 2026-07-21 - Claude - 三要件按 Codex #201 审查修订 + 同步 main(#200 已上线)

Changed:
- P1-1 龙头重算后二次分层:reworkTargets=正式+预备全集一起重算,重算完用
  strategyMainlineApplyL2StarGate 重新分层——原始 leaders 非空、重算清空(如 mainZt10Count=0)
  的卡不再留在正式榜;双缺卡如实进诊断(missing-confirmed-star-and-leader,不占预备位)。
- P1-2 冻结/缓存返回层(RestrictToQiPayload)同样前置剔除风格板(excluded 记
  style-board-not-theme),reserveMainlines 合并侧同滤——stale/frozen 载荷无法回流风格板。
- P1-3 预备回看不丢证据:预测落盘守卫放宽(top 空但 candidates/starTransitions 有内容仍落档);
  候选档案持久化 qiTier/reserveReasons;回看 API 新增 strategyMainlineReserveStarOutcomes,
  按来源/题材/缺件/个股输出预备预期明星封板状态,reserveSeal 独立计数(检验三要件是否错杀),
  不混正式 expectedSeal;旧档案无 qiTier 一律不产出(不追溯)。
- P2 语义与视觉:缺件拆分"待明星确认/待龙头形成";预备卡缺件状态改流式状态栏(不再绝对角标
  压右上角分数);预备卡紧凑化(隐藏明细/信号带/趋势等),含确认明星缺龙头卡保持琥珀不套红。
- 同步 main:#200(回看三层级)已合并部署;DAILY_HANDOFF 双方条目保留;CSS 缓存版本统一升
  20260721b(#200 已用 20260721a 部署,本分支再加样式必须再 bump)。

Files:
- kpl-stats-server.js / kpl-dashboard_17_apple.html / Qi/vendor/strategy-workbench.css
- tests/strategy-three-requirements.test.js(扩展:双缺转诊断/纯预备日落档/回看 outcomes 两源+不追溯)
- tests/mainline-review.test.js / tests/leader-pool-debug.test.js / tests/strategy-workbench-ui.test.js

Validated:
- node --check 通过;合并 main 后全仓 52 个测试文件全绿。
- 生产证据回放(AI 只读通道,strategy-live day=2026-07-21,evidence sha256 d2ab95d136454506…):
  真实 4 卡经新门槛→ 大盘成长/基金重仓 风格板剔除,半导体/消费电子·显示 进预备层
  (no-confirmed-star),正式榜空——与 Owner 判定一致,无风格板残留。
  (AI compact 载荷无 starStocks 字段,星级按 14:59 已记录证据重建:两题材全天仅 expected。)

Deployment:
- 未部署;PR #201 待 Codex 复验。发布仍为 server+HTML+CSS 三件原子+重启(server 变更)。

Notes for next agent:
- 回看前端把 reserveStarOutcomes 并入 #200 的"未兑现候选/待验证"分组是后续小项,后端字段已就绪。
- reserveSealRate 高说明三要件在错杀,应回报 Owner 复核门槛。
## 2026-07-21 - Codex - 准备强刷当日 TGB 湖南人原始证据

Changed:
- 新增受保护、日期绑定的一次性生产脚本，用于强制刷新 2026-07-21 `@TGB湖南人` 官方原文与原始图片证据。
- 脚本只输出公开文章和原图元数据；明确不调用 OCR、Qwen 或视觉识别，不写正式 TGB 行、不重折综合主因库、不重启服务。
- 若云端已有当天 raw evidence，脚本先备份旧目录；成功后追加两份云端运维日志。

Files:
- `ops/production/requests/2026-07-21-tgb-hunan-raw-evidence.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 北京时间目标日为 2026-07-21（周二）；本地 `main` 与 `origin/main` 一致，任务分支从最新基线建立。
- 脚本固定校验目标日、官方文章域名、标题、manifest 日期/状态和至少一张原图下载成功；脚本保持纯 ASCII。

Deployment:
- 本条提交时尚未运行生产脚本；正式 TGB、综合主因库和服务进程均未改变。

Notes for next agent:
- raw evidence 成功不代表 TGB 完成；只有匹配标题、日期、白底表格和 `@TGB湖南人` 水印的官方原图可进入后续人工双遍转录。

## 2026-07-23 - Codex - L2 个股逐档明细可读性优化

Changed:
- 仅重排策略页「今日 L2 扫描记录」中点击个股后展开的五档统计，不改明星判定、扫描门槛、数据字段或折叠摘要。
- 逐档数据改为分组表格：主动成交和被动成交分别展示买入金额、卖出金额、买卖比，末列单独展示合力比。
- 最大档保持醒目标记；买入金额、卖出金额使用既有涨跌色语义；窄屏保留档位列并允许横向查看完整统计。
- 补充三种比值的页面内定义，并更新策略样式缓存版本。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node tests/star-l2-layers.test.js`
- `node tests/strategy-workbench-ui.test.js`
- 仓库全量 `59/59` 个测试文件通过。
- `git diff --check`
- 与 `origin/main` 逐字节比较 `strategyL2HistoryStarStatus`，结果完全一致（SHA-256 `e3eda055543f4ea5ab7e825540f36230287327edaa22a5e651ce302f698a887d`）。
- 使用本机 Chrome 无头模式分别以 `1280x720` 和 `390x760` 检查展开表格；未见列宽抖动、文字重叠或窄屏挤压。

Deployment:
- GitHub only；尚未部署云端，未重启任何服务。

Notes for next agent:
- 本任务是纯展示改动；复审时重点确认 `strategyL2HistoryStarStatus` 与原 `main` 完全一致，并检查展开表格，不要把本任务扩大为明星口径调整。

## 2026-07-23 - Codex - 明星股两阶段口径与三段式 L2 复扫

Changed:
- 明星金额闸改为二选一：个股最大可统计档主动买入累计严格 `>1.5亿元`，或被动买入累计严格 `>2亿元`。
- 预期明星仍要求未封且涨幅 `>=5%`，三项比值至少两项严格 `>1.65`；封板确认改为同三项至少两项严格 `>2.00`，不再沿用预期明星阈值。
- 自动 L2 扫描改为首次发现、板块增强、封板确认三阶段；同板块不设日扫描轮次上限，涨停数增加、净流入较上次增加至少 1 亿元、板块涨幅较上次增加至少 0.5 个百分点，任一事件即可增强复扫。
- 预期明星触及涨停后优先发起确认扫描；该确认不受板块资金瞬时回落阻断。已有确认明星后停止该板块无意义复扫。
- 每个任务记录扫描阶段、触发原因、轮次、前序任务和板块强度快照，并完整传递给公司端 worker；管理员 L2 证据同步显示主/被动买金额、金额闸和当前阶段比值阈值。

Files:
- `kpl-stats-server.js`
- `local-l2-task-queue.js`
- `strategy-backend.js`
- `kpl-dashboard_17_apple.html`
- `tests/strategy-l2-rescan.test.js`
- `tests/star-l2-layers.test.js`
- `tests/scan-priority.test.js`
- `tests/strategy-board-zt-backfill.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 全仓 `59/59` 个 `tests/*.test.js` 测试文件通过。
- `node --check kpl-stats-server.js`、`node --check local-l2-task-queue.js`、`node --check strategy-backend.js` 与 `git diff --check` 通过。
- 新增回归覆盖主动/被动金额二选一、`1.65/2.00` 严格边界、三个增强条件单独触发、同板第 2 至第 8 轮连续复扫、封板确认优先和 worker 元数据传递。

Deployment:
- 尚未部署、未改生产运行时数据、未重启主服务、Caddy 或公司端 L2 worker；合并并复核后需原子发布四份应用文件并重启主服务，worker 代码无需替换。

Notes for next agent:
- “复扫不按分钟判断”指业务触发只看增强事件；现有全局每 5 分钟最多 2 个任务且串行的容量保护仍保留，避免公司端同时超量订阅。
- 同板块没有次数上限；1 亿元和 0.5 个百分点仅是去除行情微小抖动的事件台阶，不是时间冷却。

## 2026-07-23 - Codex - 准备受保护写入当日 TGB 正式库

Changed:
- 受保护 raw 运行 `30003870403` 强制刷新 2026-07-23 官方文章与 20 张原始图片；只采用标题、日期、白底表格和 `@TGB湖南人` 水印均匹配的 `image-01-06.png`。
- 明确排除同花顺红图 `image-01-15.png`、统计图 `image-01-07.png`、回帖题材图 `image-01-11.jpg`、头像、广告和底部“涨停炸板”25 行。
- Codex 对官方原图逐题材块、逐行、逐字段人工转录 115 行，并第二遍回看原图复核；全程未使用 OCR、Qwen 或其他自动视觉结果生成、补全、猜测或校验正式行。
- 新增日期绑定写入脚本和工作流密文上传分支：写入前固定验证人工载荷、官方原图哈希、115 股终盘池及全部质量闸；通过后才备份、原子写正式 TGB、重折当天综合主因并验证公网四源健康。

Files:
- `.github/workflows/production-ops.yml`
- `ops/production/requests/2026-07-23-tgb-hunan-write.ps1`
- `tests/tgb-20260723-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 官方文章 `https://www.tgb.cn/a/2tFsEMDE2fP`，标题 `7.23湖南人涨停复盘+晚间消息汇总`；官方原图 `image-01-06.png`，长度 1170327 字节，SHA-256 `829af8cdc44361857914e11a36d93eb8340baf9336ca19c0b769cca3f65057bf`。
- 人工载荷 115 行、唯一代码 115；`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0；人工载荷 SHA-256 `934b778a239e9010e89a11bb12e7304de3ba4877e2dd55d74be7dd94be5b5269`。
- 题材块计数：电力+电网设备 34、锂电池 10、化工 9、机器人 8、算力+数据中心 8、医药医疗 6、商业航天 5、地产 4、军工 4、黄金 3、油服 3、有色金属 3、摘帽 3、公告 3、半导体 3、其他 2、其他 7，合计 115。
- 全仓 58/58 个 `tests/*.test.js` 文件通过；写入脚本内嵌 JavaScript 可解析、PowerShell 保持纯 ASCII，`git diff --check` 通过。

Deployment:
- raw 证据已刷新并备份到 `C:\PandaDashboard\backups\tgb-hunan-raw-20260723-20260723-193908`；正式 TGB 尚未写入、综合主因尚未重折、服务未重启。

Notes for next agent:
- 正式运行时载荷只允许通过 GitHub `production` 环境日期绑定 Secret 传递，成功或失败后必须删除；运行时 JSON 不得进入 Git。

## 2026-07-23 - Codex - 修正当日 TGB 原始池排除闸

Changed:
- 首次正式运行 `30004916866` 在预写原始终盘池闸安全停止：云端原始池为 116 行，其中北交所 `920222 益坤电气` 应排除，正式非 ST、非北交所、非新股前缀口径仍为 115 行。
- 日期绑定脚本改为固定验证 116 行原始池以及唯一且精确的排除行 `920222 益坤电气`，再继续验证 115 行正式集合；不会把排除行写入 TGB 正式库。

Files:
- `ops/production/requests/2026-07-23-tgb-hunan-write.ps1`
- `tests/tgb-20260723-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 首次运行在备份、正式写入、综合主因重折和云端日志变更之前失败；正式 TGB、综合主因和服务状态均未改变，受保护远端脚本/载荷清理成功。
- 修订后闸同时固定原始总数、排除代码和排除名称，任何其他排除行均会继续安全停止。
- 修订后全仓 58/58 个 `tests/*.test.js` 文件通过，PowerShell 仍为纯 ASCII，`git diff --check` 通过。

Deployment:
- 本条提交时尚未重跑正式写入；服务未重启。

Notes for next agent:
- 正式质量口径是 `116 原始池 - 1 北交所 = 115 正式行`，不要把北交所排除误报为正式缺失。

## 2026-07-23 - Codex - 记录当日 TGB 名称规范化差异

Changed:
- 第二次正式运行 `30005192355` 在预写名称闸安全停止：115 股代码、题材块、重复和弱字段检查全部通过，仅 `002165` 的官方原图名 `红宝丽` 与终盘池名 `红 宝 丽` 存在内部空格差异。
- 日期绑定脚本保留官方原图名 `红宝丽`，只在代码-名称对账时使用 `NFKC+remove-whitespace`，并固定记录这一条代码、来源名、终盘池名和规范化方式；任何额外差异继续安全停止。

Files:
- `ops/production/requests/2026-07-23-tgb-hunan-write.ps1`
- `tests/tgb-20260723-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 公网同日 source-view 显示 `002165` 在复盘啦为 `红宝丽`，综合归纳、选股宝和韭研为 `红 宝 丽`，确认是已存在的数据源空格差异，不是原图转录错误。
- 第二次运行仍在备份、正式写入、综合主因重折和云端日志变更之前失败；正式运行时数据未改变，受保护远端脚本/载荷清理成功。
- 修订后全仓 58/58 个 `tests/*.test.js` 文件通过，PowerShell 仍为纯 ASCII，`git diff --check` 通过。

Deployment:
- 本条提交时尚未再次重跑正式写入；服务未重启。

Notes for next agent:
- 正式 TGB 行必须继续保存原图 `红宝丽`，不能为迎合终盘池静默改成带空格名称。

## 2026-07-23 - Codex - 当日 TGB 湖南人复盘已入库

Changed:
- 受保护运行 `30005529170` 写入 2026-07-23 `review/tgb-hunan-structured` 正式 115 行，并强制重折当天综合主因库。
- 写入前复核人工载荷、官方文章/原图哈希、116 股原始终盘池、排除北交所 `920222 益坤电气` 后 115 股正式口径及全部质量闸。
- 正式行全部来自 Codex 对 `@TGB湖南人` 官方白底原图逐题材块、逐行、逐字段人工转录和第二遍人工复核；未使用 OCR、Qwen 或任何自动视觉结果生成、补全、猜测或校验。
- 两份云端运维日志已由脚本追加安全结果；远端脚本/载荷清理通过，一次性 GitHub `production` 环境 Secret 已删除。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端：`kpl-limitup-main-reason-sources/tgb-hunan-structured/2026-07-23.json`、当天综合主因/evidence/quality/auto 与四个正式来源折叠产物、两份运维日志和回退备份

Validated:
- 官方文章 `https://www.tgb.cn/a/2tFsEMDE2fP`（`7.23湖南人涨停复盘+晚间消息汇总`）；采用 `image-01-06.png`，原图 URL `https://image.tgb.cn/img/2026/07/23/yk1ocfjuge9b.png_760w.png`，长度 1170327 字节，SHA-256 `829af8cdc44361857914e11a36d93eb8340baf9336ca19c0b769cca3f65057bf`。
- 正式 115 行、唯一代码 115；`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称不匹配 0；仅 `002165 红宝丽/红 宝 丽` 为已记录的 `NFKC+remove-whitespace` 等价差异。
- 题材块计数：电力+电网设备 34、锂电池 10、化工 9、机器人 8、算力+数据中心 8、医药医疗 6、商业航天 5、地产 4、军工 4、黄金 3、油服 3、有色金属 3、摘帽 3、公告 3、半导体 3、其他 2、其他 7，合计 115。
- 人工输入 SHA-256 `934b778a239e9010e89a11bb12e7304de3ba4877e2dd55d74be7dd94be5b5269`；终盘池 SHA-256 `b9fbffe6caa26a3e2c18ddc9418825d31895c57c7e664c6e65e6c7caefbfd2ce`；正式 TGB SHA-256 `9bfb7e609eaf42e2fde3a4957f35e7f55ae85040f4aa93a521e28dc57eb332be`；重折后综合主因 SHA-256 `a6ef6205220433900b9b200cbf515d58325afce405447995b417109c12f96d53`。
- 独立公网强刷复核：综合归纳、复盘啦、选股宝、韭研、淘股吧均为 115 行和 115 唯一代码，五个标签相对正式集合的 missing/extra 均为空；四源覆盖和主因覆盖均为 100%、低置信 0、`sourceErrors=[]`，主因库 115，公网 `/health` 为 `ok=true`。
- 淘股吧公网核心字段与人工载荷逐行比较无差异。

Deployment:
- 已改变生产运行时复盘数据、重折综合主因并更新云端日志；未部署或替换应用代码，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 正式写入回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260723-20260723120456`；raw 证据备份：`C:\PandaDashboard\backups\tgb-hunan-raw-20260723-20260723-193908`。

Notes for next agent:
- raw 请求 PR `#226`、正式写入请求 PR `#227`、原始池排除修复 PR `#228`、名称差异记录 PR `#229` 均已合并；2026-07-23 TGB 已完整完成，不要重复覆盖正式文件或重启服务。

## 2026-07-22 - Codex - 准备受保护写入当日 TGB 正式库

Changed:
- 受保护 raw 运行 `29916370488` 强制刷新 2026-07-22 官方文章与 15 张原始图片；只采用标题/日期/白底表格/`@TGB湖南人` 水印均匹配的 `image-01-06.png`，排除同花顺红图、回帖行情图、统计图、头像和底部“涨停炸板”。
- Codex 对官方原图逐题材块、逐行、逐字段人工转录 46 行并第二遍回看复核；全程未使用 OCR、Qwen 或其他自动视觉结果生成、补全、猜测或校验正式行。
- 新增日期绑定写入脚本和工作流密文上传分支：写入前固定验证人工载荷/官方原图哈希、46 股终盘池及全部质量闸；通过后才备份、原子写正式 TGB、重折当天综合主因并验证公网四源健康。

Files:
- `.github/workflows/production-ops.yml`
- `ops/production/requests/2026-07-22-tgb-hunan-write.ps1`
- `tests/tgb-20260722-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 官方文章 `https://www.tgb.cn/a/2tDNd3zOTPi`，标题 `7.22湖南人涨停复盘+晚间消息汇总`；官方原图 `image-01-06.png`，长度 680572 字节，SHA-256 `7f57aceb616fe744525793b6c2dc97471e3d277b3f69706c8f6504749426c3e8`。
- 人工载荷 46 行、唯一代码 46；`missingCodes=[]`、`extraCodes=[]`、重复 0、弱字段 0、名称差异 0；人工载荷 SHA-256 `1015192cf9a2c45b759273ee2041f9e3bd6dde291ef4dc65ba0c1eae4f4c8514`。
- 题材块计数：电力 12、医药 5、半导体 4、算力 4、超节点 3、黄金 3、公告 4、其他热点 4、其他个股 7，合计 46；顶部“市场连板股”为重复摘要，底部“涨停炸板”36 行未进入正式载荷。

Deployment:
- raw 证据已刷新；正式 TGB 尚未写入、综合主因尚未重折、服务未重启。

Notes for next agent:
- 正式运行时载荷只允许通过 GitHub `production` 环境日期绑定 Secret 传递，成功或失败后必须删除；运行时 JSON 不得进入 Git。

## 2026-07-21 - Codex - 准备受保护写入当日 TGB 正式库

Changed:
- 受保护 raw 运行 `29826781199` 强制刷新 2026-07-21 官方文章与 19 张原始图片；只采用标题/日期/白底表格/`@TGB湖南人` 水印均匹配的 `image-01-06.png`，排除同花顺红图、回帖题材表、统计图、账户截图、顶部重复“市场连板股”和底部“涨停炸板”。
- Codex 对官方原图逐题材块、逐行、逐字段人工转录 120 行并第二遍回看复核；全程未使用 OCR、Qwen 或其他自动视觉结果生成、补全、猜测或校验正式行。
- 新增日期绑定写入脚本和工作流密文上传分支：写入前固定验证人工载荷/官方原图哈希、121 股原始终盘池、排除 1 条 ST/北交所/新股前缀后 120 股正式口径及全部质量闸；通过后才备份、原子写正式 TGB、重折当天综合主因并验证公网四源健康。

Files:
- `.github/workflows/production-ops.yml`
- `ops/production/requests/2026-07-21-tgb-hunan-write.ps1`
- `tests/tgb-20260721-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 官方文章 `https://www.tgb.cn/a/2tC8FxwG90V`，标题 `7.21湖南人涨停复盘+晚间消息汇总`；官方原图 `image-01-06.png`，长度 1021460 字节，SHA-256 `88318532abb5e8d438cd17071e0e9ff66730d1f8aeaa007aacb752a4716c55cb`。
- 人工载荷 120 行、唯一代码 120；`missingCodes=[]`、`extraCodes=[]`、重复 0、弱字段 0、名称差异 0；人工载荷 SHA-256 `b8e7a9c2c07e64e88e088ad366aa219179feb973631a070390bcf35272176ade`。
- 题材块计数：半导体 40、PCB 11、算力+数据中心 11、光通信 7、被动元件 7、机器人 5、大金融 4、公告 4、有色金属 4、AI应用 3、AI硬件 3、玻璃基板封装 3、业绩 3、智能电网 3、黄金 2、其他个股 10，合计 120。
- 写入脚本内嵌 JavaScript、PowerShell ASCII、workflow YAML/Bash、后端语法和 `git diff --check` 均通过；全仓 52/52 个 `tests/*.test.js` 文件全部通过。

Deployment:
- raw 证据已刷新并备份到 `C:\PandaDashboard\backups\tgb-hunan-raw-20260721-20260721-193940`；正式 TGB 尚未写入、综合主因尚未重折、服务未重启。

Notes for next agent:
- 正式运行时载荷只允许通过 GitHub `production` 环境日期绑定 Secret 传递，成功或失败后必须删除；运行时 JSON不得进入 Git。

## 2026-07-21 - Codex - 压缩当日 TGB 日期绑定载荷传输

Changed:
- 首次正式运行 `29828419646` 因环境 Secret 误设为字面量 `-`，在载荷 SHA-256 闸处、读取任何生产运行时数据库之前失败；远端脚本和载荷清理成功，正式库、综合主因和云端日志均未改变。
- 正确的 59,008 字节人工 JSON 经 Base64 后超过 GitHub 环境 Secret 单值上限；第二次调度 `29828546124` 已在环境审批前取消，未执行生产作业。
- 写入脚本改为接收 gzip+Base64 日期绑定载荷；远端先解压，再对原始 JSON 继续验证固定 SHA-256 `b8e7a9c2c07e64e88e088ad366aa219179feb973631a070390bcf35272176ade`，不改变任何正式行或质量闸。

Files:
- `ops/production/requests/2026-07-21-tgb-hunan-write.ps1`
- `tests/tgb-20260721-production-request.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 59,008 字节原始 JSON 经确定性 gzip 后为 4,459 字节，Base64 后为 5,948 字节；日期绑定密文仍由受保护工作流上传、远端清理，解压后的原始 JSON 哈希保持不变。
- 专项生产请求、旧日兼容、workflow YAML/Bash、后端语法和 `git diff --check` 通过；全仓 52/52 个测试文件全部通过。

Deployment:
- 本条提交时未再次执行正式写入；未重折综合主因，未重启服务。

Notes for next agent:
- 后续重跑必须重新计算合并后脚本 SHA-256，并将 gzip 后再 Base64 的值写入 `DREAMERQI_TGB_20260721_PAYLOAD_B64`。

## 2026-07-21 - Claude - 三要件按 Codex 三审修订(重算全集合同/超时 fail-closed/预备回看闭环)

Changed:
- P1-A 重算对象不再被首闸与截断线决定:三要件日新增 strategyMainlineThreeReqReworkAndGate
  合同——入参为未截断的 QI 星证据全集(inflowGate.kept 过滤 HasQiStarEvidence),先重算、
  唯一一次分闸、最后才排序截断。初始双缺候选经近10日主因池重算补出龙头可进预备层;
  首闸只保留非 QI 证据诊断行。
- P1-B 超时不污染分闸:重算在浅副本上进行(rework 对 leaders 是整组赋值,浅副本足以隔离),
  完整成功才提交副本;超时丢弃副本(后台继续改的只是副本),gate 以 leadersUnverified
  fail-closed——龙头腿视为缺失,当日无正式主线,确认明星者降预备(待龙头形成),
  expected-only 落诊断;l2Gate.leaderReworkCompleted + 空态 leader-rework-incomplete 可解释。
- P1-C 预备回看闭环:helper 增 kind 字段——kind=expected(轨迹行,参与预期→封板转化统计)/
  kind=confirmed(缺龙头卡"从未 expected 的确认明星"从候选档案 stars 补齐,只展示不进转化率);
  回看前端(#200 三层分组)消费 reserveStarOutcomes:纯预备日按预备结果进组
  (预备·预期转明星/预备·预期未兑现/预备·待验证,标签防冒充),行内预备层逐股结果条,
  头部新增"预备预期转封"独立统计 chip。
- P2 预备卡不再隐藏 .ml-star-proof(核心明星证据),改压缩样式;区头改
  "明星或龙头单项条件待补齐";预备回看行 CSS。

Files:
- kpl-stats-server.js / kpl-dashboard_17_apple.html / Qi/vendor/strategy-workbench.css
- tests/strategy-three-requirements.test.js(新增合同 a/b 行为测试:双缺重算补龙头→预备、
  超时无正式主线且原对象不被后台污染;kind=confirmed 补齐;前端消费静态断言)
- tests/leader-pool-debug.test.js(静态断言随分支重构更新)

Validated:
- node --check 通过;同步 main(含 #203)后全仓 52 个测试文件全绿。
- 2026-07-21 真实载荷回放结论不变(最终闸函数同一):风格板剔除、半导体/消费电子·显示进预备。

Deployment:
- 未部署;PR #201 待 Codex 复验。

Notes for next agent:
- 三要件日重算走 ThreeReqReworkAndGate(副本+fail-closed);旧口径日仍走原 mainlines 截断+超时路径。
- 预备回看行最多显示 4 只;reserveSealRate 高说明三要件在错杀,回报 Owner。
## 2026-07-21 - Codex - 当日 TGB 湖南人复盘已入库

Changed:
- 受保护运行 `29828853550` 写入 2026-07-21 `review/tgb-hunan-structured` 正式 120 行，并强制重折当天综合主因库；脚本在写入前复核人工载荷、官方文章/原图哈希、121 股原始终盘池、排除北交所 `920267 鑫汇科` 后 120 股正式口径及全部质量闸。
- 正式行全部来自 Codex 对 `@TGB湖南人` 官方白底原图的逐题材块、逐行、逐字段人工转录和第二遍人工复核；未使用 OCR、Qwen 或任何自动视觉结果生成、补全、猜测或校验。
- 两份云端运维日志已由脚本追加安全结果；受保护工作流的远端脚本/载荷清理通过，一次性 GitHub `production` 环境 Secret 已删除。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端：`kpl-limitup-main-reason-sources/tgb-hunan-structured/2026-07-21.json`、当天综合主因/evidence/quality/auto 与四个正式来源折叠产物、两份运维日志和回退备份

Validated:
- 官方文章 `https://www.tgb.cn/a/2tC8FxwG90V`（`7.21湖南人涨停复盘+晚间消息汇总`）；采用 `image-01-06.png`，原图 URL `https://image.tgb.cn/img/2026/07/21/expg7tsek9kl.png_760w.png`，长度 1021460 字节，SHA-256 `88318532abb5e8d438cd17071e0e9ff66730d1f8aeaa007aacb752a4716c55cb`。
- 正式 120 行、唯一代码 120；`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0；121 股原始池只排除北交所 `920267 鑫汇科`。
- 题材块计数：半导体 40、PCB 11、算力+数据中心 11、光通信 7、被动元件 7、机器人 5、大金融 4、公告 4、有色金属 4、AI应用 3、AI硬件 3、玻璃基板封装 3、业绩 3、智能电网 3、黄金 2、其他个股 10，合计 120。
- 人工输入 SHA-256 `b8e7a9c2c07e64e88e088ad366aa219179feb973631a070390bcf35272176ade`；终盘池 SHA-256 `4d92d11c97559ac6104b0302235552003774a93c182d51d409218677caade9ec`；正式 TGB SHA-256 `fdd91a0ad0725bf60e168714ee24e2a5e81f5a7514400910254c7e0fbe65b011`；重折后综合主因 SHA-256 `373e5e70e8d30b40b351c343ca9723e93c62a5d637e5273be226710ffd86f334`。
- 独立公网强刷复核：综合归纳/复盘啦/选股宝/韭研/淘股吧均为 120 行和 120 唯一代码，五个标签相对正式集合差异均为 0；TGB 覆盖/主因覆盖 100%、低置信 0、`sourceErrors=[]`，主因库 120，公网 `/health` 为 `ok=true`。

Deployment:
- 已变更生产运行时复盘数据、重折综合主因并更新云端日志；未部署或替换应用代码，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 正式写入回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260721-20260721120836`；raw 证据备份：`C:\PandaDashboard\backups\tgb-hunan-raw-20260721-20260721-193940`。

Notes for next agent:
- 本次 raw 请求 PR `#203`、正式写入请求 PR `#204`、压缩传输修复 PR `#205` 均已合并；2026-07-21 TGB 已完整完成，不要重复覆盖正式文件或重启服务。

## 2026-07-21 - Claude - 四审 P1:终盘封板事实升级(603986 反例)

Changed:
- 实盘反例:兆易创新 603986 盘中 expected、14:08:05 封板,冻结载荷 level 停在 expected,
  三要件闸误判半导体"缺确认明星"。修正:正式门槛必须消费最终涨停事实。
- 新增 strategyMainlineFinalSealedCodes(day)(按日缓存;仅当涨停库 有行+收盘后保存+可靠性
  校验通过 才返回代码集,盘中返回 null 不提前升级)与
  strategyMainlineUpgradeStarsWithFinalSeal(非变异:expected 星在终盘涨停库中 → confirmed,
  confirmedBy=final-limit-up-db,expectedStarHistory 同步升级;共享缓存原对象不改写)。
- 构建层(impl 三要件路径)与返回/冻结层(Restrict,经 getStrategyMainlinesVisible 传入
  finalSealedCodes)都在分闸前先升级;Restrict 改为"正式候选+既有预备卡并集进闸"——
  升级后的预备卡(有龙头)可重回正式榜。
- strategyPredictPersistFinalSealUpgrades:预测档案只做事件轨迹升级(starTransitions 行补
  confirmedAt=涨停库 savedAt/lastLevel=confirmed),绝不改 top/candidates/qiTier/savedAt,
  与"已收盘不写预测"守卫不冲突;幂等。

Files:
- kpl-stats-server.js / tests/strategy-three-requirements.test.js(603986 回归 4 断言+静态 4)

Validated:
- node --check;全仓 52 测试文件全绿。回看 API 此前已正确(sealedSameDay=true),本次补齐
  正式池与前端(经 Restrict)一致性。

Deployment: 未部署;PR #201 待 Codex 复验。

Notes for next agent:
- 盘中行为不变(expected 保持 expected);升级只在终盘可靠涨停库可用后生效。

## 2026-07-21 - Claude - 四审复审两项 P1:空态残留清除 + 持久化挂必经冻结路径

Changed:
- P1-1 Restrict 层新增 clearStaleEmptyState:冻结载荷带旧"暂无正式主线"空态
  (no-confirmed-mainline/no-l2-qualified-mainline/no-net-inflow-mainline/no-qualified-mainline/
  leader-rework-incomplete)而重过滤/终盘升级后正式榜非空时,根层与来源层显式清 reason/message;
  真正仍为空的来源保留原状态不误清。
- P1-2 confirmed 转换持久化挂到必经的盘后冻结返回路径:getStrategyMainlinesVisible 在
  finalSealedCodes 可用时 await strategyPredictPersistFinalSealUpgradesOnce(按日单例,
  成功保持已完成态、失败清缓存重试);持久化改临时文件+rename 原子写,避免并发 GET 同写。
  impl 路径同样改用单例。部署前已冻结的当日快照也能把 starTransitions 升级落盘。
- 文档:strategy-three-requirements.test.js 头注更新(603986 终盘反例推翻"当日正式榜应空")。

Files:
- kpl-stats-server.js / tests/strategy-three-requirements.test.js
  (新增:冻结 reserve 升级重回正式榜+空态清除 4 断言;持久化文件级 4 断言——原子写、
  root+bySource 轨迹升级、top/candidates/qiTier/savedAt 逐字段不变、幂等)

Validated: node --check;全仓 53 个测试文件全绿。

Deployment: 未部署;PR #201 待 Codex 终审。

Notes for next agent:
- 空态清除只针对主线空态语义 reason 集;来源故障状态字段不复用这些值。

## 2026-07-21 - Claude - 终审 P1:两个按日缓存生命周期收口

Changed:
- strategyMainlineFinalSealCache 不再"成功后永久缓存":短 TTL 60s(与 readLimitUpDbDay 读缓存
  同级)+ writeLimitUpDbDay 写入路径显式失效(strategyMainlineFinalSealInvalidate);外部脚本
  直接落盘由 TTL 兜底——收盘后管理员补齐/修正涨停底库能被策略层及时消费。
- strategyPredictPersistFinalSealUpgradesOnce 改纯 in-flight 去重:任务 settle 即删缓存,
  不保留永久成功态;持久化幂等且廉价,后续请求复核捕获同日底库补齐。
- strategyPredictPersistFinalSealUpgrades 返回明确状态:updated/already-current/source-missing;
  预测文件缺失不再被误当成功锁死,恢复后自然重试。

Files:
- kpl-stats-server.js / tests/strategy-three-requirements.test.js
  (5a4 生命周期 4 断言:source-missing 不锁死、文件恢复重试、{A}→{A,B} 补齐继续升级、
  全升级后 already-current 零写盘;静态:TTL+写入路径失效、settle 即删)

Validated: node --check;全仓 53 个测试文件全绿。

Deployment: 未部署;Codex 称修完此项即最终批准。

Notes for next agent:
- 封板集缓存失效点:writeLimitUpDbDay(项目内);外部落盘 60s 内自然过期。

## 2026-07-21 - Codex - PR #201 合并并部署主线题材三要件

Changed:
- 正式合并 PR #201 到 `main`，merge commit `3a3797c`（reviewed head `d87e56f`）。
- 云端旧版三份文件均匹配既有 Git 历史，确认无游离热修后，原子发布
  `kpl-stats-server.js`、`kpl-dashboard_17_apple.html`、
  `Qi/vendor/strategy-workbench.css`。
- 2026-07-21 线上结果：正式主线仅“半导体”，603986 兆易创新由终盘涨停库升级为
  `confirmed`（`confirmedBy=final-limit-up-db`）；“消费电子/显示”为预备主线；
  “大盘成长、基金重仓”按风格板剔除。

Files:
- Production runtime: `kpl-stats-server.js`, `kpl-dashboard_17_apple.html`,
  `Qi/vendor/strategy-workbench.css`。
- Collaboration log: `docs/DAILY_HANDOFF.md`。

Validated:
- 本地：`node --check kpl-stats-server.js`；
  `tests/strategy-three-requirements.test.js`、`tests/mainline-review.test.js`、
  `tests/strategy-workbench-ui.test.js` 全绿。
- 云端：8765 正常监听，`/health` 返回 `ok=true`；主进程 PID `12504 -> 7436`；
  服务错误日志为空。
- 线上 HTML/CSS SHA-256 与 `main` 完全一致；回看确认 2026-07-21 半导体命中实际第一主因，
  兆易创新 expected 轨迹已持久化为 confirmed。

Deployment:
- 已部署到 `C:\PandaDashboard` 并重启主服务。
- 回退备份：`C:\PandaDashboard\backups\pr201-3a3797c-20260721`。
- 两份云端运维日志均已追加本次合并、部署、重启、哈希与业务验收结果。

Notes for next agent:
- 云端未安装 Git，当前仍采用“Git `main` 审核通过后，文件哈希校验 + 备份 + 原子替换”发布。
- 2026-07-21 的既有预测档案保留原预测时点 `top/candidates/qiTier`；仅终盘明星轨迹按设计升级，
  不追溯改写预测内容。

## 2026-07-21 - Codex - 策略页升级为盘中决策工作台视觉层级

Changed:
- 仅重构策略页视觉层，不改主线评分、L2 扫描、明星判定、数据字段、接口与按钮行为。
- 顶部日期、L2 阈值与板块搜索压缩为单行控制台；正式主线、预备主线、板块涨幅/资金、预判分/主线分建立清晰层级。
- 正式明星与预期明星改为结构化证据带，龙头候选改为可扫描排行；预判回看改为分组时间轴，并保留全部原有内容。
- 手机端消除横向溢出，长题材名完整展示；策略页手机顶栏取消滚动吸附，避免遮挡展开后的长卡片。

Files:
- `Qi/vendor/strategy-workbench.css`
- `kpl-dashboard_17_apple.html`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `tests/strategy-workbench-ui.test.js`、`tests/strategy-three-requirements.test.js`、`tests/strategy-two-source-mainlines.test.js`、`tests/star-l2-layers.test.js`、`tests/mainline-review.test.js` 全绿；`git diff --check` 通过。
- 使用公网 2026-07-21 真实策略数据做 Playwright 视觉验收：桌面 1440x1000、手机 390x844、正式主线展开态均无卡片内容溢出；手机 `body.scrollWidth=390` 与视口一致，滚动后顶栏不再遮挡正文。
- 临时验收截图只保存在 `/tmp`，未提交任何生产数据或账号信息。

Deployment:
- 未部署、未重启服务；本次仅静态 HTML/CSS，复核合并后需原子发布两份静态文件，主服务无需重启。

Notes for next agent:
- HTML 已将策略样式缓存版本更新为 `20260721c`；部署时必须同时发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`。

## 2026-07-22 - Codex - PR #208 合并并部署策略页决策工作台 UI

Changed:
- Claude 独立复核 PR #208，确认无阻断项、全仓 53/53 测试文件通过；PR 已合并到 `main`，merge commit `7f4a5b3`。
- 发布前确认云端 HTML/CSS 哈希与合并前 `main`（`ba379b4`）完全一致，没有覆盖线上游离修改。
- 仅原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；策略样式缓存版本现为 `20260721c`。

Files:
- Production runtime: `kpl-dashboard_17_apple.html`, `Qi/vendor/strategy-workbench.css`
- Collaboration log: `docs/DAILY_HANDOFF.md`

Validated:
- 云端与公网 HTML SHA-256：`dc6e3cbd6be270869885f40546bd5acb152514c6f8ecf511fd56e3d1d58b93cf`；CSS SHA-256：`18d62cb8c1a40404ab8fdac817dcec6e2c2a537d598caaabd5b83ecbafde601d`。
- 公网 HTML 已引用 `strategy-workbench.css?v=20260721c`，`https://market.dreamerqi.com/health` 返回 `ok=true`。
- Playwright 使用 2026-07-21 公网真实策略数据复核桌面 1440x1000 与手机 390x844：正式半导体、预备消费电子/显示、明星证据带和龙头排行均正常；手机无横向溢出。

Deployment:
- 已部署到 `C:\PandaDashboard`；未重启主服务、娱乐服务或 Caddy。
- 正式回退备份：`C:\PandaDashboard\backups\pr208-7f4a5b3-20260722-093354`。
- 首次 `File.Replace` 尝试因 Windows 路径 API 不兼容在目标写入前停止，线上哈希未改变；额外有效旧版备份保留于 `C:\PandaDashboard\backups\pr208-7f4a5b3-20260722-093302`，随后改用同目录 `Move-Item -Force` 完成发布。两份云端运维日志均已记录。

Notes for next agent:
- 本次是纯视觉层改造；业务 JS、主线/L2/明星逻辑、后端接口与运行时数据均未改变。

## 2026-07-22 - Codex - 准备强刷当日 TGB 湖南人原始证据

Changed:
- 新增受保护、日期绑定的一次性生产脚本，用于强制刷新 2026-07-22 `@TGB湖南人` 官方原文与原始图片证据。
- 脚本只输出公开文章和原图元数据；明确不调用 OCR、Qwen 或视觉识别，不写正式 TGB 行、不重折综合主因库、不重启服务。
- 若云端已有当天 raw evidence，脚本先备份旧目录；成功后追加两份云端运维日志。

Files:
- `ops/production/requests/2026-07-22-tgb-hunan-raw-evidence.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 北京时间目标日为 2026-07-22（周三）；本地 `main` 与 `origin/main` 一致，任务分支从最新基线建立。
- 脚本固定校验目标日、官方文章域名、标题、manifest 日期/状态和至少一张原图下载成功；脚本保持纯 ASCII。

Deployment:
- 本条提交时尚未运行生产脚本；正式 TGB、综合主因库和服务进程均未改变。

Notes for next agent:
- raw evidence 成功不代表 TGB 完成；只有匹配标题、日期、白底表格和 `@TGB湖南人` 水印的官方原图可进入后续人工双遍转录。

## 2026-07-22 - Codex - 当日 TGB 湖南人复盘已入库

Changed:
- 受保护运行 `29924830883` 写入 2026-07-22 `review/tgb-hunan-structured` 正式 46 行，并强制重折当天综合主因库；脚本在写入前复核人工载荷、官方文章/原图哈希、46 股终盘池及全部质量闸。
- 正式行全部来自 Codex 对 `@TGB湖南人` 官方白底原图的逐题材块、逐行、逐字段人工转录和第二遍人工复核；未使用 OCR、Qwen 或任何自动视觉结果生成、补全、猜测或校验。
- 两份云端运维日志已由脚本追加安全结果；受保护工作流的远端脚本/载荷清理通过，一次性 GitHub `production` 环境 Secret 和本地压缩副本已删除。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端：`kpl-limitup-main-reason-sources/tgb-hunan-structured/2026-07-22.json`、当天综合主因/evidence/quality/auto 与四个正式来源折叠产物、两份运维日志和回退备份

Validated:
- 官方文章 `https://www.tgb.cn/a/2tDNd3zOTPi`（`7.22湖南人涨停复盘+晚间消息汇总`）；采用 `image-01-06.png`，原图 URL `https://image.tgb.cn/img/2026/07/22/sut9bns87hak.png_760w.png`，长度 680572 字节，SHA-256 `7f57aceb616fe744525793b6c2dc97471e3d277b3f69706c8f6504749426c3e8`。
- 正式 46 行、唯一代码 46；`missingCodes=[]`、`extraCodes=[]`、重复 0、`weakCount=0`、名称差异 0；终盘池无 ST、北交所或新股前缀排除行。
- 题材块计数：电力 12、医药 5、半导体 4、算力 4、超节点 3、黄金 3、公告 4、其他热点 4、其他个股 7，合计 46。
- 人工输入 SHA-256 `1015192cf9a2c45b759273ee2041f9e3bd6dde291ef4dc65ba0c1eae4f4c8514`；终盘池 SHA-256 `7d72790c2310b027f27773ddf35cff6e1b9ba9d61e15c79d9d420a0c88af9f0b`；正式 TGB SHA-256 `13eb76eac9b62d2823dedde0d562453a128399c7d689958edbeec834e135c8da`；重折后综合主因 SHA-256 `52e170edba1590b267ce75973c0717eabc3b22bc724b52530ddfebb318b27fe7`。
- 独立公网强刷复核：综合归纳/复盘啦/选股宝/韭研/淘股吧均为 46 行和 46 唯一代码，五个标签相对正式集合差异均为 0；TGB 覆盖/主因覆盖 100%、低置信 0、`sourceErrors=[]`，主因库 46，公网 `/health` 为 `ok=true`。

Deployment:
- 已变更生产运行时复盘数据、重折综合主因并更新云端日志；未部署或替换应用代码，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 正式写入回退备份：`C:\PandaDashboard\backups\tgb-hunan-manual-20260722-20260722133945`；首次 raw 目录不存在，因此 raw 强刷无需生成旧证据备份。

Notes for next agent:
- raw 请求 PR `#210`、正式写入请求 PR `#211` 均已合并；2026-07-22 TGB 已完整完成，不要重复覆盖正式文件或重启服务。

## 2026-07-22 - Codex - 折叠并简化今日 L2 扫描记录

Changed:
- 今日 L2 扫描记录改为默认折叠；折叠摘要直接显示板块数、完成数、处理中数量以及预期/确认明星数量。
- 展开后先显示按板块整理的紧凑扫描摘要；具体板块再次展开才显示个股最大档及五档明细，降低策略页首屏信息密度。
- 明星确认、预期明星继续在总览和板块摘要层高亮；管理员权限、扫描结果、最大档算法与明星判定逻辑均未改变。
- 补齐桌面、平板和手机布局，增加键盘焦点样式与原生 `details/summary` 展开语义。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/star-l2-layers.test.js`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `node tests/strategy-workbench-ui.test.js`、`node tests/star-l2-layers.test.js`、`node tests/qi-mainline-states.test.js`、`node tests/local-l2-persistence.test.js`、`node tests/strategy-backend-permissions.test.js` 全部通过。
- `node --check kpl-stats-server.js`、`node --check strategy-backend.js`、前端内联脚本编译、CSS 花括号检查及 `git diff --check` 通过。
- 当前环境未提供 Product Design 指定的 in-app Browser 控制工具，因此本轮未执行浏览器截图视觉验收；需在复核阶段检查桌面与手机真实管理员态。

Deployment:
- 未部署、未重启服务；合并后仅需原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`，主服务无需重启。

Notes for next agent:
- HTML 已将策略样式缓存版本更新为 `20260722d`；两份静态文件必须同时发布。
- 工作区另有与本任务无关的主页/聊天和服务端未提交改动，本次提交不得包含这些文件。

## 2026-07-22 - Codex - PR #213 云端发布完成

Changed:
- PR `#213` 已由 Claude 复核通过并合并到 `main`，合并提交为 `e0fb041ee485bb11dade8ca926af81ffba317aa4`。
- 仅将本次两份静态资源发布到云端，今日 L2 扫描记录现为默认折叠，并保留两级展开、明星高亮和原有业务逻辑。
- 发布前后均执行 SHA-256 保护校验；两份云端运维日志已追加本次发布记录。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `docs/DAILY_HANDOFF.md`
- 仅云端：`panda-cloud-ops-2026-06-19.md`、`_cloud-change-log-20260705.md`

Validated:
- 发布前云端 HTML/CSS 哈希分别为 `dc6e3cbd6be270869885f40546bd5acb152514c6f8ecf511fd56e3d1d58b93cf`、`18d62cb8c1a40404ab8fdac817dcec6e2c2a537d598caaabd5b83ecbafde601d`，与合并前 `main` 完全一致。
- 发布后云端 HTML/CSS 哈希分别为 `b1a41ff1a1648089fffb61424ef2389a45eabfb1bd6288827d730ab3c39de993`、`75b93713bee02c212c46b7aee9d509d636592bdf90d1106aa24d4808d1eb5f3d`，与合并提交完全一致。
- 公网 `https://market.dreamerqi.com/health` 返回 `ok=true`；行情页实际引用 `strategy-workbench.css?v=20260722d`，公网 CSS 包含 `ml-l2-history-disclosure` 与 `ml-l2-job-summary` 新样式。

Deployment:
- 已部署到 `C:\PandaDashboard`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 正式回退备份：`C:\PandaDashboard\backups\pr213-e0fb041-20260722-223346`。

Notes for next agent:
- Claude 已在 1180/768/390 三种视口完成视觉检查，并确认全仓 53 套测试通过；其非阻断备注是总览按股票去重统计明星，而板块摘要按板块统计，二者合计在跨板块重复股票时可以不同。

## 2026-07-22 - Codex - 瞎聊聊按方案 2 重构并准备高质量真实内容

Changed:
- 瞎聊聊按已确认的方案 2（Orbit Studio）重构为三栏社区：左侧话题与最新帖子、中间当前讨论与完整回复、右侧发帖器与社区规则；手机端改为横向话题栏和单列阅读流。
- 保留原有登录、发帖、图片上传与回复接口；新增有界 `topic` 字段并统一公开接口返回口径。
- 新增 5 篇人工审校的示例帖子、11 条实质回复和 4 张原创配图的一次性幂等生产载荷；作者、回复者和话题均做差异化处理，保留线上既有帖子。

Files:
- `Qi/qi-home.jsx`, `Qi/qi-home.compiled.js`, `Qi/index.html`
- `Qi/assets/chatter-orbit-studio-bg.jpg`, `kpl-stats-server.js`
- `tests/chatter-option2.test.js`, `tests/chatter-production-seed.test.js`, `design-qa.md`
- `ops/production/manifests/chatter-option2-20260722.json`
- `ops/production/requests/2026-07-22-chatter-option2-seed.json`
- `ops/production/requests/2026-07-22-chatter-option2-seed.ps1`

Validated:
- 本地针对性测试 `chatter-option2`、`chatter-production-seed`、`font-woff2-yule-cache` 全绿；`node --check kpl-stats-server.js`、`node Qi/build-home.js` 与定向 `git diff --check` 通过。
- 合并前全仓测试 56/56 文件通过；两条旧测试的首页缓存键断言已同步到本次 `20260722-chatter-option2d` 版本。
- Product Design 视觉复核覆盖 1487×1058 桌面和 390×844 手机：三栏比例、移动端首屏、话题切换、登录弹窗、发帖话题选择均通过；控制台错误 0，最终 QA 无 P0/P1/P2。
- 生产载荷 SHA-256 为 `eed719bfc64f2b1b17939f6e36433d230b3204e8bd201c10b3d1ad6e31a4ae7a`；4 张配图均固定校验哈希，生产脚本执行前备份数据库与图片，失败时回滚。

Deployment:
- 本条提交时尚未部署或写入生产；合并后必须通过 SSH/SCP 将清单文件原子发布到 `C:\\PandaDashboard`，重启 `Panda Dashboard Server`，再运行一次性内容脚本并进行公网验收。

Notes for next agent:
- 线上内容脚本以稳定 seed ID 幂等写入，不删除或覆盖非 seed 的既有帖子；正式验收应看到至少 5 个 seed 帖子、11 条 seed 回复、4 张可访问图片及全部话题字段。

## 2026-07-22 - Codex - PR #215 瞎聊聊方案 2 已部署并写入真实内容

Changed:
- PR `#215` 已合并到 `main`，合并提交为 `4834d3755dfb80aa31ad9907cfe1a507c01638b3`；方案 2 三栏社区、移动端布局、话题字段和背景素材已正式上线。
- 通过受哈希保护的一次性脚本写入 5 篇帖子、11 条回复和 4 张原创配图；线上原有 1 篇帖子完整保留，当前公开总数为 6 篇。
- 应用发布与内容写入均已追加 `panda-cloud-ops-2026-06-19.md` 和 `_cloud-change-log-20260705.md`；全部 SSH/SCP 临时文件已清理。

Validated:
- 发布前 4 个既有目标文件的云端 SHA-256 与合并前 `main` 完全一致，新背景文件不存在；无游离热修复被覆盖。
- 发布后主服务健康检查通过；公网列表返回 6 篇帖子，其中 seed 5 篇、`commentCount` 合计 11、图片 4 张、旧帖 1 篇；5 个详情接口完整返回 11 条回复。
- 4 个公网图片端点均为 200，下载后的 SHA-256 与审核载荷逐一一致。
- 线上 Product Design 复核覆盖桌面三栏和 390×844 手机单列：真实标题、作者、图片、话题切换和完整回复均正常；浏览器控制台错误为 0。

Deployment:
- 已通过 SSH/SCP 发布到 `C:\PandaDashboard`，只重启 `Panda Dashboard Server`；未重启娱乐服务、Caddy 或公司端 L2 worker。
- 应用回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-chatter-option2-4834d37-20260722`。
- 内容回退备份：`C:\PandaDashboard\backups\chatter-option2-seed-20260722-20260722-225536`。

Notes for next agent:
- seed 使用稳定 ID 且脚本幂等；没有明确内容修改需求时不要重复覆盖。后续真实用户发帖与回复继续走现有登录权限接口。

## 2026-07-22 - Codex - 修复瞎聊聊只能显示一篇帖子

Changed:
- 将中间栏从单帖阅读器改为按当前话题连续渲染全部帖子；左侧最新帖子现在定位到对应卡片，不再替换整个内容区。
- 每篇帖子同时展示正文、图片、回复预览和独立回复入口；回复多于列表预览时可展开完整讨论。
- 手机端保留横向话题筛选，并在同一单列页面中向下连续阅读全部帖子。

Files:
- `Qi/qi-home.jsx`, `Qi/qi-home.compiled.js`, `Qi/index.html`
- `tests/chatter-option2.test.js`, `tests/explore-editorial-layout.test.js`, `tests/home-preview-contact.test.js`
- `design-qa.md`, `ops/production/manifests/chatter-all-posts-fix-20260722.json`

Validated:
- `node Qi/build-home.js`、`tests/chatter-option2.test.js`、`tests/home-preview-contact.test.js`、`tests/explore-editorial-layout.test.js`、`node --check kpl-stats-server.js` 与 `git diff --check` 通过。
- 本地真实载荷在同一帖子列表中显示 5/5 篇 seed 帖子；完整回复展开后 11/11 条均可见。
- 浏览器桌面和 390×844 手机验收通过，话题筛选、回复展开正常，控制台错误为 0。
- 合并前全仓 56/56 个测试文件通过。

Deployment:
- 本条提交时尚未部署；合并后只需原子发布三个 `Qi` 静态文件，不需重启任何服务。

## 2026-07-22 - Codex - PR #217 全帖子流修复已部署

Changed:
- PR `#217` 已合并到 `main`，合并提交为 `d97847e8789711b69a76098a4987837ceb3431d4`；瞎聊聊现在按话题连续显示全部帖子，不再只显示当前单帖。
- 首页脚本缓存键更新为 `20260722-chatter-option2e`；云端两份运维日志已记录本次静态发布，SSH/SCP 临时文件已清理。

Validated:
- 发布前云端 `Qi/index.html`、`Qi/qi-home.jsx`、`Qi/qi-home.compiled.js` 哈希与上一版 `main` 完全一致，无游离修改被覆盖。
- 公网 HTML 已引用新缓存键；公网 compiled bundle SHA-256 为 `23ad60b678f470c7a5944f360f56ab1ef980dc832abd37030dd30e336acf6308`，与合并提交完全一致，并包含连续帖子流标记。
- 公网接口返回 6 篇帖子、12 条总回复、5 张总图片；其中既有 seed 仍为 5 篇、11 条回复、4 张图片，旧帖与旧回复完整保留。
- 公网 `/health` 正常；本地真实数据的桌面和手机浏览器验收已确认全部帖子连续展示、完整回复可展开且控制台错误为 0。

Deployment:
- 已通过 SSH/SCP 原子发布 `Qi/index.html`、`Qi/qi-home.jsx`、`Qi/qi-home.compiled.js` 到 `C:\PandaDashboard`。
- 未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-chatter-all-posts-d97847e-20260722`。

## 2026-07-23 - Codex - 收紧重点关注个股 L2 主被动排版

Changed:
- 重点关注卡片展开个股 L2 五档明细后，主动/被动买卖金额改为按内容宽度紧凑排列，不再随卡片宽度被等分列拉开。
- 档位标题后的主动比、被动比从两端对齐改为靠近档位标签排列；同时缩短主被动两行的垂直间距和内边距。
- 桌面仍保持五档双列、手机保持单列；L2 数值、颜色、五档结构、扫描行为和明星判定逻辑均未改变。

Files:
- `kpl-dashboard_17_apple.html`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `tests/strategy-workbench-ui.test.js`、`tests/star-l2-layers.test.js`、`tests/qi-mainline-states.test.js`、`tests/local-l2-persistence.test.js`、`tests/strategy-backend-permissions.test.js` 共 5 个针对性测试通过，`git diff --check` 通过。
- Product Design 同结构前后对照确认：调整前买卖金额被弹性列推到卡片两端，调整后主动/被动金额与比值形成紧凑信息组。
- 1200px 桌面五档双列和 390×844 手机单列均完成截图检查；手机 `body.scrollWidth=390`，卡片 `scrollWidth=clientWidth=360`，无横向溢出。

Deployment:
- 本条提交时尚未部署或重启服务；合并后只需原子发布 `kpl-dashboard_17_apple.html`，无需重启主服务。

Notes for next agent:
- 生产管理员态需要登录才能查看完整个股 L2 明细；发布后应由已登录管理员展开任一重点关注个股，再复核真实长金额和 `∞` 比值的对齐。

## 2026-07-23 - Codex - PR #219 重点关注 L2 紧凑排版已部署

Changed:
- PR `#219` 已合并到 `main`，合并提交为 `92f925e49a6c486cadb219e9284d4796e7bafaf4`。
- 从该精确 `main` 提交提取并原子发布 `kpl-dashboard_17_apple.html`；重点关注个股 L2 的主动/被动金额及比值紧凑排版已上线。
- 两份云端运维日志均已追加本次发布记录。

Validated:
- 发布前云端 HTML SHA-256 为 `b1a41ff1a1648089fffb61424ef2389a45eabfb1bd6288827d730ab3c39de993`，与合并前 `main` 完全一致，没有覆盖游离热修。
- 发布后云端及公网 HTML SHA-256 均为 `11ee80ea8800179def1713d864e27e74173f47f3de7d0d6a32807cce830453d6`，与合并提交完全一致。
- 公网 HTML 包含桌面与手机两处紧凑 `max-content` 排版规则；`https://market.dreamerqi.com/health` 返回 `ok=true`。

Deployment:
- 已部署到 `C:\PandaDashboard`；静态 HTML 发布，无需重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\backups\pr219-92f925e-20260723-113421`。

Notes for next agent:
- 代码、生产 HTML 和云端日志已一致；完整个股 L2 明细仍是管理员态，后续视觉复核需使用已登录账号展开重点关注卡片。

## 2026-07-23 - Codex - 电网概念完成全量 L2 复扫

Changed:
- 通过生产管理员扫描入口对东方财富 `BK1647`（电网概念）重新发起不限制成分股数量的单板块 L2 扫描，任务 `4437d584ad3db093` 已完成。
- 按当前生产口径复算最大可统计档主动买入和三项买卖比：预期明星 `0`、明星确认 `0`、资金活跃 `35`、涨停弱证据 `21`。
- 最接近门槛的是中国西电（`601179`）：最大可统计档主动买入约 `1.471` 亿，三项买卖比 `3/3` 过线，但严格未超过 `1.5` 亿，距门槛约 `293` 万，因此仍不能确认明星。
- 两份云端运维日志已追加本次运行时扫描记录；没有修改生产代码或静态资源。

Files:
- `docs/DAILY_HANDOFF.md`
- 仅云端运行时：`strategy-data/local-l2-jobs/2026-07-23/4437d584ad3db093/`
- 仅云端日志：`panda-cloud-ops-2026-06-19.md`、`_cloud-change-log-20260705.md`

Validated:
- 任务状态 `done`，扫描覆盖 `185/185`；有现价 `185/185`，五档完整 `185/185`。
- 公开资料交叉确认 2026-07-23 电网设备板块涨停潮及中国西电盘中涨停，和本次 L2 行情快照方向一致。
- `https://market.dreamerqi.com/health` 在扫描及日志写入后返回 `ok=true`。

Deployment:
- 仅新增生产运行时扫描结果与运维日志；未部署代码/静态文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- `pickedCount` 是普通 `50` 万档入选数量，不是明星数量；明星结论必须继续按最大可统计档主动买入严格 `>1.5` 亿且三项比值至少 `2/3` 严格 `>1.65` 复算。
- 中国西电当前只是金额门槛的极近缺口；后续若再次扫描，必须以新任务自己的完整五档结果重新判断，不能沿用本次结论。

## 2026-07-23 - Codex - 修复探索页每日推荐长期固定

Changed:
- 探索页“今日值得先看的去处”改为优先真实近期外部线索，并让高质量经典地点按北京时间日期稳定轮换；首页“今日探索推荐”复用同一排序器，不再由历史最高分地点长期霸榜。
- 站内固定地点不再在每次同步时伪造当天发布时间；`freshCount` 只统计本轮首次出现且在新鲜期内的外部地点，中午自动同步强制重新抓取当天来源。
- 每城为真实近期线索预留展示名额，并补充文章标题式下划线、Emoji、泛化“审美积累/咖啡地图”等非地点名称过滤。
- 推荐卡新增“近期新线索”或“今日轮换”标签，明确区分内容来源；首页静态脚本缓存键更新。

Files:
- `kpl-stats-server.js`
- `Qi/index.html`
- `Qi/qi-home.jsx`
- `Qi/qi-home.compiled.js`
- `tests/discovery-daily-refresh.test.js`
- `tests/explore-editorial-layout.test.js`
- `tests/home-preview-contact.test.js`
- `tests/chatter-option2.test.js`
- `ops/production/manifests/discovery-daily-refresh-20260723.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 新增探索每日刷新测试覆盖固定地点不算新鲜、真实外部线索占位、坏标题过滤、相邻日期首推轮换、首页/探索页排序一致及编译产物。
- 探索编辑布局、首页预览/联系和瞎聊聊方案 2 回归测试通过；`node --check kpl-stats-server.js` 与 `git diff --check` 通过。
- 本地真实数据完成 1280×900 桌面和 390×844 手机浏览器验收，卡片标签完整、页面无横向溢出；修复后不再出现文章标题式伪地点。

Deployment:
- 本条提交时尚未部署；合并后需从精确 `main` 部署清单中的 4 个文件，备份发现数据库，重启主服务并强制同步当天探索数据。

Notes for next agent:
- `panda-discovery-db.json` 是本地未跟踪运行时数据，不得提交或覆盖；生产同步完成后应核验固定地点时间字段为空、坏标题消失、`/health` 正常，并用公网真实数据复核桌面和手机页面。

## 2026-07-23 - Codex - 探索每日刷新上线后二次质量收口

Changed:
- 固定地点在数据库读取和合并阶段统一归一为 `freshnessKind=curated` 且清空发布时间，兼容并修复旧库遗留的伪时间字段。
- 追加 `+` 分隔式栏目标题、单独道路名和“特辑/合集/攻略/清单”标题过滤，避免把内容栏目或地址片段冒充具体去处。
- 生产真实数据复核发现“火锅之都”来自文章城市描述而非地点，追加短“××之都”称号过滤。
- 每日自动同步完成日写入发现库；主服务当天重启时读取持久化标记，不会重复执行同一轮外部抓取。

Files:
- `kpl-stats-server.js`
- `tests/discovery-daily-refresh.test.js`
- `ops/production/manifests/discovery-daily-harden-20260723.json`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本条提交时尚未完成合并前全套测试或生产发布；需在合并后只部署后端文件、重启主服务，并核验 9 条旧固定地点伪时间和 3 类伪地点均归零。

## 2026-07-23 - Codex - 探索每日推荐刷新修复已部署

Changed:
- PR `#222`、`#223`、`#224` 已依次合并，最终生产代码提交为 `b0380195d14f38ffc7154dfd89324f48d4192df7`。
- 首次发布首页/探索页每日轮换和真实新线索逻辑，随后根据生产真实数据补齐旧固定地点时间归一、同日自动同步持久化及非地点标题过滤。
- 两份云端运维日志均已追加部署、强制同步和最终数据质量验收记录。

Validated:
- 三个代码 PR 合并前分别完成全套测试，均为 `57/57` 个测试文件通过；`node --check kpl-stats-server.js` 与 `git diff --check` 通过。
- 生产 4 个页面/后端文件 SHA-256 与最终 `main` 完全一致；公网 `/health` 返回 `ok=true`，最终主服务 PID 为 `4760`。
- 2026-07-23 发现库最终生成时间为 `2026-07-23T08:35:17.015Z`，公开显示 186 条可信地点、2 条近期真实线索；固定地点带时间记录 `0`、坏标题 `0`。
- `Pull Tab拉环咖啡` 已归类为无发布时间的编辑精选且不再首推；真实数据复算 2026-07-23 首推 `Soloist Coffee`，2026-07-24 轮换为 `棉花工坊`。
- 最终后端重启读取 `lastAutoSyncDay=2026-07-23` 后未重复抓取，发现库 SHA-256 和修改时间保持不变。

Deployment:
- 从精确合并后的 `main` 通过 SSH/SCP 原子发布；首次部署 4 个文件，后两次只补发 `kpl-stats-server.js`。
- 每次只重启 `Panda Dashboard Server`；未重启娱乐服务、Caddy、Consistency Gate 或公司端 L2 worker。
- 应用回退备份：
  - `C:\PandaDashboard\_deploy-backups\github-ssh-pr222-e676407-20260723-1622`
  - `C:\PandaDashboard\_deploy-backups\github-ssh-pr223-a810789-20260723-1631`
  - `C:\PandaDashboard\_deploy-backups\github-ssh-pr224-b038019-20260723-1645`
- 发现库回退备份：
  - `C:\PandaDashboard\_deploy-backups\pr222-discovery-db-20260723-162158`
  - `C:\PandaDashboard\_deploy-backups\pr223-discovery-db-20260723-163111`

Notes for next agent:
- 本次修复、生产同步、质量闸、云端日志和回退点均已完成；不要再次手动强刷 2026-07-23，下一次正常自动同步应以库内 `lastAutoSyncDay` 为准。

## 2026-07-23 - Codex - 明星两阶段口径与三段式 L2 复扫已部署

Changed:
- PR `#231` 经 Claude 独立复核批准后合并，生产固定使用合并提交 `6355887fbbeda7615714ec59ba37a7c00a8968cb`。
- 四个关联文件作为同一部署包发布：`kpl-stats-server.js`、`local-l2-task-queue.js`、`strategy-backend.js`、`kpl-dashboard_17_apple.html`。
- 云端两份运维日志均已记录本次发布；公司端 worker 代码未替换，新增扫描元数据保持向后兼容。

Validated:
- 部署包 SHA-256 为 `ae2d37c737427e68a55674e227f84bb4185fa8f8429fab0a31ff04ba29f6e1f8`；云端四文件 SHA-256 与合并提交逐一完全一致。
- 部署前完成三个 JavaScript 文件语法检查；重启后云端本机 `/health`、公网 `https://market.dreamerqi.com/health` 均返回 `ok=true`，行情域名主页返回 HTTP 200。
- 新进程 PID 为 `14816`，端口 `8765` 正常监听。

Deployment:
- 已部署生产并仅重启计划任务 `Panda Dashboard Server`；未重启娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\backups\codex-pr231-star-rescan-20260723-225718`。
- 发布失败自动回滚保护已启用，本次未触发回滚。

Notes for next agent:
- 新口径从 2026-07-23 起形成统计分段：预期明星比值门槛为严格 `>1.65`，封板确认门槛为严格 `>2.00`；金额闸为最大档主动买入严格 `>1.5` 亿或最大档被动买入严格 `>2` 亿。
- 三段式自动扫描无单板块每日轮次上限；仍保留全局串行和每 5 分钟最多派发 2 个任务的容量保护。

## 2026-07-23 - Codex - 准备强刷当日 TGB 湖南人原始证据

Changed:
- 新增受保护、日期绑定的一次性生产脚本，用于强制刷新 2026-07-23 `@TGB湖南人` 官方原文与原始图片证据。
- 脚本只输出公开文章和原图元数据；明确不调用 OCR、Qwen 或视觉识别，不写正式 TGB 行、不重折综合主因库、不重启服务。
- 若云端已有当天 raw evidence，脚本先备份旧目录；成功后追加两份云端运维日志。

Files:
- `ops/production/requests/2026-07-23-tgb-hunan-raw-evidence.ps1`
- `docs/DAILY_HANDOFF.md`

Validated:
- 北京时间目标日为 2026-07-23（周四）；任务分支从最新 `origin/main` 建立。
- 脚本固定校验目标日、官方文章域名、标题、manifest 日期/状态和至少一张原图下载成功；脚本保持纯 ASCII。

Deployment:
- 本条提交时尚未运行生产脚本；正式 TGB、综合主因库和服务进程均未改变。

Notes for next agent:
- raw evidence 成功不代表 TGB 完成；只有匹配标题、日期、白底表格和 `@TGB湖南人` 水印的官方原图可进入后续人工双遍转录。
## 2026-07-23 - Codex - Prepare Electric Grid review correction

Changed:
- Added a date-bound, idempotent production request for `2026-07-23` that can add `电网设备` and confirmed star `601179 中国西电` to the persisted review prediction only after the current production diagnosis revalidates every PR #231 amount and ratio gate.
- The request backs up the original prediction record, writes atomically, verifies both source blocks plus the public review response, rolls back on failure, and appends both cloud operation logs.
- The correction is explicitly recorded as a post-close replay of same-day L2 evidence; it preserves the original prediction `savedAt` and `sessionPhase`.

Files:
- `ops/production/requests/2026-07-23-review-grid-star-backfill.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- Public review currently records `2026-07-23` as no mainline, while the complete four-source reason database ranks `电网设备` first with 32 stocks and records `601179 中国西电` as limit-up.
- The production read-only diagnosis captured after PR #231 reports `电网设备` as QI-qualified, `601179` as `confirmed`, maximum-bucket passive buy `441,895,492`, and 2/3 confirmed ratio checks above `2.00`.
- Static and production execution checks are still required before this request is marked deployed.

Deployment:
- Not deployed in this entry. The runtime prediction, frozen snapshot, L2 jobs, services, and cloud logs are unchanged.

Notes for next agent:
- Run only from the exact reviewed commit. Do not hand-edit the prediction JSON and do not treat the correction as an original pre-rule prediction; the script preserves a visible audit trail and rollback point.

## 2026-07-23 - Codex - 电网设备与中国西电预判回看已回填

Changed:
- 已从合并提交 `3946592afa1fbafafa2ec1fde673d8b6a85280ff` 执行日期绑定的一次性修正脚本，将 2026-07-23 预判回看由“今日无主线”修正为 `电网设备`。
- 同日持久化 L2 证据按 PR `#231` 新规则重新校验通过，`601179 中国西电` 记录为“明星确认”；东财与同花顺两个来源块均记录为 `电网设备` 主线。
- 本次只修正 `strategy-data\mainline-predict-2026-07-23.json`；原始盘中冻结快照、L2 任务、主因库、评分代码和服务进程均未改动。

Validated:
- 脚本执行前目标文件 SHA-256 为 `87eadb24f28fc671fed6dc72c4ce1a0ff9c9cedc67735fc0c48cef1b481e2ae4`，执行后为 `5075e5c8bb92f8518d4fccfbbcb95f1db792ababffad77be4f70205073017a4a`。
- 公网 `/api/strategy-mainline-review?days=10` 已验证 2026-07-23 为 `noMainline=false`、主题 `电网设备`、明星 `601179 中国西电` 且 `predictLevel=confirmed`；回看实际第一名同为 `电网设备`（32）。
- 东财与同花顺来源块均为 `status=mainline`、`theme=电网设备`；公网 `/health` 返回 `ok=true`。
- 云端目标文件包含唯一修正审计记录，两份云端运维日志均包含操作编号 `review-grid-star-backfill-20260723`。

Deployment:
- 已通过 SSH 运行合并后的受保护脚本；未部署新服务代码，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\review-grid-star-backfill-20260723-20260723163137`。

Notes for next agent:
- 这是 PR `#231` 收盘后上线后，使用同日既有 L2 证据进行的规则回放修正，不应解释为 15:00 冻结时已经按新规则完成预测。
- 后续不要手工覆盖该日期文件；如需撤销，使用上述备份并同时保留云端审计记录。

## 2026-07-23 - Codex - L2 个股逐档明细 UI 已部署

Changed:
- Claude 已对 PR `#233` 提交正式复核并批准；Codex 独立确认业务逻辑、明星判定、金额闸和比值闸均未改变。
- PR `#233` 已从 Draft 转为 Ready 并合并，合并提交为 `ea0d5400e70ad1d7d94bfcc557fcb7a5ffaa9377`。
- 管理员展开 L2 个股后，五档主动成交、被动成交及三项比值改为分组表格显示；最大档、数据缺失和无大单状态继续保留。

Validated:
- `strategy-workbench-ui.test.js`、`star-l2-layers.test.js` 通过，完整测试共 `59/59` 个测试文件通过；`git diff --check` 通过。
- 公网 `kpl-dashboard_17_apple.html` SHA-256 为 `c5d5d172e2a057263437cfc3416308bb9dde8925e05433ca3924cd50c46a25dc`。
- 公网 `Qi/vendor/strategy-workbench.css` SHA-256 为 `e991e1eaee2933cd17e7e0dbb33806ef5299f40acd83c37d0354d7c7000a7e47`；两者均与精确合并提交一致。
- 公网页面已引用 `/vendor/strategy-workbench.css?v=20260723a`，包含 `.ml-l2-bucket-table` 表格；`/health` 返回 `ok=true`。
- 2026-07-23 预判回看仍为 `电网设备`，`601179 中国西电` 保持“明星确认”。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；静态发布无需重启任何服务。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr233-ea0d540-20260724-073006`。
- 两份云端运维日志均已追加本次部署记录。

Notes for next agent:
- 本次只改变管理员 L2 展开明细的视觉结构；不要据此调整明星股门槛或 L2 统计口径。

## 2026-07-23 - Codex - 优化预判回看横向布局

Changed:
- 将预判回看每个交易日的固定六列占位布局改为自适应的“日期、预判路线、盘后结果”结构；明星状态或结果缺失时不再保留空列。
- 明星、龙头与收益明细改为自动填充列；只有两项时均分可用宽度，多项时按容器宽度自动换行。
- 统计说明改为左对齐的紧凑信息带，桌面端充分利用横向空间；窄屏继续使用单列结果流。
- 更新策略样式缓存版本；未改变预判、命中、明星、龙头或收益统计逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- `git diff --check` 通过。
- `strategy-workbench-ui.test.js` 与 `star-l2-layers.test.js` 通过。
- 全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 本次是纯视觉布局调整；后续复核应重点检查宽屏无右侧占位空洞、窄屏股票名与次高/次收/3日收益不重叠。

## 2026-07-23 - Codex - 预判回看自适应布局已部署

Changed:
- PR `#237` 已合并到 `main`，合并提交为 `660f902e9b665ebd8d6bef37c31c89aef0df0050`。
- 已将自适应预判路线、盘后结果和自动填充明细布局发布到云端；两份云端运维日志均已追加本次静态发布记录。

Validated:
- 发布前线上 HTML/CSS 哈希与上一版已记录的 PR `#233` 生产哈希完全一致，没有游离修改被覆盖。
- 公网 HTML SHA-256 为 `c4ba7f589d8aed92078c64db4a01d60359b10db9b720f7181ee608703cb52bad`。
- 公网 CSS SHA-256 为 `36a39caac5d8ecce46006f86219bd810e920d11198cc0f339d33caeb740aa5d3`。
- 公网页面已引用 `/vendor/strategy-workbench.css?v=20260724a`，`https://market.dreamerqi.com/health` 返回 `ok=true`。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr237-660f902-20260723-172716`。

Notes for next agent:
- 生产代码、Git `main` 与云端运维日志已一致；本次未改变任何策略数据、预测记录或统计口径。

## 2026-07-23 - Codex - 重构预判回看信息层级

Changed:
- 将每个交易日重组为“日期与明星状态、盘中预判对盘后验证、明星与龙头证据”三层，移除同一行内混杂路线、结果、收益与状态的旧布局。
- 东财与同花顺预测改为固定两行来源对照；来源暂缺、无主线、状态未知与主线结果继续保持独立语义。
- 明星、龙头和次高/次收/3日表现改为统一证据带；预备层默认折叠并显示数量，展开后仍保留逐股结果。
- 更新策略样式缓存版本；未改变预判、明星、龙头、命中、收益或任何策略统计口径。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用线上真实 `/api/strategy-mainline-review?days=10` 数据，在 1440x1000 与 390x844 视口完成 Playwright 前后对照。
- 两个视口均无横向溢出；最复杂的 2026-07-22 移动端记录由约 554px 降至 497px，预备层保持默认折叠。
- `git diff --check` 通过；全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 这是纯展示层重构。生产部署应原子发布 HTML 与 CSS，并在覆盖前核对线上文件仍匹配 PR `#237` 已记录哈希。

## 2026-07-23 - Codex - 预判回看时间线重构已部署

Changed:
- PR `#239` 已合并到 `main`，合并提交为 `52c6f19a5107352568dcdfdc9b4aa0edc214eece`。
- 已将新的预判/验证对照、统一证据带、双来源行和默认折叠预备层发布到云端。
- 两份云端运维日志均已追加本次静态发布记录。

Validated:
- 发布前线上 HTML/CSS 与 PR `#237` 已记录哈希完全一致，没有游离修改被覆盖。
- 公网 HTML SHA-256 为 `9ce2526acf571971854ec27c43cb8a834fc9466e7c4b345b825e8fa1e84f2a93`。
- 公网 CSS SHA-256 为 `47b1f7ee5cc8cf7ee0e8f07fec9278c9440cc847d31b5f6dc2a145476579bd4e`。
- 公网页面引用 `/vendor/strategy-workbench.css?v=20260724b`，包含 `.mlr-card-head` 与 `.mlr-compare`；`/health` 返回 `ok=true`，回看接口返回最近 10 个交易日。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr239-52c6f19-20260724-091042`。

Notes for next agent:
- Git `main`、生产静态文件与云端操作日志已一致；本次没有修改任何策略数据或统计口径。

## 2026-07-23 - Codex - 收窄并简化预判回看

Changed:
- 将预判回看限制为最大 `1040px` 并居中，不再随策略页面铺满宽屏。
- 顶部四组统计由独立边框块改为无底色的紧凑摘要；每日记录由独立大卡片改为分组内连续列表。
- 明星状态移除厚重胶囊底色，明星/龙头证据改为两列轻量信息行；移动端保持单列且使用细分隔线。
- 样式缓存版本更新；未改变任何预判、明星、龙头、命中或收益计算。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用线上真实最近 10 个交易日回看数据，在 1440x1000 与 390x844 视口完成 Playwright 前后对照。
- 桌面端回看宽度由 `1377px` 收至 `1040px`；桌面与移动端均无横向溢出、文字重叠或被裁切。
- `git diff --check` 通过；全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 本次是纯视觉减法；部署时应原子发布 HTML 与 CSS，并在覆盖前核对线上仍匹配 PR `#239` 已记录哈希。

## 2026-07-23 - Codex - 部署收窄版预判回看

Changed:
- 合并 PR `#241`，并将收窄、列表化的预判回看静态页面发布到云端。
- 云端两个运维日志均已追加本次部署记录。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- `https://market.dreamerqi.com/health` 返回 `ok=true`。
- 公网页面引用 `/vendor/strategy-workbench.css?v=20260724c`，公网 CSS SHA-256 与 Git 文件一致。
- 公网回看接口返回最近 10 个交易日；Playwright 复验 1440x1000 和 390x844 均无横向溢出、重叠或裁切。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr241-7581ef3-20260724-095010`。
- HTML SHA-256：`c4dcc66be69854d5830d7c0d5ca494e3350ff11c6c18eea5cbfe2d7b57cdd9e1`。
- CSS SHA-256：`5dfebc09b7df5b9c3563922a4aaa65a46f9e1ddc69cd2947d8c7129fe5f9aa1a`。

Notes for next agent:
- Git `main`、云端静态文件与云端操作日志已一致；本次没有修改策略逻辑、数据或服务配置。

## 2026-07-23 - Codex - 统一策略页回看卡片高度与左轴

Changed:
- 桌面端“真主线”并排卡片恢复同一行等高，消除上下边界参差。
- “预判回看”保持 `1040px` 窄内容宽度，但由居中改为左对齐，与今日策略、今日主线榜和重点关注共用同一左轴。
- 手机端继续保持单列；未改变任何策略、明星、龙头、命中或收益逻辑。
- 样式缓存版本更新，并增加左对齐、等高布局回归断言。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用线上真实策略和最近 10 个交易日回看数据完成 1440x1000 全页 Playwright 检查。
- 策略外层、今日主线榜、预判回看和重点关注左边界均为 `32px`。
- 真主线第一行两卡均高 `394px`，第二行两卡均高 `353px`；卡片宽度均为 `516px`。
- 390x844 移动端保持约 `368px` 单列，无横向溢出、重叠或裁切。
- `git diff --check` 通过；全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 本次是纯视觉对齐修复；部署时应原子发布 HTML 与 CSS。

## 2026-07-23 - Codex - 部署策略页回看等高与左对齐

Changed:
- 合并 PR `#245`，并将回看卡片等高和策略页左轴统一样式发布到云端。
- 云端两个运维日志均已追加本次部署记录。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- `https://market.dreamerqi.com/health` 返回 `ok=true`。
- 公网页面引用 `/vendor/strategy-workbench.css?v=20260724e`，公网 CSS SHA-256 与 Git 文件一致。
- 公网真实策略页复验：策略外层、今日主线榜、预判回看和重点关注左边界均为 `32px`。
- 真主线第一行两卡均高 `394px`，第二行两卡均高 `353px`；无横向溢出、重叠或裁切。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr245-9a439c0-20260724-134650`。
- HTML SHA-256：`1fb2ec5068fff5394653accff5ded41719b8653a31400247a5fb3339b1dd0c3c`。
- CSS SHA-256：`5cb5ebde834113d0f3834a11723738e9d0f0e82f78a71c501e1938f28405392d`。

Notes for next agent:
- Git `main`、云端静态文件与云端操作日志已一致；本次没有修改策略逻辑、数据或服务配置。

## 2026-07-23 - Codex - 真主线回看卡片改为半宽

Changed:
- 桌面端“预判回看 > 真主线”由单列满宽改为两列，每张卡片约为原宽度的一半。
- 半宽卡片的盘中预判、盘后验证改为纵向阅读，明星与龙头证据改为单列，避免信息被压缩。
- 卡片按自身内容高度结束；未兑现、待验证、其他交易日和移动端布局保持不变。
- 样式缓存版本更新；未改变预判、明星、龙头、命中或收益逻辑。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用线上真实最近 10 个交易日回看数据，在 1440x1000 与 390x844 视口完成 Playwright 前后对照。
- 桌面端真主线卡片宽度由约 `1038px` 收至 `516px`；移动端维持约 `368px` 单列。
- 桌面与移动端均无横向溢出、文字重叠或裁切。
- `git diff --check` 通过；全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 本次只改变“真主线”分组的桌面布局；部署时应原子发布 HTML 与 CSS。

## 2026-07-23 - Codex - 部署真主线半宽回看卡片

Changed:
- 合并 PR `#243`，并将真主线半宽卡片布局发布到云端。
- 云端两个运维日志均已追加本次部署记录。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- `https://market.dreamerqi.com/health` 返回 `ok=true`。
- 公网页面引用 `/vendor/strategy-workbench.css?v=20260724d`，公网 CSS SHA-256 与 Git 文件一致。
- 公网真实回看数据复验：桌面端真主线卡片约 `516px` 两列，移动端约 `368px` 单列；均无溢出、重叠或裁切。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-ssh-pr243-8912554-20260724-111629`。
- HTML SHA-256：`d401a2e57dbac7e3baac1ebf1e244d83ed3516f222dc367de036ce6ef396da06`。
- CSS SHA-256：`d265086e4d4128b9c70f083efa87a59feb954dcfacbba8aca5797bce983e03d7`。

Notes for next agent:
- Git `main`、云端静态文件与云端操作日志已一致；本次没有修改策略逻辑、数据或服务配置。

## 2026-07-23 - Codex - 深度精修策略工作台视觉层级

Changed:
- 统一策略页的深色工作台视觉：减少嵌套边框和虚线框，重新梳理标题、来源、板块指标、明星证据与回看信息的层级。
- 优化今日主线双来源栏、预备主线卡片、真主线回看、重点关注空状态和 L2 历史容器；保留全部业务状态、交互与现有布局规则。
- 更新策略样式缓存版本；未修改主线筛选、评分、L2 扫描、复盘或数据逻辑。

Files:
- `Qi/vendor/strategy-workbench.css`
- `kpl-dashboard_17_apple.html`
- `tests/strategy-workbench-ui.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 使用同一份线上真实策略数据，在 `1440x1000` 与 `390x844` 视口完成改前/改后截图对照。
- 两个视口的页面宽度均与视口完全一致，无横向溢出；真主线桌面端继续保持两列等高，移动端保持单列。
- `git diff --check`、策略 UI 定向检查和全仓 `59/59` 个 `tests/*.test.js` 文件通过。

Deployment:
- 本条提交时尚未部署生产；未修改云端文件，未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。

Notes for next agent:
- 本次为纯视觉精修；部署时应原子发布 HTML 与 CSS，并使用相同桌面/移动视口复验。

## 2026-07-24 - Codex - 部署策略工作台视觉精修

Changed:
- 合并 PR `#247`，并将策略工作台视觉精修静态文件发布到云端。
- 云端两个运维日志均已追加本次部署记录。

Files:
- `docs/DAILY_HANDOFF.md`

Validated:
- `https://market.dreamerqi.com/health` 返回 `ok=true`。
- 公网页面引用 `/vendor/strategy-workbench.css?v=20260724f`，公网 HTML/CSS SHA-256 与 Git 文件一致。
- 公网真实策略数据复验：`1440x1000` 与 `390x844` 均无横向溢出；桌面真主线两列继续等高，移动端保持单列。

Deployment:
- 已原子发布 `kpl-dashboard_17_apple.html` 与 `Qi/vendor/strategy-workbench.css`；未重启主服务、娱乐服务、Caddy 或公司端 L2 worker。
- 回退备份：`C:\PandaDashboard\_deploy-backups\github-pr247-7e31f72-20260724-142546`。
- HTML SHA-256：`877a65dc9732a664a24777ba9b3a89049e069196ebbf731a6692934994c46669`。
- CSS SHA-256：`586771c691de205f7d31959552aafef714d4b1dd9ac1077f15ac9e61ef301d13`。

Notes for next agent:
- Git `main`、云端静态文件与云端操作日志已一致；本次没有修改策略逻辑、数据或服务配置。

## 2026-07-24 - Local Claude - 策略页 A+C 结构重构（Owner 指定组合）

Changed:
- Owner 在 claude.ai/design「DreamerQi 策略页方向探索」项目中评审三个方向稿后指定 A+C 组合：KPI 带/回看表格/L2 表格用方向 C，主线卡用方向 A。纯展示层重构，所有计算、鉴权与口径不变。
- 顶部新增 KPI 带三瓦片：今日结论（主线榜数据推导）、预判战绩（回看 stats 复述）、今日 L2 扫描（管理员）；各自由既有异步 loader 填充。
- 今日主线榜：双栏改为按题材合并的双源对比卡（`mlx-*`）——结论层（龙头共识+差异标注、明星信号）+ 双源指标对比条；两源完整原卡收进「展开双源完整明细」，仅单源入选的题材标注来源。移除已无调用方的 `renderColumn`。
- 预判回看：分组大卡改为按日期倒序统一表（日期/结果/预判→验证/明星/次高/次收/3日），行左侧强调色承担分组语义；点行展开原完整证据卡（原 DOM 保留在展开层内）。
- 今日 L2 扫描记录：移至页面底部（回看与重点关注之后），默认展开，任务摘要行用 `display: contents` 重排为表格列；数据契约不变。
- 样式缓存版本 `v=20260724f` → `v=20260724h`（跳过 PR #249 的 g）。本分支已并入 #249 的定稿优化（统计胶囊、L2 金额簇、空态便签、字号下限），#249 可关闭。
- 更新 3 个测试文件的 4 条旧结构断言为新契约（双栏三态→合并卡三态、样式计数×2、分组→统一表、L2 默认折叠→默认展开），并新增 KPI/合并卡/回看表格回归断言。

Files:
- `kpl-dashboard_17_apple.html`
- `Qi/vendor/strategy-workbench.css`
- `tests/strategy-workbench-ui.test.js`
- `tests/strategy-two-source-mainlines.test.js`
- `tests/star-l2-layers.test.js`
- `docs/DAILY_HANDOFF.md`

Validated:
- 本地代理预览（生产公开只读 API 真实数据 + 契约形状 L2 仿真数据）Playwright 1440x1000 / 390x844 分区块截图验证：KPI 带、合并卡（含展开态）、回看表格（含展开证据卡）、L2 表格全部正常渲染。
- 桌面整页高度 3689 → 2847（-23%），移动 6952 → 5363；两视口横向溢出均为 0。
- `git diff --check` 通过；全仓 59/59 个 `tests/*.test.js` 通过。

Deployment:
- 未部署生产；未修改云端文件，未重启任何服务。

Notes for next agent:
- 本次触及「今日策略」高风险展示范围，按 Owner 规则**合并前需另一 agent（建议 Codex）独立复核**，重点：① 合并卡在多条正式主线/两源题材不一致日的渲染；② 回看表格在历史单源记录（无 bySource）下的摘要行；③ 管理员确认主线按钮在展开层内仍可用。
- L2 明细验证使用契约仿真数据；部署后需用 panda 账号实测 L2 展开态与 KPI L2 瓦片。
- 部署时原子发布 HTML+CSS；覆盖前核对线上仍匹配 PR #247 哈希（html=877a65dc…4669 / css=586771c6…13）。
