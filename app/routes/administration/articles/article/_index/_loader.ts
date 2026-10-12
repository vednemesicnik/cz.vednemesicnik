import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { canPublishWithoutReview } from '~/utils/permissions/author/review-policy'

import { getArticleActionFlags } from '../../utils/get-article-action-flags.server'
import type { Route } from './+types/route'
import { getMissingArticleContent } from './utils/get-missing-article-content'

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
      excerpt: true,
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
      submittedAt: true,
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

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  const flags = getArticleActionFlags(context, article)

  // Publishing an incomplete article opens the 23h list instead of the date
  // dialog; the server checks it again.
  const missingBeforePublish = flags.canPublish
    ? getMissingArticleContent({
        authorCount: article.authors.length,
        content: article.content,
        excerpt: article.excerpt,
        images: article.images,
        slug: article.slug,
        title: article.title,
      })
    : []

  return {
    article: {
      authors: article.authors,
      categories: article.categories,
      content: article.content,
      createdAt: createFormattedDate(article.createdAt),
      featuredImageId: article.featuredImageId,
      hasApprovingReview: article.reviews.some((review) =>
        canPublishWithoutReview(review.reviewer.role),
      ),
      id: article.id,
      images: article.images.map((image) => ({
        id: image.id,
        sources: createImageSources('article-image', image),
      })),
      // FormattedDate carries the raw instant in `.iso`, which seeds the
      // change-date dialog's picker (the browser converts it to/from local time,
      // keeping the default and submitted value in the editor's timezone).
      publishedAt: createFormattedDate(article.publishedAt),
      reviews: article.reviews.map((review) => ({
        createdAt: createFormattedDate(review.createdAt),
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
      updatedAt: createFormattedDate(article.updatedAt),
    },
    ...flags,
    missingBeforePublish,
    submission:
      flags.submission === null
        ? null
        : {
            date: formatNumericDate(flags.submission.date),
            state: flags.submission.state,
          },
  }
}
