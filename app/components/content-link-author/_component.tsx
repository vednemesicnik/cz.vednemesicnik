import type { ReactNode } from 'react'

import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  imageSrc: string
  imageAlt: string
}

export const ContentLinkAuthor = ({ children, imageSrc, imageAlt }: Props) => {
  const { width, height } = sizeConfig.articleLinkAuthorImage

  return (
    <section className={styles.container}>
      <Image
        alt={imageAlt}
        className={styles.image}
        height={height}
        src={imageSrc}
        width={width}
      />
      <p className={styles.paragraph}>{children}</p>
    </section>
  )
}
