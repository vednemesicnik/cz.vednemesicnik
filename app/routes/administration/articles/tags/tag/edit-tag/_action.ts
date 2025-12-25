import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'
import { validateCSRF } from '~/utils/csrf.server'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateTag } from './utils/update-tag.server'

export async function action({ request, params }: Route.ActionArgs) {
  const { tagId } = params
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

  await updateTag(request, {
    authorId,
    name,
    slug,
    state,
    tagId,
  })

  return redirect(href('/administration/articles/tags/:tagId', { tagId }))
}
