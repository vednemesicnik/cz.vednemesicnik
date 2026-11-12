# 0080. Pages cross-fade through React's ViewTransition, keyed by their address, and a list's image flies only on the click that chose it

- Date: 2026-11-12
- Issues: #1043

## Context

Design 18 (u6r1pxsx) decided that a navigation cross-fades the page in place in 200 ms. In
four pairs the clicked image flies to its place on the new page on the gallery's spring: the
article row, the home page's main article, the podcast tile and the latest-episode row. Nothing
flies back.

Before this, every link set React Router's `viewTransition`, which React Router 8 deprecates in
favour of React's `<ViewTransition>` (React 19.3). The React source
(`react-dom-client.development.js`) decided the shape of the replacement:

- **A boundary that updates moves its group** from the old box to the new one. Around the outlet,
  a list scrolled down would slide by its scroll offset.
- **An exiting and an entering boundary each stay where they are**, and named boundaries inside
  an exiting subtree still pair with the ones that appear (`commitDeletedPairViewTransitions`).
- **React hands out no transition object**, and it waits up to 500 ms for an incoming `<img>`
  without `onLoad`. `Image` sets `onLoad`, so nothing waits.
- **The router loads Back and Forward in a transition too**, so React animates them. Its docs
  say it skips them.

## Outcome

- **`PageTransition` wraps the outlet**, in the website's layout and in both administration
  layouts. It is keyed by the address, `pathname + search` on the website and `pathname` in the
  administration, where a list's filters write the search and a remount would take the focus out
  of the field.
  - The old page exits and the new one enters, each in place.
  - A change at the same address (data reloaded after an action) has `update="none"`.
  - A POP navigation is skipped as it starts.
- **`PageFlight` names an image at either end.**
  - The list's images carry permanent unique names (`getPageFlightName`, e.g.
    `article-image-<id>`).
  - The page's image carries one only while `pageFlightStore` holds a flight for it.
  - A click listener (`startPageFlight`) starts that flight when the image has loaded, at least
    half of it is visible below the header and motion isn't reduced.
  - `PageTransition` clears the store when the transition ends, so the page that is left has no
    name to fly back with.
- **Skipping finishes every `::view-transition` animation** (`skipViewTransition`), the list React
  itself walks, on a press, a key, the wheel or a touch.
- **The new page's image first shows the list's file** (`Image`'s `fallbackSource`), as the
  gallery does.
- **The spring is a token**, `--spring-easing` and `--spring-duration` in `global.css`, which the
  gallery uses too.

## What follows

- **A new list-to-page pair** gets a name from `getPageFlightName`, `PageFlight` at both ends, a
  `data-page-flight` mark with its kind on the link or the frame, and a corner rule per kind in
  `global.css`.
- **Keying by the address remounts the route tree** on every new address. State that should
  survive a change of search on the website would need the key narrowed, as the administration
  did.
- **`runWithViewTransition` and `runViewerTransition` still call the API themselves.** They are
  updates inside one page, which React doesn't start.

## Turned down

- **React Router's `viewTransition` with names set by hand**: deprecated, it replays the
  transition on POP (`router.js`), and running it beside React's boundaries interrupts both.
- **One boundary around the outlet that updates**: it slides the page by the scroll offset.
- **Transition types for the direction**: the router starts the navigation's transition itself,
  after its loaders, where `addTransitionType` can't reach.
