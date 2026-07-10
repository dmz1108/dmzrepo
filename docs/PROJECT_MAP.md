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
- `local-l2-task-queue.js`: cloud queue and persistence contract for the company-side L2 worker.
- `docs/strategy/L2_COMPANY_WORKER_UPGRADE_SPEC.md`: company worker five-bucket implementation and acceptance baseline.
- `tools/validate-l2-worker-output.js`: secret-free validator for worker claim/result samples.
- `tests/l2-worker-contract.test.js`: aggregation, five-bucket, priority-order, and cloud-queue contract regression.
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
