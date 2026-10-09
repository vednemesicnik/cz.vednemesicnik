import { prisma } from '~/utils/db.server'
import {
  type getWebContentVisibility,
  ownArticle,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

type WebContentVisibility = Awaited<ReturnType<typeof getWebContentVisibility>>

const nameCollator = new Intl.Collator('cs', { numeric: true })

/**
 * Finds the categories a reader can open that hold at least one article they
 * can see, with that article count.
 *
 * @param visibility - The request's web visibility, built for `article` and `article_category`.
 * @returns Categories ordered by name (Czech collation), each with `articleCount > 0`.
 */
export const findCategoriesWithArticleCounts = async (
  visibility: WebContentVisibility,
) => {
  const categories = await prisma.articleCategory.findMany({
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

  return categories
    .map((category) => ({
      articleCount: category._count.articles,
      id: category.id,
      name: category.name,
      slug: category.slug,
    }))
    .filter((category) => category.articleCount > 0)
    .sort((first, second) => nameCollator.compare(first.name, second.name))
}
