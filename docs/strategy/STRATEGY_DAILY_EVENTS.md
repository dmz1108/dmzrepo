# Strategy Daily Events

## Purpose

`strategy-data/strategy-daily-events-YYYY-MM-DD.json` is the replayable evidence layer for leader scoring v3. It is derived data only and never rewrites the four source review databases.

## Time Boundary

- `intradayObservation` is appended during valid intraday sessions by the existing mainline keep-warm refresh. It records only information available at that observation time.
- `postCloseConfirmed` is generated after 16:00 China time from the frozen strategy snapshot, final limit-up database, compatible main-reason database, close database, and persisted star evidence.
- Post-close results carry `historyUsableFrom: next-trading-day`. They must never be read back into the same day's intraday prediction.

## Locked Rules

- A post-close mainline needs `netInflow > 0`, at least one confirmed star, at least two family limit-ups, and complete limit-up/main-reason inputs.
- At most two different families are confirmed. A second family must pass every gate independently; the system does not fill a second slot.
- Stock events are mutually exclusive per day: star limit-up `20`, ordinary limit-up `15`, confirmed-mainline close gain above 5% without limit-up `8`, otherwise no event.
- A 20/15 event needs reliable final limit-up and main-reason family evidence. An 8 event additionally needs a confirmed post-close family, family evidence for the stock, and a complete final close row.
- Missing inputs are stored as `dataMissing`/`provisional`, never converted to zero.

## Operations

- The server retries post-close finalization every 10 minutes after 16:00 until the daily file is complete.
- Admin inspection: `GET /api/admin/strategy-daily-events?day=YYYY-MM-DD`.
- Admin rebuild after close: add `&rebuild=1`.
- `strategy-data` is included in database sync; `strategy-daily-events.js` is included in backend-program sync.
- Existing 30-trading-day cleanup for `strategy-data` removes older daily event files automatically.

## Version

- `schemaVersion: 1`
- `ruleVersion: leader-scoring-v3-events-v1`
