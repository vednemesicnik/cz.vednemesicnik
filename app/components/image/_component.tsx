import { animated, useSpring } from '@react-spring/web'
import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { createImageSources } from '~/utils/create-image-sources'
import { useHydrated } from '~/utils/use-hydrated'

import styles from './_styles.module.css'

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
    height: calculatedPlaceholderHeight,
    quality: DEFAULT_PLACEHOLDER_QUALITY,
    width: calculatedPlaceholderWidth,
  })

  const {
    avifSrc_1x,
    avifSrc_2x,
    webpSrc_1x,
    webpSrc_2x,
    jpegSrc_1x,
    jpegSrc_2x,
  } = createImageSources(src, {
    height,
    quality: DEFAULT_QUALITY,
    width,
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
    from: { opacity: isLowResImageLoaded ? 1 : 0 },
    opacity: isHighResImageLoaded ? 0 : 1,
  })

  const highResImageSpringStyles = useSpring({
    from: { opacity: isHighResImageLoaded ? 1 : 0 },
    opacity: isHighResImageLoaded ? 1 : 0,
  })

  return (
    <section className={clsx(styles.container, className)}>
      <animated.picture
        className={styles.lowResPicture}
        style={lowResImageSpringStyles}
      >
        <source srcSet={avifPlaceholderSrc_1x} type="image/avif" />
        <source srcSet={webpPlaceholderSrc_1x} type="image/webp" />
        <img
          alt={alt}
          className={styles.image}
          decoding={'async'}
          height={height}
          loading={'lazy'}
          onLoad={handleLowResImageLoad}
          ref={lowResImageRef}
          src={jpegPlaceholderSrc_1x}
          width={width}
        />
      </animated.picture>

      {isHydrated && (
        <animated.picture
          className={styles.highResPicture}
          style={highResImageSpringStyles}
        >
          <source
            srcSet={`${avifSrc_1x}, ${avifSrc_2x} 2x`}
            type="image/avif"
          />
          <source
            srcSet={`${webpSrc_1x}, ${webpSrc_2x} 2x`}
            type="image/webp"
          />
          <img
            alt={alt}
            className={styles.image}
            decoding={'async'}
            height={height}
            loading={'lazy'}
            onLoad={handleHighResImageLoad}
            ref={highResImageRef}
            src={jpegSrc_1x}
            srcSet={`${jpegSrc_1x}, ${jpegSrc_2x} 2x`}
            width={width}
          />
        </animated.picture>
      )}
    </section>
  )
}
