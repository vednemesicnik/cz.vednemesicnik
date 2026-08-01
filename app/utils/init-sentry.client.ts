import * as Sentry from '@sentry/react-router'
import { isRouteErrorResponse } from 'react-router'

// Initialize Sentry in the browser. DSN-gated (via window.ENV) so it stays inert
// when unset. Call once before hydration.
export function initSentryClient() {
  if (!window.ENV?.SENTRY_DSN) return

  Sentry.init({
    beforeSend(event) {
      // Belt-and-suspenders: strip cookies and auth headers even if an
      // integration attaches them (mirrors the server instrument hook).
      if (event.request) {
        delete event.request.cookies

        const headers = event.request.headers
        if (headers) {
          delete headers.cookie
          delete headers.Cookie
          delete headers.authorization
          delete headers.Authorization
        }
      }

      return event
    },
    // Meta's in-app browsers inject an `iabjs://` script that throws on an
    // already-released JS↔Java bridge; paired with `ignoreErrors` below to drop the
    // noise. Both need the default eventFilters integration to stay enabled.
    denyUrls: [/iabjs:\/\//],
    dsn: window.ENV.SENTRY_DSN,
    ignoreErrors: ['Java object is gone', 'Error invoking postMessage'],
    sendDefaultPii: false,
    tracesSampleRate: 0, // error capture only, no performance tracing
  })
}

// Report a client-side router error to Sentry once per error (via HydratedRouter's
// onError), skipping intentional thrown Responses (403/404/429).
export function reportClientErrorToSentry(error: unknown) {
  // Nothing to do when Sentry isn't configured (matches initSentryClient's gate).
  if (!window.ENV?.SENTRY_DSN) return
  if (isRouteErrorResponse(error) || error instanceof Response) return
  Sentry.captureException(error)
}
