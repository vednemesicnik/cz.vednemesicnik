import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Image } from '~/components/image'
import styles from './_styles.module.css'

type Props = {
  alt: string
  description?: ReactNode
  src: string
  className?: string
}

export const FeaturedImage = ({ alt, description, src, className }: Props) => {
  return (
    <figure className={clsx(styles.container, className)}>
      <Image
        alt={alt}
        className={styles.image}
        height={529}
        src={src}
        width={940}
      />
      {description && (
        <figcaption className={styles.caption}>{description}</figcaption>
      )}
    </figure>
  )
}
