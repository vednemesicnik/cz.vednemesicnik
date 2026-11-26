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
          // The address the podcast holds since its publish (log 0039).
          publishedSlug: true,
        },
      },
      // The address the episode holds in its podcast since its publish (log 0039).
      publishedSlug: true,
    },
    // An episode of a draft or archived podcast is not taken: its page 404s
    // (16b, 5hl7vx3a).
    where: {
      podcast: { publishedSlug: { not: null }, state: 'published' },
      publishedSlug: { not: null },
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
