import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { checkCSRF } from '~/utils/csrf.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getStatusCodeFromSubmissionStatus } from '~/utils/get-status-code-from-submission-status'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createPodcast } from './utils/create-podcast.server'

export async function action({ request }: Route.ActionArgs) {
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

  const { title, slug, description, cover, authorId } = submission.value

  // Check permissions
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['podcast'],
  })

  checkAuthorPermission(context, {
    action: 'create',
    entity: 'podcast',
    state: 'draft',
    targetAuthorIds: [authorId],
  })

  if (await isImageOverPixelBudget(cover)) {
    return data(
      {
        submissionResult: submission.reply({
          fieldErrors: { cover: [IMAGE_OVER_PIXEL_BUDGET_MESSAGE] },
        }),
      },
      { status: 400 },
    )
  }

  const { podcastId } = await createPodcast({
    actor: context,
    authorId,
    cover,
    description,
    slug,
    title,
  })

  return redirect(href('/administration/podcasts/:podcastId', { podcastId }))
}
