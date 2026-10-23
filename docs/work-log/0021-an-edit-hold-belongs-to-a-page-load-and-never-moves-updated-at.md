# 0021. An edit hold belongs to one page load, and a hold write never moves `updatedAt`

- Date: 2026-10-15
- Issues: #669, #667

## Context

[0019](0019-the-edit-lock-lives-on-the-content-row.md) puts the edit hold on the
content row (`heldByAuthorId`, `heldByTabId`, `heldSince`, `heldUntil`) and leaves open two
things every holder of it has to agree on.

**What a tab is.** The hold belongs to a browser tab, not to a person (design 24g): one
person's second tab asks before it takes the edit. The tab needs an id the server can compare.
`sessionStorage` survives a reload, but *Duplicate tab* copies it, so two tabs would share one
hold and overwrite each other, the thing the hold is there to stop.

**What a hold write does to `updatedAt`.** `Article.updatedAt` is `@updatedAt`: Prisma sets it
on every update the client makes. The editor renews the hold about every 30 s (07g). If a
renewal moved `updatedAt`, „uloženo dnes v 14:02“ in the list and the detail (22b, 22f) would
show the last renewal instead of the last save. The takeover dialog's „Poslední uložení“ (24g)
is how the Coordinator tells someone writing from an editor left open, and it would say the
same thing for both. A conditional `updateMany` cannot say "keep the column as it is".

**How a refusal travels.** The state transitions run from the detail and the list through
fetchers. A thrown 4xx lands in the route's error boundary.

## Outcome

- **The tab id is made in the browser once per page load** (`crypto.randomUUID()` after
  hydration) and lives only in memory. Leaving, closing and the back/forward cache release
  the hold. A reload whose release has not landed yet meets its own hold "in another tab"
  and asks, as 24g draws it.
- **A hold write moves only the hold.** Taking, renewing, releasing and taking over read the
  row, then write the hold columns with the `updatedAt` they read. They also repeat it in the
  write's `where`, together with the expected holder and `state: 'draft'`. A save that landed
  in between fails that condition, and the operation reads again and tries once more.
  `updatedAt` stays the last save or transition.
- **A refused write is returned, not thrown, to a fetcher.** A transition whose own write
  found the content held by someone else throws a 409 that names the holder
  (`createEditHeldRefusal`). The shared action turns it into `{ heldByName }`, the page says
  „Článek právě upravuje …“, and a bulk action counts the article as skipped. A save the hold
  refuses returns `not-held` with the holder's name.
- **The holding tab's own writes do not check the expiry.** A save, a renewal and a release
  repeat the holding author and tab, not `heldUntil`. A hold that expired while nobody took it
  still belongs to its tab (24i); this narrows 0019's "unexpired". Everyone else's writes treat
  an expired hold as free.
- **A take and a takeover repeat what they read.** A takeover writes over the holder it read,
  so a hold taken in between fails it and the role is checked again. Both carry the content's
  last save as the editor loaded it, and over a newer one answer `changed`: an editor never
  starts writing over text it has not seen.
- **Leaving the draft ends the hold.** Publishing or archiving clears the hold columns in the
  same write: published and archived content is never held (07g). So does a submission: its
  authors no longer edit a submitted text (07d).

The shared logic lives in `app/utils/edit-hold/`: the `where` builders, the status read, and
`createEditHoldHandlers` with the entity's Prisma work as callbacks.

## What follows

- Every content type that gets the hold (the issue in 26c, the episode in 27d) uses
  `createEditHoldHandlers` and keeps `updatedAt` the same way. Its transitions repeat
  `buildNotHeldByOthersWhere` in their own writes, as the article's do.
- Autosave (#670) saves through the holding tab's conditional write, like *Uložit* does now,
  and its „uloženo“ line can rely on `updatedAt`.
- A tab cannot survive a reload as the same holder. If that becomes a need, the id would have
  to tell a reload from a duplicated tab, which `sessionStorage` cannot.
- Revisit this entry if `updatedAt` stops being the moment of the last save, for example a
  separate saved-at column. Then hold writes may use `updateMany` freely.
- The lifecycle is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Turned down

- **The tab id in `sessionStorage`.** It survives a reload, but a duplicated tab copies it,
  and then two tabs hold one edit.
- **Hold writes in raw SQL**, which Prisma's `@updatedAt` does not touch. They would compare
  `heldUntil` in whatever format the SQLite adapter stores dates in, and they are the only raw
  SQL in the app. The compare-and-set stays in the Prisma client and is tested like the rest.
- **A separate `savedAt` column for the last save.** Correct, but it changes every reader of
  `updatedAt` (lists, detail, sort) in an issue about the hold.
