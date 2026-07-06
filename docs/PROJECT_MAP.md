# Project Map

## Production Layout

The production cloud server usually runs from:

`C:\PandaDashboard`

This GitHub seed is a sanitized code package exported from that layout. It is not a full production mirror.

## Main Areas

### Home

- `Qi/index.html`: home page HTML container.
- `Qi/qi-home.jsx`: home page source of truth.
- `Qi/qi-home.compiled.js`: generated home page bundle.
- `Qi/build-home.js`: build script for the home page.
- `Qi/assets/`: public homepage assets.
- `Qi/games/`: small public game pages.

### Market

- `kpl-dashboard_17_apple.html`: main market dashboard UI.
- `kpl-dashboard_17_apple_hierarchy.html`: related market hierarchy view.
- `kpl-stats-server.js`: main backend and API entry.
- `strategy-backend.js`: strategy analysis support.
- `l2-focus-scanner.js`: Level2 / active-passive scan support.
- `qmt-order-stats.js`: QMT order statistics support.
- `consistency-gate.js`: data consistency helper.

### Admin

- `panda-admin.html`: admin panel UI for users, config, sync, source health, mail setup, and operations.

### Entertainment

- `yule.html`: entertainment public page.
- `yule-admin.html`: entertainment admin page.
- `yule-server.js`: entertainment backend.

### Infrastructure

- `Caddyfile`: reverse proxy and domain configuration.
- `package.json`: Node package metadata.
- `package-lock.json`: locked dependency graph.
- `site.webmanifest`, `favicon.ico`: site metadata and icon.

## Runtime State Not Included

The production server contains runtime state that must not be committed:

- user accounts and login sessions,
- admin/sync/mail config,
- source cookies and login state,
- market history databases,
- generated snapshots,
- logs and backups,
- `node_modules`,
- large runtime tools and downloaded binaries.

Use sanitized fixtures if test data is needed later.
