import type { JobStartEndpoint } from '../auth/environment.server.ts'
import { signEnvelope } from '../auth/signed-envelope.server.ts'

/**
 * Starts a background job once, by hand (`14d`, `14e`): a signed call to the `doPost` of the
 * job's Apps Script project, which answers at once and runs the job from a one-off trigger as
 * `publikace.app@`. The job's claim then carries the `startKey` back, which tells its run apart.
 */
export type JobStarter = {
  /** Whether the deployment knows that job's `doPost`. */
  canStart(job: string): boolean
  start(job: string, startKey: string): Promise<JobStartResult>
}

export type JobStartResult = { ok: true } | { error: string; ok: false }

/**
 * Never throws: a script that is not configured, a timeout, a redirect loop or an answer that is
 * not `{ ok: true }` is a failure with its reason logged.
 */
export function createJobStarter(
  endpoints: Readonly<Record<string, JobStartEndpoint>>,
  options: { fetch?: typeof fetch; now?: () => number; timeoutMs?: number } = {},
): JobStarter {
  let send = options.fetch ?? fetch
  let seconds = options.now ?? (() => Math.floor(Date.now() / 1000))

  return {
    canStart: (job) => Object.hasOwn(endpoints, job),

    async start(job, startKey) {
      let endpoint = Object.hasOwn(endpoints, job) ? endpoints[job] : undefined
      if (endpoint === undefined) return failed(job, 'not configured')
      let envelope = signEnvelope(endpoint.secret, JSON.stringify({ job, startKey }), seconds())
      try {
        let response = await send(endpoint.url, {
          body: JSON.stringify(envelope),
          // Apps Script reads the body whatever its type; text/plain needs no CORS preflight.
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          method: 'POST',
          // A web app's /exec answers with a redirect to script.googleusercontent.com.
          redirect: 'follow',
          signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
        })
        if (!response.ok) return failed(job, `HTTP ${response.status}`)
        let answer = (await response.json()) as { error?: unknown; ok?: unknown }
        if (answer.ok === true) return { ok: true }
        return failed(job, typeof answer.error === 'string' ? answer.error : 'unknown')
      } catch (error) {
        return failed(job, error instanceof Error ? error.message : 'unknown error')
      }
    },
  }
}

function failed(job: string, reason: string): JobStartResult {
  console.error(`[jobs] ${job} was not started: ${reason.slice(0, 200)}`)
  return { error: reason, ok: false }
}
