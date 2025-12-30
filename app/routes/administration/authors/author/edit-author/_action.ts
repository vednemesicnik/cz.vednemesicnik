import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'
import { updateAuthor } from './utils/update-author.server'

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
    actions: ['update'],
    entities: ['author'],
  })

  // Get the author to check ownership
  const author = await prisma.author.findUniqueOrThrow({
    select: {
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

  await updateAuthor(submission.value)

  return redirect(
    href('/administration/authors/:authorId', {
      authorId: submission.value.authorId,
    }),
  )
}
