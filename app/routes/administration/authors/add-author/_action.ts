import { parseWithZod } from '@conform-to/zod/v4'
import { type ActionFunctionArgs, data, href, redirect } from 'react-router'

import { flashCreatedAuthor } from '~/utils/created-author/flash-created-author.server'
import { checkCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'

import { schema } from './_schema'
import { createAuthor } from './utils/create-author.server'

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
    entities: ['author'],
  })

  // Check if user can create authors
  checkUserPermission(context, {
    action: 'create',
    entity: 'author',
  })

  const { authorId } = await createAuthor(submission.value)

  // From an article's author search, back to the editor, which chooses the
  // new author, in place of the replaced one if any (design 24j, ivyin4kr).
  // The author goes in a one-time cookie, not the address, so no link can
  // change an article's authors.
  const articleId = formData.get('article')
  const replacedAuthorId = formData.get('replace')
  if (typeof articleId === 'string' && articleId !== '') {
    return redirect(
      href('/administration/articles/:articleId/edit-article', { articleId }),
      {
        headers: {
          'Set-Cookie': await flashCreatedAuthor(request, {
            articleId,
            authorId,
            replacedAuthorId:
              typeof replacedAuthorId === 'string' && replacedAuthorId !== ''
                ? replacedAuthorId
                : null,
          }),
        },
      },
    )
  }

  return redirect(href('/administration/authors/:authorId', { authorId }))
}
