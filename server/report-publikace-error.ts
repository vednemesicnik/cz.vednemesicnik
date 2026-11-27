import * as Sentry from '@sentry/react-router'

import type { ReportError } from './start-publikace.ts'

type Capture = (
  error: unknown,
  hint: { tags: Record<string, string> },
) => unknown

/**
 * Publikace's errors in the web's Sentry project, through the client `instrument.server.ts`
 * initialised and its scrubber. Tagged `app: publikace` over the web's `app: web`, and with
 * the area Publikace names. Without `SENTRY_DSN` the client is inert and this sends nothing.
 *
 * @param capture Sentry's `captureException`; a test hands its own.
 */
export function createPublikaceErrorReporter(
  capture: Capture = Sentry.captureException,
): ReportError {
  return (error, area) => {
    capture(error instanceof Error ? error : new Error(String(error)), {
      tags: { app: 'publikace', area },
    })
  }
}
