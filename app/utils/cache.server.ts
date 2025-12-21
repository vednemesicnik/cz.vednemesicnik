/**
 * Checks if the client has a cached version of the resource using If-None-Match or If-Modified-Since headers.
 * Returns a 304 Not Modified response if validation matches, otherwise returns null.
 */
export const checkCacheValidation = (
  request: Request,
  etag: string,
  lastModified: string,
): Response | null => {
  const ifNoneMatch = request.headers.get('If-None-Match')
  const ifModifiedSince = request.headers.get('If-Modified-Since')

  // Check ETag validation (Chrome, Firefox)
  if (ifNoneMatch === etag) {
    return new Response(null, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
        'Last-Modified': lastModified,
      },
      status: 304,
    })
  }

  // Check Last-Modified validation (Safari)
  if (ifModifiedSince && ifModifiedSince === lastModified) {
    return new Response(null, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
        'Last-Modified': lastModified,
      },
      status: 304,
    })
  }

  return null
}
