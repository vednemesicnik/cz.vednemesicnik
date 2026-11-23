import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { isFullRewriteDue, type RegistryIssue, retryDelay } from '../domain/record.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The marks of the record queue (#111): which records are out of date, set by the triggers of
 * `20261130120000_record_queue` in the same transaction as the change they follow.
 */

export type RecordKind = 'evidence' | 'registry'

/** One record to write, and the `generation` its write was taken at. */
export type RecordMark = {
  attempts: number
  generation: number
  /** `0` for the Registr. */
  issueId: number
  kind: RecordKind
}

export type RecordStore = {
  /** Every complete issue's row in the Registr list, oldest first. */
  registryIssues(): Promise<RegistryIssue[]>
  /**
   * The marks a pass may write now: those that never failed first, so records that keep failing
   * cannot fill a pass, then Evidences before the Registr, since creating an Evidence marks the
   * Registr and one pass then carries both.
   */
  takeDue(at: Temporal.Instant, limit: number): Promise<RecordMark[]>
  /**
   * Removes the mark once its record is written, unless something changed meanwhile: `false`
   * then, and the next pass writes it again.
   */
  markWritten(mark: RecordMark): Promise<boolean>
  /** Puts the next try off by `retryDelay`, unless a change has reset the mark meanwhile. */
  markFailed(mark: RecordMark, at: Temporal.Instant, error: string): Promise<void>
  /** The daily rewrite: marks every record when it is due, and says whether it did. */
  markAllIfDue(at: Temporal.Instant): Promise<boolean>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toMark(row: Row): RecordMark {
  return {
    attempts: Number(row['attempts']),
    generation: Number(row['generation']),
    issueId: Number(row['issue_id']),
    kind: row['kind'] === 'registry' ? 'registry' : 'evidence',
  }
}

export function createRecordStore(database: Database): RecordStore {
  return {
    async registryIssues() {
      let result = await database.exec(
        sql`SELECT i.name, i.folder_id, i.evidence_spreadsheet_id, i.closed_at, i.started_at,
              (SELECT l.key FROM links l WHERE l.issue_id = i.id AND l.kind = 'article'
               ORDER BY l.created_at DESC, l.id DESC LIMIT 1) AS link_key
            FROM issues i
            WHERE i.completed_at IS NOT NULL
            ORDER BY i.started_at, i.id`,
      )
      return (result.rows ?? []).map((row) => ({
        articleLinkKey: text(row['link_key']),
        evidenceId: text(row['evidence_spreadsheet_id']),
        folderId: String(row['folder_id'] ?? ''),
        isClosed: row['closed_at'] !== null,
        name: String(row['name']),
        startedAt: parseStamp(row['started_at']) ?? EPOCH,
      }))
    },

    async takeDue(at, limit) {
      let result = await database.exec(
        sql`SELECT * FROM record_marks
            WHERE retry_at IS NULL OR retry_at <= ${stamp(at)}
            ORDER BY attempts, CASE kind WHEN 'evidence' THEN 0 ELSE 1 END, issue_id
            LIMIT ${limit}`,
      )
      return (result.rows ?? []).map(toMark)
    },

    async markWritten(mark) {
      let result = await database.exec(
        sql`DELETE FROM record_marks
            WHERE kind = ${mark.kind} AND issue_id = ${mark.issueId}
              AND generation = ${mark.generation}`,
      )
      return (result.affectedRows ?? 0) === 1
    },

    async markFailed(mark, at, error) {
      let attempts = mark.attempts + 1
      await database.exec(
        sql`UPDATE record_marks
            SET attempts = ${attempts}, retry_at = ${stamp(at.add(retryDelay(attempts)))},
              last_error = ${error}
            WHERE kind = ${mark.kind} AND issue_id = ${mark.issueId}
              AND generation = ${mark.generation}`,
      )
    },

    markAllIfDue(at) {
      return database.transaction(async (db) => {
        let result = await db.exec(sql`SELECT last_full_at FROM record_rewrites WHERE id = 1`)
        let lastFullAt = parseStamp(result.rows?.[0]?.['last_full_at'])
        if (!isFullRewriteDue(lastFullAt, at)) return false

        await db.exec(
          sql`INSERT INTO record_marks (kind, issue_id)
              SELECT 'evidence', id FROM issues WHERE completed_at IS NOT NULL
              ON CONFLICT (kind, issue_id) DO UPDATE
                SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL`,
        )
        await db.exec(
          sql`INSERT INTO record_marks (kind, issue_id) VALUES ('registry', 0)
              ON CONFLICT (kind, issue_id) DO UPDATE
                SET generation = generation + 1, attempts = 0, retry_at = NULL, last_error = NULL`,
        )
        await db.exec(sql`UPDATE record_rewrites SET last_full_at = ${stamp(at)} WHERE id = 1`)
        return true
      })
    },
  }
}
