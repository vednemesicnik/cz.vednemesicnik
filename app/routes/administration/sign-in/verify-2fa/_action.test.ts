import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getPendingTwoFactorRedirectTo } from '~/utils/get-pending-two-factor-redirect-to.server'
import {
  getPendingTwoFactorAttempts,
  getPendingTwoFactorCookieSession,
  MAX_TWO_FACTOR_ATTEMPTS,
  setPendingTwoFactorCookieSession,
} from '~/utils/pending-two-factor.server'

import { action } from './_action'
import type { Route } from './+types/route'

const { redeemBackupCodeMock, verifyTOTPMock } = vi.hoisted(() => ({
  redeemBackupCodeMock: vi.fn(),
  verifyTOTPMock: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  setSessionAuthCookieSession: vi.fn().mockResolvedValue('vdm_auth=session'),
}))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog: vi.fn() }))
vi.mock('~/utils/backup-codes.server', () => ({
  redeemBackupCode: redeemBackupCodeMock,
}))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/session.server', () => ({
  createSession: vi.fn().mockResolvedValue({
    expirationDate: new Date(),
    id: 'session-1',
  }),
}))
vi.mock('~/utils/totp.server', () => ({ verifyTOTP: verifyTOTPMock }))
vi.mock('~/utils/two-factor.server', () => ({
  getUserTwoFactor: vi.fn().mockResolvedValue({ secret: 'secret' }),
}))

const TARGET = '/administration/settings?continue=change-password'
const PASSWORD_STEP = '/administration/sign-in/password'

const createPendingCookie = (attempts = 0) =>
  setPendingTwoFactorCookieSession(new Request('https://test.local/'), {
    attempts,
    redirectTo: TARGET,
    userId: 'user-1',
  })

const readPendingCookie = (setCookie: string | null) =>
  getPendingTwoFactorCookieSession(
    new Request('https://test.local/', {
      headers: { Cookie: setCookie ?? '' },
    }),
  )

const runAction = async (
  fields: Record<string, string>,
  pendingCookie?: string,
) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value)
  }

  const request = new Request(
    'https://test.local/administration/sign-in/verify-2fa',
    {
      body: formData,
      headers: pendingCookie === undefined ? {} : { Cookie: pendingCookie },
      method: 'POST',
    },
  )
  // No rate limit hit: the middleware leaves the context value unset.
  const context = { get: () => undefined }

  try {
    return await action({
      context,
      params: {},
      request,
    } as unknown as Route.ActionArgs)
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}

const getLocation = (result: Awaited<ReturnType<typeof runAction>>) =>
  result instanceof Response ? result.headers.get('Location') : null

beforeEach(() => {
  vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'true')
  verifyTOTPMock.mockResolvedValue({ delta: 0 })
  redeemBackupCodeMock.mockResolvedValue(true)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('verify-2fa action', () => {
  test('returns to redirectTo after a correct TOTP', async () => {
    const result = await runAction(
      { code: '123456' },
      await createPendingCookie(),
    )

    expect(getLocation(result)).toBe(TARGET)
  })

  test('returns to redirectTo after a backup code', async () => {
    const result = await runAction(
      { backupCode: 'k7m2-9xqp' },
      await createPendingCookie(),
    )

    expect(getLocation(result)).toBe(TARGET)
  })

  test('restarts at the password step without a pending sign-in', async () => {
    const result = await runAction({ code: '123456' })

    expect(getLocation(result)).toBe(PASSWORD_STEP)
  })

  test('keeps redirectTo when the attempt cap restarts the sign-in', async () => {
    verifyTOTPMock.mockResolvedValue(null)

    const result = await runAction(
      { code: '123456' },
      await createPendingCookie(MAX_TWO_FACTOR_ATTEMPTS - 1),
    )

    expect(getLocation(result)).toBe(
      `${PASSWORD_STEP}?${new URLSearchParams({ redirectTo: TARGET })}`,
    )
  })

  test('keeps redirectTo in the cookie after a wrong code under the cap', async () => {
    verifyTOTPMock.mockResolvedValue(null)

    const result = await runAction(
      { code: '123456' },
      await createPendingCookie(),
    )

    // A wrong code under the cap returns the form with a refreshed cookie.
    if (result instanceof Response) throw new Error('Expected form data.')
    const setCookie = new Headers(result.init?.headers).get('Set-Cookie')
    const cookieSession = await readPendingCookie(setCookie)

    expect(getPendingTwoFactorAttempts(cookieSession)).toBe(1)
    expect(getPendingTwoFactorRedirectTo(cookieSession)).toBe(TARGET)
  })
})
