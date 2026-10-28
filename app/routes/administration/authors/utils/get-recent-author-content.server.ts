import { href } from 'react-router'

import type { StatusTagState } from '~/components/status-tag'
import { prisma } from '~/utils/db.server'
import { getIssueTitle } from '~/utils/issue/get-issue-title'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'

import { buildIssuePermissionWhere } from '../../archive/utils/build-issue-permission-where'
import { buildArticlePermissionWhere } from '../../articles/utils/build-article-permission-where'
import { getArticleDisplayTitle } from '../../articles/utils/get-article-display-title'
import { buildEpisodePermissionWhere } from '../../podcasts/podcast/episodes/utils/build-episode-permission-where'

type Context = Pick<AuthorPermissionContext, 'authorId' | 'can'>

export type RecentAuthorContentItem = {
  type: 'article' | 'episode' | 'issue'
  id: string
  title: string
  state: StatusTagState
  href: string
}

const RECENT_ITEM_COUNT = 5

const REVIEW_SELECT = {
  reviews: {
    select: {
      createdAt: true,
      reviewer: { select: { role: { select: { level: true } } } },
    },
  },
  state: true,
  submittedAt: true,
  updatedAt: true,
} as const

/**
 * The five most recently edited articles, episodes and issues an author stands
 * on, together (design 28b). Each type covers only what the viewer may see, so
 * no title of a draft they can't open shows here.
 *
 * @param context - The author permission context, built with `view` on
 *   `article`, `issue` and `podcast_episode`.
 * @param authorId - The author the detail shows.
 * @returns The items, newest edit first, each with the tag its list row shows
 *   and a link to its detail.
 */
export const getRecentAuthorContent = async (
  context: Context,
  authorId: string,
): Promise<RecentAuthorContentItem[]> => {
  const [articles, episodes, issues] = await Promise.all([
    prisma.article.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { ...REVIEW_SELECT, id: true, title: true },
      take: RECENT_ITEM_COUNT,
      where: {
        AND: [
          buildArticlePermissionWhere(context),
          { authors: { some: { id: authorId } } },
        ],
      },
    }),
    prisma.podcastEpisode.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        ...REVIEW_SELECT,
        id: true,
        number: true,
        podcastId: true,
        title: true,
      },
      take: RECENT_ITEM_COUNT,
      where: { AND: [buildEpisodePermissionWhere(context), { authorId }] },
    }),
    prisma.issue.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        ...REVIEW_SELECT,
        id: true,
        name: true,
        order: true,
        supplement: true,
        year: true,
      },
      take: RECENT_ITEM_COUNT,
      where: { AND: [buildIssuePermissionWhere(context), { authorId }] },
    }),
  ])

  const getState = (content: Parameters<typeof getSubmissionState>[0]) =>
    getSubmissionState(content)?.state ?? content.state

  return [
    ...articles.map((article) => ({
      href: href('/administration/articles/:articleId', {
        articleId: article.id,
      }),
      id: article.id,
      state: getState(article),
      title: getArticleDisplayTitle(article.title),
      type: 'article' as const,
      updatedAt: article.updatedAt,
    })),
    ...episodes.map((episode) => ({
      href: href('/administration/podcasts/:podcastId/episodes/:episodeId', {
        episodeId: episode.id,
        podcastId: episode.podcastId,
      }),
      id: episode.id,
      state: getState(episode),
      title: formatEpisodeTitle(episode),
      type: 'episode' as const,
      updatedAt: episode.updatedAt,
    })),
    ...issues.map((issue) => ({
      href: href('/administration/archive/:issueId', { issueId: issue.id }),
      id: issue.id,
      state: getState(issue),
      title: getIssueTitle(issue),
      type: 'issue' as const,
      updatedAt: issue.updatedAt,
    })),
  ]
    .sort(
      (first, second) => second.updatedAt.getTime() - first.updatedAt.getTime(),
    )
    .slice(0, RECENT_ITEM_COUNT)
    .map(({ updatedAt, ...item }) => item)
}
