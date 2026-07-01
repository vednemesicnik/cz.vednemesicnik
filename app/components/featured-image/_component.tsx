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
}

export const FeaturedImage = ({
  alt,
  description,
  image,
  className,
}: Props) => {
  return (
    <figure className={clsx(styles.container, className)}>
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        sizes={'(min-width: 60rem) 940px, 100vw'}
      />
      {description && (
        <figcaption className={styles.caption}>{description}</figcaption>
      )}
    </figure>
  )
}
