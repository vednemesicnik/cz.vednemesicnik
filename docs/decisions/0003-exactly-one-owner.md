# 0003. Exactly one Owner

- Status: Accepted
- Date: 2026-07-10
- Issues: #190, #193

## Context

Docs, UI and server disagreed on assigning the Owner role. The docs said an Owner could
appoint another Owner, the UI never offered the role, and the server's hierarchy check
(`1 < 1` is false) let a direct POST create a second Owner.

## Decision

The system has exactly one Owner, the account that comes from the seed. Assigning the
`owner` role to anyone, on create or edit, is rejected server-side with 403.

## Consequences

- Nobody, not even the Owner, can create another Owner or change the Owner's role.
- See `docs/_user-roles-and-permissions.md`.
