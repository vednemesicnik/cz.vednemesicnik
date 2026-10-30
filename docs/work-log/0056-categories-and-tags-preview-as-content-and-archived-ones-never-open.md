# 0056. Categories and tags preview as content of their own, and archived ones never open

- Date: 2026-10-30
- Issues: #896

## Context

Log 0055 marked the editorial preview (10d) on articles, podcasts, episodes and issues. It left
categories and tags out: a draft category or tag already showed to whoever may view it in
administration (`getWebContentVisibility`, the default `['draft']`), but with no mark, and its
own page had no bar. 10d says the preview covers the whole web „a stejně pro archivovaný
obsah“. 25b, decided later (15 Oct 2026, a3zejbc1), says of categories and tags that nobody opens
an archived one on the web.

## Outcome

- **A category or tag the reader doesn't see carries 10d's marks** wherever it shows, drawn in
  11e (b04zn65r). The line is the same everywhere; only its position changes: around the
  category card, in place of the edge of a NavRow pill or a `Badge`, and on the edge of a text
  item (tag index, link strip). The grey tag stands only on the category card and on the
  category's or tag's own page.
- **Its own page carries the item bar** (`PreviewEntity` `article_category`, `article_tag`) with
  *Zobrazit v administraci*. It wins over the list bar, as an unpublished podcast's page does.
- **A published article with an unpublished category or tag gets the list bar**, since the page
  holds something the reader doesn't see.
- **Archived categories and tags don't preview.** Their page is a 404 for everyone and their
  badge stays off an article. `visibility.where('article_category' | 'article_tag', …)` keeps the
  default `['draft']`. 25b is later and more specific than 10d's general line, and an archived
  category is withdrawn from the magazine's structure, not a text waiting to be read.

## What follows

- A new place that shows a category or tag spreads `WEB_PREVIEW_STATE_SELECT` into its select,
  maps it with `withWebPreviewState`, and adds the item to its page's `getListPreview`.
- Ordering and counts are unchanged: categories and tags sort by name, so a preview stays in its
  place, and *N článků* counts what the viewer may see.
- If the editorial staff ever need to check an archived category on the web, previewing it means
  widening the `where` to `['draft', 'archived']` on every taxonomy select at once. One place
  alone would show a badge that leads to a 404.
- This replaces 0055's line that categories and tags are out of 10d's marks.
