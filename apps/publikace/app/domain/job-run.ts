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
