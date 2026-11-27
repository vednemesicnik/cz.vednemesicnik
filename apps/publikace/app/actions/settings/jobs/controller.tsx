import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import type { SignedInUntilCookie } from '../../../auth/session.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import { RUN_LIMIT_MINUTES } from '../../../domain/job-run.ts'
import type { ProofreadersStore } from '../../../data/proofreaders.server.ts'
import {
  MISSING_ADDRESS_JOB_TEXT,
  missingAddressTitle,
  TO_SETTINGS_LABEL,
} from '../../../domain/handover.ts'
import { PROOFREADING_DIGEST_JOB, readDigestRun } from '../../../domain/proofreading-digest.ts'
import {
  canStartFromList,
  canStartFromPage,
  failedCalloutText,
  HISTORY_DAYS,
  historyEvent,
  historyTime,
  isWorthShowing,
  historyWho,
  type Job,
  jobByKey,
  JOBS,
  jobTag,
  neverReportedText,
  scheduleText,
  START_FAILED_TOAST,
  stateOfJob,
  STOPPED_CALLOUT_TITLE,
  stoppedCalloutText,
} from '../../../domain/jobs.ts'
import { now } from '../../../domain/time.ts'
import { requireEditor } from '../../../middleware/auth.server.ts'
import type { JobStarter } from '../../../jobs/job-starter.server.ts'
import { flashToast, Toasts } from '../../../middleware/toasts.server.ts'
import { routes } from '../../../routes.ts'
import type { ToastMessage } from '../../../ui/toast/component.tsx'
import { driveView } from '../../issues/render.tsx'
import { type JobCallout, JobPage, START_FROM_JOB } from './job-page.tsx'
import { JobsPage } from './jobs-page.tsx'

export type JobsDependencies = {
  proofreaders: ProofreadersStore
  runs: JobRunStore
  /** _Spustit teď_ (`14d`, `14e`), for the jobs whose `doPost` the deployment knows. */
  starter: JobStarter
}

function notFound(): Response {
  return new Response('Not Found', { status: 404 })
}

/** _Úlohy na pozadí_ (`14d`, `14e`), read from the runs the jobs reported and nothing else. */
export default function createJobsController(
  signedInUntil: SignedInUntilCookie,
  dependencies: JobsDependencies,
) {
  /** The job's latest runs and its tag, a start that waits for its run included. */
  async function stateNow(job: Job, today: Temporal.Instant) {
    let snapshot = await dependencies.runs.snapshot(job.key, today)
    return { ...snapshot, state: stateOfJob(job, snapshot.latest, today, snapshot) }
  }

  return createController(routes.settings.jobs, {
    middleware: [requireEditor(signedInUntil)],
    actions: {
      async index(context) {
        let today = now()
        let [rows, driveAccount] = await Promise.all([
          Promise.all(
            JOBS.map(async (job) => {
              let { latest, scheduled, state } = await stateNow(job, today)
              let interval = (scheduled ?? latest)?.intervalMinutes
              return {
                name: job.name,
                schedule:
                  interval === undefined ? null : scheduleText(interval, job.window, job.windows),
                showHref: isWorthShowing(state)
                  ? routes.settings.jobs.show.href({ job: job.key })
                  : null,
                startAction:
                  canStartFromList(state) && dependencies.starter.canStart(job.key)
                    ? routes.settings.jobs.start.href({ job: job.key })
                    : null,
                state: state.kind,
                summary: job.summary,
                tag: jobTag(state, today, job, latest),
              }
            }),
          ),
          driveView(context),
        ])

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
        let [{ latest, scheduled, state }, recent, driveAccount] = await Promise.all([
          stateNow(job, today),
          dependencies.runs.history(job.key, since),
          driveView(context),
        ])
        /* A job silent for longer than the history reaches still shows when it last reported,
           which is what _Neběží_ sends the editors here to find (`14d`). */
        let runs = recent.length === 0 && latest !== null ? [latest] : recent
        let canStart = dependencies.starter.canStart(job.key)
        let callout: JobCallout | null = null
        let stopped =
          scheduled === null
            ? null
            : stoppedCalloutText(state, scheduled.intervalMinutes, today, job)
        if (stopped !== null) {
          callout = { error: null, text: stopped, title: STOPPED_CALLOUT_TITLE, tone: 'error' }
        } else if (
          state.kind === 'failed' &&
          latest !== null &&
          job.failedCalloutOf !== undefined
        ) {
          let own = job.failedCalloutOf(latest, failedCalloutText(job, state) ?? '', canStart)
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
              who: historyWho(run),
            }))}
            name={job.name}
            neverText={neverReportedText(job)}
            person={context.auth.identity}
            start={
              canStart && canStartFromPage(state)
                ? {
                    action: routes.settings.jobs.start.href({ job: job.key }),
                    isOnce: state.kind === 'stopped',
                  }
                : null
            }
            toasts={context.get(Toasts) as readonly ToastMessage[]}
          />,
        )
      },

      /**
       * _Spustit teď_ (`14d`, `14e`): records who asked, then has the job's `doPost` run it once.
       * A start already waiting or a run under way sends nothing. When the script does not take
       * it, the row stays as it was and a toast says to try again (`11c`); the row shows _Běží_
       * from the request on, until the run reports.
       */
      async start(context) {
        let job = jobByKey(context.params.job)
        if (job === null || !dependencies.starter.canStart(job.key)) return notFound()
        let from = (context.get(FormData) as FormData).get('from')
        let back = redirect(
          from === START_FROM_JOB
            ? routes.settings.jobs.show.href({ job: job.key })
            : routes.settings.jobs.index.href(),
          303,
        )

        let today = now()
        let { state } = await stateNow(job, today)
        if (state.kind === 'running') return back
        let person = context.auth.identity
        let startKey = crypto.randomUUID()
        let isRequested = await dependencies.runs.requestStart({
          at: today,
          by: { email: person.email, name: person.displayName },
          job: job.key,
          pendingSince: today.subtract({ minutes: RUN_LIMIT_MINUTES }),
          startKey,
        })
        if (!isRequested) return back

        let result = await dependencies.starter.start(job.key, startKey)
        if (!result.ok) {
          await dependencies.runs.markStartFailed(startKey, now())
          flashToast(context, START_FAILED_TOAST, 'error')
        }
        return back
      },
    },
  })
}
