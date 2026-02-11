import type { PrismaClient } from '@generated/prisma/client'
import type { PodcastDataObject } from '~~/types/podcast-data-object'
import { getPodcastCover } from './get-podcast-cover'

export const createPodcasts = async (
  prisma: PrismaClient,
  data: PodcastDataObject[],
  authorId: string,
) => {
  for (const podcastData of data) {
    await prisma.podcast.create({
      data: {
        authorId: authorId,
        cover: podcastData.cover
          ? {
              create: await getPodcastCover({
                altText: podcastData.cover.altText,
                filePath: podcastData.cover.filePath,
              }),
            }
          : undefined,
        description: podcastData.description,
        id: podcastData.id,
        publishedAt: podcastData.publishedAt,
        slug: podcastData.slug,
        state: podcastData.state,
        title: podcastData.title,
      },
    })
  }
}
