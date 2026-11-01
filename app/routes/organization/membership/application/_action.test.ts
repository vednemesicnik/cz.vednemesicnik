import { RouterContextProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MAX_DECLARATION_BYTES } from '~/config/membership-application-config'
import { checkHoneypot } from '~/utils/honeypot.server'
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

const submitMock = vi.mocked(submitMembershipApplication)

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
  data: { submissionResult: { error: Record<string, string[]> } }
  init: { status: number }
}

const cookieHeader = async (
  state: Parameters<typeof writeMembershipApplicationCookie>[0],
) => (await writeMembershipApplicationCookie(state)).split(';')[0]

const detailsCookie = () =>
  cookieHeader({ code: CODE, details: STORED_DETAILS, state: 'details' })

const run = (
  stepName: string,
  body: FormData,
  cookie?: string,
  context = new RouterContextProvider(),
) =>
  action({
    context,
    params: { stepName },
    request: new Request(`${BASE_URL}/${stepName}`, {
      body,
      headers: cookie === undefined ? {} : { Cookie: cookie },
      method: 'POST',
    }),
  } as never)

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
  })

  describe('details', () => {
    it('stores valid details under a new code and moves on', async () => {
      const response = await runToResponse('details', formDataOf(FORM_DETAILS))

      expect(response.status).toBe(303)
      expect(response.headers.get('Location')).toBe(
        `${new URL(BASE_URL).pathname}/signature`,
      )
      expect(await readSetCookie(response)).toEqual({
        code: expect.stringMatching(/^VDM-/),
        details: STORED_DETAILS,
        state: 'details',
      })
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
        await cookieHeader({ code: CODE, details, state: 'details' }),
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

  it('sends an unknown step to the first', async () => {
    const response = await runToResponse('nonsense', new FormData())

    expect(response.headers.get('Location')).toBe(
      `${new URL(BASE_URL).pathname}/details`,
    )
  })
})
