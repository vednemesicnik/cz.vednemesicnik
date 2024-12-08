import crypto from "crypto"

import { createCookie } from "react-router"

import { formConfig } from "~/config/form-config"

const SEPARATOR = "."
const ENCODING = "base64url"
const DEFAULT_BYTES = 32

const environment = process.env.NODE_ENV ?? "development"
const sessionSecrets = process.env.SESSION_SECRET?.split(",")
const csrfSecret = sessionSecrets?.[0] ?? ""

const cookie = createCookie("vdm_csrf", {
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: environment === "production",
  secrets: sessionSecrets,
  maxAge: 60 * 60 * 24, // 1 day
})

function sign(token: string) {
  return crypto.createHmac("sha256", csrfSecret).update(token).digest(ENCODING)
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
  const existingCsrfToken = await cookie.parse(request.headers.get("cookie"))

  const csrfToken =
    typeof existingCsrfToken === "string" ? existingCsrfToken : generate(bytes)

  const csrfCookie = existingCsrfToken
    ? null
    : await cookie.serialize(csrfToken)

  return [csrfToken, csrfCookie] as const
}

export type CSRFErrorCode =
  | "missing_token_in_cookie"
  | "invalid_token_in_cookie"
  | "tampered_token_in_cookie"
  | "missing_token_in_body"
  | "mismatched_token"

export class CSRFError extends Error {
  code: CSRFErrorCode
  constructor(code: CSRFErrorCode, message: string) {
    super(message)
    this.code = code
    this.name = "CSRFError"
  }
}

async function validate(formData: FormData, headers: Headers) {
  const csrfFormDataKey = formConfig.authenticityToken.name

  if (formData instanceof Request && formData.bodyUsed) {
    throw new Error(
      "The body of the request was read before calling CSRF#verify. Ensure you clone it before reading it."
    )
  }

  const csrfCookie = await cookie.parse(headers.get("cookie"))

  // if the session doesn't have a csrf token, throw an error
  if (csrfCookie === null) {
    throw new CSRFError(
      "missing_token_in_cookie",
      "Can't find CSRF token in cookie."
    )
  }

  if (typeof csrfCookie !== "string") {
    throw new CSRFError(
      "invalid_token_in_cookie",
      "Invalid CSRF token in cookie."
    )
  }

  if (!verifySignature(csrfCookie)) {
    throw new CSRFError(
      "tampered_token_in_cookie",
      "Tampered CSRF token in cookie."
    )
  }

  // if the body doesn't have a csrf token, throw an error
  if (!formData.get(csrfFormDataKey)) {
    throw new CSRFError(
      "missing_token_in_body",
      "Can't find CSRF token in body."
    )
  }

  // if the body csrf token doesn't match the session csrf token, throw an
  // error
  if (formData.get(csrfFormDataKey) !== csrfCookie) {
    throw new CSRFError(
      "mismatched_token",
      "Can't verify CSRF token authenticity."
    )
  }
}

export const validateCSRF = async (formData: FormData, headers: Headers) => {
  try {
    await validate(formData, headers)
  } catch (error) {
    if (error instanceof CSRFError) {
      throw new Response("Invalid CSRF token", { status: 403 })
    }

    throw error
  }
}
