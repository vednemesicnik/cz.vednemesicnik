const UTF8_TYPES = /^(text\/[\w.+-]+|application\/(json|javascript))$/i

/**
 * Adds `charset=utf-8` to a text, JSON or JavaScript response that names none.
 *
 * Express did this for every response React Router sent through it (`res.set` runs the
 * type through `mime-types`), so `text/html` went out as `text/html; charset=utf-8`.
 * Keeping it keeps the headers the web sends unchanged now that Express is gone.
 *
 * @param response The web app's response.
 * @returns The same response, or a copy with the charset when its headers were immutable.
 */
export function addDefaultCharset(response: Response): Response {
  const contentType = response.headers.get('Content-Type')?.trim()
  if (!contentType || !UTF8_TYPES.test(contentType)) return response

  const value = `${contentType}; charset=utf-8`

  try {
    response.headers.set('Content-Type', value)
    return response
  } catch {
    // A redirect or a fetched response has immutable headers.
    const copy = new Response(response.body, response)
    copy.headers.set('Content-Type', value)
    return copy
  }
}
