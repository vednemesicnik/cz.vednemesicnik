import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../../../auth/session.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import { jobState } from '../../../domain/job-run.ts'
import {
  failedCalloutText,
  HISTORY_DAYS,
  historyEvent,
  historyTime,
  isWorthShowing,
  jobByKey,
  JOBS,
  jobTag,
  neverReportedText,
  scheduleText,
  STOPPED_CALLOUT_TITLE,
  stoppedCalloutText,
} from '../../../domain/jobs.ts'
import { now } from '../../../domain/time.ts'
import { requireEditor } from '../../../middleware/auth.server.ts'
import { Toasts } from '../../../middleware/toasts.server.ts'
import { routes } from '../../../routes.ts'
import type { ToastMessage } from '../../../ui/toast/component.tsx'
import { driveView } from '../../issues/render.tsx'
import { JobPage } from './job-page.tsx'
import { JobsPage } from './jobs-page.tsx'

export type JobsDependencies = {
  runs: JobRunStore
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

/** _Úlohy na pozadí_ (`14d`, `14e`), read from the runs the jobs reported and nothing else. */
export default function createJobsController(
  signedInUntil: SignedInUntilCookie,
  dependencies: JobsDependencies,
) {
  return createController(routes.settings.jobs, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async index(context) {
        let today = now()
        let [latest, driveAccount] = await Promise.all([
          Promise.all(JOBS.map((job) => dependencies.runs.latest(job.key))),
          driveView(context),
        ])
        let rows = JOBS.map((job, index) => {
          let run = latest[index] ?? null
          let state = jobState(run, today)
          return {
            name: job.name,
            schedule: run === null ? null : scheduleText(run.intervalMinutes),
            showHref: isWorthShowing(state)
              ? routes.settings.jobs.show.href({ job: job.key })
              : null,
            state: state.kind,
            summary: job.summary,
            tag: jobTag(state, today),
          }
        })

        return context.render(
          <JobsPage
            driveAccount={driveAccount}
            person={context.auth.identity}
            rows={rows}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
      },

      async show(context) {
        let job = jobByKey(context.params.job)
        if (job === null) return notFound()

        let today = now()
        let since = today.subtract({ hours: 24 * HISTORY_DAYS })
        let [latest, recent, driveAccount] = await Promise.all([
          dependencies.runs.latest(job.key),
          dependencies.runs.history(job.key, since),
          driveView(context),
        ])
        /* A job silent for longer than the history reaches still shows when it last reported,
           which is what _Neběží_ sends the editors here to find (`14d`). */
        let runs = recent.length === 0 && latest !== null ? [latest] : recent
        let state = jobState(latest, today)
        let failed = failedCalloutText(job, state)
        let stopped =
          latest === null ? null : stoppedCalloutText(state, latest.intervalMinutes, today)
        let callout =
          failed !== null
            ? { error: latest?.error ?? null, text: failed, title: null }
            : stopped !== null
              ? { error: null, text: stopped, title: STOPPED_CALLOUT_TITLE }
              : null

        return context.render(
          <JobPage
            callout={callout}
            driveAccount={driveAccount}
            history={runs.map((run) => ({
              event: historyEvent(job, run, today),
              time: historyTime(run.startedAt),
            }))}
            name={job.name}
            neverText={neverReportedText(job)}
            person={context.auth.identity}
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
      },
    },
  })
}
