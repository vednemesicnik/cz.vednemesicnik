import { combineClasses } from "@liborgabrhel/style-utils"
import { animated, useSpring } from "@react-spring/web"
import { useCallback, useEffect, useRef, useState } from "react"

import { createImageSources } from "~/utils/create-image-sources"
import { useHydrated } from "~/utils/use-hydrated"

import styles from "./_styles.module.css"

const DEFAULT_QUALITY = 75
const DEFAULT_PLACEHOLDER_QUALITY = 25

type Props = {
  src: string
  fallback?: string
  alt: string
  width: number
  height: number
  className?: string
  shouldLoadLowRes?: boolean
  shouldLoadHighRes?: boolean
  onLowResLoad?: () => void
  onHighResLoad?: () => void
}

export const Image = ({
  src,
  fallback,
  alt,
  width,
  height,
  className,
  shouldLoadLowRes = true,
  shouldLoadHighRes = true,
  onLowResLoad,
  onHighResLoad,
}: Props) => {
  const isHydrated = useHydrated()

  const [isLowResImageLoaded, setIsLowResImageLoaded] = useState(false)
  const [isHighResImageLoaded, setIsHighResImageLoaded] = useState(false)

  const lowResImageRef = useRef<HTMLImageElement>(null)
  const highResImageRef = useRef<HTMLImageElement>(null)

  const calculatedPlaceholderWidth = Math.max(1, Math.round(width / 10))
  const calculatedPlaceholderHeight = Math.max(1, Math.round(height / 10))

  const {
    avifSrc_1x: avifPlaceholderSrc_1x,
    webpSrc_1x: webpPlaceholderSrc_1x,
    jpegSrc_1x: jpegPlaceholderSrc_1x,
  } = shouldLoadLowRes || isLowResImageLoaded
    ? createImageSources(src, {
        width: calculatedPlaceholderWidth,
        height: calculatedPlaceholderHeight,
        quality: DEFAULT_PLACEHOLDER_QUALITY,
      })
    : {
        avifSrc_1x: `${fallback}.avif`,
        webpSrc_1x: `${fallback}.webp`,
        jpegSrc_1x: `${fallback}.jpeg`,
      }

  const {
    avifSrc_1x,
    avifSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
    jpegSrc_1x,
    jpegSrc_2x,
  } =
    shouldLoadHighRes || isHighResImageLoaded
      ? createImageSources(src, {
          width,
          height,
          quality: DEFAULT_QUALITY,
        })
      : {
          avifSrc_1x: "",
          avifSrc_2x: "",
          webpSrc_1x: "",
          webpSrc_2x: "",
          jpegSrc_1x: "",
          jpegSrc_2x: "",
        }

  const handleLowResImageLoad = useCallback(() => {
    setIsLowResImageLoaded(true)
    if (onLowResLoad !== undefined) {
      onLowResLoad()
    }
  }, [onLowResLoad])

  const handleHighResImageLoad = useCallback(() => {
    setIsHighResImageLoaded(true)
    if (onHighResLoad !== undefined) {
      onHighResLoad()
    }
  }, [onHighResLoad])

  useEffect(() => {
    if (shouldLoadLowRes && lowResImageRef.current) {
      const lowResImage = lowResImageRef.current

      if (lowResImage.complete) {
        handleLowResImageLoad()
      }
    }
  }, [shouldLoadLowRes, handleLowResImageLoad])

  useEffect(() => {
    if (shouldLoadHighRes && highResImageRef.current) {
      const highResImage = highResImageRef.current

      if (highResImage.complete) {
        handleHighResImageLoad()
      }
    }
  }, [shouldLoadHighRes, handleHighResImageLoad])

  const placeholderImageSpringStyles = useSpring({
    opacity: isHighResImageLoaded ? 0 : 1,
    from: { opacity: 1 },
  })

  const imageSpringStyles = useSpring({
    opacity: isHighResImageLoaded ? 1 : 0,
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
          ref={lowResImageRef}
          className={styles.image}
          src={jpegPlaceholderSrc_1x}
          alt={alt}
          width={width}
          height={height}
          loading={"lazy"}
          onLoad={handleLowResImageLoad}
        />
      </animated.picture>

      {isHydrated && (shouldLoadHighRes || isHighResImageLoaded) && (
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
            ref={highResImageRef}
            className={styles.image}
            srcSet={`${jpegSrc_1x}, ${jpegSrc_2x} 2x`}
            src={jpegSrc_1x}
            alt={alt}
            width={width}
            height={height}
            loading={"lazy"}
            onLoad={handleHighResImageLoad}
          />
        </animated.picture>
      )}
    </section>
  )
}
