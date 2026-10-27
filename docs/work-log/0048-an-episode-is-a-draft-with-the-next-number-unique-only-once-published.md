# 0048. An episode is a draft with the next number, unique only once published, and its links save as typed

- Date: 2026-10-27
- Issues: #837, PR #842

## Context

Adding an episode was a button-saved form of three fieldsets. A taken number ended in a generic
error, two people could overwrite each other, and every link label was typed by hand. Design 27d
draws the episode editor as the article's: a draft on click, autosave under the edit hold
([0019](0019-the-edit-lock-lives-on-the-content-row.md)–[0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md)).
[0047](0047-an-episode-address-is-unique-within-its-podcast-once-published.md) left the number on
`@@unique([podcastId, number])` until an autosaving editor would have to save a taken one.

The archive issue went the same way first, but
[0034](0034-a-new-archive-issue-starts-without-a-number-and-the-editor-offers-the-next-free-one.md)
dropped its stored prefill: a December issue created in January would store the wrong year.
Design decided the episode's prefill separately, after 0034 (00l7fuiu, 26 Oct 2026).

## Outcome

- ***Nová epizoda* creates a draft with the next number already in.** It is the highest number
  in the podcast plus one, an archived episode's and a number still held since a publish
  included (`getNextFreeEpisodeNumber`). An empty draft counts for nothing. The draft is empty
  ([0020](0020-a-new-article-is-a-draft-created-on-click.md)) until a save with a title, a
  description or a link. A save of the number alone leaves it empty, and its hold's end deletes
  it.
- **The number is unique only once published, within the podcast.** `number` is the working
  value, nullable and not unique. `publishedNumber` carries `@@unique([podcastId,
  publishedNumber])`. Only publishing writes it, and retract and archive keep it, as
  `publishedSlug` (0047).
- **A draft saves a taken number or address, and the field says so** (27f). The answer of every
  save names the taken values with a free one, which *Použít …* fills and saves. Submit, approve
  and publish refuse them (27h).
- **With a title the episode has an address.** A save without an address stores the title's, so
  27h never has to ask for one.
- **A link's label is derived, not stored as a state.** A label equal to the platform the address
  names (Spotify, Apple Podcasts, YouTube, SoundCloud) follows the address. Any other label was
  changed by hand. An empty label beside a valid address asks for a name.
- **A link saves as typed.** Only a fully empty row is dropped. A link without a label or with an
  address that is not `http://` or `https://` saves, and the editor shows it at the field.
  Submit, approve and publish refuse an incomplete link (27h). The links replace the stored set
  on every save, in the editor's order.

## What follows

- **This changes direction from 0047 for the number** (it gets `Later: 0048`). Public reads of
  a published episode by number are unchanged: only a draft saves, so a published episode's
  `number` equals its `publishedNumber`.
- **The stored prefill differs from the issue's offer (0034) on purpose.** Episodes are numbered
  in one sequence without a year to guess, so highest plus one is right in practice, and a taken
  prefill blocks nobody. A podcast numbered in seasons would be a reason to revisit it.
- **A new platform is one host in `get-link-platform.ts`.** Labels already stored keep their text;
  a stored label that now matches a platform reads as filled from the address.
- The cover (27d, the third PR of #837) uploads on its own and ends the empty draft too.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **The issue's offer (0034) for the episode: an empty number and *Použít N*.** It costs a click
  on every episode for a risk the episode does not have.
- **A stored label state column** (`auto` / `manual`). The label and the address already say it;
  a column could disagree with them after an import or a script.
- **Refusing an incomplete link at the save.** A draft would lose what was typed, and 27d draws
  the invalid address saved with the error at its field.
