import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const podcastsPromise = prisma.podcast.findMany({
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
  })

  const episodesPromise = prisma.podcastEpisode.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
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

  const [podcasts, episodes] = await Promise.all([
    podcastsPromise,
    episodesPromise,
  ])

  return json({ podcasts, episodes })
}
