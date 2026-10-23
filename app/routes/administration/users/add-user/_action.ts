import { parseWithZod } from '@conform-to/zod/v4'
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { INVITATION_CONFIG } from '~/config/invitation-config'
import { recordAuditLog } from '~/utils/audit-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'
import { createUser } from './utils/create-user.server'
import { sendInvitation } from './utils/send-invitation.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

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
    select: { level: true, name: true },
    where: { id: submission.value.roleId },
  })

  // Single-owner policy: the Owner role originates from the seed and is unique,
  // so a new user can never be created with it — even by an Owner actor.
  invariantResponse(
    targetRole.name !== 'owner',
    'Roli Owner nelze přiřadit. V systému může existovat pouze jeden Owner.',
    { status: 403 },
  )

  // Check if user can create users with the specified role
  checkUserPermission(context, {
    action: 'create',
    entity: 'user',
    targetUserRoleLevel: targetRole.level,
  })

  const { createdAuthorId, userId } = await createUser(submission.value)

  recordAuditLog({
    actorId: context.userId,
    event: 'user_created',
    request,
    targetId: userId,
  })

  // Only a new author was created here; an existing one only got the account (28b).
  if (createdAuthorId !== null) {
    recordAuditLog({
      actorId: context.userId,
      event: 'author_created',
      request,
      targetId: createdAuthorId,
    })
  }

  // The account exists either way; the detail says whether the invitation
  // went out (design 28e). Who invites is named by their author name.
  const inviter = await prisma.user.findUniqueOrThrow({
    select: { author: { select: { name: true } } },
    where: { id: context.userId },
  })

  const isSent = await sendInvitation({
    email: submission.value.email,
    inviterName: inviter.author.name,
  })

  const search = new URLSearchParams({
    [INVITATION_CONFIG.resultParam]: isSent
      ? INVITATION_CONFIG.result.sent
      : INVITATION_CONFIG.result.failed,
  })

  return redirect(
    `${href('/administration/users/:userId', { userId })}?${search}`,
  )
}
