# DreamerQi Entertainment Page Design QA

## Comparison target

- Source visual truth: the pre-change `yule.html` from the current branch base, rendered against the live public entertainment payload
- Browser-rendered implementation: the redesigned `yule.html`, rendered against the same live public payload
- Desktop viewport: `1440 × 1024`
- Mobile viewport: `390 × 844`
- State: anonymous visitor, all channels selected, current public content dated 2026-07-14

The visual evidence is local, temporary QA material and is intentionally excluded from production assets. The baseline and redesign use the same content, image sources, fonts, navigation, and account state, so the comparison isolates layout and styling changes.

## Evidence

- Baseline desktop: `yule-before-1440.png`
- Final desktop: `yule-desktop-1440.png`
- Required same-input comparison: `yule-before-after-1440.png`
- Final mobile channel page: `yule-mobile-390.png`
- Final mobile detail page: `yule-detail-mobile-390.png`

## Findings

No actionable P0, P1, or P2 findings remain.

- Visual hierarchy: the former loose hero and flat card grid are now one editorial composition with a strong masthead, live content summary, sticky channel rail, a clear lead story, and numbered secondary stories.
- Product consistency: the page extends the established PR68 dark editorial language with the existing DreamerQi neutral/blue tokens, Space Grotesk/Space Mono stack, 8–10 px radii, restrained borders, and compact navigation.
- Real assets: all visible story imagery comes from the existing public entertainment payload. No placeholder image, emoji category marker, handcrafted icon, or generated substitute was introduced.
- Typography and spacing: title scale, line wrapping, card density, borders, radii, image crops, desktop columns, and mobile vertical rhythm were checked in the combined comparison and final viewport captures.
- Responsive behavior: the mobile header remains one row, page links and channel filters stay horizontally scrollable, the masthead becomes a single column, the lead story stacks cleanly, and article text remains readable without horizontal page overflow.
- Accessibility: navigation and main landmarks are explicit; channel buttons expose pressed state; focus styles and reduced-motion behavior remain available; login and content overlays expose dialog semantics, contain keyboard focus, close on Escape, and restore focus.

## Interaction and runtime checks

- Live categories and all 264 current public items loaded through the local same-origin preview.
- `明星热点` selected successfully, exposed pressed state, and returned to `全部` through the in-page channel action.
- The lead story opened its station detail route and rendered the matching title, summary, article body, metadata, and return link.
- The login dialog exposed account and password fields; keyboard focus entered the dialog, Escape closed it, and focus returned to the login trigger.
- Final mobile browser console errors: `0`.
- Inline entertainment script compiled successfully.
- Repository test suite: `30/30` passed via `node --test tests/*.test.js` after rebasing onto the latest `origin/main`.

final result: passed

# DreamerQi Homepage Chatter Rooftop Preview QA — 2026-07-15

## Comparison target

- Source visual truth: `Qi/assets/chatter-cute-preview.png`, the selected four-person outdoor rooftop image at `1200 × 720`.
- Browser-rendered implementation: the homepage `瞎聊聊` card using the existing image card component and overlay.
- Desktop viewport: `1440 × 1024`.
- Mobile viewport: `390 × 844`.
- State: anonymous homepage visitor, public API fallback cards visible.

## Evidence

- Desktop implementation: `tmp/product-design-home-chat-rooftop/home-chat-rooftop-desktop-1440.png`.
- Focused desktop card: `tmp/product-design-home-chat-rooftop/home-chat-rooftop-desktop-card.png`.
- Mobile implementation: `tmp/product-design-home-chat-rooftop/home-chat-rooftop-mobile-390.png`.
- Required same-input comparison: the selected source asset, focused desktop card, and mobile viewport were inspected together.

## Findings

No actionable P0, P1, or P2 findings remain.

- The exact selected four-person outdoor scene is used; no placeholder, code drawing, or approximate substitute was introduced.
- The `5:3` source ratio matches the existing `object-fit: cover` card slot, preserving all four faces, the phone, and the rooftop setting at both breakpoints.
- The left-side city and sky negative space remains visible while the existing lower gradient keeps the white `瞎聊聊` label legible.
- The existing card structure, copy, border, radius, responsive grid, and `#chat` destination are unchanged.
- PNG and WebP are both `1200 × 720`; the browser selected the `v=3` WebP asset with natural dimensions `1200 × 720`.
- Desktop and mobile document widths match their viewports with no horizontal overflow; final browser console errors: `0`.
- `node Qi/build-home.js`, compiled-script syntax, targeted tests, `git diff --check`, and the full repository suite (`32/32`) passed.

## Final result

passed

# DreamerQi Strategy No-Mainline Status QA - 2026-07-18

## Comparison target

- Source visual truth: the pre-change strategy prediction-review rows rendered with one legacy no-mainline record and one current dual-source no-mainline record.
- Browser-rendered implementation: the same dates, phases, and no-mainline states after the compact status treatment.
- Desktop viewport: `1440 × 1000`.
- Mobile viewport: `390 × 1600` for the full responsive strategy context.
- Implementation paths: `kpl-dashboard_17_apple.html` and `Qi/vendor/strategy-workbench.css`.

## Evidence

- Baseline desktop: `/private/tmp/strategy-no-star-before-desktop.png`.
- Final desktop: `/private/tmp/strategy-no-star-after-desktop.png`.
- Baseline mobile: `/private/tmp/strategy-no-star-before-mobile-long.png`.
- Final mobile: `/private/tmp/strategy-no-star-after-mobile-long.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

- Legacy and dual-source no-mainline records now use the same scan pattern: `今日无主线` followed immediately by `未通过明星验证`.
- The former long secondary explanation row is removed, reducing each legacy record to one compact line without losing the reason for exclusion.
- Empty result arrows and empty result cells are no longer rendered when a no-mainline row has no after-market result.
- Dual-source records with an actual after-market family keep the visible `盘后` answer, so source hit verdicts remain explainable.
- The compact status uses the existing strategy border, muted text, panel background, radius, and typography tokens; it does not introduce a new visual language.
- Desktop and mobile captures show the status intact on one line without text clipping or horizontal overflow.
- L2 qualification, formal-mainline gating, hit-rate calculation, source data, permissions, and strategy ranking are unchanged.

## Validation

- `node --check kpl-stats-server.js`: passed.
- Focused mainline review, two-source strategy, and strategy workbench UI checks: passed.
- Full repository suite: `45/45` test files passed.
- `git diff --check`: passed.

## Final result

passed

# DreamerQi Review Source Selector QA - 2026-07-18

## Comparison target

- Source visual truth: the pre-change limit-up review source selector rendered from the existing review fixture.
- Browser-rendered implementation: the compact segmented source selector using the same fixture and active `综合归纳` state.
- Desktop viewport: `1440 × 1700`; focused selector capture: `1440 × 250`.
- Mobile viewport: `390 × 1800`; focused selector capture: `390 × 330`.
- Scope: source selector sizing, spacing, selected state, and responsive behavior only.

## Evidence

- Desktop baseline: `/private/tmp/review-simplicity-final-1440.png`.
- Desktop implementation: `/private/tmp/review-source-selector-after-1440.png`.
- Desktop focused baseline/implementation: `/private/tmp/review-source-selector-before-focus-1440.png` and `/private/tmp/review-source-selector-after-focus-1440.png`.
- Mobile baseline: `/private/tmp/review-simplicity-final-390.png`.
- Mobile implementation: `/private/tmp/review-source-selector-after-390.png`.
- Mobile focused baseline/implementation: `/private/tmp/review-source-selector-before-focus-390.png` and `/private/tmp/review-source-selector-after-focus-390.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

- Spacing and layout: the five tabs no longer divide the entire content width. They occupy one compact content-width control on desktop and one complete single-row control on a 390 px viewport.
- Typography: existing font, weight, labels, and letter spacing are unchanged; every source label remains fully visible without truncation.
- Colors and tokens: the control reuses the review surface, line, blue-soft, and blue tokens. The active state is clear without competing with the page title or source data.
- Responsiveness and accessibility: tabs keep a 38 px mobile tap height, remain non-shrinking, and can horizontally scroll on narrower devices. Focus semantics and reduced-motion behavior remain unchanged.
- Images and assets: this control contains no image or icon assets, so no asset fidelity change applies.
- Copy and behavior: source labels, counts, active source, click handlers, data requests, and review results are unchanged. Counts remain visible on desktop and are hidden on mobile to preserve the compact one-row selector.

## Comparison history

1. The baseline showed full-width desktop tracks and a two-row mobile grid, making each source button visually oversized.
2. The implementation changed only the selector presentation to a compact segmented control with content-sized tabs.
3. Matching desktop and mobile full-view and focused captures confirmed that surrounding review hierarchy, content, and spacing did not shift unexpectedly.

## Validation

- Focused review workbench UI contract test: passed.
- CSS cache version advanced so production browsers cannot retain the previous selector layout.
- No horizontal selector clipping at 1440 px or 390 px; narrower screens retain horizontal touch scrolling.

## Final result

passed

# DreamerQi Strategy Star Evidence And Review Verdict QA - 2026-07-16

## Comparison target

- Source visual truth: the pre-change strategy mainline and prediction-review views rendered from matching realistic fixtures.
- Browser-rendered implementation: the refined star evidence and review verdict hierarchy in `kpl-dashboard_17_apple.html`.
- Desktop viewports: mainline `1440 × 1100`; review `1440 × 1000`.
- Mobile viewport: `390 × 844`.
- States: one expanded confirmed-star mainline, one collapsed expected-star mainline, one confirmed review row, one expected review row, and one mainline-hit row without star evidence.

## Evidence

- Mainline baseline desktop: `/tmp/strategy-star-overall-before-desktop.png`.
- Mainline final desktop: `/tmp/strategy-star-overall-after-desktop.png`.
- Mainline desktop comparison: `/tmp/strategy-star-overall-compare-desktop.png`.
- Mainline baseline mobile: `/tmp/strategy-star-overall-before-mobile.png`.
- Mainline final mobile: `/tmp/strategy-star-overall-after-mobile.png`.
- Mainline mobile comparison: `/tmp/strategy-star-overall-compare-mobile.png`.
- Review baseline desktop: `/tmp/strategy-hit-review-before-desktop.png`.
- Review final desktop: `/tmp/strategy-hit-review-after-desktop.png`.
- Review desktop comparison: `/tmp/strategy-hit-review-compare-desktop.png`.
- Review baseline mobile: `/tmp/strategy-hit-review-before-mobile.png`.
- Review final mobile: `/tmp/strategy-hit-review-after-mobile.png`.
- Review mobile comparison: `/tmp/strategy-hit-review-compare-mobile.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

- The mainline card now groups star evidence under a dedicated header, summarizes confirmed and expected counts, and exposes each stock's active, passive, and combined L2 ratios without opening another surface.
- Confirmed star evidence uses the existing red confirmation language; expected star evidence uses amber and remains visibly provisional. The two states are not collapsed into a generic star treatment.
- Prediction-review card surfaces describe star evidence, while the internal gold `主线命中` / `进入前三` verdict badges describe the later after-market result. A hit without star evidence therefore stays visually neutral instead of receiving a false confirmed-star card background.
- Confirmed-star-plus-hit and expected-star-plus-hit states remain legible as two simultaneous facts, rather than one overloaded color state.
- Desktop and mobile captures show no page, title, star-row, or review-row horizontal overflow; long labels wrap without shifting fixed score controls.
- Strategy ranking, L2 thresholds, expected-to-confirmed transition, mainline hit calculation, permissions, APIs, and data sources are unchanged.

## Validation

- Inline dashboard script compilation: passed.
- Focused mainline review, two-source strategy, and QI mainline-state tests: passed.
- New regression assertions lock the star evidence header, three visible L2 ratios, confirmed/expected count summary, and independent mainline-hit wording.
- Full repository suite: `40/40` test files passed.
- `git diff --check`: passed.
- Isolated previews returned only expected unrelated static-asset `404` requests; strategy rendering and interaction were unaffected.

## Final result

passed

# DreamerQi Strategy Review Star Card QA - 2026-07-16

## Comparison target

- Source visual truth: the pre-change `kpl-dashboard_17_apple.html` prediction-review rows rendered from the same three-row strategy fixture.
- Browser-rendered implementation: the refined prediction-review rows in `kpl-dashboard_17_apple.html`.
- Desktop viewport: `1440 × 1000`.
- Mobile viewport: `390 × 844`.
- State: one confirmed-star row, one expected-star row, and one neutral row, with identical dates, themes, hit states, stocks, and return metrics before and after.

## Evidence

- Baseline desktop: `/tmp/strategy-review-star-before-desktop.png`.
- Final desktop: `/tmp/strategy-review-star-after-desktop.png`.
- Desktop same-state comparison: `/tmp/strategy-review-star-compare-desktop.png`.
- Baseline mobile: `/tmp/strategy-review-star-before-mobile.png`.
- Final mobile: `/tmp/strategy-review-star-after-mobile.png`.
- Mobile same-state comparison: `/tmp/strategy-review-star-compare-mobile.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

- Confirmed stars use a restrained red rail, surface tint, and grouped `明星确认 + 股票名` signal so the final state is immediately identifiable without relying on the smaller detail label.
- Expected stars use a separate amber rail, surface tint, and grouped `预期明星 + 股票名` signal; the treatment remains visibly provisional and cannot be confused with confirmation.
- The existing hit result, actual after-market family, next-day high/close, three-day return, and expected-to-sealed result retain their original positions and meanings.
- Neutral rows remain visually unchanged, so emphasis is limited to records that actually contain confirmed or expected star evidence.
- On mobile, date and star stage form the first scan line, while the prediction result and performance metrics wrap below without horizontal overflow.
- The card uses the existing strategy palette, typography, 6–8 px radii, borders, and compact density; no new asset, icon system, or nested card structure was introduced.
- Strategy data, ranking, hit determination, expected-star conversion, return calculations, permissions, and API behavior are unchanged.

## Iteration history

1. Captured matching desktop and mobile baselines before implementation.
2. Added row-level confirmed/expected states and a compact stock-aware stage signal.
3. Compared before and after screenshots side by side using identical content and viewport sizes.
4. Verified the signal grouping, responsive wrapping, and unchanged neutral row before running the complete regression suite.

## Validation

- Desktop: `3` rows, confirmed rows `1`, expected rows `1`, no page or review overflow.
- Mobile: `3` rows, confirmed rows `1`, expected rows `1`, no page or review overflow.
- Inline dashboard script compilation: passed.
- Focused review and two-source strategy tests: passed.
- Full repository suite: `40/40` test files passed.
- `git diff --check`: passed.
- The isolated preview reported six expected unrelated static-asset `404` requests; review rendering and layout were unaffected.

## Final result

passed

# DreamerQi Strategy Mainline Card Refinement QA - 2026-07-16

## Comparison target

- Source visual truth: the pre-change `kpl-dashboard_17_apple.html` mainline card rendered with the same realistic two-source strategy fixture used for the implementation capture.
- Browser-rendered implementation: the refined `kpl-dashboard_17_apple.html` mainline card.
- Desktop viewport: `1440 × 1100`.
- Mobile viewport: `390 × 844`.
- State: strategy view, admin controls visible, two source columns present, first card expanded, second card collapsed.
- Implementation path: `kpl-dashboard_17_apple.html`.

## Evidence

- Baseline desktop: `/tmp/strategy-card-before-desktop.png`.
- Final desktop: `/tmp/strategy-card-after-desktop.png`.
- Desktop same-state comparison: `/tmp/strategy-card-compare-desktop.png`.
- Baseline mobile: `/tmp/strategy-card-before-mobile.png`.
- Final mobile: `/tmp/strategy-card-after-mobile.png`.
- Mobile same-state comparison: `/tmp/strategy-card-compare-mobile.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

- Header hierarchy: board name, board gain, and source-specific fund flow now form one scan line. Source labels remain explicit, and legacy Eastmoney values are named `东财主力（旧口径）` rather than the ambiguous former label.
- Supporting metrics: the former mixed four-cell strip is now a compact and stable `涨停 / 大涨 / 冲板 / 共振` row; gain and fund flow are not duplicated there.
- Expanded hierarchy: detail content is grouped into strength breakdown, current leader, listing rationale, leader candidates, and market evidence. Repeated summary metrics were removed from the expanded state.
- Candidate comparison: desktop candidate rows use a three-column grid; mobile keeps one candidate per row. The full scoring definition remains available in the title while visible helper copy is shorter.
- Density: expanded details reduced from `775 px` to `630 px` on desktop and from `1181 px` to `1019 px` on mobile with the same fixture and state.
- Responsive behavior: both viewports report no horizontal overflow and no title overflow. Long board names and fund labels can wrap without resizing the score controls.
- Data transparency: the compact fund metric retains the representative board, source, metric, and single-board aggregation definition in its tooltip.
- Logic safety: no strategy calculation, ranking, L2 state, confirmation action, permissions, API request, or source-selection behavior changed.

## Iteration history

1. Captured the current desktop and mobile card states before implementation.
2. Moved gain and fund flow beside the board name, compressed support metrics, and reorganized expanded details.
3. Compared before and after screenshots side by side at matching viewports and states.
4. Restored the source and single-board fund-flow explanation in the compact metric tooltip after a data-transparency regression check.

## Validation

- Inline dashboard script compilation: passed.
- Focused strategy tests: passed.
- Full repository suite: `40/40` test files passed.
- `git diff --check`: passed.
- Local isolated preview returned expected unrelated `404` requests because only strategy endpoints were mocked; card rendering, interaction, layout, and script execution were unaffected.

## Final result

passed
