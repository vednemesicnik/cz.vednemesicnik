// No import beyond this file's neighbour, because Publikace's typecheck reads it too.
import type {
  PublikaceEnvironment,
  PublikaceEnvironmentResult,
} from './publikace-environment.ts'

/**
 * The running Publikace as `apps/publikace/app/publikace.server.ts` returns it. Written out
 * here so the host's typecheck never reads Publikace's sources; Publikace's own typecheck
 * holds its export to this shape (`app/host-contract.test.ts`).
 */
export type PublikaceApp = {
  close(): Promise<void>
  fetch(request: Request): Promise<Response>
}

/**
 * Hands an unexpected error to the host's error tracking. `area` says which part of Publikace
 * it came from (`request`, `record`, `startup`…).
 */
export type ReportError = (error: unknown, area: string) => void

/** What the host gives Publikace beside its record. */
export type PublikaceHost = {
  reportError?: ReportError
}

/** `createPublikace`: rejects, with nothing left open, when its configuration is wrong. */
export type CreatePublikace = (
  environment: PublikaceEnvironment,
  host?: PublikaceHost,
) => Promise<PublikaceApp>

type StartPublikaceOptions = {
  environment: PublikaceEnvironmentResult
  load: () => Promise<CreatePublikace>
  logError?: (message: string, error?: unknown) => void
  reportError?: ReportError
}

/** Publikace behind the host: its handler, and what stops it. */
export type HostedPublikace = {
  close(): Promise<void>
  fetch(request: Request): Promise<Response>
}

const unavailable = () =>
  new Response('Service Unavailable', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    status: 503,
  })

/**
 * Starts Publikace beside the web without the web ever waiting on it.
 *
 * Its start migrates its database and tidies Drive, so it runs after the port opens. A request
 * for Publikace waits for the start; a start that was refused or rejected is logged once, and
 * Publikace's hosts answer 503 while the web goes on. Only the start is isolated: once running,
 * Publikace shares the process with the web (log 0084).
 *
 * @param options.environment Publikace's record, or why the host refuses to start it.
 * @param options.load Imports `createPublikace`.
 * @param options.logError Where the reason a start failed goes; `console.error` by default.
 * @param options.reportError The host's error tracking: a failed start, and everything Publikace
 *   reports once running. Nothing by default.
 */
export function startPublikace({
  environment,
  load,
  logError = console.error,
  reportError = () => {},
}: StartPublikaceOptions): HostedPublikace {
  const started: Promise<PublikaceApp | null> =
    environment.refusal !== null
      ? Promise.resolve().then(() => {
          logError(`[publikace] not started: ${environment.refusal}`)
          reportError(
            new Error(`Publikace not started: ${environment.refusal}`),
            'startup',
          )
          return null
        })
      : load()
          .then((createPublikace) =>
            createPublikace(environment.environment, { reportError }),
          )
          .catch((error: unknown) => {
            logError('[publikace] the start failed:', error)
            reportError(error, 'startup')
            return null
          })

  return {
    async close() {
      const publikace = await started
      await publikace?.close()
    },
    async fetch(request) {
      const publikace = await started
      return publikace ? publikace.fetch(request) : unavailable()
    },
  }
}
