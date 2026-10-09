import { getWebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'
import { findCategoriesWithArticleCounts } from '../../utils/find-categories-with-article-counts.server'
import { findTagsWithArticleCounts } from '../../utils/find-tags-with-article-counts.server'
import { groupTagsByLetter } from '../../utils/group-tags-by-letter'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const visibility = await getWebContentVisibility(request, [
    'article',
    'article_category',
    'article_tag',
  ])

  const [tags, categories] = await Promise.all([
    findTagsWithArticleCounts(visibility),
    findCategoriesWithArticleCounts(visibility),
  ])

  return {
    hasCategories: categories.length > 0,
    tagGroups: groupTagsByLetter(tags),
  }
}
