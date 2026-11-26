import type { Prisma } from '@generated/prisma/client'

/**
 * What a category's or tag's row is read from, wherever the row stands
 * (design 25a, 25e). How many articles it has in any state is counted
 * apart: `_count` holds one count per relation.
 */
export const TAXONOMY_ROW_SELECT = {
  // What a reader sees on its page (25a, 25e).
  _count: {
    select: { articles: { where: { state: 'published' } } },
  },
  author: {
    select: { id: true, name: true, role: { select: { level: true } } },
  },
  id: true,
  name: true,
  reviews: {
    select: {
      createdAt: true,
      reviewer: {
        select: { id: true, role: { select: { level: true } } },
      },
    },
  },
  slug: true,
  state: true,
  submittedAt: true,
  submittedBy: { select: { name: true } },
  updatedAt: true,
} as const satisfies Prisma.ArticleCategorySelect & Prisma.ArticleTagSelect

export type TaxonomyRowRecord = Prisma.ArticleCategoryGetPayload<{
  select: typeof TAXONOMY_ROW_SELECT
}>
