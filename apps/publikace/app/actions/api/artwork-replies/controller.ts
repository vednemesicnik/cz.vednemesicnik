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
} from '../../../domain/reply-check.ts'
import { routes } from '../../../routes.ts'
import { bodyOf, intervalOf, isText, json, refusal } from '../job-request.ts'
import { readConsentReport } from '../consent-report.ts'

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

const MAX_ID_LENGTH = 200
const MAX_ERROR_LENGTH = 2000

function readResult(value: unknown): { batchId: number; report: BatchReport } | null {
  if (typeof value !== 'object' || value === null) return null
  let fields = value as Record<string, unknown>
  let { batchId } = fields
  if (typeof batchId !== 'number' || !Number.isSafeInteger(batchId) || batchId < 1) return null
  let report = readConsentReport(fields)
  return report === null ? null : { batchId, report }
}

/**
 * One batch as the job gets it: what Reply_Check is asked, and what the archived PDF says.
 * `articleName` is the name of what the batch was sent to, a group's too; `kind` says which, so the
 * PDF can call it a group (#133). It is a field added beside the old ones, never in place of one.
 */
function claimedItem(batch: ClaimedBatch) {
  return {
    articleName: batch.holder.name,
    batchId: batch.id,
    /* An exact „Souhlasím“ archives at once, except on a discarded batch (`01b`). */
    canArchiveExactReply: batch.discardedAt === null,
    expectedReply: EXPECTED_REPLY,
    isVerified: batch.consentVerifiedAt !== null,
    issueName: batch.issueName,
    kind: batch.holder.kind === 'group' ? 'artwork-group' : 'article',
    licencesFolderId: batch.licencesFolderId,
    providerEmail: batch.providerEmail,
    providerName: batch.providerName,
    sender: batch.providerEmail,
    /* The name the request went under, which a rename since does not change (#152). */
    subjectContains: [batch.requestName],
    subjectPrefix: CONSENT_SUBJECT_PREFIX,
    subjectTag: batch.tag,
  }
}

export default function createArtworkRepliesController(dependencies: ArtworkRepliesDependencies) {
  return createController(routes.api.artworkReplies, {
    actions: {
      async claim(context) {
        let refused = await refusal(context.request, dependencies)
        if (refused !== null) return refused
        let body = await bodyOf(context.request)
        let interval = intervalOf(body)
        if (interval === null) return json({ error: 'invalid_request' }, 400)

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
        let refused = await refusal(context.request, dependencies)
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
