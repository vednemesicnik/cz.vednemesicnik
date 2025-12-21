import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

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
  const [isHighResImageLoaded, setIsHighResImageLoaded] = useState(true)
  const [highResImage, setHighResImage] = useState<HTMLImageElement | null>(
    null,
  )

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

  // Check if image needs loading (not from cache)
  useEffect(() => {
    if (highResImage && !highResImage.complete) {
      setIsHighResImageLoaded(false)
    }
  }, [highResImage])

  const handleHighResImageLoad = () => {
    setIsHighResImageLoaded(true)
  }

  return (
    <section className={clsx(styles.container, className)}>
      {/* Low-res placeholder */}
      <picture className={styles.lowResPicture}>
        <source srcSet={avifPlaceholderSrc_1x} type={'image/avif'} />
        <source srcSet={webpPlaceholderSrc_1x} type={'image/webp'} />
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

      {/* High-res image */}
      {isHydrated && (
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
            ref={setHighResImage}
            src={jpegSrc_1x}
            srcSet={`${jpegSrc_1x}, ${jpegSrc_2x} 2x`}
            width={width}
          />
        </picture>
      )}
    </section>
  )
}
