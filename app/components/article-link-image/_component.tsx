import { sizeConfig } from "~/config/size-config"

import styles from "./_styles.module.css"

type Props = {
  alt: string
  src: string
}

export function ArticleLinkImage({ alt, src }: Props) {
  const { width, height } = sizeConfig.articleLinkImage

  return (
    <picture className={styles.picture}>
      <img
        alt={alt}
        src={src}
        loading={"lazy"}
        width={width}
        height={height}
        className={styles.image}
      />
    </picture>
  )
}
