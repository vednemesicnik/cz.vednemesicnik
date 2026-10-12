import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { findEmergencySignInLink, getAuthentication } = vi.hoisted(() => ({
  findEmergencySignInLink: vi.fn(),
  getAuthentication: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({ getAuthentication }))
vi.mock(
  '~/utils/emergency-sign-in-link/find-emergency-sign-in-link.server',
  () => ({ findEmergencySignInLink }),
)
vi.mock('~/utils/emergency-sign-in-link/get-user-author-names.server', () => ({
  getUserAuthorNames: async () => new Map([['admin', 'Petr Dvořák']]),
}))

import { loader } from './_loader'

type LoaderResult = { data: { status: string; issuerName?: string | null } }

const open = async (token = 'token') =>
  (await loader({
    request: new Request(
      `https://test.local/administration/sign-in/emergency-link/verify?token=${token}`,
    ),
  } as Parameters<typeof loader>[0])) as unknown as LoaderResult

const link = {
  email: 'jakub.novak@vednemesicnik.cz',
  id: 'link',
  issuedById: 'admin',
  isValid: true,
  userId: 'member',
}

describe('emergency link page', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'true')
    getAuthentication.mockResolvedValue({ userId: undefined })
    findEmergencySignInLink.mockResolvedValue(link)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  test('with the switch off, shows the invalid card without looking the token up', async () => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', '')

    expect((await open()).data.status).toBe('invalid')
    expect(findEmergencySignInLink).not.toHaveBeenCalled()
  })

  test('asks to confirm a valid link and names its issuer', async () => {
    expect((await open()).data).toMatchObject({
      issuerName: 'Petr Dvořák',
      status: 'valid',
    })
  })

  test('shows the invalid card for a used, replaced or expired link', async () => {
    findEmergencySignInLink.mockResolvedValue({ ...link, isValid: false })

    expect((await open()).data.status).toBe('invalid')
  })

  test('a signed-in browser of the same account has nothing to confirm', async () => {
    getAuthentication.mockResolvedValue({ userId: 'member' })

    expect((await open()).data.status).toBe('same-account')
  })

  test('a signed-in browser of another account is offered to sign out', async () => {
    getAuthentication.mockResolvedValue({ userId: 'admin' })

    expect((await open()).data.status).toBe('other-account')
  })
})
