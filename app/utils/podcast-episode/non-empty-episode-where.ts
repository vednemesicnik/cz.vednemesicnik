import type { Prisma } from '@generated/prisma/client'

/**
 * Episodes that have been saved or have had a cover uploaded. An empty draft
 * (log 0020) is left out of every list, count and preview until then.
 */
export const NON_EMPTY_EPISODE_WHERE = {
  firstContentAt: { not: null },
} satisfies Prisma.PodcastEpisodeWhereInput
