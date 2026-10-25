import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { getPodcastActions } from '../../utils/get-podcast-actions'
import { getPodcastHeaderMenu } from '../../utils/get-podcast-header-menu'
import type { Route } from './+types/route'
import { loadEpisodeTable } from './utils/load-episode-table.server'

export const loader = async ({ request, params, url }: Route.LoaderArgs) => {
  const { podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'create',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['podcast', 'podcast_episode'],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      _count: { select: { episodes: true } },
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
      slug: true,
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

  const submission = flags.submission?.state ?? null
  const actions = getPodcastActions({
    ...flags,
    state: podcast.state,
    submission,
  })

  const [episodeTable, history, publishedEpisodeCount] = await Promise.all([
    loadEpisodeTable({ context, podcast, request, url }),
    getContentHistory({
      createdAt: podcast.createdAt,
      entity: 'podcast',
      entityId: podcast.id,
      publishedAt: podcast.publishedAt,
    }),
    // What the archive dialog says leaves the web with it (27a).
    prisma.podcastEpisode.count({
      where: { podcastId: podcast.id, state: 'published' },
    }),
  ])

  return {
    canCreateEpisode: context.can({
      action: 'create',
      entity: 'podcast_episode',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    // Upravit is a button beside Nová epizoda, on a draft only (27b).
    canEdit: actions.includes('edit'),
    episodeTable,
    isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
    menu: getPodcastHeaderMenu(actions),
    podcast: {
      authorName: podcast.author.name,
      cover:
        podcast.cover === null
          ? null
          : createImageSources('podcast-cover', podcast.cover),
      description: podcast.description,
      episodeCount: podcast._count.episodes,
      history,
      id: podcast.id,
      // The date only of a podcast on the web (27b).
      publishedDate:
        podcast.state === 'published' && podcast.publishedAt !== null
          ? formatNumericDate(podcast.publishedAt)
          : null,
      publishedEpisodeCount,
      slug: podcast.slug,
      state: podcast.state,
      title: podcast.title,
    },
    submission,
  }
}
