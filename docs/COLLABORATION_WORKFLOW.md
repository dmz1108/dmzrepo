# Three-Agent Git Collaboration Workflow

This project is developed by three AI agents plus the owner:

1. **Home Codex** — branches like `codex/...`
2. **Company Codex** — branches like `company/...`
3. **Claude** — branches like `claude/...`

GitHub is the source of truth for **code and documentation**, but **not** for production runtime data or secrets.

## Core Rules

- Everyone starts from latest `main`.
- Everyone works on their own branch.
- Nobody directly overwrites production cloud files from an old local copy.
- After changes are reviewed/confirmed, merge or fast-forward into `main`.
- The production cloud server deploys only from confirmed `main`, unless it is an emergency hotfix.

## Before Starting Any Task

- Pull/fetch latest `main`.
- Read:
  - `CLAUDE.md`
  - `docs/CLAUDE_HANDOFF_EN.md`
  - `docs/DAILY_HANDOFF.md` (latest entries)
  - `docs/strategy/AI_DISCUSSION_GROUP.md`
- If the task depends on production state, check or ask for the latest cloud operation log summary.
- For market-data or strategy tasks, read `docs/AI_PRODUCTION_READ.md` and capture a filtered production evidence case before forming a final diagnosis.
- Read the matching operational runbook under `docs/ops/` before TGB, L2, market-source, or review-health work.

## Execution Discipline

- Follow `docs/ops/AGENT_EXECUTION_SOP.md` in every environment.
- Do not fetch large files through the GitHub Contents API. Use normal Git first; use SSH/SCP for the deployed cloud copy when production state is the question.
- Locate symbols with `rg`, then read only the required line ranges. Do not repeatedly load all of `kpl-stats-server.js` or a large HTML file.
- During development, run focused tests. Run the full relevant suite before merge and keep verbose output in an ignored temporary log; report only the summary or failure tail.
- A long command, OCR pass, or sub-agent task must not make the user-facing task appear frozen. Report the current stage, and take back control when a delegated step stops making progress.

## Shared Production Evidence

- Agents should have functionally equivalent read access through the AI evidence interface, not equivalent production write access.
- Strategy PRs must cite the same evidence request parameters and bundle SHA-256 used during analysis.
- The author and reviewer should independently verify the same bundle or recapture with identical parameters.
- Passing synthetic tests without production-shaped evidence is not enough for strategy attribution, leader ranking, star-stock, or historical repair changes.
- Captured evidence files remain under ignored runtime paths such as `tmp/strategy-cases/` and must never be committed.

## AI Discussion Group

For high-impact product or strategy work, especially `今日策略` and `今日主线榜`, use the AI discussion group protocol before implementation:

- Read `docs/strategy/AI_DISCUSSION_GROUP.md`.
- Open or update a discussion thread in GitHub Issues or `docs/strategy/discussions/`.
- Each available agent writes an independent view on the same owner question.
- Agents challenge each other's reasoning and revise their views.
- The owner approves the shared decision before major code changes.

This is not a task split. Do not treat it as "Claude designs, Codex verifies". Each agent should reason about the strategy itself, challenge assumptions, and help converge on the best decision.

## Branch Rules

- Claude uses `claude/...` branches; Home Codex uses `codex/...`; Company Codex uses `company/...`.
- Do not force push shared branches.
- Do not delete another agent's branch without confirmation.
- If two agents edit the same large file — especially `kpl-stats-server.js` — compare diffs carefully before merging.
- A merged pull request is finished. Follow-up work restarts from latest `main` on a fresh or reset branch; never stack new commits on already-merged history.
- Each agent commits under its own identity and never rewrites another agent's commits — no `--reset-author`, amend, or rebase on shared/merged history, even if GitHub shows those commits as "Unverified". An Unverified badge only means the authoring agent has no signature or GitHub-verified email; fix it at the source agent (configure commit signing or a verified email), never by rewriting history downstream.

## After Every Meaningful Task

Append a concise entry to `docs/DAILY_HANDOFF.md` (format defined at the top of that file) including:

- what changed,
- files changed,
- validation performed,
- whether production was touched,
- whether any service was restarted,
- notes for the next agent.

Never put secrets, tokens, cookies, SMTP passwords, private keys, user data, or runtime database contents in Git.

## Production Cloud Rules

- Cloud server runtime logs are separate from Git.
- If production is changed, restarted, manually synced, or manually patched, update the cloud logs on the server:
  - `C:\PandaDashboard\panda-cloud-ops-2026-06-19.md`
  - `C:\PandaDashboard\_cloud-change-log-20260705.md`
- Git handoff records code collaboration; cloud logs record real production actions.
- Claude and other non-SSH environments use the owner-approved GitHub `production` workflow described in `docs/ops/CLAUDE_PRODUCTION_ACCESS.md`. The encrypted SSH key stays in the GitHub environment and is never printed or copied into an AI chat.

## Deployment Checklist

Before deploying to cloud:

1. Back up the production files that will change.
2. Run syntax/basic checks (`node --check`, page compile, etc.).
3. Deploy only the intended files.
4. Restart only the necessary service (static-file-only changes need no restart).
5. Verify health, pages, and APIs.
6. Record the deployment in both the cloud logs and the Git handoff.

## Never Commit

- API keys
- sync tokens
- SMTP credentials
- cookies
- SSH keys
- user databases
- runtime data files
- cloud-only config files
- generated market/review data, unless explicitly sanitized and intended as docs

## Emergency Hotfix on Cloud

If a hotfix is made directly on the cloud server:

1. Back up first.
2. Record in cloud logs immediately.
3. Bring the exact code change back into Git as soon as possible.

Otherwise Git and cloud will drift, and another agent may accidentally overwrite the fix.

## Current Expectation

- `main` represents the latest approved code baseline.
- Cloud production is kept close to `main`; runtime data and secrets stay cloud-only.
- When unsure whether something is code or runtime data, **ask before committing**.

## Operational Runbooks

- `docs/ops/TGB_HUNAN_DAILY_SOP.md`
- `docs/ops/L2_WORKER_RUNBOOK.md`
- `docs/ops/MARKET_DATA_SOURCE_CONTRACTS.md`
- `docs/ops/REVIEW_SOURCE_HEALTH_SOP.md`
