import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import {
  type JobRunRecord,
  type JobStateFacts,
  RUN_LIMIT_MINUTES,
  type StartedBy,
} from '../domain/job-run.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The runs the background jobs report (`14d`). A run opens with the interval of the job's trigger
 * and closes with its outcome; the app knows a job only from these. A start by hand (`14e`) is a
 * request the job's claim redeems with its `startKey`, which makes that run the starter's.
 */
export type JobRunStore = {
  /**
   * Opens a run under its key, `false` with nothing opened when its `startKey` is not an unredeemed
   * start of that job: a key opens one run at most.
   */
  start(run: {
    at: Temporal.Instant
    intervalMinutes: number
    job: string
    runKey: string
    startKey?: string
  }): Promise<boolean>
  /**
   * Records a start by hand under its key, `false` with nothing recorded while another start of
   * that job requested since `pendingSince` waits for its run.
   */
  requestStart(start: {
    at: Temporal.Instant
    by: StartedBy
    job: string
    pendingSince: Temporal.Instant
    startKey: string
  }): Promise<boolean>
  /** Marks a start the job's script did not accept: it no longer waits for a run. */
  markStartFailed(startKey: string, at: Temporal.Instant): Promise<void>
  /** When the start of that job that still waits for its run was requested, since that moment. */
  pendingStart(job: string, since: Temporal.Instant): Promise<Temporal.Instant | null>
  /** The job's latest run its trigger started, not a start by hand. */
  latestScheduled(job: string): Promise<JobRunRecord | null>
  /**
   * What the job's tag is read from (`jobState`): its latest run, its latest scheduled run, and a
   * start by hand that has waited for its run less than a run can last.
   */
  snapshot(job: string, now: Temporal.Instant): Promise<JobSnapshot>
  /** Closes the run of that job and key; `false` for one that is not open. */
  finish(
    job: string,
    runKey: string,
    result: {
      at: Temporal.Instant
      error: string | null
      outcome: 'failed' | 'ok'
      summary?: string | null
    },
  ): Promise<boolean>
  /** Whether that job has an open run under that key. */
  isOpen(job: string, runKey: string): Promise<boolean>
  /** The job's latest run, finished or not. */
  latest(job: string): Promise<JobRunRecord | null>
  /** The job's latest runs, finished or not, the newest first, at most `limit` of them. */
  latestRuns(job: string, limit: number): Promise<JobRunRecord[]>
  /** The job's runs started since then, the newest first (`14e`). */
  history(job: string, since: Temporal.Instant): Promise<JobRunRecord[]>
}

export type JobSnapshot = Required<JobStateFacts> & { latest: JobRunRecord | null }

function recordOf(row: Record<string, unknown> | undefined): JobRunRecord | null {
  let startedAt = parseStamp(row?.['started_at'])
  if (row === undefined || startedAt === null) return null
  let outcome = row['outcome']
  let error = row['error_text']
  let summary = row['summary']
  let email = row['requested_by_email']
  let name = row['requested_by_name']
  return {
    error: typeof error === 'string' ? error : null,
    finishedAt: parseStamp(row['finished_at']),
    intervalMinutes: Number(row['interval_minutes']),
    outcome: outcome === 'ok' || outcome === 'failed' ? outcome : null,
    startedAt,
    startedBy: typeof email === 'string' && typeof name === 'string' ? { email, name } : null,
    summary: typeof summary === 'string' ? summary : null,
  }
}

/* A run with the start by hand that opened it, if one did. */
const RUN_COLUMNS = sql`SELECT r.started_at, r.interval_minutes, r.finished_at, r.outcome, r.error_text,
    r.summary, s.requested_by_email, s.requested_by_name
  FROM job_runs r LEFT JOIN job_starts s ON s.run_key = r.run_key`

export function createJobRunStore(database: Database): JobRunStore {
  let store: JobRunStore = {
    start(run) {
      return database.transaction(async (db) => {
        if (run.startKey !== undefined) {
          let redeemed = await db.exec(
            sql`UPDATE job_starts SET run_key = ${run.runKey}
                WHERE job = ${run.job} AND start_key = ${run.startKey} AND run_key IS NULL`,
          )
          if ((redeemed.affectedRows ?? 0) !== 1) return false
        }
        await db.exec(
          sql`INSERT INTO job_runs (job, run_key, started_at, interval_minutes)
              VALUES (${run.job}, ${run.runKey}, ${stamp(run.at)}, ${run.intervalMinutes})`,
        )
        return true
      })
    },

    async requestStart(start) {
      let inserted = await database.exec(
        sql`INSERT INTO job_starts (job, start_key, requested_by_email, requested_by_name, requested_at)
            SELECT ${start.job}, ${start.startKey}, ${start.by.email}, ${start.by.name}, ${stamp(start.at)}
            WHERE NOT EXISTS (
              SELECT 1 FROM job_starts
              WHERE job = ${start.job} AND run_key IS NULL AND failed_at IS NULL
                AND requested_at >= ${stamp(start.pendingSince)}
            )`,
      )
      return (inserted.affectedRows ?? 0) === 1
    },

    async markStartFailed(startKey, at) {
      await database.exec(
        sql`UPDATE job_starts SET failed_at = ${stamp(at)}
            WHERE start_key = ${startKey} AND run_key IS NULL`,
      )
    },

    async pendingStart(job, since) {
      let result = await database.exec(
        sql`SELECT requested_at FROM job_starts
            WHERE job = ${job} AND run_key IS NULL AND failed_at IS NULL
              AND requested_at >= ${stamp(since)}
            ORDER BY requested_at DESC, id DESC LIMIT 1`,
      )
      return parseStamp(result.rows?.[0]?.['requested_at'])
    },

    async snapshot(job, now) {
      let [latest, scheduled, pendingStartAt] = await Promise.all([
        store.latest(job),
        store.latestScheduled(job),
        store.pendingStart(job, now.subtract({ minutes: RUN_LIMIT_MINUTES })),
      ])
      return { latest, pendingStartAt, scheduled }
    },

    async latestScheduled(job) {
      let result = await database.exec(
        sql`${RUN_COLUMNS} WHERE r.job = ${job} AND s.id IS NULL
            ORDER BY r.started_at DESC, r.id DESC LIMIT 1`,
      )
      return recordOf(result.rows?.[0])
    },

    async finish(job, runKey, result) {
      let updated = await database.exec(
        sql`UPDATE job_runs SET finished_at = ${stamp(result.at)}, outcome = ${result.outcome},
              error_text = ${result.error === null ? null : result.error.slice(0, 2000)},
              summary = ${result.summary ?? null}
            WHERE job = ${job} AND run_key = ${runKey} AND finished_at IS NULL`,
      )
      return (updated.affectedRows ?? 0) === 1
    },

    async isOpen(job, runKey) {
      let result = await database.exec(
        sql`SELECT 1 FROM job_runs
            WHERE job = ${job} AND run_key = ${runKey} AND finished_at IS NULL`,
      )
      return (result.rows ?? []).length > 0
    },

    async latest(job) {
      let result = await database.exec(
        sql`${RUN_COLUMNS} WHERE r.job = ${job} ORDER BY r.started_at DESC, r.id DESC LIMIT 1`,
      )
      return recordOf(result.rows?.[0])
    },

    async latestRuns(job, limit) {
      let result = await database.exec(
        sql`${RUN_COLUMNS} WHERE r.job = ${job}
            ORDER BY r.started_at DESC, r.id DESC LIMIT ${limit}`,
      )
      return (result.rows ?? []).flatMap((row) => recordOf(row) ?? [])
    },

    async history(job, since) {
      let result = await database.exec(
        sql`${RUN_COLUMNS} WHERE r.job = ${job} AND r.started_at >= ${stamp(since)}
            ORDER BY r.started_at DESC, r.id DESC`,
      )
      return (result.rows ?? []).flatMap((row) => recordOf(row) ?? [])
    },
  }
  return store
}
