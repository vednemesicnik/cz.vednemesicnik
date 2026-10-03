import crypto from 'node:crypto'

import { parseWithZod } from '@conform-to/zod/v4'
import { createCookie, data } from 'react-router'
import { z } from 'zod'

import { adminCsrfFormMessage } from '~/components/boundary-error/utils/boundary-copy'
import type { ForbiddenData } from '~/components/boundary-error/utils/boundary-data'
import { FORM_CONFIG } from '~/config/form-config'
import { requireActionSession } from '~/utils/auth.server'
import { getRefererPath } from '~/utils/get-referer-path'

const SEPARATOR = '.'
const ENCODING = 'base64url'
const DEFAULT_BYTES = 32

const environment = process.env.NODE_ENV ?? 'development'
const sessionSecrets = process.env.SESSION_SECRET?.split(',')
const csrfSecret = sessionSecrets?.[0] ?? ''

const cookie = createCookie('vdm_csrf', {
  httpOnly: true,
  maxAge: 60 * 60 * 24, // 1 day
  path: '/',
  sameSite: 'lax',
  secrets: sessionSecrets,
  secure: environment === 'production',
})

function sign(token: string) {
  return crypto.createHmac('sha256', csrfSecret).update(token).digest(ENCODING)
}

function generate(bytes = DEFAULT_BYTES) {
  const token = crypto.randomBytes(bytes).toString(ENCODING)
  const signature = sign(token)

  return [token, signature].join(SEPARATOR)
}

function verifySignature(token: string) {
  const [value, signature] = token.split(SEPARATOR)
  const expectedSignature = sign(value)
  return signature === expectedSignature
}

export const commitCSRF = async (request: Request, bytes = DEFAULT_BYTES) => {
  const existingCsrfToken = await cookie.parse(request.headers.get('cookie'))

  // A token that fails its signature is reissued too, or every submit would fail.
  const isValidToken =
    typeof existingCsrfToken === 'string' && verifySignature(existingCsrfToken)

  const csrfToken = isValidToken ? existingCsrfToken : generate(bytes)

  const csrfCookie = isValidToken ? null : await cookie.serialize(csrfToken)

  return [csrfToken, csrfCookie] as const
}

export type CSRFErrorCode =
  | 'missing_token_in_cookie'
  | 'invalid_token_in_cookie'
  | 'tampered_token_in_cookie'
  | 'missing_token_in_body'
  | 'mismatched_token'

export class CSRFError extends Error {
  code: CSRFErrorCode
  constructor(code: CSRFErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = 'CSRFError'
  }
}

async function validate(formData: FormData, headers: Headers) {
  const csrfFormDataKey = FORM_CONFIG.authenticityToken.name

  if (formData instanceof Request && formData.bodyUsed) {
    throw new Error(
      'The body of the request was read before calling CSRF#verify. Ensure you clone it before reading it.',
    )
  }

  const csrfCookie = await cookie.parse(headers.get('cookie'))

  // if the session doesn't have a csrf token, throw an error
  if (csrfCookie === null) {
    throw new CSRFError(
      'missing_token_in_cookie',
      "Can't find CSRF token in cookie.",
    )
  }

  if (typeof csrfCookie !== 'string') {
    throw new CSRFError(
      'invalid_token_in_cookie',
      'Invalid CSRF token in cookie.',
    )
  }

  if (!verifySignature(csrfCookie)) {
    throw new CSRFError(
      'tampered_token_in_cookie',
      'Tampered CSRF token in cookie.',
    )
  }

  // if the body doesn't have a csrf token, throw an error
  if (!formData.get(csrfFormDataKey)) {
    throw new CSRFError(
      'missing_token_in_body',
      "Can't find CSRF token in body.",
    )
  }

  // if the body csrf token doesn't match the session csrf token, throw an
  // error
  if (formData.get(csrfFormDataKey) !== csrfCookie) {
    throw new CSRFError(
      'mismatched_token',
      "Can't verify CSRF token authenticity.",
    )
  }
}

const isValidCSRF = async (formData: FormData, headers: Headers) => {
  try {
    await validate(formData, headers)
    return true
  } catch (error) {
    if (error instanceof CSRFError) return false
    throw error
  }
}

/**
 * Guards an action whose result no form shows — an intent sent with one click, a
 * deletion — (design 30h). Checks the session first, then the token; an invalid token
 * throws the 403 token marker, and the boundary renders `Akce se neprovedla` with
 * `Načíst znovu` back to the page the action was sent from.
 *
 * @param formData - The submitted form data.
 * @param request - The submitted request.
 */
export const requireCSRF = async (formData: FormData, request: Request) => {
  await requireActionSession(request)

  if (await isValidCSRF(formData, request.headers)) return

  const forbidden: ForbiddenData = {
    cause: 'csrf',
    href: getRefererPath(request),
  }

  throw data(forbidden, { status: 403 })
}

/**
 * Guards an action whose form stays on screen and shows its result (design 30h).
 * Checks the session first, then the token. An invalid token isn't thrown: the
 * returned reply puts `Stiskněte stejné tlačítko znovu — nic se neprovedlo.` on the
 * form and keeps the submitted values. The authenticated layout revalidates after a
 * 403, so the form gets a fresh token and the second press goes through.
 *
 * @param formData - The submitted form data.
 * @param request - The submitted request.
 * @returns `null` for a valid token, otherwise the response the action returns.
 */
export const checkCSRF = async (formData: FormData, request: Request) => {
  await requireActionSession(request)

  if (await isValidCSRF(formData, request.headers)) return null

  const submission = parseWithZod(formData, { schema: z.object({}) })

  return data(
    {
      submissionResult: submission.reply({
        formErrors: [adminCsrfFormMessage],
      }),
    },
    { status: 403 },
  )
}
