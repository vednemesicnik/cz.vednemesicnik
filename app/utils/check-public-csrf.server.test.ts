import { beforeEach, describe, expect, test, vi } from 'vitest'

import { FORM_CONFIG } from '~/config/form-config'

const { requireActionSessionMock } = vi.hoisted(() => ({
  requireActionSessionMock: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  requireActionSession: requireActionSessionMock,
}))

vi.stubEnv('SESSION_SECRET', 'test-secret')

const { commitCSRF } = await import('./csrf.server')
const { checkPublicCSRF } = await import('./check-public-csrf.server')

const MESSAGE = 'Přihlášku jsme neodeslali. Odešlete ji prosím znovu.'
const TOKEN_NAME = FORM_CONFIG.authenticityToken.name

const issueToken = async () => {
  const [token, setCookie] = await commitCSRF(new Request('http://localhost/'))
  if (setCookie === null) throw new Error('expected a new cookie')
  return { cookie: setCookie.split(';')[0], token }
}

const buildSubmission = (cookie: string | null, bodyToken?: string) => {
  const formData = new FormData()
  formData.append('name', 'Kultura')
  if (bodyToken !== undefined) formData.append(TOKEN_NAME, bodyToken)

  return {
    formData,
    request: new Request('http://localhost/editorial-board/enrolment', {
      headers: cookie === null ? {} : { Cookie: cookie },
      method: 'POST',
    }),
  }
}

describe('checkPublicCSRF', () => {
  beforeEach(() => {
    requireActionSessionMock.mockReset()
  })

  test('returns null for a matching token, with no session to check', async () => {
    const { cookie, token } = await issueToken()
    const { formData, request } = buildSubmission(cookie, token)

    await expect(
      checkPublicCSRF(formData, request, MESSAGE),
    ).resolves.toBeNull()
    expect(requireActionSessionMock).not.toHaveBeenCalled()
  })

  test('refuses a token that does not match the cookie', async () => {
    const { cookie } = await issueToken()
    const { formData, request } = buildSubmission(cookie, 'stale.token')

    const result = await checkPublicCSRF(formData, request, MESSAGE)

    expect(result?.init?.status).toBe(403)
  })

  test.each([
    ['no cookie', null, 'some.token'],
    ['no token in the body', 'vdm_csrf=', undefined],
  ])(
    'refuses with its own message and the kept values: %s',
    async (_case, cookie, bodyToken) => {
      const { formData, request } = buildSubmission(cookie, bodyToken)

      const result = await checkPublicCSRF(formData, request, MESSAGE)

      expect(result?.init?.status).toBe(403)
      expect(result?.data.submissionResult).toMatchObject({
        error: { '': [MESSAGE] },
        initialValue: { name: 'Kultura' },
        status: 'error',
      })
      expect(result?.data.submissionResult.initialValue).not.toHaveProperty(
        TOKEN_NAME,
      )
    },
  )
})
