import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'

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

  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  // Scope the delete to the current user's own passkeys so a credential id can
  // never be used to remove another account's passkey.
  await prisma.passkey.deleteMany({
    where: { id: submission.value.passkeyId, userId: context.userId },
  })

  return redirect('/administration/settings/profile/passkeys')
}
