import { createImageSourceRoute } from '~/utils/create-image-source-route'

type Options = {
  width: number
  height: number
  quality?: number
}

export function createImageSources(src: string, options: Options) {
  const { width, height, quality } = options

  const avifSrc_1x = createImageSourceRoute(src, {
    format: 'avif',
    height,
    quality,
    width,
  })

  const avifSrc_2x = createImageSourceRoute(src, {
    format: 'avif',
    height: height * 2,
    quality,
    width: width * 2,
  })

  const webpSrc_1x = createImageSourceRoute(src, {
    format: 'webp',
    height,
    quality,
    width,
  })

  const webpSrc_2x = createImageSourceRoute(src, {
    format: 'webp',
    height: height * 2,
    quality,
    width: width * 2,
  })

  const jpegSrc_1x = createImageSourceRoute(src, {
    format: 'jpeg',
    height,
    quality,
    width,
  })

  const jpegSrc_2x = createImageSourceRoute(src, {
    format: 'jpeg',
    height: height * 2,
    quality,
    width: width * 2,
  })

  return {
    avifSrc_1x,
    avifSrc_2x,
    jpegSrc_1x,
    jpegSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
  }
}
