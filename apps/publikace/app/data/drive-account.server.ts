import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { decryptToken, encryptToken } from '../auth/token-cipher.server.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * The account the app acts as on Drive, `publikace.app@`, and its refresh token.
 *
 * One row at most. The token is kept encrypted and leaves this module only through
 * `refreshToken()`, for the exchange in `app/drive/access-token.server.ts`.
 */

export type DriveAccountState =
  | { status: 'not-connected' }
  | { connectedAt: Temporal.Instant; email: string; status: 'connected' | 'disconnected' }

export type DriveConnection = {
  at: Temporal.Instant
  /** The editor-in-chief who connected it. */
  by: string
  email: string
  refreshToken: string
}

export type DriveAccountStore = {
  /** Stores the account, replacing an earlier token and clearing _Odpojeno_. */
  connect(connection: DriveConnection): Promise<void>
  /** Marks a connected account _Odpojeno_; one that already is keeps its first time. */
  markDisconnected(when: Temporal.Instant): Promise<void>
  /**
   * The token of a connected account, or `null`. A token that no longer decrypts — the key was
   * changed — is as good as revoked: the account is marked disconnected, so the screens ask for
   * it to be connected again instead of failing on every action.
   */
  refreshToken(when: Temporal.Instant): Promise<string | null>
  state(): Promise<DriveAccountState>
}

export function createDriveAccountStore(database: Database, key: Buffer): DriveAccountStore {
  async function row(): Promise<Record<string, unknown> | null> {
    let result = await database.exec(sql`SELECT * FROM drive_account WHERE id = 1`)
    return result.rows?.[0] ?? null
  }

  async function markDisconnected(when: Temporal.Instant): Promise<void> {
    await database.exec(
      sql`UPDATE drive_account SET disconnected_at = ${stamp(when)} WHERE id = 1 AND disconnected_at IS NULL`,
    )
  }

  return {
    async connect({ at, by, email, refreshToken }) {
      let ciphertext = encryptToken(refreshToken, key)
      await database.exec(
        sql`INSERT INTO drive_account (id, email, refresh_token, connected_at, connected_by, disconnected_at)
            VALUES (1, ${email}, ${ciphertext}, ${stamp(at)}, ${by}, NULL)
            ON CONFLICT (id) DO UPDATE SET
              email = excluded.email,
              refresh_token = excluded.refresh_token,
              connected_at = excluded.connected_at,
              connected_by = excluded.connected_by,
              disconnected_at = NULL`,
      )
    },

    markDisconnected,

    async refreshToken(when) {
      let current = await row()
      if (current === null || current['disconnected_at'] !== null) return null

      try {
        return decryptToken(String(current['refresh_token']), key)
      } catch {
        console.error('[drive] the stored token does not decrypt; marking the account disconnected')
        await markDisconnected(when)
        return null
      }
    },

    async state() {
      let current = await row()
      if (current === null) return { status: 'not-connected' }

      return {
        connectedAt:
          parseStamp(current['connected_at']) ?? Temporal.Instant.fromEpochMilliseconds(0),
        email: String(current['email']),
        status: current['disconnected_at'] === null ? 'connected' : 'disconnected',
      }
    },
  }
}
