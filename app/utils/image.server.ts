import {
  FORMAT_SEARCH_PARAM,
  HEIGHT_SEARCH_PARAM,
  QUALITY_SEARCH_PARAM,
  WIDTH_SEARCH_PARAM,
} from "~/utils/create-image-source-route"

export const getImageParams = (request: Request) => {
  const url = new URL(request.url)

  const width = url.searchParams.get(WIDTH_SEARCH_PARAM)
  const quality = url.searchParams.get(QUALITY_SEARCH_PARAM)
  const height = url.searchParams.get(HEIGHT_SEARCH_PARAM)
  const format = url.searchParams.get(FORMAT_SEARCH_PARAM)

  return {
    width,
    quality,
    height,
    format,
  }
}

export const createImageResponse = (
  image: {
    blob: Buffer
    contentType: string
  },
  fileName: string
) => {
  return new Response(image.blob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": Buffer.byteLength(image.blob).toString(),
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
