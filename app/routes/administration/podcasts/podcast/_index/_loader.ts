import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['podcast'],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              level: true,
            },
          },
        },
      },
      cover: {
        select: imageSourceSelect,
      },
      createdAt: true,
      description: true,
      id: true,
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      state: true,
      submittedAt: true,
      title: true,
    },
    where: { id: podcastId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  const flags = getContentActionFlags(context, 'podcast', {
    authors: [podcast.author],
    reviews: podcast.reviews,
    state: podcast.state,
    submittedAt: podcast.submittedAt,
  })

  return {
    podcast: {
      author: podcast.author,
      coverUrl: createImageSources('podcast-cover', podcast.cover).src ?? null,
      description: podcast.description,
      hasCover: !!podcast.cover,
      history: await getContentHistory({
        createdAt: podcast.createdAt,
        entity: 'podcast',
        entityId: podcast.id,
        publishedAt: podcast.publishedAt,
      }),
      id: podcast.id,
      publishedAt: createFormattedDate(podcast.publishedAt),
      state: podcast.state,
      title: podcast.title,
    },
    ...flags,
    submission: flags.submission?.state ?? null,
  }
}
