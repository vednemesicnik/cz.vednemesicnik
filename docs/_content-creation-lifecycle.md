# Content Creation Lifecycle with Roles, Actions, and States

This guide outlines the lifecycle of content items with actions (e.g., create, update, delete, publish, retract, archive, restore) and states (`Draft`, `Published`, `Archived`) based on role permissions.

---

## States

- **Draft**: Content is in progress and not visible to the public.
- **Published**: Content is finalized and visible to the public.
- **Archived**: Content is no longer active but is stored for reference.

---

## Lifecycle Flow

```plaintext
Draft → Published → Archived
            ↓           ↓
         Retract     Restore
            ↓           ↓
          Draft ←──────┘
```

---

## Role-Based Default Actions in Each State

Matches the seeded permission catalog (`prisma/data/author-roles.ts`); the full matrix is in
[_author-roles-and-permissions.md](./_author-roles-and-permissions.md).

| **Role**        | **Action** | **Draft**                 | **Published**                     | **Archived**                       |
|-----------------|------------|---------------------------|-----------------------------------|------------------------------------|
| **Contributor** | **View**   | ✅ Own drafts.             | ✅ Own published content.          | ✅ Own archived content.            |
|                 | **Create** | ✅ Own drafts.             | -                                 | -                                  |
|                 | **Update** | ✅ Own drafts.             | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Own drafts.             | ❌ Cannot delete published content.| ❌ Cannot delete archived content.  |
| **Creator**     | **View**   | ✅ Any draft.              | ✅ Any published content.          | ✅ Own archived content only.       |
|                 | **Create** | ✅ Own drafts.             | -                                 | -                                  |
|                 | **Update** | ✅ Own drafts.             | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Own drafts.             | ❌ Cannot delete published content.| ❌ Cannot delete archived content.  |
| **Coordinator** | **View**   | ✅ Any draft.              | ✅ Any published content.          | ✅ Any archived content.            |
|                 | **Create** | ✅ Any draft.              | -                                 | -                                  |
|                 | **Update** | ✅ Any draft.              | ❌ Published content is read-only. | ❌ Archived content is read-only.   |
|                 | **Delete** | ✅ Any draft.              | ❌ Cannot delete published content.| ✅ Any archived content.            |

Nobody edits published or archived content in place: it is retracted (or restored) to a draft
first.

---

## Role-Based Advanced Actions in Each State

| **Role**        | **Action**  | **Draft**                                                           | **Published**                                          | **Archived**                                          |
|-----------------|-------------|---------------------------------------------------------------------|--------------------------------------------------------|-------------------------------------------------------|
| **Contributor** | **Publish** | ❌ Do not have permission to publish drafts.                         | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      | 
|                 | **Retract** | - Retracting does not apply to drafts.                              | ❌ Do not have permission to retract published content. | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ❌ Do not have permission to archive published content. | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ❌ Do not have permission to restore archived content. |
| **Creator**     | **Publish** | ❌ Submits own drafts for review instead (#590, #627).               | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      |
|                 | **Retract** | - Retracting does not apply to drafts.                              | ✅ Can retract own published content.                   | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ✅ Can archive own published content.                   | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ❌ Do not have permission to restore archived content. |
| **Coordinator** | **Publish** | ✅ Can publish any draft.                                            | - Publishing does not apply to published content.      | - Publishing does not apply to archived content.      |
|                 | **Retract** | - Retracting does not apply to drafts.                              | ✅ Can retract any published content.                   | - Retracting does not apply to archived content.      |
|                 | **Archive** | - Archiving does not apply to drafts.                               | ✅ Can archive any published content.                   | - Archiving does not apply to archived content.       |
|                 | **Restore** | - Restoring does not apply to drafts.                               | - Restoring does not apply to published content.       | ✅ Can restore any archived content.                   |

---


## State with Actions

**Draft**: Can be viewed, created, updated, deleted and published.

**Published**: Can be viewed, retracted and archived. It is not edited in place.

**Archived**: Can be viewed, deleted (Coordinator) and restored (Coordinator). It is not edited in place.

---

## Publish Gating: Review Requirement

Publishing a draft is additionally gated by the review policy. Role levels are inverted
(lower number = higher authority). A draft cannot move `Draft → Published` while **every**
author's role is outside the approver level — i.e. `level > APPROVER_ROLE_LEVEL` (with
`APPROVER_ROLE_LEVEL = 1` = Coordinator, that means Creator and Contributor) — **and** no
**approving review** exists (a `Review` from a reviewer with `level <= APPROVER_ROLE_LEVEL`,
currently only Coordinator). If any author is at the approver level (`level <=
APPROVER_ROLE_LEVEL`, e.g. a Coordinator co-author on a multi-author article), no review is
required. Single-author content has one author, so the rule reduces to that author's role.

- Only the Coordinator publishes (#590, #627), and its publishing act is the approval, so in
  practice the gate holds no one back; it stays as a server-side guard.
- A Coordinator publishing their own draft needs no review (it is at the approver level).

The requirement is enforced in the detail flags (`get-content-action-flags.server.ts`, via
`needsReviewToPublish`) and in the publish handler (server-side guard). See
`app/utils/permissions/author/review-policy.ts` and
[_author-roles-and-permissions.md](./_author-roles-and-permissions.md).

---

## Submission

Built for articles in #590 and for tags, categories, issues, podcasts and episodes in #627; see
[_author-roles-and-permissions.md → Submission](./_author-roles-and-permissions.md#submission).

```
Draft ──Odeslat ke schválení──▶ Draft, submitted ──Schválit──▶ Draft, submitted + approved ──Publikovat──▶ Published
  ▲                                   │                                   │
  └──── Vzít zpět do konceptu / Vrátit k úpravám (submission and reviews cleared) ◀┘
```

Submitted content is locked for its authors and can't be deleted; the Coordinator may correct
it and the approval stays. Retracting, restoring, archiving and publishing also clear the
submission.

---

## Content history

Built in #608 (design 07f). Every step an author takes with an article, tag, category, issue,
podcast or episode writes a `ContentLog` row: the event, the actor and the time. The review
and submission rows lose their history when the content returns to draft; the log keeps it.
Its producers are the state handlers (`create-content-state-handlers.server.ts`), the
submission handlers (`create-submission-handlers.server.ts`), and the create and update
utilities; a failed or forbidden action writes
nothing. An approver publishing a submitted, unapproved item writes `approve` and `publish`
at one time, read as one row *Schváleno a publikováno*. The rows are deleted with their
content, and the deletion itself is not logged.

The detail pages show it as **Historie** (`HistoryList`), newest first, five rows, then
*Celá historie*; the podcast opens it in a dialog (27j). Content older than the log ends with
its own creation and publish dates, without names.

---

## New article drafts and the edit hold

Built in #668 (epic #667, logs [0019](./work-log/0019-the-edit-lock-lives-on-the-content-row.md)
and [0020](./work-log/0020-a-new-article-is-a-draft-created-on-click.md)). *Nový článek* posts
to `add-article`, which creates an empty draft of the signed-in author and opens its edit page.
The draft has no title, text or address (`slug` is null) and no history; `firstContentAt` stays
null until the first save with content, which logs *Vytvořeno*. Until then the draft is in no
administration list or count (`NON_EMPTY_ARTICLE_WHERE`), and the public web lists only articles
with an address. Each *Nový článek* also deletes empty drafts older than a day whose edit hold
is free.

The edit hold is built in #669 (design 07g, 24g; logs 0019 and
[0021](./work-log/0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md)).
Only a draft is held, by one browser tab. The editor takes the hold when it opens and the hold
is free (no holder, or `heldUntil` passed), renews it about every 30 s, and releases it when it
closes and when the tab closes. Without a signal it expires
after about 2 minutes, with no release. An empty draft is deleted when its hold is released.
The same person's second tab asks *Článek máte otevřený v jiné záložce* and may take it over.
Only the Coordinator takes over someone else's hold, through *Převzít úpravu?*, which logs
*Převzata úprava*. Others get no *Upravit*, and the editor's address sends them to the detail
with a toast. While someone else holds a draft, *Upravit* and every action that changes its
state wait. Each transition repeats "not held by someone else" in its own write, a bulk action
skips the held article, and a save checks that its tab still holds it. The list and the detail
say „upravuje …“, live through the hold events and again when it expires. The history writes
one *Upraveno* per hold. Hold writes keep `updatedAt` as it was. Gallery images carry their
`position`.

Autosave is built in #670 (design 24e, 24d; decision
[0022](./work-log/0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md)). There is
no *Uložit*, no leave dialog and no copy in the browser's storage. The editor sends the whole
form about a second after the last change, at once on leaving a field and on ⌘S (Ctrl+S
elsewhere). One save is on its way at a time, to the `save` route, which takes it only from the
holding tab and keeps the hold. A draft saves incomplete; what is missing is said on submit and
publish (23h). Of the gallery, the save carries only the alt texts and captions.
The line under the heading is the only sign: *Zatím prázdné*, *ukládá se* (at least 300 ms),
*uloženo dnes v 14:02* (another day with the date), *bez připojení · čeká na uložení* (it sends
again when the network is back) or *Nepodařilo se uložit.* with *Zkusit znovu*. The address
saves as typed even when another article holds it as published (log
[0039](./work-log/0039-a-public-address-is-unique-only-once-published.md)): only the address an
article holds since its last publish (`publishedSlug`) is unique, and only publish writes it, with
the article's PageSEO record. Retract and archive keep it. The field then says *Zadejte jinou
adresu — tato je obsazená.* through Conform and offers *Použít …* with a free address. Submit,
approve and publish list *Adresa je obsazená.* in the 23h dialog. A draft's web preview names the
article by its id (`?id=`). *Zavřít* and every other way out send what
waits first. When the page closes, the waiting save goes out with the release in one request.
The browser's own dialog asks only offline, after a failure, or when what waits cannot be sent
while the page closes.

The gallery saves image by image, built in #673 (design 24b; decision
[0027](./work-log/0027-each-article-image-saves-on-its-own.md)). A picked image uploads at
once to the `images` route, under an id made in the editor, and its row exists only once the
file is processed. A file over 10 MB or not an image is refused at selection. *Odebrat* asks
first and deletes at once; *Nahradit soubor* keeps the old file until the new one is processed.
The main image and the order save at once; a tile moves by dragging its preview (a long press
on a phone) or by *Posunout dopředu*, *Posunout dozadu*. Every stored image shows its number,
its place on the web. The main image stands first, as on the web: setting one moves it there,
and it is neither moved nor passed (yj2t50dd). Each change
checks the hold in its own write and moves `updatedAt`. An upload under way still lands after the hold was released, on a draft nobody holds and
not submitted since; never over someone else's hold. An upload and a failure show only in
the open editor.

An upload is one step under the tile's preview (#704, design 24b; decision
[0029](./work-log/0029-an-admin-upload-stays-on-fetch-and-can-be-cancelled-until-it-saves.md)):
*Nahrává se* with an indeterminate bar, since `fetch` reports no progress, and *Zrušit* until it
saves. A cancelled new image's tile goes, and the server keeps nothing of it. A cancelled
replacement returns to the stored image; only one whose answer crossed the cancel stays replaced
on the server. *Zavřít* and a link out of the
editor ask while an image uploads, because leaving cancels it.

Losing the hold is built in #671 (design 24h, 24i; decision
[0023](./work-log/0023-a-lost-edit-hold-turns-the-editor-read-only.md)). An editor whose hold
went to the Coordinator or to the same person's other tab shows *Úpravu přebírá …* and turns
read-only: grey fields, no text toolbar, no buttons that change something. Autosave stops. It
says *Všechny změny jsou uložené.* only when nothing was waiting; otherwise *Některé změny se
nestihly uložit.* with *Zkopírovat celý text* (the article text as HTML and plain text, without
the title, perex or other fields), which stays under the heading until the editor closes. The
line under the heading says who edits it now; once the hold is free, *Článek lze znovu
upravovat* with *Pokračovat v úpravě*, which reloads the editor, and the new page takes the
hold. An editor whose hold expired while it was away takes it back silently and sends what
waited, if nobody saved meanwhile. If someone did, it sends nothing and shows *Článek se
mezitím změnil* with *Zkopírovat celý text* and *Načíst aktuální verzi*, or *Otevřít detail*
while someone holds it or it is no longer an editable draft.

A deleted article or issue is built in #756 (design 24k, 26m, 23g, 26i; decision
[0036](./work-log/0036-a-delete-waits-for-every-open-editor.md)). A delete waits for every
open editor, one's own in another tab included: it repeats "the hold is free" in its own write,
while the other transitions keep "not held by someone else". The detail answers *Smazat…* with
a toast instead of the confirmation while one's own editor holds it, and a bulk delete skips
the row. An editor whose content was deleted meanwhile (after an expired hold, or as a swept
empty draft) learns it from its next save, renewal or the delete event. It shows *Článek byl
smazán* (*Číslo bylo smazáno*) with *Přejít na seznam*, turns read-only for good with the line
*smazáno*, and keeps a warning under the heading: the article's text to copy, the issue's
values in the fields.

Choosing authors is built in #674 (design 24j; decision
[0026](./work-log/0026-the-association-is-the-owners-author-and-only-the-coordinator-adds-it.md)).
The authors are rows with an avatar and a ×. Under them is *Přidat autora*, a search field (a
`ChipInput` without chips) whose list opens with the focus and narrows through every author
while typing. An article always has at least one author, a draft too, and the last row has no
×. A Contributor or Creator keeps their own row (no ×) and adds or removes co-authors. The
Coordinator picks freely, without themselves too, and only they are offered the association,
*Vedneměsíčník, z. s.* (the Owner's author). Replacing and adding are two actions (ivyin4kr):
for the Coordinator the only author has *Vyměnit* in place of the ×, which opens *Vybrat
jiného autora* under the row and hides *Přidat autora*; the pick replaces the author in one
save, and *Zrušit*, Esc or a click outside closes it. Adding, removing or replacing saves at
once, without a dialog. Administrators and Owners get *Založit autora „…“* as the last option
while the typed name is no author's (in the replace field with a second line, *Po uložení
nahradí současného autora.*); it opens `add-author` with the name and comes back to the
editor with the new author chosen, or put in place of the replaced one. The new author comes
back in a one-time cookie, not in the address, so no link can change an article's authors.
When the search finds
nothing, everyone else reads that only they can create one. The save refuses an article
without an author (400), a Contributor or Creator leaving themselves out, and the association
added by anyone but the Coordinator (403); an association already stored stays on anyone's
save.

---

## Archive issue drafts and the edit hold

Built in #717 (epic #719, design 26c, 26d, 26i–26l; decision
[0034](./work-log/0034-a-new-archive-issue-starts-without-a-number-and-the-editor-offers-the-next-free-one.md)),
the same way as the article. *Nové číslo* posts to `add-issue`, which creates a draft without a
year or an order and opens `edit-issue`. A line under the pair, always there so typing does not move
the form, offers the next free number: *Další číslo: Použít 5/2026* (this year and its next free
order), *Další pořadí pro rok 2019: Použít 3* for a typed year, or *Rok: Použít 2026* for an
order typed alone (copy k5m0j1ag). A click fills it in, saves it and moves the focus to the
field it filled last; nothing else fills the number. A supplement, a value that can't be read
yet and a full number get no offer; a taken number's *Použít N* stands on the same line. Until its first save or upload
(`firstContentAt`) it is in no list, count or preview (`NON_EMPTY_ISSUE_WHERE`) and is deleted
when its hold is released; each *Nové číslo* first deletes empty drafts whose hold expired or that were never held
for as long as a hold lasts. The
editor saves Rok, Pořadí v roce, Název, Doplněk and, for the Coordinator only, Autor through the
`save` route from the holding tab. An order the offer set in the open editor follows the year
until it is set by hand or a supplement is filled; a typed or reloaded one stays. A draft may lack its year and order; it is then named by what it lacks
(„Číslo 2026 bez pořadí“). The year, order and supplement save as one: one that can't be read
is left out while the rest saves, and the field says why. A number another issue holds as
published saves as typed (log
[0039](./work-log/0039-a-public-address-is-unique-only-once-published.md)): only the number an
issue holds since its last publish (`publishedNumber`, `2026-4` or `2026-2-maturitni-ples`) is
unique, and only publish writes it. Retract and archive keep it. The field changed last, or
*Pořadí v roce*, then says *Zadejte jiné pořadí — číslo 3/2026 je obsazené.* (the year and
supplement forms in copy q34nuf6c, d288tkdf) through Conform, with *Použít N* for a free order
of a main issue. The cover's alt text follows the title. The hold, its takeover, the
read-only editor, the detail's „upravuje …“ line and the refused transitions work as for the
article; a bulk delete skips a held issue. The dialogs after a lost hold list the details that
did not save instead of offering a copy. The cover and the PDF upload as soon as they are picked
or dropped, each on its own through the `files` route, with one *Nahrává se · Zrušit* row and
cancellable until they save (0029); *Nahradit* replaces a stored file, which stays until the new
one saves, and leaving during an upload asks. The history gets *Obálka nahrána* and *PDF
nahráno*. A PDF has no name until publish gives it one by the number, in the same transaction
(`VDM-2026-4.pdf`; 0033, 0039); it keeps its name while the issue holds that number. Until then
*Na webu jako* shows the provisional address with *· předběžná adresa*, or for a taken number
*Náhled adresy PDF se zobrazí po zadání neobsazeného čísla.*, and a signed-in previewer opens the
draft's PDF there (by the number in the name, or `?id=` among drafts sharing it). *Odeslat ke
schválení*, *Schválit*, *Publikovat…* and *Schválit a publikovat…* need the year, the order, the
cover and the PDF; the name and the supplement are optional (26e, #718). The detail then says in
one sentence what is missing, with *Upravit v editoru*, and writes nothing; a taken number
follows as its own sentence, *Číslo 3/2026 je obsazené.* The Coordinator's edits of a submitted or approved issue keep its approvals,
because the editor writes no reviews. Its author takes it back to a draft instead (07d).

---

## Decided for the redesign (not implemented yet)

Decided on 28 Sep 2026 in the design project (`07 Stavy a akce obsahu`, questions `dj753f0j`
and `gbsczekj`, see [_design-project.md](./_design-project.md)). Everything above still
describes today's code; this is the target.

- **Submitted for approval is a flag, not a state.** `ContentState` stays
  `draft` · `published` · `archived`. The author submits a finished draft
  (**Odeslat ke schválení**), which sets `submittedAt`. The UI shows it as
  *Čeká na schválení*; a submitted draft with an approving review shows as *Schváleno*.
  Built (#590, #627).
- **Approving and publishing are two steps, both Coordinator-only.** On a submitted draft the
  Coordinator either **approves** it (stays off the web, recorded as a `Review`) or **approves
  and publishes** it in one step. An approved draft then has **Publikovat**. A Coordinator may
  still publish a draft that was never submitted.
- **Approving first exists for ordering on the web.** The web sorts by `publishedAt`
  (descending) and an edition's order comes from it (#243), so the Coordinator approves texts
  as they come and publishes them later, in the order they should stand.
- **Taking back wipes the approval.** The author's **Vzít zpět** and the Coordinator's
  **Vrátit k úpravám** return the item to an unsubmitted draft and delete its reviews.
  A Coordinator's own small fix of an approved text keeps the approval.
- **Bulk publish gives every item its own time**, in the order the confirmation dialog shows
  (top = newest): the top item gets the moment of confirmation, each next one second earlier.
  An item published before keeps its stored date and stays out of the order. Built for
  articles (#600).
- **Changing the publish date takes a time as well** (Coordinator only, never in the future),
  so a forgotten article can be placed between two already published ones.
- **Creators neither approve nor publish** — not even their own content. Their `review`
  permission on others' drafts goes away. Done (#590, #627).
