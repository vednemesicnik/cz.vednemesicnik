import type { PrismaClient } from '@generated/prisma/client'
import type { PageSEODataObject } from '~~/types/page-seo-data-object'

export const createPagesSeoData = async (
  prisma: PrismaClient,
  data: PageSEODataObject[],
  authorId: string,
) => {
  for (const pageSeo of data) {
    await prisma.pageSEO
      .create({
        data: {
          authorId: authorId,
          description: pageSeo.description,
          ogImageUrl: pageSeo.ogImageUrl,
          pathname: pageSeo.pathname,
          publishedAt: pageSeo.state === 'published' ? new Date() : undefined,
          reviews:
            pageSeo.state === 'published'
              ? {
                  create: {
                    reviewerId: authorId,
                  },
                }
              : undefined,
          robots: pageSeo.robots,
          state: pageSeo.state,
          title: pageSeo.title,
          twitterImageUrl: pageSeo.twitterImageUrl,
        },
      })
      .catch((error) => {
        console.error('Error creating page SEO:', error)
        return null
      })
  }
}
