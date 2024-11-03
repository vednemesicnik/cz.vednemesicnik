import { combineClasses } from "@liborgabrhel/style-utils"
import { animated, useSpring } from "@react-spring/web"
import { useState } from "react"

import { createImageSources } from "~/utils/create-image-sources"
import { useHydrated } from "~/utils/use-hydrated"

import styles from "./_styles.module.css"

const DEFAULT_QUALITY = 75
const DEFAULT_PLACEHOLDER_QUALITY = 25

type Props = {
  src: string
  alt: string
  width: number
  height: number
  placeholderWidth: number
  placeholderHeight: number
  className?: string
}

export const Image = ({
  src,
  alt,
  width,
  height,
  placeholderWidth,
  placeholderHeight,
  className,
}: Props) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  const { isHydrated } = useHydrated()
  console.log("isHydrated: ", isHydrated)

  const {
    avifSrc_1x: avifPlaceholderSrc_1x,
    webpSrc_1x: webpPlaceholderSrc_1x,
    fallbackSrc_1x: fallbackPlaceholderSrc_1x,
  } = createImageSources(src, {
    width: placeholderWidth,
    height: placeholderHeight,
    quality: DEFAULT_PLACEHOLDER_QUALITY,
  })

  const {
    avifSrc_1x,
    avifSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
    fallbackSrc_1x,
    fallbackSrc_2x,
  } = createImageSources(src, {
    width,
    height,
    quality: DEFAULT_QUALITY,
  })

  const placeholderImageSpringStyles = useSpring({
    opacity: isImageLoaded ? 0 : 1,
    from: { opacity: 1 },
  })

  const imageSpringStyles = useSpring({
    opacity: isImageLoaded ? 1 : 0,
    from: { opacity: 0 },
  })

  return (
    <section className={combineClasses(styles.container, className)}>
      <animated.picture
        className={styles.placeholderPicture}
        style={placeholderImageSpringStyles}
      >
        <source type="image/avif" srcSet={avifPlaceholderSrc_1x} />
        <source type="image/webp" srcSet={webpPlaceholderSrc_1x} />
        <img
          className={styles.image}
          src={fallbackPlaceholderSrc_1x}
          alt={alt}
          width={width}
          height={height}
          loading={"lazy"}
        />
      </animated.picture>

      {isHydrated && (
        <animated.picture className={styles.picture} style={imageSpringStyles}>
          <source
            type="image/avif"
            srcSet={`${avifSrc_1x}, ${avifSrc_2x} 2x`}
          />
          <source
            type="image/webp"
            srcSet={`${webpSrc_1x}, ${webpSrc_2x} 2x`}
          />
          <img
            className={styles.image}
            srcSet={`${fallbackSrc_1x}, ${fallbackSrc_2x} 2x`}
            src={fallbackSrc_1x}
            alt={alt}
            width={width}
            height={height}
            loading={"lazy"}
            onLoad={(event) => {
              console.log("Image loaded: ", event.currentTarget.complete)
              setIsImageLoaded(true)
            }}
          />
        </animated.picture>
      )}
    </section>
  )
}
