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
