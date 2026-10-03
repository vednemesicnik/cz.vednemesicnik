import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['podcast'],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
        },
      },
      authorId: true,
      cover: {
        select: {
          id: true,
        },
      },
      description: true,
      id: true,
      slug: true,
      state: true,
      title: true,
    },
    where: { id: params.podcastId },
  })

  requireContentUpdatePermission(context, {
    authorIds: [podcast.authorId],
    id: params.podcastId,
    kind: 'podcast',
    state: podcast.state,
    title: podcast.title,
  })

  const authors = await getAuthorsByPermission(
    context,
    'podcast',
    'update',
    podcast.state,
  )

  return {
    authors,
    podcast,
  }
}
