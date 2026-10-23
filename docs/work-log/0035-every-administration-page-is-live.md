# 0035. Every administration page is live, and the article list's live row is the default on every list

- Date: 2026-10-22
- Issues: #747, #748, #749, #750, #751, #752, #606

## Context

The server publishes a content event for every change to every content type: state changes,
submissions, creation and saves, file changes, edit holds and deletes
([0012](0012-live-events-carry-the-actor-name-to-every-session.md)). Which pages listen was
left to each issue. #606 made the article list live (design 22f: the row is tinted and reads
„změna · jméno“) and kept the issue, podcast, episode, category and tag lists non-live, because
they „change a few times a year, and a reload answers them“.

That premise judged each list by how often its data changes. People judge a page by what the
rest of the administration taught them. Someone who has seen the article list update itself
reads a stale issue list as current, or as broken. The cost #606 saved is one
`useContentEvents` call per page. Users and authors had no event at all.

## Outcome

- **Every administration page that shows content or accounts revalidates on the live events
  for what it shows**: lists, detail pages and the dashboard. A detail page also listens to
  the records it shows next to its own (a category's articles, a podcast's episodes, an
  article's categories and tags).
- **Accounts get their own event on the same channel**, published where the audit log is
  written, under the same rules as content events: a hint only, the receiver reloads under its
  own session (#750).
- **The 22f live row is the default on every content list.** A list goes without the tint and
  „změna · jméno“ only when design gives a reason that list differs (#751). Absent one, the
  list gets it (#752).
- The scope note in #606 that kept the other lists non-live no longer applies.

## What follows

- A new administration page that shows content or accounts listens from its first version, with
  `useContentEvents` (`app/hooks/use-content-events.ts`), and a new content list gets the 22f
  row through the article list's code
  (`app/routes/administration/articles/_index/utils/use-live-article-rows.ts`, generalized), not a copy
  ([0010](0010-one-component-per-role.md)).
- Editors and forms are not live. An editor's concurrency is the edit hold
  ([0019](0019-the-edit-lock-lives-on-the-content-row.md)), and a lost hold makes the editor
  read-only without updating its text
  ([0023](0023-a-lost-edit-hold-turns-the-editor-read-only.md)). Sign-in pages are not live
  either.
- Expiry still sends no event ([0019](0019-the-edit-lock-lives-on-the-content-row.md)): a page
  that shows a hold keeps `useRevalidateAt` for the moment it expires.
- The account event's fields are settled in #750 against
  [0012](0012-live-events-carry-the-actor-name-to-every-session.md). That entry accepts
  author names because they are public. A field beyond the hint, or an actor whose name is not
  public, sends 0012 to its revisit clause first.
- No topic document in `docs/` describes the live administration yet; the current state is
  `app/utils/sse/` and the hooks above.
- Revisit this entry if the administration grows past a handful of concurrent editors, so that
  revalidating whole pages on every event costs too much, or if it runs on more than one
  machine, which the in-memory broadcaster does not support.

## Turned down

- **Live only where data changes often** (#606). It saves one hook call per page and makes the
  administration inconsistent: the same kind of list behaves two ways.
- **Live everywhere, but the 22f row only where design draws it.** Every list would update, but
  silently on some lists and visibly on others. A change that is visible on one list and
  silent on the next is the same inconsistency on a smaller scale. A list may still differ,
  but design has to give the reason.
