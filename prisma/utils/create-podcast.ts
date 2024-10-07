import type { PrismaClient } from "@prisma/client"

import { getPodcastCover } from "./get-podcast-cover"

export type PodcastData = {
  slug: string
  title: string
  description: string
  episodes: {
    slug: string
    title: string
    description: string
    publishedAt: Date
    published: boolean
    links: { label: string; url: string }[]
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
  await prisma.podcast
    .create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        episodes: {
          create: data.episodes.map((episode) => ({
            slug: episode.slug,
            title: episode.title,
            description: episode.description,
            publishedAt: episode.publishedAt,
            published: episode.published,
            links: {
              create: episode.links,
            },
            author: {
              connect: { username: "owner" },
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
          connect: { username: "owner" },
        },
      },
    })
    .catch((error) => {
      console.error("Error creating podcast:", error)
      return null
    })
}
