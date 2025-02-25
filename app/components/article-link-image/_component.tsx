import { Image } from "~/components/image"
import { sizeConfig } from "~/config/size-config"

import styles from "./_styles.module.css"

type Props = {
  alt: string
  src: string
  shouldLoadLowRes?: boolean
  shouldLoadHighRes?: boolean
  onLowResLoad?: () => void
  onHighResLoad?: () => void
}

export function ArticleLinkImage({
  alt,
  src,
  shouldLoadLowRes,
  shouldLoadHighRes,
  onLowResLoad,
  onHighResLoad,
}: Props) {
  const { width, height } = sizeConfig.articleLinkImage

  return (
    <Image
      alt={alt}
      src={src}
      fallback={"/images/article-link-image"}
      width={width}
      height={height}
      className={styles.picture}
      shouldLoadLowRes={shouldLoadLowRes}
      shouldLoadHighRes={shouldLoadHighRes}
      onLowResLoad={onLowResLoad}
      onHighResLoad={onHighResLoad}
    />
  )
}
