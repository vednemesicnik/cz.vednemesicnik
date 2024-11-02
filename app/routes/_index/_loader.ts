import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const latestArchivedIssuesPromise = prisma.archivedIssue.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      label: true,
      pdf: {
        select: {
          id: true,
          fileName: true,
        },
      },
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
    },
  })

  const latestPodcastEpisodesPromise = prisma.podcastEpisode.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 1,
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      podcast: {
        select: {
          id: true,
          slug: true,
          title: true,
          cover: {
            select: {
              id: true,
              altText: true,
            },
          },
        },
      },
    },
  })

  const [latestArchivedIssues, latestPodcastEpisodes] = await Promise.all([
    latestArchivedIssuesPromise,
    latestPodcastEpisodesPromise,
  ])

  return json({ latestArchivedIssues, latestPodcastEpisodes })
}
