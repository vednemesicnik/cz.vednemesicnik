import { clsx } from 'clsx'
import type { Ref } from 'react'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  image: ImageSources
  onClick: () => void
  ref?: Ref<HTMLButtonElement>
}

/**
 * A gallery tile: the image cropped to 3 : 2, lifting like a card on hover.
 *
 * @returns A button named by the image's alt text; `onClick` opens the gallery
 *   viewer at this image, and `ref` lets the viewer give the focus back.
 */
export const ImageGalleryPreview = ({
  alt,
  className,
  image,
  onClick,
  ref,
}: Props) => {
  return (
    <button
      aria-label={alt}
      className={clsx(styles.button, className)}
      onClick={onClick}
      ref={ref}
      type="button"
    >
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        sizes={'(width < 640px) 33vw, 220px'}
      />
    </button>
  )
}
