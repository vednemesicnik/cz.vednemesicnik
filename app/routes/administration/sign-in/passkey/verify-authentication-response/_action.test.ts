import { redirect } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { rateLimitContext } from '~/utils/rate-limit.server'

import { action } from './_action'
import type { Route } from './+types/route'

const { recordAuthLogMock, requireUnauthenticatedMock, verifyMock } =
  vi.hoisted(() => ({
    recordAuthLogMock: vi.fn(),
    requireUnauthenticatedMock: vi.fn(),
    verifyMock: vi.fn(),
  }))

vi.mock('~/utils/auth.server', () => ({
  requireUnauthenticated: requireUnauthenticatedMock,
}))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog: recordAuthLogMock }))
vi.mock('~/utils/biometric.server', () => ({
  deleteBiometricCookieSession: vi.fn().mockResolvedValue('vdm_biometric='),
  getBiometricChallenge: vi.fn().mockReturnValue('challenge'),
  getBiometricCookieSession: vi.fn().mockResolvedValue({}),
  getBiometricRedirectTo: vi.fn().mockReturnValue('/administration'),
}))
vi.mock('~/utils/passkey/verify-passkey-assertion.server', () => ({
  verifyPasskeyAssertion: verifyMock,
}))
vi.mock('~/utils/sign-in.server', () => ({ signInUser: vi.fn() }))

type ActionResult = { data: unknown; init: ResponseInit | null }

const runAction = async ({
  body = '{}',
  retryAfter,
}: {
  body?: string
  retryAfter?: number
} = {}) => {
  const request = new Request(
    'https://test.local/administration/sign-in/passkey/verify-authentication-response',
    { body, method: 'POST' },
  )
  const context = {
    get: (key: unknown) =>
      key === rateLimitContext && retryAfter !== undefined
        ? { retryAfter }
        : null,
  }

  return (await action({
    context,
    params: {},
    request,
  } as unknown as Route.ActionArgs)) as unknown as ActionResult
}

beforeEach(() => {
  vi.clearAllMocks()
  requireUnauthenticatedMock.mockResolvedValue({ isAuthenticated: false })
  verifyMock.mockResolvedValue({ status: 'failed', userId: null })
})

describe('passkey sign-in verification', () => {
  test('sends a signed-in browser to the administration without verifying', async () => {
    requireUnauthenticatedMock.mockRejectedValue(redirect('/administration'))

    await expect(runAction()).rejects.toMatchObject({ status: 302 })
    expect(verifyMock).not.toHaveBeenCalled()
  })

  test('returns 429 with the wait when rate limited, without verifying', async () => {
    const result = await runAction({ retryAfter: 120 })

    expect(result.init?.status).toBe(429)
    expect(result.data).toEqual({ retryAfter: 120, status: 'rate-limited' })
    expect(verifyMock).not.toHaveBeenCalled()
  })

  test('returns 400 and logs the failure for a bad assertion', async () => {
    const result = await runAction()

    expect(result.init?.status).toBe(400)
    expect(result.data).toEqual({ status: 'failed' })
    expect(recordAuthLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'sign_in_failure', method: 'passkey' }),
    )
  })

  test('fails unparsable JSON like a bad assertion', async () => {
    const result = await runAction({ body: 'not json' })

    expect(verifyMock).toHaveBeenCalledWith(
      expect.objectContaining({ response: null }),
    )
    expect(result.init?.status).toBe(400)
  })
})
