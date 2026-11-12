# 0081. The link up returns the list as it was left, through a per-tab trail keyed by history entry

- Date: 2026-11-12
- Issues: #1048

## Context

The website's `‹ Články` and `‹ {pořad}` and the administration's list breadcrumb always led to
the parent's bare address. Design 11b had decided that on 3 Oct 2026 (swy7vqdd, fr24hvgc): "vede
vždy na stejnou adresu … žádné history.back()". So `‹ Články` on an article opened from page 3 led
to page 1, while Back led to page 3 at the same row. In the administration the breadcrumb dropped
the search, filters, sort and page, and the default saved filter applied again (log 0017). The
owner reported it as a bug. Design agreed and replaced the rule with 30i (question `n3wa2ld4`): a
record opened straight from its parent's list in the same tab leads back to that list as it was
left, at the same scroll position, with focus on the row. From anywhere else the link still goes
to the bare parent. The link keeps its name and stays an `<a href>`, and the record's own address
carries no list state.

The list's address has to survive more than a link. A delete from a record's page and a new
document from a list both end in a server redirect, and a redirect carries no navigation state.

## Outcome

- **A per-tab navigation trail.** Each history entry remembers the entries that led to it, newest
  first and at most five, in session storage keyed by React Router's `location.key`
  (`app/utils/navigation-trail/`). One hook at the root records it on every navigation
  (`app/hooks/use-navigation-trail.ts`):
  - Back and Forward leave the entry as it was.
  - Another page of the same list (page, filters, sort) and a replace keep the trail.
  - A return up to a list takes that list's own trail.
  - Every other navigation puts the page left at the head of the trail.
- **Hierarchy comes from the address.** A link up looks for its target in the trail and walks
  only through pages above or below the current one: the list, the detail, the record's edit page
  (`find-return.ts`). The design rules follow the address hierarchy too (11b). A record reached
  from another record, or from a category or home, therefore gets the bare parent.
- **Scroll is React Router's own.** `<ScrollRestoration getKey>` keys a return by the list's
  entry (`get-scroll-restoration-key.ts`), and React Router restores a saved position on any
  navigation, not only on Back. The redirect a delete announced before it was sent is matched to
  the trail of the entry it leaves. Other redirects onto a trail address are no return: a list
  with a default saved filter redirects its bare address too. Returns that follow returns reuse
  the first list's key.
- **Focus** goes to the first link to the record the reader came back from, without scrolling.
  The ring shows only after keyboard use (`:focus-visible`). Zavřít from an editor is a return to
  the detail as well, so the detail opens where it was left, with focus on its Upravit link.
  30i doesn't draw that case; it is the same rule one level down.
- **A delete from a record's page** sends the list as it was left (`redirectTo`). The server takes
  it only for the same list path and otherwise falls back to the bare list
  (`get-delete-redirect-target.ts`). The editors' Zavřít and empty-draft close go through the same
  `useReturnLink`.
- **The web keeps its 404 for a page past the last** (design 11, #512). That is a departure from
  30i, which wants the last page with rows. The administration already redirects such a page to
  the last one (#541).

## What follows

- A new link up uses `ParentLink` or `BreadcrumbsItem`, which resolve through `useReturnLink`. Code
  that navigates up programmatically does the same, and passes the returned `state`.
- Session storage per tab is the whole memory. Nothing reaches the server or the next visit, and a
  new tab opens the bare list. Navigation that bypasses React Router (a full document load) starts
  a new trail.
- Server render and hydration show the bare address. The remembered one follows on the client, so
  a crawler and a shared link see the same link.
- The flight of 0080 stays one-way: a link up is never marked for a flight (18d).
- Revisit if a list starts keeping state outside its address, or if a record gets addresses that
  are not under its list.

## Turned down

- **`history.back()` on the link up.** It works only when the list is the entry just before, which
  is not the case after detail → edit → Zavřít. It also isn't a real link and contradicts 11b's
  plain `href`.
- **The list's address in the record's address** (`?from=` or `?page=` on the article). It would
  put list state into every shared link and every crawled address, which 30i rules out.
- **Link state on each link into a record.** It does not survive the server redirects after a
  delete and after creating a new document, and it would need every row link to carry it. The
  trail is recorded in one place.
- **A redirect to the last page on the web** in place of design 11's 404, for now. A 404 after
  `‹ Články` is a dead end, so it is not as good as 30i's answer. A remembered web page
  disappears only when articles are unpublished while the reader is on one of them, and the 404
  keeps design 11's answer for crawlers and typed addresses. Revisit if readers meet it.
