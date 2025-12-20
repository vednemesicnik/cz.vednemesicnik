import { parseWithZod } from '@conform-to/zod'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getMultipartFormData } from '~/utils/get-multipart-form-data'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updatePodcast } from './utils/update-podcast.server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await getMultipartFormData(request)
  await validateCSRF(formData, request.headers)

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
    },
    where: { id },
  })

  // Check permission to update THIS specific podcast
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    errorMessage: 'You do not have permission to update this podcast.',
    state: existingPodcast.state,
    targetAuthorId: existingPodcast.authorId,
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    errorMessage:
      'You do not have permission to assign this author to the podcast.',
    state: existingPodcast.state,
    targetAuthorId: authorId,
  })

  await updatePodcast({
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
