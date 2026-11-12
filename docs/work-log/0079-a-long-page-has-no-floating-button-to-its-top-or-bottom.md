# 0079. A long page has no floating button to its top or bottom

- Date: 2026-11-12

## Context

A floating button on long public pages, an article above all, was proposed to jump straight
to the top or the bottom of the page. No issue asked for it, and no reader request or
complaint was found in the issues or the design project.

The way back up is already designed. The public header is `position: sticky`
(`app/components/app-header/_styles.module.css`); in Chrome it hides while the page scrolls
down and comes back on the first scroll up, with the navigation, on every page (design 10,
log 0054). Safari and Firefox don't support the `scroll-state` query, and there the header
never leaves the top. The platforms add their own: a tap on the status bar in iOS, Home and
End on a keyboard.

The article screen (design 12a) has no such button. The end of an article holds the tags and
the site footer, which nobody jumps to.

## Outcome

The website has no floating button to the top or the bottom of a page. The sticky header is
the way back to the navigation.

## What follows

A reason to revisit is evidence from readers: pages long enough that the returning header
doesn't serve them, or a request for it. A button that appears only once the page has
scrolled would need the `scroll-state` query too, so it would show only in Chrome, the one
browser where the header already comes back on its own. Any new floating control on a phone
goes to the design project first (`docs/_design-project.md`).

## Turned down

- **Both buttons, top and bottom.** The bottom half is symmetry: the end of an article has no
  destination a reader wants.
- **Only the top button.** It repeats what the header gives, and on a phone it covers the text
  and competes with the gallery viewer and the archive's sticky year bar.
- **A jump to the gallery.** That is an anchor inside the article, not a page control, and a
  separate proposal.
