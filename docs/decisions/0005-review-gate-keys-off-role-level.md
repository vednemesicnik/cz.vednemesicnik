# 0005. The review gate keys off the role level

- Status: Accepted
- Date: 2026-07-12
- Issues: #190, #192, PR #210

## Context

The rule "a Coordinator approves before a Creator publishes" was checked in about fifty
places, with magic numbers and in one place a role name. The first design moved it into a
database flag, `AuthorRole.publishRequiresReview`, on the premise that roles would become
editable. That premise was false.

## Decision

The role set is fixed and roles are never editable. The approver is expressed by level:
`APPROVER_ROLE_LEVEL` in `app/utils/permissions/author/review-policy.ts`, compared with
`role.level`, behind one helper. No database flag.

## Consequences

- A check for "may this author publish without review" goes through the helper, never a
  literal level or role name.
- If the gate ever becomes configurable, it belongs in the permission catalog (a future
  `approve` action), not on roles.
- See `docs/_author-roles-and-permissions.md`.

## Alternatives considered

- `AuthorRole.publishRequiresReview` flag — rejected with its premise; PR #210 was reworked.
