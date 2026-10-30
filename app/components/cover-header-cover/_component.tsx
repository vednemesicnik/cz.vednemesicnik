import { clsx } from 'clsx'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  image: ImageSources
}

/**
 * The square cover of a `CoverHeader` (design 13b, 13c), whole and without the
 * veil. Its width is fixed, so nothing moves while it loads; a non-square cover
 * is cropped to the centre square. It loads eagerly: it is the top of the page.
 *
 * @returns The cover frame
 */
export const CoverHeaderCover = ({ alt, className, image }: Props) => {
  // `data-cover-header-cover` places it in the header's grid.
  return (
    <div className={clsx(styles.frame, className)} data-cover-header-cover>
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        fetchPriority={'high'}
        loading={'eager'}
        sizes={'(width < 640px) 160px, 200px'}
      />
    </div>
  )
}
