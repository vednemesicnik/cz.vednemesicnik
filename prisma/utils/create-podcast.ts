import type { PrismaClient } from "@generated/prisma/client"
import { type ContentState } from "@generated/prisma/enums"
import { users } from "~~/data/users"

import { getPodcastCover } from "./get-podcast-cover"

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
  data: PodcastData
) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: users[0].email },
    select: { authorId: true },
  })

  await prisma.podcast
    .create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        publishedAt: data.publishedAt,
        state: data.state,
        episodes: {
          create: data.episodes.map((episode) => ({
            number: episode.number,
            slug: episode.slug,
            title: episode.title,
            description: episode.description,
            publishedAt: episode.publishedAt,
            state: episode.state,
            links: {
              create: episode.links.map((link) => ({
                label: link.label,
                url: link.url,
                publishedAt: link.publishedAt,
                state: link.state,
                author: {
                  connect: { id: user.authorId },
                },
              })),
            },
            author: {
              connect: { id: user.authorId },
            },
          })),
        },
        cover: data.cover
          ? {
              create: await getPodcastCover({
                altText: data.cover.altText,
                filePath: data.cover.filePath,
              }),
            }
          : undefined,
        author: {
          connect: { id: user.authorId },
        },
      },
    })
    .catch((error) => {
      console.error("Error creating podcast:", error)
      return null
    })
}
