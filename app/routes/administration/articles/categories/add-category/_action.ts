import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createCategory } from './utils/create-category.server'

export async function action({ request }: Route.ActionArgs) {
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

  const { name, slug, authorId } = submission.value

  const { id: categoryId } = await createCategory(request, {
    authorId,
    name,
    slug,
  })

  return redirect(
    href('/administration/articles/categories/:categoryId', {
      categoryId,
    }),
  )
}
