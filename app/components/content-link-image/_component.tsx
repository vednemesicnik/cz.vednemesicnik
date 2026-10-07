import { clsx } from 'clsx'
import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  className?: string
}

const { width } = sizeConfig.articleLinkImage

/**
 * The row's thumbnail in a 16:9 frame: 192 × 108 beside the text, the full row width
 * when the row stacks below 640 px, under the signature-gradient veil.
 *
 * @returns The framed image, or nothing when there is none: the row then has no image
 *   area, the same as the page it opens (design 0q3rezo1).
 */
export function ContentLinkImage({ alt, image, className }: Props) {
  if (image?.src === undefined) {
    return null
  }

  // `data-content-link-image` tells the row it has an image area.
  return (
    <div className={clsx(styles.frame, className)} data-content-link-image>
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        sizes={`(width < 640px) 100vw, ${width}px`}
      />
    </div>
  )
}
