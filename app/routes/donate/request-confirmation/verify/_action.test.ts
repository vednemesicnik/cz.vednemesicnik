import { RouterContextProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/email-verification-config'
import { issueDonationVerificationCode } from '~/utils/donation-request/issue-donation-verification-code.server'
import {
  type DonationRequestState,
  readDonationRequestCookie,
} from '~/utils/donation-request/read-donation-request-cookie.server'
import { submitDonationRequest } from '~/utils/donation-request/submit-donation-request.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'
import { createVerificationCode } from '~/utils/email-verification/create-verification-code.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { action } from './_action'

vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock(
  '~/utils/donation-request/issue-donation-verification-code.server',
  () => ({ issueDonationVerificationCode: vi.fn() }),
)
vi.mock('~/utils/donation-request/submit-donation-request.server', () => ({
  submitDonationRequest: vi.fn(),
}))

const issueMock = vi.mocked(issueDonationVerificationCode)
const submitMock = vi.mocked(submitDonationRequest)

const SECRET = 'donation-secret'
const BASE_URL = 'http://localhost/donate/request-confirmation/verify'
const REQUEST_ID = '2025-K7M2QX'
const DETAILS = {
  accounts: ['123456789/0800'],
  address: { city: 'Praha', street: 'Lannova 12', zip: '11000' },
  dateOfBirth: '01.02.1990',
  email: 'Tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  type: 'individual' as const,
  year: '2025',
}
const issuedAgo = (milliseconds: number) => Date.now() - milliseconds
const ISSUED_AT = issuedAgo(60 * 60 * 1000)

type ActionResult = {
  data: {
    notice?: { message: string; tone: string }
    submissionResult?: { error: Record<string, string[]> }
  }
  init: { headers?: HeadersInit; status: number }
}

const codeFor = (issuedAt: number, purpose = 'donation-verify' as const) =>
  createVerificationCode({
    email: 'tereza@local.dev',
    issuedAt,
    purpose,
    secret: SECRET,
  })

const cookieOf = async (state: Partial<DonationRequestState> = {}) =>
  (
    await writeDonationRequestCookie({
      details: DETAILS,
      requestId: REQUEST_ID,
      state: 'details',
      verification: { issuedAt: ISSUED_AT },
      ...state,
    } as DonationRequestState)
  ).split(';')[0]

const run = (
  intent: string,
  values: Record<string, string>,
  cookie?: string,
  context = new RouterContextProvider(),
) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(values)) body.set(name, value)
  return action({
    context,
    params: {},
    request: new Request(`${BASE_URL}?intent=${intent}`, {
      body,
      headers: cookie === undefined ? {} : { Cookie: cookie },
      method: 'POST',
    }),
  } as never)
}

const runToResponse = async (...args: Parameters<typeof run>) => {
  const result = await run(...args).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const runToData = async (...args: Parameters<typeof run>) =>
  (await run(...args)) as unknown as ActionResult

const stateOf = (setCookie: string | null) =>
  readDonationRequestCookie(
    new Request(BASE_URL, {
      headers: { Cookie: (setCookie ?? '').split(';')[0] },
    }),
  )

describe('donation request verify action', () => {
  beforeEach(() => {
    issueMock.mockReset().mockResolvedValue({ issuedAt: 5678, status: 'sent' })
    submitMock.mockReset().mockResolvedValue({ ok: true })
    vi.stubEnv('DONATION_VERIFICATION_SECRET', SECRET)
  })

  describe('verify-code', () => {
    it('sends the request after the right code, keyed by its code, and keeps only that code', async () => {
      const response = await runToResponse(
        'verify-code',
        { code: codeFor(ISSUED_AT).toLowerCase() },
        await cookieOf(),
      )

      expect(response.headers.get('Location')).toBe(
        '/donate/request-confirmation/sent',
      )
      expect(submitMock).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          action: 'submit',
          email: 'Tereza@local.dev',
          requestId: REQUEST_ID,
        }),
      )
      await expect(
        stateOf(response.headers.get('Set-Cookie')),
      ).resolves.toEqual({ requestId: REQUEST_ID, state: 'sent' })
    })

    it('says a wrong code and sends nothing', async () => {
      const result = await runToData(
        'verify-code',
        { code: '22222222' },
        await cookieOf(),
      )

      expect(result.init.status).toBe(400)
      expect(result.data.submissionResult?.error.code).toEqual([
        'Kód nesouhlasí. Zkontrolujte ho, nebo si pošlete nový.',
      ])
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('takes no membership code for the same address and moment', async () => {
      const result = await runToData(
        'verify-code',
        {
          code: createVerificationCode({
            email: 'tereza@local.dev',
            issuedAt: ISSUED_AT,
            purpose: 'membership-verify',
            secret: SECRET,
          }),
        },
        await cookieOf(),
      )

      expect(result.data.submissionResult?.error.code).toBeDefined()
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('takes no code once it has expired', async () => {
      const issuedAt = issuedAgo(VERIFICATION_CODE_LIFETIME_MILLISECONDS + 1000)

      const result = await runToData(
        'verify-code',
        { code: codeFor(issuedAt) },
        await cookieOf({ verification: { issuedAt } }),
      )

      expect(result.init.status).toBe(400)
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('keeps the address confirmed when the request does not go', async () => {
      submitMock.mockResolvedValue({ ok: false, reason: 'unavailable' })

      const result = await runToData(
        'verify-code',
        { code: codeFor(ISSUED_AT) },
        await cookieOf(),
      )

      expect(result.init.status).toBe(503)
      expect(result.data.notice?.tone).toBe('error')
      await expect(
        stateOf(new Headers(result.init.headers).get('Set-Cookie')),
      ).resolves.toMatchObject({ verifiedEmail: 'tereza@local.dev' })
    })

    it('answers past the tries limit before reading the code', async () => {
      const context = new RouterContextProvider()
      context.set(rateLimitContext, { retryAfter: 600 })

      const result = await runToData(
        'verify-code',
        { code: codeFor(ISSUED_AT) },
        await cookieOf(),
        context,
      )

      expect(result.init.status).toBe(429)
      expect(submitMock).not.toHaveBeenCalled()
    })
  })

  describe('send-code', () => {
    it('mails a new code and writes its moment', async () => {
      const result = await runToData('send-code', {}, await cookieOf())

      expect(result.data.notice).toEqual({
        message: 'Poslali jsme nový kód. Předchozí už neplatí.',
        tone: 'success',
      })
      await expect(
        stateOf(new Headers(result.init.headers).get('Set-Cookie')),
      ).resolves.toMatchObject({ verification: { issuedAt: 5678 } })
    })

    it('keeps the live code when a new one does not go', async () => {
      issueMock.mockResolvedValue({ status: 'failed' })

      const result = await runToData('send-code', {}, await cookieOf())

      expect(result.init.status).toBe(503)
      expect(result.data.notice?.message).toMatch(/^Použijte dosavadní kód/)
      expect(result.init.headers).toBeUndefined()
    })
  })

  describe('submit', () => {
    it('sends the request again once the address is confirmed', async () => {
      const response = await runToResponse(
        'submit',
        {},
        await cookieOf({
          verification: undefined,
          verifiedEmail: 'tereza@local.dev',
        }),
      )

      expect(response.headers.get('Location')).toBe(
        '/donate/request-confirmation/sent',
      )
      expect(submitMock).toHaveBeenCalledOnce()
    })

    it('refuses without a confirmed address', async () => {
      const result = await runToData('submit', {}, await cookieOf())

      expect(result.init.status).toBe(403)
      expect(submitMock).not.toHaveBeenCalled()
    })
  })

  it('sends a request without a cookie back to the form', async () => {
    const response = await runToResponse('verify-code', { code: 'x' })

    expect(response.headers.get('Location')).toBe(
      '/donate/request-confirmation?reason=expired',
    )
  })
})
