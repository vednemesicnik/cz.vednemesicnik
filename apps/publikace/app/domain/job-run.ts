/**
 * The runs of a background job as the app knows them: only from what the job reports (`14d`,
 * `dkssdpyc`). Google starts a trigger in its interval but picks the minute itself, so the next run
 * is an estimate after _kolem_ and is never shown once it has passed (`1jv85zum`).
 */

export type JobRun = {
  intervalMinutes: number
  startedAt: Temporal.Instant
}

export type JobHealth =
  /** _Zatím se neohlásila_: no run reported since the app was deployed. */
  | { kind: 'never' }
  /** _Neběží_: two runs missed in the interval the job last reported. */
  | { kind: 'stopped'; lastStartedAt: Temporal.Instant }
  /** Running on its trigger. `next` is `null` once the estimate has passed. */
  | { kind: 'running'; lastStartedAt: Temporal.Instant; next: Temporal.Instant | null }

/** A run as its job reported it: open until the job says how it ended. */
export type JobRunRecord = JobRun & {
  error: string | null
  finishedAt: Temporal.Instant | null
  outcome: 'failed' | 'ok' | null
}

/** The tag of a job in `14d`, from its latest run. */
export type JobState =
  /** _Zatím se neohlásila_. */
  | { kind: 'never' }
  /** _Neběží_: no run reported in two intervals, whatever the last one did. */
  | { kind: 'stopped'; lastStartedAt: Temporal.Instant }
  /** _Běží_: a run is open and still within its time. */
  | { kind: 'running'; startedAt: Temporal.Instant }
  /**
   * _S chybou_: the run reported a failure (`isUnreported` false), or stayed open past the time a
   * run can last, so it ended without saying how.
   */
  | {
      isUnreported: boolean
      kind: 'failed'
      lastStartedAt: Temporal.Instant
      next: Temporal.Instant | null
    }
  /** _V pořádku_. */
  | { kind: 'ok'; lastStartedAt: Temporal.Instant; next: Temporal.Instant | null }

/**
 * Apps Script stops a run after six minutes, so a run still open this long after its start ended
 * without reporting.
 */
export const RUN_LIMIT_MINUTES = 10

/** The clocks of Google and of the machine, and a run's own length, may disagree by this much. */
const GRACE_MINUTES = 5

function roundToFiveMinutes(instant: Temporal.Instant): Temporal.Instant {
  return instant.round({ roundingIncrement: 5, smallestUnit: 'minute' })
}

export function jobHealth(latest: JobRun | null, now: Temporal.Instant): JobHealth {
  if (latest === null) return { kind: 'never' }
  let missedTwice = latest.startedAt.add({
    minutes: latest.intervalMinutes * 2 + GRACE_MINUTES,
  })
  if (Temporal.Instant.compare(now, missedTwice) > 0) {
    return { kind: 'stopped', lastStartedAt: latest.startedAt }
  }
  let next = roundToFiveMinutes(latest.startedAt.add({ minutes: latest.intervalMinutes }))
  return {
    kind: 'running',
    lastStartedAt: latest.startedAt,
    next: Temporal.Instant.compare(now, next) > 0 ? null : next,
  }
}

/** A run still open past the time a run can last. */
export function isOverdue(run: JobRunRecord, now: Temporal.Instant): boolean {
  let limit = run.startedAt.add({ minutes: RUN_LIMIT_MINUTES })
  return run.finishedAt === null && Temporal.Instant.compare(now, limit) > 0
}

/**
 * The job's tag (`14d`). _Neběží_ wins over what the last run did, as `jobHealth()` decides it;
 * the estimate of the next run is the same one, and _S chybou_ keeps it for the detail (`14e`).
 */
export function jobState(latest: JobRunRecord | null, now: Temporal.Instant): JobState {
  let health = jobHealth(latest, now)
  if (latest === null || health.kind === 'never') return { kind: 'never' }
  if (health.kind === 'stopped') return health
  if (latest.finishedAt === null && !isOverdue(latest, now)) {
    return { kind: 'running', startedAt: latest.startedAt }
  }
  if (latest.finishedAt === null || latest.outcome === 'failed') {
    return {
      isUnreported: latest.finishedAt === null,
      kind: 'failed',
      lastStartedAt: latest.startedAt,
      next: health.next,
    }
  }
  return { kind: 'ok', lastStartedAt: latest.startedAt, next: health.next }
}

/** Runs in a row that failed before the banner over the screens shows (`14d`): one is not enough. */
export const FAILURES_FOR_BANNER = 2

/**
 * Whether the job's latest runs that ended all failed, `FAILURES_FOR_BANNER` of them (`14d`,
 * _S chybou_): reported `failed`, or open past the time a run can last. `runs` come newest first.
 * A run still within its time is skipped, so the banner holds while the next attempt runs instead
 * of going for its minute and coming back when it fails too.
 */
export function isFailingRepeatedly(runs: readonly JobRunRecord[], now: Temporal.Instant): boolean {
  let ended = runs.filter((run) => run.finishedAt !== null || isOverdue(run, now))
  let latest = ended.slice(0, FAILURES_FOR_BANNER)
  return (
    latest.length === FAILURES_FOR_BANNER &&
    latest.every((run) => run.finishedAt === null || run.outcome === 'failed')
  )
}
