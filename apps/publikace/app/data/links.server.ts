import { getRandomValues } from 'node:crypto'
import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import {
  LINK_KEY_ALPHABET,
  LINK_KEY_LENGTH,
  type Link,
  type LinkKind,
  type LinkUsage,
} from '../domain/link.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The shared links in the app's database (`02a`). An issue's link for new articles comes into
 * being when the issue is complete and is replaced, never edited; an article's link for its
 * artworks comes into being with the article, and an artwork group's with the group.
 */

export type LinkStore = {
  /** The issue's valid link for new articles, created when it has none. */
  ensureArticleLink(issueId: number, at: Temporal.Instant): Promise<Link>
  findByKey(key: string): Promise<Link | null>
  /** The issue's valid link for new articles, if any. */
  articleLinkOf(issueId: number): Promise<Link | null>
  /** Each created article's link for its artworks, by the article's ID. */
  artworksLinksOf(issueId: number): Promise<Map<number, Link>>
  /** Revokes the valid link and issues a new one, in one transaction (`02d`). */
  renew(issueId: number, at: Temporal.Instant): Promise<Link>
  /** How many articles came through the link, and when the last did. */
  usage(linkId: number): Promise<LinkUsage>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

/*
 * 248 is the largest multiple of 62 a byte reaches, so a byte at or above it is drawn again rather
 * than folded back in, which would make the first eight characters likelier than the rest.
 */
const FAIR_LIMIT = 256 - (256 % LINK_KEY_ALPHABET.length)

/** Twelve characters of the alphabet from the system's cryptographic random source. */
export function newLinkKey(): string {
  let key = ''
  while (key.length < LINK_KEY_LENGTH) {
    for (let byte of getRandomValues(new Uint8Array(16))) {
      if (byte < FAIR_LIMIT && key.length < LINK_KEY_LENGTH) {
        key += LINK_KEY_ALPHABET[byte % LINK_KEY_ALPHABET.length]
      }
    }
  }
  return key
}

export function toLink(row: Row): Link {
  return {
    articleId: row['article_id'] == null ? null : Number(row['article_id']),
    createdAt: parseStamp(row['created_at']) ?? EPOCH,
    groupId: row['group_id'] == null ? null : Number(row['group_id']),
    id: Number(row['id']),
    issueId: Number(row['issue_id']),
    key: String(row['key']),
    kind: row['kind'] === 'artworks' ? 'artworks' : 'article',
    revokedAt: parseStamp(row['revoked_at']),
  }
}

async function validArticleLink(db: Database, issueId: number): Promise<Link | null> {
  let result = await db.exec(
    sql`SELECT * FROM links WHERE issue_id = ${issueId} AND kind = 'article' AND revoked_at IS NULL`,
  )
  let row = result.rows?.[0]
  return row === undefined ? null : toLink(row)
}

/** Inserts a link with a fresh key, within whatever transaction `db` is. */
export async function insertLink(
  db: Database,
  link: {
    articleId: number | null
    at: Temporal.Instant
    /** The artwork group an artworks link uploads to, in place of an article (#133). */
    groupId?: number
    issueId: number
    kind: LinkKind
  },
): Promise<Link> {
  let key = newLinkKey()
  await db.exec(
    sql`INSERT INTO links (key, kind, issue_id, article_id, group_id, created_at)
        VALUES (${key}, ${link.kind}, ${link.issueId}, ${link.articleId}, ${link.groupId ?? null},
          ${stamp(link.at)})`,
  )
  let result = await db.exec(sql`SELECT * FROM links WHERE key = ${key}`)
  let row = result.rows?.[0]
  if (row === undefined) throw new Error('The link was not written.')
  return toLink(row)
}

/** The issue's valid link for new articles, created when it has none, within `db`. */
export async function ensureArticleLinkIn(
  db: Database,
  issueId: number,
  at: Temporal.Instant,
): Promise<Link> {
  return (
    (await validArticleLink(db, issueId)) ??
    insertLink(db, { articleId: null, at, issueId, kind: 'article' })
  )
}

export function createLinkStore(database: Database): LinkStore {
  return {
    articleLinkOf(issueId) {
      return validArticleLink(database, issueId)
    },

    async artworksLinksOf(issueId) {
      let result = await database.exec(
        sql`SELECT * FROM links WHERE issue_id = ${issueId} AND kind = 'artworks' AND revoked_at IS NULL`,
      )
      let links = new Map<number, Link>()
      for (let row of result.rows ?? []) {
        let link = toLink(row)
        if (link.articleId !== null) links.set(link.articleId, link)
      }
      return links
    },

    ensureArticleLink(issueId, at) {
      return database.transaction((db) => ensureArticleLinkIn(db, issueId, at))
    },

    async findByKey(key) {
      let result = await database.exec(sql`SELECT * FROM links WHERE key = ${key}`)
      let row = result.rows?.[0]
      return row === undefined ? null : toLink(row)
    },

    renew(issueId, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE links SET revoked_at = ${stamp(at)}
              WHERE issue_id = ${issueId} AND kind = 'article' AND revoked_at IS NULL`,
        )
        return insertLink(db, { articleId: null, at, issueId, kind: 'article' })
      })
    },

    async usage(linkId) {
      let result = await database.exec(
        sql`SELECT count(*) AS count, max(created_at) AS last_at
            FROM articles WHERE link_id = ${linkId} AND created_at IS NOT NULL`,
      )
      let row = result.rows?.[0] ?? {}
      return { count: Number(row['count'] ?? 0), lastAt: parseStamp(row['last_at']) }
    },
  }
}
