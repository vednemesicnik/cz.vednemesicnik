import type { ContentState } from '@generated/prisma/enums'
import { getAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { isAuthenticated } = await getAuthentication(request)

  // Anonymous visitors see published taxonomies; authenticated users also see drafts.
  const visibleStates: ContentState[] = isAuthenticated
    ? ['published', 'draft']
    : ['published']

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      _count: {
        select: { articles: { where: { state: { in: visibleStates } } } },
      },
      id: true,
      name: true,
      slug: true,
    },
    where: { state: { in: visibleStates } },
  })

  // Hide taxonomies whose visible article count is zero.
  const categoriesWithArticles = categories
    .map((category) => ({
      articleCount: category._count.articles,
      id: category.id,
      name: category.name,
      slug: category.slug,
    }))
    .filter((category) => category.articleCount > 0)

  return { categories: categoriesWithArticles }
}
