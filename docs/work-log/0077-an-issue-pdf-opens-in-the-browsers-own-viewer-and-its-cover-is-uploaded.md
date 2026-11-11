# 0077. An issue PDF opens in the browser's own viewer, and its cover is uploaded

- Date: 2026-11-11

## Context

Mozilla's pdf.js was proposed for the archive (log 0006) for three things: a fullscreen reader
of our own, opened like the gallery's image preview, with scroll and page-by-page paging, a jump
to a page and a download; a cover made from the PDF's first page instead of an uploaded image;
and faster loading, page by page. Range requests on `/archive/*.pdf` were then weighed on their
own, since loading page by page would depend on them.

The facts on 11 November 2026:

- An archive tile links to the PDF, served `inline` (`app/routes/archive/issue-pdf/_middleware.ts`),
  so it opens in the browser's own viewer: scrolling, a jump to a page, download, zoom, search,
  print and selectable text. Firefox's viewer is pdf.js.
- `pdfjs-dist` 6.5 weighs about 590 kB gzipped (the worker alone 380 kB). Rendering in Node needs
  the native `@napi-rs/canvas`.
- The PDF response has no `Content-Length` (`app/utils/pdf-store/serve-pdf.server.ts`), and a
  `Range` request gets `200` and the whole file, also from Cloudflare's cache. `VDM-2026-1.pdf`
  is 6.5 MB, PDF 1.3, not linearized.
- Chrome loads a PDF in parts only when the response accepts byte ranges and states the size,
  and only a linearized file shows a page before the whole of it is in. Nothing makes our PDFs
  linearized: they come from the layout program, and the upload stores them as they are.
- The archive holds 76 issues since 2003, so a cover is uploaded a few times a year.

## Outcome

- **An issue PDF opens in the browser's own viewer.** The archive has no reader of its own.
- **The cover is an image the editor uploads**, not one made from the PDF.
- **The PDF route serves the whole file.** It has no range requests.

## What follows

- A reader of our own has to beat the browser's viewer at something a reader needs, not match the
  gallery's look. Reasons to revisit: a two-page spread that shows the magazine as printed, or a
  phone that downloads the PDF instead of showing it. Either is a new proposal, and design draws
  it first.
- Range requests pay only together with linearized PDFs. Both come back if readers find an
  issue slow to open, as one proposal: something that linearizes on upload (for example `qpdf`
  in the Docker image) and reprocesses the archived PDFs, then the size and byte ranges in the
  response (`docs/_cloudflare-pdf-caching.md` describes the caching today).
- A cover rendered on the server is a memory risk on Fly: a 64-megapixel test image once ran
  production out of memory (#713).

## Turned down

- **A pdf.js reader**: the browser's viewer already scrolls, pages, jumps and downloads. It would
  add 590 kB of script, a text layer to keep accessible, pinch zoom on phones and the library's
  security releases to follow (CVE-2024-4367 ran script from a PDF).
- **A cover made on the server**: a native canvas dependency and a large render in production
  memory, to save one image export a few times a year.
- **A cover made in the editor's browser**: a 1.3 MB worker in the issue editor for the same small
  saving, and a second way a cover comes about.
- **Range requests on their own**: the PDFs are not linearized, so Chrome and Safari would show the
  first page no sooner. Only Firefox's pdf.js would gain a little.
