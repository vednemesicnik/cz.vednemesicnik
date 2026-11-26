import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../../../auth/session.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import type { ProofreadersStore } from '../../../data/proofreaders.server.ts'
import {
  MISSING_ADDRESS_JOB_TEXT,
  missingAddressTitle,
  TO_SETTINGS_LABEL,
} from '../../../domain/handover.ts'
import { PROOFREADING_DIGEST_JOB, readDigestRun } from '../../../domain/proofreading-digest.ts'
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
  stateOfJob,
  STOPPED_CALLOUT_TITLE,
  stoppedCalloutText,
} from '../../../domain/jobs.ts'
import { now } from '../../../domain/time.ts'
import { requireEditor } from '../../../middleware/auth.server.ts'
import { Toasts } from '../../../middleware/toasts.server.ts'
import { routes } from '../../../routes.ts'
import type { ToastMessage } from '../../../ui/toast/component.tsx'
import { driveView } from '../../issues/render.tsx'
import { type JobCallout, JobPage } from './job-page.tsx'
import { JobsPage } from './jobs-page.tsx'

export type JobsDependencies = {
  proofreaders: ProofreadersStore
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
          let state = stateOfJob(job, run, today)
          return {
            name: job.name,
            schedule:
              run === null ? null : scheduleText(run.intervalMinutes, job.window, job.windows),
            showHref: isWorthShowing(state)
              ? routes.settings.jobs.show.href({ job: job.key })
              : null,
            state: state.kind,
            summary: job.summary,
            tag: jobTag(state, today, job, run),
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
        let state = stateOfJob(job, latest, today)
        let callout: JobCallout | null = null
        let stopped =
          latest === null ? null : stoppedCalloutText(state, latest.intervalMinutes, today, job)
        if (stopped !== null) {
          callout = { error: null, text: stopped, title: STOPPED_CALLOUT_TITLE, tone: 'error' }
        } else if (
          state.kind === 'failed' &&
          latest !== null &&
          job.failedCalloutOf !== undefined
        ) {
          let own = job.failedCalloutOf(latest, failedCalloutText(job, state) ?? '')
          if (own !== null) callout = { error: latest.error, ...own, tone: 'error' }
        } else {
          let failed = failedCalloutText(job, state)
          if (failed !== null) {
            callout = { error: latest?.error ?? null, text: failed, title: null, tone: 'error' }
          }
        }
        /* The digest that had nowhere to go: a warning until the address is saved, not until the
           next run, because saving it is what mends it (`14e`). A job that stopped reporting
           keeps its _Neběží_, which the banner sent the editors here for. */
        if (
          stopped === null &&
          job.key === PROOFREADING_DIGEST_JOB &&
          readDigestRun(latest?.summary ?? null)?.kind === 'no-address' &&
          (await dependencies.proofreaders.find()) === null
        ) {
          let isAdmin = context.auth.identity.isAdmin
          callout = {
            action: isAdmin
              ? { href: `${routes.settings.index.href()}#proofreading`, label: TO_SETTINGS_LABEL }
              : undefined,
            error: null,
            text: MISSING_ADDRESS_JOB_TEXT,
            title: missingAddressTitle(isAdmin),
            tone: 'warning',
          }
        }

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
