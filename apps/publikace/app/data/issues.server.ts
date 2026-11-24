import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { type FolderKind, type Issue, type IssueFolderKind, issueNameKey } from '../domain/issue.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { ensureArticleLinkIn } from './links.server.ts'

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
  /** Takes the marks of the folders the app reached again (`12j`). */
  clearMissing(id: number, kinds: readonly IssueFolderKind[]): Promise<void>
  /**
   * _Uzavřít vydání_ (`12g`): `false` when the issue was closed already or is not finished, so a
   * dialog drawn before somebody else's step changes nothing.
   */
  close(id: number, at: Temporal.Instant): Promise<boolean>
  /**
   * Marks the issue finished and gives it its link for new articles. Refused by the table while
   * a folder is still missing.
   */
  complete(id: number, when: Temporal.Instant): Promise<void>
  /**
   * A removed issue too: the link pages, the answers to a race and the record queue tell it from
   * one that never existed.
   */
  findById(id: number): Promise<Issue | null>
  /** Every issue not removed by its name, case and surrounding spaces aside. */
  findByName(name: string): Promise<Issue | null>
  /** The row first, before Drive. A name already in the app is refused, never overwritten. */
  insert(issue: NewIssue): Promise<InsertResult>
  /** Unfinished first, then active, then closed; newest first in each. Removed ones never. */
  list(): Promise<Issue[]>
  /**
   * _Odebrat vydání_ (`12w`): sets `removed_at` while the issue holds no article and no group. A
   * failed attempt waiting for the bin is neither; one still running is, so a link's send that
   * started before the removal stops it.
   */
  markRemoved(id: number, at: Temporal.Instant): Promise<MarkRemovedOutcome>
  /** Marks the folders found missing; a mark already there keeps its first time (`12j`). */
  markMissing(id: number, kinds: readonly IssueFolderKind[], at: Temporal.Instant): Promise<void>
  /**
   * The `_Podklady` sheet the print job reported for the issue, an app's own file in its print
   * folder (#110), or `null` when it reported none.
   */
  printSheetId(id: number): Promise<string | null>
  /** Only while Drive refused the issue folder itself, so nothing of the issue exists. */
  remove(id: number): Promise<void>
  /**
   * _Přejmenovat vydání_ (`12v`), the database after Drive: the new name only while the issue
   * still has the name the dialog showed, is neither closed nor removed, holds exactly the
   * articles and groups whose `_meta.json` Drive was given, and no attempt at another is running.
   * `metaFiles` are the files written anew for ones deleted for good, by article and group ID.
   */
  rename(input: {
    expected: { articles: readonly number[]; groups: readonly number[] }
    id: number
    metaFiles: { articles: ReadonlyMap<number, string>; groups: ReadonlyMap<number, string> }
    name: string
    shownName: string
  }): Promise<RenameOutcome>
  /**
   * _Znovu otevřít_ (`12h`): the same links and jobs work again, because they read the issue's
   * state and never their own copy of it. `false` when the issue was open already.
   */
  reopen(id: number): Promise<boolean>
  /** Stores the Evidence's ID once, as a folder's; one already stored is never replaced. */
  setEvidence(id: number, spreadsheetId: string): Promise<void>
  /** Stores a folder's ID once; a folder already stored is never replaced. */
  setFolder(id: number, kind: FolderKind, folderId: string): Promise<void>
  /** Keeps the folder of the issue's artwork groups; one already stored stays. */
  setGroupsFolder(id: number, folderId: string): Promise<void>
  /** Takes the removal back when Drive refused the bin after it (`12w`). */
  unmarkRemoved(id: number): Promise<void>
}

export type MarkRemovedOutcome = 'already-removed' | 'has-article' | 'has-group' | 'removed'

/**
 * `changed` is an article or a group that came or went, or an attempt at one still running;
 * `duplicate` a name another issue took meanwhile.
 */
export type RenameOutcome =
  | 'changed'
  | 'closed'
  | 'duplicate'
  | 'removed'
  | 'renamed'
  | 'renamed-meanwhile'

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toIssue(row: Row): Issue {
  return {
    closedAt: parseStamp(row['closed_at']),
    completedAt: parseStamp(row['completed_at']),
    evidenceSpreadsheetId: text(row['evidence_spreadsheet_id']),
    folderIds: {
      articles: text(row['articles_folder_id']),
      issue: text(row['folder_id']),
      print: text(row['print_folder_id']),
    },
    groupsFolderId: text(row['groups_folder_id']),
    id: Number(row['id']),
    missing: {
      articles: parseStamp(row['articles_folder_missing_at']),
      issue: parseStamp(row['folder_missing_at']),
    },
    name: String(row['name']),
    removedAt: parseStamp(row['removed_at']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
    startedByEmail: String(row['started_by_email']),
    startedByName: String(row['started_by_name']),
  }
}

/** Every row created, none still running, and the IDs exactly those expected. */
function isExactly(rows: readonly Row[], expected: readonly number[]): boolean {
  if (rows.some((row) => row['created_at'] == null)) return false
  let ids = rows.map((row) => Number(row['id'])).sort((a, b) => a - b)
  let wanted = [...expected].sort((a, b) => a - b)
  return ids.length === wanted.length && ids.every((value, index) => value === wanted[index])
}

export function createIssueStore(database: Database): IssueStore {
  async function byKey(db: Database, key: string): Promise<Issue | null> {
    let result = await db.exec(
      sql`SELECT * FROM issues WHERE name_key = ${key} AND removed_at IS NULL`,
    )
    let row = result.rows?.[0]
    return row === undefined ? null : toIssue(row)
  }

  return {
    async clearMissing(id, kinds) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kinds.includes('issue')) {
        await database.exec(sql`UPDATE issues SET folder_missing_at = NULL WHERE id = ${id}`)
      }
      if (kinds.includes('articles')) {
        await database.exec(
          sql`UPDATE issues SET articles_folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
    },

    async close(id, at) {
      let result = await database.exec(
        sql`UPDATE issues SET closed_at = ${stamp(at)}
            WHERE id = ${id} AND completed_at IS NOT NULL AND closed_at IS NULL`,
      )
      return (result.affectedRows ?? 0) === 1
    },

    /* The link for the newsroom comes into being in the same transaction, so a complete issue
       never stands without one (`12c`), whichever of creating and finishing completed it. */
    async complete(id, when) {
      await database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE issues SET completed_at = ${stamp(when)} WHERE id = ${id} AND completed_at IS NULL`,
        )
        let result = await db.exec(
          sql`SELECT completed_at FROM issues WHERE id = ${id} AND closed_at IS NULL`,
        )
        if (result.rows?.[0]?.['completed_at'] != null) await ensureArticleLinkIn(db, id, when)
      })
    },

    async findById(id) {
      let result = await database.exec(sql`SELECT * FROM issues WHERE id = ${id}`)
      let row = result.rows?.[0]
      return row === undefined ? null : toIssue(row)
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
            WHERE removed_at IS NULL
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

    async markMissing(id, kinds, at) {
      let when = stamp(at)
      if (kinds.includes('issue')) {
        await database.exec(
          sql`UPDATE issues SET folder_missing_at = coalesce(folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
      if (kinds.includes('articles')) {
        await database.exec(
          sql`UPDATE issues
              SET articles_folder_missing_at = coalesce(articles_folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
    },

    markRemoved(id, at) {
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`UPDATE issues SET removed_at = ${stamp(at)}
              WHERE id = ${id} AND removed_at IS NULL
                AND NOT EXISTS (SELECT 1 FROM articles
                                WHERE issue_id = ${id} AND cleanup_at IS NULL)
                AND NOT EXISTS (SELECT 1 FROM artwork_groups
                                WHERE issue_id = ${id} AND cleanup_at IS NULL)`,
        )
        if ((result.affectedRows ?? 0) === 1) return 'removed'
        let issue = await db.exec(sql`SELECT removed_at FROM issues WHERE id = ${id}`)
        if (issue.rows?.[0]?.['removed_at'] != null) return 'already-removed'
        let article = await db.exec(
          sql`SELECT 1 FROM articles WHERE issue_id = ${id} AND cleanup_at IS NULL LIMIT 1`,
        )
        return (article.rows ?? []).length > 0 ? 'has-article' : 'has-group'
      })
    },

    async printSheetId(id) {
      let result = await database.exec(
        sql`SELECT sheet_id FROM print_handoffs WHERE issue_id = ${id}`,
      )
      return text(result.rows?.[0]?.['sheet_id'])
    },

    async remove(id) {
      await database.exec(sql`DELETE FROM issues WHERE id = ${id}`)
    },

    rename({ expected, id, metaFiles, name, shownName }) {
      let trimmed = name.normalize('NFC').trim()
      let key = issueNameKey(name)
      return database.transaction(async (db) => {
        let current = await db.exec(sql`SELECT name, closed_at, removed_at FROM issues
            WHERE id = ${id}`)
        let row = current.rows?.[0]
        if (row === undefined || row['removed_at'] != null) return 'removed'
        if (row['name'] !== shownName) return 'renamed-meanwhile'
        if (row['closed_at'] != null) return 'closed'

        /* What the rename wrote on Drive, and nothing else, so an article that came meanwhile
           never keeps the old name in its `_meta.json`. */
        let articles = await db.exec(sql`SELECT id, created_at FROM articles
            WHERE issue_id = ${id} AND cleanup_at IS NULL`)
        let groups = await db.exec(sql`SELECT id, created_at FROM artwork_groups
            WHERE issue_id = ${id} AND cleanup_at IS NULL`)
        if (!isExactly(articles.rows ?? [], expected.articles)) return 'changed'
        if (!isExactly(groups.rows ?? [], expected.groups)) return 'changed'

        let taken = await db.exec(sql`SELECT 1 FROM issues
            WHERE name_key = ${key} AND removed_at IS NULL AND id <> ${id}`)
        if ((taken.rows ?? []).length > 0) return 'duplicate'

        await db.exec(sql`UPDATE issues SET name = ${trimmed}, name_key = ${key} WHERE id = ${id}`)
        for (let [articleId, fileId] of metaFiles.articles) {
          await db.exec(sql`UPDATE articles SET meta_file_id = ${fileId} WHERE id = ${articleId}`)
        }
        for (let [groupId, fileId] of metaFiles.groups) {
          await db.exec(
            sql`UPDATE artwork_groups SET meta_file_id = ${fileId} WHERE id = ${groupId}`,
          )
        }
        return 'renamed'
      })
    },

    async reopen(id) {
      let result = await database.exec(
        sql`UPDATE issues SET closed_at = NULL WHERE id = ${id} AND closed_at IS NOT NULL`,
      )
      return (result.affectedRows ?? 0) === 1
    },

    async setEvidence(id, spreadsheetId) {
      await database.exec(
        sql`UPDATE issues SET evidence_spreadsheet_id = ${spreadsheetId}
            WHERE id = ${id} AND evidence_spreadsheet_id IS NULL`,
      )
    },

    async setGroupsFolder(id, folderId) {
      await database.exec(
        sql`UPDATE issues SET groups_folder_id = ${folderId}
            WHERE id = ${id} AND groups_folder_id IS NULL`,
      )
    },

    async unmarkRemoved(id) {
      await database.exec(sql`UPDATE issues SET removed_at = NULL WHERE id = ${id}`)
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
