import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { createMagicLinkToken, findExistingUserByEmail, sendMagicLinkEmail } =
  vi.hoisted(() => ({
    createMagicLinkToken: vi.fn(),
    findExistingUserByEmail: vi.fn(),
    sendMagicLinkEmail: vi.fn(),
  }))

vi.mock('@sentry/react-router', () => ({ captureMessage: vi.fn() }))
vi.mock('~/utils/magic-link.server', () => ({ createMagicLinkToken }))
vi.mock('~/utils/send-magic-link-email.server', () => ({
  sendMagicLinkEmail,
}))
vi.mock('~/utils/sign-in.server', () => ({ findExistingUserByEmail }))

import { issueSignInLink } from './issue-sign-in-link.server'

const EMAIL = 'jakub.novak@vednemesicnik.cz'
const options = { email: EMAIL, redirectTo: '/administration/settings' }

// Keeps the next send pending; the returned function finishes it.
const holdSend = () => {
  let finishSend = () => {}

  sendMagicLinkEmail.mockReturnValueOnce(
    new Promise<boolean>((resolve) => {
      finishSend = () => resolve(true)
    }),
  )

  return () => finishSend()
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('BASE_URL', 'https://test.local')
  vi.stubEnv('SENTRY_DSN', 'https://key@sentry.test/1')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  createMagicLinkToken.mockResolvedValue('token')
  findExistingUserByEmail.mockResolvedValue({ email: EMAIL, id: 'user-1' })
  sendMagicLinkEmail.mockResolvedValue(true)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('issueSignInLink', () => {
  test('sends an existing account a link with its token and landing page', async () => {
    await issueSignInLink(options)

    expect(createMagicLinkToken).toHaveBeenCalledExactlyOnceWith(EMAIL)
    expect(sendMagicLinkEmail).toHaveBeenCalledOnce()

    const [{ email, link }] = sendMagicLinkEmail.mock.calls[0]
    const { searchParams } = new URL(link)

    expect(email).toBe(EMAIL)
    expect(link.startsWith('https://test.local/')).toBe(true)
    expect(searchParams.get('email')).toBe(EMAIL)
    expect(searchParams.get('token')).toBe('token')
    expect(searchParams.get('redirectTo')).toBe('/administration/settings')
  })

  test('stores no token and sends nothing without an account', async () => {
    findExistingUserByEmail.mockResolvedValue(null)

    await issueSignInLink(options)

    expect(createMagicLinkToken).not.toHaveBeenCalled()
    expect(sendMagicLinkEmail).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  test('sends nothing when the token cannot be stored, and names the status', async () => {
    createMagicLinkToken.mockRejectedValue(new Response('', { status: 400 }))

    await expect(issueSignInLink(options)).resolves.toBeUndefined()

    expect(sendMagicLinkEmail).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      '[magic-link] failed to issue sign-in link',
      expect.objectContaining({ extra: { error: 'Response 400' } }),
    )
  })

  test('adds nothing for an address whose link is still on its way', async () => {
    const finishSend = holdSend()

    const first = issueSignInLink(options)
    await vi.waitFor(() => expect(sendMagicLinkEmail).toHaveBeenCalledOnce())

    await issueSignInLink(options)

    expect(createMagicLinkToken).toHaveBeenCalledOnce()
    expect(sendMagicLinkEmail).toHaveBeenCalledOnce()

    finishSend()
    await first
    await issueSignInLink(options)

    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(2)
  })

  test('takes another request once a failed attempt has ended', async () => {
    sendMagicLinkEmail.mockRejectedValueOnce(new Error('boom'))

    await issueSignInLink(options)
    await issueSignInLink(options)

    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(2)
  })

  test('does not hold another address back', async () => {
    const finishSend = holdSend()

    const first = issueSignInLink(options)
    await vi.waitFor(() => expect(sendMagicLinkEmail).toHaveBeenCalledOnce())

    await issueSignInLink({
      ...options,
      email: 'druha.adresa@local.dev',
    })

    expect(sendMagicLinkEmail).toHaveBeenCalledTimes(2)

    finishSend()
    await first
  })

  test.each([
    ['the lookup', findExistingUserByEmail],
    ['the token write', createMagicLinkToken],
    ['the send', sendMagicLinkEmail],
  ])('logs and reports %s failing, and never rejects', async (_, step) => {
    step.mockRejectedValue(new Error('database is locked'))

    await expect(issueSignInLink(options)).resolves.toBeUndefined()

    expect(console.error).toHaveBeenCalledExactlyOnceWith(
      '[magic-link] failed to issue sign-in link —',
      expect.any(Error),
    )
    expect(Sentry.captureMessage).toHaveBeenCalledExactlyOnceWith(
      '[magic-link] failed to issue sign-in link',
      {
        extra: { error: 'Error: database is locked' },
        fingerprint: ['magic-link', 'issue-failed'],
        level: 'error',
      },
    )
  })

  test('leaves a failed send to the sender, which reports it itself', async () => {
    sendMagicLinkEmail.mockResolvedValue(false)

    await issueSignInLink(options)

    expect(console.error).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  test('only logs without a Sentry DSN', async () => {
    vi.stubEnv('SENTRY_DSN', '')
    findExistingUserByEmail.mockRejectedValue(new Error('database is locked'))

    await issueSignInLink(options)

    expect(console.error).toHaveBeenCalledOnce()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })
})
