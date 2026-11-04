import { RouterContextProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { checkPublicCSRF } from '~/utils/check-public-csrf.server'
import { issueEnrolmentLink } from '~/utils/editorial-board-enrolment/issue-enrolment-link.server'
import { readEnrolmentSentCookie } from '~/utils/editorial-board-enrolment/read-enrolment-sent-cookie.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import { rateLimitContext } from '~/utils/rate-limit.server'

import { action } from './_action'

vi.mock('~/utils/honeypot.server', () => ({ checkHoneypot: vi.fn() }))
vi.mock('~/utils/check-public-csrf.server', () => ({
  checkPublicCSRF: vi.fn(),
}))
vi.mock(
  '~/utils/editorial-board-enrolment/issue-enrolment-link.server',
  () => ({ issueEnrolmentLink: vi.fn() }),
)

const honeypotMock = vi.mocked(checkHoneypot)
const csrfMock = vi.mocked(checkPublicCSRF)
const issueMock = vi.mocked(issueEnrolmentLink)

const URL_PATH = 'http://localhost/editorial-board/enrolment'
const FIELDS = {
  email: 'Tereza@Local.dev',
  firstName: 'Tereza',
  interest: 'psaní, focení',
  lastName: 'Malá',
  phone: '604 123 456',
}

type ActionResult = {
  data: {
    submissionResult: {
      error: Record<string, string[]> | null
      initialValue: Record<string, unknown>
    }
  }
  init: { status: number }
}

const run = (
  values: Record<string, string> = FIELDS,
  context = new RouterContextProvider(),
) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(values)) body.set(name, value)

  return action({
    context,
    request: new Request(URL_PATH, { body, method: 'POST' }),
  } as never)
}

const runToData = async (...args: Parameters<typeof run>) =>
  (await run(...args)) as unknown as ActionResult

// A redirect is thrown; `data()` is returned.
const runToRedirect = async (...args: Parameters<typeof run>) => {
  const result = await run(...args).catch((thrown) => thrown)
  if (!(result instanceof Response)) throw new Error('Expected a redirect.')
  return result
}

const limitedContext = () => {
  const context = new RouterContextProvider()
  context.set(rateLimitContext, { retryAfter: 720 })
  return context
}

describe('editorial-board enrolment action', () => {
  beforeEach(() => {
    honeypotMock.mockReset()
    csrfMock.mockReset().mockResolvedValue(null)
    issueMock.mockReset().mockResolvedValue({ status: 'sent' })
  })

  it('issues the link for the lower-cased address and moves on', async () => {
    const before = Date.now()

    const response = await runToRedirect()

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe(
      '/editorial-board/enrolment/sent',
    )
    expect(issueMock).toHaveBeenCalledExactlyOnceWith('tereza@local.dev', {
      formSubmittedAt: expect.any(String),
      interest: 'psaní, focení',
      name: 'Tereza Malá',
      phone: '604 123 456',
    })

    const submittedAt = issueMock.mock.lastCall?.[1].formSubmittedAt ?? ''
    expect(new Date(submittedAt).getTime()).toBeGreaterThanOrEqual(before)
    expect(submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z$/)
  })

  it('hands the sent page the address in its cookie, not in the URL', async () => {
    const response = await runToRedirect()
    const cookie = (response.headers.get('Set-Cookie') ?? '').split(';')[0]

    expect(response.headers.get('Location')).not.toContain('tereza')
    await expect(
      readEnrolmentSentCookie(
        new Request(`${URL_PATH}/sent`, { headers: { Cookie: cookie } }),
      ),
    ).resolves.toBe('tereza@local.dev')
  })

  it('checks the honeypot first, even when rate-limited', async () => {
    honeypotMock.mockImplementation(() => {
      throw new Response('Invalid form.', { status: 400 })
    })

    const response = await runToRedirect(FIELDS, limitedContext())

    expect(response.status).toBe(400)
    expect(csrfMock).not.toHaveBeenCalled()
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('returns what the CSRF check refuses with, before the rate limit', async () => {
    const refusal = { refused: true }
    csrfMock.mockResolvedValue(refusal as never)

    await expect(run(FIELDS, limitedContext())).resolves.toBe(refusal)
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('says when to try again past the limit, and keeps the values', async () => {
    const result = await runToData(FIELDS, limitedContext())

    expect(result.init.status).toBe(429)
    expect(result.data.submissionResult.error?.['']).toEqual([
      'Přihlášku teď nelze odeslat. Zkuste to prosím za 12 minut.',
    ])
    expect(result.data.submissionResult.initialValue).toMatchObject(FIELDS)
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('checks the limit before the fields', async () => {
    const result = await runToData({ email: 'jan@priklad' }, limitedContext())

    expect(result.init.status).toBe(429)
    expect(result.data.submissionResult.error?.email).toBeUndefined()
  })

  it('answers invalid fields under the fields and stores nothing', async () => {
    const result = await runToData({ ...FIELDS, email: 'jan@priklad' })

    expect(result.init.status).toBe(400)
    expect(result.data.submissionResult.error?.email).toEqual([
      'Zadejte e-mail ve tvaru jmeno@priklad.cz.',
    ])
    expect(issueMock).not.toHaveBeenCalled()
  })

  it('says when to try again past the limit on the address', async () => {
    issueMock.mockResolvedValue({ retryAfter: 720, status: 'limited' })

    const result = await runToData()

    expect(result.init.status).toBe(429)
    expect(result.data.submissionResult.error?.['']).toEqual([
      'Přihlášku teď nelze odeslat. Zkuste to prosím za 12 minut.',
    ])
    expect(result.data.submissionResult.initialValue).toMatchObject(FIELDS)
  })

  it('keeps the values and says so when the link did not go out', async () => {
    issueMock.mockResolvedValue({ status: 'failed' })

    const result = await runToData()

    expect(result.init.status).toBe(503)
    expect(result.data.submissionResult.error?.['']).toEqual([
      'Přihlášku se nepodařilo odeslat. Údaje zůstaly vyplněné, zkuste to znovu.',
    ])
    expect(result.data.submissionResult.initialValue).toMatchObject(FIELDS)
  })
})
