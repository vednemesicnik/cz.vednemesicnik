import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { EDITOR_SESSION_KEY } from '../auth/session.server.ts'
import { createTestApp } from '../test-app.server.ts'
import { createSqliteSessionStorage } from './session-storage.server.ts'

describe('session storage', () => {
  it('keeps the expiry the row was written with, whatever later saves happen', async () => {
    let app = await createTestApp()
    try {
      let clock = Temporal.Instant.from('2026-11-17T08:00:00Z')
      let storage = createSqliteSessionStorage(app.database, () => clock)

      let first = await storage.read(null)
      first.set('_csrf', 'a')
      let id = await storage.save(first)
      assert.ok(typeof id === 'string' && id !== '')

      clock = Temporal.Instant.from('2026-11-20T08:00:00Z')
      let again = await storage.read(id)
      again.set('_csrf', 'b')
      assert.equal(await storage.save(again), id)

      let row = await app.database.exec(sql`SELECT expires_at FROM sessions WHERE id = ${id}`)
      assert.deepEqual(row.rows, [{ expires_at: '2026-11-24T08:00:00.000Z' }])

      clock = Temporal.Instant.from('2026-11-24T08:00:00Z')
      let expired = await storage.read(id)
      assert.notEqual(expired.id, id)
    } finally {
      await app.close()
    }
  })

  it('does not write back a session ended while its request ran', async () => {
    let app = await createTestApp()
    try {
      let storage = createSqliteSessionStorage(app.database)
      let session = await storage.read(null)
      session.set(EDITOR_SESSION_KEY, {
        authorizedUntil: 0,
        displayName: 'Eva',
        email: 'eva@vednemesicnik.test',
      })
      let id = await storage.save(session)
      assert.ok(typeof id === 'string')

      let inFlight = await storage.read(id)
      await app.database.exec(sql`DELETE FROM sessions WHERE email = ${'eva@vednemesicnik.test'}`)
      inFlight.set('_csrf', 'x')

      assert.equal(await storage.save(inFlight), '')
      let rows = await app.database.exec(sql`SELECT id FROM sessions`)
      assert.deepEqual(rows.rows, [])
    } finally {
      await app.close()
    }
  })

  it('stamps the row with the signed-in address, and deletes the row a rotation left behind', async () => {
    let app = await createTestApp()
    try {
      let storage = createSqliteSessionStorage(app.database)
      let anonymous = await storage.read(null)
      anonymous.set('_csrf', 'a')
      let oldId = await storage.save(anonymous)
      assert.ok(typeof oldId === 'string')

      let session = await storage.read(oldId)
      session.regenerateId(true)
      session.set(EDITOR_SESSION_KEY, {
        authorizedUntil: 0,
        displayName: 'Eva',
        email: 'eva@vednemesicnik.test',
      })
      let newId = await storage.save(session)

      let rows = await app.database.exec(sql`SELECT id, email FROM sessions`)
      assert.deepEqual(rows.rows, [{ email: 'eva@vednemesicnik.test', id: newId }])
    } finally {
      await app.close()
    }
  })
})
