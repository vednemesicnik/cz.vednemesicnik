import { prisma } from '~/utils/db.server'
import {
  ownArticle,
  ownByAuthor,
  type WebContentVisibility,
} from '~/utils/permissions/author/get-web-content-visibility.server'
import { nameCollator } from './name-collator'

/**
 * Finds the tags a reader can open that hold at least one article they can
 * see, with that article count.
 *
 * @param visibility - The request's web visibility, built for `article` and `article_tag`.
 * @returns Tags ordered by name (Czech collation), each with `articleCount > 0`.
 */
export const findTagsWithArticleCounts = async (
  visibility: WebContentVisibility,
) => {
  const tags = await prisma.articleTag.findMany({
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

  return tags
    .map((tag) => ({
      articleCount: tag._count.articles,
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }))
    .filter((tag) => tag.articleCount > 0)
    .sort((first, second) => nameCollator.compare(first.name, second.name))
}
