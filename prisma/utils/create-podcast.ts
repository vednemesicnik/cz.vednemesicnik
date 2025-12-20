import type { PrismaClient } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
import { users } from '~~/data/users'

import { getPodcastCover } from './get-podcast-cover'

export type PodcastData = {
  slug: string
  title: string
  description: string
  publishedAt: Date
  state: ContentState
  episodes: {
    number: number
    slug: string
    title: string
    description: string
    publishedAt: Date
    state: ContentState
    links: {
      label: string
      url: string
      publishedAt: Date
      state: ContentState
    }[]
  }[]
  cover?: {
    altText: string
    filePath: string
  }
}

export const createPodcast = async (
  prisma: PrismaClient,
  data: PodcastData,
) => {
  const user = await prisma.user.findUniqueOrThrow({
    select: { authorId: true },
    where: { email: users[0].email },
  })

  await prisma.podcast
    .create({
      data: {
        author: {
          connect: { id: user.authorId },
        },
        cover: data.cover
          ? {
              create: await getPodcastCover({
                altText: data.cover.altText,
                filePath: data.cover.filePath,
              }),
            }
          : undefined,
        description: data.description,
        episodes: {
          create: data.episodes.map((episode) => ({
            author: {
              connect: { id: user.authorId },
            },
            description: episode.description,
            links: {
              create: episode.links.map((link) => ({
                author: {
                  connect: { id: user.authorId },
                },
                label: link.label,
                publishedAt: link.publishedAt,
                state: link.state,
                url: link.url,
              })),
            },
            number: episode.number,
            publishedAt: episode.publishedAt,
            slug: episode.slug,
            state: episode.state,
            title: episode.title,
          })),
        },
        publishedAt: data.publishedAt,
        slug: data.slug,
        state: data.state,
        title: data.title,
      },
    })
    .catch((error) => {
      console.error('Error creating podcast:', error)
      return null
    })
}
