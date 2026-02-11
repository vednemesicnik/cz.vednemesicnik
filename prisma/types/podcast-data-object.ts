import type { ContentState } from '@generated/prisma/enums'

export type PodcastDataObject = {
  id: string
  slug: string
  title: string
  description: string
  publishedAt: Date
  state: ContentState
  cover?: {
    altText: string
    filePath: string
  }
}
