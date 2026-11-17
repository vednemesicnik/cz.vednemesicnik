import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

import { sendDonationVerificationCodeEmail } from './send-donation-verification-code-email.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))
vi.mock('~/utils/post-signed-gas-request.server', () => ({
  postSignedGasRequest: vi.fn(),
}))

const postMock = vi.mocked(postSignedGasRequest)

const REQUEST = { code: 'K7M29XQP', email: 'tereza@local.dev' }

describe('sendDonationVerificationCodeEmail', () => {
  beforeEach(() => {
    postMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubEnv('GAS_DONATION_CONFIRMATION_URL', 'https://local.dev/exec')
    vi.stubEnv('GAS_DONATION_CONFIRMATION_SECRET', 'secret')
    vi.stubEnv('SENTRY_DSN', 'https://sentry.local.dev/1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.mocked(Sentry.captureException).mockClear()
    vi.mocked(Sentry.captureMessage).mockClear()
  })

  it('sends the signed action, keyed by the code', async () => {
    postMock.mockResolvedValue({ ok: true })

    await expect(sendDonationVerificationCodeEmail(REQUEST)).resolves.toBe(true)

    expect(postMock).toHaveBeenCalledExactlyOnceWith(
      {
        endpoint: 'donation-confirmation',
        secret: 'secret',
        url: 'https://local.dev/exec',
      },
      { ...REQUEST, action: 'sendVerificationCode' },
      { idempotencyKeyField: 'code', timeoutMilliseconds: 30_000 },
    )
  })

  it('reports a refused send and answers false', async () => {
    postMock.mockResolvedValue({
      error: 'mail_send_failed',
      mailError: 'unreachable',
      ok: false,
      retryable: true,
      status: 200,
    })

    await expect(sendDonationVerificationCodeEmail(REQUEST)).resolves.toBe(
      false,
    )
    expect(Sentry.captureMessage).toHaveBeenCalledOnce()
  })

  it('reports a thrown request and answers false', async () => {
    postMock.mockResolvedValue({
      cause: new Error('boom'),
      error: 'unreachable',
      ok: false,
      retryable: true,
      status: null,
    })

    await expect(sendDonationVerificationCodeEmail(REQUEST)).resolves.toBe(
      false,
    )
    expect(Sentry.captureException).toHaveBeenCalledOnce()
  })

  it('logs the code without a script outside production', async () => {
    vi.stubEnv('GAS_DONATION_CONFIRMATION_URL', '')

    await expect(sendDonationVerificationCodeEmail(REQUEST)).resolves.toBe(true)
    expect(postMock).not.toHaveBeenCalled()
  })

  it('sends nothing and answers false without a script in production', async () => {
    vi.stubEnv('GAS_DONATION_CONFIRMATION_URL', '')
    vi.stubEnv('NODE_ENV', 'production')

    await expect(sendDonationVerificationCodeEmail(REQUEST)).resolves.toBe(
      false,
    )
  })
})
