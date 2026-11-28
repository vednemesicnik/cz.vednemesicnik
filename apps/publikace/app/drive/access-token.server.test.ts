import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { connectDriveAccount, createTestApp, type TestApp } from '../test-app.server.ts'
import { createDriveToken, type DriveTokenOptions } from './access-token.server.ts'

const CREDENTIALS = { clientId: 'test-client', clientSecret: 'test-secret' }
const DRIVE_FILE = 'https://www.googleapis.com/drive/v3/files/d-1'

function answering(status: number, body: unknown): typeof globalThis.fetch {
  return async () => Response.json(body, { status })
}

/** Google's token endpoint answering a new token on every request, counted. */
function tokenEndpoint(expiresIn = 3599) {
  let requests: URLSearchParams[] = []
  let fetch: typeof globalThis.fetch = async (_url, init) => {
    requests.push(init?.body as URLSearchParams)
    return Response.json({ access_token: `access-${requests.length}`, expires_in: expiresIn })
  }
  return { fetch, requests }
}

function tokenOf(app: TestApp, options: Partial<DriveTokenOptions>) {
  return createDriveToken({ credentials: CREDENTIALS, store: app.driveAccount, ...options })
}

async function withConnectedApp(run: (app: TestApp) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await connectDriveAccount(app)
    await run(app)
  } finally {
    await app.close()
  }
}

describe('the Drive access token', () => {
  it('exchanges the stored refresh token', async () => {
    await withConnectedApp(async (app) => {
      let google = tokenEndpoint()
      let result = await tokenOf(app, { fetch: google.fetch }).token()

      assert.equal(result.ok, true)
      assert.equal(result.ok && result.accessToken, 'access-1')
      assert.equal(google.requests[0]?.get('refresh_token'), 'test-refresh-token')
      assert.equal(google.requests[0]?.get('grant_type'), 'refresh_token')
    })
  })

  it('keeps the token for the next call, one request for both', async () => {
    await withConnectedApp(async (app) => {
      let google = tokenEndpoint()
      let drive = tokenOf(app, { fetch: google.fetch })
      let first = await drive.token()
      let second = await drive.token()

      assert.equal(google.requests.length, 1)
      assert.equal(second.ok && second.accessToken, first.ok && first.accessToken)
    })
  })

  it('asks again five minutes before Google’s expiry, and not a moment sooner', async () => {
    await withConnectedApp(async (app) => {
      let start = now()
      let at = start
      let google = tokenEndpoint(3600)
      let drive = tokenOf(app, { fetch: google.fetch, now: () => at })
      await drive.token()

      at = start.add({ minutes: 54, seconds: 59 })
      await drive.token()
      assert.equal(google.requests.length, 1)

      at = start.add({ minutes: 55 })
      let renewed = await drive.token()
      assert.equal(google.requests.length, 2)
      assert.equal(renewed.ok && renewed.accessToken, 'access-2')
    })
  })

  it('shares one refresh among callers that ask at once', async () => {
    await withConnectedApp(async (app) => {
      let requests = 0
      let answer: (response: Response) => void = () => {}
      let drive = tokenOf(app, {
        fetch: () => {
          requests += 1
          return new Promise((resolve) => (answer = resolve))
        },
      })
      let both = Promise.all([drive.token(), drive.token()])
      while (requests === 0) await new Promise((resolve) => setTimeout(resolve, 1))
      answer(Response.json({ access_token: 'shared', expires_in: 3599 }))
      let [first, second] = await both

      assert.equal(requests, 1)
      assert.equal(first.ok && first.accessToken, 'shared')
      assert.equal(second.ok && second.accessToken, 'shared')
    })
  })

  it('gives up on a token request that does not answer in time, and changes nothing', async () => {
    await withConnectedApp(async (app) => {
      let drive = tokenOf(app, {
        fetch: (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
          }),
        timeoutMs: 10,
      })

      /* `AbortSignal.timeout` does not keep the process alive, and nothing else in a test does. */
      let keepAlive = setTimeout(() => {}, 1_000)
      try {
        assert.deepEqual(await drive.token(), { ok: false, reason: 'unavailable' })
      } finally {
        clearTimeout(keepAlive)
      }
      assert.equal((await app.driveAccount.state()).status, 'connected')
    })
  })

  it('turns the account Odpojeno when Google says invalid_grant (14c)', async () => {
    await withConnectedApp(async (app) => {
      let requests = 0
      let drive = tokenOf(app, {
        fetch: async () => {
          requests += 1
          return Response.json(
            { error: 'invalid_grant', error_description: 'Token has been revoked.' },
            { status: 400 },
          )
        },
      })

      assert.deepEqual(await drive.token(), { ok: false, reason: 'disconnected' })
      assert.equal((await app.driveAccount.state()).status, 'disconnected')
      assert.deepEqual(await drive.token(), { ok: false, reason: 'disconnected' })
      assert.equal(requests, 1)
    })
  })

  it('drops the kept token once the account is Odpojeno, and asks again once it is connected', async () => {
    await withConnectedApp(async (app) => {
      let google = tokenEndpoint()
      let drive = tokenOf(app, { fetch: google.fetch })
      await drive.token()

      await app.driveAccount.markDisconnected(now())
      assert.deepEqual(await drive.token(), { ok: false, reason: 'disconnected' })
      assert.equal(google.requests.length, 1)

      await app.driveAccount.connect({
        at: now(),
        by: 'marie@vednemesicnik.test',
        email: 'publikace.app@vednemesicnik.test',
        refreshToken: 'test-refresh-token-2',
      })
      let reconnected = await drive.token()
      assert.equal(google.requests.length, 2)
      assert.equal(google.requests[1]?.get('refresh_token'), 'test-refresh-token-2')
      assert.equal(reconnected.ok && reconnected.accessToken, 'access-2')
    })
  })

  it('drops the kept token when Drive answers 401 to it, and only to it', async () => {
    await withConnectedApp(async (app) => {
      let google = tokenEndpoint()
      let drive = tokenOf(app, {
        fetch: async (url, init) =>
          String(url) === DRIVE_FILE
            ? new Response(null, { status: 401 })
            : google.fetch(url, init),
      })
      await drive.token()

      await drive.fetch(DRIVE_FILE, { headers: { Authorization: 'Bearer an-older-token' } })
      await drive.token()
      assert.equal(google.requests.length, 1)

      await drive.fetch(DRIVE_FILE, { headers: { Authorization: 'Bearer access-1' } })
      let renewed = await drive.token()
      assert.equal(google.requests.length, 2)
      assert.equal(renewed.ok && renewed.accessToken, 'access-2')
    })
  })

  it('reaches Odpojeno on the call after Drive refused a revoked grant’s token', async () => {
    await withConnectedApp(async (app) => {
      let isRevoked = false
      let drive = tokenOf(app, {
        fetch: async (url) => {
          if (String(url) === DRIVE_FILE) return new Response(null, { status: 401 })
          return isRevoked
            ? Response.json({ error: 'invalid_grant' }, { status: 400 })
            : Response.json({ access_token: 'kept', expires_in: 3599 })
        },
      })
      await drive.token()
      isRevoked = true

      await drive.fetch(DRIVE_FILE, { headers: { Authorization: 'Bearer kept' } })
      assert.deepEqual(await drive.token(), { ok: false, reason: 'disconnected' })
      assert.equal((await app.driveAccount.state()).status, 'disconnected')
    })
  })

  it('changes nothing when Google is only unavailable', async () => {
    await withConnectedApp(async (app) => {
      let failing = [
        answering(500, { error: 'internal_failure' }),
        async () => {
          throw new Error('network down')
        },
      ]

      for (let fetch of failing) {
        assert.deepEqual(await tokenOf(app, { fetch }).token(), {
          ok: false,
          reason: 'unavailable',
        })
      }
      assert.equal((await app.driveAccount.state()).status, 'connected')
    })
  })

  it('asks nobody while the account is not connected', async () => {
    let app = await createTestApp()
    try {
      let result = await tokenOf(app, {
        fetch: async () => {
          throw new Error('must not be called')
        },
      }).token()
      assert.deepEqual(result, { ok: false, reason: 'not-connected' })
    } finally {
      await app.close()
    }
  })
})
