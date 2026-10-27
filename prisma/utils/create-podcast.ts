import type { PrismaClient } from '@generated/prisma/client'
import type { ContentState } from '@generated/prisma/enums'
import { users } from '~~/data/users'

import { storeSeedImage } from './store-seed-image'

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
              create: await storeSeedImage({
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
            // A seeded episode has content, so it is no empty draft (log 0020).
            firstContentAt: episode.publishedAt,
            links: {
              create: episode.links.map((link, index) => ({
                label: link.label,
                order: index,
                url: link.url,
              })),
            },
            number: episode.number,
            publishedAt: episode.publishedAt,
            // Only publish writes the held number and address (log 0039); a
            // seeded published or archived episode holds them already.
            publishedNumber: episode.state === 'draft' ? null : episode.number,
            publishedSlug: episode.state === 'draft' ? null : episode.slug,
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
