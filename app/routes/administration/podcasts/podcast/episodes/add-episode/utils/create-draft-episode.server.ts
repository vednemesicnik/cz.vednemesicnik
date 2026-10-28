import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'

import { getNextFreeEpisodeNumber } from '../../utils/get-next-free-episode-number.server'
import { deleteStaleEmptyEpisodeDrafts } from './delete-stale-empty-episode-drafts.server'

/**
 * Creates an empty draft in the podcast, owned by the signed-in author, with
 * the next free number already in (design 27d, 00l7fuiu): only a published
 * number is unique, so the prefill blocks nobody (log 0048). Nobody sees it
 * until its first save (log 0020). Empty drafts left over from earlier clicks
 * are cleared first.
 *
 * @param request - The action's request; the caller has checked the session.
 * @param podcastId - The podcast the episode belongs to; it never changes.
 * @returns The new draft's id.
 * @throws A 403 response when the author may not create episodes, a 404 one
 *   when the podcast is gone or the author may not see it.
 */
export const createDraftEpisode = async (
  request: Request,
  podcastId: string,
) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create', 'view'],
    entities: ['podcast_episode', 'podcast'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'podcast_episode',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  const podcast = await prisma.podcast.findUnique({
    select: { authorId: true, firstContentAt: true, state: true },
    where: { id: podcastId },
  })
  // A podcast the author may not see is a 404, like a missing one (30e). So is
  // an empty podcast draft: it has no page yet (log 0020), and an episode
  // would keep its sweep from deleting it.
  if (
    podcast === null ||
    podcast.firstContentAt === null ||
    !context.can({
      action: 'view',
      entity: 'podcast',
      state: podcast.state,
      targetAuthorIds: [podcast.authorId],
    }).hasPermission
  ) {
    throw data(null, { status: 404 })
  }

  // Housekeeping never fails the click: the next one clears what is left.
  await deleteStaleEmptyEpisodeDrafts().catch((error: unknown) => {
    console.error('Failed to delete stale empty episode drafts', error)
  })

  const draft = await prisma.podcastEpisode.create({
    data: {
      authorId: context.authorId,
      number: await getNextFreeEpisodeNumber({ podcastId }),
      podcastId,
    },
    select: { id: true },
  })

  return { episodeId: draft.id }
}
