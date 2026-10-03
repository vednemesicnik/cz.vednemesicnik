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
import { canChangeAuthorRole } from '~/utils/permissions/author/guards/can-change-author-role.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'
import { updateAuthor } from './utils/update-author.server'

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
    actions: ['update'],
    entities: ['author'],
  })

  // Get the author to check ownership; keep the current role to audit changes.
  const author = await prisma.author.findUniqueOrThrow({
    select: {
      role: { select: { id: true, name: true } },
      user: { select: { id: true } },
    },
    where: { id: submission.value.authorId },
  })

  // Check if user can update this author
  checkUserPermission(context, {
    action: 'update',
    entity: 'author',
    targetUserId: author.user?.id,
  })

  const isChangingRole = author.role.id !== submission.value.roleId

  // Updating one's own author profile doesn't allow changing its role.
  invariantResponse(
    !isChangingRole || canChangeAuthorRole(context),
    'Roli autora nemůžete změnit.',
    { status: 403 },
  )

  await updateAuthor(submission.value)

  // Audit only an actual role change. The new role is looked up after
  // updateAuthor has already validated roleId, so a tampered id can't surface as
  // a premature 500 here.
  if (isChangingRole) {
    const newRole = await prisma.authorRole.findUniqueOrThrow({
      select: { name: true },
      where: { id: submission.value.roleId },
    })

    recordAuditLog({
      actorId: context.userId,
      detail: formatRoleChangeDetail(author.role.name, newRole.name),
      event: 'author_role_changed',
      request,
      targetId: submission.value.authorId,
    })
  }

  return redirect(
    href('/administration/authors/:authorId', {
      authorId: submission.value.authorId,
    }),
  )
}
