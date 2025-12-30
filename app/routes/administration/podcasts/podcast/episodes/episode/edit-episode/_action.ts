import { parseWithZod } from '@conform-to/zod/v4'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateEpisode } from './utils/update-episode.server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return { submissionResult: submission.reply() }
  }

  const { episodeId, podcastId, number, title, slug, description, authorId } =
    submission.value

  // Get permission context
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast_episode'],
  })

  // Get existing episode to check current state and author
  const existingEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      authorId: true,
      state: true,
    },
    where: { id: episodeId },
  })

  // Check permission to update THIS specific episode
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode',
    errorMessage: 'You do not have permission to update this episode.',
    state: existingEpisode.state,
    targetAuthorId: existingEpisode.authorId,
  })

  // Check permission to assign the SELECTED author
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode',
    errorMessage:
      'You do not have permission to assign this author to the episode.',
    state: existingEpisode.state,
    targetAuthorId: authorId,
  })

  await updateEpisode({
    authorId,
    description,
    id: episodeId,
    number,
    slug,
    title,
  })

  return redirect(
    href('/administration/podcasts/:podcastId/episodes/:episodeId', {
      episodeId,
      podcastId,
    }),
  )
}
