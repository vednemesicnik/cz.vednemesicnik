# 0040. A missing sign-in record means "never" only inside the retention window

- Date: 2026-10-23
- Issues: #789

## Context

The users list (design 28d) shows each account's last sign-in, so the Administrator can see
whether an invited person has signed in yet and which accounts nobody uses any more. The
value is the newest `AuthLog` row with `event = sign_in_success`; every sign-in path writes
one. `AuthLog` is pruned after 90 days ([0004](0004-separate-auth-log-and-audit-log.md)), so
28d's first premise — no record means "zatím nikdy" — is true only for an account younger
than that window. For an older account the app knows only that nobody signed in within it.

## Outcome

The list derives one of three states from the newest record and the account's `createdAt`
(`getLastSignIn` in `app/routes/administration/users/_index/utils/`):

- a record: its date, „dnes“ for today;
- no record, account younger than the retention window: „zatím nikdy“ in amber — someone is
  waiting on that account;
- no record, older account: „90 dní bez přihlášení“ in the date's tone — nobody is waiting.

The window is `AUTH_LOG_CONFIG.retentionDays` (`app/config/auth-log-config.ts`), the same
value the prune uses; the boundary and the number in the text are built from it. The newest
records for the whole list come from one `groupBy` query. Design decided the states and tones
(cylr6mg1), the copywriter the wording (40fhgxe2).

## What follows

Changing `retentionDays` moves the prune, the boundary and the text together; a new value
needs the copywriter first, since the text was approved for 90 days and the Czech noun
changes form below five. Sorting the list
by last sign-in is not possible without a relation from `AuthLog` to `User`, which 0004 rules
out on purpose. A reason to revisit: the Administrator needs to tell "never" from "long ago"
for old accounts, which would need data kept beyond the window. The current state of both logs
is in [`docs/_audit-logging.md`](../_audit-logging.md).

## Turned down

- **A `User.lastSignInAt` column.** It duplicates `AuthLog`, adds a write to every sign-in
  path, and still cannot tell "never" from "long ago" for the accounts that exist today,
  whose history is already pruned.
- **„zatím nikdy“ for every account without a record.** It claims more than the app knows and
  marks a graduate's unused account as an invitation waiting in amber.
