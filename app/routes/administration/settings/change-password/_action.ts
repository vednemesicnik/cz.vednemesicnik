import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data } from 'react-router'

import { checkCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canUseEmergencyPassword } from '~/utils/permissions/user/guards/can-use-emergency-password'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { requireRecentAuthentication } from '~/utils/recent-authentication.server'

import { schema } from './_schema'
import { changePassword } from './utils/change-password.server'

export const action = async ({ request, url }: ActionFunctionArgs) => {
  await requireRecentAuthentication({ request, url })

  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const context = await getUserPermissionContext(request, {
    actions: ['update'],
    entities: ['user'],
  })

  // Whose password changes comes from the session, never from the form.
  checkUserPermission(context, {
    action: 'update',
    entity: 'user',
    targetUserId: context.userId,
  })

  // The password is the emergency sign-in path: Owner and Administrator only.
  if (!canUseEmergencyPassword(context.roleLevel)) {
    throw data(null, { status: 403 })
  }

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return data(
      { status: 'error' as const, submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  await changePassword(context.userId, submission.value.newPassword)

  return { status: 'success' as const }
}
