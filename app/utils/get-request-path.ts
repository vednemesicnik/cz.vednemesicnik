const DATA_SUFFIX = '.data'

/**
 * Returns the human-facing `path + query` for a request, undoing React Router's
 * Single Fetch transport.
 *
 * During client navigations loaders run as `.data` requests
 * (e.g. `/administration/settings.data?_routes=…`). Using that URL verbatim —
 * such as capturing it into a post-sign-in `redirectTo` — would land the browser
 * on the raw data endpoint instead of the page. This strips the `.data` suffix
 * and the internal `_routes` param, leaving a normal navigable path.
 */
export const getRequestPath = (request: Request) => {
  const url = new URL(request.url)

  let pathname = url.pathname
  if (pathname.endsWith(DATA_SUFFIX)) {
    pathname = pathname.slice(0, -DATA_SUFFIX.length)
    // The root index uses `/_root.data`.
    if (pathname === '/_root') pathname = '/'
  }

  url.searchParams.delete('_routes')
  const search = url.searchParams.toString()

  return search ? `${pathname}?${search}` : pathname
}
