import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { checkCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateArticle } from './utils/update-article.server'

export async function action({ request, params }: Route.ActionArgs) {
  const { articleId } = params

  const formData = await getMultipartFormData(request)
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

  const {
    title,
    slug,
    content,
    editTabId,
    excerpt,
    categoryIds,
    tagIds,
    authorIds,
    existingImages,
    images,
    featuredImage,
  } = submission.value

  const result = await updateArticle(request, {
    articleId,
    authorIds,
    categoryIds,
    content,
    excerpt,
    existingImages,
    featuredImage,
    images,
    slug,
    tabId: editTabId,
    tagIds,
    title,
  })

  // Another tab or someone else holds the article: the editor turns read-only
  // and keeps what was typed (24h).
  if (result.status === 'not-held') {
    return data(
      { heldByName: result.heldByName, submissionResult: undefined },
      { status: 409 },
    )
  }

  return redirect(
    href('/administration/articles/:articleId', {
      articleId,
    }),
  )
}
