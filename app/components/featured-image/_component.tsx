import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  description?: ReactNode
  image: ImageSources
  className?: string
  imageClassName?: string
}

/**
 * The article's main image above its text, cropped to the page's fixed height
 * (design 12a), with its caption.
 *
 * @param props.imageClassName - Styles the image frame, e.g. a ratio instead of
 *   the fixed height where the column is narrower.
 */
export const FeaturedImage = ({
  alt,
  description,
  image,
  className,
  imageClassName,
}: Props) => {
  return (
    <figure className={clsx(styles.container, className)}>
      <Image
        {...image}
        alt={alt}
        className={clsx(styles.image, imageClassName)}
        fetchPriority={'high'}
        loading={'eager'}
        sizes={'(min-width: 60rem) 940px, 100vw'}
      />
      {description && (
        <figcaption className={styles.caption}>{description}</figcaption>
      )}
    </figure>
  )
}
