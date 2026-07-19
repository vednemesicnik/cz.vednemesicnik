/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import * as Sentry from '@sentry/react-router'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { isRouteErrorResponse } from 'react-router'
import { HydratedRouter } from 'react-router/dom'

// Gate on the DSN so the SDK stays fully inert (no init side effects) when unset.
if (window.ENV?.SENTRY_DSN) {
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
    dsn: window.ENV.SENTRY_DSN,
    sendDefaultPii: false,
    tracesSampleRate: 0, // error capture only, no performance tracing
  })
}

// Report client-side middleware/loader/action/render errors once per error (RR
// calls onError a single time, unlike the re-rendering ErrorBoundary).
const handleError: (error: unknown) => void = (error) => {
  // Thrown Responses (403/404/429) are intentional control flow, not failures.
  if (isRouteErrorResponse(error) || error instanceof Response) return
  Sentry.captureException(error)
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={handleError} />
    </StrictMode>,
  )
})
