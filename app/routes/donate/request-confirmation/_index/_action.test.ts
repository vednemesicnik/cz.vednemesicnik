import { RouterContextProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { issueDonationVerificationCode } from '~/utils/donation-request/issue-donation-verification-code.server'
import {
  type DonationRequestState,
  readDonationRequestCookie,
} from '~/utils/donation-request/read-donation-request-cookie.server'
import { submitDonationRequest } from '~/utils/donation-request/submit-donation-request.server'
import { writeDonationRequestCookie } from '~/utils/donation-request/write-donation-request-cookie.server'
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

const URL = 'http://localhost/donate/request-confirmation'
const YEAR = String(new Date().getFullYear() - 1)
const FORM = {
  'accounts[0]': ' 123456789/0800 ',
  'address.city': 'Praha',
  'address.street': 'Lannova 12',
  'address.zip': '110 00',
  dateOfBirth: '1. 2. 1990',
  email: 'Tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  type: 'individual',
  year: YEAR,
}
const DETAILS = {
  accounts: ['123456789/0800'],
  address: { city: 'Praha', street: 'Lannova 12', zip: '11000' },
  dateOfBirth: '01.02.1990',
  email: 'Tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  type: 'individual' as const,
  year: YEAR,
}

type ActionResult = {
  data: { error: Record<string, string[]> | null }
  init: { headers?: HeadersInit; status: number }
}

const formDataOf = (values: Record<string, string>) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(values)) formData.set(name, value)
  return formData
}

const cookieOf = async (state: DonationRequestState) =>
  (await writeDonationRequestCookie(state)).split(';')[0]

const run = (
  values: Record<string, string>,
  cookie?: string,
  context = new RouterContextProvider(),
) =>
  action({
    context,
    params: {},
    request: new Request(URL, {
      body: formDataOf(values),
      headers: cookie === undefined ? {} : { Cookie: cookie },
      method: 'POST',
    }),
  } as never)

const runToResponse = async (...args: Parameters<typeof run>) => {
  const result = await run(...args).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const runToData = async (...args: Parameters<typeof run>) =>
  (await run(...args)) as unknown as ActionResult

const savedState = (response: Response) =>
  readDonationRequestCookie(
    new Request(URL, {
      headers: {
        Cookie: (response.headers.get('Set-Cookie') ?? '').split(';')[0],
      },
    }),
  )

describe('donation request form action', () => {
  beforeEach(() => {
    issueMock.mockReset().mockResolvedValue({ issuedAt: 1234, status: 'sent' })
    submitMock.mockReset().mockResolvedValue({ ok: true })
  })

  it('stores nothing, mails a code to the address and moves to the code', async () => {
    const response = await runToResponse(FORM)

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(
      '/donate/request-confirmation/verify',
    )
    expect(issueMock).toHaveBeenCalledExactlyOnceWith(
      'tereza@local.dev',
      expect.any(Request),
    )
    expect(submitMock).not.toHaveBeenCalled()
    const state = await savedState(response)
    expect(state).toEqual({
      details: DETAILS,
      requestId: expect.stringMatching(new RegExp(`^${YEAR}-[A-Z2-9]{6}$`)),
      state: 'details',
      verification: { issuedAt: 1234 },
    })
  })

  it('keeps an IBAN typed in groups without spaces, in capitals', async () => {
    const response = await runToResponse({
      ...FORM,
      'accounts[1]': 'sk31 1200 0000 1987 4263 7541',
    })

    const state = await savedState(response)
    expect(state).toMatchObject({
      details: { accounts: ['123456789/0800', 'SK3112000000198742637541'] },
    })
  })

  it('rejects an account of neither shape', async () => {
    const result = await runToData({ ...FORM, 'accounts[0]': 'účet 42' })

    expect(result.init.status).toBe(400)
    expect(result.data.error).toEqual({
      'accounts[0]': [
        'Zadejte číslo účtu ve tvaru 123456789/0800 nebo jako IBAN.',
      ],
    })
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('answers the field errors and mails nothing', async () => {
    const result = await runToData({ ...FORM, email: 'nope' })

    expect(result.init.status).toBe(400)
    expect(result.data.error).toHaveProperty('email')
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('refuses a name longer than the script takes', async () => {
    const result = await runToData({ ...FORM, firstName: 'x'.repeat(101) })

    expect(result.data.error).toHaveProperty('firstName')
  })

  it('keeps the request code for unchanged details and a live code, and mails nothing', async () => {
    const issuedAt = Date.now() - 60_000
    const cookie = await cookieOf({
      details: DETAILS,
      requestId: `${YEAR}-K7M2QX`,
      state: 'details',
      verification: { issuedAt },
    })

    const response = await runToResponse(FORM, cookie)

    expect(issueMock).not.toHaveBeenCalled()
    await expect(savedState(response)).resolves.toMatchObject({
      requestId: `${YEAR}-K7M2QX`,
      verification: { issuedAt },
    })
  })

  it('gives changed details a new request code', async () => {
    const cookie = await cookieOf({
      details: DETAILS,
      requestId: `${YEAR}-K7M2QX`,
      state: 'details',
      verification: { issuedAt: Date.now() - 60_000 },
    })

    const response = await runToResponse(
      { ...FORM, 'address.city': 'Brno' },
      cookie,
    )
    const state = await savedState(response)

    expect(state?.requestId).not.toBe(`${YEAR}-K7M2QX`)
  })

  it('mails a new code for a new address', async () => {
    const cookie = await cookieOf({
      details: DETAILS,
      requestId: `${YEAR}-K7M2QX`,
      state: 'details',
      verifiedEmail: 'tereza@local.dev',
    })

    await runToResponse({ ...FORM, email: 'jan@local.dev' }, cookie)

    expect(issueMock).toHaveBeenCalledOnce()
    expect(submitMock).not.toHaveBeenCalled()
  })

  it('takes corrected details with a confirmed address to the verify step, and stores nothing', async () => {
    const cookie = await cookieOf({
      details: DETAILS,
      requestId: `${YEAR}-K7M2QX`,
      state: 'details',
      verifiedEmail: 'tereza@local.dev',
    })

    const response = await runToResponse({ ...FORM, note: 'v březnu' }, cookie)

    expect(response.headers.get('Location')).toBe(
      '/donate/request-confirmation/verify',
    )
    expect(issueMock).not.toHaveBeenCalled()
    expect(submitMock).not.toHaveBeenCalled()
    await expect(savedState(response)).resolves.toMatchObject({
      details: { note: 'v březnu' },
      verifiedEmail: 'tereza@local.dev',
    })
  })

  it('says why no code went and keeps the cookie as it was', async () => {
    issueMock.mockResolvedValue({ status: 'failed' })
    const failed = await runToData(FORM)
    expect(failed.init.status).toBe(503)
    expect(failed.init.headers).toBeUndefined()

    issueMock.mockResolvedValue({ retryAfter: 600, status: 'limited' })
    const limited = await runToData(FORM)
    expect(limited.init.status).toBe(429)
  })

  it('answers past the form limit before anything else', async () => {
    const context = new RouterContextProvider()
    context.set(rateLimitContext, { retryAfter: 900 })

    const result = await runToData(FORM, undefined, context)

    expect(result.init.status).toBe(429)
    expect(result.data.error?.['']).toEqual([
      'Ověřovací kód teď nelze poslat. Zkuste to prosím za 15 minut.',
    ])
    expect(issueMock).not.toHaveBeenCalled()
  })
})
