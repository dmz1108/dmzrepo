# V3 Target-Day-Inclusive Window Validation

Scope: validate the Owner's 2026-07-13 correction against the locked 2026-07-08 `group:算力AI` full pool without changing the official v2 ranking or production runtime files.

## Locked evidence

- Target day: `2026-07-08`
- Family: `group:算力AI`
- Pool: 90 unique stocks from the previously locked full-pool case
- Original raw file SHA-256: `218ba6028bb1f44b1e85006301842c2cd84f1246afafc3a283508ba6022665a5`
- Original canonical input SHA-256: `000856e734d4fe7fa472bacd45aa8c88fe98395fead85265922405d3ed0b02f4`
- Inclusive-window derived raw file SHA-256: `0511d6e7ff2ce3fbe95217612f7a6cc6273037ff83551fcbb29de1c3d6e5bcd8`
- Inclusive-window canonical input SHA-256: `fa8e31b6fda6057694c743faf2ec2d3382f7764ec077203ed93c31fa4874b3c2`
- Non-trend evidence was byte-semantically unchanged after removing the expected gain/anchor fields from both inputs: canonical comparison SHA-256 `b60e47aeec9eecd934a41dcf8c9784fef1298d637f654893a6a8dd2e10aca7ec` on both sides.

The derived case changes only the rolling gain anchor/base fields, per-stock gain10/gain30, target-day price-state/as-of metadata and the matching `todayGain` tie-breaker. Runtime evidence JSON remains ignored and is not committed.

## Corrected rules under validation

1. The event window is exactly 10 trading days: the previous 9 sessions plus the target day. For 2026-07-08 it is `06-25, 06-26, 06-29, 06-30, 07-01, 07-02, 07-03, 07-06, 07-07, 07-08`.
2. gain10/gain30 end at the target day. Intraday callers must use the target-day live price and an `intraday-live` as-of; post-close callers must use the target-day final close and `post-close-final` as-of.
3. Mainline-family qualification and limit-up activity are separate. One reliable target-family limit-up inside the window establishes family qualification; after that, every reliable real limit-up for that stock in the same window scores its actual daily level, even when that day's reason family differs.
4. A single day remains mutually exclusive: star limit-up 20 replaces ordinary limit-up 15. It never scores 20+15.
5. A limit-up whose own reason family is missing may recover only the ordinary 15-point lower bound after another day proves the target family; it may not fabricate star evidence.

## Full-pool result

- Pool: 90
- Complete rows: 86
- Incomplete rows: 4
- Formal leaders: 84
- Completeness is unchanged from the locked P6 replay; no evidence gate was weakened.
- Incomplete: `002167 history:2026-07-02`; `002955 history:2026-07-02`; `600405 trend:gain10/gain30`; `603067 history:2026-07-06`.

| 新名次 | 代码 | 名称 | 事件分 | gain10 | gain30 | 趋势分 | v3总分 |
|---:|---|---|---:|---:|---:|---:|---:|
| 1 | 002396 | 星网锐捷 | 75 | 54.05% | 25.32% | 60.38 | 135.38 |
| 2 | 603956 | 威派格 | 45 | 19.50% | -8.72% | 19.50 | 64.50 |
| 3 | 002965 | 祥鑫科技 | 30 | 20.04% | 46.32% | 31.62 | 61.62 |
| 4 | 603661 | 恒林股份 | 30 | 25.83% | 13.88% | 29.30 | 59.30 |
| 5 | 000938 | 紫光股份 | 30 | 21.55% | 16.59% | 25.70 | 55.70 |
| 6 | 603950 | 长源东谷 | 30 | 16.83% | 26.00% | 23.33 | 53.33 |
| 7 | 000811 | 冰轮环境 | 30 | 2.77% | 56.22% | 16.82 | 46.82 |

## Owner focus cases

### 紫光股份 000938

- `2026-06-30`: reliable ordinary limit-up, recorded under `group:光通信` with source reason `光模块 / 算力`.
- `2026-07-06`: reliable ordinary limit-up under `group:算力AI`, which establishes the rolling-window family qualification.
- Corrected event score: `15 + 15 = 30`; limit-up count 2; target-family evidence count 1.
- Corrected trend score: `gain10 21.55 + gain30 16.59 * 0.25 = 25.70`.
- Corrected total: `55.70`, rank 5.

### 航锦科技 000818

- `2026-06-24` is outside the corrected 10-session window and must not score.
- `2026-06-25` and `2026-06-30` remain two reliable ordinary limit-ups.
- Corrected event score: `15 + 15 = 30`; limit-up count 2.
- Corrected trend score: `gain10 5.42 + max(gain30 -9.44, 0) * 0.25 = 5.42`.
- Corrected total: `35.42`, rank 17.

This reverses the old erroneous comparison (`航锦 72.12 > 紫光 32.39`) for explainable, rule-level reasons rather than a stock-specific adjustment.

## Validation commands

- `node --check strategy-leader-scoring-v3.js`
- `node tests/leader-scoring-v3.test.js`
- `node tests/strategy-daily-events-v2.test.js`
- `for f in tests/*.test.js; do node "$f" || exit 1; done`
- Full-pool replay with `tools/replay-leader-scoring-v3.js` against canonical input SHA-256 `fa8e31b6fda6057694c743faf2ec2d3382f7764ec077203ed93c31fa4874b3c2`

All tests passed. This validation does not deploy code, restart services, modify runtime archives, start PR4, or change the official v2 ranking.
