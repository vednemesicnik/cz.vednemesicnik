import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const {
  consumeEmergencySignInLink,
  findEmergencySignInLink,
  getAuthentication,
  recordAuthLog,
  signInUser,
} = vi.hoisted(() => ({
  consumeEmergencySignInLink: vi.fn(),
  findEmergencySignInLink: vi.fn(),
  getAuthentication: vi.fn(),
  recordAuthLog: vi.fn(),
  signInUser: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  deleteSessionAuthCookieSession: vi.fn().mockResolvedValue('vdm_auth='),
  getAuthentication,
  getSessionAuthCookieSession: vi.fn().mockResolvedValue({}),
}))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog }))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock(
  '~/utils/emergency-sign-in-link/consume-emergency-sign-in-link.server',
  () => ({ consumeEmergencySignInLink }),
)
vi.mock(
  '~/utils/emergency-sign-in-link/find-emergency-sign-in-link.server',
  () => ({ findEmergencySignInLink }),
)
vi.mock('~/routes/administration/sign-out/utils/delete-session.server', () => ({
  deleteSession: vi.fn(),
}))
vi.mock('~/utils/sign-in.server', () => ({ signInUser }))

import { action } from './_action'

const confirm = async (fields: Record<string, string> = { token: 'token' }) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)

  try {
    return await action({
      request: new Request(
        'https://test.local/administration/sign-in/emergency-link/verify?token=token',
        { body, method: 'POST' },
      ),
    } as Parameters<typeof action>[0])
  } catch (thrown) {
    return thrown
  }
}

const link = {
  email: 'jakub.novak@vednemesicnik.cz',
  id: 'link',
  issuedById: 'admin',
  isValid: true,
  userId: 'member',
}

describe('emergency link confirmation', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'true')
    getAuthentication.mockResolvedValue({
      sessionId: undefined,
      userId: undefined,
    })
    findEmergencySignInLink.mockResolvedValue(link)
    consumeEmergencySignInLink.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  test('with the switch off, a link issued earlier does not sign in', async () => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', '')

    expect(await confirm()).toMatchObject({ data: { status: 'invalid' } })
    expect(findEmergencySignInLink).not.toHaveBeenCalled()
    expect(signInUser).not.toHaveBeenCalled()
  })

  test('signs in once confirmed, tied to the link, into Nastavení', async () => {
    await confirm()

    expect(signInUser).toHaveBeenCalledWith(
      expect.any(Request),
      'member',
      'emergency_link',
      { emergencySignInLinkId: 'link', redirectTo: '/administration/settings' },
    )
  })

  test('a signed-in browser does not consume the link', async () => {
    getAuthentication.mockResolvedValue({
      sessionId: 'session',
      userId: 'admin',
    })

    const response = (await confirm()) as Response

    expect(response.status).toBe(303)
    expect(consumeEmergencySignInLink).not.toHaveBeenCalled()
    expect(signInUser).not.toHaveBeenCalled()
  })

  test('a used, replaced or expired link logs a failure for its account', async () => {
    consumeEmergencySignInLink.mockResolvedValue(false)

    expect(await confirm()).toMatchObject({ data: { status: 'invalid' } })
    expect(recordAuthLog).toHaveBeenCalledWith(
      expect.objectContaining({
        emergencySignInLinkId: 'link',
        event: 'sign_in_failure',
        method: 'emergency_link',
        userId: 'member',
      }),
    )
    expect(signInUser).not.toHaveBeenCalled()
  })

  test('an unknown token is not logged', async () => {
    findEmergencySignInLink.mockResolvedValue(null)

    expect(await confirm()).toMatchObject({ data: { status: 'invalid' } })
    expect(recordAuthLog).not.toHaveBeenCalled()
  })

  test('signing out the other account leads back to the link, unused', async () => {
    getAuthentication.mockResolvedValue({
      sessionId: 'session',
      userId: 'admin',
    })

    const response = (await confirm({
      intent: 'sign-out',
      token: 'token',
    })) as Response

    expect(response.headers.get('Location')).toBe(
      '/administration/sign-in/emergency-link/verify?token=token',
    )
    expect(response.headers.get('Set-Cookie')).toBe('vdm_auth=')
    expect(consumeEmergencySignInLink).not.toHaveBeenCalled()
  })
})
