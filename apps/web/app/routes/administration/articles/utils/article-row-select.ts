import type { Prisma } from '@generated/prisma/client'

/**
 * What an article row's state, fact and actions are read from, wherever the row
 * stands (design 22a, 22b).
 */
export const ARTICLE_ROW_SELECT = {
  authors: {
    select: { id: true, name: true, role: { select: { level: true } } },
  },
  // „upravuje …“ while someone edits it (22f).
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  id: true,
  publishedAt: true,
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
  title: true,
  updatedAt: true,
} satisfies Prisma.ArticleSelect

export type ArticleRowRecord = Prisma.ArticleGetPayload<{
  select: typeof ARTICLE_ROW_SELECT
}>
