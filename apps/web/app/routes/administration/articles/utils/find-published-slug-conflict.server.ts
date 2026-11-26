import { prisma } from '~/utils/db.server'
import { getFreeSlugSuggestion } from '~/utils/get-free-slug-suggestion'

type Options = {
  articleId: string
  slug: string | null
}

/**
 * Whether another article holds the address as published (log 0039): only
 * a published address is unique, so two drafts may share one. A retracted
 * or archived article keeps holding its address.
 *
 * @param options - The article and the address it has.
 * @returns A free address to offer when another article holds this one
 *   (design 24d), or `null` when it is free or empty.
 */
export const findPublishedSlugConflict = async ({
  articleId,
  slug,
}: Options): Promise<{ freeSlug: string } | null> => {
  if (slug === null || slug === '') return null

  const holders = await prisma.article.findMany({
    select: { publishedSlug: true },
    where: { id: { not: articleId }, publishedSlug: { startsWith: slug } },
  })
  const takenSlugs = holders.flatMap(({ publishedSlug }) =>
    publishedSlug === null ? [] : [publishedSlug],
  )

  return takenSlugs.includes(slug)
    ? { freeSlug: getFreeSlugSuggestion(slug, takenSlugs) }
    : null
}
