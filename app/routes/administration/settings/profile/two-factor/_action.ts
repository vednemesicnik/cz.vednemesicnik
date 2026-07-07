import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { FORM_CONFIG } from '~/config/form-config'
import {
  deleteBackupCodes,
  regenerateBackupCodes,
} from '~/utils/backup-codes.server'
import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { verifyTOTP } from '~/utils/totp.server'
import {
  deleteUserTwoFactor,
  getUserTwoFactor,
  upsertUserTwoFactor,
} from '~/utils/two-factor.server'

import { schema } from './_schema'
import {
  deleteEnrollmentCookieSession,
  getEnrollmentCookieSession,
  getPendingEnrollment,
} from './utils/two-factor-enrollment.server'

// Backup codes are secret and shown once — never let this response be cached.
const noStoreHeaders = { 'Cache-Control': 'no-store' }

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  checkUserPermission(context, {
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  })

  const intent = formData.get(FORM_CONFIG.intent.name)

  // Disabling 2FA removes the stored Verification row and any backup codes,
  // which are meaningless without an enrolled second factor.
  if (intent === FORM_CONFIG.intent.value.delete) {
    await deleteUserTwoFactor(context.userId)
    await deleteBackupCodes(context.userId)

    return redirect('/administration/settings/profile/two-factor')
  }

  // Regenerate backup codes for an already-enrolled user, invalidating the old
  // set. Only meaningful while 2FA is active.
  if (intent === FORM_CONFIG.intent.value.regenerateBackupCodes) {
    const twoFactor = await getUserTwoFactor(context.userId)

    if (twoFactor === null) {
      return redirect('/administration/settings/profile/two-factor')
    }

    const backupCodes = await regenerateBackupCodes(context.userId)

    return data({ backupCodes }, { headers: noStoreHeaders })
  }

  const submission = await parseWithZod(formData, { async: true, schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const cookieSession = await getEnrollmentCookieSession(request)
  const config = getPendingEnrollment(cookieSession, context.userId)

  if (config === undefined) {
    return data(
      {
        submissionResult: submission.reply({
          formErrors: [
            'Platnost QR kódu vypršela. Načtěte stránku znovu a zkuste to prosím znovu.',
          ],
        }),
      },
      { status: 400 },
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
        submissionResult: submission.reply({
          fieldErrors: {
            code: ['Kód je nesprávný nebo jeho platnost vypršela.'],
          },
        }),
      },
      { status: 400 },
    )
  }

  await upsertUserTwoFactor(context.userId, config)

  // Issue the initial backup codes so the user can save a fallback right away.
  const backupCodes = await regenerateBackupCodes(context.userId)

  // Stay on the page (the loader revalidates to the enrolled view) and surface
  // the codes once, clearing the now-confirmed enrollment cookie.
  return data(
    { backupCodes },
    {
      headers: {
        ...noStoreHeaders,
        'Set-Cookie': await deleteEnrollmentCookieSession(cookieSession),
      },
    },
  )
}
