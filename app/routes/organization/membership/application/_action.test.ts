import { RouterContextProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { VERIFICATION_CODE_LIFETIME_MILLISECONDS } from '~/config/email-verification-config'
import { MAX_DECLARATION_BYTES } from '~/config/membership-application-config'
import { createVerificationCode } from '~/utils/email-verification/create-verification-code.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { issueVerificationCode } from '~/utils/membership-application/issue-verification-code.server'
import { readMembershipApplicationCookie } from '~/utils/membership-application/read-membership-application-cookie.server'
import { submitMembershipApplication } from '~/utils/membership-application/submit-membership-application.server'
import { writeMembershipApplicationCookie } from '~/utils/membership-application/write-membership-application-cookie.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { action } from './_action'

vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock(
  '~/utils/membership-application/submit-membership-application.server',
  () => ({ submitMembershipApplication: vi.fn() }),
)
vi.mock(
  '~/utils/membership-application/issue-verification-code.server',
  () => ({ issueVerificationCode: vi.fn() }),
)

const submitMock = vi.mocked(submitMembershipApplication)
const issueMock = vi.mocked(issueVerificationCode)

const SECRET = 'verification-secret'
// An hour ago: the code is live.
const issuedAgo = (milliseconds: number) => Date.now() - milliseconds
const ISSUED_AT = issuedAgo(60 * 60 * 1000)

const BASE_URL = 'http://localhost/organization/membership/application'
const CODE = 'VDM-7K3Q-2P'
const FORM_DETAILS = {
  address: 'Lannova 12, 370 01 České Budějovice',
  dateOfBirth: '14. 5. 2009',
  email: 'tereza@local.dev',
  firstName: 'Tereza',
  lastName: 'Malá',
  phone: '604 123 456',
}
const STORED_DETAILS = { ...FORM_DETAILS, dateOfBirth: '2009-05-14' }
const PDF_BYTES = new TextEncoder().encode('%PDF-1.4 podepsano')

type ActionResult = {
  data: {
    notice?: { message: string; source: string; tone: string }
    submissionResult: { error: Record<string, string[]> }
  }
  init: { headers?: HeadersInit; status: number }
}

const cookieHeader = async (
  state: Parameters<typeof writeMembershipApplicationCookie>[0],
) => (await writeMembershipApplicationCookie(state)).split(';')[0]

// The signature step's submit needs the address verified.
const detailsCookie = () =>
  cookieHeader({
    code: CODE,
    details: STORED_DETAILS,
    state: 'details',
    verifiedEmail: 'tereza@local.dev',
  })

const pendingCookie = (issuedAt = ISSUED_AT) =>
  cookieHeader({
    code: CODE,
    details: STORED_DETAILS,
    state: 'details',
    verification: { issuedAt },
  })

// `signature?intent=verify-code`: the intent travels in the address.
const run = (
  stepAndQuery: string,
  body: FormData,
  cookie?: string,
  context = new RouterContextProvider(),
) =>
  action({
    context,
    params: { stepName: stepAndQuery.split('?')[0] },
    request: new Request(`${BASE_URL}/${stepAndQuery}`, {
      body,
      headers: cookie === undefined ? {} : { Cookie: cookie },
      method: 'POST',
    }),
  } as never)

const setCookieOf = (result: ActionResult) =>
  new Headers(result.init.headers).get('Set-Cookie')

// A redirect is thrown; `data()` is returned.
const runToResponse = async (...args: Parameters<typeof run>) => {
  const result = await run(...args).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const runToData = async (...args: Parameters<typeof run>) =>
  (await run(...args)) as unknown as ActionResult

const formWithFile = (file: File) => {
  const formData = new FormData()
  formData.set('declaration', file)
  return formData
}

const pdf = () => new File([PDF_BYTES], 'prihlaska.pdf')

const readSetCookie = (response: Response) =>
  readMembershipApplicationCookie(
    new Request(BASE_URL, {
      headers: {
        Cookie: (response.headers.get('Set-Cookie') ?? '').split(';')[0],
      },
    }),
  )

const formDataOf = (values: Record<string, string>) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(values)) {
    formData.set(name, value)
  }
  return formData
}

describe('membership application action', () => {
  beforeEach(() => {
    submitMock.mockReset()
    issueMock.mockReset().mockResolvedValue({ issuedAt: 1234, status: 'sent' })
    vi.stubEnv('MEMBERSHIP_VERIFICATION_SECRET', SECRET)
  })

  describe('details', () => {
    it('stores valid details under a new code, mails a verification code and moves on', async () => {
      const response = await runToResponse('details', formDataOf(FORM_DETAILS))

      expect(response.status).toBe(303)
      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/signature`,
      )
      expect(issueMock).toHaveBeenCalledExactlyOnceWith(
        'tereza@local.dev',
        expect.any(Request),
      )
      expect(await readSetCookie(response)).toEqual({
        code: expect.stringMatching(/^VDM-/),
        details: STORED_DETAILS,
        state: 'details',
        verification: { issuedAt: 1234 },
      })
    })

    it('mails nothing for the same address while its code is live', async () => {
      const response = await runToResponse(
        'details',
        formDataOf({ ...FORM_DETAILS, phone: '731 456 789' }),
        await pendingCookie(),
      )

      expect(issueMock).not.toHaveBeenCalled()
      expect(await readSetCookie(response)).toMatchObject({
        verification: { issuedAt: ISSUED_AT },
      })
    })

    it('keeps a verified address verified when other details change', async () => {
      const response = await runToResponse(
        'details',
        formDataOf({ ...FORM_DETAILS, phone: '731 456 789' }),
        await detailsCookie(),
      )

      expect(issueMock).not.toHaveBeenCalled()
      expect(await readSetCookie(response)).toMatchObject({
        verifiedEmail: 'tereza@local.dev',
      })
    })

    it('reads the same address without case', async () => {
      await runToResponse(
        'details',
        formDataOf({ ...FORM_DETAILS, email: 'Tereza@Local.dev' }),
        await detailsCookie(),
      )

      expect(issueMock).not.toHaveBeenCalled()
    })

    it('asks a new address for a new code and forgets the verification', async () => {
      const response = await runToResponse(
        'details',
        formDataOf({ ...FORM_DETAILS, email: 'jan@local.dev' }),
        await detailsCookie(),
      )

      expect(issueMock).toHaveBeenCalledExactlyOnceWith(
        'jan@local.dev',
        expect.any(Request),
      )
      const state = await readSetCookie(response)
      expect(state).toMatchObject({ verification: { issuedAt: 1234 } })
      expect(state).not.toHaveProperty('verifiedEmail')
    })

    it('mails a new code once the old one has expired', async () => {
      await runToResponse(
        'details',
        formDataOf(FORM_DETAILS),
        await pendingCookie(
          issuedAgo(VERIFICATION_CODE_LIFETIME_MILLISECONDS + 1000),
        ),
      )

      expect(issueMock).toHaveBeenCalledOnce()
    })

    it('stays on the details when the code did not go out, cookie untouched', async () => {
      issueMock.mockResolvedValue({ status: 'failed' })

      const result = await runToData('details', formDataOf(FORM_DETAILS))

      expect(result.init.status).toBe(503)
      expect(result.data.submissionResult.error?.['']).toEqual([
        expect.stringContaining('tlačítko Pokračovat'),
      ])
      expect(setCookieOf(result)).toBeNull()
    })

    it('says when it can send again past the limit', async () => {
      issueMock.mockResolvedValue({ retryAfter: 720, status: 'limited' })

      const result = await runToData('details', formDataOf(FORM_DETAILS))

      expect(result.init.status).toBe(429)
      expect(result.data.submissionResult.error?.['']).toEqual([
        'Ověřovací kód teď nelze poslat. Zkuste to prosím za 12 minut.',
      ])
    })

    it('keeps the code while the details stay the same', async () => {
      const response = await runToResponse(
        'details',
        formDataOf(FORM_DETAILS),
        await detailsCookie(),
      )

      expect(await readSetCookie(response)).toMatchObject({ code: CODE })
    })

    it('gives changed details a new code', async () => {
      const response = await runToResponse(
        'details',
        formDataOf({ ...FORM_DETAILS, phone: '731 456 789' }),
        await detailsCookie(),
      )
      const state = await readSetCookie(response)

      expect(state?.code).not.toBe(CODE)
    })

    it('answers invalid details with their errors', async () => {
      const result = await runToData(
        'details',
        formDataOf({ ...FORM_DETAILS, firstName: '' }),
      )

      expect(result.init.status).toBe(400)
      expect(result.data.submissionResult.error.firstName).toEqual([
        'Vyplňte jméno.',
      ])
    })

    it('stops at the honeypot', async () => {
      vi.mocked(checkHoneypot).mockImplementationOnce(() => {
        throw new Response('Invalid form.', { status: 400 })
      })

      const response = await runToResponse('details', formDataOf(FORM_DETAILS))

      expect(response.status).toBe(400)
    })
  })

  describe('signature', () => {
    it('sends to the script once and swaps the details for the sent state', async () => {
      submitMock.mockResolvedValue({
        acknowledgementSent: true,
        code: CODE,
        ok: true,
      })

      const response = await runToResponse(
        'signature',
        formWithFile(pdf()),
        await detailsCookie(),
      )

      expect(submitMock).toHaveBeenCalledTimes(1)
      expect(submitMock.mock.lastCall?.[0]).toMatchObject({
        action: 'submit',
        code: CODE,
        dateOfBirth: '2009-05-14',
        declaration: {
          data: Buffer.from(PDF_BYTES).toString('base64'),
          mimeType: 'application/pdf',
        },
        email: 'tereza@local.dev',
      })
      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/sent`,
      )
      expect(await readSetCookie(response)).toEqual({
        code: CODE,
        email: 'tereza@local.dev',
        state: 'sent',
      })
    })

    it('sends no phone when the applicant gave none', async () => {
      submitMock.mockResolvedValue({
        acknowledgementSent: true,
        code: CODE,
        ok: true,
      })
      const { phone: _phone, ...details } = STORED_DETAILS

      await runToResponse(
        'signature',
        formWithFile(pdf()),
        await cookieHeader({
          code: CODE,
          details,
          state: 'details',
          verifiedEmail: 'tereza@local.dev',
        }),
      )

      // Undefined leaves it out of the JSON the request signs.
      expect(submitMock.mock.lastCall?.[0].phone).toBeUndefined()
    })

    it('judges the age on the day of submission', async () => {
      submitMock.mockResolvedValue({
        acknowledgementSent: true,
        code: CODE,
        ok: true,
      })
      vi.useFakeTimers({ now: new Date('2027-05-14T12:00:00Z') })

      try {
        await run(
          'signature',
          formWithFile(pdf()),
          await detailsCookie(),
        ).catch(() => null)
      } finally {
        vi.useRealTimers()
      }

      expect(submitMock.mock.lastCall?.[0].isMinor).toBe(false)
    })

    it('sends the application back without a cookie', async () => {
      const response = await runToResponse('signature', formWithFile(pdf()))

      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/details?reason=expired`,
      )
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('refuses text renamed to .pdf without calling the script', async () => {
      const result = await runToData(
        'signature',
        formWithFile(new File(['Toto není PDF.'], 'prihlaska.pdf')),
        await detailsCookie(),
      )

      expect(result.init.status).toBe(400)
      expect(result.data.submissionResult.error.declaration).toEqual([
        'Soubor se nepodařilo rozpoznat jako PDF, JPEG ani PNG. Nahrajte ho prosím v jednom z těchto formátů.',
      ])
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('refuses a file over the limit with a sentence, not a crash', async () => {
      const result = await runToData(
        'signature',
        formWithFile(
          new File(
            [new Uint8Array(MAX_DECLARATION_BYTES + 1)],
            'prihlaska.pdf',
          ),
        ),
        await detailsCookie(),
      )

      expect(result.init.status).toBe(400)
      expect(result.data.submissionResult.error.declaration).toEqual([
        'Soubor je příliš velký. Nahrajte prosím menší, nejvýš 8 MB.',
      ])
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('takes a file right at the limit', async () => {
      submitMock.mockResolvedValue({
        acknowledgementSent: true,
        code: CODE,
        ok: true,
      })
      const bytes = new Uint8Array(MAX_DECLARATION_BYTES)
      bytes.set(PDF_BYTES)

      const response = await runToResponse(
        'signature',
        formWithFile(new File([bytes], 'prihlaska.pdf')),
        await detailsCookie(),
      )

      expect(response.status).toBe(303)
    })

    it('asks for a file when none came', async () => {
      const result = await runToData(
        'signature',
        formWithFile(new File([], '')),
        await detailsCookie(),
      )

      expect(result.data.submissionResult.error.declaration).toEqual([
        'Nahrajte podepsané prohlášení.',
      ])
    })

    it('says so when the limit is used up, before reading the body', async () => {
      const context = new RouterContextProvider()
      context.set(rateLimitContext, { retryAfter: 900 })

      const result = await runToData(
        'signature',
        formWithFile(pdf()),
        await detailsCookie(),
        context,
      )

      expect(result.init.status).toBe(429)
      expect(result.data.submissionResult.error['']).toEqual([
        expect.stringContaining('za 15 minut'),
      ])
      expect(result.data.submissionResult.error.declaration).toBeUndefined()
      expect(submitMock).not.toHaveBeenCalled()
    })

    it.each([
      ['invalid_declaration', 400, 'declaration'],
      ['rejected', 400, ''],
      ['unavailable', 503, ''],
    ] as const)(
      'answers %s without touching the cookie',
      async (reason, status, field) => {
        submitMock.mockResolvedValue({ ok: false, reason })

        const result = await runToData(
          'signature',
          formWithFile(pdf()),
          await detailsCookie(),
        )

        expect(result.init.status).toBe(status)
        expect(result.data.submissionResult.error[field]).toHaveLength(1)
        // `data()` with no headers: nothing overwrites the details.
        expect(
          new Headers(
            (result.init as unknown as { headers?: HeadersInit }).headers,
          ).has('Set-Cookie'),
        ).toBe(false)
      },
    )

    it('refuses the submit before reading the body when the address is not verified', async () => {
      const result = await runToData(
        'signature',
        formWithFile(pdf()),
        await pendingCookie(),
      )

      expect(result.init.status).toBe(403)
      expect(result.data.notice).toEqual({
        message: expect.stringContaining('e-mail není ověřený'),
        source: 'submit',
        tone: 'error',
      })
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('says the address is not verified even past the submit limit', async () => {
      const context = new RouterContextProvider()
      context.set(rateLimitContext, { retryAfter: 900 })

      const result = await runToData(
        'signature',
        formWithFile(pdf()),
        await pendingCookie(),
        context,
      )

      expect(result.init.status).toBe(403)
      expect(result.data.notice?.source).toBe('submit')
    })

    it('refuses the submit when another address was verified', async () => {
      const result = await runToData(
        'signature',
        formWithFile(pdf()),
        await cookieHeader({
          code: CODE,
          details: STORED_DETAILS,
          state: 'details',
          verifiedEmail: 'jan@local.dev',
        }),
      )

      expect(result.init.status).toBe(403)
      expect(submitMock).not.toHaveBeenCalled()
    })

    it('goes on to the sent page when it was already sent', async () => {
      const response = await runToResponse(
        'signature',
        formWithFile(pdf()),
        await cookieHeader({
          code: CODE,
          email: 'tereza@local.dev',
          state: 'sent',
        }),
      )

      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/sent`,
      )
      expect(submitMock).not.toHaveBeenCalled()
    })
  })

  describe('verify-code', () => {
    const verify = async (
      code: string,
      cookie: string,
      context?: RouterContextProvider,
    ) =>
      run(
        'signature?intent=verify-code',
        formDataOf({ code }),
        cookie,
        context,
      ).catch((thrown) => thrown)

    it('verifies the address with the code from the e-mail, written as the e-mail shows it', async () => {
      const code = createVerificationCode({
        email: 'tereza@local.dev',
        issuedAt: ISSUED_AT,
        purpose: 'membership-verify',
        secret: SECRET,
      })

      const response = (await verify(
        `${code.slice(0, 4)} ${code.slice(4)}`.toLowerCase(),
        await pendingCookie(),
      )) as Response

      expect(response.status).toBe(303)
      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/signature`,
      )
      const state = await readSetCookie(response)
      expect(state).toMatchObject({ verifiedEmail: 'tereza@local.dev' })
      expect(state).not.toHaveProperty('verification')
    })

    it('refuses a wrong code under the field', async () => {
      const result = (await verify(
        '22222222',
        await pendingCookie(),
      )) as ActionResult

      expect(result.init.status).toBe(400)
      expect(result.data.submissionResult.error?.code).toEqual([
        'Kód nesouhlasí. Zkontrolujte ho, nebo si pošlete nový.',
      ])
    })

    it('asks for the code, and for its length', async () => {
      const empty = (await verify('', await pendingCookie())) as ActionResult
      const short = (await verify(
        'K7M2',
        await pendingCookie(),
      )) as ActionResult

      expect(empty.data.submissionResult.error?.code).toEqual([
        'Zadejte kód z e-mailu.',
      ])
      expect(short.data.submissionResult.error?.code).toEqual([
        'Kód má 8 znaků.',
      ])
    })

    it('takes no code once it has expired', async () => {
      const issuedAt = issuedAgo(VERIFICATION_CODE_LIFETIME_MILLISECONDS + 1000)
      const code = createVerificationCode({
        email: 'tereza@local.dev',
        issuedAt,
        purpose: 'membership-verify',
        secret: SECRET,
      })

      const result = (await verify(
        code,
        await pendingCookie(issuedAt),
      )) as ActionResult

      expect(result.init.status).toBe(400)
      expect(setCookieOf(result)).toBeNull()
    })

    it('says when it can try again past the limit', async () => {
      const context = new RouterContextProvider()
      context.set(rateLimitContext, { retryAfter: 720 })

      const result = (await verify(
        '22222222',
        await pendingCookie(),
        context,
      )) as ActionResult

      expect(result.init.status).toBe(429)
      expect(result.data.notice).toEqual({
        message: 'Kód teď nelze ověřit. Zkuste to prosím za 12 minut.',
        source: 'code',
        tone: 'error',
      })
    })

    it('checks the honeypot first, even past the limit', async () => {
      vi.mocked(checkHoneypot).mockImplementationOnce(() => {
        throw new Response('Invalid form.', { status: 400 })
      })
      const context = new RouterContextProvider()
      context.set(rateLimitContext, { retryAfter: 720 })

      const response = (await verify(
        '22222222',
        await pendingCookie(),
        context,
      )) as Response

      expect(response.status).toBe(400)
    })
  })

  describe('send-code', () => {
    const sendAgain = async (cookie: string) =>
      (await run(
        'signature?intent=send-code',
        new FormData(),
        cookie,
      )) as unknown as ActionResult

    it('mails a new code and says the old one no longer works', async () => {
      const result = await sendAgain(await pendingCookie())

      expect(issueMock).toHaveBeenCalledExactlyOnceWith(
        'tereza@local.dev',
        expect.any(Request),
      )
      expect(result.data.notice).toEqual({
        message: 'Poslali jsme nový kód. Předchozí už neplatí.',
        source: 'code',
        tone: 'success',
      })
      const state = await readMembershipApplicationCookie(
        new Request(BASE_URL, {
          headers: { Cookie: (setCookieOf(result) ?? '').split(';')[0] },
        }),
      )
      expect(state).toMatchObject({ verification: { issuedAt: 1234 } })
    })

    it('keeps the live code when the new one did not go out', async () => {
      issueMock.mockResolvedValue({ status: 'failed' })

      const result = await sendAgain(await pendingCookie())

      expect(result.data.notice?.message).toMatch(/^Použijte dosavadní kód\./)
      expect(setCookieOf(result)).toBeNull()
    })

    it('sends to the button again when there is no live code', async () => {
      issueMock.mockResolvedValue({ status: 'failed' })

      const result = await sendAgain(
        await cookieHeader({
          code: CODE,
          details: STORED_DETAILS,
          state: 'details',
        }),
      )

      expect(result.data.notice?.message).toMatch(/tlačítko Poslat nový kód\./)
    })

    it('says when it can send again past the limit', async () => {
      issueMock.mockResolvedValue({ retryAfter: 720, status: 'limited' })

      const result = await sendAgain(await pendingCookie())

      expect(result.init.status).toBe(429)
      expect(result.data.notice?.message).toBe(
        'Ověřovací kód teď nelze poslat. Zkuste to prosím za 12 minut.',
      )
    })
  })

  it('sends an unknown step to the first', async () => {
    const response = await runToResponse('nonsense', new FormData())

    expect(response.headers.get('Location')).toBe(
      `${new URL(BASE_URL).pathname}/details`,
    )
  })
})
