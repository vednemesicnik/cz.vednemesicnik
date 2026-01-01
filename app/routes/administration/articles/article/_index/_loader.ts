import { createArticleImageUrl } from '~/utils/create-article-image-url'
import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { articleId } = params

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
    entities: ['article'],
  })

  const article = await prisma.article.findUnique({
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
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
      content: true,
      createdAt: true,
      featuredImageId: true,
      id: true,
      images: {
        select: {
          id: true,
        },
      },
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          id: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              role: {
                select: {
                  level: true,
                  name: true,
                },
              },
            },
          },
          state: true,
        },
      },
      slug: true,
      state: true,
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
      title: true,
      updatedAt: true,
    },
    where: { id: articleId },
  })

  if (!article) {
    throw new Response('Článek nenalezen', { status: 404 })
  }

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = article.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = article.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article',
    state: article.state,
    targetAuthorId: article.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = article.author.role.level === 1
  const isOwnContent = article.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this article
  const hasReviewed = article.reviews.some(
    (review) => review.reviewer.id === context.authorId,
  )

  return {
    article: {
      author: article.author,
      categories: article.categories,
      content: article.content,
      createdAt: getFormattedPublishDate(article.createdAt),
      featuredImageId: article.featuredImageId,
      hasCoordinatorReview: !!coordinatorReview,
      id: article.id,
      images: article.images.map((image) => ({
        id: image.id,
        url: createArticleImageUrl(image.id),
      })),
      publishedAt: getFormattedPublishDate(article.publishedAt),
      reviews: article.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
          roleLevel: review.reviewer.role.level,
          roleName: review.reviewer.role.name,
        },
        state: review.state,
      })),
      slug: article.slug,
      state: article.state,
      tags: article.tags,
      title: article.title,
      updatedAt: getFormattedPublishDate(article.updatedAt),
    },
    canArchive,
    canDelete,
    canPublish,
    canRestore,
    canRetract,
    canReview: shouldShowReview,
    canUpdate,
    hasReviewed,
    needsCoordinatorReview,
  }
}
