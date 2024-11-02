import { combineClasses } from "@liborgabrhel/style-utils"

import { createImageSourceRoute } from "~/utils/create-image-source-route"

import styles from "./_styles.module.css"

const DEFAULT_QUALITY = 75

type Props = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export const Image = ({ src, alt, width, height, className }: Props) => {
  const avifSrc_1x = createImageSourceRoute(src, {
    format: "avif",
    width,
    height,
    quality: DEFAULT_QUALITY,
  })
  const avifSrc_2x = createImageSourceRoute(src, {
    format: "avif",
    width: width * 2,
    height: height * 2,
    quality: DEFAULT_QUALITY,
  })
  const webpSrc_1x = createImageSourceRoute(src, {
    format: "webp",
    width,
    height,
    quality: DEFAULT_QUALITY,
  })
  const webpSrc_2x = createImageSourceRoute(src, {
    format: "webp",
    width: width * 2,
    height: height * 2,
    quality: DEFAULT_QUALITY,
  })
  const fallbackSrc_1x = createImageSourceRoute(src, {
    format: "jpeg",
    width,
    height,
    quality: DEFAULT_QUALITY,
  })
  const fallbackSrc_2x = createImageSourceRoute(src, {
    format: "jpeg",
    width: width * 2,
    height: height * 2,
    quality: DEFAULT_QUALITY,
  })

  return (
    <picture className={combineClasses(styles.picture, className)}>
      <source type="image/avif" srcSet={`${avifSrc_1x}, ${avifSrc_2x} 2x`} />
      <source type="image/webp" srcSet={`${webpSrc_1x}, ${webpSrc_2x} 2x`} />
      <img
        className={styles.image}
        srcSet={`${fallbackSrc_1x}, ${fallbackSrc_2x} 2x`}
        src={fallbackSrc_1x}
        alt={alt}
        width={width}
        height={height}
        loading={"lazy"}
      />
    </picture>
  )
}
