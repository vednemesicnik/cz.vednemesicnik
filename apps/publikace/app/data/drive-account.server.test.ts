import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { createTestApp, TEST_DRIVE_ACCOUNT } from '../test-app.server.ts'
import { createDriveAccountStore } from './drive-account.server.ts'

const CONNECTION = {
  by: 'marie@priklad.cz',
  email: TEST_DRIVE_ACCOUNT,
  refreshToken: 'test-refresh-token',
}

describe('the Drive account store', () => {
  it('goes from never connected to connected, keeping the token encrypted', async () => {
    let app = await createTestApp()
    try {
      let store = app.driveAccount
      assert.deepEqual(await store.state(), { status: 'not-connected' })
      assert.equal(await store.refreshToken(now()), null)

      await store.connect({ ...CONNECTION, at: now() })

      let state = await store.state()
      assert.equal(state.status, 'connected')
      assert.equal(await store.refreshToken(now()), 'test-refresh-token')

      let row = await app.database.exec(sql`SELECT refresh_token FROM drive_account`)
      assert.ok(!String(row.rows?.[0]?.['refresh_token']).includes('test-refresh-token'))
    } finally {
      await app.close()
    }
  })

  it('stays disconnected from the first time, and connecting again mends it', async () => {
    let app = await createTestApp()
    try {
      let store = app.driveAccount
      await store.connect({ ...CONNECTION, at: now() })

      await store.markDisconnected(Temporal.Instant.from('2026-11-17T08:00:00Z'))
      await store.markDisconnected(Temporal.Instant.from('2026-11-17T09:00:00Z'))
      let row = await app.database.exec(sql`SELECT disconnected_at FROM drive_account`)
      assert.equal(row.rows?.[0]?.['disconnected_at'], '2026-11-17T08:00:00.000Z')
      assert.equal((await store.state()).status, 'disconnected')
      assert.equal(await store.refreshToken(now()), null)

      await store.connect({ ...CONNECTION, at: now(), refreshToken: 'another-refresh-token' })
      assert.equal((await store.state()).status, 'connected')
      assert.equal(await store.refreshToken(now()), 'another-refresh-token')
    } finally {
      await app.close()
    }
  })

  it('takes a token that no longer decrypts for a revoked one', async () => {
    let app = await createTestApp()
    try {
      await app.driveAccount.connect({ ...CONNECTION, at: now() })

      let withAnotherKey = createDriveAccountStore(app.database, Buffer.alloc(32, 9))
      assert.equal(await withAnotherKey.refreshToken(now()), null)
      assert.equal((await app.driveAccount.state()).status, 'disconnected')
    } finally {
      await app.close()
    }
  })
})
