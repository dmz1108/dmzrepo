# Market Data Source Contracts

Use this document whenever changing sector gain, capital flow, DDE, constituent membership, real-time strategy context, or historical reconstruction.

## Core Rule

Source-specific data remains source-specific. Eastmoney, Tonghuashun, and KPL can describe overlapping concepts with different IDs, members, clocks, and money-flow definitions. Never add their values together as if they were independent cash flows.

Every real-time or persisted record should carry, or be traceable to:

- `source`
- source plate ID and name
- `targetDay`
- `sourceDay`
- `asOf`
- `fetchedAt`
- `stale`/`complete` status
- acquisition method or endpoint family

If `sourceDay !== targetDay`, the record must not masquerade as today's fact. A failed source stays missing or stale; yesterday's value is not today's fallback.

## Eastmoney

- Current real-time board net inflow is read from field `f62`.
- Eastmoney also has a usable historical board-fund interface and is the preferred canonical source when a backtest requires one reproducible historical money-flow series.
- Preserve Eastmoney plate IDs and memberships. Do not replace them with similarly named THS/KPL boards.

## Tonghuashun

- The current real-time concept-board feed from `q.10jqka.com.cn/gn` exposes `zjjlr`.
- `zjjlr` is expressed in units of `亿元` in the source and is converted to yuan in the backend.
- `data.10jqka.com.cn/funds/gnzjl/` is the dedicated concept-fund ranking page. It can be developed as a verification or fallback source only after date, coverage, unit, and plate-mapping checks.
- `data.10jqka.com.cn/funds/ddzz/` is stock-level large-order tracking. It is not a sector DDE value and must not directly replace board net inflow.

Strategy-page THS money metric (Owner decision 2026-07-16): **DDE big-order amount**, not `zjjlr`.

- Source: `https://d.10jqka.com.cn/v6/realhead/bk_{indexCode}/defer/last.js`, field `527198`, unit = yuan. `indexCode` is the THS block-index code (`thsPlateCode`, `885xxx`) mapped from the gn plate id via the THS concept catalog.
- Calibration record (2026-07-16 after close, cross-checked against the owner's THS app "DDE大单金额"): 国资云 `bk_885977` = 10.415亿, 智慧政务 `bk_885956` = 20.375亿; same-day `zjjlr` was 1.79亿 / 0亿 — a different metric family entirely.
- Field family observed on the same payload: `526792` behaves like DDE 大单净量(%) on stocks; buy/sell-looking pairs `223/224`, `225/226`, `237/238`, `259/260` remain undecoded — do not use them without their own calibration.
- Scope: strategy-page chain only (`getDayBoardsWithMembers` calls that pass an explicit KPL-free `zsTypes`). Kanban, review, and default three-source callers keep `zjjlr`. Overlay applies only when `useDay` is the current China trading day — realhead is a *current* value, so backfilling historical days with it is data leakage and is refused in code.
- Provenance: overlaid boards carry `netInflowMetric='ths-dde-big-order-amount'`, the raw DDE in `ddeBigOrderAmount`, and the displaced `zjjlr` in `netInflowZjjlr`. Boards whose DDE fetch fails keep `zjjlr` with `netInflowMetric='ths-net-inflow'` — the two metrics are never silently mixed as one column without the metric tag.

For a strategy family that maps to several overlapping THS concepts, use one representative board value and expose its identity. Current metadata is:

```text
netInflowAggregation = representative-board-max
```

Do not sum overlapping concept boards. If stock-level DDE is added later, keep it as a separate corroborating feature with constituent deduplication, coverage, and timestamp metadata.

## KPL

KPL currently provides real-time board/ranking and盘口 families including:

```text
/kpl/hangqing/plate_info_qj
/kpl/plate/bk_pankou
```

Treat KPL as an independent source. Historical KPL fund flow must remain unavailable/null unless a verified historical endpoint and date semantics are established.

## Strategy Consumption

- Board gain and net inflow describe current board strength.
- Constituents come from each source's own membership database.
- Same-day limit-up members come from the real-time/final limit-up pool intersected with the selected source board.
- 10/30-day stock returns come from the daily close database.
- recent limit-up counts come from the limit-up database.
- historical themes and detail reasons come from the approved four-source reason system.
- L2 star signals remain a separate evidence channel.

For a cross-source family:

1. Keep each source's raw observation separate.
2. Select a declared representative/canonical value for scoring.
3. Use source agreement as confidence evidence, not as an arithmetic sum.
4. Show missing and stale sources honestly.

## Snapshot Boundary

Snapshots are useful for intraday history, short-term caching, audit, and after-close records. They must not be the only source of truth when direct source facts and maintained databases are available.

Never save a previous-day fallback under today's filename. Historical reconstruction must be labeled `reconstructed`, retain provenance, and not overwrite an original frozen snapshot.

## Change Checklist

Before changing a money-flow source or formula:

- capture the same board and timestamp from old and proposed sources;
- verify unit conversion and sign;
- compare plate membership and name/ID mapping;
- test duplicate/overlapping concepts;
- verify `sourceDay` and `asOf` behavior around open, close, weekends, and source failures;
- state whether the value is for display, diagnostics, confidence, or scoring;
- run a golden comparison before changing a production ranking input.

Any change that affects mainline inference or leader ranking follows `docs/AI_PRODUCTION_READ.md` and the AI discussion protocol.
