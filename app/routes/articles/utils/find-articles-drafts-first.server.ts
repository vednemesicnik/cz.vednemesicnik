import type { Prisma } from '@generated/prisma/client'

import { findDraftsFirstPage } from '~/utils/content-preview/find-drafts-first-page'
import { prisma } from '~/utils/db.server'

/**
 * A page of a public article list with every draft on top (10d): drafts by
 * their last save, then the rest by publication date.
 *
 * @param options.select - What each article carries.
 * @param options.where - The list's articles, visibility included.
 * @param options.skip - The articles before this page.
 * @param options.take - The page size.
 * @returns The page's articles, drafts first.
 */
export const findArticlesDraftsFirst = <Select extends Prisma.ArticleSelect>({
  select,
  where,
  skip,
  take,
}: {
  select: Select
  where: Prisma.ArticleWhereInput
  skip: number
  take: number
}) => {
  const draftWhere = { AND: [where, { state: 'draft' as const }] }
  const restWhere = { AND: [where, { state: { not: 'draft' as const } }] }

  return findDraftsFirstPage<Prisma.ArticleGetPayload<{ select: Select }>>({
    countDrafts: () => prisma.article.count({ where: draftWhere }),
    findDrafts: (window) =>
      prisma.article.findMany({
        ...window,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        select,
        where: draftWhere,
      }),
    findRest: (window) =>
      prisma.article.findMany({
        ...window,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        select,
        where: restWhere,
      }),
    skip,
    take,
  })
}
