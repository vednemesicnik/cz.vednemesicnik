# 0041. A role edit writes the role only while it is the one the form loaded

- Date: 2026-10-23
- Issues: #797

## Context

The author edit sent the role the form was loaded with on every save
(`edit-author/_action.ts`, before #797). Saving only the name or the bio therefore wrote that
role back, and silently reverted a role another Administrator had changed meanwhile. The design
asks for the role to keep a version: a save after a change elsewhere overwrites nothing and says
who changed it and when (28c, lj22mnbm).

Log 0015 turned down a hidden field compared on the server as a *permission target*: the target
must come from the stored record. The role the form loaded is a different thing, a version.

## Outcome

Upravit autora carries `loadedRoleId`, the role the form was loaded with. The save
(`authors/author/edit/utils/update-author.server.ts`) writes the name and the bio as sent, and
the role only while the stored role is still `loadedRoleId`, with a conditional write
(`updateMany` where `roleId = loadedRoleId`) as the guard against a change between the read and
the write. On a mismatch the role is not written, name and bio are, and the form shows the
current role with the collision above its buttons.

The „Změna: …“ line reads the newest `author_role_changed` row of `AuditLog` for the author
(`app/utils/audit-log/get-latest-role-change.server.ts`): the actor's author name and the moment
in Prague time, and only when that row ended on the stored role (its `detail` reads
`role: from → to`). When the newest row ended elsewhere (a change made outside the app, or a row
not written yet), when there is none, or when the actor's account is gone, the line is left out
and the sentence stays.

The permission still comes from the stored record (log 0015): the edit page and its action need
`update author` with `any`, so only the Administrator and the Owner reach them.

## What follows

- The user edit (#798, 28f) follows the same shape for the user role, with
  `user_role_changed` and the same lookup.
- The collision is reported even when the person did not touch the role: the stored role differs
  from what they saw, so they check it before saving it again.
- Name and bio have no version (lj22mnbm): the last save wins. A reason to revisit is a design
  answer that asks for it.
- `recordAuditLog` is fire-and-forget, so a collision right after a change may not find its row
  yet; the check against the stored role then leaves the line out rather than naming an older
  change.
- See `docs/_user-roles-and-permissions.md` for who edits authors.

## Turned down

- **Leave the role out of a save that did not change it.** Turned down: the form cannot tell an
  untouched role from one set back to the loaded value, and the person would still not learn
  that the role changed under them.
- **Refuse the whole save on a collision.** Turned down by the design (lj22mnbm): name and bio
  are saved, only the role waits for a second look.
- **A version column on the author.** Turned down: the role id is already the version, and the
  audit log already says who changed it. No schema change.
