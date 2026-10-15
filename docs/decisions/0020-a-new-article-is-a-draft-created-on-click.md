# 0020. A new article is a draft created on click, not a page

- Status: Accepted
- Date: 2026-10-15
- Issues: #667

## Context

Today *Nový článek* opens `/administration/articles/add-article`, a form that creates nothing
until *Přidat*. The redesigned editor saves as it goes (design 24e) and uploads each image as
soon as it is chosen (24b). Both need a record to save into before the author has typed
anything.

The design proposed that *Nový článek* is an action that creates the draft and opens it, that
`add-article` goes away (`r1lh527v`, 27 Sep 2026), and that an empty draft disappears again
(`1pdzkd57`). What has an address is a product and architecture call, not a design answer
([0016](0016-records-are-added-and-edited-on-their-own-page.md)). So the app decides it here.

## Decision

*Nový článek* submits a POST. The server creates a draft owned by the author and redirects to
`/administration/articles/{articleId}/edit`. The article has no page for adding;
`add-article` redirects to the article list.

A draft with no title, text or image is empty. An empty draft has no public address. It is
deleted when its edit lock ends ([0019](0019-the-edit-lock-lives-on-the-content-row.md)), and a
server sweep deletes empty drafts older than a day. An empty draft never shows in the lists,
the counts, the history, the public preview or the sitemap. *Vytvořeno* is written with the
first content.

## Consequences

- The address of a new article is its id from the first moment, so a shared link or a reload
  opens the same draft.
- Today the slug is required and unique (`prisma/schema.prisma`), so the redesign changes how a
  draft without a title stores its address. Submitting and publishing still require one (23h).
- The sweep deletes the draft's history rows too: an empty draft leaves nothing behind.
- The issue (26c) and the episode (27d) are drawn the same way. They adopt this record in their
  own redesigns, together with their own migrations.
- Records, as 0016 defines them (categories, tags, authors, users), still have their `…/new`
  page. A *Dokument* creates its draft on click.

## Alternatives considered

- **Keep `add-article` and create the draft on the first save.** Images chosen before the first
  save would have nowhere to upload, and the address would change after the first keystroke.
- **A GET to `…/new` that creates the draft.** A prefetch, a crawler or a reload would create
  drafts. Creating something takes a POST.
