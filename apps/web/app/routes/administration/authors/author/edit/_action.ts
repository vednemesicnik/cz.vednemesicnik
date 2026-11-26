import { parseWithZod } from '@conform-to/zod/v4'
import { data } from 'react-router'
import { getLatestRoleChange } from '~/utils/audit-log/get-latest-role-change.server'
import {
  formatRoleChangeDetail,
  recordAuditLog,
} from '~/utils/audit-log.server'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import { publishAccountEvent } from '~/utils/sse/publish-account-event.server'
import { editAuthorRecordSchema } from '../../utils/author-record-schema'
import type { Route } from './+types/route'
import { updateAuthor } from './utils/update-author.server'

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const submission = parseWithZod(formData, { schema: editAuthorRecordSchema })

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

  // Any author, so a role sent without that right is never written (28c).
  checkUserPermission(context, { action: 'update', entity: 'author' })

  const { authorId } = params
  const author = await prisma.author.findUnique({
    select: { id: true },
    where: { id: authorId },
  })

  if (author === null) {
    throw data(null, { status: 404 })
  }

  const result = await updateAuthor({ authorId, ...submission.value })

  // Name and bio are saved even when the role collides.
  publishAccountEvent({
    change: 'update',
    entity: 'author',
    entityId: authorId,
  })

  if (result.status === 'role-conflict') {
    // Name and bio are saved; the role waits for a second look (lj22mnbm).
    return {
      currentRoleId: result.currentRoleId,
      roleChange: await getLatestRoleChange({
        event: 'author_role_changed',
        roleName: result.currentRoleName,
        targetId: authorId,
      }),
      status: 'role-conflict' as const,
    }
  }

  if (result.status === 'role-changed') {
    // The history of the author's detail (28b).
    recordAuditLog({
      actorId: context.userId,
      detail: formatRoleChangeDetail(result.previousRoleName, result.roleName),
      event: 'author_role_changed',
      request,
      targetId: authorId,
    })
  }

  return { status: 'success' as const }
}
