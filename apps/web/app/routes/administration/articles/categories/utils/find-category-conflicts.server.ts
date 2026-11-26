import { prisma } from '~/utils/db.server'
import { getTaxonomyConflicts } from '../../utils/get-taxonomy-conflicts'

type Options = {
  name: string
  slug: string
  excludeId?: string
}

/**
 * Checks a category's name and address against every other category (design
 * 25c). There are a few dozen, so all are read and compared in JavaScript.
 *
 * @param options.excludeId - The category being edited, left out of the
 *   comparison.
 */
export const findCategoryConflicts = async ({
  name,
  slug,
  excludeId,
}: Options) => {
  const otherCategories = await prisma.articleCategory.findMany({
    select: { name: true, slug: true },
    where: excludeId === undefined ? {} : { id: { not: excludeId } },
  })

  return getTaxonomyConflicts(otherCategories, { name, slug })
}
