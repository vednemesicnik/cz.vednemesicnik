import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  const latestPublishedArticle = await prisma.article.findFirst({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      authors: {
        select: {
          name: true,
        },
      },
      featuredImage: {
        select: imageSourceSelect,
      },
      publishedAt: true,
      slug: true,
      title: true,
    },
    where: {
      state: { in: isAuthenticated ? ['published', 'draft'] : ['published'] },
    },
  })

  if (!latestPublishedArticle) {
    return { latestPublishedArticle: null }
  }

  const featuredImage = latestPublishedArticle.featuredImage
    ? {
        altText: latestPublishedArticle.featuredImage.altText,
        sources: createImageSources(
          'article-image',
          latestPublishedArticle.featuredImage,
        ),
      }
    : null

  return {
    latestPublishedArticle: { ...latestPublishedArticle, featuredImage },
  }
}
