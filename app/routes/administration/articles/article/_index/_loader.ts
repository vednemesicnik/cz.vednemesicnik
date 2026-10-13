import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import { getArticleActionFlags } from '../../utils/get-article-action-flags.server'
import { getArticleFactLine } from '../../utils/get-article-fact-line'
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
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
        },
      },
      content: true,
      createdAt: true,
      excerpt: true,
      featuredImage: {
        select: {
          ...imageSourceSelect,
          description: true,
        },
      },
      id: true,
      images: {
        select: { altText: true },
      },
      publishedAt: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { id: true, role: { select: { level: true } } } },
        },
      },
      slug: true,
      state: true,
      submittedAt: true,
      tags: {
        orderBy: { name: 'asc' },
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
      excerpt: article.excerpt,
      // The line under the title (design 22b, 23a).
      factLine: getArticleFactLine({
        now: new Date(),
        publishedAt: article.publishedAt,
        state: article.state,
        submission: flags.submission,
        updatedAt: article.updatedAt,
      }),
      featuredImage: article.featuredImage
        ? {
            altText: article.featuredImage.altText,
            description: article.featuredImage.description,
            sources: createImageSources('article-image', article.featuredImage),
          }
        : null,
      history: await getContentHistory({
        createdAt: article.createdAt,
        entity: 'article',
        entityId: article.id,
        publishedAt: article.publishedAt,
      }),
      id: article.id,
      // The gallery is the editor's (24); the detail shows only the count (23a).
      imageCount: article.images.length,
      // FormattedDate carries the raw instant in `.iso`, which seeds the
      // change-date dialog's picker (the browser converts it to/from local time,
      // keeping the default and submitted value in the editor's timezone).
      publishedAt: createFormattedDate(article.publishedAt),
      slug: article.slug,
      state: article.state,
      tags: article.tags,
      title: article.title,
    },
    ...flags,
    missingBeforePublish,
    submission: flags.submission?.state ?? null,
  }
}
