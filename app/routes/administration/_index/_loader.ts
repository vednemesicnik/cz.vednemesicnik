import { type LoaderFunctionArgs } from "react-router"

import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { getUserPermissionContext } from "~/utils/permissions/user/context/get-user-permission-context.server"

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

  // Fetch draft content created by other authors (for review) - only if user has permission
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
      ? prisma.article.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewPodcastDrafts
      ? prisma.podcast.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewPodcastEpisodeDrafts
      ? prisma.podcastEpisode.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
            author: { select: { name: true } },
            podcast: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewIssueDrafts
      ? prisma.issue.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            label: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewArticleCategoryDrafts
      ? prisma.articleCategory.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewArticleTagDrafts
      ? prisma.articleTag.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewEditorialBoardMemberDrafts
      ? prisma.editorialBoardMember.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            fullName: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    canViewEditorialBoardPositionDrafts
      ? prisma.editorialBoardPosition.findMany({
          where: {
            state: "draft",
            authorId: { not: currentAuthorId },
          },
          select: {
            id: true,
            key: true,
            createdAt: true,
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  // Fetch statistics
  const [
    totalArticles,
    publishedArticles,
    totalPodcasts,
    publishedPodcasts,
    totalIssues,
    publishedIssues,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { state: "published" } }),
    prisma.podcast.count(),
    prisma.podcast.count({ where: { state: "published" } }),
    prisma.issue.count(),
    prisma.issue.count({ where: { state: "published" } }),
  ])

  const pendingReviewItems = {
    articles: draftArticles,
    podcasts: draftPodcasts,
    podcastEpisodes: draftPodcastEpisodes,
    issues: draftIssues,
    articleCategories: draftArticleCategories,
    articleTags: draftArticleTags,
    editorialBoardMembers: draftEditorialBoardMembers,
    editorialBoardPositions: draftEditorialBoardPositions,
  }

  const statistics = {
    articles: { total: totalArticles, published: publishedArticles },
    podcasts: { total: totalPodcasts, published: publishedPodcasts },
    issues: { total: totalIssues, published: publishedIssues },
  }

  // Check permissions for navigation cards
  const permissions = {
    canViewUsers: userContext.can({ entity: "user", action: "view" })
      .hasPermission,
    canViewAuthors: userContext.can({ entity: "author", action: "view" })
      .hasPermission,
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
