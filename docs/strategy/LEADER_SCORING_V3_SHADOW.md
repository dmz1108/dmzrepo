# Leader Scoring v3 Shadow

## Purpose

`strategy-leader-scoring-v3.js` is the replayable shadow scorer agreed in the three-party leader-scoring discussion. It does not replace the production v2 ranking.

## Non-duplication rules

- The history window contains the previous 10 trading days and always excludes the target day.
- Each stock can receive only one persisted event per family per day: star limit-up `20`, ordinary limit-up `15`, confirmed-mainline gain above 5% without a limit-up `8`, or no event `0`.
- A higher event replaces a lower event on the same day. It never stacks with it.
- Legacy v2 signals such as `present`, `todayLimit`, board height, early seal, star bonus, and reason freshness do not add event points. They may be retained as diagnostics or tie-break evidence only.
- The gain trend layer is separate from event history. Shadow v1 uses positive 10-day gain at `1x` plus positive 30-day gain at `0.25x`; its anchor must equal the last trading day in the complete history window, so stale or target-day prices cannot silently enter the score.
- Formal eligibility is satisfied by either a prior family limit-up event or a persisted post-close target-day star/ordinary limit-up event in the same family. The gate adds no points. An intraday first-day theme remains provisional until post-close attribution is confirmed; a big-gain event without a limit-up does not satisfy this gate by itself.

## Missing data

The scorer requires all 10 expected history records, a persisted target-day event or intraday projection, and per-candidate gain values whose anchor equals the target day's previous trading day. Pool-level gain fields are never inherited by candidates. Missing evidence produces `leadScoreV3Raw: null` and explicit `dataMissing`; known partial points remain diagnostic only.

## Offline replay

```bash
node tools/replay-leader-scoring-v3.js --file=tmp/strategy-cases/v3-shadow-case.json --require-complete
```

The input contains `targetDay`, `tradingDays`, `dailyRecords`, `todayRecord` or a persisted `todayProjection`, and a single-family `candidates` array. Optional `v2Rows` are returned beside v3 results for double-run comparison. Every report includes a stable input SHA-256; `--expect-sha=<sha256>` rejects evidence drift.

## Deployment boundary

This module is PR3 of the agreed implementation plan. Production v2 remains authoritative. A later PR may expose v3 shadow results to admin diagnostics after review; replacing the user-visible ranking still requires the agreed observation period and Owner approval.
