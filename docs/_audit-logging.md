# Audit Logging

The application keeps two separate log models with different characteristics and
retention. Both deliberately have **no relation to `User`**, so records survive
account deletion.

## `AuthLog` — authentication events

- **Volume:** high — every sign-in attempt (including anonymous failures) and every
  sign-out.
- **Retention:** 90 days (`AUTH_LOG_CONFIG.retentionDays` in
  `app/config/auth-log-config.ts`), auto-pruned. An in-process retention loop
  (`startAuthLogRetention` in `app/utils/auth-log.server.ts`, started once from
  `app/entry.server.tsx`) prunes on startup and then daily. The users list reads its
  last sign-in from the newest `sign_in_success` within that window (log 0040).
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
  `author_created`, `author_role_changed`, `emergency_link_issued`. Role-change
  events carry a `detail` (`"role: <old> → <new>"`, via `formatRoleChangeDetail`);
  the others do not.
- **`targetId`:** the affected user id — or the **author id** for
  `author_created` and `author_role_changed`.

There is no screen to browse the logs as such. `AuditLog` feeds the Historie of
the user detail (28e, `getAccountHistory`) and of the author detail (28b,
`getAuthorHistory`); `AuthLog` feeds the sign-in attempts in Settings (29a) and
on the user detail (28e).
