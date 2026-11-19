import { createController } from 'remix/router'

import type { IdentityTokenVerifier } from '../../../auth/identity-token.server.ts'
import type { ArtworkStore, ClaimedBatch } from '../../../data/artworks.server.ts'
import type { JobRunStore } from '../../../data/job-runs.server.ts'
import { CONSENT_SUBJECT_PREFIX } from '../../../domain/artwork.ts'
import {
  type BatchReport,
  CLAIM_LIMIT,
  EXPECTED_REPLY,
  REPLY_CHECK_JOB,
  type ReportedArchive,
  type ReportedReply,
} from '../../../domain/reply-check.ts'
import { routes } from '../../../routes.ts'

/**
 * The API the reply check of artworks calls (#31): `SCRIPT__Publication__Artwork_Replies`, a
 * standalone Apps Script project running as `publikace.app@` on its own trigger. A run makes two
 * calls:
 *
 * 1. `claim` with the trigger's interval opens the run and takes the batches to ask about, each
 *    with what Reply_Check needs to find its thread and what the archived PDF says;
 * 2. `report` with the run's key gives, per batch, what Reply_Check answered and what the job
 *    archived into the article's `Licence`, and closes the run.
 *
 * Every call carries the job's Google identity token (`ScriptApp.getIdentityToken()`) as a bearer,
 * and only the account in `SCRIPT_JOB_ACCOUNT` is let in. No cookie is set. A path or a field is
 * never renamed in place: the job's deployed code is its contract, and a change is a new version.
 */

export type ArtworkRepliesDependencies = {
  artworks: ArtworkStore
  /** The account the jobs run as, in lower case. */
  jobAccount: string
  now: () => Temporal.Instant
  runs: JobRunStore
  verifyIdentityToken: IdentityTokenVerifier
}

/* A trigger fires at most once a minute and at least once a day. */
const MAX_INTERVAL_MINUTES = 24 * 60
const MAX_ID_LENGTH = 200
/* Reply_Check returns the reply's own text; more than this is not a reply anybody wrote. */
const MAX_TEXT_LENGTH = 50_000
const MAX_ERROR_LENGTH = 2000

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

function readReply(value: unknown): ReportedReply | null {
  if (typeof value !== 'object' || value === null) return null
  let { messageId, receivedAt, text, threadId } = value as Record<string, unknown>
  if (!isText(messageId, MAX_ID_LENGTH) || !isText(threadId, MAX_ID_LENGTH)) return null
  if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) return null
  if (typeof receivedAt !== 'string') return null
  try {
    return { messageId, receivedAt: Temporal.Instant.from(receivedAt), text, threadId }
  } catch {
    return null
  }
}

function readArchive(value: unknown): ReportedArchive | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object') return undefined
  let { error, fileId } = value as Record<string, unknown>
  if (fileId !== undefined) return isText(fileId, MAX_ID_LENGTH) ? { fileId } : undefined
  return isText(error, MAX_ERROR_LENGTH) ? { error } : undefined
}

function readResult(value: unknown): { batchId: number; report: BatchReport } | null {
  if (typeof value !== 'object' || value === null) return null
  let { archive, batchId, reply, state } = value as Record<string, unknown>
  if (typeof batchId !== 'number' || !Number.isSafeInteger(batchId) || batchId < 1) return null
  if (state === 'failed' || state === 'no_reply') return { batchId, report: { state } }
  if (state !== 'other_reply' && state !== 'reply_matches') return null
  let readReplyValue = readReply(reply)
  let readArchiveValue = readArchive(archive)
  if (readReplyValue === null || readArchiveValue === undefined) return null
  return {
    batchId,
    report: { archive: readArchiveValue, reply: readReplyValue, state },
  }
}

/** One batch as the job gets it: what Reply_Check is asked, and what the archived PDF says. */
function claimedItem(batch: ClaimedBatch) {
  return {
    articleName: batch.articleName,
    batchId: batch.id,
    /* An exact „Souhlasím“ archives at once, except on a discarded batch (`01b`). */
    canArchiveExactReply: batch.discardedAt === null,
    expectedReply: EXPECTED_REPLY,
    isVerified: batch.consentVerifiedAt !== null,
    issueName: batch.issueName,
    licencesFolderId: batch.licencesFolderId,
    providerEmail: batch.providerEmail,
    providerName: batch.providerName,
    sender: batch.providerEmail,
    subjectContains: [batch.articleName],
    subjectPrefix: CONSENT_SUBJECT_PREFIX,
    subjectTag: batch.tag,
  }
}

export default function createArtworkRepliesController(dependencies: ArtworkRepliesDependencies) {
  /** `null` when the token is the job account's; otherwise the answer that refuses the call. */
  async function refusal(request: Request): Promise<Response | null> {
    let bearer = bearerOf(request)
    if (bearer === null) return json({ error: 'unauthorized' }, 401)
    let check = await dependencies.verifyIdentityToken(bearer)
    if (check.status === 'unavailable') return json({ error: 'unavailable' }, 503)
    if (
      check.status === 'refused' ||
      check.identity.email.toLowerCase() !== dependencies.jobAccount
    ) {
      return json({ error: 'unauthorized' }, 401)
    }
    return null
  }

  return createController(routes.api.artworkReplies, {
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
          job: REPLY_CHECK_JOB,
          runKey,
        })
        let batches = await dependencies.artworks.claimForReplyCheck(runKey, at)
        return json({ batches: batches.map(claimedItem), runKey })
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
          (error !== undefined && error !== null && !isText(error, MAX_ERROR_LENGTH)) ||
          !Array.isArray(results) ||
          results.length > CLAIM_LIMIT
        ) {
          return json({ error: 'invalid_request' }, 400)
        }
        let read = results.map(readResult)
        if (read.some((result) => result === null)) return json({ error: 'invalid_request' }, 400)
        if (!(await dependencies.runs.isOpen(REPLY_CHECK_JOB, runKey))) {
          return json({ error: 'unknown_run' }, 409)
        }

        let at = dependencies.now()
        let answers = []
        for (let result of read) {
          if (result === null) continue
          let answer = await dependencies.artworks.recordReport(
            runKey,
            result.batchId,
            result.report,
            at,
          )
          answers.push({ answer, batchId: result.batchId })
        }
        await dependencies.runs.finish(REPLY_CHECK_JOB, runKey, {
          at,
          error: typeof error === 'string' ? error : null,
          outcome,
        })
        return json({ results: answers })
      },
    },
  })
}
