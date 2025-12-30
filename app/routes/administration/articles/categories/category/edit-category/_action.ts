import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateCategory } from './utils/update-category.server'

export async function action({ request, params }: Route.ActionArgs) {
  const { categoryId } = params
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

  const { name, slug, authorId, state } = submission.value

  await updateCategory(request, {
    authorId,
    categoryId,
    name,
    slug,
    state,
  })

  return redirect(
    href('/administration/articles/categories/:categoryId', { categoryId }),
  )
}
