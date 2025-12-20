import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
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

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'podcast',
    redirectTo: href('/administration/podcasts/:podcastId', {
      podcastId: podcast.id,
    }),
    state: podcast.state,
    targetAuthorId: podcast.authorId,
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
