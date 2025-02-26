import { prisma } from "~/utils/db.server"
import { getContentHash } from "~/utils/hash.server"
import { createImageResponse, getImageParams } from "~/utils/image.server"
import { convertImage } from "~/utils/sharp.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { issueId } = params

  const image = await prisma.issueCover.findUniqueOrThrow({
    where: { id: issueId },
    select: { blob: true },
  })

  const { width, height, quality, format } = getImageParams(request)

  const convertedImage = await convertImage(image.blob, {
    width,
    height,
    quality,
    format,
  })

  const tag = getContentHash(request.url)

  return createImageResponse(convertedImage, issueId, tag)
}
