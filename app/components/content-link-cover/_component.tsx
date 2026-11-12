import { clsx } from 'clsx'
import { Image } from '~/components/image'
import { PageFlight } from '~/components/page-flight'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  className?: string
  flightName?: string
}

/**
 * The square cover of a `MediaContentLink`: 108 × 108 left of the text, 80 × 80
 * below 640 px, whole and without the veil. A non-square cover is cropped to the
 * centre square (design aec7mifb).
 *
 * @param props.flightName - The view transition name of the cover on the page the
 *   card opens, such as `episode-cover-<id>`: the cover flies there (design 18c).
 * @returns The cover, or nothing when there is none: the card then has no cover area
 *   (design 0q3rezo1).
 */
export function ContentLinkCover({ alt, image, className, flightName }: Props) {
  if (image?.src === undefined) {
    return null
  }

  const kind = flightName === undefined ? undefined : 'cover'

  // `data-content-link-cover` tells the card it has a cover area.
  return (
    <PageFlight name={flightName}>
      <div
        className={clsx(styles.frame, className)}
        data-content-link-cover
        data-page-flight={flightName}
        data-page-flight-kind={kind}
      >
        <Image
          {...image}
          alt={alt}
          className={styles.image}
          sizes={'(width < 640px) 80px, 108px'}
        />
      </div>
    </PageFlight>
  )
}
