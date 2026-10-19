import { parseWithZod } from '@conform-to/zod/v4'
import { data, href, redirect } from 'react-router'

import { IMAGE_OVER_PIXEL_BUDGET_MESSAGE } from '~/config/image-variants-config'
import { checkCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { isImageOverPixelBudget } from '~/utils/image-store/is-image-over-pixel-budget.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updatePodcast } from './utils/update-podcast.server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await getMultipartFormData(request)
  const csrfFailure = await checkCSRF(formData, request)
  if (csrfFailure !== null) return csrfFailure

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return { submissionResult: submission.reply() }
  }

  const { id, title, slug, description, coverId, cover, authorId } =
    submission.value

  // Get permission context
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast'],
  })

  // Get existing podcast to check current state and author
  const existingPodcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      authorId: true,
      state: true,
      submittedAt: true,
    },
    where: { id },
  })

  // Check permission to update THIS specific podcast
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    state: existingPodcast.state,
    targetAuthorIds: [existingPodcast.authorId],
  })

  // A submitted draft is locked for its author (design 07d).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: existingPodcast.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    state: existingPodcast.state,
    targetAuthorIds: [authorId],
  })

  if (cover !== undefined && (await isImageOverPixelBudget(cover))) {
    return {
      submissionResult: submission.reply({
        fieldErrors: { cover: [IMAGE_OVER_PIXEL_BUDGET_MESSAGE] },
      }),
    }
  }

  await updatePodcast({
    actor: context,
    authorId,
    cover,
    coverId,
    description,
    id,
    slug,
    title,
  })

  return redirect(
    href('/administration/podcasts/:podcastId', { podcastId: id }),
  )
}
