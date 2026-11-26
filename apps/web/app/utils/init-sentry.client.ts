import * as Sentry from '@sentry/react-router'
import { isRouteErrorResponse } from 'react-router'

import { scrubSentryEvent } from '~/utils/sentry/scrub-sentry-event'

// Initialize Sentry in the browser. DSN-gated (via window.ENV) so it stays inert
// when unset. Call once before hydration.
export function initSentryClient() {
  if (!window.ENV?.SENTRY_DSN) return

  Sentry.init({
    beforeSend: scrubSentryEvent,
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
