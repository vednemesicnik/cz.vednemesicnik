import { createCookie, redirect } from 'react-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FORM_CONFIG } from '~/config/form-config'

const { requireActionSessionMock } = vi.hoisted(() => ({
  requireActionSessionMock: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  requireActionSession: requireActionSessionMock,
}))

vi.stubEnv('SESSION_SECRET', 'test-secret')

const { checkCSRF, commitCSRF, requireCSRF } = await import('./csrf.server')

const TOKEN_NAME = FORM_CONFIG.authenticityToken.name

const toCookieHeader = (setCookie: string) => setCookie.split(';')[0]

const issueToken = async () => {
  const [token, setCookie] = await commitCSRF(new Request('http://localhost/'))
  if (setCookie === null) throw new Error('expected a new cookie')
  return { cookie: toCookieHeader(setCookie), token }
}

const buildSubmission = (cookie: string | null, bodyToken?: string) => {
  const formData = new FormData()
  formData.append('name', 'Kultura')
  formData.append('newPassword', 'secret-value')
  if (bodyToken !== undefined) formData.append(TOKEN_NAME, bodyToken)

  const headers = new Headers({
    Referer: 'http://localhost/administration/articles?page=2',
  })
  if (cookie !== null) headers.set('Cookie', cookie)

  return {
    formData,
    request: new Request('http://localhost/administration/articles', {
      headers,
      method: 'POST',
    }),
  }
}

const caught = async (promise: Promise<unknown>) => {
  try {
    await promise
  } catch (error) {
    return error as { data: unknown; init: { status: number } }
  }
  throw new Error('expected a throw')
}

beforeEach(() => {
  requireActionSessionMock.mockReset().mockResolvedValue({ userId: 'u1' })
})

describe('commitCSRF', () => {
  test('keeps a valid token', async () => {
    const { cookie, token } = await issueToken()

    const [nextToken, setCookie] = await commitCSRF(
      new Request('http://localhost/', { headers: { Cookie: cookie } }),
    )

    expect(nextToken).toBe(token)
    expect(setCookie).toBeNull()
  })

  test('reissues a token whose signature fails', async () => {
    const forged = await createCookie('vdm_csrf', {
      secrets: ['test-secret'],
    }).serialize('value.forged-signature')

    const [token, setCookie] = await commitCSRF(
      new Request('http://localhost/', {
        headers: { Cookie: toCookieHeader(forged) },
      }),
    )

    expect(token).not.toBe('value.forged-signature')
    expect(setCookie).not.toBeNull()
  })
})

describe('requireCSRF', () => {
  test('passes a matching token', async () => {
    const { cookie, token } = await issueToken()
    const { formData, request } = buildSubmission(cookie, token)

    await expect(requireCSRF(formData, request)).resolves.toBeUndefined()
  })

  test('throws the token marker with the page the action was sent from', async () => {
    const { cookie } = await issueToken()
    const { formData, request } = buildSubmission(cookie, 'other.token')

    const error = await caught(requireCSRF(formData, request))

    expect(error.init.status).toBe(403)
    expect(error.data).toEqual({
      cause: 'csrf',
      href: '/administration/articles?page=2',
    })
  })

  test('checks the session before the token', async () => {
    requireActionSessionMock.mockRejectedValue(
      redirect('/administration/sign-in'),
    )
    const { formData, request } = buildSubmission(null)

    const error = await caught(requireCSRF(formData, request))

    expect(error).toBeInstanceOf(Response)
    expect((error as unknown as Response).status).toBe(302)
  })
})

describe('checkCSRF', () => {
  test('returns null for a matching token', async () => {
    const { cookie, token } = await issueToken()
    const { formData, request } = buildSubmission(cookie, token)

    await expect(checkCSRF(formData, request)).resolves.toBeNull()
  })

  test('returns the form message and keeps the submitted values', async () => {
    const { formData, request } = buildSubmission(null, 'some.token')

    const result = await checkCSRF(formData, request)

    expect(result?.init?.status).toBe(403)
    expect(result?.data.submissionResult).toMatchObject({
      error: { '': ['Stiskněte stejné tlačítko znovu — nic se neprovedlo.'] },
      initialValue: { name: 'Kultura' },
      status: 'error',
    })
    expect(result?.data.submissionResult.initialValue).not.toHaveProperty(
      'newPassword',
    )
    expect(result?.data.submissionResult.initialValue).not.toHaveProperty(
      TOKEN_NAME,
    )
  })
})
