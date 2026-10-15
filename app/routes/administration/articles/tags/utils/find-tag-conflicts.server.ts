import { prisma } from '~/utils/db.server'
import { getTaxonomyConflicts } from '../../utils/get-taxonomy-conflicts'

type Options = {
  name: string
  slug: string
  excludeId?: string
}

/**
 * Checks a tag's name and address against every other tag (design
 * 25c). There are a few hundred at most, so all are read and compared in JavaScript.
 *
 * @param options.excludeId - The tag being edited, left out of the
 *   comparison.
 */
export const findTagConflicts = async ({ name, slug, excludeId }: Options) => {
  const otherTags = await prisma.articleTag.findMany({
    select: { name: true, slug: true },
    where: excludeId === undefined ? {} : { id: { not: excludeId } },
  })

  return getTaxonomyConflicts(otherTags, { name, slug })
}
