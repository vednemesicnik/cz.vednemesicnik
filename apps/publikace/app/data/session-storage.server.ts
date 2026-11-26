import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'
import type { Session, SessionStorage } from 'remix/session'
import { createSession } from 'remix/session'

import { EDITOR_SESSION_KEY, SESSION_LIFETIME, type StoredEditor } from '../auth/session.server.ts'
import { now, stamp } from '../domain/time.ts'

/**
 * Sessions as rows in the app's database.
 *
 * A row rather than a cookie or a file, so that a session can be **ended from outside**:
 * removing a named account deletes its rows in the same transaction (`14b`, _odhlášen ze všech
 * zařízení_), and the next request from that browser finds nothing.
 *
 * ## Seven days from the sign-in, fixed
 *
 * `expires_at` is written once, when the row is inserted, and no save moves it (`03`,
 * rozhodnuto 17. 11. 2026). Signing in rotates the id, which inserts a new row, so the seven
 * days run from that moment; the anonymous row the sign-in page held before is deleted with
 * the rotation.
 *
 * ## The store sees only the session
 *
 * `SessionStorage` is handed the cookie and the session, never the request, so the `email`
 * column is read out of the session bag: the stored editor, or empty before anybody signed in.
 */
export function createSqliteSessionStorage(
  database: Database,
  clock: () => Temporal.Instant = now,
): SessionStorage {
  /*
   * Which row each session in flight was read from. Without it a save would be an upsert, and
   * an upsert undoes an ending: the browser's request reads its row, the account is removed,
   * the request finishes and writes the row back. Knowing the row was loaded makes the save an
   * `UPDATE` that can find nothing. Keyed by the session object and holding the id, because
   * `regenerateId` keeps the object and changes the id.
   */
  let loadedFrom = new WeakMap<Session, string>()

  function emailOf(session: Session): string | null {
    let [values] = session.data
    let editor = values[EDITOR_SESSION_KEY] as StoredEditor | undefined
    return typeof editor?.email === 'string' ? editor.email : null
  }

  async function remove(id: string): Promise<void> {
    await database.exec(sql`DELETE FROM sessions WHERE id = ${id}`)
  }

  return {
    async read(cookie) {
      if (cookie === null || cookie === '') return createSession()

      let when = stamp(clock())
      let result = await database.exec(
        sql`SELECT data FROM sessions WHERE id = ${cookie} AND expires_at > ${when}`,
      )
      let row = result.rows?.[0]
      if (row === undefined) return createSession()

      let data
      try {
        data = JSON.parse(String(row['data'])) as Session['data']
      } catch {
        return createSession()
      }

      await database.exec(sql`UPDATE sessions SET last_seen_at = ${when} WHERE id = ${cookie}`)

      let session = createSession(cookie, data)
      loadedFrom.set(session, cookie)
      return session
    },

    async save(session) {
      // First: the row under an id that sign-in or sign-out rotated away is what a fixed
      // session would be replayed from.
      if (session.deleteId !== undefined) await remove(session.deleteId)

      if (session.destroyed) {
        await remove(session.id)
        return ''
      }

      if (!session.dirty) return null

      let at = clock()
      let when = stamp(at)
      await database.exec(sql`DELETE FROM sessions WHERE expires_at <= ${when}`)

      let data = JSON.stringify(session.data)
      let email = emailOf(session)

      if (loadedFrom.get(session) === session.id) {
        let updated = await database.exec(
          sql`UPDATE sessions SET data = ${data}, email = ${email}, last_seen_at = ${when} WHERE id = ${session.id}`,
        )
        // Nothing updated: the row was ended while this request ran, and the browser is told so.
        return (updated.affectedRows ?? 0) === 0 ? '' : session.id
      }

      let expiresAt = stamp(at.add(SESSION_LIFETIME))
      await database.exec(
        sql`INSERT INTO sessions (id, email, data, created_at, expires_at, last_seen_at)
            VALUES (${session.id}, ${email}, ${data}, ${when}, ${expiresAt}, ${when})`,
      )
      return session.id
    },
  }
}
