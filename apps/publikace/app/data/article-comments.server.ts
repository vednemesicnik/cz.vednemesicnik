import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import {
  ARTICLE_CLAIM_LIMIT,
  CLAIM_MINUTES,
  type UnconfirmedEmail,
} from '../domain/article-comments.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The comment digest of the issues made in the app as `SCRIPT__Publication__Article_Comments`
 * runs it (#170): which articles it reads, how far each was told of, and which run holds an
 * article now.
 */

/** One article as a claim hands it to the job. */
export type ClaimedCommentArticle = {
  articleId: number
  /** In the order of the article's form. */
  authorEmails: string[]
  docId: string
  issueName: string
  name: string
  /**
   * The moment up to which every author was told of the article's comments and replies: the
   * claim of the last run that confirmed it, or the article's creation before any did.
   */
  reportedUntil: Temporal.Instant
  /** The hashed IDs of the suggestions already told of. */
  suggestionHashes: string[]
}

/** What a run reported of the articles it holds. */
export type CommentDigestReport = {
  /** Read, and every author with something new told of it; their state moves to the claim. */
  articles: { articleId: number; suggestionHashes: readonly string[] }[]
  /** An e-mail to an author the Mailer did not confirm; the article stays as it was. */
  unconfirmed: { articleId: number; email: string }[]
}

export type CommentDigestAnswer = { answer: 'recorded' | 'unknown'; articleId: number }

export type ArticleCommentsStore = {
  /**
   * Opens the run's hold on the articles of every open, complete issue that no other run holds,
   * those told of longest ago first, and returns them.
   */
  claim(runKey: string, at: Temporal.Instant): Promise<ClaimedCommentArticle[]>
  /**
   * Moves each reported article the run holds to the run's claim, and releases every article the
   * run holds, reported or not; `unknown` for one it does not hold. The unconfirmed e-mails of
   * articles it holds come back with each article's name, for the run's summary.
   */
  record(
    runKey: string,
    report: CommentDigestReport,
  ): Promise<{ answers: CommentDigestAnswer[]; unconfirmed: UnconfirmedEmail[] }>
}

function idsJson(ids: readonly number[]): string {
  return JSON.stringify(ids)
}

function hashesOf(value: unknown): string[] {
  try {
    let parsed: unknown = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed.filter((each) => typeof each === 'string') : []
  } catch {
    return []
  }
}

export function createArticleCommentsStore(database: Database): ArticleCommentsStore {
  return {
    claim(runKey, at) {
      let lease = stamp(at.subtract({ minutes: CLAIM_MINUTES }))
      return database.transaction(async (db) => {
        let open = await db.exec(
          sql`SELECT a.id FROM articles a
              JOIN issues i ON i.id = a.issue_id
              LEFT JOIN comment_digests d ON d.article_id = a.id
              WHERE i.completed_at IS NOT NULL AND i.closed_at IS NULL AND i.removed_at IS NULL
                AND a.created_at IS NOT NULL AND a.removed_at IS NULL AND a.doc_id IS NOT NULL
                AND (d.claimed_at IS NULL OR d.claimed_at < ${lease})
              ORDER BY coalesce(d.reported_until, a.created_at), a.id
              LIMIT ${ARTICLE_CLAIM_LIMIT}`,
        )
        let ids = idsJson((open.rows ?? []).map((row) => Number(row['id'])))
        await db.exec(
          sql`INSERT INTO comment_digests (article_id)
              SELECT value FROM json_each(${ids}) WHERE true
              ON CONFLICT (article_id) DO NOTHING`,
        )
        await db.exec(
          sql`UPDATE comment_digests SET claim_key = ${runKey}, claimed_at = ${stamp(at)}
              WHERE article_id IN (SELECT value FROM json_each(${ids}))`,
        )
        let articles = await db.exec(
          sql`SELECT a.id, a.name, a.doc_id, a.created_at, i.name AS issue_name,
                d.reported_until, d.suggestion_hashes
              FROM articles a
              JOIN issues i ON i.id = a.issue_id
              JOIN comment_digests d ON d.article_id = a.id
              WHERE a.id IN (SELECT value FROM json_each(${ids}))
              ORDER BY coalesce(d.reported_until, a.created_at), a.id`,
        )
        let authors = await db.exec(
          sql`SELECT article_id, email FROM article_authors
              WHERE article_id IN (SELECT value FROM json_each(${ids}))
              ORDER BY article_id, position`,
        )
        let emailsOf = new Map<number, string[]>()
        for (let row of authors.rows ?? []) {
          let articleId = Number(row['article_id'])
          emailsOf.set(articleId, [...(emailsOf.get(articleId) ?? []), String(row['email'])])
        }
        let claimed: ClaimedCommentArticle[] = []
        for (let row of articles.rows ?? []) {
          let articleId = Number(row['id'])
          let reportedUntil = parseStamp(row['reported_until']) ?? parseStamp(row['created_at'])
          if (reportedUntil === null) continue
          claimed.push({
            articleId,
            authorEmails: emailsOf.get(articleId) ?? [],
            docId: String(row['doc_id']),
            issueName: String(row['issue_name']),
            name: String(row['name']),
            reportedUntil,
            suggestionHashes: hashesOf(row['suggestion_hashes']),
          })
        }
        return claimed
      })
    },

    record(runKey, report) {
      return database.transaction(async (db) => {
        let held = await db.exec(
          sql`SELECT d.article_id, a.name FROM comment_digests d
              JOIN articles a ON a.id = d.article_id
              WHERE d.claim_key = ${runKey}`,
        )
        let names = new Map<number, string>()
        for (let row of held.rows ?? []) names.set(Number(row['article_id']), String(row['name']))

        let recorded = report.articles.filter((article) => names.has(article.articleId))
        /*
         * One statement for every article, so a long report costs one round on the connection
         * every request shares. The claim's own moment is the new mark: the job read the Doc
         * after it, so a comment written in between is told of again rather than never.
         */
        await db.exec(
          sql`UPDATE comment_digests
              SET reported_until = claimed_at,
                  suggestion_hashes = json(json_extract(r.value, '$.suggestionHashes'))
              FROM json_each(${JSON.stringify(recorded)}) AS r
              WHERE comment_digests.article_id = json_extract(r.value, '$.articleId')
                AND comment_digests.claim_key = ${runKey}`,
        )
        await db.exec(
          sql`UPDATE comment_digests SET claim_key = NULL, claimed_at = NULL
              WHERE claim_key = ${runKey}`,
        )
        let answers: CommentDigestAnswer[] = report.articles.map((article) => ({
          answer: names.has(article.articleId) ? 'recorded' : 'unknown',
          articleId: article.articleId,
        }))
        let unconfirmed: UnconfirmedEmail[] = []
        for (let each of report.unconfirmed) {
          let articleName = names.get(each.articleId)
          if (articleName !== undefined) unconfirmed.push({ articleName, email: each.email })
        }
        return { answers, unconfirmed }
      })
    },
  }
}
