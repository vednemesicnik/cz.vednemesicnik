import { beforeEach, describe, expect, test, vi } from 'vitest'

const {
  consumeMagicLinkToken,
  findExistingUserByEmail,
  getAuthentication,
  signInUser,
} = vi.hoisted(() => ({
  consumeMagicLinkToken: vi.fn(),
  findExistingUserByEmail: vi.fn(),
  getAuthentication: vi.fn(),
  signInUser: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({ getAuthentication }))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog: vi.fn() }))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/magic-link.server', () => ({ consumeMagicLinkToken }))
vi.mock('~/utils/sign-in.server', () => ({
  findExistingUserByEmail,
  signInUser,
}))
vi.mock('./utils/verify-identity-with-link.server', () => ({
  verifyIdentityWithLink: vi.fn(),
}))

import { action } from './_action'
import type { Route } from './+types/route'

const EMAIL = 'jakub.novak@vednemesicnik.cz'

const confirm = async (redirectTo?: string) => {
  const body = new FormData()
  body.append('token', 'token')
  body.append('email', EMAIL)
  if (redirectTo !== undefined) body.append('redirectTo', redirectTo)

  try {
    return await action({
      params: {},
      request: new Request(
        'https://test.local/administration/sign-in/magic-link/verify',
        { body, method: 'POST' },
      ),
    } as unknown as Route.ActionArgs)
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}

const getLocation = (result: unknown) =>
  result instanceof Response ? result.headers.get('Location') : null

beforeEach(() => {
  vi.clearAllMocks()
  getAuthentication.mockResolvedValue({})
  consumeMagicLinkToken.mockResolvedValue(true)
  findExistingUserByEmail.mockResolvedValue({ id: 'user-1' })
})

describe('magic-link confirmation', () => {
  test('signs in with a valid link', async () => {
    await confirm()

    expect(signInUser).toHaveBeenCalledWith(
      expect.any(Request),
      'user-1',
      'magic_link',
      { redirectTo: '/administration' },
    )
  })

  test('goes back to the link, now invalid, when it was used or expired', async () => {
    consumeMagicLinkToken.mockResolvedValue(false)

    const location = new URL(
      getLocation(await confirm('/administration/settings')) ?? '',
      'https://test.local',
    )

    expect(location.pathname).toBe('/administration/sign-in/magic-link/verify')
    expect(location.searchParams.get('token')).toBe('token')
    expect(location.searchParams.get('email')).toBe(EMAIL)
    expect(location.searchParams.get('redirectTo')).toBe(
      '/administration/settings',
    )
    expect(signInUser).not.toHaveBeenCalled()
  })

  test('sends a removed account to the chooser with the account error', async () => {
    findExistingUserByEmail.mockResolvedValue(null)

    const location = new URL(
      getLocation(await confirm('/administration/settings')) ?? '',
      'https://test.local',
    )

    expect(location.pathname).toBe('/administration/sign-in')
    expect(location.searchParams.get('error')).toBe('account')
    expect(location.searchParams.get('redirectTo')).toBe(
      '/administration/settings',
    )
    expect(signInUser).not.toHaveBeenCalled()
  })
})
