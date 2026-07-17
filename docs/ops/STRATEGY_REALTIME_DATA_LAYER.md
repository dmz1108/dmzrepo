# Strategy Realtime Data Layer

This document defines the diagnostic realtime data layer introduced after the July 2026 cross-day snapshot incident.

## Safety Boundary

- The official v2 mainline fetch, scoring, sorting, frozen snapshots, and page response remain unchanged.
- The new resolver is diagnostic-only until a separate owner-approved migration passes golden comparison.
- Eastmoney, Tonghuashun, and KPL remain independent sources. Their money-flow values are never added together.
- Eastmoney is the declared canonical scoring source. THS and KPL provide corroborating direction and coverage only.
- Reconstructed history is stored separately and has `scoreEligible: false` by default.
- Runtime facts and reports live under ignored `strategy-data/`; they are synchronized as database runtime state, not committed to Git.

## P2: Independent Board Fund-Flow Facts

Latest current-day facts are written atomically to:

```text
strategy-data/board-fund-flow/eastmoney/YYYY-MM-DD.json
strategy-data/board-fund-flow/ths/YYYY-MM-DD.json
strategy-data/board-fund-flow/kpl/YYYY-MM-DD.json
```

Each payload carries:

```text
targetDay, sourceDay, sourceDayBasis, source, zsType
asOf, fetchedAt, acquisition
complete, stale, reconstructed, scoreEligible
rowCount, dropped, factHash, contentHash
```

Each row keeps its source plate ID/name, gain, money metric, limit-up count, member count, `sourceDay`, and `asOf`.

Write guards:

1. A foreign or unknown source day is dropped and marks the payload incomplete/stale.
2. A non-trading day is rejected.
3. An older `asOf` cannot replace a newer file.
4. A failed/incomplete refresh cannot downgrade an already complete file.
5. Content hashes detect accidental mutation; fact hashes support cross-day identical-value auditing.

Live source metrics are preserved as received by the existing fetchers:

- Eastmoney strategy fact: `f66`, super-large-order net inflow.
- THS full-market fact: live board `zjjlr`; selected strategy cards may separately carry the calibrated DDE overlay.
- KPL fact: current board ranking/盘口 money flow.

## P3: Unified Strategy Realtime Context

`buildStrategyRealtimeContext` combines the independent source facts with:

- same-day limit-up database;
- approved main-reason database;
- close-price database;
- current L2 jobs;
- current mainline candidates;
- candidate-board member evidence already observed by the mainline build.

The context exposes field-level readiness rather than one all-or-nothing global gate:

```text
readyFor.intradayRanking
readyFor.historicalScoring
readyFor.l2StarValidation
```

`canonicalBoards[].netInflow` always remains the Eastmoney value. `sourceMetrics` and `agreement` expose THS/KPL corroboration without arithmetic aggregation.

Admin-only inspection:

```text
GET /api/admin/strategy-realtime-context?day=YYYY-MM-DD
GET /api/admin/strategy-realtime-context?day=YYYY-MM-DD&capture=1&save_report=1
```

The response explicitly carries `diagnosticOnly: true` and `officialV2PathChanged: false`.

## P4: Intraday Observation

During trading windows, the server captures source facts every three minutes. Compact source quality is appended to the existing `strategy-daily-events-YYYY-MM-DD.json` intraday samples. No parallel timeline is created.

The observation records:

- source row count, timestamp, stale/complete state;
- context readiness and missing fields;
- mainline first seen/resonance time;
- expected-star and confirmed-star first appearance.

## Daily Quality Report

Each capture refreshes:

```text
strategy-data/quality-reports/YYYY-MM-DD.json
strategy-data/quality-reports/YYYY-MM-DD.md
```

The report checks:

- three-source fact health;
- L2 job and stock coverage;
- expected-star to confirmed-star conversion;
- mainline first-seen/expected/confirmed timing;
- whether a no-mainline result is reasonable or needs investigation.

The report is diagnostic evidence. It does not create, confirm, reorder, or delete a mainline.

## P5: Historical Reconstruction

Only Eastmoney historical board money flow is currently verified. THS and KPL history must remain null until their date, unit, and coverage contracts are proven.

Run from the repository/server root:

```text
node tools/reconstruct-board-fund-flow.js --day=2026-07-02 --source=eastmoney
```

Optional selected-board input:

```text
node tools/reconstruct-board-fund-flow.js --day=2026-07-02 --input=C:\path\to\boards.json
```

Reconstructed results are written to:

```text
strategy-data/board-fund-flow-reconstructed/eastmoney/YYYY-MM-DD.json
```

They never overwrite original facts or frozen snapshots. The Eastmoney historical endpoint maps `f56` to the historical super-large-order net inflow and `f63` to board daily gain. If no row exists for the requested date, no reconstruction file is written.

## Retention

Fact files, reconstructed files, and daily reports use the existing recent-30-trading-day cleanup set. Cleanup runs once daily with the rest of the runtime database maintenance.

## Promotion Checklist

Before any consumer migrates from v2/snapshots to this context:

1. Collect at least several real trading days of reports.
2. Verify timestamps and source-day behavior around open, lunch, close, weekends, and source failures.
3. Compare old/new values and rankings with a golden diff.
4. Confirm no reconstructed or stale record becomes score eligible.
5. Review source mapping and cross-source disagreements.
6. Obtain Owner approval in the strategy discussion record.
7. Reconfirm the KPL boundary before promotion: KPL facts may be retained for
   diagnostics, but they must not enter strategy scoring, ranking, page-level
   corroboration, or any other strategy auxiliary indicator without a new,
   explicit Owner decision.
