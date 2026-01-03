import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  const articles = await prisma.article.findMany({
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
      id: true,
      publishedAt: true,
      slug: true,
      title: true,
    },
    where: isAuthenticated
      ? {
          state: { in: ['published', 'draft'] },
        }
      : {
          state: 'published',
        },
  })

  return { articles }
}
