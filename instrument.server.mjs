// Server-side Sentry initialization. Loaded before the app via
// NODE_OPTIONS='--import ./instrument.server.mjs' (see package.json scripts) so the
// SDK is active before any request is handled. Reads SENTRY_DSN directly from
// process.env because this runs ahead of the app's Zod validation; Fly injects
// secrets as real env vars at process start.

import * as Sentry from '@sentry/react-router'

// Gate on the DSN: calling Sentry.init at all registers OpenTelemetry module
// hooks (and emits a Node deprecation warning), so skip it entirely when unset to
// keep the SDK fully inert with zero side effects for local development.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    beforeSend(event) {
      // Belt-and-suspenders: strip cookies and auth headers even if an
      // integration attaches them.
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
    dsn: process.env.SENTRY_DSN,
    sendDefaultPii: false, // no IP/cookies auto-attached (consistent with auth-log: never trust spoofable IPs)
    tracesSampleRate: 0, // error capture only, no performance tracing
  })
}
