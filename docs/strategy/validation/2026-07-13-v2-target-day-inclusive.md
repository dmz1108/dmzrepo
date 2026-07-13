# V2 Target-Day-Inclusive Validation

## Scope

This change corrects the official v2 leader metric date/price path and removes repeated scoring of the same target-day limit-up event, following the Owner's decision.

- A 10-session event window is the previous 9 trading sessions plus the target day.
- A 10-session cumulative return uses the close immediately before that window as its base, then the target-day live price intraday or final close post-close.
- The same rule applies to the 30-session return.
- A historical day without a complete, correctly dated, after-close close-price payload remains missing. It must not fall back to a stale `gain` value.
- A target-day limit-up is scored only through `zt10Count`. It no longer also earns the legacy present, target-day limit-up, streak or early-seal bonuses.
- The `present` bonus remains only for a non-limit-up stock whose target-day gain is at least 3%. Streak and seal time remain display-only facts.

## Locked evidence

- Target day: `2026-07-08`
- Family: `group:算力AI`
- Focus code: `000938` (紫光股份)
- Locked full-pool input: 90 candidates
- Locked raw evidence file SHA-256: `0511d6e7ff2ce3fbe95217612f7a6cc6273037ff83551fcbb29de1c3d6e5bcd8`
- Locked canonical input SHA-256: `fa8e31b6fda6057694c743faf2ec2d3382f7764ec077203ed93c31fa4874b3c2`

Production close-price files were read through SSH without modifying production:

| Day | Close | Daily gain | File SHA-256 |
|---|---:|---:|---|
| 2026-06-24 | 27.66 | +2.79% | `b4fcd2311b4ca74c1199f9e41136c7d5a491d784a6e181332fc407d4d3dcf16d` |
| 2026-06-25 | 28.39 | +2.64% | `90df51fccf20300e4b8d40e8b2158110b4d458eaa25f3276fc73348ac1aa745e` |
| 2026-07-08 | 33.62 | +6.80% | `ea571e25ff06f33be3f5c199fc24cbda3cc60c3c80e20191e5708deb3e14f036` |

The 10 trading sessions are `2026-06-25` through `2026-07-08`. Their cumulative return must use the preceding close on `2026-06-24`:

```text
33.62 / 27.66 - 1 = 21.55%
```

Using the first session's close (`28.39`) would produce `18.42%`, which is only the change after the first session closed and therefore drops one session's return.

## V2 correction

The locked v2 row for 紫光股份 contained:

- `zt10Count=2`
- `gain10=21.55%`
- `gain30=16.59%`
- target-day gain evidence `todayGain=6.8%`
- old v2 score `59`, old rank `6`

The score path read only `gain`, so the existing `todayGain=6.8%` evidence did not earn the unchanged v2 `present` bonus of 6 points. The corrected path resolves one explicit target-day gain, uses it consistently for score, tie-break, explanation and output, and produces:

```text
59 + 6 = 65
```

After the Owner additionally removed duplicate target-day limit-up scoring, the same locked pool produces:

| Rank | Code | Name | Score |
|---:|---|---|---:|
| 1 | 002396 | 星网锐捷 | 84 |
| 2 | 000938 | 紫光股份 | 65 |
| 3 | 603661 | 恒林股份 | 62 |
| 4 | 002965 | 祥鑫科技 | 61 |
| 5 | 603950 | 长源东谷 | 55 |

紫光股份 still receives the 6-point non-limit-up presence signal because it closed up 6.8%, but a target-day limit-up receives no second present bonus. Hard gates, limit-up facts and family rules remain unchanged.

## Validation

- `node --check kpl-stats-server.js`
- `node tests/leader-family-metrics.test.js`
- `node tests/leader-pool-debug.test.js`
- `node tests/metric-profile.test.js`
- All 21 `tests/*.test.js` files passed.

Production was not changed, no service was restarted, and no frozen snapshot was rewritten.
