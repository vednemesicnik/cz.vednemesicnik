import { createHmac } from 'node:crypto'

import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sendUsersNotice } from './send-users-notice.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

const jsonResponse = (json: unknown, status = 200) => ({
  json: async () => json,
  ok: status >= 200 && status < 300,
  status,
})

const invitation = {
  email: 'new@vednemesicnik.cz',
  inviterName: 'Petr Dvořák',
  kind: 'invitation' as const,
  link: 'https://vednemesicnik.cz/administration/sign-in/magic-link/verify?token=t',
}

const keys = [
  'GAS_USERS_NOTICE_URL',
  'GAS_USERS_NOTICE_SECRET',
  'SENTRY_DSN',
] as const
let originalValues: Record<(typeof keys)[number], string | undefined>

beforeEach(() => {
  originalValues = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  ) as typeof originalValues

  process.env.GAS_USERS_NOTICE_URL = 'https://example.test/exec'
  process.env.GAS_USERS_NOTICE_SECRET = 'test-secret'
  delete process.env.SENTRY_DSN

  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  for (const key of keys) {
    const value = originalValues[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
})

describe('sendUsersNotice', () => {
  test('posts a signed envelope with the notice and never the secret itself', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendUsersNotice(invitation)).resolves.toBe(true)

    const [url, requestInit] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.test/exec')
    const sentBody = requestInit.body as string
    expect(sentBody).not.toContain('test-secret')

    const envelope = JSON.parse(sentBody)
    expect(JSON.parse(envelope.payload)).toEqual(invitation)
    // Verified the way Toolkit.readSignedRequest does it on the other side.
    const expected = createHmac('sha256', 'test-secret')
      .update(`${envelope.timestamp}.${envelope.payload}`)
      .digest('hex')
    expect(envelope.signature).toBe(expected)
  })

  test('logs the error and mailerError of a failed send and reports it', async () => {
    process.env.SENTRY_DSN = 'https://dsn.test/1'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          error: 'mailer_send_failed',
          mailerError: 'unauthorized',
          ok: false,
        }),
      ),
    )

    await expect(sendUsersNotice(invitation)).resolves.toBe(false)

    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('invitation')
    expect(message).toContain('error mailer_send_failed')
    expect(message).toContain('mailerError unauthorized')
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      '[users-notice] GAS send failed',
      expect.objectContaining({
        fingerprint: ['users-notice', 'gas-send-failed'],
      }),
    )
  })

  test('logs placeholders when the body is not JSON (GAS HTML error page)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
        ok: true,
        status: 200,
      }),
    )

    await expect(sendUsersNotice(invitation)).resolves.toBe(false)

    const [message] = vi.mocked(console.error).mock.calls[0]
    expect(message).toContain('error —')
  })

  test('swallows and logs when the request throws (network / timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))

    await expect(sendUsersNotice(invitation)).resolves.toBe(false)
    expect(console.error).toHaveBeenCalledWith(
      '[users-notice] GAS request threw —',
      expect.any(Error),
    )
  })

  test('prints the notice instead of sending when GAS is not configured locally', async () => {
    delete process.env.GAS_USERS_NOTICE_URL
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(sendUsersNotice(invitation)).resolves.toBe(true)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(console.info).toHaveBeenCalledOnce()
  })

  test('prints the new address and who changed it for an e-mail change notice', async () => {
    delete process.env.GAS_USERS_NOTICE_URL

    await expect(
      sendUsersNotice({
        changedByName: 'Petr Dvořák',
        email: 'old@local.dev',
        kind: 'email-change-notice',
        newEmail: 'new@local.dev',
      }),
    ).resolves.toBe(true)

    const [message] = vi.mocked(console.info).mock.calls[0]
    expect(message).toContain('email-change-notice for old@local.dev')
    expect(message).toContain('new@local.dev by Petr Dvořák')
  })
})
