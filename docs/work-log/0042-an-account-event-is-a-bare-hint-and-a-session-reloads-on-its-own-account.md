# 0042. An account event is a bare hint, and every page reloads on its own account's event

- Date: 2026-10-24
- Issues: #750, #747

## Context

[0035](0035-every-administration-page-is-live.md) made every administration page that shows
accounts live, and left the account event's fields to #750. Users and authors are not content:
their changes go to `AuditLog`, not `ContentLog`, and `ContentEventEntity` does not name them.
Two administrators editing accounts saw each other's changes only after a reload, and a member
whose role an administrator changed kept the pages and permissions from before the change.

The content event carries the acting author's id and name, which
[0012](0012-live-events-carry-the-actor-name-to-every-session.md) accepted because author names
are public and the article list shows them (22f). No account page shows an actor, and an
account's display name falls back to its e-mail address when the author name is empty
(`app/routes/administration/__layout-authenticated/_loader.ts`).

## Outcome

- **A second event on the `admin` channel**, `account-change`
  (`app/utils/sse/account-event.ts`): `{ entity: 'user' | 'author', entityId, change:
  'create' | 'update' | 'delete', occurredAt }`. It names no actor. Like a content event it is a
  hint: the receiver reloads its own loaders under its own session, and the stream does not
  filter by permission.
- **Every account write publishes one event**, about the record the action is on, after the
  write: adding, editing and deleting a user or an author, issuing an emergency sign-in link,
  and the Settings changes other people see (profile, photo, passkeys, two-factor, password).
  Changes nobody else sees (colour scheme, the welcome row, ending other sign-ins) and
  sign-ins themselves publish nothing.
- **The user and author lists and details listen to both entities** (`useAccountEvents`): a
  user row shows its author's name and role, an author row its account's e-mail and photo.
- **Every administration page reloads when an event is about the viewer's own account.** The
  authenticated layout listens with `isOwnAccountEvent`, so the sidebar, the navigation's
  permissions and the page follow a role change made by someone else. A deleted account's
  sessions go with it, so its reload lands on the sign-in redirect; the stream needs no change.
- `useContentEvents` and `useAccountEvents` are thin wrappers over one `useAdminEvents`
  (`app/hooks/use-admin-events.ts`).

## What follows

- An event that names an actor, or any account field, sends this entry and 0012 back to their
  revisit clauses first: an account's name is not always public.
- The own-account reload also reaches Settings and the edit forms, which 0035 keeps from
  listening to other people's changes. A reload does not remount the page, so typed values
  stay.
- Content pages that print an author's name (the dashboard's queue, the article list) do not
  follow an author rename. A rename is rare, and the next content event or navigation shows
  it.
- A page about one's own account revalidates from the layout and from the page; the second
  waits for the first. Revisit if account changes ever become frequent.

## Turned down

- **An actor, as in 0012.** No page shows it, and a name that falls back to an e-mail is not
  public. Adding it later is additive once a design draws a live row for an account list.
- **One hook that takes both event types.** Two wrappers over one generic hook keep every
  existing `useContentEvents` call as it is.
- **Filtering per receiver.** For the reasons in 0012: the event says no more than an id, and
  each page's loader decides access.
- **Publishing only where the audit log is written.** The audit log records role changes, not
  every save, and no author delete; the pages need to follow both.
