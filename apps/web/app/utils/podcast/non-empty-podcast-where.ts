import type { Prisma } from '@generated/prisma/client'

/**
 * Podcasts saved with a title or description, or with a cover uploaded. An
 * empty draft (log 0020) is left out of every list, count and preview until
 * then.
 */
export const NON_EMPTY_PODCAST_WHERE = {
  firstContentAt: { not: null },
} satisfies Prisma.PodcastWhereInput
