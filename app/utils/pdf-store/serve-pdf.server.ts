// Read path for issue PDFs. Builds the download Response from a body — a store
// stream, or (transitionally, until the backfill + blob-drop follow-up) the legacy
// in-DB blob. No Content-Length: the store streams, and the header is optional.
// Cache headers mirror the images read path; the URL is effectively versioned via
// the row's updatedAt-based ETag, so an immutable cache is safe.

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
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Type': contentType,
      ETag: etag,
      'Last-Modified': lastModified,
      'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
    },
  })
}
