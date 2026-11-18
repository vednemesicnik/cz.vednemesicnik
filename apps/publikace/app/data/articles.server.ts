import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import type { Author } from '../domain/article.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { insertLink } from './links.server.ts'

/**
 * Articles in the app's database, the source of truth for them (`w4i6us5r`), and the attempts
 * that create them.
 *
 * An attempt is written before Drive is asked for anything and keeps each file's ID the moment
 * Drive returns it, so a failed one knows what to put in the bin (`11c`). Only a committed row is
 * an article; nothing else reads an attempt.
 */

export type ArticleAuthor = Author & {
  position: number
  welcomeFailedAt: Temporal.Instant | null
  welcomeSentAt: Temporal.Instant | null
}

export type DriveFileKind = 'doc' | 'folder' | 'meta'

export type ArticleRow = {
  authors: ArticleAuthor[]
  cleanupAt: Temporal.Instant | null
  createdAt: Temporal.Instant | null
  docId: string | null
  folderId: string | null
  formKey: string
  id: number
  issueId: number
  linkId: number
  metaFileId: string | null
  name: string
  startedAt: Temporal.Instant
}

/** A committed article: its files exist. */
export type Article = ArticleRow & { createdAt: Temporal.Instant; docId: string; folderId: string }

export type NewAttempt = {
  at: Temporal.Instant
  authors: readonly Author[]
  formKey: string
  issueId: number
  linkId: number
  name: string
}

export type ArticleStore = {
  /** Every attempt left uncommitted, for the cleanup at startup, when no request is running. */
  abandonedAttempts(): Promise<ArticleRow[]>
  /** Commits the attempt as an article and gives it its link for artworks, in one transaction. */
  commit(id: number, at: Temporal.Instant): Promise<Article>
  /** Created articles per issue, for the overview's counts. */
  countsByIssue(): Promise<Map<number, number>>
  /** Removes an attempt whose files are in the bin; its authors go with it. */
  discard(id: number): Promise<void>
  findByFormKey(formKey: string): Promise<ArticleRow | null>
  /** The issue's created articles, newest first. */
  listCreated(issueId: number): Promise<Article[]>
  /** An attempt whose cleanup did not get through, to be tried again. */
  markForCleanup(id: number, at: Temporal.Instant): Promise<void>
  markWelcome(
    articleId: number,
    position: number,
    outcome: 'failed' | 'sent',
    at: Temporal.Instant,
  ): Promise<void>
  /** Attempts whose cleanup failed, safe to take while other requests run. */
  pendingCleanups(): Promise<ArticleRow[]>
  /**
   * Attempts through a link since a moment, under way or committed: what the limit counts. A
   * failed one is discarded and no longer counts, as it sent nothing.
   */
  recentAttempts(linkId: number, since: Temporal.Instant): Promise<number>
  /** Stores a file's ID once; one already stored is never replaced. */
  setDriveId(id: number, kind: DriveFileKind, fileId: string): Promise<void>
  /** The attempt for this form key, created unless it exists; `isNew` says which. */
  startAttempt(attempt: NewAttempt): Promise<{ attempt: ArticleRow; isNew: boolean }>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toAuthor(row: Row): ArticleAuthor {
  return {
    email: String(row['email']),
    name: String(row['name']),
    position: Number(row['position']),
    welcomeFailedAt: parseStamp(row['welcome_failed_at']),
    welcomeSentAt: parseStamp(row['welcome_sent_at']),
  }
}

function toRow(row: Row, authors: ArticleAuthor[]): ArticleRow {
  return {
    authors,
    cleanupAt: parseStamp(row['cleanup_at']),
    createdAt: parseStamp(row['created_at']),
    docId: text(row['doc_id']),
    folderId: text(row['folder_id']),
    formKey: String(row['form_key']),
    id: Number(row['id']),
    issueId: Number(row['issue_id']),
    linkId: Number(row['link_id']),
    metaFileId: text(row['meta_file_id']),
    name: String(row['name']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
  }
}

function asArticle(row: ArticleRow): Article {
  if (row.createdAt === null || row.docId === null || row.folderId === null) {
    throw new Error('An attempt was read as an article.')
  }
  return { ...row, createdAt: row.createdAt, docId: row.docId, folderId: row.folderId }
}

async function withAuthors(db: Database, rows: readonly Row[]): Promise<ArticleRow[]> {
  if (rows.length === 0) return []
  let ids = rows.map((row) => Number(row['id']))
  let result = await db.exec(
    sql`SELECT * FROM article_authors WHERE article_id IN (SELECT value FROM json_each(${JSON.stringify(ids)}))
        ORDER BY article_id, position`,
  )
  let byArticle = new Map<number, ArticleAuthor[]>()
  for (let author of result.rows ?? []) {
    let id = Number(author['article_id'])
    byArticle.set(id, [...(byArticle.get(id) ?? []), toAuthor(author)])
  }
  return rows.map((row) => toRow(row, byArticle.get(Number(row['id'])) ?? []))
}

async function byFormKey(db: Database, formKey: string): Promise<ArticleRow | null> {
  let result = await db.exec(sql`SELECT * FROM articles WHERE form_key = ${formKey}`)
  let [row] = await withAuthors(db, result.rows ?? [])
  return row ?? null
}

async function byId(db: Database, id: number): Promise<ArticleRow | null> {
  let result = await db.exec(sql`SELECT * FROM articles WHERE id = ${id}`)
  let [row] = await withAuthors(db, result.rows ?? [])
  return row ?? null
}

export function createArticleStore(database: Database): ArticleStore {
  return {
    async abandonedAttempts() {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE created_at IS NULL ORDER BY id`,
      )
      return withAuthors(database, result.rows ?? [])
    },

    commit(id, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE articles SET created_at = ${stamp(at)}, cleanup_at = NULL
              WHERE id = ${id} AND created_at IS NULL`,
        )
        let row = await byId(db, id)
        if (row === null) throw new Error('The article was not written.')
        let existing = await db.exec(
          sql`SELECT id FROM links WHERE article_id = ${id} AND kind = 'artworks'`,
        )
        if ((existing.rows ?? []).length === 0) {
          await insertLink(db, { articleId: id, at, issueId: row.issueId, kind: 'artworks' })
        }
        return asArticle(row)
      })
    },

    async countsByIssue() {
      let result = await database.exec(
        sql`SELECT issue_id, count(*) AS count FROM articles
            WHERE created_at IS NOT NULL GROUP BY issue_id`,
      )
      let counts = new Map<number, number>()
      for (let row of result.rows ?? []) counts.set(Number(row['issue_id']), Number(row['count']))
      return counts
    },

    async discard(id) {
      await database.exec(sql`DELETE FROM articles WHERE id = ${id} AND created_at IS NULL`)
    },

    findByFormKey(formKey) {
      return byFormKey(database, formKey)
    },

    async listCreated(issueId) {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE issue_id = ${issueId} AND created_at IS NOT NULL
            ORDER BY created_at DESC, id DESC`,
      )
      return (await withAuthors(database, result.rows ?? [])).map(asArticle)
    },

    async markForCleanup(id, at) {
      await database.exec(
        sql`UPDATE articles SET cleanup_at = ${stamp(at)} WHERE id = ${id} AND created_at IS NULL`,
      )
    },

    async markWelcome(articleId, position, outcome, at) {
      if (outcome === 'sent') {
        await database.exec(
          sql`UPDATE article_authors SET welcome_sent_at = ${stamp(at)}, welcome_failed_at = NULL
              WHERE article_id = ${articleId} AND position = ${position}`,
        )
      } else {
        await database.exec(
          sql`UPDATE article_authors SET welcome_failed_at = ${stamp(at)}
              WHERE article_id = ${articleId} AND position = ${position} AND welcome_sent_at IS NULL`,
        )
      }
    },

    async pendingCleanups() {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE created_at IS NULL AND cleanup_at IS NOT NULL ORDER BY id`,
      )
      return withAuthors(database, result.rows ?? [])
    },

    async recentAttempts(linkId, since) {
      let result = await database.exec(
        sql`SELECT count(*) AS count FROM articles
            WHERE link_id = ${linkId} AND started_at >= ${stamp(since)}`,
      )
      return Number(result.rows?.[0]?.['count'] ?? 0)
    },

    async setDriveId(id, kind, fileId) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kind === 'folder') {
        await database.exec(
          sql`UPDATE articles SET folder_id = ${fileId} WHERE id = ${id} AND folder_id IS NULL`,
        )
      } else if (kind === 'doc') {
        await database.exec(
          sql`UPDATE articles SET doc_id = ${fileId} WHERE id = ${id} AND doc_id IS NULL`,
        )
      } else {
        await database.exec(
          sql`UPDATE articles SET meta_file_id = ${fileId} WHERE id = ${id} AND meta_file_id IS NULL`,
        )
      }
    },

    startAttempt(attempt) {
      return database.transaction(async (db) => {
        let existing = await byFormKey(db, attempt.formKey)
        if (existing !== null) return { attempt: existing, isNew: false }

        await db.exec(
          sql`INSERT INTO articles (issue_id, link_id, form_key, name, started_at)
              VALUES (${attempt.issueId}, ${attempt.linkId}, ${attempt.formKey}, ${attempt.name}, ${stamp(attempt.at)})`,
        )
        let inserted = await byFormKey(db, attempt.formKey)
        if (inserted === null) throw new Error('The attempt was not written.')
        for (let [index, author] of attempt.authors.entries()) {
          await db.exec(
            sql`INSERT INTO article_authors (article_id, position, name, email)
                VALUES (${inserted.id}, ${index + 1}, ${author.name}, ${author.email})`,
          )
        }
        let row = await byId(db, inserted.id)
        if (row === null) throw new Error('The attempt was not written.')
        return { attempt: row, isNew: true }
      })
    },
  }
}
