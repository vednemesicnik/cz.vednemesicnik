import { createHash, randomUUID } from 'node:crypto'

import type { CancelFinalOutcome, FinalVersionOutcome } from '../data/articles.server.ts'
import type { ArtworksSetup } from './artworks-setup.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'

/**
 * _Označit finální verzi_ and its cancel on Drive (`15f`, `15g`, #88): the article's Doc as it is,
 * exported to PDF and stored as `<sha256>.pdf` in the article folder, as `mark-for-finalization.gs`
 * does for the issues made before the app. The database is written only once the PDF exists, and
 * the PDF goes to the bin when the database refuses it: all or nothing (`11c`).
 *
 * The PDF is never reused by its hash. An export of the same Doc rarely gives the same bytes, and
 * a cancel would otherwise bin a file an earlier marking still points to.
 */

export type FinalVersionSetup = Pick<ArtworksSetup, 'articles' | 'files' | 'now' | 'token'>

/**
 * What marking came to. `done` is recorded; the rest wrote nothing and say why: the database
 * refused (somebody changed the article meanwhile), the account is not connected, the article
 * folder or the Doc is gone, or Drive did not answer.
 */
export type MarkFinalOutcome =
  | { at: Temporal.Instant; kind: 'done' }
  | { kind: 'refused'; refusal: Exclude<FinalVersionOutcome, { kind: 'done' }> }
  | { kind: 'account' }
  | { kind: 'doc-missing' }
  | { kind: 'folder-missing' }
  | { kind: 'unavailable' }

export type CancelFinalStepOutcome =
  | { kind: 'done' }
  | { kind: 'refused'; refusal: Exclude<CancelFinalOutcome, { kind: 'done' }> }
  | { kind: 'unavailable' }

const lock = createLock()

export function markFinalVersion(
  setup: FinalVersionSetup,
  input: {
    by: { email: string; name: string | null }
    id: number
    owner?: string
    takenAt: Temporal.Instant
  },
): Promise<MarkFinalOutcome> {
  return lock(`final-version:${input.id}`, () => mark(setup, input))
}

async function mark(
  setup: FinalVersionSetup,
  input: Parameters<typeof markFinalVersion>[1],
): Promise<MarkFinalOutcome> {
  let refusal = await setup.articles.checkFinalVersion(input.id, input.takenAt, input.owner)
  if (refusal !== null) return { kind: 'refused', refusal }
  let article = await setup.articles.findById(input.id)
  if (article === null || article.docId === null || article.folderId === null) {
    return { kind: 'refused', refusal: { kind: 'gone' } }
  }
  if (article.missing.article !== null) return { kind: 'folder-missing' }

  let token = await setup.token()
  if (!token.ok)
    return token.reason === 'unavailable' ? { kind: 'unavailable' } : { kind: 'account' }
  let files = setup.files(token.accessToken)

  /* Gone is told apart from a Drive that does not answer, so the Callout says what to restore. */
  let folder = await files.placeOf(article.folderId)
  if (folder.kind === 'unavailable') return { kind: 'unavailable' }
  if (folder.kind === 'gone') {
    await setup.articles.markMissing(input.id, ['article'], setup.now())
    return { kind: 'folder-missing' }
  }
  let doc = await files.placeOf(article.docId)
  if (doc.kind === 'unavailable') return { kind: 'unavailable' }
  if (doc.kind === 'gone') return { kind: 'doc-missing' }

  let pdf = await files.exportPdf(article.docId)
  if (pdf === null) return { kind: 'unavailable' }
  let hash = createHash('sha256').update(pdf).digest('hex')
  let attemptKey = `final-version:${input.id}:${randomUUID()}`
  let stored = await files.upload(
    article.folderId,
    `${hash}.pdf`,
    'application/pdf',
    pdf,
    attemptKey,
  )
  if (!stored.ok) {
    await binAttempt(setup, article.folderId, attemptKey, null)
    return { kind: 'unavailable' }
  }

  /* A record that refuses or throws leaves no PDF behind it: all or nothing (`11c`). */
  let outcome: FinalVersionOutcome
  try {
    outcome = await setup.articles.markFinalVersion({
      at: setup.now(),
      by: input.by,
      id: input.id,
      owner: input.owner,
      pdf: { attemptKey, fileId: stored.id, hash },
      takenAt: input.takenAt,
    })
  } catch (error) {
    /* A transaction that throws is rolled back; the read makes sure before the PDF goes. */
    let after = await setup.articles.findById(input.id)
    if (after?.finalVersion?.pdfFileId !== stored.id) {
      await binAttempt(setup, article.folderId, attemptKey, stored.id)
    }
    throw error
  }
  if (outcome.kind === 'done') return outcome
  await binAttempt(setup, article.folderId, attemptKey, stored.id)
  return { kind: 'refused', refusal: outcome }
}

/**
 * Puts a marking's PDF in the bin, by its ID and by the attempt's tag, which covers an upload whose
 * answer was lost on the way. A PDF that does not reach the bin is no harm: no record points to it.
 */
async function binAttempt(
  setup: FinalVersionSetup,
  folderId: string,
  attemptKey: string,
  fileId: string | null,
): Promise<void> {
  let token = await setup.token()
  if (!token.ok) return
  let files = setup.files(token.accessToken)
  let ids = new Set(fileId === null ? [] : [fileId])
  for (let id of (await files.findTagged(folderId, attemptKey)) ?? []) ids.add(id)
  for (let id of ids) {
    if (!(await files.trash(id)))
      logDriveFailure('a final version PDF was not moved to the bin', id)
  }
}

/**
 * _Zrušit finální verzi_ (`15g`): the record first, then the PDF to the bin. The record is what
 * decides against a run of the job taking a clause at the same moment; binning first would hand
 * that run a PDF in the bin, and if Drive then did not take it back out, the only copy of the
 * version the authors are asked about would be lost with the bin. A PDF that does not reach the
 * bin after the record is cancelled is only a file nothing points to, and is logged.
 */
export function cancelFinalVersion(
  setup: FinalVersionSetup,
  input: { id: number; markedAt: Temporal.Instant; owner?: string },
): Promise<CancelFinalStepOutcome> {
  return lock(`final-version:${input.id}`, () => cancel(setup, input))
}

async function cancel(
  setup: FinalVersionSetup,
  input: Parameters<typeof cancelFinalVersion>[1],
): Promise<CancelFinalStepOutcome> {
  let outcome: CancelFinalOutcome
  try {
    outcome = await setup.articles.cancelFinalVersion(
      input.id,
      setup.now(),
      input.markedAt,
      input.owner,
    )
  } catch (error) {
    /* Rolled back with the transaction: the marking stands whole and the toast says to try
       again. Logged, so a cancel that keeps failing is seen. */
    console.error(`[final-version] the cancel of article ${input.id} was not written:`, error)
    return { kind: 'unavailable' }
  }
  if (outcome.kind !== 'done') return { kind: 'refused', refusal: outcome }

  let token = await setup.token()
  let isBinned = token.ok && (await setup.files(token.accessToken).trash(outcome.pdfFileId))
  if (!isBinned) {
    logDriveFailure('a cancelled final version PDF was not moved to the bin', outcome.pdfFileId)
  }
  return { kind: 'done' }
}
