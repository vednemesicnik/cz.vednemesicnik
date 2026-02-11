import type { ContentState } from '@generated/prisma/enums'

export type PodcastEpisodeLinkDataObject = {
  id: string
  label: string
  episodeId: string
  publishedAt: Date
  state: ContentState
  url: string
}
