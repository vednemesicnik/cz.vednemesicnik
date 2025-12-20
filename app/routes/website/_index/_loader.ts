import { prisma } from '~/utils/db.server'

export const loader = async () => {
  const latestArchivedIssuesPromise = prisma.issue.findMany({
    orderBy: {
      releasedAt: 'desc',
    },
    select: {
      cover: {
        select: {
          altText: true,
          id: true,
        },
      },
      id: true,
      label: true,
      pdf: {
        select: {
          fileName: true,
          id: true,
        },
      },
    },
    take: 1,
    where: {
      state: 'published',
    },
  })

  const latestPodcastEpisodesPromise = prisma.podcastEpisode.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      cover: {
        select: {
          altText: true,
          id: true,
        },
      },
      id: true,
      podcast: {
        select: {
          cover: {
            select: {
              altText: true,
              id: true,
            },
          },
          id: true,
          slug: true,
          title: true,
        },
      },
      publishedAt: true,
      slug: true,
      title: true,
    },
    take: 1,
    where: {
      state: 'published',
    },
  })

  const [latestArchivedIssues, latestPodcastEpisodes] = await Promise.all([
    latestArchivedIssuesPromise,
    latestPodcastEpisodesPromise,
  ])

  return { latestArchivedIssues, latestPodcastEpisodes }
}
