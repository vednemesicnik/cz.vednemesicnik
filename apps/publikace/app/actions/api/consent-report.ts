import type { BatchReport, ReportedArchive, ReportedReply } from '../../domain/reply-check.ts'

/**
 * What a reply check reports about one consent request, read from the job's JSON: the same fields
 * for a batch of artworks (`/api/v1/artwork-replies/report`) and for an author's clause
 * (`/api/v1/approvals/report`), since both come from `SCRIPT__Mail__Reply_Check`.
 */

const MAX_ID_LENGTH = 200
/* Reply_Check returns the reply's own text; more than this is not a reply anybody wrote. */
const MAX_TEXT_LENGTH = 50_000
const MAX_ERROR_LENGTH = 2000

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

/** `null` for no archive, `undefined` for one that is not readable. */
function readArchive(value: unknown): ReportedArchive | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'object') return undefined
  let { error, fileId } = value as Record<string, unknown>
  if (fileId !== undefined) return isText(fileId, MAX_ID_LENGTH) ? { fileId } : undefined
  return isText(error, MAX_ERROR_LENGTH) ? { error } : undefined
}

/** One request's report from its `state`, `reply` and `archive`, or `null` when it is not one. */
export function readConsentReport(fields: Record<string, unknown>): BatchReport | null {
  let { archive, reply, state } = fields
  if (state === 'failed' || state === 'no_reply') return { state }
  if (state !== 'other_reply' && state !== 'reply_matches') return null
  let readReplyValue = readReply(reply)
  let readArchiveValue = readArchive(archive)
  if (readReplyValue === null || readArchiveValue === undefined) return null
  return { archive: readArchiveValue, reply: readReplyValue, state }
}
