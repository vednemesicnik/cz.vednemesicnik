import type { ContentState } from '@generated/prisma/enums'

export type PodcastEpisodeDataObject = {
  description: string
  id: string
  number: number
  podcastId: string
  publishedAt: Date
  slug: string
  state: ContentState
  title: string
}
