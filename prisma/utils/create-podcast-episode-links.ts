import type { PrismaClient } from '@generated/prisma/client'
import type { PodcastEpisodeLinkDataObject } from '~~/types/podcast-episode-link-data-object'

export const createPodcastEpisodeLinks = async (
  prisma: PrismaClient,
  data: PodcastEpisodeLinkDataObject[],
  authorId: string,
) => {
  for (const podcastEpisodeLinkData of data) {
    await prisma.podcastEpisodeLink.create({
      data: {
        authorId: authorId,
        episodeId: podcastEpisodeLinkData.episodeId,
        id: podcastEpisodeLinkData.id,
        label: podcastEpisodeLinkData.label,
        publishedAt: podcastEpisodeLinkData.publishedAt,
        state: podcastEpisodeLinkData.state,
        url: podcastEpisodeLinkData.url,
      },
    })
  }
}
