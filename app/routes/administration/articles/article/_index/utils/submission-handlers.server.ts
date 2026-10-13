import { createSubmissionHandlers } from '~/utils/content-state/create-submission-handlers.server'
import { prisma } from '~/utils/db.server'

import { getMissingArticleContent } from './get-missing-article-content'

/**
 * Article submission transitions (design 07d). An article is checked for
 * completeness before it is submitted (design 23h).
 */
export const articleSubmissionHandlers = createSubmissionHandlers({
  clearSubmission: async (id) => {
    await prisma.article.update({
      data: {
        reviews: { deleteMany: {} },
        submittedAt: null,
        submittedById: null,
      },
      where: { id },
    })
  },
  entity: 'article',

  getMissing: async (id) => {
    const article = await prisma.article.findUniqueOrThrow({
      select: {
        authors: { select: { id: true } },
        content: true,
        excerpt: true,
        images: { select: { altText: true } },
        slug: true,
        title: true,
      },
      where: { id },
    })

    return getMissingArticleContent({
      authorCount: article.authors.length,
      content: article.content,
      excerpt: article.excerpt,
      images: article.images,
      slug: article.slug,
      title: article.title,
    })
  },

  loadSubmissionState: (id) =>
    prisma.article.findUniqueOrThrow({
      select: {
        authors: { select: { id: true, role: { select: { level: true } } } },
        state: true,
        submittedAt: true,
      },
      where: { id },
    }),

  markSubmitted: async (id, authorId) => {
    const { count } = await prisma.article.updateMany({
      data: { submittedAt: new Date(), submittedById: authorId },
      where: { id, state: 'draft', submittedAt: null },
    })

    return count
  },
})
