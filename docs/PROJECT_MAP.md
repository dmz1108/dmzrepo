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
- `strategy-evidence.js`: pure filtering, sanitization, hashing, and offline audit helpers for AI strategy evidence bundles.
- `l2-focus-scanner.js`: Level2 / active-passive scan support.
- `consistency-gate.js`: data consistency helper.
- `tools/capture-strategy-case.js`: downloads a token-protected, stock-filtered production evidence case into ignored `tmp/` storage.
- `tools/replay-strategy-case.js`: verifies and audits a captured evidence case without production access.
- `docs/AI_PRODUCTION_READ.md`: required evidence workflow for Codex, Company Codex, and Claude.

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

### Operations And Data Contracts

- `docs/ops/AGENT_EXECUTION_SOP.md`: efficient, non-stalling agent execution rules.
- `docs/ops/TGB_HUNAN_DAILY_SOP.md`: official-image TGB Hunan daily review workflow.
- `docs/ops/L2_WORKER_RUNBOOK.md`: cloud queue, company worker, five-bucket result contract, and star-stock validation.
- `docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md`: Eastmoney, THS, and KPL sector-data semantics and aggregation boundaries.
- `docs/ops/REVIEW_SOURCE_HEALTH_SOP.md`: four-source review health, count reconciliation, and daily repair rules.

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
