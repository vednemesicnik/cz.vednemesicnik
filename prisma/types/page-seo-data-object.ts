import type { ContentState } from '@generated/prisma/enums'

export type PageSEODataObject = {
  description?: string
  ogImageUrl?: string
  pathname: string
  robots?: string
  state: ContentState
  title: string
  twitterImageUrl?: string
}
