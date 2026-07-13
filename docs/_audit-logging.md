# Audit Logging

The application keeps two separate log models with different characteristics and
retention. Both deliberately have **no relation to `User`**, so records survive
account deletion.

## `AuthLog` — authentication events

- **Volume:** high — every sign-in attempt (including anonymous failures) and every
  sign-out.
- **Retention:** 90 days, auto-pruned. An in-process retention loop
  (`startAuthLogRetention` in `app/utils/auth-log.server.ts`, started once from
  `app/entry.server.tsx`) prunes on startup and then daily.
- **Written by:** `recordAuthLog(...)` — fire-and-forget; a logging failure never
  breaks sign-in / sign-out.
- **`event` values:** `sign_in_success`, `sign_in_failure`, `two_factor_failure`,
  `sign_out`. Sign-in events also carry a `method`; `sign_out` does not.

## `AuditLog` — administrative mutations

- **Volume:** tiny — admin mutations only.
- **Retention:** kept indefinitely. **No pruning loop** — the forensic value is
  permanent and the size is negligible.
- **Written by:** `recordAuditLog(...)` in `app/utils/audit-log.server.ts` — also
  fire-and-forget; recorded only after the mutation succeeds. The actor comes from
  the permission context.
- **`event` values:** `user_created`, `user_deleted`, `user_role_changed`,
  `author_role_changed`. Role-change events carry a `detail`
  (`"role: <old> → <new>"`, via `formatRoleChangeDetail`); create/delete do not.
- **`targetId`:** the affected user id — or the **author id** for
  `author_role_changed`.

Both models are write-only for now; there is no UI to browse them.
