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
  - The administration keeps a cross-fade on navigation through the same boundary. Its links
    lost the legacy prop with `BaseLink`, and one mechanism in the app beats two. The cross-fade
    is now 200 ms, honours reduced motion, skips Back and Forward, and also runs on a redirect
    after an action.
- **`PageFlight` names an image at either end.**
  - Both ends carry permanent unique names (`getPageFlightName`, e.g. `article-image-<id>`).
    React tracks a name by the one a boundary mounted with, so a name taken away and given back
    reads as a duplicate.
  - Both ends have a share class only while `pageFlightStore` holds a flight for that name, and
    decline to pair otherwise. Two lists showing the same article (the home page and Articles)
    would otherwise fly their images between them on every navigation.
  - A click listener (`startPageFlight`) starts that flight when the image has loaded, at least
    half of it is visible below the header and motion isn't reduced. The click comes before the
    router commits, so the clicked end re-renders with its class in time.
  - `PageTransition` clears the store when the transition ends, so the page that is left declines
    to fly back.
- **The header has a name of its own during a page transition**, shown only in its new state,
  so the old page's top, which was under it, doesn't show through it. A header hidden on the
  list stays hidden on the new page, as before: the header's scroll-state query doesn't count
  the router's scroll to the top. So the case 18a draws, a hidden header fading in, doesn't come
  up.
- **Skipping uses `document.activeViewTransition.skipTransition()`**, and where a browser hasn't
  got it, finishes every `::view-transition` animation, the list React itself walks. It runs on
  a press, a key, the wheel or a touch. A press is handed on (`handOnPress`) at the next frame:
  right after the skip, the point still hits the old page.
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
