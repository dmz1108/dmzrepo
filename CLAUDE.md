# CLAUDE.md

You are joining the DreamerQi / PandaDashboard project. Start by understanding the system before making changes.

## Read First

1. Read `README.md`.
2. Read `docs/CLAUDE_HANDOFF_EN.md`.
3. Read `docs/DAILY_HANDOFF.md`.
4. Read `docs/COLLABORATION_WORKFLOW.md`.
5. Read `docs/ops/AGENT_EXECUTION_SOP.md`.
6. Read `docs/strategy/AI_DISCUSSION_GROUP.md`.
7. Read `docs/PROJECT_MAP.md` and `docs/SANITIZATION.md`.
8. Read the task-specific runbook before acting:
   - market data or strategy evidence: `docs/AI_PRODUCTION_READ.md`
   - TGB 湖南人 daily review: `docs/ops/TGB_HUNAN_DAILY_SOP.md`
   - L2 worker, queue, buckets, or star-stock scan: `docs/ops/L2_WORKER_RUNBOOK.md`
   - sector gain, capital flow, DDE, or source mapping: `docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md`
   - review source health, source counts, or daily backfill: `docs/ops/REVIEW_SOURCE_HEALTH_SOP.md`
9. Optionally read the sanitized operation notes:
   - `docs/PROJECT_HANDOFF.sanitized.md`
   - `docs/panda-cloud-ops-2026-06-19.sanitized.md`
   - `docs/cloud-change-log-20260705.sanitized.md`

Then respond with a short summary of:

- the main pages and services,
- the entry files,
- the recent homepage changes,
- the market/admin risk areas,
- the latest relevant notes in `docs/DAILY_HANDOFF.md`,
- the task-specific runbook that applies,
- whether the current task needs the AI discussion group protocol,
- the files you intend to edit.

## Hard Rules

- Do not commit API keys, cookies, SMTP passwords, sync tokens, admin passwords, private keys, user data, sessions, market databases, logs, backups, or production config files.
- Do not use the GitHub Contents API to fetch large project files. Follow `docs/ops/AGENT_EXECUTION_SOP.md` for normal Git, precise reads, compact test output, progress updates, and timeout recovery.
- Do not copy the raw cloud server directory into GitHub.
- For strategy attribution, leader scoring, star-stock, or historical repair work, capture and replay a filtered production evidence case before changing code. Synthetic tests alone are insufficient.
- Never put the AI read-only token or captured evidence JSON in Git. Record only safe request parameters, evidence hashes, completeness, and conclusions.
- TGB 湖南人复盘只允许官方原图人工逐行转录；禁止使用 Qwen、OCR 或其他自动视觉结果生成、补全或校验正式行。自动流程最多保存原文和图片证据。
- Do not perform a broad rewrite of the frontend structure. Work inside the current files and patterns unless the user explicitly asks for a structural rebuild.
- For homepage work, edit `Qi/qi-home.jsx`, then run `node Qi/build-home.js`.
- Do not maintain `Qi/qi-home.compiled.js` manually.
- Do not restore the removed hero chip `DreamerQi · 行情 / 娱乐 / 探索`.
- Do not restore the removed three small hero cards.
- Keep the preview-image showcase section. In code this is currently `SpbShowcase`.
- `SpbPillars` may remain as an unused function, but should not be rendered unless the user asks to bring that section back.

## Current Homepage State

Recent homepage work:

- The redundant hero chip was removed.
- The three small hero cards were removed.
- The preview-image showcase was restored and should remain.
- The `瞎聊聊` page was redesigned into a lightweight post-board/community-feed style.
- The chat preview image is `Qi/assets/chatter-cute-preview.png`.
- The chat page should preserve existing post, image, and comment logic.

## Market System Context

The market page is not just a static dashboard. It has three connected layers:

- `今日实时`: observes intraday strong sectors and market strength.
- `涨停复盘`: stores the underlying multi-source limit-up reason database.
- `今日策略`: combines intraday sector strength, capital flow, limit-up constituents, and historical reason databases to infer today’s likely main themes.

Do not treat after-market review data as the only source for intraday strategy. The intraday strategy should use real-time sector strength, capital flow, constituent limit-up behavior, and historical reasons together.

## Before Sending Changes

Check at least:

- home still opens,
- market page still opens,
- admin page still opens,
- login/register/forgot-password behavior is not broken,
- normal users do not get admin-only controls,
- no secret-like runtime files are added.

Review `docs/SECRET_SCAN_REVIEW_REQUIRED.txt`. Most hits are expected code field names such as `token`, `password`, or `cookie`, but review before making the repository public.

## Handoff Requirement

After every meaningful task, append a concise entry to `docs/DAILY_HANDOFF.md` with:

- what changed,
- which files changed,
- what was validated,
- whether anything was deployed to production,
- whether any service was restarted,
- what the next agent should know.

If production runtime state changes, also update the cloud operation log on the server. Do not put secrets or runtime-only values in GitHub.
