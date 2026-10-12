import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { rateLimitContext } from '~/utils/rate-limit.server'
import { readSignInNotice } from '~/utils/sign-in-notice/read-sign-in-notice.server'

const { createMagicLinkToken, findExistingUserByEmail, sendMagicLinkEmail } =
  vi.hoisted(() => ({
    createMagicLinkToken: vi.fn(),
    findExistingUserByEmail: vi.fn(),
    sendMagicLinkEmail: vi.fn(),
  }))

vi.mock('~/utils/auth.server', () => ({
  requireUnauthenticated: vi.fn(),
}))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/magic-link.server', () => ({ createMagicLinkToken }))
vi.mock('~/utils/send-magic-link-email.server', () => ({
  sendMagicLinkEmail,
}))
vi.mock('~/utils/sign-in.server', () => ({ findExistingUserByEmail }))

import { action } from './_action'
import type { Route } from './+types/route'

const CHOOSER = '/administration/sign-in'
const SENT = '/administration/sign-in/magic-link'

const request = async ({
  email,
  redirectTo,
  retryAfter,
}: {
  email: string
  redirectTo?: string
  retryAfter?: number
}) => {
  const body = new FormData()
  body.append('email', email)
  if (redirectTo !== undefined) body.append('redirectTo', redirectTo)

  const context = {
    get: (key: unknown) =>
      key === rateLimitContext && retryAfter !== undefined
        ? { retryAfter }
        : undefined,
  }

  try {
    await action({
      context,
      params: {},
      request: new Request(`https://test.local${SENT}`, {
        body,
        method: 'POST',
      }),
    } as unknown as Route.ActionArgs)
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }

  throw new Error('Expected a redirect.')
}

const readNotice = async (response: Response) => {
  const { notice } = await readSignInNotice(
    new Request('https://test.local/', {
      headers: {
        Cookie: response.headers.get('Set-Cookie')?.split(';')[0] ?? '',
      },
    }),
  )

  return notice
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('BASE_URL', 'https://test.local')
  createMagicLinkToken.mockResolvedValue('token')
  findExistingUserByEmail.mockResolvedValue({ id: 'user-1' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('magic-link request', () => {
  test('sends a link to an existing account and shows the sent state', async () => {
    const response = await request({ email: 'Jakub.Novak@vednemesicnik.cz' })

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(SENT)
    expect(sendMagicLinkEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jakub.novak@vednemesicnik.cz' }),
    )
    expect(await readNotice(response)).toEqual({
      email: 'jakub.novak@vednemesicnik.cz',
      kind: 'magic-link-sent',
    })
  })

  test('answers an unknown account the same, without sending', async () => {
    findExistingUserByEmail.mockResolvedValue(null)

    const response = await request({ email: 'nikdo@vednemesicnik.cz' })

    expect(response.headers.get('Location')).toBe(SENT)
    expect(sendMagicLinkEmail).not.toHaveBeenCalled()
    expect((await readNotice(response))?.kind).toBe('magic-link-sent')
  })

  test('keeps the landing page through the sent state', async () => {
    const response = await request({
      email: 'jakub.novak@vednemesicnik.cz',
      redirectTo: '/administration/settings',
    })

    expect(response.headers.get('Location')).toBe(
      `${SENT}?${new URLSearchParams({ redirectTo: '/administration/settings' })}`,
    )
  })

  test('sends another domain back to the field, without sending', async () => {
    const response = await request({ email: 'jakub.novak@priklad.cz' })

    expect(response.headers.get('Location')).toBe(CHOOSER)
    expect(findExistingUserByEmail).not.toHaveBeenCalled()
    expect(sendMagicLinkEmail).not.toHaveBeenCalled()

    const notice = await readNotice(response)
    expect(
      notice?.kind === 'magic-link-rejected' && notice.submissionResult,
    ).toMatchObject({
      error: {
        email: [
          'Zadejte adresu @vednemesicnik.cz — jinou adresou se přihlásit nelze.',
        ],
      },
    })
  })

  test('says the rate limit at the field, without sending', async () => {
    const response = await request({
      email: 'jakub.novak@vednemesicnik.cz',
      retryAfter: 720,
    })

    expect(response.headers.get('Location')).toBe(CHOOSER)
    expect(sendMagicLinkEmail).not.toHaveBeenCalled()

    const notice = await readNotice(response)
    expect(
      notice?.kind === 'magic-link-rejected' && notice.submissionResult,
    ).toMatchObject({
      error: {
        email: [
          'Zkuste si odkaz poslat za 12 minut — limit odesílání byl vyčerpán.',
        ],
      },
    })
  })
})
