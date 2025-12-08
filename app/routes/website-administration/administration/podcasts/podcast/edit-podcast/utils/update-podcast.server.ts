import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { getConvertedImageStream } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  id: string
  title: string
  slug: string
  description: string
  coverId: string
  cover?: File
  authorId: string
}

export async function updatePodcast({
  id,
  title,
  slug,
  description,
  coverId,
  cover,
  authorId,
}: Args) {
  const coverAltText = `Obálka podcastu ${title}`
  const convertedCover = cover
    ? await getConvertedImageStream(cover, {
        width: 1280,
        height: 1280,
        quality: 80,
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
                    id: createId(), // New ID forces browser to download new image
                    altText: coverAltText,
                    contentType: convertedCover.contentType,
                    blob: Uint8Array.from(
                      await convertedCover.stream.toBuffer()
                    ),
                  }
                : {
                    altText: coverAltText,
                  },
          },
        },
        authorId: authorId,
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the podcast.")
  }
}
