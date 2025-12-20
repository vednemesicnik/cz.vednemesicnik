import { type LoaderFunctionArgs } from "react-router"

import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

import { getPendingArticleCategories } from "./utils/get-pending-article-categories.server"
import { getPendingArticleTags } from "./utils/get-pending-article-tags.server"
import { getPendingArticles } from "./utils/get-pending-articles.server"
import { getPendingEditorialBoardMembers } from "./utils/get-pending-editorial-board-members.server"
import { getPendingEditorialBoardPositions } from "./utils/get-pending-editorial-board-positions.server"
import { getPendingIssues } from "./utils/get-pending-issues.server"
import { getPendingPodcastEpisodes } from "./utils/get-pending-podcast-episodes.server"
import { getPendingPodcasts } from "./utils/get-pending-podcasts.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Get permission contexts
  const [authorContext, userContext] = await Promise.all([
    getAuthorPermissionContext(request, {
      entities: [
        "article",
        "article_category",
        "article_tag",
        "podcast",
        "podcast_episode",
        "issue",
        "editorial_board_position",
        "editorial_board_member",
      ],
      actions: ["view"],
    }),
    getUserPermissionContext(request, {
      entities: ["user", "author"],
      actions: ["view"],
    }),
  ])

  const currentAuthorId = authorContext.authorId
  const currentRoleLevel = authorContext.roleLevel

  // Check permissions for viewing draft content from other authors
  const canViewArticleDrafts = authorContext.can({
    entity: "article",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewPodcastDrafts = authorContext.can({
    entity: "podcast",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewPodcastEpisodeDrafts = authorContext.can({
    entity: "podcast_episode",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewIssueDrafts = authorContext.can({
    entity: "issue",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewArticleCategoryDrafts = authorContext.can({
    entity: "article_category",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewArticleTagDrafts = authorContext.can({
    entity: "article_tag",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewEditorialBoardMemberDrafts = authorContext.can({
    entity: "editorial_board_member",
    action: "view",
    state: "draft",
  }).hasAny

  const canViewEditorialBoardPositionDrafts = authorContext.can({
    entity: "editorial_board_position",
    action: "view",
    state: "draft",
  }).hasAny

  // Fetch draft content created by other authors (for review)
  const pendingOptions = { currentAuthorId, currentRoleLevel }

  const emptyResult = { items: [], count: 0 }

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
    prisma.article.count({ where: { state: "published" } }),
    prisma.podcast.count(),
    prisma.podcast.count({ where: { state: "published" } }),
    prisma.podcastEpisode.count(),
    prisma.podcastEpisode.count({ where: { state: "published" } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { state: "published" } }),
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
    articles: draftArticles.items,
    podcasts: draftPodcasts.items,
    podcastEpisodes: draftPodcastEpisodes.items,
    issues: draftIssues.items,
    articleCategories: draftArticleCategories.items,
    articleTags: draftArticleTags.items,
    editorialBoardMembers: draftEditorialBoardMembers.items,
    editorialBoardPositions: draftEditorialBoardPositions.items,
    totalCount: totalPendingCount,
  }

  const statistics = {
    articles: { total: totalArticles, published: publishedArticles },
    podcasts: { total: totalPodcasts, published: publishedPodcasts },
    podcastEpisodes: {
      total: totalPodcastEpisodes,
      published: publishedPodcastEpisodes,
    },
    issues: { total: totalIssues, published: publishedIssues },
  }

  // Check permissions for navigation cards
  const permissions = {
    canViewUsers: userContext.can({
      entity: "user",
      action: "view",
      targetUserId: userContext.userId,
    }).hasPermission,
    canViewAuthors: userContext.can({
      entity: "author",
      action: "view",
      targetUserId: userContext.userId,
    }).hasPermission,
    canViewArticles: authorContext.can({ entity: "article", action: "view" })
      .hasPermission,
    canViewArticleCategories: authorContext.can({
      entity: "article_category",
      action: "view",
    }).hasPermission,
    canViewArticleTags: authorContext.can({
      entity: "article_tag",
      action: "view",
    }).hasPermission,
    canViewPodcasts: authorContext.can({ entity: "podcast", action: "view" })
      .hasPermission,
    canViewIssues: authorContext.can({ entity: "issue", action: "view" })
      .hasPermission,
    canViewEditorialBoardPositions: authorContext.can({
      entity: "editorial_board_position",
      action: "view",
    }).hasPermission,
    canViewEditorialBoardMembers: authorContext.can({
      entity: "editorial_board_member",
      action: "view",
    }).hasPermission,
  }

  return {
    pendingReviewItems,
    statistics,
    permissions,
  }
}
