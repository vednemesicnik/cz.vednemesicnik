import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

import { sendEnrolmentEmail } from './send-enrolment-email.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))
vi.mock('~/utils/post-signed-gas-request.server', () => ({
  postSignedGasRequest: vi.fn(),
}))

const postMock = vi.mocked(postSignedGasRequest)

const REQUEST = {
  email: 'tereza@local.dev',
  link: 'https://local.dev/editorial-board/enrolment/confirm?token=abc',
}

describe('sendEnrolmentEmail', () => {
  beforeEach(() => {
    postMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_URL', 'https://local.dev/exec')
    vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_SECRET', 'secret')
    vi.stubEnv('SENTRY_DSN', 'https://sentry.local.dev/1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(Sentry.captureException).mockClear()
    vi.mocked(Sentry.captureMessage).mockClear()
  })

  it('sends the action, keyed by the link, with a longer timeout', async () => {
    postMock.mockResolvedValue({ ok: true })

    await expect(sendEnrolmentEmail(REQUEST)).resolves.toBe(true)

    expect(postMock).toHaveBeenCalledExactlyOnceWith(
      {
        endpoint: 'editorial-board-membership',
        secret: 'secret',
        url: 'https://local.dev/exec',
      },
      { ...REQUEST, action: 'sendEnrolmentEmail' },
      { idempotencyKeyField: 'link', timeoutMilliseconds: 30_000 },
    )
  })

  it('reports a refused send and answers false', async () => {
    postMock.mockResolvedValue({
      error: 'mailer_send_failed',
      mailerError: 'unreachable',
      ok: false,
      retryable: true,
      status: 200,
    })

    await expect(sendEnrolmentEmail(REQUEST)).resolves.toBe(false)

    expect(Sentry.captureMessage).toHaveBeenCalledExactlyOnceWith(
      '[editorial-board-enrolment] GAS send failed',
      expect.objectContaining({
        extra: {
          error: 'mailer_send_failed',
          mailerError: 'unreachable',
          status: 200,
        },
      }),
    )
  })

  it('reports what the request threw and answers false', async () => {
    const cause = new Error('timeout')
    postMock.mockResolvedValue({
      cause,
      error: 'unreachable',
      ok: false,
      retryable: true,
      status: null,
    })

    await expect(sendEnrolmentEmail(REQUEST)).resolves.toBe(false)

    expect(Sentry.captureException).toHaveBeenCalledExactlyOnceWith(cause)
  })

  it('logs the link instead outside production without a deployment', async () => {
    vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_URL', '')

    await expect(sendEnrolmentEmail(REQUEST)).resolves.toBe(true)

    expect(postMock).not.toHaveBeenCalled()
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(REQUEST.link),
    )
  })

  it('answers false in production without a deployment, and logs no link', async () => {
    vi.stubEnv('GAS_EDITORIAL_BOARD_MEMBERSHIP_URL', '')
    vi.stubEnv('NODE_ENV', 'production')

    await expect(sendEnrolmentEmail(REQUEST)).resolves.toBe(false)

    expect(postMock).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
  })
})
