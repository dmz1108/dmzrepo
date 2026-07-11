# AI Discussion Group Protocol

This document defines how Home Codex, Company Codex, Claude, and the owner discuss important product and strategy decisions before implementation.

It is not a handoff process and not a task split. The goal is joint reasoning: multiple agents examine the same question, challenge each other, revise their views, and reach a shared implementation decision.

## Purpose

Use this protocol for high-impact areas, especially:

- `今日策略` / `今日主线榜`
- strategy scoring, ranking, and leader selection
- data-source interpretation that affects market judgment
- user-facing workflow changes with unclear tradeoffs
- any change where the owner says "先讨论" or "大家一起讨论"

For small bug fixes, typos, or obvious one-line repairs, normal implementation can proceed without this process.

## Discussion Principles

1. Same question, same evidence.
   Every agent must answer the same owner question, not a sliced subtask.
   For production strategy cases, use `docs/AI_PRODUCTION_READ.md` to capture the same filtered evidence request and record its bundle SHA-256.

2. Independent first pass.
   Each agent writes its own judgment before adopting another agent's answer. This avoids early anchoring.

3. Challenge, do not merely validate.
   Each agent must point out where the other view may be wrong, incomplete, overfit, or hard to implement.

4. Revision is required.
   A discussion is not complete until each agent updates or defends its view after seeing the critique.

5. Owner judgment is first-class evidence.
   When the owner says a result is obviously wrong in real trading context, record that as a case, not as a preference to dismiss.

6. No code until convergence.
   For major strategy work, do not implement until there is a written shared decision or the owner explicitly asks for an experiment.

7. The conclusion must explain rejected options.
   The final plan should say what was not chosen and why.

## Language Rule

Git discussion files should use Chinese by default, including the owner question, agent views, challenges, revised views, shared decision, implementation plan, validation plan, and timeline notes.

Use English only when the owner explicitly asks for English, when copying an external English quote, or when a technical identifier is naturally English.

## Required Format

Every discussion thread should use this structure:

```md
# Discussion: Short Title

Status: Proposed | In Discussion | Converged | Implemented | Parked
Owner Question:

## Context

## Evidence Available

## Codex Independent View

## Claude Independent View

## Company Codex Independent View

## Challenges

### Codex Challenges Claude

### Claude Challenges Codex

### Other Challenges

## Revised Views

### Codex Revised View

### Claude Revised View

### Company Codex Revised View

## Shared Decision

## Implementation Plan

## Validation Plan

## Open Questions
```

If one agent is unavailable, leave its section as `Pending` and do not pretend it participated.

## How To Use It

Preferred path:

1. Create a GitHub issue using the `Strategy Discussion` template, or create a file under `docs/strategy/discussions/`.
2. The owner states the question and desired outcome.
3. Each agent adds its independent view.
4. Agents challenge each other in the same thread.
5. Agents revise their views.
6. The owner approves a shared decision.
7. Only then create a code branch or PR for implementation.

Emergency path:

- If production is broken, fix first, record the hotfix, then backfill a short discussion entry if the fix changes strategy behavior.

## 今日主线榜 Specific Rules

`今日主线榜` is an intraday prediction system, not an after-market replay.

Any discussion about it must consider:

- live sector strength and board gain
- capital inflow/outflow, including null/missing data
- breadth of rising constituent stocks
- limit-up, near-limit-up, and big-gainer behavior
- historical four-source main-reason database
- recent main-reason freshness
- leader candidate quality
- whether a theme is broad market leadership or a small isolated move

The group must explicitly guard against:

- using after-market review as if it were intraday prediction
- putting unrelated stocks into a theme card
- ranking a narrow one-stock theme too high
- showing fake zeroes when data is missing
- rewarding historical strength as if it were same-day strength
- changing score constants without real cases

## Decision Quality Checklist

Before implementation, the shared decision should answer:

- What exact user-visible problem are we solving?
- What data supports the change?
- What data could contradict the change?
- Which examples should improve?
- Which examples might get worse?
- What will we measure after deployment?
- What is the rollback condition?
- Which production evidence bundle, completeness state, and exact fields support the decision?

## Relationship To Other Docs

- `docs/DAILY_HANDOFF.md` records what was done.
- `docs/COLLABORATION_WORKFLOW.md` records Git and deployment rules.
- This file records how important decisions are discussed before work starts.
