import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type {
  ArticleCommentsStore,
  ClaimedCommentArticle,
  CommentDigestReport,
} from '../../../data/article-comments.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import {
  ARTICLE_CLAIM_LIMIT,
  ARTICLE_COMMENTS_JOB,
  commentDigestOutcome,
  ERROR_TEXT_LIMIT,
  MAX_SUGGESTION_HASH_LENGTH,
  MAX_SUGGESTION_HASHES,
  writeCommentDigestRun,
} from '../../../domain/article-comments.ts'
import { routes } from '../../../routes.ts'
import { bodyOf, intervalOf, isText, json, refusal } from '../job-request.ts'

/**
 * The API that `SCRIPT__Publication__Article_Comments` tells the authors of the issues made in the
 * app of new comments through (#170): a standalone Apps Script project running as `publikace.app@`,
 * a Content manager of _Publikace_, on its own trigger every three hours from 0:00.
 * `Comment_Digest` under `publikace@` keeps the issues on the Registr's list _Vydání_ until the
 * cutover, so the two never share an issue. One run, _Připomínky ke článkům_ (`14d`), makes two
 * calls:
 *
 * 1. `claim` with the trigger's interval opens the run and takes every article of an open issue
 *    (complete, neither closed nor removed) that is created, not removed, and not held by another
 *    run in the last ten minutes, those told of longest ago first, at most `ARTICLE_CLAIM_LIMIT`.
 *    Per article it gives `articleId`, `name`, `issueName`, `docId`, `authorEmails` in the order of
 *    the article's form, `reportedUntil` (ISO 8601: the claim of the last run that told every
 *    author, or the article's creation before any did) and `suggestionHashes`, the hashed IDs of
 *    the suggestions already told of. The answer carries the run's `runKey`.
 *
 *    The job reads each Doc's comments and replies modified after `reportedUntil` and its open
 *    suggestions whose hash is not listed, leaves out what an author of the article wrote, and
 *    sends each author one e-mail (`20e`) with every article of theirs that has something new. It
 *    sends through the Mailer, signed with the Mailer's secret in its Script Properties, under an
 *    idempotency key derived from the author's address and the e-mail's content, so a retry of the
 *    same e-mail is not sent twice and one with something new is.
 * 2. `report` with the run's key gives `outcome` (`ok` or `failed`) and `error`; `articles`, each
 *    article the job read and whose every author with something new the Mailer confirmed, or that
 *    had nothing new, with `suggestionHashes`, every suggestion now told of; `unconfirmed`, an
 *    `{ articleId, email }` for each article of an e-mail the Mailer did not confirm; and `sent`,
 *    the e-mails it confirmed. An article in `articles` moves to the run's claim, so a comment
 *    written while the job read is told of again rather than never. An article in `unconfirmed` or
 *    left out keeps what it had, and the next run tells of it again. Every article the run holds is
 *    released. The run ends `failed` when the job said so or any e-mail is unconfirmed, and the
 *    unconfirmed e-mails stand in `14e` with each article's name.
 *
 * Every call carries the job's Google identity token as a bearer, and only the account in
 * `SCRIPT_JOB_ACCOUNT` is let in. A path or a field is never renamed in place: the job's deployed
 * code is its contract, and a change is a new version.
 */

export type ArticleCommentsDependencies = {
  digests: ArticleCommentsStore
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  now: () => Temporal.Instant
  runs: JobRunStore
  verifyIdentityToken: IdentityTokenVerifier
}

const MAX_ID_LENGTH = 200
/* RFC 5321 allows an address of 254 characters at most. */
const MAX_EMAIL_LENGTH = 254
/* An article has a few authors; the limit only stops nonsense. */
const MAX_UNCONFIRMED = ARTICLE_CLAIM_LIMIT * 10
/* Far more e-mails than one run of a few issues sends. */
const MAX_SENT = 10_000

function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function readArticles(value: unknown): CommentDigestReport['articles'] | null {
  if (!Array.isArray(value) || value.length > ARTICLE_CLAIM_LIMIT) return null
  let read: CommentDigestReport['articles'] = []
  for (let article of value as unknown[]) {
    if (typeof article !== 'object' || article === null) return null
    let { articleId, suggestionHashes } = article as Record<string, unknown>
    if (
      !isId(articleId) ||
      !Array.isArray(suggestionHashes) ||
      suggestionHashes.length > MAX_SUGGESTION_HASHES ||
      !suggestionHashes.every((hash) => isText(hash, MAX_SUGGESTION_HASH_LENGTH))
    ) {
      return null
    }
    read.push({ articleId, suggestionHashes: suggestionHashes as string[] })
  }
  return read
}

function readUnconfirmed(value: unknown): CommentDigestReport['unconfirmed'] | null {
  if (!Array.isArray(value) || value.length > MAX_UNCONFIRMED) return null
  let read: CommentDigestReport['unconfirmed'] = []
  for (let each of value as unknown[]) {
    if (typeof each !== 'object' || each === null) return null
    let { articleId, email } = each as Record<string, unknown>
    if (!isId(articleId) || !isText(email, MAX_EMAIL_LENGTH)) return null
    read.push({ articleId, email })
  }
  return read
}

/**
 * Each article once, and none both told of and unconfirmed: the job would be saying two things
 * of the same article.
 */
function isConsistent(report: CommentDigestReport): boolean {
  let told = new Set(report.articles.map((article) => article.articleId))
  return (
    told.size === report.articles.length &&
    report.unconfirmed.every((each) => !told.has(each.articleId))
  )
}

/** One article as the job gets it; instants as ISO 8601. */
function claimedArticle(article: ClaimedCommentArticle) {
  return { ...article, reportedUntil: article.reportedUntil.toString() }
}

export default function createArticleCommentsController(dependencies: ArticleCommentsDependencies) {
  return createController(routes.api.articleComments, {
    actions: {
      async claim(context) {
        let refused = await refusal(context.request, dependencies)
        if (refused !== null) return refused
        let interval = intervalOf(await bodyOf(context.request))
        if (interval === null) return json({ error: 'invalid_request' }, 400)

        let at = dependencies.now()
        let runKey = crypto.randomUUID()
        await dependencies.runs.start({
          at,
          intervalMinutes: interval,
          job: ARTICLE_COMMENTS_JOB,
          runKey,
        })
        let articles = await dependencies.digests.claim(runKey, at)
        return json({ articles: articles.map(claimedArticle), runKey })
      },

      async report(context) {
        let refused = await refusal(context.request, dependencies)
        if (refused !== null) return refused
        let body = await bodyOf(context.request)
        let runKey = body?.['runKey']
        let outcome = body?.['outcome']
        /* An empty text says nothing, as no text does. */
        let error = body?.['error'] === '' ? null : body?.['error']
        let sent = body?.['sent']
        let articles = readArticles(body?.['articles'])
        let unconfirmed = readUnconfirmed(body?.['unconfirmed'])
        if (
          !isText(runKey, MAX_ID_LENGTH) ||
          (outcome !== 'ok' && outcome !== 'failed') ||
          (error !== undefined && error !== null && !isText(error, ERROR_TEXT_LIMIT)) ||
          typeof sent !== 'number' ||
          !Number.isInteger(sent) ||
          sent < 0 ||
          sent > MAX_SENT ||
          articles === null ||
          unconfirmed === null ||
          !isConsistent({ articles, unconfirmed })
        ) {
          return json({ error: 'invalid_request' }, 400)
        }
        if (!(await dependencies.runs.isOpen(ARTICLE_COMMENTS_JOB, runKey))) {
          return json({ error: 'unknown_run' }, 409)
        }

        let recorded = await dependencies.digests.record(runKey, { articles, unconfirmed })
        let run = { hasFailed: outcome === 'failed', sent, unconfirmed: recorded.unconfirmed }
        await dependencies.runs.finish(ARTICLE_COMMENTS_JOB, runKey, {
          at: dependencies.now(),
          error: typeof error === 'string' ? error : null,
          outcome: commentDigestOutcome(run),
          summary: writeCommentDigestRun(run),
        })
        return json({ articles: recorded.answers })
      },
    },
  })
}
