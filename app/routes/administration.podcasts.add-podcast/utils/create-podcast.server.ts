import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  cover: File
  title: string
  slug: string
  description: string
}

export async function createPodcast({ cover, title, slug, description }: Args) {
  try {
    await prisma.podcast.create({
      data: {
        title,
        slug,
        description,
        cover: {
          create: {
            altText: `Obálka podcastu ${title}`,
            contentType: cover.type,
            blob: Buffer.from(await cover.arrayBuffer()),
          },
        },
        author: {
          connect: { username: "owner" },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to create the podcast. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
