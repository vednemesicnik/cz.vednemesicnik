# 0012. Live content events carry the actor's name to every administration session

- Date: 2026-10-13
- Issues: #224, #606, #612, PR #609

## Context

The administration is live over server-sent events (#224). The epic designed the events as hints,
`{ entity, entityId, change }`. A receiver reloads its own loaders under its own session, so the
stream needed no permission filtering. The stream checks only that someone is signed in
(`app/routes/resources/admin-events/_loader.ts`). Every content change goes out on one `admin`
channel, and each page filters by entity.

The live article list (design 22f, #606) shows who made a change („změna 14:02 · jméno“). That
line is session-local and has no stored record behind it, so #606 added the actor
(`authorId`, `name`) and the time to the event (`app/utils/sse/content-event.ts`). Since then,
every signed-in administration session receives an author's name next to the id of content it may
not be allowed to see. #606 left accepting that open; #612 raised it again.

## Outcome

The exposure is accepted. A content event carries the content's entity and id, the change, the
acting author's id and name, and the time, and it goes to every signed-in administration session
without filtering by the receiver's permissions. It carries nothing more: no title, no text, no
state.

## What follows

- An author's name is public already: bylines on the website and the editorial board. An id
  alone resolves to nothing for a receiver who may not see the content; its loaders still decide
  access.
- Everyone signed in to the administration is a member of the editorial team.
- Revisit this record before an event carries anything that describes the content (a title, an
  excerpt, a state a receiver may not see), or before the stream is opened to anyone outside the
  editorial team. Either change needs filtering per receiver, or the name read through a loader,
  as below.
- Epic #224's `{ entity, entityId, change }` now reads as the minimum an event carries, not the
  whole of it.

## Turned down

- **Hash the ids.** The list matches an event to a row it shows, so the client would need the
  same hash for the ids it already holds. The hash would then stand for the content exactly as
  the id does: one opaque token for another. What a receiver learns stays the same, that author
  X changed something at time T.
- **Filter per receiver.** The broadcaster would build a permission context for every
  subscribed session and drop events it may not see. It costs a permission check per session
  per event, to protect names that are public anyway.
- **Read the name from the content log.** Since #608, `ContentLog` stores who changed what, so
  the list's loader could read the latest actor under the receiver's permissions, and the event
  could go back to `{ entity, entityId, change }`. That means a log read on every live reload,
  and it changes 22f's session-local line into a stored one, for the same public names.
