/**
 * _Úlohy na pozadí_ (`14d`, `14e`): the jobs that report to the app and what a person reads of
 * them. The wording outside the drawing went through the copywriter (`zwo233qd`).
 */

import { isOverdue, type JobRunRecord, type JobState } from './job-run.ts'
import { REPLY_CHECK_JOB, REPLY_CHECK_JOB_NAME } from './reply-check.ts'
import { atTime, clockTime, formatDate, formatDay, formatDayMonth, pragueYear } from './time.ts'

export type Job = {
  /** What a reported failure left behind, in the history and over it: the job's own words. */
  failedCallout: string
  failedEvent: string
  /**
   * The sentence over every editor screen once the job failed twice in a row (`14d`): its name as
   * the subject and one consequence the editors can check, the shape every job's takes (`acs9lly8`).
   */
  failingBanner: string
  /** As `job_runs` names it, and as its address does. */
  key: string
  name: string
  /** The line under the name: what the job does. */
  summary: string
}

/**
 * The jobs that report their runs through the app's API. A job that still reads the sheets is not
 * here: it never reports, and _Zatím se neohlásila_ would be said of a job that runs.
 */
export const JOBS: readonly Job[] = [
  {
    failedCallout: 'Úloha skončila s chybou. Na dílech se nic nezměnilo.',
    failedEvent: 'Skončila s chybou, na dílech se nic nezměnilo',
    /* True of a run that never reported too: an artwork changes only when its run reports. */
    failingBanner: 'Odpovědi k obrazovým dílům se teď v aplikaci nepromítají do stavu děl.',
    key: REPLY_CHECK_JOB,
    name: REPLY_CHECK_JOB_NAME,
    summary: 'přečte „Souhlasím“ k licencím, archivuje',
  },
]

export function jobByKey(key: string | undefined): Job | null {
  return JOBS.find((job) => job.key === key) ?? null
}

export const JOBS_TITLE = 'Úlohy na pozadí'
export const SHOW_JOBS_LABEL = 'Zobrazit úlohy'
export const SHOW_JOB_LABEL = 'Zobrazit'
export const DETAILS_LABEL = 'Zobrazit podrobnosti'

/** The banner when more than one job keeps failing: their sentences would not fit one Callout. */
export const MANY_FAILING_JOBS_BANNER =
  'U několika úloh na pozadí chybí potvrzení, že proběhly v pořádku.'

/** The sentence of the banner over every editor screen for these failing jobs (`14d`). */
export function failingJobsBanner(jobs: readonly Job[]): string {
  let [only, ...others] = jobs
  return only !== undefined && others.length === 0 ? only.failingBanner : MANY_FAILING_JOBS_BANNER
}

/** How far back the history reaches (`14e`). */
export const HISTORY_DAYS = 30
export const HISTORY_FOOT = `Historie ukazuje posledních ${HISTORY_DAYS} dní.`

/** Who started a run: the trigger, until a job can be started by hand. */
export const TRIGGER_WHO = 'systém'

/**
 * The _Kdy_ column, from the interval the job last reported. A rhythm, not a promise: Google picks
 * the minute (`14d`, `1jv85zum`).
 */
export function scheduleText(intervalMinutes: number): string {
  if (intervalMinutes === 1) return 'každou minutu'
  if (intervalMinutes === 60) return 'každou hodinu'
  if (intervalMinutes % 60 === 0) return `každých ${intervalMinutes / 60} h`
  return `každých ${intervalMinutes} min`
}

/**
 * The tag's line sits in a column of about 170 px. It may break between its parts, never inside
 * one: the preposition stays with its time, and _další kolem 9:30_ stays whole (`14d`).
 */
const NBSP = '\u00a0'

function unbroken(text: string): string {
  return text.replaceAll(' ', NBSP)
}

/** _Poslední běh v 9:00_ today, _Poslední běh 14. 11. v 9:00_ on another day. */
export function lastRunText(startedAt: Temporal.Instant, today: Temporal.Instant): string {
  let time = unbroken(atTime(startedAt))
  if (formatDay(startedAt, today) === 'dnes') return `Poslední běh ${time}`
  let date =
    pragueYear(startedAt) === pragueYear(today) ? formatDayMonth(startedAt) : formatDate(startedAt)
  return `Poslední běh ${date} ${time}`
}

/** The tone stays with the page, which knows the design system's tones. */
export type JobTag = { detail?: string; label: string }

/** The tag and its line, as `14d`'s table defines each. */
export function jobTag(state: JobState, today: Temporal.Instant): JobTag {
  switch (state.kind) {
    case 'never':
      return { label: 'Zatím se neohlásila' }
    case 'stopped':
      return { detail: lastRunText(state.lastStartedAt, today), label: 'Neběží' }
    case 'running':
      return { detail: `spuštěno ${unbroken(atTime(state.startedAt))}`, label: 'Běží' }
    case 'failed':
      return { detail: lastRunText(state.lastStartedAt, today), label: 'S chybou' }
    case 'ok': {
      let last = lastRunText(state.lastStartedAt, today)
      return {
        detail:
          state.next === null
            ? last
            : `${last}${NBSP}· ${unbroken(`další kolem ${clockTime(state.next)}`)}`,
        label: 'V pořádku',
      }
    }
  }
}

/**
 * _Zobrazit_ only where somebody first needs to know why: _S chybou_ and _Neběží_ (`14d`). The
 * other tags carry _Spustit teď_ in the drawing, which needs a job that can be started.
 */
export function isWorthShowing(state: JobState): boolean {
  return state.kind === 'failed' || state.kind === 'stopped'
}

/** The line under _Úlohy na pozadí_ in Settings (`14a`), for the one job that reports. */
export function settingsSummary(job: Job, state: JobState, today: Temporal.Instant): string {
  return `${job.name} · ${jobTag(state, today).label}`
}

/** A run in the history, newest first (`14e`). */
export function historyEvent(job: Job, run: JobRunRecord, now: Temporal.Instant): string {
  if (run.finishedAt === null) return isOverdue(run, now) ? 'Neohlásila výsledek' : 'Právě běží'
  return run.outcome === 'failed' ? job.failedEvent : 'Skončila bez chyby'
}

/** `14. 11. 2026 9:00`: the history's own column, with the year and without _v_. */
export function historyTime(instant: Temporal.Instant): string {
  return `${formatDate(instant)} ${clockTime(instant)}`
}

/**
 * The Callout over the history while the job is _S chybou_ (`14e`). It says what holds, because
 * nothing in the app mends a job: what the failure left, the next run while there is one to
 * expect, and who to turn to when it keeps failing.
 */
export function failedCalloutText(job: Job, state: JobState): string | null {
  if (state.kind !== 'failed') return null
  let parts = [
    state.isUnreported ? 'Úloha neohlásila, jak poslední běh skončil.' : job.failedCallout,
  ]
  if (state.next !== null) parts.push(`Další běh proběhne kolem ${clockTime(state.next)}.`)
  parts.push('Pokud se to opakuje, obraťte se na toho, kdo má úlohu na starosti.')
  return parts.join(' ')
}

/** The history of a job that never reported (`13c`, the same sentence over the queue). */
export function neverReportedText(job: Job): string {
  return `Úloha ${job.name} se zatím neohlásila.`
}
