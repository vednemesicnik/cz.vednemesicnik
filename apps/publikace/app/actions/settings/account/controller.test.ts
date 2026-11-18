import * as assert from 'remix/assert'
import { Session } from 'remix/session'
import { describe, it } from 'remix/test'

import { DRIVE_SCOPE } from '../../../domain/drive-account.ts'
import { DriveAccount } from '../../../middleware/drive-account.server.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  TEST_DRIVE_ACCOUNT,
  type TestApp,
} from '../../../test-app.server.ts'
import { completeDriveConnection } from './controller.tsx'

const EDITOR = { displayName: 'Marie Horáková', email: 'marie@priklad.cz', isAdmin: true }

/** The context the return from Google sees, with a session that records what it was left. */
function returnContext(app: TestApp) {
  let flashed = new Map<string, unknown>()
  let session = {
    flash: (key: string, value: unknown) => flashed.set(key, value),
    get: () => undefined,
    unset: () => {},
  }
  let context = {
    get(key: unknown): unknown {
      if (key === DriveAccount)
        return { expectedEmail: TEST_DRIVE_ACCOUNT, store: app.driveAccount }
      if (key === Session) return session
      return undefined
    },
  }
  return { context, flashed }
}

const GOOD_CLAIMS = { email: TEST_DRIVE_ACCOUNT, email_verified: true }
const GOOD_SCOPES = ['openid', 'email', DRIVE_SCOPE]

describe('connecting publikace.app@, the return from Google (14h)', () => {
  it('stores the account, says so in a toast and lands on the card', async () => {
    let app = await createTestApp()
    try {
      let { context, flashed } = returnContext(app)
      let response = await completeDriveConnection(context, EDITOR, {
        claims: GOOD_CLAIMS,
        refreshToken: 'test-refresh-token',
        scopes: GOOD_SCOPES,
      })

      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/settings#accounts')
      assert.equal((await app.driveAccount.state()).status, 'connected')
      assert.equal(
        await app.driveAccount.refreshToken(Temporal.Now.instant()),
        'test-refresh-token',
      )
      assert.ok([...flashed.values()].includes('Účet publikace.app@ je připojený.'))
    } finally {
      await app.close()
    }
  })

  it('refuses another account and leaves a connected one as it was', async () => {
    let app = await createTestApp()
    try {
      await connectDriveAccount(app)
      let { context, flashed } = returnContext(app)
      await completeDriveConnection(context, EDITOR, {
        claims: { email: 'jan.novak@priklad.cz', email_verified: true },
        refreshToken: 'someone-elses-token',
        scopes: GOOD_SCOPES,
      })

      assert.equal(
        await app.driveAccount.refreshToken(Temporal.Now.instant()),
        'test-refresh-token',
      )
      assert.deepEqual(
        [...flashed.values()],
        [{ email: 'jan.novak@priklad.cz', reason: 'wrong-account' }],
      )
    } finally {
      await app.close()
    }
  })

  it('refuses the account without Drive or without a refresh token, storing nothing', async () => {
    let app = await createTestApp()
    try {
      let noScope = returnContext(app)
      await completeDriveConnection(noScope.context, EDITOR, {
        claims: GOOD_CLAIMS,
        refreshToken: 'test-refresh-token',
        scopes: ['openid', 'email'],
      })
      assert.deepEqual([...noScope.flashed.values()], [{ reason: 'no-drive-scope' }])

      let noToken = returnContext(app)
      await completeDriveConnection(noToken.context, EDITOR, {
        claims: GOOD_CLAIMS,
        refreshToken: undefined,
        scopes: GOOD_SCOPES,
      })
      assert.deepEqual([...noToken.flashed.values()], [{ reason: 'failed' }])

      assert.deepEqual(await app.driveAccount.state(), { status: 'not-connected' })
    } finally {
      await app.close()
    }
  })
})

describe('connecting publikace.app@, the routes', () => {
  it('sends an expired sign-in at the return from Google back to Settings', async () => {
    let app = await createTestApp()
    try {
      let response = await app.browser().get('/settings/account/callback?code=x&state=y')
      assert.equal(response.status, 303)
      assert.equal(response.headers.get('Location'), '/sign-in?redirectTo=%2Fsettings')
    } finally {
      await app.close()
    }
  })

  it('refuses a connect form sent without the token', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@priklad.cz')
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz')
      let response = await browser.post('/settings/account/connect', { _csrf: 'forged' })
      assert.equal(response.status, 403)
    } finally {
      await app.close()
    }
  })

  it('without a Google client, comes back to the card with try again, once', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, 'marie@priklad.cz')
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz')

      let response = await browser.post('/settings/account/connect', {})
      assert.equal(response.headers.get('Location'), '/settings#accounts')

      let first = await (await browser.get('/settings')).text()
      assert.ok(first.includes('Zkuste účet připojit znovu.'))
      let second = await (await browser.get('/settings')).text()
      assert.ok(!second.includes('Zkuste účet připojit znovu.'))
    } finally {
      await app.close()
    }
  })
})

describe('connecting publikace.app@, the way to Google', () => {
  it('asks for Drive, offline, with consent and publikace.app@ offered first', async () => {
    let app = await createTestApp()
    process.env.GOOGLE_CLIENT_ID = 'test-client'
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret'
    try {
      await seedAdmin(app, 'marie@priklad.cz')
      let browser = app.browser()
      await browser.signInAs('marie@priklad.cz')
      let response = await browser.post('/settings/account/connect', {})
      let location = new URL(response.headers.get('Location') ?? '')

      assert.equal(location.host, 'accounts.google.com')
      assert.equal(location.searchParams.get('login_hint'), TEST_DRIVE_ACCOUNT)
      assert.equal(location.searchParams.get('hd'), 'priklad.cz')
      assert.equal(location.searchParams.get('access_type'), 'offline')
      assert.equal(location.searchParams.get('prompt'), 'consent')
      assert.equal(location.searchParams.get('scope'), `openid email ${DRIVE_SCOPE}`)
      assert.equal(
        location.searchParams.get('redirect_uri'),
        'http://localhost:44100/settings/account/callback',
      )
    } finally {
      delete process.env.GOOGLE_CLIENT_ID
      delete process.env.GOOGLE_CLIENT_SECRET
      await app.close()
    }
  })
})
