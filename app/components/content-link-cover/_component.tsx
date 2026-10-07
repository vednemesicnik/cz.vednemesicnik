import { clsx } from 'clsx'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  className?: string
}

/**
 * The square cover of a `MediaContentLink`: 108 × 108 left of the text, 80 × 80
 * below 640 px, whole and without the veil. A non-square cover is cropped to the
 * centre square (design aec7mifb).
 *
 * @returns The cover, or nothing when there is none: the card then has no cover area
 *   (design 0q3rezo1).
 */
export function ContentLinkCover({ alt, image, className }: Props) {
  if (image?.src === undefined) {
    return null
  }

  // `data-content-link-cover` tells the card it has a cover area.
  return (
    <div className={clsx(styles.frame, className)} data-content-link-cover>
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        sizes={'(width < 640px) 80px, 108px'}
      />
    </div>
  )
}
