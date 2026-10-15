# Decisions

One file per decision that binds later changes — architecture, the product model,
security, tooling. A record says what was decided, when, and why, so the next change does
not reopen it by accident. The topic documents in `docs/` describe how things are; a record
explains why they are that way and what was turned down.

UX, layout and visuals are decided in the design project (`docs/_design-project.md`), and
user-facing Czech by the copywriter (`docs/_copy-context.md`). A record cites those answers;
it does not restate them. Whether something is a page or a dialog, and what has an address,
is not UX: product and architecture decide it (0016).

Agents write records with the `/record-decision` skill.

## Format

Start from [`_template.md`](_template.md). A record is `NNNN-kebab-title.md`, numbered in
order and never renumbered. The title names the decision, not the topic.

**Status** is one of:

- `Proposed` — written, not yet agreed;
- `Accepted` — in force;
- `Superseded by NNNN` — replaced; the newer record says why;
- `Deprecated` — no longer applies, nothing replaced it.

**Date** is the day the decision was made, not the day the file was written.

A record is not rewritten once it is accepted. A changed decision gets a new record, and the
old one changes only its status line.

The accepted records form one whole. A new record is checked against every one of them before
it is accepted. A conflict is settled by superseding one of the two, never by leaving both
in force.

## Index

| # | Decision | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-record-decisions-in-the-repository.md) | Record decisions in the repository | Accepted | 2026-10-13 |
| [0002](0002-nonce-csp-deferred.md) | Defer the nonce-based Content-Security-Policy | Accepted | 2026-07-09 |
| [0003](0003-exactly-one-owner.md) | Exactly one Owner | Accepted | 2026-07-10 |
| [0004](0004-separate-auth-log-and-audit-log.md) | Separate the auth log from the audit log | Accepted | 2026-07-10 |
| [0005](0005-review-gate-keys-off-role-level.md) | The review gate keys off the role level | Accepted | 2026-07-12 |
| [0006](0006-archive-issue-is-the-printed-magazine-only.md) | The archive `Issue` is the printed magazine only | Accepted | 2026-07-14 |
| [0007](0007-translate-the-interface-not-the-content.md) | Translate the interface, not the content | Accepted | 2026-07-19 |
| [0008](0008-public-forms-carry-their-own-notice.md) | Public forms carry their own data-protection notice | Accepted | 2026-08-02 |
| [0009](0009-no-transparent-bank-account.md) | No transparent bank account | Accepted | 2026-09-28 |
| [0010](0010-one-component-per-role.md) | One component per role, no administration twins | Accepted | 2026-10-10 |
| [0011](0011-passkeys-have-no-name.md) | Passkeys have no name or note | Accepted | 2026-10-11 |
| [0012](0012-live-events-carry-the-actor-name-to-every-session.md) | Live content events carry the actor's name to every administration session | Accepted | 2026-10-13 |
| [0013](0013-content-is-submitted-only-the-coordinator-approves-and-publishes.md) | Every content type is submitted for review; only the Coordinator approves and publishes | Accepted | 2026-09-28 |
| [0014](0014-activity-guidance-is-a-skill-not-a-rule.md) | Guidance for one body of work is a skill, not a rule | Accepted | 2026-10-14 |
| [0015](0015-edits-check-the-stored-record-not-the-form.md) | Content edits check the stored record, never the form | Accepted | 2026-10-14 |
| [0016](0016-records-are-added-and-edited-on-their-own-page.md) | Records are added and edited on their own page, not in a dialog | Accepted | 2026-10-14 |
| [0017](0017-every-list-with-filters-has-saved-filters.md) | Every administration list with filters has saved filters, and Stav filters by queue | Accepted | 2026-10-14 |
| [0018](0018-agents-decide-and-inform.md) | Agents make architecture, product and security calls and report them | Accepted | 2026-10-15 |
| [0019](0019-the-edit-lock-lives-on-the-content-row.md) | The edit lock lives on the content row, and the article has it first | Accepted | 2026-10-15 |
| [0020](0020-a-new-article-is-a-draft-created-on-click.md) | A new article is a draft created on click, not a page | Accepted | 2026-10-15 |
| [0021](0021-an-edit-hold-belongs-to-a-page-load-and-never-moves-updated-at.md) | An edit hold belongs to one page load, and a hold write never moves `updatedAt` | Accepted | 2026-10-15 |
| [0022](0022-a-document-autosaves-its-whole-form-from-the-holding-tab.md) | A Document autosaves its whole form from the holding tab, one save at a time | Accepted | 2026-10-15 |
| [0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md) | A lost edit hold turns the editor read-only, and the edit comes back only through a reload | Accepted | 2026-10-15 |
