import type { Handle } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'

import { failingJobsBanner, SHOW_JOBS_LABEL } from '../../domain/jobs.ts'
import { FailingJobs } from '../../middleware/failing-jobs.server.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../callout/component.tsx'

/**
 * The banner over every screen of the editors-in-chief once a job failed twice in a row (`14d`),
 * shaped like the account's (`14c`): error, one action, no close, as long as the state lasts. It
 * reads the failing jobs from the request, so no page passes them. On _Úlohy na pozadí_ itself the
 * action goes, because the table it would open is right under it.
 */
export function JobsBanner(_handle: Handle) {
  return () => {
    let context = getContext()
    let jobs = context.get(FailingJobs)
    if (jobs.length === 0) return null

    let jobsHref = routes.settings.jobs.index.href()
    let isOnJobs = context.url.pathname === jobsHref

    return (
      <Callout tone="error">
        <p style={{ margin: isOnJobs ? 0 : '0 0 8px' }}>{failingJobsBanner(jobs)}</p>
        {isOnJobs ? null : (
          <div class="vdm-callout__actions">
            <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={jobsHref}>
              {SHOW_JOBS_LABEL}
            </a>
          </div>
        )}
      </Callout>
    )
  }
}
