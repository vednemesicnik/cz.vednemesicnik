import { href } from 'react-router'

import { buildIssuePermissionWhere } from '~/routes/administration/archive/utils/build-issue-permission-where'
import { buildArticlePermissionWhere } from '~/routes/administration/articles/utils/build-article-permission-where'
import { buildTaxonomyPermissionWhere } from '~/routes/administration/articles/utils/build-taxonomy-permission-where'
import { buildEpisodePermissionWhere } from '~/routes/administration/podcasts/podcast/episodes/utils/build-episode-permission-where'
import { buildPodcastPermissionWhere } from '~/routes/administration/podcasts/utils/build-podcast-permission-where'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { prisma } from '~/utils/db.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { canPublishWithoutReview } from '~/utils/permissions/author/review-policy'

import { DASHBOARD_TYPES, type DashboardType } from '../dashboard-types'

/** One type's approved content, as *K publikaci* says it (design 21a). */
export type ApprovedSummary = {
  type: DashboardType
  count: number
  /** The earliest approval among them, ISO 8601. */
  earliestApprovedAt: string
  /** Its list with the approved, where they are published. */
  listHref: string
}

type Approved = {
  reviews: { createdAt: Date; reviewer: { role: { level: number } } }[]
}

const reviewsSelect = {
  reviews: {
    select: {
      createdAt: true,
      reviewer: { select: { role: { select: { level: true } } } },
    },
  },
} as const

const approvedQuery = `?${new URLSearchParams({ state: 'approved' })}`

/**
 * The approved content of each type, for the Coordinator's *K publikaci*
 * (design 21a): how many, since when, and where they are published. Articles
 * go to their list oldest first, as the ordered publish selects (gl703egt).
 * Episodes have no list of their own: their podcast's page when they are all
 * one podcast's, the podcast list otherwise.
 *
 * @param context - The author permission context, loaded with `view` on all
 *   six entities.
 * @returns One summary per type with approved content, in the dashboard's
 *   type order.
 */
export const loadApprovedSummaries = async (
  context: AuthorPermissionContext,
): Promise<ApprovedSummary[]> => {
  const approved = buildContentQueueWhere('approved')
  const withApproved = <Where extends object>(permissionWhere: Where) => ({
    AND: [permissionWhere, approved],
  })

  const [articles, episodes, podcasts, issues, categories, tags] =
    await Promise.all([
      prisma.article.findMany({
        select: reviewsSelect,
        where: withApproved(buildArticlePermissionWhere(context)),
      }),
      prisma.podcastEpisode.findMany({
        select: { ...reviewsSelect, podcastId: true },
        where: withApproved(buildEpisodePermissionWhere(context)),
      }),
      prisma.podcast.findMany({
        select: reviewsSelect,
        where: withApproved(buildPodcastPermissionWhere(context)),
      }),
      prisma.issue.findMany({
        select: reviewsSelect,
        where: withApproved(buildIssuePermissionWhere(context)),
      }),
      prisma.articleCategory.findMany({
        select: reviewsSelect,
        where: withApproved(
          buildTaxonomyPermissionWhere(context, 'article_category'),
        ),
      }),
      prisma.articleTag.findMany({
        select: reviewsSelect,
        where: withApproved(
          buildTaxonomyPermissionWhere(context, 'article_tag'),
        ),
      }),
    ])

  const episodePodcastIds = new Set(
    episodes.map((episode) => episode.podcastId),
  )
  const [onlyPodcastId] = episodePodcastIds

  const listHrefs: Record<DashboardType, string> = {
    article: `${href('/administration/articles')}?${new URLSearchParams({
      order: 'asc',
      sort: 'updatedAt',
      state: 'approved',
    })}`,
    category: `${href('/administration/articles/categories')}${approvedQuery}`,
    episode:
      episodePodcastIds.size === 1 && onlyPodcastId !== undefined
        ? `${href('/administration/podcasts/:podcastId', { podcastId: onlyPodcastId })}${approvedQuery}`
        : href('/administration/podcasts'),
    issue: `${href('/administration/archive')}${approvedQuery}`,
    podcast: `${href('/administration/podcasts')}${approvedQuery}`,
    tag: `${href('/administration/articles/tags')}${approvedQuery}`,
  }

  const byType: Record<DashboardType, Approved[]> = {
    article: articles,
    category: categories,
    episode: episodes,
    issue: issues,
    podcast: podcasts,
    tag: tags,
  }

  return DASHBOARD_TYPES.flatMap((type) => {
    const approvals = byType[type].flatMap(({ reviews }) =>
      reviews
        .filter((review) => canPublishWithoutReview(review.reviewer.role))
        .map((review) => review.createdAt.getTime()),
    )

    if (byType[type].length === 0 || approvals.length === 0) return []

    return [
      {
        count: byType[type].length,
        earliestApprovedAt: new Date(Math.min(...approvals)).toISOString(),
        listHref: listHrefs[type],
        type,
      },
    ]
  })
}
