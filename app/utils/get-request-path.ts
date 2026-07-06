/**
 * Returns the human-facing `path + query` for a request, undoing React Router's
 * Single Fetch transport.
 *
 * During client navigations loaders run as `.data` requests
 * (e.g. `/administration/settings.data?_routes=…`), and React Router does NOT
 * strip that before calling the loader. Capturing `request.url` verbatim — such
 * as into a post-sign-in `redirectTo` — would land the browser on the raw data
 * endpoint instead of the page.
 *
 * This mirrors React Router's own internal `getNormalizedPath`
 * (`react-router/dist/.../server-runtime/urls.js`), which is not publicly
 * exported: strip the `.data` suffix (index/root requests use the `/_.data`
 * form) and drop the internal `_routes` param.
 */
export const getRequestPath = (request: Request) => {
  const url = new URL(request.url)

  let pathname = url.pathname
  if (pathname.endsWith('/_.data')) {
    pathname = pathname.replace(/_\.data$/, '')
  } else {
    pathname = pathname.replace(/\.data$/, '')
  }

  const searchParams = new URLSearchParams(url.search)
  searchParams.delete('_routes')
  const search = searchParams.toString()

  return search ? `${pathname}?${search}` : pathname
}
