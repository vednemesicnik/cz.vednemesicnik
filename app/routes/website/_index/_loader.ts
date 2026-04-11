import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
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
      state: { in: isAuthenticated ? ['published', 'draft'] : ['published'] },
    },
  })

  return { latestPublishedArticle }
}
