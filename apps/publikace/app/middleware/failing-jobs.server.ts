import { Auth } from 'remix/middleware/auth'
import { createContextKey, type Middleware } from 'remix/router'

import type { JobRunStore } from '../data/job-runs.server.ts'
import { FAILURES_FOR_BANNER, isFailingRepeatedly } from '../domain/job-run.ts'
import { type Job, JOBS } from '../domain/jobs.ts'

/**
 * The jobs in `JOBS` whose latest runs failed twice in a row, for the banner over every editor
 * screen (`14d`). Read with `context.get(FailingJobs)`; the banner reads it from the request it is
 * drawn in, as the panel reads `ReviewCount`, so no page has to pass it down.
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
  /* Only for a signed-in editor: the sign-in and the pages behind a link draw no banner. */
  return async (context, next) => {
    if (context.get(Auth)?.ok === true) {
      let at = now()
      let latest = await Promise.all(JOBS.map((job) => runs.latestRuns(job.key, RUNS_READ)))
      context.set(
        FailingJobs,
        JOBS.filter((_job, index) => isFailingRepeatedly(latest[index] ?? [], at)),
      )
    }
    return next()
  }
}
