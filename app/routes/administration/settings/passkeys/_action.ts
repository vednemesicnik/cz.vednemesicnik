import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, redirect } from 'react-router'

import { requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { requireRecentAuthentication } from '~/utils/recent-authentication.server'

import { schema } from './_schema'

export const action = async ({ request, url }: ActionFunctionArgs) => {
  await requireRecentAuthentication({ request, url })

  const formData = await request.formData()
  await requireCSRF(formData, request)

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

  return redirect('/administration/settings/passkeys')
}
