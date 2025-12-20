import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'
import { createUser } from './utils/create-user.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const context = await getUserPermissionContext(request, {
    actions: ['create'],
    entities: ['user'],
  })

  // Get the target role to check hierarchy
  const targetRole = await prisma.userRole.findUniqueOrThrow({
    select: { level: true },
    where: { id: submission.value.roleId },
  })

  // Check if user can create users with the specified role
  checkUserPermission(context, {
    action: 'create',
    entity: 'user',
    targetUserRoleLevel: targetRole.level,
  })

  const { userId } = await createUser(submission.value)

  return redirect(href('/administration/users/:userId', { userId }))
}
