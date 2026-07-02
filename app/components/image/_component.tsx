import { clsx } from 'clsx'
import { useEffect, useState } from 'react'

import type { ImageSources } from '~/utils/image-store/create-image-sources'
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
  // Start "loaded" so a cache-hit image (already `complete` on mount, before any
  // onLoad can fire) shows immediately without a fade. The effect below flips it
  // back to false only for lazy images that still need to fetch — eager (LCP)
  // images are never hidden, avoiding a post-hydration flash of the SSR image.
  const [isHighResImageLoaded, setIsHighResImageLoaded] = useState(true)
  const [highResImage, setHighResImage] = useState<HTMLImageElement | null>(
    null,
  )

  useEffect(() => {
    if (loading === 'lazy' && highResImage && !highResImage.complete) {
      setIsHighResImageLoaded(false)
    }
  }, [highResImage, loading])

  if (src === undefined) {
    return <div className={clsx(styles.container, className)} />
  }

  const handleHighResImageLoad = () => {
    setIsHighResImageLoaded(true)
  }

  return (
    <div className={clsx(styles.container, className)}>
      {/* Inline LQIP placeholder (data URI → 0 network requests). Decorative:
          the real image below carries the alt text, so this one is hidden from
          assistive tech to avoid a duplicate announcement. */}
      <img
        alt={''}
        aria-hidden
        className={clsx(styles.image, styles.lowResImage)}
        decoding={'async'}
        height={height}
        src={placeholder}
        width={width}
      />

      {/* High-res responsive image — rendered on the server too so the browser's
          preload scanner can discover and fetch it for LCP (no hydration gate). */}
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
    </div>
  )
}
