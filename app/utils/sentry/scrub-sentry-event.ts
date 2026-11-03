// Imported by instrument.server.ts, which Node runs by type stripping and ahead of
// the app bundle: keep it free of path aliases and runtime imports.

import type { ErrorEvent } from '@sentry/react-router'

const SECRET_HEADERS = new Set(['authorization', 'cookie', 'x-origin-secret'])
const REFERER_HEADER = 'referer'
const BREADCRUMB_URL_FIELDS = ['url', 'from', 'to']
const BREADCRUMB_QUERY_FIELDS = ['http.query', 'http.fragment']

const removeQueryAndFragment = (url: string) => url.split(/[?#]/, 1)[0]

/**
 * Removes what must not reach Sentry from an event: request bodies (typed
 * passwords, application data), cookies and secret headers, and every query
 * string, because sign-in links and OAuth callbacks carry live tokens in theirs.
 */
export const scrubSentryEvent = (event: ErrorEvent): ErrorEvent => {
  const { breadcrumbs, request } = event

  if (request) {
    delete request.cookies
    delete request.data
    delete request.query_string

    if (request.url) request.url = removeQueryAndFragment(request.url)

    for (const [name, value] of Object.entries(request.headers ?? {})) {
      const lowerCaseName = name.toLowerCase()

      if (SECRET_HEADERS.has(lowerCaseName)) {
        delete request.headers?.[name]
      } else if (lowerCaseName === REFERER_HEADER && request.headers) {
        request.headers[name] = removeQueryAndFragment(value)
      }
    }
  }

  for (const { data } of breadcrumbs ?? []) {
    if (!data) continue

    for (const field of BREADCRUMB_QUERY_FIELDS) delete data[field]

    for (const field of BREADCRUMB_URL_FIELDS) {
      const value = data[field]
      if (typeof value === 'string') data[field] = removeQueryAndFragment(value)
    }
  }

  return event
}
