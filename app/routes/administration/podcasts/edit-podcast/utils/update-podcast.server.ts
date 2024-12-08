import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { convertImage } from "~/utils/sharp.server"
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
  const convertedCover = cover
    ? await convertImage(cover, {
        width: "1280",
        height: "1280",
        quality: "100",
        format: "jpeg",
      })
    : undefined

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
              convertedCover !== undefined
                ? {
                    id: createId(),
                    altText: coverAltText,
                    contentType: convertedCover.contentType,
                    blob: Uint8Array.from(convertedCover.blob),
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
