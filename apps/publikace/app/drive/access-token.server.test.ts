import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { connectDriveAccount, createTestApp } from '../test-app.server.ts'
import { driveAccessToken } from './access-token.server.ts'

const CREDENTIALS = { clientId: 'test-client', clientSecret: 'test-secret' }

function answering(status: number, body: unknown): typeof globalThis.fetch {
  return async () => Response.json(body, { status })
}

describe('the Drive access token', () => {
  it('exchanges the stored refresh token', async () => {
    let app = await createTestApp()
    try {
      await connectDriveAccount(app)
      let sent: URLSearchParams | null = null
      let result = await driveAccessToken({
        credentials: CREDENTIALS,
        fetch: async (_url, init) => {
          sent = init?.body as URLSearchParams
          return Response.json({ access_token: 'test-access-token', expires_in: 3599 })
        },
        store: app.driveAccount,
      })

      assert.equal(result.ok, true)
      assert.equal(result.ok && result.accessToken, 'test-access-token')
      assert.equal((sent as URLSearchParams | null)?.get('refresh_token'), 'test-refresh-token')
      assert.equal((sent as URLSearchParams | null)?.get('grant_type'), 'refresh_token')
    } finally {
      await app.close()
    }
  })

  it('turns the account Odpojeno when Google says invalid_grant (14c)', async () => {
    let app = await createTestApp()
    try {
      await connectDriveAccount(app)
      let result = await driveAccessToken({
        credentials: CREDENTIALS,
        fetch: answering(400, {
          error: 'invalid_grant',
          error_description: 'Token has been revoked.',
        }),
        store: app.driveAccount,
      })

      assert.deepEqual(result, { ok: false, reason: 'disconnected' })
      assert.equal((await app.driveAccount.state()).status, 'disconnected')
    } finally {
      await app.close()
    }
  })

  it('changes nothing when Google is only unavailable', async () => {
    let app = await createTestApp()
    try {
      await connectDriveAccount(app)
      let failing = [
        answering(500, { error: 'internal_failure' }),
        async () => {
          throw new Error('network down')
        },
      ]

      for (let fetch of failing) {
        let result = await driveAccessToken({
          credentials: CREDENTIALS,
          fetch,
          store: app.driveAccount,
        })
        assert.deepEqual(result, { ok: false, reason: 'unavailable' })
      }
      assert.equal((await app.driveAccount.state()).status, 'connected')
    } finally {
      await app.close()
    }
  })

  it('asks nobody while the account is not connected', async () => {
    let app = await createTestApp()
    try {
      let result = await driveAccessToken({
        credentials: CREDENTIALS,
        fetch: async () => {
          throw new Error('must not be called')
        },
        store: app.driveAccount,
      })
      assert.deepEqual(result, { ok: false, reason: 'not-connected' })
    } finally {
      await app.close()
    }
  })
})
