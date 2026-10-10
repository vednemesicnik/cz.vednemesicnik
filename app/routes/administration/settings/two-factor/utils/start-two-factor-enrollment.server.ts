import QRCode from 'qrcode'

import { prisma } from '~/utils/db.server'
import { generateTOTP, getTOTPAuthUri } from '~/utils/totp.server'

import {
  getEnrollmentCookieSession,
  getPendingEnrollment,
  setEnrollmentCookieSession,
} from './two-factor-enrollment.server'

// Issuer shown in the authenticator app (kept in sync with the site name).
const TWO_FACTOR_ISSUER = 'Vedneměsíčník'

/**
 * Prepares the authenticator-app step of turning on two-factor authentication:
 * reuses the secret still pending in the enrollment cookie, or generates a new
 * one, so a scanned QR code stays valid until the cookie expires.
 *
 * @param request - The incoming request, carrying the enrollment cookie.
 * @param userId - The signed-in user the secret is bound to.
 * @param options - `fresh` discards a pending secret and generates a new one.
 * @returns The QR code as an SVG data URI, the secret, and the `Set-Cookie`
 *   header to send when a new secret was generated.
 */
export const startTwoFactorEnrollment = async (
  request: Request,
  userId: string,
  options: { fresh?: boolean } = {},
) => {
  const cookieSession = await getEnrollmentCookieSession(request)
  let config = options.fresh
    ? undefined
    : getPendingEnrollment(cookieSession, userId)
  let setCookieHeader: string | undefined

  if (config === undefined) {
    const generated = await generateTOTP()
    config = {
      algorithm: generated.algorithm,
      charSet: generated.charSet,
      digits: generated.digits,
      period: generated.period,
      secret: generated.secret,
    }
    setCookieHeader = await setEnrollmentCookieSession(request, userId, config)
  }

  const user = await prisma.user.findUniqueOrThrow({
    select: { email: true },
    where: { id: userId },
  })

  const otpUri = getTOTPAuthUri({
    accountName: user.email,
    algorithm: config.algorithm,
    digits: config.digits,
    issuer: TWO_FACTOR_ISSUER,
    period: config.period,
    secret: config.secret,
  })

  // Inline SVG (as a data URI) so the secret-bearing QR never lives in a
  // separately cacheable resource route.
  const qrCodeSvg = await QRCode.toString(otpUri, { margin: 0, type: 'svg' })

  return {
    qrCodeDataUri: `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSvg)}`,
    secret: config.secret,
    setCookieHeader,
  }
}
