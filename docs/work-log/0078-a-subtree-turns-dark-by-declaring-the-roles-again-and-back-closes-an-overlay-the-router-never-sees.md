# 0078. A subtree turns dark by declaring the roles again, and Back closes an overlay the router never sees

- Date: 2026-11-11
- Issues: #1022

## Context

The article gallery's image viewer (#1022, design 12b, `zn43av9y`) fills the window on a
near-black backdrop and is dark on the light site too. Two things it needed had no precedent in
the app.

**Dark on the light site.** The semantic roles are `light-dark()` on `:root`
(`app/styles/semantic-tokens.css`). In dev, `color-scheme: dark` on an element would flip them
inside it. The production build doesn't: lightningcss lowers every role to
`var(--lightningcss-light, …) var(--lightningcss-dark, …)`, and a custom property resolves its
`var()` where it is declared. Every element then inherits the role already resolved for the
page's scheme (`build/client/assets/root-*.css`). Setting `color-scheme: dark` on the viewer
alone changed nothing there.

**Back closes the viewer.** Readers expect Back to close a full-window overlay, not to leave the
page under it. React Router listens to `popstate` on `window`
(`react-router/dist/development/lib/router/history.js`). A pop it sees at the same URL is a POP
navigation, so the router would run the article's loaders again.

## Outcome

- **`[data-color-scheme="dark"]` makes a subtree dark.** `semantic-tokens.css` declares the
  roles on `:root, [data-color-scheme="dark"]`, and `global.css` sets `color-scheme: dark` on
  the attribute in CSS source. The build lowers that into the `--lightningcss-*` toggles on the
  element, and the roles declared again there resolve dark for everything inside, Tooltip
  bubbles included. The image viewer is the first user.
- **An overlay that Back closes pushes one history entry the router never sees**
  (`app/hooks/use-viewer-history.ts`). Opening pushes an entry with the same URL that carries
  React Router's own `history.state` plus a marker. `popStateGuard`
  (`app/utils/history/popstate-guard.ts`) stops the overlay's pops before the router's listener.
  Back closes the overlay. Any other close steps back over the entry, so the next Back leaves the
  page as before.
- **The guard is installed in `entry.client.tsx`, before hydration.** At the `window` target,
  Chrome runs `popstate` listeners in the order they were added, the capture phase included. A
  capture-phase listener the viewer added on mount still ran after the router's, and the router
  reloaded the article (a `.data` request on Back). Only a listener added before the router is
  created comes first.

## What follows

- Another overlay that should close on Back (a full-screen menu, a lightbox elsewhere) can use
  `useViewerHistory` as it is.
- A part of a page that must keep a scheme opposite to the site takes `data-color-scheme`. It
  works for `dark` only. A light island would need `[data-color-scheme="light"]` added the same
  way in both files.
- Navigating away from the open viewer through a link in its caption leaves the viewer's entry
  in history. Back from the next page then lands on it, and the step after reruns the article's
  loader once. Nobody has hit this; revisit it if it shows.

## Turned down

- **A hash per open viewer (`#galerie`)**: the router handles a hash-only change without loaders,
  but design decided the address doesn't change (12b).
- **Letting the router see the pop and skipping the reload with `shouldRevalidate`**: it touches
  the article route for an overlay's sake, and `shouldRevalidate` is called more than once per
  revalidation in React Router 8.
- **Writing the viewer's dark values by hand**: a second copy of the dark map, which would drift
  from the design system's.
