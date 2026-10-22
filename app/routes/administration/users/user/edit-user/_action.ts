import type { SubmissionResult } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import { invariantResponse } from '@epic-web/invariant'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import {
  formatRoleChangeDetail,
  recordAuditLog,
} from '~/utils/audit-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { hasEmailChanged } from '~/utils/has-email-changed'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { canEditUser } from '~/utils/permissions/user/guards/can-edit-user'

import { schema } from './_schema'
import { findEmailOwner } from './utils/find-email-owner.server'
import { formatEmailTakenMessage } from './utils/format-email-taken-message'
import { sendEmailChangeNotice } from './utils/send-email-change-notice.server'
import { updateUser } from './utils/update-user'

type ActionData = {
  emailOwner?: { name: string; userId: string }
  submissionResult: SubmissionResult<string[]>
}

// Declared, because inference drops the taken-address branch: its data is a
// subtype of the CSRF failure's, and TypeScript reduces the union to the latter.
export const action = async ({
  request,
}: ActionFunctionArgs): Promise<
  Response | ReturnType<typeof data<ActionData>>
> => {
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
    actions: ['update'],
    entities: ['user'],
  })

  // Get the target user's current role and the new role being assigned
  const [targetUser, newRole] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      select: {
        email: true,
        id: true,
        role: {
          select: {
            level: true,
            name: true,
          },
        },
      },
      where: { id: submission.value.userId },
    }),
    prisma.userRole.findUniqueOrThrow({
      select: {
        level: true,
        name: true,
      },
      where: { id: submission.value.roleId },
    }),
  ])

  // Prevent Owner from changing their own role
  const isEditingSelf = targetUser.id === context.userId
  const isOwner = targetUser.role.name === 'owner'
  const isChangingRole = targetUser.role.name !== newRole.name

  invariantResponse(
    !(isEditingSelf && isOwner && isChangingRole),
    'Owner nemůže změnit svou vlastní roli. V systému musí vždy existovat alespoň jeden Owner.',
    { status: 403 },
  )

  // Single-owner policy: the Owner role originates from the seed and is unique.
  // Reject changing the Owner's role away from owner, and reject promoting
  // anyone else to owner — even for an Owner actor via a direct POST.
  invariantResponse(
    !(isOwner && newRole.name !== 'owner'),
    'Roli Owner nelze změnit. V systému musí vždy existovat právě jeden Owner.',
    { status: 403 },
  )

  invariantResponse(
    !(!isOwner && newRole.name === 'owner'),
    'Roli Owner nelze přiřadit. V systému může existovat pouze jeden Owner.',
    { status: 403 },
  )

  // Only an Administrator or the Owner edits accounts here, at the current role
  // level and at the one being assigned; the generic denial (design 30h)
  const canEdit = [targetUser.role.level, newRole.level].every((roleLevel) =>
    canEditUser(context, {
      targetUserId: targetUser.id,
      targetUserRoleLevel: roleLevel,
    }),
  )

  if (!canEdit) {
    throw data(null, { status: 403 })
  }

  // A taken address is a field error naming the account (28e); the unique
  // constraint in updateUser stays the fallback for a race.
  const emailOwner = await findEmailOwner(submission.value)

  if (emailOwner !== null) {
    return data(
      {
        emailOwner,
        submissionResult: submission.reply({
          fieldErrors: { email: [formatEmailTakenMessage(emailOwner.name)] },
        }),
      },
      { status: 400 },
    )
  }

  await updateUser(submission.value)

  // The old address always hears of a change, naming who made it (28f). The
  // save stands whether or not the notice goes out.
  if (hasEmailChanged(targetUser.email, submission.value.email)) {
    const actor = await prisma.user.findUniqueOrThrow({
      select: { author: { select: { name: true } } },
      where: { id: context.userId },
    })

    await sendEmailChangeNotice({
      changedByName: actor.author.name,
      newEmail: submission.value.email,
      oldEmail: targetUser.email,
    })
  }

  if (isChangingRole) {
    recordAuditLog({
      actorId: context.userId,
      detail: formatRoleChangeDetail(targetUser.role.name, newRole.name),
      event: 'user_role_changed',
      request,
      targetId: targetUser.id,
    })
  }

  return redirect(
    href('/administration/users/:userId', { userId: submission.value.userId }),
  )
}
