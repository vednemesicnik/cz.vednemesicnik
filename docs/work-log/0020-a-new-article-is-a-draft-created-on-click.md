# 0020. A new article is a draft created on click, not a page

- Date: 2026-10-15
- Issues: #667
- Later: 0039

## Context

Today *Nový článek* opens `/administration/articles/add-article`, a form that creates nothing
until *Přidat*. The redesigned editor saves as it goes (design 24e) and uploads each image as
soon as it is chosen (24b). Both need a record to save into before the author has typed
anything.

The design proposed that *Nový článek* is an action that creates the draft and opens it, that
`add-article` goes away (`r1lh527v`, 27 Sep 2026), and that an empty draft disappears again
(`1pdzkd57`). What has an address is a product and architecture call, not a design answer
([0016](0016-records-are-added-and-edited-on-their-own-page.md)). So the app decides it here.

## Outcome

*Nový článek* submits a POST. The server creates a draft owned by the author and redirects to
the article's edit page. The article has no page for adding; `add-article` redirects to the
article list.

A draft that has never had a title, text or image is empty: `Article.firstContentAt` is null
until the first save with content. A draft that was filled and later cleared is not empty,
because its *Vytvořeno* is already in the history. An empty draft has no public address. It is
deleted when its edit lock ends ([0019](0019-the-edit-lock-lives-on-the-content-row.md)), and a
sweep deletes empty drafts older than a day whose lock is free. An empty draft never shows in
the lists, the counts, the history, the public preview or the sitemap. *Vytvořeno* is written
with the first content.

## What follows

- The address of a new article is its id from the first moment, so a shared link or a reload
  opens the same draft.
- `Article.slug` is nullable and unique: a draft without an address stores none, and the public
  queries leave such drafts out. Submitting and publishing still require one (23h).
- Every save that can bring the first content sets `firstContentAt` in its own write and logs
  `create` when it is the one that set it; today that is `updateArticle`, later the autosave and
  the image upload.
- No scheduler exists yet (#391), so the sweep runs on every *Nový článek*. A draft that is open
  in an editor without a lock for more than a day can be swept; the lock (#669) closes that.
- The sweep deletes the draft's history rows too: an empty draft leaves nothing behind.
- The issue (26c) and the episode (27d) are drawn the same way. They adopt this entry in their
  own redesigns, together with their own migrations.
- Records, as 0016 defines them (categories, tags, authors, users), still have their `…/new`
  page. A *Dokument* creates its draft on click.

## Turned down

- **Keep `add-article` and create the draft on the first save.** Images chosen before the first
  save would have nowhere to upload, and the address would change after the first keystroke.
- **A GET to `…/new` that creates the draft.** A prefetch, a crawler or a reload would create
  drafts. Creating something takes a POST.
