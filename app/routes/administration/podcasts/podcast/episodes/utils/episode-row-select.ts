import type { Prisma } from '@generated/prisma/client'

/**
 * What an episode row's number, state, fact and actions are read from,
 * wherever the row stands (design 27b).
 */
export const EPISODE_ROW_SELECT = {
  author: {
    select: {
      id: true,
      name: true,
      role: { select: { level: true } },
    },
  },
  description: true,
  heldByAuthor: { select: { name: true } },
  heldByAuthorId: true,
  heldByTabId: true,
  heldSince: true,
  heldUntil: true,
  id: true,
  links: {
    orderBy: { order: 'asc' },
    select: { label: true, url: true },
  },
  number: true,
  publishedAt: true,
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
  title: true,
  updatedAt: true,
} satisfies Prisma.PodcastEpisodeSelect

export type EpisodeRowRecord = Prisma.PodcastEpisodeGetPayload<{
  select: typeof EPISODE_ROW_SELECT
}>
