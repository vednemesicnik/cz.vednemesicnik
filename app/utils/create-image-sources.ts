import { createImageSourceRoute } from "~/utils/create-image-source-route"

type Options = {
  width: number
  height: number
  quality?: number
}

export function createImageSources(src: string, options: Options) {
  const { width, height, quality } = options

  const avifSrc_1x = createImageSourceRoute(src, {
    format: "avif",
    width,
    height,
    quality,
  })

  const avifSrc_2x = createImageSourceRoute(src, {
    format: "avif",
    width: width * 2,
    height: height * 2,
    quality,
  })

  const webpSrc_1x = createImageSourceRoute(src, {
    format: "webp",
    width,
    height,
    quality,
  })

  const webpSrc_2x = createImageSourceRoute(src, {
    format: "webp",
    width: width * 2,
    height: height * 2,
    quality,
  })

  const fallbackSrc_1x = createImageSourceRoute(src, {
    format: "jpeg",
    width,
    height,
    quality,
  })

  const fallbackSrc_2x = createImageSourceRoute(src, {
    format: "jpeg",
    width: width * 2,
    height: height * 2,
    quality,
  })

  return {
    avifSrc_1x,
    avifSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
    fallbackSrc_1x,
    fallbackSrc_2x,
  }
}
