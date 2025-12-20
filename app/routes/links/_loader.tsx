import { prisma } from '~/utils/db.server'

export const loader = async () => {
  const latestIssue = await prisma.issue.findFirst({
    orderBy: {
      releasedAt: 'desc',
    },
    select: {
      cover: {
        select: {
          id: true,
        },
      },
      label: true,
      pdf: {
        select: {
          fileName: true,
        },
      },
    },
    where: {
      state: 'published',
    },
  })

  const latestPodcastEpisode = await prisma.podcastEpisode.findFirst({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
      cover: {
        select: {
          id: true,
        },
      },
      podcast: {
        select: {
          cover: {
            select: {
              id: true,
            },
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
    latestIssue,
    latestPodcastEpisode,
  }
}
