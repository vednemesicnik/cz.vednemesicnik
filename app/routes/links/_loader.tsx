import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const latestIssue = await prisma.issue.findFirst({
    where: {
      state: "published",
    },
    orderBy: {
      releasedAt: "desc",
    },
    select: {
      label: true,
      cover: {
        select: {
          id: true,
        },
      },
      pdf: {
        select: {
          fileName: true,
        },
      },
    },
  })

  const latestPodcastEpisode = await prisma.podcastEpisode.findFirst({
    where: {
      state: "published",
    },
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      slug: true,
      cover: {
        select: {
          id: true,
        },
      },
      podcast: {
        select: {
          slug: true,
          cover: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  return {
    latestIssue,
    latestPodcastEpisode,
  }
}
