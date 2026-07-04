// Read path for issue PDFs. Builds the download Response from a body — a store
// stream, or (transitionally, until the backfill + blob-drop follow-up) the legacy
// in-DB blob. No Content-Length: the store streams, and the header is optional.
//
// The download URL is stable — the filename does not change when a PDF is
// re-uploaded to the same issue — so `immutable`/long max-age would let a replaced
// PDF go stale. `no-cache` = may be stored (browser + edge) but must revalidate via
// the ETag before use, so repeat downloads are cheap 304s yet never stale. Same
// strategy as the env.js resource (see routes/resources/env-script).
export const PDF_CACHE_CONTROL = 'public, no-cache'

type PdfResponseMeta = {
  fileName: string
  contentType: string
  etag: string
  lastModified: string
}

export function buildPdfResponse(
  body: BodyInit,
  { fileName, contentType, etag, lastModified }: PdfResponseMeta,
) {
  return new Response(body, {
    headers: {
      'Cache-Control': PDF_CACHE_CONTROL,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Type': contentType,
      ETag: etag,
      'Last-Modified': lastModified,
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  })
}
