import { parseWithZod } from '@conform-to/zod'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateMember } from './utils/update-member.server'

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const { memberId } = params

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

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['editorial_board_member'],
  })

  const currentMember = await prisma.editorialBoardMember.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      state: true,
    },
    where: { id: memberId },
  })

  // Check if author can update this member
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'editorial_board_member',
    state: currentMember.state,
    targetAuthorId: currentMember.author.id,
  })

  await updateMember(submission.value)

  return redirect(
    href('/administration/editorial-board/members/:memberId', { memberId }),
  )
}
