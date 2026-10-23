# 0004. Separate the auth log from the audit log

- Date: 2026-07-10
- Issues: #190, #194

## Context

Sign-in events were already logged (`AuthEvent`). Administrative mutations — creating and
deleting users, changing roles — left no trace. The two kinds of record differ in volume and
in how long they are worth keeping.

## Outcome

Two models, not one shared table:

- `AuthLog` (renamed from `AuthEvent`, rows kept) — sign-in and sign-out, high volume,
  pruned after 90 days;
- `AuditLog` — administrative mutations with actor, target and detail, small volume, never
  pruned.

Neither has a relation to `User`, so records survive account deletion.

## What follows

- A new kind of security event goes to `AuthLog`; a new administrative mutation worth
  auditing goes to `AuditLog`.
- See `docs/_audit-logging.md`.

## Turned down

- One log table with a type column — rejected: one retention policy would either drop audit
  records or keep every sign-in forever.
