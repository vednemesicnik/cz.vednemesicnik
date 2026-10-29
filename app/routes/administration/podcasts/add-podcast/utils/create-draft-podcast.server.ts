import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'

import { deleteStaleEmptyPodcastDrafts } from './delete-stale-empty-podcast-drafts.server'

/**
 * Creates an empty podcast draft owned by the signed-in author (design 27e,
 * r1lh527v; log 0020). Nobody sees it until its first save with content. Empty
 * drafts left over from earlier clicks are cleared first.
 *
 * @param request - The action's request; the caller has checked the session.
 * @returns The new draft's id.
 * @throws A 403 response when the author may not create podcasts.
 */
export const createDraftPodcast = async (request: Request) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['podcast'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'podcast',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  // Housekeeping never fails the click: the next one clears what is left.
  await deleteStaleEmptyPodcastDrafts().catch((error: unknown) => {
    console.error('Failed to delete stale empty podcast drafts', error)
  })

  const draft = await prisma.podcast.create({
    data: { authorId: context.authorId },
    select: { id: true },
  })

  return { podcastId: draft.id }
}
