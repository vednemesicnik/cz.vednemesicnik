import { Auth } from 'remix/middleware/auth'
import { createContextKey, type Middleware } from 'remix/router'

import type { JobRunStore } from '../data/job-runs.server.ts'
import { FAILURES_FOR_BANNER } from '../domain/job-run.ts'
import { isJobInBanner, type Job, JOBS } from '../domain/jobs.ts'
import type { Person } from './auth.server.ts'

/**
 * The jobs in `JOBS` whose latest runs failed twice in a row, or once for a job whose one failure
 * already alarms (the proofreaders' digest), or that stopped reporting, each once
 * and in the order of `JOBS`, for the banner over every editor screen (`14i`). Read with
 * `context.get(FailingJobs)`; the banner reads it from the request it is drawn in, as the panel
 * reads `ReviewCount`, so no page has to pass it down.
 */
export const FailingJobs = createContextKey<readonly Job[]>([])

/**
 * One run more than the rule needs, so a run in progress can be skipped. Only a job whose interval
 * is shorter than `RUN_LIMIT_MINUTES` could have two open at once; the banner then waits for them.
 */
const RUNS_READ = FAILURES_FOR_BANNER + 1

export function loadFailingJobs(
  runs: JobRunStore,
  now: () => Temporal.Instant,
): Middleware<{ key: typeof FailingJobs; property: 'failingJobs'; value: readonly Job[] }> {
  /* Only for a signed-in editor-in-chief: the sign-in and the pages behind a link draw no
     banner, and a proofreader is shown none, as it leads into Nastavení. */
  return async (context, next) => {
    let state = context.get(Auth)
    if (state?.ok === true && (state.identity as Person).isEditor) {
      let at = now()
      let latest = await Promise.all(JOBS.map((job) => runs.latestRuns(job.key, RUNS_READ)))
      context.set(
        FailingJobs,
        JOBS.filter((job, index) => isJobInBanner(job, latest[index] ?? [], at)),
      )
    }
    return next()
  }
}
