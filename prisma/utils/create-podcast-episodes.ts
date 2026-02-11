import type { PrismaClient } from '@generated/prisma/client'
import type { PodcastEpisodeDataObject } from '~~/types/podcast-episode-data-object'

export const createPodcastEpisodes = async (
  prisma: PrismaClient,
  data: PodcastEpisodeDataObject[],
  authorId: string,
) => {
  for (const podcastEpisodeData of data) {
    await prisma.podcastEpisode.create({
      data: {
        authorId: authorId,
        description: podcastEpisodeData.description,
        id: podcastEpisodeData.id,
        number: podcastEpisodeData.number,
        podcastId: podcastEpisodeData.podcastId,
        publishedAt: podcastEpisodeData.publishedAt,
        slug: podcastEpisodeData.slug,
        state: podcastEpisodeData.state,
        title: podcastEpisodeData.title,
      },
    })
  }
}
