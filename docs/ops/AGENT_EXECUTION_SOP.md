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

## Independent Review Discipline

Lessons captured from the PR #284 three-party review (2026-07-26). These bind any agent
performing an independent review in this repository.

- **Matrix verification before any pass verdict.** When a review boundary names a class
  ("TGB/manual sources", "all generators"), first enumerate the full matrix of
  asset-class × file-state (healthy / corrupt / wrong-day / unmarked) × write-path,
  mark every cell as *tested*, *inferred*, or *not covered*, and attach the matrix to the
  verdict. A single tested corner never justifies a whole-boundary ✅. (Origin: a corrupt
  non-TGB manual artifact was overwritable; the reviewer had tested only the TGB corner.)
  For deletion changes the matrix has a second question: not only "is everything removed
  safe to remove" but "is the removal complete". The strongest known check is an
  **orphan-set diff**: compute the set of defined-but-never-called functions on the base
  and on the branch, then compare — orphans eliminated show what the deletion cleaned up,
  orphans created show what it left behind. This catches both same-class remnants
  (a sibling subtree never touched) and newly stranded helpers (a survivor whose only
  caller was deleted); a back-scan of deleted symbols alone catches neither. (Origin:
  PR #286 deleted the Qwen vision subtree but left a same-class WinRT OCR subtree, and
  the WinRT removal in turn stranded a helper — the first surfaced only through a full
  reference sweep, the second only through the orphan-set diff.)
- **Fail-safe is the default for unidentifiable files.** A file that is corrupt, unmarked,
  or of unknown origin must be treated as the highest-value asset class it could be —
  reject writes first, ask later. "It was backed up" does not make overwriting acceptable:
  manual transcription work is not regenerable. (Origin: same finding.)
- **No platform-semantics claims from memory.** Statements about Windows rename, file
  locking, timezones, or similar must cite the actual call chain (e.g. Node → libuv
  `MoveFileExW(MOVEFILE_REPLACE_EXISTING)`) or be stated as conditional with a minimal
  production smoke test attached. Never grade a design "safe" on recalled platform
  behavior. (Origin: a redundant rename-away step was endorsed as "Windows-safe" and had
  actually introduced a crash window.)
- **Worst-case composition before severity grading.** For every behavioral change found,
  answer "what is the worst legitimate system state this composes with" before assigning
  severity. A fact filed as a wording nit by one reviewer was correctly graded red by
  another via exactly this step. (Origin: strict artifact validity silently blocking a
  whole day's combined rebuild when composed with a protected wrong-day source.)
- **Adversarial cases become repository tests.** Any case that demonstrated a defect
  during review must be committed under `tests/` by the fixing party as a regression
  lock. Reviewer-side adversarial scripts die with the session; tests do not.
- **Second-round reviewers replay the other reviewer's first-round cases** and confirm
  reproduction or state the difference. (Origin: a fixture-shape mistake in an adversarial
  case silently short-circuited the protection logic under test — the wrong payload shape
  hit an earlier gate, so the assertion passed without exercising what it claimed to.
  The author caught it in their own pre-publication re-check; replay exists so that
  single-party self-checking is never the only line of defense.)
- **Deferral and non-applicability claims are verified, not accepted.** When the authoring
  party marks an item as out of scope, unreachable, or deferred ("tests prove there is no
  caller", "dead code, separate P2"), the reviewer independently confirms the claim —
  call-graph search, reference sweep, test-coverage inspection — and states the evidence.
  A cited regression test must itself be read: confirm it covers every symbol claimed, not
  just one representative. (Origin: a PR #284 deferral cited "existing tests prove no
  production caller"; independent inspection showed the test locked only one of the two
  builders, and the follow-up deletion PR #286 was found to have left a third uncovered
  dead subtree of the same class.)

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
