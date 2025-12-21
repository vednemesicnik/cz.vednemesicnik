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

  const [isHighResImageLoaded, setIsHighResImageLoaded] = useState(false)
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState(false)

  const containerRef = useRef<HTMLElement>(null)
  const highResImageRef = useRef<HTMLImageElement>(null)
  const idleCallbackIdRef = useRef<number | null>(null)

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

  const handleHighResImageLoad = () => {
    setIsHighResImageLoaded(true)
  }

  // Intersection Observer for loading high-res images when visible
  useEffect(() => {
    if (!containerRef.current || !isHydrated) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Use requestIdleCallback to defer high-res loading when browser is idle
            const callback = () => {
              setShouldLoadHighRes(true)
            }

            if ('requestIdleCallback' in window) {
              idleCallbackIdRef.current = window.requestIdleCallback(callback, {
                timeout: 2000,
              })
            } else {
              // Fallback for browsers without requestIdleCallback
              setTimeout(callback, 100)
            }
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      if (idleCallbackIdRef.current && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackIdRef.current)
      }
    }
  }, [isHydrated])

  // Check if high-res image is already loaded (from cache)
  useEffect(() => {
    if (highResImageRef.current?.complete) {
      setIsHighResImageLoaded(true)
    }
  }, [])

  return (
    <section className={clsx(styles.container, className)} ref={containerRef}>
      <picture
        className={clsx(
          styles.lowResPicture,
          isHighResImageLoaded && styles.lowResPictureHidden,
        )}
      >
        <source srcSet={avifPlaceholderSrc_1x} type="image/avif" />
        <source srcSet={webpPlaceholderSrc_1x} type="image/webp" />
        <img
          alt={alt}
          className={styles.image}
          decoding={'async'}
          fetchPriority={'low'}
          height={height}
          loading={'lazy'}
          src={jpegPlaceholderSrc_1x}
          width={width}
        />
      </picture>

      {isHydrated && shouldLoadHighRes && (
        <picture
          className={clsx(
            styles.highResPicture,
            isHighResImageLoaded && styles.highResPictureLoaded,
          )}
        >
          <source
            srcSet={`${avifSrc_1x}, ${avifSrc_2x} 2x`}
            type={'image/avif'}
          />
          <source
            srcSet={`${webpSrc_1x}, ${webpSrc_2x} 2x`}
            type={'image/webp'}
          />
          <img
            alt={alt}
            className={styles.image}
            decoding={'async'}
            fetchPriority={'low'}
            height={height}
            loading={'lazy'}
            onLoad={handleHighResImageLoad}
            ref={highResImageRef}
            src={jpegSrc_1x}
            srcSet={`${jpegSrc_1x}, ${jpegSrc_2x} 2x`}
            width={width}
          />
        </picture>
      )}
    </section>
  )
}
