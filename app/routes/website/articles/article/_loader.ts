import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { articleSlug } = params

  const { isAuthenticated } = await getAuthentication(request)

  const article = await prisma.article.findUnique({
    select: {
      author: {
        select: {
          name: true,
        },
      },
      categories: {
        select: {
          name: true,
          slug: true,
        },
      },
      content: true,
      createdAt: true,
      featuredImage: {
        select: {
          altText: true,
          description: true,
          id: true,
        },
      },
      images: {
        select: {
          altText: true,
          description: true,
          id: true,
        },
      },
      publishedAt: true,
      tags: {
        select: {
          name: true,
          slug: true,
        },
      },
      title: true,
      updatedAt: true,
    },
    where: {
      slug: articleSlug,
      state: {
        in: isAuthenticated
          ? ['draft', 'published', 'archived']
          : ['published'],
      },
    },
  })

  if (!article) {
    throw new Response('Článek nenalezen', { status: 404 })
  }

  return { article }
}
