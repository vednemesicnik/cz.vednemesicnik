import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'

import styles from './_styles.module.css'

type Props = {
  alt: string
  src: string
}

export function ArticleLinkImage({ alt, src }: Props) {
  const { width, height } = sizeConfig.articleLinkImage

  return (
    <Image
      alt={alt}
      className={styles.picture}
      height={height}
      src={src}
      width={width}
    />
  )
}
