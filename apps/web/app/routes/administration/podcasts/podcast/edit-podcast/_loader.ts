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

import { findPublishedPodcastConflict } from '../../utils/find-published-podcast-conflict.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['podcast'],
  })

  const podcast = await prisma.podcast.findUnique({
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
    where: { id: podcastId },
  })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  requireContentUpdatePermission(context, {
    authorIds: [podcast.author.id],
    id: podcastId,
    kind: 'podcast',
    state: podcast.state,
    // The denial (30d) names the podcast as the list does.
    title: getPodcastDisplayTitle(podcast.title),
  })

  // A submitted podcast is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: podcast.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(podcast, {
    authorId: context.authorId,
    now: new Date(),
  })

  // Someone else edits it: only the Coordinator gets the takeover dialog; the
  // others go to the podcast's page (24g). An empty draft has no page (0020),
  // so to the list.
  if (hold !== null && !hold.isOwn && !isApprover) {
    throw redirect(
      podcast.firstContentAt === null
        ? href('/administration/podcasts')
        : href('/administration/podcasts/:podcastId', { podcastId }),
      {
        headers: {
          'Set-Cookie': await flashAdminNotice(
            request,
            `Podcast právě upravuje ${hold.heldByName}.`,
          ),
        },
      },
    )
  }

  const [authors, conflict] = await Promise.all([
    // Only the Coordinator chooses the author (27e, as 25c).
    canChooseRecordAuthor(context.roleLevel)
      ? getAuthorsByPermission(context, 'podcast', 'update', podcast.state)
      : Promise.resolve(null),
    // Another podcast holds the address as published: the field says so from
    // the start (27e, 2whigbz5).
    findPublishedPodcastConflict({ podcastId, slug: podcast.slug }),
  ])

  const submission = getSubmissionState(podcast)

  return {
    authors,
    isApprover,
    // One's own podcast has no sentence over it (24c).
    isOwn: podcast.author.id === context.authorId,
    podcast: {
      authorId: podcast.author.id,
      cover:
        podcast.cover === null
          ? null
          : {
              altText: podcast.cover.altText,
              // A square is recommended; another shape is cropped on the web (27e).
              isSquare:
                podcast.cover.intrinsicWidth === podcast.cover.intrinsicHeight,
              sources: createImageSources('podcast-cover', podcast.cover),
            },
      description: podcast.description,
      // An empty draft (log 0020) is left for the list.
      isEmptyDraft: podcast.firstContentAt === null,
      slug: podcast.slug,
      slugSuggestion: conflict.slugSuggestion,
      state: podcast.state,
      // Sent for approval, or approved: the tag and the line of 24c.
      submission:
        submission === null
          ? null
          : { date: submission.date.toISOString(), state: submission.state },
      takenSlug: conflict.takenSlug,
      title: podcast.title,
      // The last save, which the editor's hold takes back only over (24i).
      updatedAt: podcast.updatedAt.toISOString(),
    },
  }
}
