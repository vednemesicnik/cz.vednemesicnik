# 0036. A delete waits for every open editor, one's own included, and an editor whose content was deleted says so

- Status: Accepted
- Date: 2026-10-22
- Issues: #756

## Context

The edit hold ([0019](0019-the-edit-lock-lives-on-the-content-row.md),
[0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)) already stopped
**someone else** from deleting an article or an archive issue: `deleteRow` repeated
`buildNotHeldByOthersWhere` in its own conditional delete. Design 07g lets one's own hold
through: one's own hold, in any tab, never blocks one's own actions.

That left two ways for an open editor to lose its unsent text without a word:

- An author with a draft open in one tab could delete it from the list or the detail in
  another tab. The server allowed it.
- An editor whose row was gone never learned it. This happened after the case above, after an
  expired hold (a laptop asleep longer than a hold lasts) and someone else's delete, or after
  the empty-draft sweep (0020). The renewal got a 404 that `useEditHold` read as "no answer".
  Autosave failed again and again, and the save could read the missing row as `not-held` with
  no holder.

Delete is the one action that destroys an editor's unsent work. Publishing, submitting and the
other transitions leave the text in place, so the editor can react to them (0023).

## Decision

- **A delete waits for every open editor, one's own in another tab included.** The article and
  issue delete repeat "the hold is free" (`buildFreeHoldWhere`) in their own conditional write,
  the same write as before (0015, 0019). This narrows 07g, and 0019's "every state transition
  checks that the record is not held by someone else", for delete only, as 0021 narrowed
  0019's "unexpired". Every other transition keeps "not held by someone else", and 0019 stays
  in force otherwise. Time still decides: an expired hold is free.
- **No role gets a "delete anyway".** The Coordinator takes the edit over (24g), leaves the
  editor and deletes from the detail, as 07g already says for every state action.
- **The refusal says whose editor it is.** The held refusal carries `isOwnOtherTab` next to
  `heldByName`. The detail and the list show a toast for one's own tab
  (`getOwnOtherTabDeleteRefusal`). The detail knows its own hold when it loads and does not open
  the confirmation (23g, 26i). A bulk delete counts the row as skipped.
- **A missing row is a typed `deleted`, not a 404.** Take, renew, release and take over answer
  `{ status: 'deleted' }`, and the save answers it with a 410. Nothing is checked before the
  answer, so it says no more than the 404 did. This narrows 0015's 404 for a missing record to
  the article and issue autosave and hold routes; a record the author may not view keeps
  0015's answer.
- **`deleted` is final.** `useEditHold` stops asking. The editor turns read-only and shows the
  dialog (`ContentDeletedDialog`), the line *smazáno* and a warning. The article keeps its text
  to copy, the issue its values in the fields (24k, 26m). The editor never takes the hold
  again and never re-creates the content. It also learns from the content's `delete` event
  (0035).

## Consequences

- 0019 is not rewritten (an accepted record never is), so its consequence lives here:
  every content type that gets the edit hold (the episode in 27d, and podcast, category and
  tag after it) repeats `buildFreeHoldWhere` in its delete and `buildNotHeldByOthersWhere` in
  its other transitions, and answers `deleted` from its hold and save routes.
- A crashed browser's hold blocks one's own delete until it expires, about 2 minutes. *Upravit*
  → *Upravovat tady* → *Zavřít* releases it at once.
- Once an editor knows its content is gone, it must not revalidate its own loader: the loader
  is a 404 then. An upload under way therefore ends without the cancel's removal and reload
  (`abandon` in the issue editor).
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **Keep 07g for delete and only tell the editor afterwards.** The unsent text would still be
  lost, just with an explanation.
- **A Coordinator override that deletes over a live hold.** It would bring back the same loss
  for the editor and add a power that 07g's takeover already covers.
- **Answer `deleted` only when the author may still view the row.** A missing row has no
  permission target, and the 404 it replaces was answered before any check.
