import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { rateLimitContext } from '~/utils/rate-limit.server'
import { readSignInNotice } from '~/utils/sign-in-notice/read-sign-in-notice.server'

const { issueSignInLink } = vi.hoisted(() => ({ issueSignInLink: vi.fn() }))

vi.mock('~/utils/auth.server', () => ({
  requireUnauthenticated: vi.fn(),
}))
vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/magic-link/issue-sign-in-link.server', () => ({
  issueSignInLink,
}))

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
  vi.useFakeTimers({ toFake: ['setTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('magic-link request', () => {
  test('shows the sent state before any work that depends on the account', async () => {
    const response = await request({ email: 'Jakub.Novak@vednemesicnik.cz' })

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(SENT)
    expect(await readNotice(response)).toEqual({
      email: 'jakub.novak@vednemesicnik.cz',
      kind: 'magic-link-sent',
    })
    expect(issueSignInLink).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(issueSignInLink).toHaveBeenCalledExactlyOnceWith({
      email: 'jakub.novak@vednemesicnik.cz',
      redirectTo: '/administration',
    })
  })

  test('keeps the landing page through the sent state', async () => {
    const response = await request({
      email: 'jakub.novak@vednemesicnik.cz',
      redirectTo: '/administration/settings',
    })

    expect(response.headers.get('Location')).toBe(
      `${SENT}?${new URLSearchParams({ redirectTo: '/administration/settings' })}`,
    )

    vi.runAllTimers()

    expect(issueSignInLink).toHaveBeenCalledWith(
      expect.objectContaining({ redirectTo: '/administration/settings' }),
    )
  })

  test('sends another domain back to the field, without sending', async () => {
    const response = await request({ email: 'jakub.novak@priklad.cz' })

    expect(response.headers.get('Location')).toBe(CHOOSER)

    vi.runAllTimers()

    expect(issueSignInLink).not.toHaveBeenCalled()

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

    vi.runAllTimers()

    expect(issueSignInLink).not.toHaveBeenCalled()

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
