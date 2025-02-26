import { combineClasses } from "@liborgabrhel/style-utils"
import { animated, useSpring } from "@react-spring/web"
import { useEffect, useRef, useState } from "react"

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
  className?: string
}

export const Image = ({ src, alt, width, height, className }: Props) => {
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
  } = createImageSources(src, {
    width: calculatedPlaceholderWidth,
    height: calculatedPlaceholderHeight,
    quality: DEFAULT_PLACEHOLDER_QUALITY,
  })

  const {
    avifSrc_1x,
    avifSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
    jpegSrc_1x,
    jpegSrc_2x,
  } = createImageSources(src, {
    width,
    height,
    quality: DEFAULT_QUALITY,
  })

  const handleLowResImageLoad = () => {
    setIsLowResImageLoaded(true)
  }

  const handleHighResImageLoad = () => {
    setIsHighResImageLoaded(true)
  }

  useEffect(() => {
    if (lowResImageRef.current) {
      const lowResImage = lowResImageRef.current

      if (lowResImage.complete) {
        setIsLowResImageLoaded(true)
      }
    }
  }, [])

  useEffect(() => {
    if (highResImageRef.current) {
      const highResImage = highResImageRef.current

      if (highResImage.complete) {
        setIsHighResImageLoaded(true)
      }
    }
  }, [])

  const lowResImageSpringStyles = useSpring({
    opacity: isHighResImageLoaded ? 0 : 1,
    from: { opacity: isLowResImageLoaded ? 1 : 0 },
  })

  const highResImageSpringStyles = useSpring({
    opacity: isHighResImageLoaded ? 1 : 0,
    from: { opacity: isHighResImageLoaded ? 1 : 0 },
  })

  return (
    <section className={combineClasses(styles.container, className)}>
      <animated.picture
        className={styles.lowResPicture}
        style={lowResImageSpringStyles}
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
          decoding={"async"}
          fetchPriority={"high"}
          onLoad={handleLowResImageLoad}
        />
      </animated.picture>

      {isHydrated && (
        <animated.picture
          className={styles.highResPicture}
          style={highResImageSpringStyles}
        >
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
            decoding={"async"}
            fetchPriority={"auto"}
            onLoad={handleHighResImageLoad}
          />
        </animated.picture>
      )}
    </section>
  )
}
