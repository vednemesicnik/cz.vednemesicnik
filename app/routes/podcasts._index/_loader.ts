import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const podcastsPromise = prisma.podcast.findMany({
    where: {
      state: "published",
    },
    orderBy: {
      publishedAt: "desc",
    },
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
      state: "published",
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

  return { podcasts, episodes }
}
