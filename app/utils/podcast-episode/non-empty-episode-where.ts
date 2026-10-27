import type { Prisma } from '@generated/prisma/client'

/**
 * Episodes saved with a title, description or link, or with a cover uploaded
 * (log 0048). An empty draft (log 0020) is left out of every list, count and
 * preview until then.
 */
export const NON_EMPTY_EPISODE_WHERE = {
  firstContentAt: { not: null },
} satisfies Prisma.PodcastEpisodeWhereInput
