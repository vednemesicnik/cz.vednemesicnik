import { prisma } from '~/utils/db.server'

export const loader = async () => {
  const latestPublishedArticle = await prisma.article.findFirst({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      author: {
        select: {
          name: true,
        },
      },
      featuredImage: {
        select: {
          altText: true,
          id: true,
        },
      },
      publishedAt: true,
      slug: true,
      title: true,
    },
    where: {
      state: 'published',
    },
  })

  return { latestPublishedArticle }
}
