import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { getPendingTwoFactorRedirectTo } from '~/utils/get-pending-two-factor-redirect-to.server'
import { getPendingTwoFactorCookieSession } from '~/utils/pending-two-factor.server'

import { action } from './_action'
import type { Route } from './+types/route'

const { compareMock, findUniqueMock, getUserTwoFactorMock } = vi.hoisted(
  () => ({
    compareMock: vi.fn(),
    findUniqueMock: vi.fn(),
    getUserTwoFactorMock: vi.fn(),
  }),
)

vi.mock('bcryptjs', () => ({ default: { compare: compareMock } }))
vi.mock('~/utils/auth.server', () => ({
  setSessionAuthCookieSession: vi.fn().mockResolvedValue('vdm_auth=session'),
}))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog: vi.fn() }))
vi.mock('~/utils/db.server', () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/session.server', () => ({
  createSession: vi.fn().mockResolvedValue({
    expirationDate: new Date(),
    id: 'session-1',
  }),
}))
vi.mock('~/utils/two-factor.server', () => ({
  getUserTwoFactor: getUserTwoFactorMock,
}))

const TARGET = '/administration/settings?continue=change-password'

const runAction = async (redirectTo?: string) => {
  const formData = new FormData()
  formData.append('email', 'user@vednemesicnik.cz')
  formData.append('password', 'correct-password')
  if (redirectTo !== undefined) formData.append('redirectTo', redirectTo)

  const request = new Request(
    'https://test.local/administration/sign-in/password',
    { body: formData, method: 'POST' },
  )
  // No rate limit hit: the middleware leaves the context value unset.
  const context = { get: () => undefined }

  try {
    await action({
      context,
      params: {},
      request,
    } as unknown as Route.ActionArgs)
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }

  throw new Error('Expected the action to throw a redirect.')
}

beforeEach(() => {
  vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'true')
  findUniqueMock.mockResolvedValue({ id: 'user-1', password: { hash: 'hash' } })
  compareMock.mockResolvedValue(true)
  getUserTwoFactorMock.mockResolvedValue(null)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('password sign-in action', () => {
  test('returns to redirectTo after a password sign-in', async () => {
    const response = await runAction(TARGET)

    expect(response.headers.get('Location')).toBe(TARGET)
  })

  test.each([
    ['an external URL', 'https://evil.com'],
    ['a protocol-relative URL', '//evil.com'],
    ['an empty value', ''],
    ['no value', undefined],
  ])('falls back to /administration for %s', async (_label, redirectTo) => {
    const response = await runAction(redirectTo)

    expect(response.headers.get('Location')).toBe('/administration')
  })

  test('keeps redirectTo in the pending cookie when 2FA is enrolled', async () => {
    getUserTwoFactorMock.mockResolvedValue({ secret: 'secret' })

    const response = await runAction(TARGET)

    expect(response.headers.get('Location')).toBe(
      '/administration/sign-in/verify-2fa',
    )

    const cookieSession = await getPendingTwoFactorCookieSession(
      new Request('https://test.local/', {
        headers: { Cookie: response.headers.get('Set-Cookie') ?? '' },
      }),
    )
    expect(getPendingTwoFactorRedirectTo(cookieSession)).toBe(TARGET)
  })

  test('keeps redirectTo on the way back to the chooser when disabled', async () => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'false')

    const response = await runAction(TARGET)

    expect(response.headers.get('Location')).toBe(
      `/administration/sign-in?${new URLSearchParams({ redirectTo: TARGET })}`,
    )
  })
})
