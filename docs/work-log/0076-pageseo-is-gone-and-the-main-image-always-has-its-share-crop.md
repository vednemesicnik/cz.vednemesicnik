# 0076. PageSEO is gone, and the main image always has its share crop

- Date: 2026-11-09
- Issues: #502, #1011

## Context

`PageSEO` was one row per pathname with a title, description, robots value, share image URLs,
the content lifecycle and reviews. It was added in January 2026 for an SEO editor in the
administration. That editor stayed a WIP branch (`page-seo`). From #780 (log
[0039](0039-a-public-address-is-unique-only-once-published.md)), publishing an article upserted a
row at its address. The other transitions, the delete and the gallery saves
([0027](0027-each-article-image-saves-on-its-own.md)) kept that row in step. Nothing read it:
the public article page builds its meta from the article (`app/routes/articles/article/_meta.ts`),
and an edit of a published article left the row stale.

#502 weighed the editor and said no. Content pages take their SEO from their own fields, as the
design decided (24a and 12: the perex is *Shrnutí pro vyhledávače a náhled při sdílení*, and the
share image is the main image). Static pages keep their copy in code, approved by the copywriter,
and #497 adds their descriptions. Nobody on the editorial team asked to edit SEO text.

The 1200×630 `og.jpeg` crop of the main image was made only as a side effect of the PageSEO writes
(`ensureOgImage` in `app/utils/image-store/store-image.server.ts`). The public page links it
without checking that it exists, and a missing crop is a 404.

## Outcome

`PageSEO`, `Review.pageSEOId`, `Author.pageSEOs` and the `page_seo` permission entity are gone,
with every write to them. The migration first deletes any review, or any permission and its role
links, that pointed at them.

The main image always has its share crop. It is made when an image becomes the main one, when the
main image's file is replaced, and on publish (`ensureArticleOgImage`, and `ensureOgImage` in the
upload). A draft gets its crop before publishing, which is also why publish still makes it: it
covers drafts from before this change. A crop that fails in the gallery only logs and never
refuses the editor's change; publish makes it again.

## What follows

- SEO for a page comes from its record's own fields or from `createPageSEO` in its `_meta.ts`.
  An override per page needs a new proposal through `/review-idea`, not this model back.
- A share crop for podcast, episode and issue covers (#496) can follow the same rule: the cover
  makes its crop when it is saved.
- Publishing no longer writes anything beside the article's own row and its published address
  (0039).

## Turned down

- **An SEO editor in the administration** (#502): it would split a page's wording between the
  code and the database, skip the copywriter for static pages, and let one wrong `robots` value
  take a page out of search.
- **Keeping the table for later**: the mirrored rows would look like decisions somebody made
  once something read them, and keys by pathname need a row per language once `/en` (#293)
  lands.
