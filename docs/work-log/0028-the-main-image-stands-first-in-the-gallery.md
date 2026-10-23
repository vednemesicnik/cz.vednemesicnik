# 0028. The main image stands first in the gallery, in the editor as on the web

- Date: 2026-10-19
- Issues: PR #706

## Context

The web always opens an article's gallery with the main image, wherever it stands in the
editor's order (`app/routes/articles/article/_loader.ts`, design 12a). Design 24b said that the
order of the tiles is the order on the web. That was true only while the main image was first.
#705 added dragging, and it could put the main image anywhere.

With #706 each tile shows its number, its place on the web (design yj2t50dd). With the main image
anywhere, the editor would number it 3 while the web shows it first.

## Outcome

The main image is always the gallery's first image, in the editor as on the web.

- *Nastavit jako hlavní* moves the image to the first place in the same saved change.
- The main image has no moves, cannot be dragged, and nothing lands before it.
- *Zrušit jako hlavní* leaves the image first, now as an ordinary image that can move.
- The server keeps the rule whatever the request says (`putFeaturedFirst`):
  - `feature` writes the positions with the new main image first, or with the cleared one first;
  - `reorder` puts the stored main image first ([0015](0015-edits-check-the-stored-record-not-the-form.md)).

## What follows

- This narrows 0027's "the order is sent as the list of stored image ids"
  ([0027](0027-each-article-image-saves-on-its-own.md)). The list decides the order of
  everything after the main image.
- Older articles may store the main image elsewhere. The editor's loader lists it first, and the
  next order or main-image change writes it there.
- The issue (26c) and episode (27d) editors do not show a gallery. If a content type ever gets one
  with a main image, it follows the same rule.
- The current state is described in
  [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **The web follows the editor's order exactly, and the main image only marks the sharing
  preview.** This was turned down because it would undo 12a, where the main image opens the
  article's gallery on the web.
- **Numbers that skip the main image, or that count it as 1 wherever it stands.** The numbers
  would not run in order across the grid, and „number = place on the web“ would hold only for
  some tiles.
