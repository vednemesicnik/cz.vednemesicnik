import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

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

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to update the podcast.")
  }
}
