import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createArticle } from './utils/create-article.server'

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

  const { title, slug, content, categoryIds, tagIds, authorId } =
    submission.value

  const { id: articleId } = await createArticle(request, {
    authorId,
    categoryIds,
    content,
    slug,
    tagIds,
    title,
  })

  return redirect(
    href('/administration/articles/:articleId', {
      articleId,
    }),
  )
}
