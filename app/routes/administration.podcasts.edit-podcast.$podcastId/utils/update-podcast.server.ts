import { createId } from "@paralleldrive/cuid2"
import { Prisma } from "@prisma/client"

import { prisma } from "~/utils/db.server"

type Args = {
  title: string
  id: string
  slug: string
  description: string
  coverId: string
  cover?: File
}

export async function updatePodcast({
  title,
  id,
  slug,
  description,
  coverId,
  cover,
}: Args) {
  const coverAltText = `Obálka podcastu ${title}`

  try {
    await prisma.podcast.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        cover: {
          update: {
            where: { id: coverId },
            data:
              cover !== undefined
                ? {
                    id: createId(),
                    altText: coverAltText,
                    contentType: cover.type,
                    blob: Buffer.from(await cover.arrayBuffer()),
                  }
                : {
                    altText: coverAltText,
                  },
          },
        },
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Response(
        `Error ${error.code}: Unable to update the podcast. ${error.message}`,
        {
          status: 400,
        }
      )
    }

    throw error
  }
}
