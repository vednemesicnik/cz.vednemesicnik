import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  APPROVER_ROLE_LEVEL,
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

import type { Route } from './+types/route'

// YYYY-MM-DDTHH:mm for a datetime-local input, in the publication's timezone.
// The server runs UTC while the dialog computes its own now/max in the browser's
// local time, so anchoring on Europe/Prague keeps the seeded default consistent
// for Czech admins regardless of server TZ. sv-SE yields ISO-ordered fields.
const toPublishedAtInputValue = (date: Date): string =>
  new Intl.DateTimeFormat('sv-SE', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
    .format(date)
    .replace(' ', 'T')

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
      authors: {
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
        select: imageSourceSelect,
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

  if (article.authors.length === 0) {
    throw new Response('Článek nemá přiřazeného autora', { status: 500 })
  }

  const targetAuthorIds = article.authors.map((author) => author.id)

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Whether an approving review (from a role exempt from the requirement) exists,
  // and whether the content still needs one before publishing.
  const hasApprovingReview = article.reviews.some((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )
  const needsReview = needsReviewToPublish({
    authors: article.authors,
    reviews: article.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article',
    state: article.state,
    targetAuthorIds,
  })

  // Don't show review button if:
  // 1. All authors can publish without review - they don't need reviews
  // 2. Current user is one of the authors - can't review own content
  const authorCanPublishWithoutReview = article.authors.every((author) =>
    canPublishWithoutReview(author.role),
  )
  const isOwnContent = article.authors.some(
    (author) => author.id === context.authorId,
  )
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

  // Check if current user has already reviewed this article
  const hasReviewed = article.reviews.some(
    (review) => review.reviewer.id === context.authorId,
  )

  return {
    article: {
      authors: article.authors,
      categories: article.categories,
      content: article.content,
      createdAt: getFormattedPublishDate(article.createdAt),
      featuredImageId: article.featuredImageId,
      hasApprovingReview,
      id: article.id,
      images: article.images.map((image) => ({
        id: image.id,
        sources: createImageSources('article-image', image),
      })),
      publishedAt: getFormattedPublishDate(article.publishedAt),
      // Machine-readable seed for the change-date dialog's datetime-local input
      // (the display-formatted publishedAt above is not usable there).
      publishedAtInputValue: article.publishedAt
        ? toPublishedAtInputValue(article.publishedAt)
        : undefined,
      reviews: article.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
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
    canChangePublishedAt:
      article.state === 'published' && context.roleLevel <= APPROVER_ROLE_LEVEL,
    canDelete,
    canPublish,
    canPublishBackdated: canPublish && context.roleLevel <= APPROVER_ROLE_LEVEL,
    canRestore,
    canRetract,
    canReview: shouldShowReview,
    canUpdate,
    hasReviewed,
    needsReview,
  }
}
