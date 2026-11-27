// Imported by the host's instrument.server.ts at the repository root, which Node runs by
// type stripping and ahead of the app bundle: keep it free of path aliases and runtime imports.

import type { ErrorEvent } from '@sentry/react-router'

const SECRET_HEADERS = new Set(['authorization', 'cookie', 'x-origin-secret'])
const REFERER_HEADER = 'referer'
const BREADCRUMB_URL_FIELDS = ['url', 'from', 'to']
const BREADCRUMB_QUERY_FIELDS = ['http.query', 'http.fragment']

// Publikace's shared links carry their key in the path (`/l/{key}/article`), and its
// requests pass through the same process.
const SHARED_LINK_KEY = /\/l\/[^/]+/

const removeSecretsFromUrl = (url: string) =>
  url.split(/[?#]/, 1)[0].replace(SHARED_LINK_KEY, '/l/…')

/**
 * Removes what must not reach Sentry from an event: request bodies (typed
 * passwords, application data), cookies and secret headers, every query string,
 * because sign-in links and OAuth callbacks carry live tokens in theirs, and the
 * key of a Publikace shared link.
 */
export const scrubSentryEvent = (event: ErrorEvent): ErrorEvent => {
  const { breadcrumbs, request } = event

  // The SDK names every incoming request's scope `METHOD /path`, tracing or not.
  if (event.transaction)
    event.transaction = removeSecretsFromUrl(event.transaction)

  if (request) {
    delete request.cookies
    delete request.data
    delete request.query_string

    if (request.url) request.url = removeSecretsFromUrl(request.url)

    for (const [name, value] of Object.entries(request.headers ?? {})) {
      const lowerCaseName = name.toLowerCase()

      if (SECRET_HEADERS.has(lowerCaseName)) {
        delete request.headers?.[name]
      } else if (lowerCaseName === REFERER_HEADER && request.headers) {
        request.headers[name] = removeSecretsFromUrl(value)
      }
    }
  }

  for (const { data } of breadcrumbs ?? []) {
    if (!data) continue

    for (const field of BREADCRUMB_QUERY_FIELDS) delete data[field]

    for (const field of BREADCRUMB_URL_FIELDS) {
      const value = data[field]
      if (typeof value === 'string') data[field] = removeSecretsFromUrl(value)
    }
  }

  return event
}
