# 0029. An admin upload stays on `fetch`, shows no progress, and can be cancelled until it saves

- Status: Accepted
- Date: 2026-10-19
- Issues: #704

## Context

Design asked on 16 Oct 2026 (1yxjqzkh) for a measured upload: *Nahrává se · 2,3 MB z 6,8 MB*, a
growing bar, then a separate *Zpracovává se* step without *Zrušit*. In a browser only
`XMLHttpRequest` reports upload progress. `fetch` reports neither the bytes sent nor the moment
the transfer ends. Measuring through a streamed request body works only in Chromium and measures
when the browser takes the data, not when it leaves. Counting received bytes on the server would
need a second channel back to the editor (SSE, #227, closed as not planned).

The gallery (`edit-article/utils/use-article-gallery.ts`) uploads with `fetch`, and so will the
issue editor, the covers and the profile photo.

## Decision

- **Admin uploads stay on `fetch`.** No `XMLHttpRequest` and no server-side progress channel.
  Decided by the product on 17 Oct 2026.
- **An upload is one step with an indeterminate bar** (design 24b, bxy8xxqs): *Nahrává se*,
  *Zrušit*, no MB, no percentage, no separate processing step. The component is `UploadStatus`.
- **An upload can be cancelled at any point until it saves.** The editor aborts the request with
  an `AbortController`. On the server the change is cancellable
  (`saveArticleImageChange`'s `isCancellable`): the aborted request is checked before the files
  are stored, right before the commit, and once more after it, before the old version's files go.
  A cancel that arrives during the commit deletes a new image, and a replacement gets its previous
  version back. A cancel while the body still arrives answers 499 and is no error.
- **Leaving the editor during an upload asks**, *Zavřít* and a link out alike, because leaving
  cancels the uploads. The browser asks when the tab closes. The dialog counts again as uploads
  end (moo05ljj).

## Consequences

- This narrows two statements of [0027](0027-each-article-image-saves-on-its-own.md), which stays
  in force otherwise. *Zavřít* no longer simply goes while an image uploads: it asks, and leaving
  cancels the upload. 0027's "Progress bars are #227" no longer holds.
- An upload still lands without the hold (0027) when the hold is released while the request
  runs and the editor did not cancel it, e.g. after a long outage.
- A first image cancelled during the commit leaves the empty draft empty: `firstContentAt` is
  reset ([0020](0020-a-new-article-is-a-draft-created-on-click.md)).
- If the editor's cancel crosses an answer already on its way, a new image the server saved is
  removed again with a `remove` change. A replacement saved so is kept, and the tile shows it.
- The issue cover and PDF (26c), the podcast and episode covers (27) and the profile photo (29)
  reuse `UploadStatus` and the same rules, each with its own route.
- Revisit once `fetch` gets upload progress events (being specified, 2026): only the transport and
  the bar change, the one-row design stays.
- The current state is described in [_content-creation-lifecycle.md](../_content-creation-lifecycle.md).

## Alternatives considered

- **`XMLHttpRequest`.** It is the only API that measures what the browser sent, but it is the old
  transport, and the product chose to keep `fetch`.
- **Counting received bytes on the server and sending them back over SSE.** Possible in Node, but
  it needs a second connection, an upload id and the connect race of #227, all to learn a number
  the editor would show for seconds.
- **Measuring the processing (Sharp) step.** Design ruled it out (940ikr3o): a step count reads as
  a time estimate and tells the author nothing.
