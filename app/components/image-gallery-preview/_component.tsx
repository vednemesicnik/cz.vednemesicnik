import { clsx } from 'clsx'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  image: ImageSources
  onClick: () => void
}

/**
 * A gallery tile: the image cropped to 3 : 2, lifting like a card on hover.
 *
 * @returns A button named by the image's alt text; `onClick` opens the gallery
 *   dialog at this image.
 */
export const ImageGalleryPreview = ({
  alt,
  className,
  image,
  onClick,
}: Props) => {
  return (
    <button
      aria-label={alt}
      className={clsx(styles.button, className)}
      onClick={onClick}
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
