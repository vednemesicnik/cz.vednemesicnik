import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The proofreaders' address in Nastavení › Korektura (`14a`, `14f`): one address, an account or a
 * Google group, where the morning digest goes. It is set once and then only changed; nothing
 * clears it, because without it the digest would quietly stop (`14f`).
 */
export type ProofreadersAddress = {
  changedAt: Temporal.Instant
  changedByEmail: string
  email: string
}

export type ProofreadersStore = {
  /** The address, or `null` until somebody first sets it. */
  find(): Promise<ProofreadersAddress | null>
  /** Sets the address, or changes it, as that administrator. */
  save(email: string, by: string, at: Temporal.Instant): Promise<void>
}

export function createProofreadersStore(database: Database): ProofreadersStore {
  return {
    async find() {
      let result = await database.exec(
        sql`SELECT email, changed_at, changed_by_email FROM proofreaders WHERE id = 1`,
      )
      let row = result.rows?.[0]
      let changedAt = parseStamp(row?.['changed_at'])
      if (row === undefined || changedAt === null) return null
      return {
        changedAt,
        changedByEmail: String(row['changed_by_email']),
        email: String(row['email']),
      }
    },

    async save(email, by, at) {
      await database.exec(
        sql`INSERT INTO proofreaders (id, email, changed_at, changed_by_email)
            VALUES (1, ${email}, ${stamp(at)}, ${by})
            ON CONFLICT (id) DO UPDATE SET email = excluded.email,
              changed_at = excluded.changed_at, changed_by_email = excluded.changed_by_email`,
      )
    },
  }
}
