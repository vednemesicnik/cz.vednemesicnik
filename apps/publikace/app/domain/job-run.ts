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

/** Who started a run by hand (`14e`), as they were signed in. */
export type StartedBy = { email: string; name: string }

/** A run as its job reported it: open until the job says how it ended. */
export type JobRunRecord = JobRun & {
  error: string | null
  finishedAt: Temporal.Instant | null
  outcome: 'failed' | 'ok' | null
  /** Who started it by hand; absent or `null` for a run its trigger started. */
  startedBy?: StartedBy | null
  /** What the run reported beyond its outcome, as JSON in the job's own shape (`14e`). */
  summary: string | null
}

/**
 * A job that runs once a day and whose trigger Google fires at a minute it picks within an hour
 * of Prague time (`atHour`, `14d`), as the proofreaders' digest does between 7 and 8.
 */
export type DailyWindow = { fromHour: number; toHour: number }

/**
 * A job whose triggers fire every few hours from an hour of Prague time, one daily `atHour`
 * trigger for each of 0:00, 3:00 … 21:00, each run at a minute Google picks within its hour
 * (`14d`, _každé 3 h od 0:00_), as the comment digest does. `everyHours(3)` would not do: it
 * cannot be told to start at 0:00. Each such hour is a window, one hour long.
 */
export type HourlyWindows = { everyHours: number; fromHour: number }

/** How a job's schedule is known when not from its reported interval. */
export type JobWindow = DailyWindow | HourlyWindows

function isHourly(window: JobWindow): window is HourlyWindows {
  return 'everyHours' in window
}

const TIME_ZONE = 'Europe/Prague'

/** The first window that starts after the moment, and where it ends. */
export function nextWindow(
  window: DailyWindow,
  after: Temporal.Instant,
): { end: Temporal.Instant; start: Temporal.Instant } {
  let day = after.toZonedDateTimeISO(TIME_ZONE).toPlainDate()
  let startOn = (date: Temporal.PlainDate) =>
    date
      .toZonedDateTime({
        plainTime: Temporal.PlainTime.from({ hour: window.fromHour }),
        timeZone: TIME_ZONE,
      })
      .toInstant()
  let start = startOn(day)
  if (Temporal.Instant.compare(start, after) <= 0) start = startOn(day.add({ days: 1 }))
  return { end: start.add({ hours: window.toHour - window.fromHour }), start }
}

/** The first of the hourly windows that starts after the moment, and where it ends. */
export function nextHourlyWindow(
  windows: HourlyWindows,
  after: Temporal.Instant,
): { end: Temporal.Instant; start: Temporal.Instant } {
  let day = after.toZonedDateTimeISO(TIME_ZONE).toPlainDate()
  for (let offset = 0; ; offset += 1) {
    let date = day.add({ days: offset })
    for (let hour = windows.fromHour; hour < 24; hour += windows.everyHours) {
      let start = date
        .toZonedDateTime({ plainTime: Temporal.PlainTime.from({ hour }), timeZone: TIME_ZONE })
        .toInstant()
      if (Temporal.Instant.compare(start, after) > 0) return { end: start.add({ hours: 1 }), start }
    }
  }
}

/**
 * What decides a job's tag beside its latest run. A run started by hand says nothing about the
 * trigger, so _Neběží_ and the next run come from the latest scheduled run alone; a start that
 * waits for its run makes the job _Běží_ from the moment it was asked for (`14d`).
 */
export type JobStateFacts = {
  pendingStartAt?: Temporal.Instant | null
  /** The latest run its trigger started; when absent, `latest` is taken as one. */
  scheduled?: JobRun | null
}

/** The tag of a job in `14d`, from its latest run. */
export type JobState =
  /** _Zatím se neohlásila_. */
  | { kind: 'never' }
  /** _Neběží_: no run reported in two intervals, whatever the last one did. */
  | { kind: 'stopped'; lastStartedAt: Temporal.Instant }
  /** _Běží_: a run is open and still within its time, or a start by hand waits for its run. */
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

/**
 * A job with a daily window is _Neběží_ once the window after its last run has passed without a
 * run, one morning and not two: each missed digest is a day the proofreaders heard nothing
 * (`14i`, `ojfczb2m`). Its next run is the window's start, shown until the window ends.
 */
function windowHealth(latest: JobRun, now: Temporal.Instant, window: DailyWindow): JobHealth {
  let next = nextWindow(window, latest.startedAt)
  if (Temporal.Instant.compare(now, next.end.add({ minutes: GRACE_MINUTES })) > 0) {
    return { kind: 'stopped', lastStartedAt: latest.startedAt }
  }
  return {
    kind: 'running',
    lastStartedAt: latest.startedAt,
    next: Temporal.Instant.compare(now, next.end) > 0 ? null : next.start,
  }
}

/**
 * A job with hourly windows is _Neběží_ once two windows after its last run have passed without a
 * run, as an interval job is after two intervals (`14d`). The run itself falls somewhere in its own
 * window, so the next window is the first that starts a few minutes after it, which also keeps a
 * clock that runs a little ahead from counting the run's own window. Its next run is that window's
 * start, shown until the window ends.
 */
function hourlyHealth(latest: JobRun, now: Temporal.Instant, windows: HourlyWindows): JobHealth {
  let next = nextHourlyWindow(windows, latest.startedAt.add({ minutes: GRACE_MINUTES }))
  let second = nextHourlyWindow(windows, next.start)
  if (Temporal.Instant.compare(now, second.end.add({ minutes: GRACE_MINUTES })) > 0) {
    return { kind: 'stopped', lastStartedAt: latest.startedAt }
  }
  return {
    kind: 'running',
    lastStartedAt: latest.startedAt,
    next: Temporal.Instant.compare(now, next.end) > 0 ? null : next.start,
  }
}

export function jobHealth(
  latest: JobRun | null,
  now: Temporal.Instant,
  window?: JobWindow,
): JobHealth {
  if (latest === null) return { kind: 'never' }
  if (window !== undefined && isHourly(window)) return hourlyHealth(latest, now, window)
  if (window !== undefined) return windowHealth(latest, now, window)
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
 * The job's tag (`14d`). A run under way or a start waiting for its run is _Běží_. Otherwise
 * _Neběží_ wins over what the last run did, as `jobHealth()` decides it from the latest scheduled
 * run; the estimate of the next run is the same one, and _S chybou_ keeps it for the detail
 * (`14e`). A job only ever started by hand has no estimate and is never _Neběží_.
 */
export function jobState(
  latest: JobRunRecord | null,
  now: Temporal.Instant,
  window?: JobWindow,
  facts: JobStateFacts = {},
): JobState {
  if (latest !== null && latest.finishedAt === null && !isOverdue(latest, now)) {
    return { kind: 'running', startedAt: latest.startedAt }
  }
  let pendingStartAt = facts.pendingStartAt ?? null
  if (pendingStartAt !== null) return { kind: 'running', startedAt: pendingStartAt }
  if (latest === null) return { kind: 'never' }
  let health = jobHealth(facts.scheduled === undefined ? latest : facts.scheduled, now, window)
  if (health.kind === 'stopped') return health
  let next = health.kind === 'running' ? health.next : null
  if (latest.finishedAt === null || latest.outcome === 'failed') {
    return {
      isUnreported: latest.finishedAt === null,
      kind: 'failed',
      lastStartedAt: latest.startedAt,
      next,
    }
  }
  return { kind: 'ok', lastStartedAt: latest.startedAt, next }
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

/**
 * Whether the job stands in the banner over every editor screen (`14i`): its latest runs failed
 * twice in a row, or it is _Neběží_. `runs` come newest first. _Neběží_ is read from `scheduled`,
 * the latest run its trigger started, or else the first such run in `runs`: a run by hand mends no
 * trigger. A job that never reported stays out: it has no interval to miss, and until its trigger
 * runs as `publikace.app@` the banner would stand from the deployment on (`r1oqllvb`).
 */
export function isInJobsBanner(
  runs: readonly JobRunRecord[],
  now: Temporal.Instant,
  rules: {
    isAlarm?: (run: JobRunRecord) => boolean
    scheduled?: JobRun | null
    window?: JobWindow
  } = {},
): boolean {
  let scheduled =
    rules.scheduled === undefined
      ? (runs.find((run) => (run.startedBy ?? null) === null) ?? null)
      : rules.scheduled
  if (jobHealth(scheduled, now, rules.window).kind === 'stopped') return true
  if (rules.isAlarm === undefined) return isFailingRepeatedly(runs, now)
  /* A job with its own rule stands in the banner from the first run that alarms (`14i`). */
  let latest = runs.find((run) => run.finishedAt !== null || isOverdue(run, now))
  return latest !== undefined && rules.isAlarm(latest)
}
