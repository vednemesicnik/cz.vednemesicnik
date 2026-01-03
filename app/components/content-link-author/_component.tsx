import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  imageSrc?: string
  imageAlt?: string
  className?: string
}

export const ContentLinkAuthor = ({
  children,
  imageSrc,
  imageAlt,
  className,
}: Props) => {
  const { width, height } = sizeConfig.articleLinkAuthorImage

  return (
    <div className={clsx(styles.container, className)}>
      {imageSrc && (
        <Image
          alt={imageAlt}
          className={styles.image}
          height={height}
          src={imageSrc}
          width={width}
        />
      )}
      <p className={styles.paragraph}>{children}</p>
    </div>
  )
}
