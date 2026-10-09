import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import { findTagsWithArticleCounts } from '../../utils/find-tags-with-article-counts.server'
import { nameCollator } from '../../utils/name-collator'
import { pickTopByArticleCount } from '../../utils/pick-top-by-article-count'
import type { Route } from './+types/route'

const LATEST_ARTICLES_PER_CATEGORY = 2
const TAG_STRIP_SIZE = 3

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
    'article_tag',
  ])
  const visibleArticles = visibility.where('article', ownArticle)

  const [categories, tags] = await Promise.all([
    prisma.articleCategory.findMany({
      select: {
        _count: {
          select: {
            articles: { where: visibleArticles },
          },
        },
        articles: {
          orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            publishedAt: true,
            slug: true,
            title: true,
          },
          take: LATEST_ARTICLES_PER_CATEGORY,
          where: visibleArticles,
        },
        id: true,
        name: true,
        slug: true,
      },
      where: visibility.where('article_category', ownByAuthor),
    }),
    findTagsWithArticleCounts(visibility),
  ])

  // Hide taxonomies whose visible article count is zero.
  const categoriesWithArticles = categories
    .filter((category) => category._count.articles > 0)
    .sort((first, second) => nameCollator.compare(first.name, second.name))
    .map((category) => ({
      articleCount: category._count.articles,
      id: category.id,
      latestArticles: category.articles.map((article) => ({
        ...article,
        publishedAt: createFormattedDate(article.publishedAt),
      })),
      name: category.name,
      slug: category.slug,
    }))

  const tagLinks = pickTopByArticleCount(tags, TAG_STRIP_SIZE).map((tag) => ({
    name: tag.name,
    slug: tag.slug,
  }))

  return { categories: categoriesWithArticles, tagLinks }
}
