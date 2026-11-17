import * as Sentry from '@sentry/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

import { submitDonationRequest } from './submit-donation-request.server'

vi.mock('@sentry/react-router', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))
vi.mock('~/utils/post-signed-gas-request.server', () => ({
  postSignedGasRequest: vi.fn(),
}))

const postMock = vi.mocked(postSignedGasRequest)

const REQUEST = {
  accounts: '123456789/0800',
  action: 'submit' as const,
  city: 'Praha',
  dateOfBirth: '01.02.1990',
  email: 'tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  requestId: '2025-K7M2QX',
  street: 'Lannova 12',
  type: 'individual' as const,
  zip: '11000',
}

const failure = (error: string) => ({
  error,
  ok: false as const,
  retryable: false,
  status: 200,
})

describe('submitDonationRequest', () => {
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

  it('signs the request, keyed by its code, and answers ok', async () => {
    postMock.mockResolvedValue({ ok: true, requestId: '2025-K7M2QX' } as never)

    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({ ok: true })
    expect(postMock).toHaveBeenCalledExactlyOnceWith(
      {
        endpoint: 'donation-confirmation',
        secret: 'secret',
        url: 'https://local.dev/exec',
      },
      REQUEST,
      { idempotencyKeyField: 'requestId', timeoutMilliseconds: 30_000 },
    )
  })

  it('answers ok for a duplicate, and for a stored request whose acknowledgement failed', async () => {
    postMock.mockResolvedValueOnce({
      duplicate: true,
      ok: true,
      requestId: '2025-K7M2QX',
    } as never)
    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({ ok: true })

    postMock.mockResolvedValueOnce({
      mailError: 'unreachable',
      ok: true,
      requestId: '2025-K7M2QX',
    } as never)
    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({ ok: true })
    expect(Sentry.captureMessage).toHaveBeenCalledOnce()
  })

  it('says rejected for what the donor typed', async () => {
    for (const error of [
      'invalid_request',
      'missing_fields',
      'invalid_email',
    ]) {
      postMock.mockResolvedValueOnce(failure(error))
      await expect(submitDonationRequest(REQUEST)).resolves.toEqual({
        ok: false,
        reason: 'rejected',
      })
    }
  })

  it('says unavailable for what is ours', async () => {
    for (const error of ['unauthorized', 'stale_timestamp', 'busy']) {
      postMock.mockResolvedValueOnce(failure(error))
      await expect(submitDonationRequest(REQUEST)).resolves.toEqual({
        ok: false,
        reason: 'unavailable',
      })
    }

    postMock.mockResolvedValueOnce({
      ...failure('unreachable'),
      cause: new Error('boom'),
    })
    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
    expect(Sentry.captureException).toHaveBeenCalledOnce()
  })

  it('stores nothing without a script, ok outside production and unavailable in it', async () => {
    vi.stubEnv('GAS_DONATION_CONFIRMATION_SECRET', '')
    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({ ok: true })

    vi.stubEnv('NODE_ENV', 'production')
    await expect(submitDonationRequest(REQUEST)).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    })
    expect(postMock).not.toHaveBeenCalled()
  })
})
