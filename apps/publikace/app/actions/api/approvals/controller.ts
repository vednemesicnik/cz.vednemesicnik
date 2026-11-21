import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type { ArticleStore, ClaimedClause } from '../../../data/articles.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import {
  APPROVAL_SEND_JOB,
  CLAIM_LIMIT,
  type ClauseOutcome,
  ERROR_TEXT_LIMIT,
} from '../../../domain/approvals.ts'
import { routes } from '../../../routes.ts'

/**
 * The API that `SCRIPT__Publication__Approval_Send` sends the final versions of issues made in
 * the app through (#88, #89): a standalone Apps Script project running as `publikace.app@` on its
 * own trigger. A run makes two calls:
 *
 * 1. `claim` with the trigger's interval opens the run and takes the clauses _K odeslání_, each
 *    with what its e-mail needs: the author, the signature, the article and the PDF on Drive.
 *    Taking a clause ends the way back of its marking (`15g`);
 * 2. `report` with the run's key gives, per clause, whether the Mailer sent it, and closes the
 *    run.
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

function readResult(value: unknown): { clauseKey: string; outcome: ClauseOutcome } | null {
  if (typeof value !== 'object' || value === null) return null
  let { clauseKey, error, outcome } = value as Record<string, unknown>
  if (!isText(clauseKey, MAX_ID_LENGTH)) return null
  if (outcome === 'sent') return { clauseKey, outcome: { kind: 'sent' } }
  if (outcome !== 'failed' || !isText(error, ERROR_TEXT_LIMIT)) return null
  return { clauseKey, outcome: { error, kind: 'failed' } }
}

/** One clause as the job gets it. */
function claimedItem(clause: ClaimedClause) {
  return {
    articleName: clause.articleName,
    authorEmail: clause.authorEmail,
    authorName: clause.authorName,
    clauseKey: clause.clauseKey,
    docId: clause.docId,
    issueName: clause.issueName,
    pdfFileId: clause.pdfFileId,
    signature: clause.signature,
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
        let clauses = await dependencies.articles.claimForSending(runKey, at)
        return json({ clauses: clauses.map(claimedItem), runKey })
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
        if (
          !isText(runKey, MAX_ID_LENGTH) ||
          (outcome !== 'ok' && outcome !== 'failed') ||
          (error !== undefined && error !== null && !isText(error, ERROR_TEXT_LIMIT)) ||
          !Array.isArray(results) ||
          results.length > CLAIM_LIMIT
        ) {
          return json({ error: 'invalid_request' }, 400)
        }
        let read = results.map(readResult)
        if (read.some((result) => result === null)) return json({ error: 'invalid_request' }, 400)
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
        await dependencies.runs.finish(APPROVAL_SEND_JOB, runKey, {
          at,
          error: typeof error === 'string' ? error : null,
          outcome,
        })
        return json({ results: answers })
      },
    },
  })
}
