import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { useHydrated } from '~/utils/use-hydrated'
import styles from './_styles.module.css'

// HTML-native props: the responsive source strings (`src`, `srcSet`, `avifSrcSet`,
// `width`, `height`, `placeholder`) come straight from `createImageSources` and are
// usually spread in — `<Image {...sources} alt sizes />`.
type Props = Partial<ImageSources> & {
  alt?: string
  // Layout hint for picking a width from `srcSet`. Defaults to full viewport
  // width; pass a tighter value (e.g. "300px", "(min-width: 48rem) 50vw, 100vw")
  // where the image renders smaller.
  sizes?: string
  className?: string
  loading?: 'lazy' | 'eager'
  fetchPriority?: 'auto' | 'high' | 'low'
}

export const Image = ({
  src,
  srcSet,
  avifSrcSet,
  width,
  height,
  placeholder,
  alt = '',
  sizes = '100vw',
  className,
  loading = 'lazy',
  fetchPriority = 'low',
}: Props) => {
  const isHydrated = useHydrated()
  const [isHighResImageLoaded, setIsHighResImageLoaded] = useState(true)
  const [highResImage, setHighResImage] = useState<HTMLImageElement | null>(
    null,
  )

  // Check if image needs loading (not from cache)
  useEffect(() => {
    if (highResImage && !highResImage.complete) {
      setIsHighResImageLoaded(false)
    }
  }, [highResImage])

  if (src === undefined) {
    return <div className={clsx(styles.container, className)} />
  }

  const handleHighResImageLoad = () => {
    setIsHighResImageLoaded(true)
  }

  return (
    <div className={clsx(styles.container, className)}>
      {/* Inline LQIP placeholder (data URI → 0 network requests) */}
      <img
        alt={alt}
        className={clsx(styles.image, styles.lowResImage)}
        decoding={'async'}
        height={height}
        src={placeholder}
        width={width}
      />

      {/* High-res responsive image */}
      {isHydrated && (
        <picture
          className={clsx(
            styles.highResPicture,
            isHighResImageLoaded && styles.highResPictureLoaded,
          )}
        >
          <source sizes={sizes} srcSet={avifSrcSet} type={'image/avif'} />
          <source sizes={sizes} srcSet={srcSet} type={'image/jpeg'} />
          <img
            alt={alt}
            className={styles.image}
            decoding={'async'}
            fetchPriority={fetchPriority}
            height={height}
            loading={loading}
            onLoad={handleHighResImageLoad}
            ref={setHighResImage}
            sizes={sizes}
            src={src}
            srcSet={srcSet}
            width={width}
          />
        </picture>
      )}
    </div>
  )
}
