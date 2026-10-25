import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { INVITATION_CONFIG } from '~/config/invitation-config'
import { recordAuditLog } from '~/utils/audit-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { publishAccountEvent } from '~/utils/sse/publish-account-event.server'
import { EMAIL_TAKEN_MESSAGE } from '../utils/email-taken-message'
import { isEmailTaken } from '../utils/is-email-taken.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createUser } from './utils/create-user.server'
import { sendInvitation } from './utils/send-invitation.server'

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const context = await getUserPermissionContext(request, {
    actions: ['create'],
    entities: ['user', 'author'],
  })

  // Single-owner policy (log 0003): the box chooses between Člen and
  // Administrátor, so no request can create an Owner, not even an Owner's.
  const role = await prisma.userRole.findUniqueOrThrow({
    select: { id: true, level: true },
    where: {
      name: submission.value.isAdministrator ? 'administrator' : 'member',
    },
  })

  checkUserPermission(context, {
    action: 'create',
    entity: 'user',
    targetUserRoleLevel: role.level,
  })

  // A new author too, which only the Administrator and the Owner create (28c).
  if (submission.value.authorMode === 'new') {
    checkUserPermission(context, { action: 'create', entity: 'author' })
  }

  // A taken address is a plain field error, as on Upravit uživatele (28f,
  // oosyl0xv); the unique constraint stays the fallback for a race.
  if (await isEmailTaken({ email: submission.value.email })) {
    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { email: [EMAIL_TAKEN_MESSAGE] },
        }),
      },
      { status: 400 },
    )
  }

  const { createdAuthorId, userId } = await createUser({
    ...submission.value,
    roleId: role.id,
  })

  recordAuditLog({
    actorId: context.userId,
    event: 'user_created',
    request,
    targetId: userId,
  })

  // One event for the user and the author it may bring: the account pages
  // listen to both entities.
  publishAccountEvent({ change: 'create', entity: 'user', entityId: userId })

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

  // The fetcher's redirect navigates to the new user's detail (28e, p8x1s8gs).
  return redirect(
    `${href('/administration/users/:userId', { userId })}?${search}`,
  )
}
