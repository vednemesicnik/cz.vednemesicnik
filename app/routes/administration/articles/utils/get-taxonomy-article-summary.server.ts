import type { Prisma } from '@generated/prisma/client'

import { TAXONOMY_ARTICLE_COUNT_QUEUES } from '~/config/content-queue-config'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { prisma } from '~/utils/db.server'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'

import { buildArticlePermissionWhere } from './build-article-permission-where'
import { getArticleDisplayTitle } from './get-article-display-title'

type Context = Parameters<typeof buildArticlePermissionWhere>[0]

const RECENT_ARTICLE_COUNT = 5

/**
 * What a category's or tag's detail shows of its articles (design 25b): the
 * five most recently updated, in every state, and a count per state. Both
 * cover only what the viewer may see, so they match the article list the
 * detail links to.
 *
 * @param context - The author permission context, built with `view` on `article`.
 * @param relationWhere - The record's articles, e.g. `{ categories: { some: { id } } }`.
 * @returns The recent articles with the tag their list row shows, and the
 *   count per state in the detail's order, zeros included.
 */
export const getTaxonomyArticleSummary = async (
  context: Context,
  relationWhere: Prisma.ArticleWhereInput,
) => {
  const where = {
    AND: [buildArticlePermissionWhere(context), relationWhere],
  }

  const [recentArticles, stateCounts] = await Promise.all([
    prisma.article.findMany({
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        reviews: {
          select: {
            createdAt: true,
            reviewer: { select: { role: { select: { level: true } } } },
          },
        },
        state: true,
        submittedAt: true,
        title: true,
      },
      take: RECENT_ARTICLE_COUNT,
      where,
    }),
    Promise.all(
      TAXONOMY_ARTICLE_COUNT_QUEUES.map(async (queue) => ({
        count: await prisma.article.count({
          where: { AND: [where, buildContentQueueWhere(queue)] },
        }),
        queue,
      })),
    ),
  ])

  return {
    recentArticles: recentArticles.map((article) => ({
      id: article.id,
      state: getSubmissionState(article)?.state ?? article.state,
      title: getArticleDisplayTitle(article.title),
    })),
    stateCounts,
  }
}
