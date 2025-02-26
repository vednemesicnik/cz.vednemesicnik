import { Image } from "~/components/image"
import { sizeConfig } from "~/config/size-config"

import styles from "./_styles.module.css"

type Props = {
  alt: string
  src: string
}

export function ArticleLinkImage({ alt, src }: Props) {
  const { width, height } = sizeConfig.articleLinkImage

  return (
    <Image
      alt={alt}
      src={src}
      width={width}
      height={height}
      className={styles.picture}
    />
  )
}
