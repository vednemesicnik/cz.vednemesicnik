import { data, href, redirect } from 'react-router'
import { canChooseRecordAuthor } from '~/routes/administration/articles/utils/can-choose-record-author'
import { getArticleHold } from '~/routes/administration/articles/utils/get-article-hold'
import { flashAdminNotice } from '~/utils/admin-notice/flash-admin-notice.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'
import { findPublishedEpisodeConflict } from '../../utils/find-published-episode-conflict.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId, episodeId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['podcast_episode'],
  })

  const episode = await prisma.podcastEpisode.findUnique({
    select: {
      author: { select: { id: true, name: true } },
      cover: { select: imageSourceSelect },
      description: true,
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      id: true,
      links: {
        orderBy: { order: 'asc' },
        select: { id: true, label: true, url: true },
      },
      number: true,
      podcast: {
        select: {
          cover: { select: imageSourceSelect },
          id: true,
          slug: true,
          title: true,
        },
      },
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { role: { select: { level: true } } } },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
      title: true,
      updatedAt: true,
    },
    where: { id: episodeId },
  })

  // The address names the podcast; an episode of another one is not here.
  if (episode === null || episode.podcast.id !== podcastId) {
    throw data(null, { status: 404 })
  }

  requireContentUpdatePermission(context, {
    authorIds: [episode.author.id],
    id: episodeId,
    kind: 'episode',
    podcastId,
    state: episode.state,
    // The denial (30d) names the episode as the list does.
    title: formatEpisodeTitle(episode),
  })

  // A submitted episode is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: episode.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(episode, {
    authorId: context.authorId,
    now: new Date(),
  })

  // Someone else edits it: only the Coordinator gets the takeover dialog; the
  // others go to the detail (24g). An empty draft has no detail (0020), so to
  // the podcast.
  if (hold !== null && !hold.isOwn && !isApprover) {
    throw redirect(
      episode.firstContentAt === null
        ? href('/administration/podcasts/:podcastId', { podcastId })
        : href('/administration/podcasts/:podcastId/episodes/:episodeId', {
            episodeId,
            podcastId,
          }),
      {
        headers: {
          'Set-Cookie': await flashAdminNotice(
            request,
            `Epizodu právě upravuje ${hold.heldByName}.`,
          ),
        },
      },
    )
  }

  const [authors, conflict] = await Promise.all([
    // Only the Coordinator chooses the author (27d, as 25c).
    canChooseRecordAuthor(context.roleLevel)
      ? getAuthorsByPermission(
          context,
          'podcast_episode',
          'update',
          episode.state,
        )
      : Promise.resolve(null),
    // Another episode holds the number or the address as published: the
    // field says so from the start (27f).
    findPublishedEpisodeConflict({
      episodeId,
      number: episode.number,
      podcastId,
      slug: episode.slug,
    }),
  ])

  const submission = getSubmissionState(episode)
  const { podcast } = episode

  return {
    authors,
    episode: {
      authorId: episode.author.id,
      // Its own cover, if any; without it the episode goes out with the
      // podcast's (27d).
      cover:
        episode.cover === null
          ? null
          : {
              altText: episode.cover.altText,
              sources: createImageSources(
                'podcast-episode-cover',
                episode.cover,
              ),
            },
      description: episode.description,
      freeNumber: conflict.freeNumber,
      // An empty draft (log 0020) is left for the podcast's list.
      isEmptyDraft: episode.firstContentAt === null,
      links: episode.links,
      number: episode.number,
      slug: episode.slug,
      slugSuggestion: conflict.slugSuggestion,
      state: episode.state,
      // Sent for approval, or approved: the tag and the line of 24c.
      submission:
        submission === null
          ? null
          : { date: submission.date.toISOString(), state: submission.state },
      takenNumber: conflict.takenNumber,
      takenSlug: conflict.takenSlug,
      title: episode.title,
      // The last save, which the editor's hold takes back only over (24i).
      updatedAt: episode.updatedAt.toISOString(),
    },
    isApprover,
    // One's own episode has no sentence over it (24c).
    isOwn: episode.author.id === context.authorId,
    podcast: {
      cover:
        podcast.cover === null
          ? null
          : {
              altText: podcast.cover.altText,
              sources: createImageSources('podcast-cover', podcast.cover),
            },
      slug: podcast.slug,
      // A podcast saved without a title goes by a name (copy utgh1hb7).
      title: getPodcastDisplayTitle(podcast.title),
    },
  }
}
