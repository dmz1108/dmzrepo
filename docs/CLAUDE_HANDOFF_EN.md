# Claude Handoff: DreamerQi / PandaDashboard

## Project Summary

DreamerQi is a personal website with multiple public areas and a deeper private/admin market analysis system.

The main areas are:

- Home: brand landing page and section previews.
- Market: real-time market board, limit-up review, strategy analysis, and admin-linked data tools.
- Entertainment: lighter interest/community content.
- Explore: discovery-oriented content.
- Admin: configuration, user management, sync, data-source health, mail settings, and operational controls.

The project currently runs on a Windows cloud server under `C:\PandaDashboard`. This GitHub package is a sanitized seed, not the full production directory.

## Production URLs

- Home: `https://dreamerqi.com/`
- Market: `https://market.dreamerqi.com/kpl`
- Admin: `https://market.dreamerqi.com/admin`
- Entertainment: `https://stanning.dreamerqi.com`
- Explore: `https://explore.dreamerqi.com`

## Important Files

- `kpl-stats-server.js`: main backend, API routes, auth, sync, market data, admin APIs, static serving.
- `kpl-dashboard_17_apple.html`: main market dashboard UI.
- `panda-admin.html`: admin panel UI.
- `Qi/index.html`: home page container.
- `Qi/qi-home.jsx`: source of truth for the home page UI.
- `Qi/build-home.js`: builds the home React source into compiled JS.
- `Qi/qi-home.compiled.js`: generated home bundle.
- `yule.html`, `yule-admin.html`, `yule-server.js`: entertainment area.
- `Caddyfile`: domain and reverse-proxy configuration.
- `docs/DAILY_HANDOFF.md`: GitHub-side daily handoff log for Codex, Claude, and future collaborators.
- `docs/COLLABORATION_WORKFLOW.md`: required reading — every new agent must read the three-agent Git collaboration workflow before starting its first task.

## Homepage Status

Recent homepage decisions:

- The top hero chip `DreamerQi · 行情 / 娱乐 / 探索` was removed.
- The three small hero cards below the hero were removed.
- The preview-image showcase was restored and should remain.
- The `瞎聊聊` preview image was changed to `Qi/assets/chatter-cute-preview.png`.
- The `瞎聊聊` page was redesigned as a post-style community board.
- The chat page should preserve existing post, image upload/display, and comment behavior.

For home page edits:

1. Edit `Qi/qi-home.jsx`.
2. Run `node Qi/build-home.js`.
3. Confirm `Qi/qi-home.compiled.js` changes.
4. Update the script cache version in `Qi/index.html` if needed.

## Market Product Logic

The user’s intended market workflow has three layers:

1. `今日实时`: intraday observation of strong sectors.
2. `涨停复盘`: underlying multi-source limit-up reason database.
3. `今日策略`: the most important analysis layer. It should combine today’s sector strength, capital flow, constituent limit-up behavior, and historical limit-up reason data to infer the most likely active themes.

The user does not want `今日策略` to simply repeat after-market review results. After-market four-source summaries are useful as historical evidence, but intraday strategy needs current sector movement and capital data.

## Limit-Up Reason Database Direction

The user cares deeply about the quality of the limit-up reason database. The desired model is:

- Keep each source’s underlying database faithful to the original source.
- Do not over-normalize source-level data too early.
- Perform deeper merging, grouping, and final reasoning in the comprehensive summary layer.
- If multiple sources do not agree on a stock’s main reason or detailed reason, the stock can be placed into an `Other` card instead of forcing a manually invented reason.

Sources discussed or used include:

- 同花顺
- 韭研
- 复盘啦 / 开盘啦
- 淘股吧湖南人 manual upload
- Eastmoney was removed or deprioritized in parts of the review UI due to data quality concerns.

## Auth And Permissions

The system has login, registration, password reset, admin panel, and user permissions.

Important behavior:

- Registration requires phone and email.
- Passwords must be at least 8 characters and cannot be only letters or only numbers.
- Email verification is required for registration.
- Forgot password should email a verification code when SMTP is configured.
- Normal users should only have view permissions and should not see admin delete/restore controls.

Do not hardcode SMTP credentials, passwords, API keys, or tokens. They belong in server-side config managed through the admin panel or production-only files.

## Sync And Deployment Notes

The user works across home/cloud/company machines. Cloud acts as the middle host.

Important distinction:

- Frontend/database sync is not the same as backend program/code sync.
- Runtime cloud-only config should not be overwritten by normal frontend/database sync.
- Production secrets and runtime config should stay out of GitHub.

If code is changed in GitHub, deployment still needs a deliberate cloud update step.

## Daily Handoff Workflow

GitHub is the shared code collaboration space. Production runtime state stays on the cloud server.

After every meaningful code or documentation task, append an entry to:

`docs/DAILY_HANDOFF.md`

Each entry should include:

- what changed,
- which files changed,
- what was validated,
- deployment status,
- whether the cloud server was touched or restarted,
- notes for the next agent.

If a task changes actual production runtime state, also update the cloud operation logs on the server:

- `C:\PandaDashboard\panda-cloud-ops-2026-06-19.md`
- `C:\PandaDashboard\_cloud-change-log-20260705.md`

Never put secrets, tokens, cookies, SMTP credentials, private keys, user databases, or runtime-only data into GitHub handoff notes.

## Excluded From This GitHub Package

This package intentionally excludes:

- user account database,
- login sessions,
- sync config,
- SMTP config,
- source cookies and login state,
- market runtime databases,
- logs,
- backups,
- exports,
- `node_modules`,
- large tools/binary runtime directory.

If sample data is needed later, create tiny sanitized fixtures instead of copying production data.

## Suggested First Response From Claude

Before editing, Claude should say:

- which files it read,
- what the project structure is,
- which area it plans to change,
- which files it will edit,
- whether any production-only config or missing runtime data blocks local verification.

Then Claude can proceed with a small, scoped change.
