import { prisma } from '~/utils/db.server'
import {
  getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
  ])

  const categories = await prisma.articleCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      _count: {
        select: {
          articles: { where: visibility.where('article', ownArticle) },
        },
      },
      id: true,
      name: true,
      slug: true,
    },
    where: visibility.where('article_category', ownByAuthor),
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
