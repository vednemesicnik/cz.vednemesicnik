import { parseWithZod } from '@conform-to/zod'
import { href, redirect } from 'react-router'

import { validateCSRF } from '~/utils/csrf.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { createLink } from './utils/create-link.server'

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

  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['podcast_episode_link'],
  })

  const { authorId } = submission.value

  // Check if user can create draft links
  checkAuthorPermission(context, {
    action: 'create',
    entity: 'podcast_episode_link',
    state: 'draft',
    targetAuthorId: authorId,
  })

  const { linkId } = await createLink(submission.value)

  const { podcastId, episodeId } = submission.value

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
