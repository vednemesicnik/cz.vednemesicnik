import type { LoaderFunctionArgs } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

import { getPendingArticleCategories } from './utils/get-pending-article-categories.server'
import { getPendingArticleTags } from './utils/get-pending-article-tags.server'
import { getPendingArticles } from './utils/get-pending-articles.server'
import { getPendingEditorialBoardMembers } from './utils/get-pending-editorial-board-members.server'
import { getPendingEditorialBoardPositions } from './utils/get-pending-editorial-board-positions.server'
import { getPendingIssues } from './utils/get-pending-issues.server'
import { getPendingPodcastEpisodes } from './utils/get-pending-podcast-episodes.server'
import { getPendingPodcasts } from './utils/get-pending-podcasts.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get permission contexts
  const [authorContext, userContext] = await Promise.all([
    getAuthorPermissionContext(request, {
      actions: ['view'],
      entities: [
        'article',
        'article_category',
        'article_tag',
        'podcast',
        'podcast_episode',
        'issue',
        'editorial_board_position',
        'editorial_board_member',
      ],
    }),
    getUserPermissionContext(request, {
      actions: ['view'],
      entities: ['user', 'author'],
    }),
  ])

  const currentAuthorId = authorContext.authorId
  const currentRoleLevel = authorContext.roleLevel

  // Check permissions for viewing draft content from other authors
  const canViewArticleDrafts = authorContext.can({
    action: 'view',
    entity: 'article',
    state: 'draft',
  }).hasAny

  const canViewPodcastDrafts = authorContext.can({
    action: 'view',
    entity: 'podcast',
    state: 'draft',
  }).hasAny

  const canViewPodcastEpisodeDrafts = authorContext.can({
    action: 'view',
    entity: 'podcast_episode',
    state: 'draft',
  }).hasAny

  const canViewIssueDrafts = authorContext.can({
    action: 'view',
    entity: 'issue',
    state: 'draft',
  }).hasAny

  const canViewArticleCategoryDrafts = authorContext.can({
    action: 'view',
    entity: 'article_category',
    state: 'draft',
  }).hasAny

  const canViewArticleTagDrafts = authorContext.can({
    action: 'view',
    entity: 'article_tag',
    state: 'draft',
  }).hasAny

  const canViewEditorialBoardMemberDrafts = authorContext.can({
    action: 'view',
    entity: 'editorial_board_member',
    state: 'draft',
  }).hasAny

  const canViewEditorialBoardPositionDrafts = authorContext.can({
    action: 'view',
    entity: 'editorial_board_position',
    state: 'draft',
  }).hasAny

  // Fetch draft content created by other authors (for review)
  const pendingOptions = { currentAuthorId, currentRoleLevel }

  const emptyResult = { count: 0, items: [] }

  const [
    draftArticles,
    draftPodcasts,
    draftPodcastEpisodes,
    draftIssues,
    draftArticleCategories,
    draftArticleTags,
    draftEditorialBoardMembers,
    draftEditorialBoardPositions,
  ] = await Promise.all([
    canViewArticleDrafts
      ? getPendingArticles(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewPodcastDrafts
      ? getPendingPodcasts(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewPodcastEpisodeDrafts
      ? getPendingPodcastEpisodes(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewIssueDrafts
      ? getPendingIssues(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewArticleCategoryDrafts
      ? getPendingArticleCategories(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewArticleTagDrafts
      ? getPendingArticleTags(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewEditorialBoardMemberDrafts
      ? getPendingEditorialBoardMembers(pendingOptions)
      : Promise.resolve(emptyResult),
    canViewEditorialBoardPositionDrafts
      ? getPendingEditorialBoardPositions(pendingOptions)
      : Promise.resolve(emptyResult),
  ])

  // Fetch statistics
  const [
    totalArticles,
    publishedArticles,
    totalPodcasts,
    publishedPodcasts,
    totalPodcastEpisodes,
    publishedPodcastEpisodes,
    totalIssues,
    publishedIssues,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { state: 'published' } }),
    prisma.podcast.count(),
    prisma.podcast.count({ where: { state: 'published' } }),
    prisma.podcastEpisode.count(),
    prisma.podcastEpisode.count({ where: { state: 'published' } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { state: 'published' } }),
  ])

  const totalPendingCount =
    draftArticles.count +
    draftPodcasts.count +
    draftPodcastEpisodes.count +
    draftIssues.count +
    draftArticleCategories.count +
    draftArticleTags.count +
    draftEditorialBoardMembers.count +
    draftEditorialBoardPositions.count

  const pendingReviewItems = {
    articleCategories: draftArticleCategories.items,
    articles: draftArticles.items,
    articleTags: draftArticleTags.items,
    editorialBoardMembers: draftEditorialBoardMembers.items,
    editorialBoardPositions: draftEditorialBoardPositions.items,
    issues: draftIssues.items,
    podcastEpisodes: draftPodcastEpisodes.items,
    podcasts: draftPodcasts.items,
    totalCount: totalPendingCount,
  }

  const statistics = {
    articles: { published: publishedArticles, total: totalArticles },
    issues: { published: publishedIssues, total: totalIssues },
    podcastEpisodes: {
      published: publishedPodcastEpisodes,
      total: totalPodcastEpisodes,
    },
    podcasts: { published: publishedPodcasts, total: totalPodcasts },
  }

  // Check permissions for navigation cards
  const permissions = {
    canViewArticleCategories: authorContext.can({
      action: 'view',
      entity: 'article_category',
    }).hasPermission,
    canViewArticles: authorContext.can({ action: 'view', entity: 'article' })
      .hasPermission,
    canViewArticleTags: authorContext.can({
      action: 'view',
      entity: 'article_tag',
    }).hasPermission,
    canViewAuthors: userContext.can({
      action: 'view',
      entity: 'author',
      targetUserId: userContext.userId,
    }).hasPermission,
    canViewEditorialBoardMembers: authorContext.can({
      action: 'view',
      entity: 'editorial_board_member',
    }).hasPermission,
    canViewEditorialBoardPositions: authorContext.can({
      action: 'view',
      entity: 'editorial_board_position',
    }).hasPermission,
    canViewIssues: authorContext.can({ action: 'view', entity: 'issue' })
      .hasPermission,
    canViewPodcasts: authorContext.can({ action: 'view', entity: 'podcast' })
      .hasPermission,
    canViewUsers: userContext.can({
      action: 'view',
      entity: 'user',
      targetUserId: userContext.userId,
    }).hasPermission,
  }

  return {
    pendingReviewItems,
    permissions,
    statistics,
  }
}
