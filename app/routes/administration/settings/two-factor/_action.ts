import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import { regenerateBackupCodes } from '~/utils/backup-codes.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canUseEmergencyPassword } from '~/utils/permissions/user/guards/can-use-emergency-password'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { requireRecentAuthentication } from '~/utils/recent-authentication.server'
import { verifyTOTP } from '~/utils/totp.server'
import {
  disableUserTwoFactor,
  enableUserTwoFactor,
  getUserTwoFactor,
} from '~/utils/two-factor.server'

import { schema } from './_schema'
import { startTwoFactorEnrollment } from './utils/start-two-factor-enrollment.server'
import {
  deleteEnrollmentCookieSession,
  getEnrollmentCookieSession,
  getPendingEnrollment,
} from './utils/two-factor-enrollment.server'

// The secret, the QR code and the backup codes are shown once — never let a
// response of this action be cached.
const noStoreHeaders = { 'Cache-Control': 'no-store' }

export const action = async ({ request, url }: ActionFunctionArgs) => {
  await requireRecentAuthentication({ request, url })

  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  checkUserPermission(context, {
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  })

  // Two-factor guards the emergency password sign-in: Owner and Administrator only.
  if (!canUseEmergencyPassword(context.roleLevel)) {
    throw data(null, { status: 403 })
  }

  const intent = formData.get(FORM_CONFIG.intent.name)

  // Disabling 2FA removes the stored Verification row and any backup codes
  // (atomically), which are meaningless without an enrolled second factor.
  if (intent === FORM_CONFIG.intent.value.delete) {
    await disableUserTwoFactor(context.userId)

    return { status: 'disabled' as const }
  }

  // Regenerate backup codes for an already-enrolled user, invalidating the old
  // set. Only meaningful while 2FA is active.
  if (intent === FORM_CONFIG.intent.value.regenerateBackupCodes) {
    if ((await getUserTwoFactor(context.userId)) === null) {
      throw data(null, { status: 409 })
    }

    const backupCodes = await regenerateBackupCodes(context.userId)

    return data(
      { backupCodes, status: 'codes' as const },
      { headers: noStoreHeaders },
    )
  }

  // Turning 2FA on only makes sense on top of a password (design 29c).
  const password = await prisma.password.findUnique({
    select: { userId: true },
    where: { userId: context.userId },
  })

  if (password === null) {
    throw data(null, { status: 409 })
  }

  if (intent === FORM_CONFIG.intent.value.startEnrollment) {
    const { qrCodeDataUri, secret, setCookieHeader } =
      await startTwoFactorEnrollment(request, context.userId)

    return data(
      { qrCodeDataUri, secret, status: 'enrollment' as const },
      {
        headers: setCookieHeader
          ? { ...noStoreHeaders, 'Set-Cookie': setCookieHeader }
          : noStoreHeaders,
      },
    )
  }

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return data(
      { status: 'error' as const, submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const cookieSession = await getEnrollmentCookieSession(request)
  const config = getPendingEnrollment(cookieSession, context.userId)

  // The pending secret expired: hand out a new QR code and key in place, so the
  // dialog can go on without reloading the page (design 29c).
  if (config === undefined) {
    const { qrCodeDataUri, secret, setCookieHeader } =
      await startTwoFactorEnrollment(request, context.userId, { fresh: true })

    return data(
      {
        qrCodeDataUri,
        secret,
        status: 'enrollment' as const,
        submissionResult: submission.reply({
          formErrors: [
            'Použijte nový QR kód nebo klíč — předchozí už vypršel.',
          ],
        }),
      },
      {
        headers: setCookieHeader
          ? { ...noStoreHeaders, 'Set-Cookie': setCookieHeader }
          : noStoreHeaders,
        status: 400,
      },
    )
  }

  const result = await verifyTOTP({
    algorithm: config.algorithm,
    charSet: config.charSet,
    digits: config.digits,
    otp: submission.value.code,
    period: config.period,
    secret: config.secret,
  })

  if (result === null) {
    return data(
      {
        status: 'error' as const,
        submissionResult: submission.reply({
          fieldErrors: {
            code: [
              'Zadejte aktuální kód z aplikace — tento nesouhlasí nebo už vypršel.',
            ],
          },
        }),
      },
      { status: 400 },
    )
  }

  // Enable 2FA and issue the initial backup codes atomically, so enrollment and
  // codes can't fall out of sync on a transient failure.
  const backupCodes = await enableUserTwoFactor(context.userId, config)

  // Surface the codes once and clear the now-confirmed enrollment cookie.
  return data(
    { backupCodes, status: 'codes' as const },
    {
      headers: {
        ...noStoreHeaders,
        'Set-Cookie': await deleteEnrollmentCookieSession(cookieSession),
      },
    },
  )
}
