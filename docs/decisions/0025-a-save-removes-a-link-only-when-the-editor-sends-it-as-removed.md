# 0025. A save removes a category or tag link only when the editor sends it as removed

- Status: Accepted
- Date: 2026-10-15
- Issues: #672, #667

## Context

The article editor offered only published categories and tags, and a save set the article's
links to exactly what the form sent (`updateArticle`, `categories: { set: categoryIds }`). An
archived category the article had was never offered, so it was never sent, and any save
dropped it silently, even one that only fixed a typo. Design answered `iq3nur0e` (drawn in
24a): an archived category or tag the article has stays, greyed and marked, until someone
removes it, and the server keeps it unless the editor sends it as removed.

The save sends the whole form ([0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md)),
so "what the form leaves out" cannot mean "removed" for links the form never showed.

## Decision

A save sets an article's categories to the stored ones minus those the editor sends as
removed, plus those it sends as picked (`mergeLinkedIds`, `app/utils/merge-linked-ids.ts`);
tags the same. The editor sends as removed every link it had at open or picked since and no
longer has (`removedCategoryIds`, `removedTagIds`). A picked id that names nothing is left out.
The server reads the stored links, never the form's idea of them
([0015](0015-edits-check-the-stored-record-not-the-form.md)).

## Consequences

- A link the editor never showed survives any save: an archived or a retracted category, or
  one linked by a newer version of the editor. The public pages hide it by its state, so a
  restored and republished category shows on the article again.
- Re-ticking an archived category that was just unticked links it again: the server accepts any
  existing id it is sent as picked. The editor offers archived ones only when the article had
  them at open, so this is the undo of 24a, not a way to add archived records.
- The issue (26c) and episode (27d) editors, and any other editor of many-to-many links, follow
  the same shape when they are rebuilt.
- Revisit if a link ever carries data of its own (an order, a role): then a removed list is not
  enough and the link needs its own rows in the form.
- The editor and its saves are described in
  [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **Send the ids the editor showed, and change only those.** Equivalent on the server, but the
  form would carry every offered tag on every save, which grows with the tag list and counts
  against the `keepalive` budget of the leave save (0022).
- **Keep every stored link that is not published.** Simpler, but then unticking an archived
  category could never remove it, which the design requires.
