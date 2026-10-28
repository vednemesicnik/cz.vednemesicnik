# Work log

A dated log of what the work settled on, and why. One entry per thing worth knowing later:
an architecture or data-model shape, a policy, a security mechanism, a tool chosen over
another, or a proposal dropped for a reason that will come up again. The topic documents in
`docs/` describe how things are. An entry says how they got that way and what was turned
down.

**An entry is context, not a rule.** It records the best answer at the time it was written.
Nothing is ideal, and the app keeps changing, so any entry may be revisited. Read the entries
about an area before changing it, so that a change of direction is deliberate. Then change
direction when it is better, and log it.

UX, layout and visuals are worked out in the design project (`docs/_design-project.md`), and
user-facing Czech by the copywriter (`docs/_copy-context.md`). An entry cites those answers;
it does not restate them.

Agents write entries with the `/log-work` skill.

## Format

Start from [`_template.md`](_template.md). An entry is `NNNN-kebab-title.md`, numbered in
order and never renumbered. The title says what was settled, not the topic.

- **Date** is the day the work settled on it, not the day the file was written.
- **Later** names the entry that changed direction since. Adding it is the only edit an old
  entry needs. Its text stays as history; fixing a fact or a broken link is fine.

Code comments cite an entry by its number (`log 0022`).

## Index

| # | Entry | Date | Later |
| --- | --- | --- | --- |
| [0001](0001-keep-what-the-work-settles-in-the-repository.md) | Keep what the work settles in the repository | 2026-10-13 | [0038](0038-decisions-are-kept-as-a-work-log.md) |
| [0002](0002-nonce-csp-deferred.md) | Defer the nonce-based Content-Security-Policy | 2026-07-09 |  |
| [0003](0003-exactly-one-owner.md) | Exactly one Owner | 2026-07-10 |  |
| [0004](0004-separate-auth-log-and-audit-log.md) | Separate the auth log from the audit log | 2026-07-10 |  |
| [0005](0005-review-gate-keys-off-role-level.md) | The review gate keys off the role level | 2026-07-12 |  |
| [0006](0006-archive-issue-is-the-printed-magazine-only.md) | The archive `Issue` is the printed magazine only | 2026-07-14 |  |
| [0007](0007-translate-the-interface-not-the-content.md) | Translate the interface, not the content | 2026-07-19 |  |
| [0008](0008-public-forms-carry-their-own-notice.md) | Public forms carry their own data-protection notice | 2026-08-02 |  |
| [0009](0009-no-transparent-bank-account.md) | No transparent bank account | 2026-09-28 |  |
| [0010](0010-one-component-per-role.md) | One component per role, no administration twins | 2026-10-10 |  |
| [0011](0011-passkeys-have-no-name.md) | Passkeys have no name or note | 2026-10-11 |  |
| [0012](0012-live-events-carry-the-actor-name-to-every-session.md) | Live content events carry the actor's name to every administration session | 2026-10-13 |  |
| [0013](0013-content-is-submitted-only-the-coordinator-approves-and-publishes.md) | Every content type is submitted for review; only the Coordinator approves and publishes | 2026-09-28 |  |
| [0014](0014-activity-guidance-is-a-skill-not-a-rule.md) | Guidance for one body of work is a skill, not a rule | 2026-10-14 |  |
| [0015](0015-edits-check-the-stored-record-not-the-form.md) | Content edits check the stored record, never the form | 2026-10-14 |  |
| [0016](0016-records-are-added-and-edited-on-their-own-page.md) | Records are added and edited on their own page, not in a dialog | 2026-10-14 |  |
| [0017](0017-every-list-with-filters-has-saved-filters.md) | Every administration list with filters has saved filters, and Stav filters by queue | 2026-10-14 |  |
| [0018](0018-agents-decide-and-inform.md) | Agents make architecture, product and security calls and report them | 2026-10-15 |  |
| [0019](0019-the-edit-lock-lives-on-the-content-row.md) | The edit lock lives on the content row, and the article has it first | 2026-10-15 |  |
| [0020](0020-a-new-article-is-a-draft-created-on-click.md) | A new article is a draft created on click, not a page | 2026-10-15 | [0039](0039-a-public-address-is-unique-only-once-published.md) |
| [0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md) | An edit hold belongs to one page load, and a hold write never moves `updatedAt` | 2026-10-15 |  |
| [0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md) | A Document autosaves its whole form from the holding tab, one save at a time | 2026-10-15 | [0039](0039-a-public-address-is-unique-only-once-published.md) |
| [0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md) | A lost edit hold turns the editor read-only, and the edit comes back only through a reload | 2026-10-15 |  |
| [0024](0024-dates-are-utc-instants-shown-in-prague-time-without-temporal.md) | Dates are UTC instants shown in Prague time, with `Date` and `Intl` until Temporal is Baseline | 2026-10-15 |  |
| [0025](0025-a-save-removes-a-link-only-when-the-editor-sends-it-as-removed.md) | A save removes a category or tag link only when the editor sends it as removed | 2026-10-15 |  |
| [0026](0026-the-association-is-the-owners-author-and-only-the-coordinator-adds-it.md) | The association is the Owner's author, and only the Coordinator adds it to an article | 2026-10-16 |  |
| [0027](0027-each-article-image-saves-on-its-own.md) | Each article image saves on its own | 2026-10-16 |  |
| [0028](0028-the-main-image-stands-first-in-the-gallery.md) | The main image stands first in the gallery, in the editor as on the web | 2026-10-19 |  |
| [0029](0029-an-admin-upload-stays-on-fetch-and-can-be-cancelled-until-it-saves.md) | An admin upload stays on `fetch`, shows no progress, and can be cancelled until it saves | 2026-10-19 |  |
| [0030](0030-an-archive-issue-is-year-order-and-supplement-and-its-title-is-computed.md) | An archive issue is its year, order and supplement, and its title is computed, never stored | 2026-10-20 | [0039](0039-a-public-address-is-unique-only-once-published.md) |
| [0031](0031-an-archive-issue-is-published-without-choosing-a-date.md) | An archive issue is published without choosing a date | 2026-10-20 |  |
| [0032](0032-a-new-archive-issue-is-a-draft-with-the-next-free-number.md) | A new archive issue is a draft with the next free number, and its number saves as one | 2026-10-20 | [0034](0034-a-new-archive-issue-starts-without-a-number-and-the-editor-offers-the-next-free-one.md) |
| [0033](0033-an-issue-pdf-has-no-file-name-until-its-number-is-complete.md) | An issue's PDF has no file name until its year and order are both there | 2026-10-20 | [0039](0039-a-public-address-is-unique-only-once-published.md) |
| [0034](0034-a-new-archive-issue-starts-without-a-number-and-the-editor-offers-the-next-free-one.md) | A new archive issue starts without a number, and the editor offers the next free one | 2026-10-21 | [0039](0039-a-public-address-is-unique-only-once-published.md) |
| [0035](0035-every-administration-page-is-live.md) | Every administration page is live, and the article list's live row is the default on every list | 2026-10-22 |  |
| [0036](0036-a-delete-waits-for-every-open-editor.md) | A delete waits for every open editor, one's own included, and an editor whose content was deleted says so | 2026-10-22 |  |
| [0037](0037-apps-script-web-apps-are-split-by-privilege.md) | Apps Script web apps are split by privilege | 2026-10-22 |  |
| [0038](0038-decisions-are-kept-as-a-work-log.md) | Decisions are kept as a work log, not as binding records | 2026-10-23 |  |
| [0039](0039-a-public-address-is-unique-only-once-published.md) | A public address is unique only once it is published, and a Document keeps what was typed | 2026-10-23 | [0047](0047-an-episode-address-is-unique-within-its-podcast-once-published.md) |
| [0040](0040-a-missing-sign-in-record-means-never-only-inside-the-retention-window.md) | A missing sign-in record means "never" only inside the retention window | 2026-10-23 |  |
| [0041](0041-a-role-edit-writes-the-role-only-while-it-is-the-one-the-form-loaded.md) | A role edit writes the role only while it is the one the form loaded | 2026-10-23 |  |
| [0042](0042-an-account-event-is-a-bare-hint-and-a-session-reloads-on-its-own-account.md) | An account event is a bare hint, and every page reloads on its own account's event | 2026-10-24 |  |
| [0043](0043-content-history-holds-an-author-and-an-e-mail-change-is-recorded.md) | Content history holds an author like an approval, and an e-mail change is recorded without an address | 2026-10-25 |  |
| [0044](0044-a-list-row-folds-on-a-phone-through-the-admin-table-parts.md) | A list row folds on a phone through the admin-table parts, and the phone rows keep the 24 px page gutter | 2026-10-25 | [0045](0045-the-phone-page-gutter-is-16-px-from-one-token.md), [0046](0046-every-administration-list-folds-on-a-phone.md) |
| [0045](0045-the-phone-page-gutter-is-16-px-from-one-token.md) | The phone page gutter is 16 px, from one token | 2026-10-25 |  |
| [0046](0046-every-administration-list-folds-on-a-phone.md) | Every administration list folds on a phone; folding is no longer an option | 2026-10-26 |  |
| [0047](0047-an-episode-address-is-unique-within-its-podcast-once-published.md) | An episode's address is unique within its podcast once published, ahead of its editor | 2026-10-26 | [0048](0048-an-episode-is-a-draft-with-the-next-number-unique-only-once-published.md) |
| [0048](0048-an-episode-is-a-draft-with-the-next-number-unique-only-once-published.md) | An episode is a draft with the next number, unique only once published, and its links save as typed | 2026-10-27 |  |
| [0049](0049-a-podcast-is-a-draft-created-on-click-with-its-cover-saved-on-its-own.md) | A podcast is a draft created on click, its cover saves on its own, and an empty address stays empty | 2026-10-28 |  |
