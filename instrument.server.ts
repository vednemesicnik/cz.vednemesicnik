// Server-side Sentry init, loaded via --import before the app so init runs before
// any request. Reads SENTRY_DSN from process.env directly (it runs ahead of the
// app's env validation); unset → SDK stays inert.

import * as Sentry from '@sentry/react-router'

import { scrubSentryEvent } from './app/utils/sentry/scrub-sentry-event.ts'

// Gate on the DSN: calling Sentry.init at all registers OpenTelemetry module
// hooks (and emits a Node deprecation warning), so skip it entirely when unset to
// keep the SDK fully inert with zero side effects for local development.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    beforeSend: scrubSentryEvent,
    dsn: process.env.SENTRY_DSN,
    // The SDK keeps incoming bodies for its events by default, whatever
    // sendDefaultPii says; a sign-in POST carries the typed password.
    integrations: [
      Sentry.httpIntegration({ maxIncomingRequestBodySize: 'none' }),
    ],
    sendDefaultPii: false, // no IP/cookies auto-attached (consistent with auth-log: never trust spoofable IPs)
    tracesSampleRate: 0, // error capture only, no performance tracing
  })
}
