import type { Prisma } from '@generated/prisma/client'

import { imageSourceSelect } from '~/utils/image-store/create-image-sources'
import { NON_EMPTY_EPISODE_WHERE } from '~/utils/podcast-episode/non-empty-episode-where'

/**
 * What a podcast row's cover, state, fact and actions are read from, wherever
 * the row stands (design 27a).
 */
export const PODCAST_ROW_SELECT = {
  // An empty draft never counts, nor blocks the delete (log 0020).
  _count: { select: { episodes: { where: NON_EMPTY_EPISODE_WHERE } } },
  author: {
    select: { id: true, name: true, role: { select: { level: true } } },
  },
  cover: { select: imageSourceSelect },
  description: true,
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  id: true,
  reviews: {
    select: {
      createdAt: true,
      reviewer: {
        select: { id: true, role: { select: { level: true } } },
      },
    },
  },
  slug: true,
  state: true,
  submittedAt: true,
  submittedBy: { select: { name: true } },
  title: true,
  updatedAt: true,
} satisfies Prisma.PodcastSelect

export type PodcastRowRecord = Prisma.PodcastGetPayload<{
  select: typeof PODCAST_ROW_SELECT
}>
