import { createId } from "@paralleldrive/cuid2"

import { prisma } from "~/utils/db.server"
import { getConvertedImageStream } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  title: string
  id: string
  slug: string
  description: string
  coverId: string
  cover?: File
  publishedAt: string
}

export async function updatePodcast({
  title,
  id,
  slug,
  description,
  coverId,
  cover,
  publishedAt,
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
        publishedAt: new Date(publishedAt),
        state: "published",
        cover: {
          update: {
            where: { id: coverId },
            data:
              convertedCover !== undefined
                ? {
                    id: createId(),
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
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to update the podcast.")
  }
}
