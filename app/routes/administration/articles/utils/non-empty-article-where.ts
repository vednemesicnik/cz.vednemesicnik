import type { Prisma } from '@generated/prisma/client'

/**
 * Articles that have had a title, text or image. An empty draft (decision
 * 0020) is left out of every list and count until its first content.
 */
export const NON_EMPTY_ARTICLE_WHERE = {
  firstContentAt: { not: null },
} satisfies Prisma.ArticleWhereInput
