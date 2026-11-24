import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import type { ArticleFolderKind } from '../domain/article-folders.ts'
import type { Link } from '../domain/link.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import type { MissingFolders } from './articles.server.ts'
import { insertLink, toLink } from './links.server.ts'

/**
 * Artwork groups in the app's database (#133, `12e`), and the attempts that create them.
 *
 * As with an article, an attempt is written before Drive is asked for anything and keeps each
 * file's ID the moment Drive returns it, so a failed one knows what to put in the bin (`11c`).
 * Only a committed row is a group, and it gets its link for uploads in the same transaction.
 */

export type GroupDriveFileKind = 'artworks-folder' | 'folder' | 'licences-folder' | 'meta'

export type GroupRow = {
  artworksFolderId: string | null
  cleanupAt: Temporal.Instant | null
  createdAt: Temporal.Instant | null
  folderId: string | null
  formKey: string
  id: number
  issueId: number
  licencesFolderId: string | null
  metaFileId: string | null
  missing: MissingFolders
  name: string
  /** The note for the designer, empty when none was given. */
  note: string
  startedAt: Temporal.Instant
}

/** A group as the issue detail lists it (`12a`): with its link and how many artworks it holds. */
export type ListedGroup = GroupRow & {
  /** The artworks of its committed batches that were not discarded, as an article's row counts. */
  artworks: number
  createdAt: Temporal.Instant
  link: Link | null
}

export type NewGroupAttempt = {
  at: Temporal.Instant
  formKey: string
  issueId: number
  name: string
  nameKey: string
  note: string
  startedBy: { email: string; name: string }
}

export type GroupStore = {
  /** Every attempt left uncommitted, for the cleanup at startup. */
  abandonedAttempts(): Promise<GroupRow[]>
  clearMissing(id: number, kinds: readonly ArticleFolderKind[]): Promise<void>
  /** Commits the attempt and gives the group its link, in one transaction. */
  commit(id: number, at: Temporal.Instant): Promise<GroupRow>
  /** Removes an attempt whose files are in the bin, which frees its name. */
  discard(id: number): Promise<void>
  findByFormKey(formKey: string): Promise<GroupRow | null>
  findById(id: number): Promise<GroupRow | null>
  /** The issue's committed groups, the newest first (`12e`: the new one heads the list). */
  listByIssue(issueId: number): Promise<ListedGroup[]>
  markForCleanup(id: number, at: Temporal.Instant): Promise<void>
  markMissing(id: number, kinds: readonly ArticleFolderKind[], at: Temporal.Instant): Promise<void>
  /** By issue, the committed groups, for whether an issue can be removed (`12u`). */
  countsByIssue(): Promise<Map<number, number>>
  /** By issue, the committed groups with a folder on record as missing, for _Čeká na vás_. */
  missingCountsByIssue(): Promise<Map<number, number>>
  /**
   * Every name in the issue by its key, as the dialog checks it: the groups and the attempts under
   * way. A failed attempt waiting for its cleanup is no group and does not count, though it holds
   * its name until its files reach the bin.
   */
  namesOf(issueId: number): Promise<Map<string, string>>
  /** Attempts whose cleanup failed before, safe to take while other requests run. */
  pendingCleanups(): Promise<GroupRow[]>
  setDriveId(id: number, kind: GroupDriveFileKind, fileId: string): Promise<void>
  /**
   * The attempt for this form key, created unless it exists; `name-taken` when the issue holds the
   * name already, which the unique index decides even between two requests at once;
   * `issue-removed` when the issue was removed meanwhile (`12w`).
   */
  startAttempt(
    attempt: NewGroupAttempt,
  ): Promise<{ attempt: GroupRow; isNew: boolean } | 'issue-removed' | 'name-taken'>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export function toGroup(row: Row): GroupRow {
  return {
    artworksFolderId: text(row['artworks_folder_id']),
    cleanupAt: parseStamp(row['cleanup_at']),
    createdAt: parseStamp(row['created_at']),
    folderId: text(row['folder_id']),
    formKey: String(row['form_key']),
    id: Number(row['id']),
    issueId: Number(row['issue_id']),
    licencesFolderId: text(row['licences_folder_id']),
    metaFileId: text(row['meta_file_id']),
    missing: {
      article: parseStamp(row['folder_missing_at']),
      artworks: parseStamp(row['artworks_folder_missing_at']),
      licences: parseStamp(row['licences_folder_missing_at']),
    },
    name: String(row['name']),
    note: text(row['note']) ?? '',
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
  }
}

async function byId(db: Database, id: number): Promise<GroupRow | null> {
  let result = await db.exec(sql`SELECT * FROM artwork_groups WHERE id = ${id}`)
  let row = result.rows?.[0]
  return row === undefined ? null : toGroup(row)
}

async function byFormKey(db: Database, formKey: string): Promise<GroupRow | null> {
  let result = await db.exec(sql`SELECT * FROM artwork_groups WHERE form_key = ${formKey}`)
  let row = result.rows?.[0]
  return row === undefined ? null : toGroup(row)
}

export function createGroupStore(database: Database): GroupStore {
  return {
    async abandonedAttempts() {
      let result = await database.exec(
        sql`SELECT * FROM artwork_groups WHERE created_at IS NULL ORDER BY id`,
      )
      return (result.rows ?? []).map(toGroup)
    },

    async clearMissing(id, kinds) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kinds.includes('article')) {
        await database.exec(
          sql`UPDATE artwork_groups SET folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
      if (kinds.includes('artworks')) {
        await database.exec(
          sql`UPDATE artwork_groups SET artworks_folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
      if (kinds.includes('licences')) {
        await database.exec(
          sql`UPDATE artwork_groups SET licences_folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
    },

    commit(id, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE artwork_groups SET created_at = ${stamp(at)}, cleanup_at = NULL
              WHERE id = ${id} AND created_at IS NULL`,
        )
        let row = await byId(db, id)
        if (row === null || row.createdAt === null) throw new Error('The group was not written.')
        let existing = await db.exec(sql`SELECT id FROM links WHERE group_id = ${id}`)
        if ((existing.rows ?? []).length === 0) {
          await insertLink(db, {
            articleId: null,
            at,
            groupId: id,
            issueId: row.issueId,
            kind: 'artworks',
          })
        }
        return row
      })
    },

    async discard(id) {
      await database.exec(sql`DELETE FROM artwork_groups WHERE id = ${id} AND created_at IS NULL`)
    },

    findByFormKey(formKey) {
      return byFormKey(database, formKey)
    },

    findById(id) {
      return byId(database, id)
    },

    async countsByIssue() {
      let result = await database.exec(
        sql`SELECT issue_id, count(*) AS count FROM artwork_groups
            WHERE created_at IS NOT NULL GROUP BY issue_id`,
      )
      let counts = new Map<number, number>()
      for (let row of result.rows ?? []) counts.set(Number(row['issue_id']), Number(row['count']))
      return counts
    },

    async missingCountsByIssue() {
      /* A group's three folders are one Callout, so one item (`12j`). With the issue folder in
         the bin its one Callout stands for every folder in it, so the groups are not counted
         beside it. */
      let result = await database.exec(
        sql`SELECT issue_id, count(*) AS count FROM artwork_groups
            WHERE created_at IS NOT NULL
              AND issue_id NOT IN (SELECT id FROM issues WHERE folder_missing_at IS NOT NULL)
              AND (folder_missing_at IS NOT NULL
                OR artworks_folder_missing_at IS NOT NULL
                OR licences_folder_missing_at IS NOT NULL)
            GROUP BY issue_id`,
      )
      let counts = new Map<number, number>()
      for (let row of result.rows ?? []) counts.set(Number(row['issue_id']), Number(row['count']))
      return counts
    },

    async listByIssue(issueId) {
      let groups = await database.exec(
        sql`SELECT g.*,
              (SELECT count(*) FROM artworks a JOIN artwork_batches b ON b.id = a.batch_id
               WHERE b.group_id = g.id AND b.created_at IS NOT NULL AND b.discarded_at IS NULL)
                AS artwork_count
            FROM artwork_groups g
            WHERE g.issue_id = ${issueId} AND g.created_at IS NOT NULL
            ORDER BY g.created_at DESC, g.id DESC`,
      )
      let links = await database.exec(
        sql`SELECT * FROM links
            WHERE issue_id = ${issueId} AND group_id IS NOT NULL AND revoked_at IS NULL`,
      )
      let byGroup = new Map<number, Link>()
      for (let row of links.rows ?? []) byGroup.set(Number(row['group_id']), toLink(row))
      return (groups.rows ?? []).map((row) => {
        let group = toGroup(row)
        return {
          ...group,
          artworks: Number(row['artwork_count'] ?? 0),
          createdAt: group.createdAt ?? EPOCH,
          link: byGroup.get(group.id) ?? null,
        }
      })
    },

    async markForCleanup(id, at) {
      await database.exec(
        sql`UPDATE artwork_groups SET cleanup_at = ${stamp(at)}
            WHERE id = ${id} AND created_at IS NULL`,
      )
    },

    async markMissing(id, kinds, at) {
      let when = stamp(at)
      if (kinds.includes('article')) {
        await database.exec(
          sql`UPDATE artwork_groups SET folder_missing_at = coalesce(folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
      if (kinds.includes('artworks')) {
        await database.exec(
          sql`UPDATE artwork_groups
              SET artworks_folder_missing_at = coalesce(artworks_folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
      if (kinds.includes('licences')) {
        await database.exec(
          sql`UPDATE artwork_groups
              SET licences_folder_missing_at = coalesce(licences_folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
    },

    async namesOf(issueId) {
      let result = await database.exec(
        sql`SELECT name, name_key FROM artwork_groups
            WHERE issue_id = ${issueId} AND cleanup_at IS NULL`,
      )
      let names = new Map<string, string>()
      for (let row of result.rows ?? []) names.set(String(row['name_key']), String(row['name']))
      return names
    },

    async pendingCleanups() {
      let result = await database.exec(
        sql`SELECT * FROM artwork_groups
            WHERE created_at IS NULL AND cleanup_at IS NOT NULL ORDER BY id`,
      )
      return (result.rows ?? []).map(toGroup)
    },

    async setDriveId(id, kind, fileId) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kind === 'folder') {
        await database.exec(
          sql`UPDATE artwork_groups SET folder_id = ${fileId}
              WHERE id = ${id} AND folder_id IS NULL`,
        )
      } else if (kind === 'artworks-folder') {
        await database.exec(
          sql`UPDATE artwork_groups SET artworks_folder_id = ${fileId}
              WHERE id = ${id} AND artworks_folder_id IS NULL`,
        )
      } else if (kind === 'licences-folder') {
        await database.exec(
          sql`UPDATE artwork_groups SET licences_folder_id = ${fileId}
              WHERE id = ${id} AND licences_folder_id IS NULL`,
        )
      } else {
        await database.exec(
          sql`UPDATE artwork_groups SET meta_file_id = ${fileId}
              WHERE id = ${id} AND meta_file_id IS NULL`,
        )
      }
    },

    startAttempt(attempt) {
      return database.transaction(async (db) => {
        let existing = await byFormKey(db, attempt.formKey)
        if (existing !== null) return { attempt: existing, isNew: false }
        let issue = await db.exec(sql`SELECT removed_at FROM issues WHERE id = ${attempt.issueId}`)
        if (issue.rows?.[0]?.['removed_at'] != null) return 'issue-removed' as const
        let taken = await db.exec(
          sql`SELECT id FROM artwork_groups
              WHERE issue_id = ${attempt.issueId} AND name_key = ${attempt.nameKey}`,
        )
        if ((taken.rows ?? []).length > 0) return 'name-taken' as const
        await db.exec(
          sql`INSERT INTO artwork_groups (issue_id, form_key, name, name_key, note, started_at,
                started_by_email, started_by_name)
              VALUES (${attempt.issueId}, ${attempt.formKey}, ${attempt.name}, ${attempt.nameKey},
                ${attempt.note}, ${stamp(attempt.at)}, ${attempt.startedBy.email},
                ${attempt.startedBy.name})`,
        )
        let inserted = await byFormKey(db, attempt.formKey)
        if (inserted === null) throw new Error('The attempt was not written.')
        return { attempt: inserted, isNew: true }
      })
    },
  }
}
