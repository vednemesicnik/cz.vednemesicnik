import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'

import { schema } from './_schema'
import { addMember } from './utils/add-member.server'

export async function action({ request }: ActionFunctionArgs) {
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

  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['editorial_board_member'],
  })

  // Check if author can create editorial board members
  checkAuthorPermission(context, {
    action: 'create',
    entity: 'editorial_board_member',
  })

  const { memberId } = await addMember(submission.value)

  return redirect(
    href('/administration/editorial-board/members/:memberId', { memberId }),
  )
}
