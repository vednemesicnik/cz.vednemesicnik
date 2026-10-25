# 0045. The phone page gutter is 16 px, from one token

- Date: 2026-10-25

## Context

On a phone the administration put its content 24 px from the screen's edge (`AdminPage`
since #538), but the top bar and the footer use 16 px. The drawings use 16 px on every
signed-in page: 22g for the tabs (y4xlt5au) and the footer (tyxr2jqk), and 32 for the
filters, the rows and the sticky bar. #818 left the folded rows on the 24 px gutter so their
text lined up with the filters (0044). Moving everything to 16 px was the follow-up.

## Outcome

- `--admin-page-side-padding` is the page gutter at every width: 32 px from 768 px, 16 px
  below.
- `AdminPage`, the breadcrumbs and the footer read it.
- Anything that runs past the gutter to the screen's edges bleeds and pads by the same token:
  the folding table and its rows and year headings, `ListActionBar`, the article tabs, and the
  article editor's phone bar.
- The vertical 24 px on a phone (the page's padding and row gap) is unchanged.

## What follows

- A phone element that runs edge to edge uses `calc(-1 * var(--admin-page-side-padding))`
  and never a literal, so the gutter stays one value.
- The top bar keeps its own 16 px. It is the same number, but the bar is drawn on its own
  and it does not sit inside the page.
