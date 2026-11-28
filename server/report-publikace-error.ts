import * as Sentry from '@sentry/react-router'

import type { ReportError } from './start-publikace.ts'

type Capture = (
  error: unknown,
  hint: { tags: Record<string, string> },
) => unknown

/**
 * Publikace's errors in the web's Sentry project, through the client `instrument.server.ts`
 * initialised and its scrubber. Tagged `app: publikace` over the web's `app: web`, with the
 * area Publikace names, and with the tag and commit of the running build when the image has
 * them, so that a report says which version it happened in. Without `SENTRY_DSN` the client is
 * inert and this sends nothing.
 *
 * @param options.capture Sentry's `captureException`; a test hands its own.
 * @param options.commit `PUBLIKACE_COMMIT`, the short commit the deploy built.
 * @param options.version `PUBLIKACE_VERSION`, the tag it runs, `publikace-v1.1.1`.
 */
export function createPublikaceErrorReporter({
  capture = Sentry.captureException,
  commit,
  version,
}: {
  capture?: Capture
  commit?: string
  version?: string
} = {}): ReportError {
  const build: Record<string, string> = {}
  if (commit) build.commit = commit
  if (version) build.version = version

  return (error, area) => {
    capture(error instanceof Error ? error : new Error(String(error)), {
      tags: { app: 'publikace', area, ...build },
    })
  }
}
