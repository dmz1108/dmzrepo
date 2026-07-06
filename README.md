# DreamerQi / PandaDashboard

This is a clean GitHub seed package for the DreamerQi website and PandaDashboard market system. It is intended to help Claude or another collaborator understand the project without exposing the production cloud server state.

This package is not a full copy of `C:\PandaDashboard`. It intentionally excludes user accounts, sessions, cookies, SMTP credentials, sync tokens, runtime market databases, logs, backups, downloaded tools, and binary runtimes.

## Main Entry Points

- Home page: `Qi/index.html`
- Home source: `Qi/qi-home.jsx`
- Home build script: `Qi/build-home.js`
- Home compiled output: `Qi/qi-home.compiled.js`
- Market dashboard: `kpl-dashboard_17_apple.html`
- Admin panel: `panda-admin.html`
- Main backend: `kpl-stats-server.js`
- Entertainment backend: `yule-server.js`
- Reverse proxy config: `Caddyfile`

## Public URLs

- Home: `https://dreamerqi.com/`
- Market: `https://market.dreamerqi.com/kpl`
- Admin: `https://market.dreamerqi.com/admin`
- Entertainment: `https://stanning.dreamerqi.com`
- Explore: `https://explore.dreamerqi.com`

## Local Run

```powershell
cd C:\PandaDashboard
npm install
node .\kpl-stats-server.js
```

Then open:

- `http://127.0.0.1:8765/`
- `http://127.0.0.1:8765/kpl`
- `http://127.0.0.1:8765/admin`

## Home Page Workflow

Do not edit `Qi/qi-home.compiled.js` directly as the source of truth.

1. Edit `Qi/qi-home.jsx`.
2. Run `node Qi/build-home.js`.
3. Confirm `Qi/qi-home.compiled.js` was regenerated.
4. If needed, update the script cache version in `Qi/index.html`.

## First Step For Claude

Read `CLAUDE.md` first, then read:

- `docs/CLAUDE_HANDOFF_EN.md`
- `docs/PROJECT_MAP.md`
- `docs/SANITIZATION.md`
- `docs/PROJECT_HANDOFF.sanitized.md`
- `docs/panda-cloud-ops-2026-06-19.sanitized.md`
- `docs/cloud-change-log-20260705.sanitized.md`

Before editing, summarize the project structure, the current homepage state, the market/admin responsibilities, and the exact files you plan to change.
