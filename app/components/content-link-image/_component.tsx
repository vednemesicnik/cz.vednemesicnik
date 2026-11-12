import { clsx } from 'clsx'
import { Image } from '~/components/image'
import { PageFlight } from '~/components/page-flight'
import { sizeConfig } from '~/config/size-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  className?: string
  flightName?: string
}

const { width } = sizeConfig.articleLinkImage

/**
 * The row's thumbnail in a 16:9 frame: 192 × 108 beside the text, the full row width
 * when the row stacks below 640 px, under the signature-gradient veil.
 *
 * @param props.flightName - The view transition name of the main image on the page
 *   the row opens, such as `article-image-<id>`: the frame, veil included, flies
 *   there (design 18a).
 * @returns The framed image, or nothing when there is none: the row then has no image
 *   area, the same as the page it opens (design 0q3rezo1).
 */
export function ContentLinkImage({ alt, image, className, flightName }: Props) {
  if (image?.src === undefined) {
    return null
  }

  const kind = flightName === undefined ? undefined : 'article-row'

  // `data-content-link-image` tells the row it has an image area.
  return (
    <PageFlight kind={kind} name={flightName}>
      <div
        className={clsx(styles.frame, className)}
        data-content-link-image
        data-page-flight={flightName}
        data-page-flight-kind={kind}
      >
        <Image
          {...image}
          alt={alt}
          className={styles.image}
          sizes={`(width < 640px) 100vw, ${width}px`}
        />
      </div>
    </PageFlight>
  )
}
