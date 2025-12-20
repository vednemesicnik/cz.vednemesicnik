import { parseWithZod } from '@conform-to/zod'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { updateLink } from './utils/update-link.server'

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const submission = await parseWithZod(formData, {
    async: true,
    schema,
  })

  if (submission.status !== 'success') {
    return { submissionResult: submission.reply() }
  }

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast_episode_link'],
  })

  const { episodeId, linkId } = params

  // Get episode state and link author to check permissions
  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    select: { state: true },
    where: { id: episodeId },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    select: { authorId: true },
    where: { id: linkId },
  })

  const [episode, link] = await Promise.all([episodePromise, linkPromise])

  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode_link',
    state: episode.state,
    targetAuthorId: link.authorId,
  })

  const { label, url } = submission.value

  await updateLink({ label, linkId, url })

  const { podcastId } = submission.value

  return redirect(
    href(
      '/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId',
      {
        episodeId,
        linkId,
        podcastId,
      },
    ),
  )
}
