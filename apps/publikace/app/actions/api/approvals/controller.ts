import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type { ArticleStore, ClaimedClause, ClaimedReply } from '../../../data/articles.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import {
  APPROVAL_SEND_JOB,
  APPROVAL_SUBJECT_PREFIX,
  CLAIM_LIMIT,
  type ClauseOutcome,
  ERROR_TEXT_LIMIT,
  REPLY_CLAIM_LIMIT,
  VERIFIED_CONSENT_NOTE,
} from '../../../domain/approvals.ts'
import { type BatchReport, EXPECTED_REPLY } from '../../../domain/reply-check.ts'
import { routes } from '../../../routes.ts'
import { readConsentReport } from '../consent-report.ts'

/**
 * The API that `SCRIPT__Publication__Article_Approvals` sends the final versions of issues made in
 * the app through and reads their authors' replies through (#88, #89): a standalone Apps Script
 * project running as `publikace.app@` on its own trigger. One run, _Žádosti a odpovědi u článků_
 * (`14d`), makes two calls:
 *
 * 1. `claim` with the trigger's interval opens the run and takes two lists. `clauses` are the
 *    clauses _K odeslání_, each with what its e-mail needs: the author, the signature, the article
 *    and the PDF on Drive; taking one ends the way back of its marking (`15g`). `replies` are the
 *    clauses sent before, each with what Reply_Check needs to find the author's reply and where
 *    the archived conversation goes. A clause is in one list or the other, never both.
 * 2. `report` with the run's key gives, per clause sent, whether the Mailer sent it, and per reply
 *    what Reply_Check answered and what the job archived into the article's `Licence`, and closes
 *    the run. A reply answered `superseded` is a consent taken back while the job archived it: the
 *    job bins that PDF.
 *
 * Every call carries the job's Google identity token as a bearer, and only the account in
 * `SCRIPT_JOB_ACCOUNT` is let in, as for the reply check of artworks. A path or a field is never
 * renamed in place: the job's deployed code is its contract, and a change is a new version.
 */

export type ApprovalsDependencies = {
  articles: ArticleStore
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  now: () => Temporal.Instant
  runs: JobRunStore
  verifyIdentityToken: IdentityTokenVerifier
}

/* A trigger fires at most once a minute and at least once a day. */
const MAX_INTERVAL_MINUTES = 24 * 60
const MAX_ID_LENGTH = 200

const NO_STORE = { 'Cache-Control': 'no-store' }

function json(body: unknown, status = 200): Response {
  return Response.json(body, { headers: NO_STORE, status })
}

function bearerOf(request: Request): string | null {
  let match = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')
  return match?.[1] ?? null
}

async function bodyOf(request: Request): Promise<Record<string, unknown> | null> {
  try {
    let body: unknown = await request.json()
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function isText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value !== '' && value.length <= max
}

function readReply(value: unknown): { clauseKey: string; report: BatchReport } | null {
  if (typeof value !== 'object' || value === null) return null
  let fields = value as Record<string, unknown>
  let { clauseKey } = fields
  if (!isText(clauseKey, MAX_ID_LENGTH)) return null
  let report = readConsentReport(fields)
  return report === null ? null : { clauseKey, report }
}

function readResult(value: unknown): { clauseKey: string; outcome: ClauseOutcome } | null {
  if (typeof value !== 'object' || value === null) return null
  let { clauseKey, error, outcome } = value as Record<string, unknown>
  if (!isText(clauseKey, MAX_ID_LENGTH)) return null
  if (outcome === 'sent') return { clauseKey, outcome: { kind: 'sent' } }
  if (outcome !== 'failed' || !isText(error, ERROR_TEXT_LIMIT)) return null
  return { clauseKey, outcome: { error, kind: 'failed' } }
}

/** One clause to send as the job gets it. The subject's tag is the clause's key. */
function claimedItem(clause: ClaimedClause) {
  return {
    articleName: clause.articleName,
    authorEmail: clause.authorEmail,
    authorName: clause.authorName,
    clauseKey: clause.clauseKey,
    docId: clause.docId,
    issueName: clause.issueName,
    pdfFileId: clause.pdfFileId,
    pdfHash: clause.pdfHash,
    signature: clause.signature,
    subjectPrefix: APPROVAL_SUBJECT_PREFIX,
  }
}

/** One reply to ask about: what Reply_Check is asked, and what the archived PDF says. */
function claimedReply(clause: ClaimedReply) {
  return {
    articleName: clause.articleName,
    authorName: clause.authorName,
    clauseKey: clause.clauseKey,
    expectedReply: EXPECTED_REPLY,
    isVerified: clause.isVerified,
    issueName: clause.issueName,
    licencesFolderId: clause.licencesFolderId,
    sender: clause.authorEmail,
    subjectContains: [clause.articleName],
    subjectPrefix: APPROVAL_SUBJECT_PREFIX,
    subjectTag: clause.clauseKey,
    verifiedConsentNote: VERIFIED_CONSENT_NOTE,
  }
}

export default function createApprovalsController(dependencies: ApprovalsDependencies) {
  /** `null` when the token is the job account's; otherwise the answer that refuses the call. */
  async function refusal(request: Request): Promise<Response | null> {
    let bearer = bearerOf(request)
    if (bearer === null) return json({ error: 'unauthorized' }, 401)
    let check = await dependencies.verifyIdentityToken(bearer)
    if (check.status === 'unavailable') return json({ error: 'unavailable' }, 503)
    if (
      check.status !== 'verified' ||
      check.identity.email.toLowerCase() !== dependencies.jobAccount
    ) {
      return json({ error: 'unauthorized' }, 401)
    }
    return null
  }

  return createController(routes.api.approvals, {
    actions: {
      async claim(context) {
        let refused = await refusal(context.request)
        if (refused !== null) return refused
        let body = await bodyOf(context.request)
        let interval = body?.['intervalMinutes']
        if (
          typeof interval !== 'number' ||
          !Number.isInteger(interval) ||
          interval < 1 ||
          interval > MAX_INTERVAL_MINUTES
        ) {
          return json({ error: 'invalid_request' }, 400)
        }

        let at = dependencies.now()
        let runKey = crypto.randomUUID()
        await dependencies.runs.start({
          at,
          intervalMinutes: interval,
          job: APPROVAL_SEND_JOB,
          runKey,
        })
        /* Disjoint: a clause is asked about only once it left _K odeslání_. */
        let replies = await dependencies.articles.claimForReplies(runKey, at)
        let clauses = await dependencies.articles.claimForSending(runKey, at)
        return json({
          clauses: clauses.map(claimedItem),
          replies: replies.map(claimedReply),
          runKey,
        })
      },

      async report(context) {
        let refused = await refusal(context.request)
        if (refused !== null) return refused
        let body = await bodyOf(context.request)
        let runKey = body?.['runKey']
        let outcome = body?.['outcome']
        /* An empty text says nothing, as no text does. */
        let error = body?.['error'] === '' ? null : body?.['error']
        let results = body?.['results']
        /* A run with no reply to report may leave the list out. */
        let replies = body?.['replies'] ?? []
        if (
          !isText(runKey, MAX_ID_LENGTH) ||
          (outcome !== 'ok' && outcome !== 'failed') ||
          (error !== undefined && error !== null && !isText(error, ERROR_TEXT_LIMIT)) ||
          !Array.isArray(results) ||
          results.length > CLAIM_LIMIT ||
          !Array.isArray(replies) ||
          replies.length > REPLY_CLAIM_LIMIT
        ) {
          return json({ error: 'invalid_request' }, 400)
        }
        let read = results.map(readResult)
        if (read.some((result) => result === null)) return json({ error: 'invalid_request' }, 400)
        let readReplies = replies.map(readReply)
        if (readReplies.some((reply) => reply === null)) {
          return json({ error: 'invalid_request' }, 400)
        }
        if (!(await dependencies.runs.isOpen(APPROVAL_SEND_JOB, runKey))) {
          return json({ error: 'unknown_run' }, 409)
        }

        let at = dependencies.now()
        let answers = []
        for (let result of read) {
          if (result === null) continue
          let answer = await dependencies.articles.recordSending(
            runKey,
            result.clauseKey,
            result.outcome,
            at,
          )
          answers.push({ answer, clauseKey: result.clauseKey })
        }
        let replyAnswers = []
        for (let reply of readReplies) {
          if (reply === null) continue
          let answer = await dependencies.articles.recordReply(
            runKey,
            reply.clauseKey,
            reply.report,
            at,
          )
          replyAnswers.push({ answer, clauseKey: reply.clauseKey })
        }
        await dependencies.runs.finish(APPROVAL_SEND_JOB, runKey, {
          at,
          error: typeof error === 'string' ? error : null,
          outcome,
        })
        return json({ replies: replyAnswers, results: answers })
      },
    },
  })
}
