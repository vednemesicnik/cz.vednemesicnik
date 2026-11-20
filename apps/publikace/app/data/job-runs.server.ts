import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import type { JobRunRecord } from '../domain/job-run.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The runs the background jobs report (`14d`). A run opens with the interval of the job's trigger
 * and closes with its outcome; the app knows a job only from these.
 */
export type JobRunStore = {
  /** Opens a run under its key. */
  start(run: {
    at: Temporal.Instant
    intervalMinutes: number
    job: string
    runKey: string
  }): Promise<void>
  /** Closes the run of that job and key; `false` for one that is not open. */
  finish(
    job: string,
    runKey: string,
    result: { at: Temporal.Instant; error: string | null; outcome: 'failed' | 'ok' },
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

function recordOf(row: Record<string, unknown> | undefined): JobRunRecord | null {
  let startedAt = parseStamp(row?.['started_at'])
  if (row === undefined || startedAt === null) return null
  let outcome = row['outcome']
  let error = row['error_text']
  return {
    error: typeof error === 'string' ? error : null,
    finishedAt: parseStamp(row['finished_at']),
    intervalMinutes: Number(row['interval_minutes']),
    outcome: outcome === 'ok' || outcome === 'failed' ? outcome : null,
    startedAt,
  }
}

export function createJobRunStore(database: Database): JobRunStore {
  return {
    async start(run) {
      await database.exec(
        sql`INSERT INTO job_runs (job, run_key, started_at, interval_minutes)
            VALUES (${run.job}, ${run.runKey}, ${stamp(run.at)}, ${run.intervalMinutes})`,
      )
    },

    async finish(job, runKey, result) {
      let updated = await database.exec(
        sql`UPDATE job_runs SET finished_at = ${stamp(result.at)}, outcome = ${result.outcome},
              error_text = ${result.error === null ? null : result.error.slice(0, 2000)}
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
        sql`SELECT started_at, interval_minutes, finished_at, outcome, error_text FROM job_runs
            WHERE job = ${job} ORDER BY started_at DESC, id DESC LIMIT 1`,
      )
      return recordOf(result.rows?.[0])
    },

    async latestRuns(job, limit) {
      let result = await database.exec(
        sql`SELECT started_at, interval_minutes, finished_at, outcome, error_text FROM job_runs
            WHERE job = ${job} ORDER BY started_at DESC, id DESC LIMIT ${limit}`,
      )
      return (result.rows ?? []).flatMap((row) => recordOf(row) ?? [])
    },

    async history(job, since) {
      let result = await database.exec(
        sql`SELECT started_at, interval_minutes, finished_at, outcome, error_text FROM job_runs
            WHERE job = ${job} AND started_at >= ${stamp(since)}
            ORDER BY started_at DESC, id DESC`,
      )
      return (result.rows ?? []).flatMap((row) => recordOf(row) ?? [])
    },
  }
}
