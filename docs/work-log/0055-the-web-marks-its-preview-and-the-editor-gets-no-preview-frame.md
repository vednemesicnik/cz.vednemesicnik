# 0055. The web marks its own preview, and the editor gets no preview frame

- Date: 2026-10-30
- Issues: #763

## Context

A signed-in author already saw the drafts they may view on the public web
(`getWebContentVisibility`), but nothing told them apart from published content. Design 10d
(28 Sep 2026, 2u868pc9) draws the marks: a bar under the header, a dashed outline, a grey state
tag, drafts on top of date-ordered lists, and *Zobrazit jako čtenář*.

#763 was first filed for 31c (22 Oct 2026, 8kd9crag): the same web page framed beside the
article editor from a 1410 px content area. The frame came from our own example in that
question of what could fill the empty space on a 1920–2560 px monitor, not from anything the
editorial staff asked for. It duplicates the page that *Náhled na webu* already opens in a new
tab, and it would only show in windows of about 1700 px and up.

## Outcome

- **31c is dropped.** The editor stays the centred 980 px block (#761), and *Náhled na webu*
  opens the web page in a new tab.
- **The preview bar is a row of the sticky header** (`PreviewBar`, `SitePreviewBar` in
  `app/routes/__layout/`). `--app-header-height` is the header's row
  (`--app-header-content-height`) plus `--preview-bar-height`, which `:root:has([data-preview-bar])`
  sets. Everything that sticks under the header (log 0054) stays under the bar with no change.
- **Each public loader returns `preview`**: a list with an unpublished item, the page of
  unpublished content with its administration path, or `null`. The layout reads the deepest
  match's (`findPagePreview`) and draws the bar.
- **The reader view is a session cookie**, `vdm_reader_view` without an expiry, flipped by a
  JS-free POST to `/resources/reader-view`. It has no CSRF token: the cookie is SameSite=Lax,
  so a cross-site post carries no sign-in, and a forged flip only changes the visitor's own
  view. In the reader view the bar stands on every public page, 404 included, because a page
  that stopped previewing can't know what it hides, and the switch back has to be reachable
  from anywhere.
- **Drafts first takes two queries** (`findDraftsFirstPage`). A never-published draft has no
  `publishedAt`, and a retracted one keeps its old date, so no single `orderBy` puts drafts on
  top. The page is split into a window over the drafts (by `updatedAt`) and one over the rest
  (by `publishedAt`), so pagination stays continuous.
- **Lists preview archived content too.** `buildVisibleArticleWhere` defaults to drafts and
  archived articles, and the podcast, episode and archive lists ask for both.

## What follows

- A new public list adds `WEB_PREVIEW_STATE_SELECT` to its select, maps `getWebPreviewState`,
  returns `preview` and passes `isPreview` and the state to its items.
- An episode the reader can't see because only its podcast is unpublished carries the
  podcast's tag.
- The issue and episode editors still have no preview. 31c called that a question for later;
  it stays unasked.

## Turned down

- **A frame beside the editor (31c).** It needs same-origin framing in place of
  `X-Frame-Options: DENY`, its own reload rhythm, a remembered per-user choice and new copy,
  for a page one click away.
- **The reader view on the `Session` row.** It would tie the choice to the sign-in exactly, but
  needs a migration for a view preference. The cookie ends with the browser session instead.
- **The reader-view bar only where drafts would show.** You could then switch back only from
  such a page.
