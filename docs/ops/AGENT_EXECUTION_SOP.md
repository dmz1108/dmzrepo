# Agent Execution SOP

This SOP applies to Home Codex, Company Codex, Claude, and any temporary worker operating on DreamerQi / PandaDashboard.

Its purpose is to prevent three recurring failures: working from an old baseline, loading large files through slow APIs, and appearing frozen during long commands or delegated work.

## Start Every Task

1. Confirm the repository and current branch with `git status --short --branch`.
2. Run normal `git fetch origin` and compare the branch with `origin/main`.
3. Read `CLAUDE.md`, the latest relevant `docs/DAILY_HANDOFF.md` entries, and the task-specific runbook.
4. Check for user or agent changes already present. Never discard or overwrite unrelated work.
5. State the intended files, production impact, and validation scope before editing.

## Large Files And Remote Reads

Do not use the GitHub Contents API for large files such as `kpl-stats-server.js`, large HTML pages, generated bundles, or evidence JSON. It base64-encodes content, adds avoidable latency, and has repeatedly caused multi-minute stalls.

Use this order:

1. Normal Git: `git fetch`, `git show`, `git diff`, or a local worktree.
2. `rg` to locate the exact symbol or text, then `sed`/`git show` only for the required line range.
3. SSH/SCP when the deployed cloud file or runtime state is the fact being checked.
4. A Git blob read only as an emergency, read-only fallback when normal Git is unavailable.

Also avoid printing an entire large API response. Filter it with `jq` or a small structured reader and retain only fields needed for the decision.

## Work In Small Observable Stages

- Separate discovery, edit, focused validation, full validation, review, deployment, and logging.
- Send a short progress update at every meaningful stage and at least every few minutes during a long operation.
- Before editing, explain the exact change being made.
- If OCR, network access, a child task, or a command has no visible progress for about two minutes, inspect it. Cancel or take the work back instead of waiting silently.
- Never leave a necessary command session running when ending a turn.

## Editing And Tests

- Use `apply_patch` for manual edits.
- Use existing project helpers and patterns; avoid unrelated rewrites.
- During development, run only the tests that exercise the changed behavior.
- Before merge, run the full relevant suite once.
- Redirect verbose full-suite output to an ignored file under `/tmp` or the platform temp directory. Show only the pass count, elapsed time, or failure tail.
- Run `git diff --check` and review the final diff before committing.

## Production And Evidence

- Git `main` is the approved code baseline; cloud runtime data is not Git data.
- A production question must be answered with production-shaped evidence, not guessed from a sanitized repository.
- Back up cloud files before replacement, deploy only reviewed `main`, restart only the necessary service, and verify health plus affected behavior.
- Record code work in `docs/DAILY_HANDOFF.md`. Record production state changes in the cloud operation logs as well.
- Never print or commit secrets, private keys, cookies, user records, raw databases, or captured evidence bundles.

## Recovery From A Stalled Task

1. Identify the last completed command or stage.
2. Check whether a process is still running instead of blindly restarting it.
3. Preserve any completed output and partial files that are valid.
4. Resume from the smallest unfinished unit.
5. Report the reason for the stall and the recovery action.
6. If the stall revealed a reusable lesson, update this SOP or the relevant task runbook.

## Finish Checklist

- Latest `main` was considered.
- Only intended files changed.
- Focused and full relevant checks passed, or failures are stated.
- Production deployment and restart status are explicit.
- Git and cloud logs are updated where applicable.
- The next agent can continue without rereading a long chat transcript.
