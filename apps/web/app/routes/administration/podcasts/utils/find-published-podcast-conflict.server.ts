import { prisma } from '~/utils/db.server'
import { getFreeSlugSuggestion } from '~/utils/get-free-slug-suggestion'

type Options = {
  podcastId: string
  slug: string
}

type PodcastConflict = {
  /** The address, when another podcast holds it as published. */
  takenSlug: string | null
  /** The address *Použít …* offers for a taken one (24d, 27e). */
  slugSuggestion: string | null
}

/**
 * Whether another podcast holds the address as published (design 27e,
 * 2whigbz5; log 0039): only a published address is unique, so a draft saves
 * a taken one and the editor says so at the field. A retracted or archived
 * podcast keeps holding its own.
 *
 * @param options - The podcast and the address it has.
 * @returns The taken address with a free one to offer, `null` where free or
 *   empty.
 */
export const findPublishedPodcastConflict = async ({
  podcastId,
  slug,
}: Options): Promise<PodcastConflict> => {
  const holders =
    slug === ''
      ? []
      : await prisma.podcast.findMany({
          select: { publishedSlug: true },
          where: {
            id: { not: podcastId },
            publishedSlug: { startsWith: slug },
          },
        })

  const takenSlugs = holders.flatMap(({ publishedSlug }) =>
    publishedSlug === null ? [] : [publishedSlug],
  )
  const isSlugTaken = takenSlugs.includes(slug)

  return {
    slugSuggestion: isSlugTaken
      ? getFreeSlugSuggestion(slug, takenSlugs)
      : null,
    takenSlug: isSlugTaken ? slug : null,
  }
}
