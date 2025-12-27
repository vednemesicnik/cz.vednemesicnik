import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createArticle } from './utils/create-article.server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await getMultipartFormData(request)
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

  const {
    title,
    slug,
    authorId,
    categoryIds,
    tagIds,
    images,
    featuredImageIndex,
    content,
  } = submission.value

  const { articleId } = await createArticle(request, {
    authorId,
    categoryIds,
    content,
    featuredImageIndex,
    images,
    slug,
    tagIds,
    title,
  })

  return redirect(href('/administration/articles/:articleId', { articleId }))
}
