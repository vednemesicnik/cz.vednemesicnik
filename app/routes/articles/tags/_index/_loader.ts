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

  const tags = await prisma.articleTag.findMany({
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
