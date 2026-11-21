import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { type BatchPatch, REPLY_TEXT_LIMIT } from '../domain/reply-check.ts'
import { stamp } from '../domain/time.ts'

/**
 * A report's patch on a consent request: a batch of artworks or an author's clause, whose consent
 * columns have the same names (`20261121120000_consent_replies`, `20261126120000_clause_replies`).
 * The table is one of the two fragments below, never a value: a name cannot be bound.
 */
export const CONSENT_TABLES = {
  batches: sql`artwork_batches`,
  clauses: sql`article_clauses`,
} as const

export type ConsentTable = keyof typeof CONSENT_TABLES

/** The caller's transaction keeps a request from ever showing half of it. */
export async function applyConsentPatch(
  db: Database,
  table: ConsentTable,
  id: number,
  patch: BatchPatch,
): Promise<void> {
  let name = CONSENT_TABLES[table]
  if (patch.isDecisionReset === true) {
    await db.exec(
      sql`UPDATE ${name} SET consent_verified_at = NULL,
            consent_verified_by_email = NULL, consent_verified_by_name = NULL,
            archive_failed_at = NULL, archive_error = NULL
          WHERE id = ${id}`,
    )
  }
  if (patch.reply !== undefined) {
    let reply = patch.reply
    await db.exec(
      sql`UPDATE ${name} SET reply_thread_id = ${reply.threadId},
            reply_message_id = ${reply.messageId}, reply_received_at = ${stamp(reply.receivedAt)},
            reply_text = ${reply.text.slice(0, REPLY_TEXT_LIMIT)},
            is_exact_consent = ${reply.isExactConsent ? 1 : 0}
          WHERE id = ${id}`,
    )
  }
  if (patch.checkedAt !== undefined) {
    await db.exec(sql`UPDATE ${name} SET checked_at = ${stamp(patch.checkedAt)} WHERE id = ${id}`)
  }
  if (patch.archiveFailed !== undefined) {
    await db.exec(
      sql`UPDATE ${name} SET archive_failed_at = ${stamp(patch.archiveFailed.at)},
            archive_error = ${patch.archiveFailed.error.slice(0, 2000)}
          WHERE id = ${id}`,
    )
  }
  /* The PDF in `Licence` is the proof from here on, so the reply's text goes. */
  if (patch.approved !== undefined) {
    await db.exec(
      sql`UPDATE ${name} SET approved_at = ${stamp(patch.approved.at)},
            consent_file_id = ${patch.approved.fileId}, reply_text = NULL,
            archive_failed_at = NULL, archive_error = NULL
          WHERE id = ${id}`,
    )
  }
}
