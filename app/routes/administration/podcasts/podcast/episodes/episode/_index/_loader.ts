import { data, href, redirect } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { episodeId } = params

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
    entities: ['podcast_episode'],
  })

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
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
      firstContentAt: true,
      id: true,
      links: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, url: true },
      },
      number: true,
      podcast: {
        select: {
          id: true,
          state: true,
          title: true,
        },
      },
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
    where: { id: episodeId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // An empty draft has no detail yet (log 0020): its editor is the page.
  if (episode.firstContentAt === null) {
    throw redirect(
      href(
        '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
        { episodeId, podcastId: episode.podcast.id },
      ),
    )
  }

  const flags = getContentActionFlags(context, 'podcast_episode', {
    authors: [episode.author],
    reviews: episode.reviews,
    state: episode.state,
    submittedAt: episode.submittedAt,
  })

  // Until its podcast is published, an episode is neither submitted nor
  // published (27f); the server refuses both too.
  const isPodcastPublished = episode.podcast.state === 'published'
  const canPublish = flags.canPublish && isPodcastPublished

  return {
    ...flags,
    canPublish,
    canPublishBackdated: canPublish && context.roleLevel <= APPROVER_ROLE_LEVEL,
    canSubmit: flags.canSubmit && isPodcastPublished,
    episode: {
      author: episode.author,
      coverUrl:
        createImageSources('podcast-episode-cover', episode.cover).src ?? null,
      description: episode.description,
      hasCover: !!episode.cover,
      history: await getContentHistory({
        createdAt: episode.createdAt,
        entity: 'podcast_episode',
        entityId: episode.id,
        publishedAt: episode.publishedAt,
      }),
      id: episode.id,
      links: episode.links,
      number: episode.number,
      podcast: episode.podcast,
      publishedAt: createFormattedDate(episode.publishedAt),
      slug: episode.slug,
      state: episode.state,
      title: episode.title,
    },
    submission: flags.submission?.state ?? null,
  }
}
