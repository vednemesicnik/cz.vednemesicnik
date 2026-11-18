import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { type FolderKind, type Issue, issueNameKey } from '../domain/issue.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The issues in the app's database, the source of truth for them (`w4i6us5r`).
 *
 * A row is written before Drive is asked for anything, and each folder's ID the moment Drive
 * returns it, so a stop halfway leaves an issue that knows what it has (`1jv85zum`).
 */

export type NewIssue = {
  at: Temporal.Instant
  name: string
  startedByEmail: string
  startedByName: string
}

export type InsertResult = { existingName: string; ok: false } | { issue: Issue; ok: true }

export type IssueStore = {
  /** Marks the issue finished. Refused by the table while a folder is still missing. */
  complete(id: number, when: Temporal.Instant): Promise<void>
  /** Every issue by its name, case and surrounding spaces aside. */
  findByName(name: string): Promise<Issue | null>
  /** The row first, before Drive. A name already in the app is refused, never overwritten. */
  insert(issue: NewIssue): Promise<InsertResult>
  /** Unfinished first, then active, then closed; newest first in each. */
  list(): Promise<Issue[]>
  /** Only while Drive refused the issue folder itself, so nothing of the issue exists. */
  remove(id: number): Promise<void>
  /** Stores a folder's ID once; a folder already stored is never replaced. */
  setFolder(id: number, kind: FolderKind, folderId: string): Promise<void>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toIssue(row: Row): Issue {
  return {
    closedAt: parseStamp(row['closed_at']),
    completedAt: parseStamp(row['completed_at']),
    folderIds: {
      articles: text(row['articles_folder_id']),
      issue: text(row['folder_id']),
      print: text(row['print_folder_id']),
    },
    id: Number(row['id']),
    name: String(row['name']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
    startedByEmail: String(row['started_by_email']),
    startedByName: String(row['started_by_name']),
  }
}

export function createIssueStore(database: Database): IssueStore {
  async function byKey(db: Database, key: string): Promise<Issue | null> {
    let result = await db.exec(sql`SELECT * FROM issues WHERE name_key = ${key}`)
    let row = result.rows?.[0]
    return row === undefined ? null : toIssue(row)
  }

  return {
    async complete(id, when) {
      await database.exec(
        sql`UPDATE issues SET completed_at = ${stamp(when)} WHERE id = ${id} AND completed_at IS NULL`,
      )
    },

    findByName(name) {
      return byKey(database, issueNameKey(name))
    },

    insert({ at, name, startedByEmail, startedByName }) {
      let key = issueNameKey(name)
      return database.transaction(async (db) => {
        let existing = await byKey(db, key)
        if (existing !== null) return { existingName: existing.name, ok: false }

        await db.exec(
          sql`INSERT INTO issues (name, name_key, started_at, started_by_email, started_by_name)
              VALUES (${name.normalize('NFC').trim()}, ${key}, ${stamp(at)}, ${startedByEmail}, ${startedByName})`,
        )
        let issue = await byKey(db, key)
        if (issue === null) throw new Error('The issue row was not written.')
        return { issue, ok: true }
      })
    },

    async list() {
      let result = await database.exec(
        sql`SELECT * FROM issues
            ORDER BY
              CASE
                WHEN closed_at IS NOT NULL THEN 2
                WHEN completed_at IS NULL THEN 0
                ELSE 1
              END,
              started_at DESC,
              id DESC`,
      )
      return (result.rows ?? []).map(toIssue)
    },

    async remove(id) {
      await database.exec(sql`DELETE FROM issues WHERE id = ${id}`)
    },

    async setFolder(id, kind, folderId) {
      /* Three statements rather than a column name in the SQL, which a template cannot bind. */
      if (kind === 'issue') {
        await database.exec(
          sql`UPDATE issues SET folder_id = ${folderId} WHERE id = ${id} AND folder_id IS NULL`,
        )
      } else if (kind === 'articles') {
        await database.exec(
          sql`UPDATE issues SET articles_folder_id = ${folderId} WHERE id = ${id} AND articles_folder_id IS NULL`,
        )
      } else {
        await database.exec(
          sql`UPDATE issues SET print_folder_id = ${folderId} WHERE id = ${id} AND print_folder_id IS NULL`,
        )
      }
    },
  }
}
