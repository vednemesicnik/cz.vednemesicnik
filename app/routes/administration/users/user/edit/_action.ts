import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { flashAdminNotice } from '~/utils/admin-notice/flash-admin-notice.server'
import { getLatestRoleChange } from '~/utils/audit-log/get-latest-role-change.server'
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
import { USER_RECORD_COPY } from '../../user-record-copy'
import { EMAIL_TAKEN_MESSAGE } from '../../utils/email-taken-message'
import { isEmailTaken } from '../../utils/is-email-taken.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { isRemovingOwnAdministration } from './utils/is-removing-own-administration'
import { sendEmailChangeNotice } from './utils/send-email-change-notice.server'
import { updateUser } from './utils/update-user.server'

export const action = async ({ request, params }: Route.ActionArgs) => {
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
    actions: ['update'],
    entities: ['user'],
  })

  const { userId } = params
  const targetUser = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      role: { select: { level: true, name: true } },
    },
    where: { id: userId },
  })

  if (targetUser === null) {
    throw data(null, { status: 404 })
  }

  const { email, isAdministrator, loadedRoleId } = submission.value

  // Single-owner policy (log 0003): the Owner's role never changes, so the
  // Owner's form sends none, and the box offers only Člen and Administrátor.
  if (targetUser.role.name === 'owner' && loadedRoleId !== undefined) {
    throw data(null, { status: 403 })
  }

  const requestedRole =
    loadedRoleId === undefined
      ? null
      : await prisma.userRole.findUniqueOrThrow({
          select: { id: true, level: true, name: true },
          where: { name: isAdministrator ? 'administrator' : 'member' },
        })

  // Only an Administrator or the Owner edits accounts here, at the stored role
  // level and at the one being assigned; the generic denial (design 30h)
  const canEdit = [
    targetUser.role.level,
    ...(requestedRole === null ? [] : [requestedRole.level]),
  ].every((roleLevel) =>
    canEditUser(context, {
      targetUserId: targetUser.id,
      targetUserRoleLevel: roleLevel,
    }),
  )

  if (!canEdit) {
    throw data(null, { status: 403 })
  }

  // A taken address is a plain field error, without whose it is (28f,
  // log 0039); the unique constraint in updateUser stays the fallback for a
  // race.
  if (await isEmailTaken({ email, userId })) {
    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { email: [EMAIL_TAKEN_MESSAGE] },
        }),
      },
      { status: 400 },
    )
  }

  const result = await updateUser({
    email,
    role:
      requestedRole === null || loadedRoleId === undefined
        ? null
        : { ...requestedRole, loadedRoleId },
    userId,
  })

  // The old address always hears of a change, naming who made it (28f). The
  // save stands whether or not the notice goes out; the e-mail is saved on a
  // role collision too.
  if (hasEmailChanged(targetUser.email, email)) {
    const actor = await prisma.user.findUniqueOrThrow({
      select: { author: { select: { name: true } } },
      where: { id: context.userId },
    })

    await sendEmailChangeNotice({
      changedByName: actor.author.name,
      newEmail: email,
      oldEmail: targetUser.email,
    })
  }

  if (result.status === 'role-conflict') {
    // The e-mail is saved; the role waits for a second look (lj22mnbm).
    return {
      currentRoleId: result.currentRoleId,
      isAdministrator: result.currentRoleName === 'administrator',
      roleChange: await getLatestRoleChange({
        event: 'user_role_changed',
        roleName: result.currentRoleName,
        targetId: userId,
      }),
      status: 'role-conflict' as const,
    }
  }

  if (result.status === 'role-changed') {
    // The history of the user's detail (28b).
    recordAuditLog({
      actorId: context.userId,
      detail: formatRoleChangeDetail(result.previousRoleName, result.roleName),
      event: 'user_role_changed',
      request,
      targetId: userId,
    })

    // Without the administration, the user pages are closed to them now:
    // on to Přehled, with the toast (28g, copy dn09cn6e).
    if (
      isRemovingOwnAdministration({
        isAdministratorChecked: isAdministrator,
        isLoadedAdministrator: result.previousRoleName === 'administrator',
        isOwnAccount: userId === context.userId,
      })
    ) {
      throw redirect(href('/administration'), {
        headers: {
          'Set-Cookie': await flashAdminNotice(
            request,
            USER_RECORD_COPY.toasts.saved,
          ),
        },
      })
    }
  }

  return { status: 'success' as const }
}
