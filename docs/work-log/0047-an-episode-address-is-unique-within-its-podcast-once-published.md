# 0047. An episode's address is unique within its podcast once published, ahead of its editor

- Date: 2026-10-26
- Issues: #830

## Context

An episode's public address is `/podcasts/:podcastSlug/:episodeSlug`, yet `PodcastEpisode.slug`
was `@unique` across every podcast. A second podcast could not have its own *Úvod*. Creating it
failed with a generic 400 from `throwDbError`, and the only way around it was a suffixed public
URL. Design 27f decided that the address is unique within its podcast (5hl7vx3a).
[0039](0039-a-public-address-is-unique-only-once-published.md) planned episodes to follow the
article's published-value rule "when their editor is rebuilt (27d)", with `publishedNumber` per
podcast and `publishedSlug`.

## Outcome

- **The episode's address follows 0039 now, scoped to its podcast.** `PodcastEpisode.publishedSlug`
  is unique together with `podcastId`. The working `slug` is not unique, and two drafts, or a
  draft and a published episode, may share it.
- **Only publishing writes it.** It is written in one transaction with the state change. A unique
  violation comes back as a missing item. Retract, archive and restore keep it. Deleting the
  episode frees it.
- **Submit, approve and publish only check.** A slug that another episode of the podcast holds as
  published refuses all three. The 27h dialog says *Adresa je obsazená.*, after the
  unpublished-podcast sentence of 27f. An approval still passes in an unpublished podcast.
- **Public reads by address go through `publishedSlug`**: the episode page, the sitemap and
  `/links`. The episode page takes a draft's preview by its id (`?id=`), as the article page
  does. The public lists, which show a signed-in author's drafts too, link by the typed slug.

## What follows

- **This changes direction from 0039 in part** (it gets `Later: 0047`). The address no longer
  waits for the 27d editor. The episode number stays `@@unique([podcastId, number])` on its
  working column. It moves to `publishedNumber` only when the autosaving editor (27d) has to save
  a taken number. The button-saved form today may refuse it.
- **The 27d editor brings the field error** (`useTakenValues`) for a taken address. 27f's drawn
  message (*Změna adresy se neuložila.*, with the holder named) predates 24d. It goes back to
  design before that work.
- **Bulk publishing of episodes (#772) reuses the per-item handlers**, so it refuses a taken
  address without its own check.
- **Writes outside the app must set `publishedSlug`** for a published or archived episode: the
  seed and any script. The migration backfilled published and archived episodes, and drafts that
  were published before.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **Moving only the scope: `@@unique([podcastId, slug])` on the working column now, and
  `publishedSlug` with 27d.** That would migrate the same constraint twice. 0039 had already
  decided where it ends up.
- **Moving the number to `publishedNumber` in the same change.** Nothing needs it before
  autosave. Doing it now would be symmetry with the address, not a need.
