import { prisma } from '~/utils/db.server'

export const loader = async () => {
  const podcastsPromise = prisma.podcast.findMany({
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
      slug: true,
      title: true,
    },
    where: {
      state: 'published',
    },
  })

  const episodesPromise = prisma.podcastEpisode.findMany({
    orderBy: {
      publishedAt: 'desc',
    },
    select: {
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
    take: 10,
    where: {
      state: 'published',
    },
  })

  const [podcasts, episodes] = await Promise.all([
    podcastsPromise,
    episodesPromise,
  ])

  return { episodes, podcasts }
}
