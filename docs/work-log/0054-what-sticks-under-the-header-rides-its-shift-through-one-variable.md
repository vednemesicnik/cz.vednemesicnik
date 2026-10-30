# 0054. What sticks under the header rides its shift through one variable, in CSS alone

- Date: 2026-10-30
- Issues: #892

## Context

The public header hides while the page scrolls down and comes back on the way up, in pure
CSS: a `scroll-state` container query on `html` translated the header by `-100%`
(`app/components/app-header/_styles.module.css`). Chrome supports the query; Safari and
Firefox don't, and there the header stands. The header's height came from its content
(68.5 px on a phone, 89 px from 768 px) and `--app-header-height` was commented out.

On `/archive` the year row (`NavRow`) scrolled away with the page, so a reader who jumped to a
year scrolled all the way back to pick another. Design answered on 30 Oct 2026 (d104jrnd):
the row stands in a bar that sticks under the header and moves with it, and `NavRow` has one
shape at every width.

## Outcome

- `--app-header-height` is a token in `app/styles/sizes.css` (69 px below 768 px, 89 px from
  768 px), and the header takes it as its `block-size`.
- The `scroll-state` query no longer moves the header. Under the same conditions it sets
  `--app-header-shift` on `body`, below the `html` container and above the header and the
  content: minus the header's height while scrolling down, `0px` on the way up. The header
  reads `translate: 0 var(--app-header-shift, 0)`.
- Anything that sticks under the header uses
  `top: calc(var(--app-header-height) + var(--app-header-shift, 0px))` with the header's
  `0.3s ease` transition, so both move in one transition and never overlap. The archive's year
  bar is the first (`app/routes/archive/_index/_styles.module.css`).
- No JavaScript moves the header or the bar. Where the query doesn't apply (Safari, Firefox,
  reduced motion) the shift is unset, so the header and the bar stand, and they start moving
  without a code change once the browser supports the query.
- `NavRow` has one shape at every width: the visible label, then 44 px pills in one row that
  scrolls sideways only when the items don't fit. The step buttons are the one exception, and
  the pointer decides it, not the width: they show only for `(hover: hover) and (pointer: fine)`,
  because a mouse wheel doesn't scroll a row sideways.

## What follows

- A new sticky element under the public header reads the same two variables, and it needs no
  query of its own.
- The administration top bar still hides through its own `translate` and `--top-bar-height`.
  It moves to the same variable when something sticks under it.
- The archive's current year is measured in JavaScript (`use-current-year.ts`), because only
  the highlight needs it. At the page's end the last year is current: its heading may never
  reach the bar when its covers are shorter than the window. Design's answer is silent on the
  page's end.
- Whether a row overflows is known only after it is measured, so on a page whose row overflows
  the step buttons appear after hydration, with a mouse, and move the pills along by one button.
  Reserving their place would leave empty slots beside a row that fits (the categories on a
  desktop), and laying them over the faded ends would change the drawing; the one-time shift
  inside the row is accepted.
- Reasons to revisit: `scroll-state` landing in Safari and Firefox (nothing to change, only to
  check), or a header whose height changes with its content, which a fixed token would cut off.

## Turned down

- **JavaScript to hide the header or stick the bar** in browsers without the query: the
  product keeps the header in pure CSS and lets those browsers keep it standing (d104jrnd).
- **A `scroll-state(stuck)` query on the bar**: the bar looks the same at the top and stuck,
  so it needs no stuck state, and it looks the same in Safari and Firefox too.
- **A width variant of `NavRow`** (wrapped links on a desktop, pills on a phone): one pattern
  across widths, and the row's content decides whether it scrolls.
- **Scroll markers (`scroll-target-group`, `:target-current`) for the current year**: Chrome
  only, and they still need JavaScript for `aria-current`.
