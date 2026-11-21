/**
 * _Úlohy na pozadí_ (`14d`, `14e`): the jobs that report to the app and what a person reads of
 * them. The wording outside the drawing went through the copywriter (`zwo233qd`).
 */

import {
  type DailyWindow,
  isInJobsBanner,
  isOverdue,
  type JobRunRecord,
  type JobState,
  jobState,
} from './job-run.ts'
import {
  DIGEST_BANNER,
  DIGEST_WINDOW,
  digestFailureNote,
  digestRunEvent,
  isDigestAlarm,
  PROOFREADING_DIGEST_JOB,
  PROOFREADING_DIGEST_JOB_NAME,
  PROOFREADING_DIGEST_SUMMARY,
  readDigestRun,
  STOPPED_DIGEST_TEXT,
  UNCONFIRMED_CALLOUT_TEXT,
  UNCONFIRMED_CALLOUT_TITLE,
} from './proofreading-digest.ts'
import { APPROVAL_SEND_JOB, APPROVAL_SEND_JOB_NAME } from './approvals.ts'
import { REPLY_CHECK_JOB, REPLY_CHECK_JOB_NAME } from './reply-check.ts'
import { atTime, clockTime, formatDate, formatDay, formatDayMonth, pragueYear } from './time.ts'
import { NBSP, tied } from './public/typography.ts'

export type Job = {
  /** What a reported failure left behind, in the history and over it: the job's own words. */
  failedCallout: string
  failedEvent: string
  /**
   * The sentence over every editor screen once the job failed twice in a row or stopped reporting
   * (`14i`): its name as the subject and one consequence the editors can check, the shape every
   * job's takes (`acs9lly8`). It names the consequence, not the cause, so it holds for both.
   */
  failingBanner: string
  /** As `job_runs` names it, and as its address does. */
  key: string
  name: string
  /** The line under the name: what the job does. */
  summary: string
  /**
   * For a job that runs once a day at an hour Google picks the minute of: its window, which is
   * its schedule and decides when it is _Neběží_ (`14d`). Without it, the reported interval does.
   */
  window?: DailyWindow
  /** The job's own words for a run that ended, from what it reported (`14e`). */
  runEvent?(run: JobRunRecord): string | null
  /** What a failed run adds to the tag's line, after the last run (`14d`). */
  failureNote?(run: JobRunRecord): string | null
  /** Whether this one run already puts the job in the banner (`14i`); else two failures do. */
  isAlarm?(run: JobRunRecord): boolean
  /** The Callout over the history after a failed run, when the job says more (`14e`). */
  failedCalloutOf?(run: JobRunRecord): { text: string; title: string } | null
  /** The Callout's text while the job is _Neběží_, for a job with a window (`14e`). */
  stoppedText?: string
}

/**
 * The jobs that report their runs through the app's API. A job that still reads the sheets is not
 * here: it never reports, and _Zatím se neohlásila_ would be said of a job that runs.
 */
export const JOBS: readonly Job[] = [
  {
    /* A failed run may still have sent some e-mails and archived some consents: it fails when one
       e-mail went unconfirmed or the replies could not be read at all (`ey9bfcxx`). */
    failedCallout: tied`Úloha skončila s chybou. Některé žádosti už mohly odejít a některé souhlasy se mohly uložit.`,
    failedEvent: 'Skončila s chybou',
    failingBanner: tied`Žádosti a odpovědi u článků se teď nemusí správně promítat do stavu článků.`,
    key: APPROVAL_SEND_JOB,
    name: APPROVAL_SEND_JOB_NAME,
    summary: tied`pošle finální verze autorům, přečte „Souhlasím“, archivuje`,
  },
  {
    failedCallout: tied`Úloha skončila s chybou. Na dílech se nic nezměnilo.`,
    failedEvent: tied`Skončila s chybou, na dílech se nic nezměnilo`,
    /* True of a run that never reported too: an artwork changes only when its run reports. */
    failingBanner: tied`Odpovědi k obrazovým dílům se teď v aplikaci nepromítají do stavu děl.`,
    key: REPLY_CHECK_JOB,
    name: REPLY_CHECK_JOB_NAME,
    summary: tied`přečte „Souhlasím“ k licencím, archivuje`,
  },
  {
    failedCallout: UNCONFIRMED_CALLOUT_TEXT,
    failedCalloutOf(run) {
      let digest = readDigestRun(run.summary)
      if (digest?.kind === 'no-address') return null
      return { text: UNCONFIRMED_CALLOUT_TEXT, title: UNCONFIRMED_CALLOUT_TITLE }
    },
    failedEvent: UNCONFIRMED_CALLOUT_TITLE,
    failingBanner: DIGEST_BANNER,
    failureNote(run) {
      let digest = readDigestRun(run.summary)
      return digest === null ? null : digestFailureNote(digest)
    },
    isAlarm: isDigestAlarm,
    key: PROOFREADING_DIGEST_JOB,
    name: PROOFREADING_DIGEST_JOB_NAME,
    runEvent(run) {
      let digest = readDigestRun(run.summary)
      return digest === null ? null : digestRunEvent(digest)
    },
    stoppedText: STOPPED_DIGEST_TEXT,
    summary: PROOFREADING_DIGEST_SUMMARY,
    window: DIGEST_WINDOW,
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
export const MANY_FAILING_JOBS_BANNER = tied`U několika úloh na pozadí chybí potvrzení, že proběhly v pořádku.`

/** The sentence of the banner over every editor screen for these jobs (`14i`). */
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
export function scheduleText(intervalMinutes: number, window?: DailyWindow): string {
  if (window !== undefined) return `denně ${window.fromHour}:00–${window.toHour}:00`
  if (intervalMinutes === 1) return 'každou minutu'
  if (intervalMinutes === 60) return 'každou hodinu'
  if (intervalMinutes % 60 === 0) return `každých ${intervalMinutes / 60} h`
  return `každých ${intervalMinutes} min`
}

/**
 * The tag's line sits in a column of about 170 px. It may break between its parts, never inside
 * one: the preposition stays with its time, and _další kolem 9:30_ stays whole (`14d`).
 */
function unbroken(text: string): string {
  return text.replaceAll(' ', NBSP)
}

/**
 * _v 9:00_ today, _14. 11. v 9:00_ on another day, with the year in another year. The preposition
 * stays with its time, in the tag's column and in a sentence alike (`14d`, `14e`).
 */
function lastReportedAt(startedAt: Temporal.Instant, today: Temporal.Instant): string {
  let time = unbroken(atTime(startedAt))
  if (formatDay(startedAt, today) === 'dnes') return time
  let date =
    pragueYear(startedAt) === pragueYear(today) ? formatDayMonth(startedAt) : formatDate(startedAt)
  return `${date} ${time}`
}

/** _Poslední běh v 9:00_ today, _Poslední běh 14. 11. v 9:00_ on another day. */
export function lastRunText(startedAt: Temporal.Instant, today: Temporal.Instant): string {
  return `Poslední běh ${lastReportedAt(startedAt, today)}`
}

/** The tone stays with the page, which knows the design system's tones. */
export type JobTag = { detail?: string; label: string }

/** The tag of the job's latest run, by its own rules: its window, and what its runs report. */
export function stateOfJob(job: Job, latest: JobRunRecord | null, now: Temporal.Instant): JobState {
  return jobState(latest, now, job.window)
}

/** Whether the job stands in the banner over every editor screen (`14i`), by its own rules. */
export function isJobInBanner(
  job: Job,
  runs: readonly JobRunRecord[],
  now: Temporal.Instant,
): boolean {
  return isInJobsBanner(runs, now, { isAlarm: job.isAlarm, window: job.window })
}

/**
 * _další se očekává zítra mezi 7:00 a 8:00_, or without _zítra_ after midnight (`14d`). It may
 * break only before _mezi_, so each part stays whole.
 */
function windowNextText(
  window: DailyWindow,
  next: Temporal.Instant,
  today: Temporal.Instant,
): string {
  let isTomorrow = formatDay(next, today) !== 'dnes'
  let expected = unbroken(isTomorrow ? 'další se očekává zítra' : 'další se očekává')
  return `${expected} ${unbroken(`mezi ${window.fromHour}:00 a ${window.toHour}:00`)}`
}

/** The tag and its line, as `14d`'s table defines each. */
export function jobTag(
  state: JobState,
  today: Temporal.Instant,
  job?: Job,
  latest?: JobRunRecord | null,
): JobTag {
  switch (state.kind) {
    case 'never':
      return { label: 'Zatím se neohlásila' }
    case 'stopped':
      return { detail: lastRunText(state.lastStartedAt, today), label: 'Neběží' }
    case 'running':
      return { detail: `spuštěno ${unbroken(atTime(state.startedAt))}`, label: 'Běží' }
    case 'failed': {
      let last = lastRunText(state.lastStartedAt, today)
      let note = latest == null ? null : (job?.failureNote?.(latest) ?? null)
      return {
        detail: note === null ? last : `${last}${NBSP}· ${unbroken(note)}`,
        label: tied`S chybou`,
      }
    }
    case 'ok': {
      let last = lastRunText(state.lastStartedAt, today)
      if (state.next === null) return { detail: last, label: tied`V pořádku` }
      let next =
        job?.window === undefined
          ? unbroken(`další kolem ${clockTime(state.next)}`)
          : windowNextText(job.window, state.next, today)
      return { detail: `${last}${NBSP}· ${next}`, label: tied`V pořádku` }
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
  let own = job.runEvent?.(run) ?? null
  if (own !== null) return own
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

/** The title of the Callout over the history while the job is _Neběží_ (`14e`): the step first. */
export const STOPPED_CALLOUT_TITLE = 'Dejte vědět tomu, kdo má úlohu na starosti.'

/**
 * The Callout's text under that title (`14e`, the copywriter's `8ltizgsg`). It says only what the
 * app knows: how often the job should run and when it last reported. Whether the job stopped
 * running or its reports stopped arriving, the app cannot tell, so neither is claimed. The
 * drawing's sentence about _Spustit teď_ waits for that button.
 */
export function stoppedCalloutText(
  state: JobState,
  intervalMinutes: number,
  today: Temporal.Instant,
  job?: Job,
): string | null {
  if (state.kind !== 'stopped') return null
  if (job?.stoppedText !== undefined) return job.stoppedText
  let when = lastReportedAt(state.lastStartedAt, today)
  return `Úloha má běžet ${scheduleText(intervalMinutes)}. Naposledy se ohlásila ${when}. Příčinu aplikace nezná.`
}

/** The history of a job that never reported (`13c`, the same sentence over the queue). */
export function neverReportedText(job: Job): string {
  return `Úloha ${job.name} se zatím neohlásila.`
}
