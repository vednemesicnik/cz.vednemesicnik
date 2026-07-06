import QRCode from 'qrcode'
import { data, type LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { generateTOTP, getTOTPAuthUri } from '~/utils/totp.server'
import { getUserTwoFactor } from '~/utils/two-factor.server'

import {
  getEnrollmentCookieSession,
  getPendingEnrollment,
  setEnrollmentCookieSession,
} from './utils/two-factor-enrollment.server'

// Issuer shown in the authenticator app (kept in sync with the site name).
const TWO_FACTOR_ISSUER = 'Vedneměsíčník'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  const canUpdate = context.can({
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  }).hasPermission

  if (!canUpdate) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Never cache this page: it carries the enrollment secret and QR.
  const noStoreHeaders = { 'Cache-Control': 'no-store' }

  // Already enrolled — no secret is exposed, only the enabled state.
  const existing = await getUserTwoFactor(context.userId)
  if (existing !== null) {
    return data(
      {
        isEnrolled: true as const,
        qrCodeDataUri: null,
        secret: null,
        userId: context.userId,
      },
      { headers: noStoreHeaders },
    )
  }

  const user = await prisma.user.findUniqueOrThrow({
    select: { email: true },
    where: { id: context.userId },
  })

  // Reuse the pending secret across refreshes so a scanned QR stays valid; only
  // generate (and set the cookie) when there is nothing pending yet.
  const cookieSession = await getEnrollmentCookieSession(request)
  let config = getPendingEnrollment(cookieSession, context.userId)
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
    setCookieHeader = await setEnrollmentCookieSession(
      request,
      context.userId,
      config,
    )
  }

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
  const qrCodeDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSvg)}`

  return data(
    {
      isEnrolled: false as const,
      qrCodeDataUri,
      secret: config.secret,
      userId: context.userId,
    },
    {
      headers: setCookieHeader
        ? { ...noStoreHeaders, 'Set-Cookie': setCookieHeader }
        : noStoreHeaders,
    },
  )
}
