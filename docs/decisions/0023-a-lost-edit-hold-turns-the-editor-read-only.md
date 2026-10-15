# 0023. A lost edit hold turns the editor read-only, and the edit comes back only through a reload

- Status: Accepted
- Date: 2026-10-15
- Issues: #671, #667

## Context

The edit hold (decisions [0019](0019-the-edit-lock-lives-on-the-content-row.md) and
[0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)) can leave an
open editor in two ways:

- the Coordinator or one's own other tab takes it over (24g, 24h);
- it expires while the editor is away, and someone else takes it, saves, or both (24i).

Autosave ([0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md)) saves only
from the holding tab, so the server refuses whatever that editor had not sent yet. Until #671
the editor said one sentence and stopped autosave for good. Unsent changes went without a word,
and an editor that had only been away could not get the edit back without a manual reload. The
issue (26c) and episode (27d) editors will meet the same situations.

Three things had to be settled:

- what such an editor may still do;
- what happens to the changes it could not send;
- how it gets the edit back. 0021 makes the tab id live for one page load, so a hold taken
  before a reload would meet itself "in another tab" afterwards.

## Decision

- **A lost hold makes the editor read-only, for good.** Autosave stops, and the fields grey out
  without the text toolbar or the buttons that change something. The text does not update
  live. The editor keeps asking who holds the content, through the renewal it already sends (a
  renewal from a tab without the hold writes nothing), so it can say who edits it now and when
  the content is free again.
- **Unsent changes stay in memory only, and the editor says so.** When the hold goes elsewhere,
  the editor waits for a save on its way and then knows whether anything stayed unsent. Only an
  editor that provably had nothing waiting says all is saved. Otherwise it says some changes did
  not make it and offers the whole text to copy, until the page goes. No action that reloads the
  content asks again, and neither does the browser's dialog.
- **The edit comes back only through a reload.** *Pokračovat v úpravě* and *Načíst aktuální
  verzi* reload the page, and the new page load takes the hold as any editor does. If someone
  was faster, it shows what any editor shows then (24g, 23g). The tab id still dies with the
  page (0021).
- **The one silent way back is an expiry with nothing saved meanwhile (24i).** When the hold
  was free and the content unchanged since the editor's own last save, the editor takes it
  again and sends what waited. A take carries that last save (0021), and the server answers
  `changed` over a newer one, with who holds it now and whether it is still an editable draft.
- **24h or 24i is decided by data.** The editor shows *Článek se mezitím změnil* (24i) when the
  content changed since its own last save **and** the editor heard nothing from the server for
  longer than a hold lasts. Every other loss is a takeover, *Úpravu přebírá …* (24h).

## Consequences

- The issue and episode editors (26c, 27d) reuse `useEditHold`'s `lost` and `changed` states
  and autosave's `stop`. They offer the same copy of their main text, or name what it cannot
  rescue.
- An editor never writes over text it has not seen. The only take without a reload is the 24i
  one, guarded by the content's last save.
- Changed meanwhile with nothing unsent, the editor shows no 24i dialog: there is nothing to
  rescue. It offers *Pokračovat v úpravě* while the content is free. Design is asked to confirm
  this (`/ask-design` after #671).
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **Take the hold first, then reload**, as 24h literally says. The reloaded page has a new tab
  id and would meet its own hold "in another tab" (0021). Handing the id over through
  `sessionStorage` for one reload would bring back the duplicated-tab problem 0021 rules out.
- **Keep editing and merge later.** Out of scope for the epic. The author gets the whole text
  to the clipboard instead.
- **Reload quietly when the content changed and nothing was lost.** It replaces the text in
  front of the author without a word. A page load that meets a newer save could also reload
  again and again; the first take's ten-second guard exists for that.
