import type { Prisma } from '@generated/prisma/client'

/**
 * What holds an author (#767): the content it stands on, the approvals it gave
 * and its account. Spread into a query's `select` and read with
 * `getAuthorDeleteBlock`.
 */
export const AUTHOR_REFERENCES_SELECT = {
  _count: {
    select: {
      articleCategories: true,
      articles: true,
      articleTags: true,
      issues: true,
      podcastEpisodes: true,
      podcasts: true,
      reviews: true,
    },
  },
  user: { select: { id: true } },
} satisfies Prisma.AuthorSelect
