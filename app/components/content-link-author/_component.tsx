import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  image?: ImageSources
  imageAlt?: string
  className?: string
}

export const ContentLinkAuthor = ({
  children,
  image,
  imageAlt,
  className,
}: Props) => {
  const { width } = sizeConfig.articleLinkAuthorImage

  return (
    <div className={clsx(styles.container, className)}>
      {image?.src && (
        <Image
          {...image}
          alt={imageAlt}
          className={styles.image}
          sizes={`${width}px`}
        />
      )}
      <p className={styles.paragraph}>{children}</p>
    </div>
  )
}
