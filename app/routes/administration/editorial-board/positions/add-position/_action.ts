import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'

import { getSchema } from './_schema'
import { addPosition } from './utils/add-position.server'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  const submission = await parseWithZod(formData, {
    async: true,
    schema: getSchema(editorialBoardPositionsCount),
  })

  if (submission.status !== 'success') {
    return data(
      { submissionResult: submission.reply() },
      { status: getStatusCodeFromSubmissionStatus(submission.status) },
    )
  }

  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['editorial_board_position'],
  })

  // Check if author can create editorial board positions
  checkAuthorPermission(context, {
    action: 'create',
    entity: 'editorial_board_position',
  })

  const { positionId } = await addPosition(submission.value)

  return redirect(
    href('/administration/editorial-board/positions/:positionId', {
      positionId,
    }),
  )
}
