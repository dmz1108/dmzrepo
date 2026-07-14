# L2 Worker And Star-Stock Runbook

Use this document for company-worker connectivity, L2 task queues, five-bucket results, strategy-page scans, and expected/confirmed star-stock decisions.

## Current Topology

- The cloud service creates and persists jobs through `local-l2-task-queue.js`.
- The company-side worker polls the cloud queue, performs the actual Level2 calculation, and returns incremental or final results.
- The production company worker is runtime infrastructure and may not be fully represented by `l2-focus-scanner.js` in this repository.
- `l2-focus-scanner.js` still contains an older two-bucket helper. Do not use that file alone to conclude that production supports only two buckets.

## Canonical Five-Bucket Contract

The cloud queue requests these order thresholds in yuan:

```text
500000, 3000000, 5000000, 8000000, 10000000
```

They correspond to `>=50万`, `>=300万`, `>=500万`, `>=800万`, and `>=1000万`.

Each returned stock row must contain:

- a six-digit `code`;
- a usable current `price`, or enough task-snapshot price metadata for the queue to fill it;
- `thresholds` for all five buckets;
- for every bucket: numeric `activeBuy`, `activeSell`, `passiveBuy`, and `passiveSell`;
- current gain and timestamps when available.

The queue records `resultRows`, `rowsWithPrice`, and `rowsWithAllBuckets`. A completed scan is structurally acceptable only when row coverage and these metrics match the intended stock set. Zeros are valid observations; missing fields are not zeros.

## Worker And Job State

- A worker heartbeat newer than 45 seconds is considered online.
- An offline worker means the job remains queued. It does not mean “scan complete” and does not mean “no star stock”.
- `queued` and `running` are pending evidence states.
- Only `done` with adequate code and bucket coverage can support a negative conclusion.
- `error`, incomplete rows, stale dates, or missing maximum-bucket data must remain explicit data-quality states.

When the company computer pauses at lunch or shuts down, preserve queued jobs. The worker should continue them after it reconnects rather than creating a false empty result.

## Maximum Observable Bucket

The strategy calculates each stock's own maximum observable order bucket from its price and exchange single-order share limit, then chooses the highest configured bucket that is actually reachable.

Current strategy buckets are the same five values above. A result cannot fall back to a smaller bucket to confirm a star when the stock's own maximum bucket is empty or missing.

Price provenance matters:

- prefer worker result price;
- otherwise use the task's same-time real-time snapshot price;
- retain `priceSource` and `priceAsOf`;
- without a trustworthy price, the system may show a weak/data-missing state but must not confirm a star.

## Star-Stock Decision Boundary

The current production decision is implemented in `strategyMainlineStarStatus`:

- pre-limit “expected star” requires the required bucket ratios and more than `3亿元` accumulated active buy in the stock's own maximum observable bucket;
- after sealing, “confirmed star” requires the sealed ratio rule plus at least `3亿元` active buy in that maximum bucket;
- a maximum bucket present with all-zero amounts means the condition failed;
- a maximum-bucket field that is absent means data is missing;
- neither case may be replaced by a strong smaller bucket;
- a board with no completed adequate scan cannot be rejected merely because no star is currently visible.

The exact ratios and exchange mapping live in code and the approved strategy discussion. Any change to those semantics requires production evidence, independent review, and the AI discussion protocol.

## Operational Validation

For a real scan, verify in this order:

1. Worker heartbeat is current and the worker identity/version are expected.
2. The job targets the intended trading day, board, family, and stock list.
3. The job progressed from queued/running to done without being replaced by a duplicate job.
4. `resultRows` covers the intended stocks, subject only to explicitly reported exclusions.
5. `rowsWithPrice == resultRows`.
6. `rowsWithAllBuckets == resultRows`.
7. A sample row shows all five bucket objects and plausible numeric amounts.
8. Strategy consumption reports pending, incomplete, no-star, expected-star, and confirmed-star distinctly.

Focused repository checks include:

```text
tests/local-l2-persistence.test.js
tests/star-l2-layers.test.js
tests/mainline-attribution.test.js
tests/mainline-review.test.js
```

## Incident Triage

- **No heartbeat:** inspect the company worker first; do not change strategy thresholds.
- **Only two buckets returned:** confirm which worker binary/config actually claimed the job. Do not infer production behavior from the old helper file.
- **Five bucket labels but empty high buckets:** distinguish legitimate zeros from absent fields and verify source-download completeness.
- **Rows lack price:** inspect both worker output and task snapshot enrichment.
- **Page says L2 pending after a done job:** compare job day, plate ID, family key, code coverage, and cache/frozen response state.
- **Scan result exists but page is blank:** inspect the API's filtered payload and administrator visibility separately from the worker calculation.

Do not commit worker tokens, local broker credentials, task databases, or raw Level2 results.
