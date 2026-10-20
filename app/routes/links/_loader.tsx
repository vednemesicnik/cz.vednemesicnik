import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'

export const loader = async () => {
  const latestIssue = await prisma.issue.findFirst({
    orderBy: [{ year: 'desc' }, { order: 'desc' }],
    select: {
      cover: {
        select: imageSourceSelect,
      },
      pdf: {
        select: {
          fileName: true,
        },
      },
    },
    // The latest issue, not a supplement printed alongside it.
    where: {
      state: 'published',
      supplementSlug: '',
    },
  })

  const latestPodcastEpisode = await prisma.podcastEpisode.findFirst({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      cover: {
        select: imageSourceSelect,
      },
      podcast: {
        select: {
          cover: {
            select: imageSourceSelect,
          },
          slug: true,
        },
      },
      slug: true,
    },
    where: {
      state: 'published',
    },
  })

  return {
    latestIssue: latestIssue
      ? {
          ...latestIssue,
          coverSources: createImageSources('issue-cover', latestIssue.cover),
        }
      : null,
    latestPodcastEpisode: latestPodcastEpisode
      ? {
          ...latestPodcastEpisode,
          coverSources: createImageSources(
            'podcast-episode-cover',
            latestPodcastEpisode.cover,
          ),
          podcastCoverSources: createImageSources(
            'podcast-cover',
            latestPodcastEpisode.podcast.cover,
          ),
        }
      : null,
  }
}
