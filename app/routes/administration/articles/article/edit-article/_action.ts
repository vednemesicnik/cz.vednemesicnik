import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateArticle } from './utils/update-article.server'

export async function action({ request, params }: Route.ActionArgs) {
  const { articleId } = params

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
    content,
    categoryIds,
    tagIds,
    authorId,
    state,
    imagesToDelete,
    newImages,
    featuredImageId,
    newFeaturedImageIndex,
  } = submission.value

  await updateArticle(request, {
    articleId,
    authorId,
    categoryIds,
    content,
    featuredImageId,
    imagesToDelete,
    newFeaturedImageIndex,
    newImages,
    slug,
    state,
    tagIds,
    title,
  })

  return redirect(
    href('/administration/articles/:articleId', {
      articleId,
    }),
  )
}
