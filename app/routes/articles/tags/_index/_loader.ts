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
    'article_tag',
  ])

  const tags = await prisma.articleTag.findMany({
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
    where: visibility.where('article_tag', ownByAuthor),
  })

  // Hide taxonomies whose visible article count is zero.
  const tagsWithArticles = tags
    .map((tag) => ({
      articleCount: tag._count.articles,
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }))
    .filter((tag) => tag.articleCount > 0)

  return { tags: tagsWithArticles }
}
