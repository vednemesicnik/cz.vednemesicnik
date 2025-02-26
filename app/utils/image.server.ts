import type { FormatEnum } from "sharp"
import { z } from "zod"

import {
  FORMAT_SEARCH_PARAM,
  HEIGHT_SEARCH_PARAM,
  QUALITY_SEARCH_PARAM,
  WIDTH_SEARCH_PARAM,
} from "~/utils/create-image-source-route"

const validFormats = ["avif", "webp", "jpeg"] satisfies Array<keyof FormatEnum>

const imageParamsSchema = z.object({
  width: z.number().nullable(),
  height: z.number().nullable(),
  quality: z.number().min(1).max(100).nullable(),
  format: z.enum(validFormats as [string, ...string[]]).nullable(),
})

export const getImageParams = (request: Request) => {
  const url = new URL(request.url)

  const width = url.searchParams.get(WIDTH_SEARCH_PARAM)
  const quality = url.searchParams.get(QUALITY_SEARCH_PARAM)
  const height = url.searchParams.get(HEIGHT_SEARCH_PARAM)
  const format = url.searchParams.get(FORMAT_SEARCH_PARAM)

  const result = imageParamsSchema.safeParse({
    width: width !== null ? Number(width) : null,
    height: height !== null ? Number(height) : null,
    quality: quality !== null ? Number(quality) : null,
    format,
  })

  if (!result.success) {
    throw new Error(
      `Invalid image parameters: ${result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ")}`
    )
  }

  return {
    width: result.data.width,
    height: result.data.height,
    quality: result.data.quality,
    format: result.data.format as unknown as keyof FormatEnum | null,
  }
}

export const createImageResponse = (
  image: {
    blob: Uint8Array
    contentType: string
  },
  fileName: string,
  tag: string
) => {
  return new Response(image.blob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": image.blob.byteLength.toString(),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
      ETag: tag,
    },
  })
}
