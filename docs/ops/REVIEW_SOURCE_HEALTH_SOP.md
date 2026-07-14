# Review Source Health And Daily Repair SOP

This SOP covers the four formal limit-up review sources and the “数据源健康” status shown in the review/admin experience.

## Formal Sources

| UI label | source/group contract |
| --- | --- |
| 复盘啦 | group `kaipanla`, source `review/kaipanla-fupanla` |
| 选股宝 | group `xuangubao`, source `review/xuangubao-limit-up` |
| 韭研 | group `jiuyangongshe`, source `review/jiuyangongshe-structured` |
| 淘股吧 | source `review/tgb-hunan-structured` |

Do not reintroduce removed Eastmoney or Tonghuashun review tabs into this four-source health contract. That restriction applies to the limit-up review database only; Eastmoney and Tonghuashun remain valid real-time/strategy market sources.

## Definition Of Healthy

A source is healthy for a trading day only when all of these are true:

1. The formal source artifact or rendered source tab is for the requested trading day.
2. It contains non-empty, parseable structured rows.
3. Unique six-digit stock-code count is recomputed from the actual rows.
4. Duplicate, missing, extra, and weak/invalid row checks are explicit.
5. The source tab, source statistics, and final database report the same source count under the declared filtering rules.
6. No stale source error remains after valid rows have been loaded.

Scheduler success, a downloaded image, raw evidence, an old cached count, or a previous-day payload is not sufficient.

## Required States

Use distinct states instead of turning every absence into “normal”:

- `healthy`: same-day formal rows passed reconciliation.
- `pending`: source has not published yet or an authorized manual step is still in progress.
- `missing`: no same-day formal artifact exists.
- `invalid`: artifact exists but is empty, malformed, wrong-day, duplicated, or fails reconciliation.
- `stale`: data came from an earlier day or exceeded its allowed freshness.
- `not-required`: weekend, statutory holiday, or non-trading day.

If today's source is unavailable, do not display yesterday's count as today's result.

## Daily Reconciliation

For each trading day and each source:

1. Resolve the target day in China time and confirm it is a trading day.
2. Load the formal source rows, not merely raw evidence.
3. Normalize codes, retain source-faithful board/detail reasons, and deduplicate by the declared source rule.
4. Recompute:
   - row count;
   - unique-code count;
   - duplicates;
   - missing codes versus the applicable final limit-up pool;
   - extra codes;
   - weak/empty reasons.
5. Build the source tab and source-health statistics from the same normalized row set.
6. Remove a prior source error only after the same-day tab has valid rows.
7. Rebuild the combined reason database only after source artifacts are settled.
8. Re-read the public source-view/health response and verify labels, counts, day, and status.

The current regression contract is covered by `tests/review-source-health.test.js`: existing 复盘啦 and 选股宝 statistics remain, a non-empty 韭研 tab creates fresh statistics, an empty TGB tab does not create healthy statistics, and a stale error is removed only for a source that now has real rows.

## Manual Sync Behavior

The health-source sync action should repair only missing, invalid, or stale source artifacts. It must not blindly regenerate and overwrite already valid source-faithful files.

After repair:

- rerun the source reconciliation;
- rebuild the combined database if a formal source changed;
- refresh the health response from actual rows;
- report what was filled, skipped, or still pending.

## TGB Special Rule

TGB may require a manual official-image transcription. Follow `docs/ops/TGB_HUNAN_DAILY_SOP.md` exactly.

TGB remains pending/missing until the formal `tgb-hunan-structured` file is written, reconciled, and the combined database is rebuilt. Downloading the article and images alone is not completion.

## Retention And Calendar

- Keep the configured recent 30 trading days for each formal source.
- Run cleanup once per day; do not delete by calendar-day age.
- Do not create “today pending” rows on weekends or Chinese statutory market holidays.
- Never count炸板, ST, or other excluded categories unless that source's approved formal contract explicitly includes them.

## Incident Checklist

When the review page has data but health says missing:

1. Confirm page day and health day match.
2. Inspect the actual source tab rows and normalized group/source key.
3. Recompute unique codes instead of trusting cached `stockCount`.
4. Check whether an old `sourceErrors` entry survived after valid data loaded.
5. Check response/frozen cache invalidation after rebuild.
6. Add or update a regression test before declaring the recurring issue fixed.

Record manual source repair in both `docs/DAILY_HANDOFF.md` and the cloud operation log. Do not commit raw review databases, cookies, or source credentials.
