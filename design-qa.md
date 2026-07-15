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
