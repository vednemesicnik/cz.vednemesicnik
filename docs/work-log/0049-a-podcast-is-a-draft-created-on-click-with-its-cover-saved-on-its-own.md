# 0049. A podcast is a draft created on click, its cover saves on its own, and an empty address stays empty

- Date: 2026-10-28
- Issues: #836, PR #849

## Context

Adding a podcast was a button-saved form. The cover was required up front, so a draft could not
exist before its artwork did, and nothing was checked at submit. Design 27e (r1lh527v) draws the
podcast editor after the issue's (26c) and the episode's (27d). [0036](0036-a-delete-waits-for-every-open-editor.md)
ordered the edit hold "the episode in 27d, and podcast, category and tag after it". The first PR
of #836 (#849) moved the podcast's address to `publishedSlug`
([0039](0039-a-public-address-is-unique-only-once-published.md)) and put the edit hold and the
27i check on its transitions. This entry is about the editor.

## Outcome

- ***Nový podcast* creates a draft and opens its editor**, which saves as it goes under the
  edit hold ([0020](0020-a-new-article-is-a-draft-created-on-click.md),
  [0019](0019-the-edit-lock-lives-on-the-content-row.md)–[0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md)).
  A title, a description or a cover ends the empty draft. The address alone does not, as the
  episode's number does not ([0048](0048-an-episode-is-a-draft-with-the-next-number-unique-only-once-published.md)).
  An empty podcast draft has no page, so *Nová epizoda* refuses it, and its sweep and its
  hold's end delete it alone.
- **An empty address stays empty.** 27i (2whigbz5) asks for it at submit, so a save does not
  fill it from the title. That is the opposite of 0048's choice for the episode, and on purpose.
  The editor's address still follows the title until it is touched.
- **The cover saves on its own as it is picked** ([0029](0029-an-admin-upload-stays-on-fetch-and-can-be-cancelled-until-it-saves.md)),
  up to 5 MB, with 40 MP refused after the upload (4al3quzt). It is replaced, never removed:
  episodes without their own take it over, and 27i requires it at submit.
- **The drop field serves the issue and the podcast, and one upload hook the episode and the
  podcast.** `FileDropField` and `FailedFile` live in `app/components/`, and `useCoverUpload`
  in `app/hooks/`; the issue keeps its own upload hook, which cancels. #712 (the upload row and
  *Zrušit*) changes the hook once for both podcast covers.
- **A refusal can name another content's editor.** A podcast's delete waits for its own editor
  and for an editor of one of its empty episode drafts. `EditHeldRefusal.content` says which, so
  the toast names the right editor (0036).

## What follows

- The category and tag editors are next in 0036's order. They are *Záznamy*, saved with a button
  (0039), so they may simply refuse a taken address instead.
- The podcast's detail has no *Převzít úpravu…*: the podcast's actions are the taxonomy set.
  The Coordinator keeps *Upravit*, and the editor's takeover dialog asks. A shared action for it
  would be a reason to revisit this.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **Filling an empty address from the title at the save**, as 0048 does for the episode. 27i
  draws the missing address in the list, and a filled one would keep the dialog silent about why.
- **A shared server-side cover save across the episode and the podcast.** The two write different
  rows through Prisma, and the podcast's has no removal. The client hook is shared, the server
  code is not.
