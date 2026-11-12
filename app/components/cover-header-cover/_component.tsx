import { clsx } from 'clsx'
import { Image } from '~/components/image'
import { PageFlight } from '~/components/page-flight'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { usePageFlight } from '~/utils/page-flight/use-page-flight'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  image: ImageSources
  flightName?: string
}

/**
 * The square cover of a `CoverHeader` (design 13b, 13c), whole and without the
 * veil. Its width is fixed, so nothing moves while it loads; a non-square cover
 * is cropped to the centre square. It loads eagerly: it is the top of the page.
 *
 * @param props.flightName - The cover's view transition name, such as
 *   `podcast-cover-<id>`: a list's cover with the same name flies into the
 *   frame, which stays on the page, and the cover shows that file until its own
 *   loads (design 18c).
 * @returns The cover frame
 */
export const CoverHeaderCover = ({
  alt,
  className,
  image,
  flightName,
}: Props) => {
  const flight = usePageFlight(flightName ?? '')

  // `data-cover-header-cover` places it in the header's grid.
  return (
    <div className={clsx(styles.frame, className)} data-cover-header-cover>
      <PageFlight kind={flight?.kind} name={flightName}>
        <Image
          {...image}
          alt={alt}
          className={styles.image}
          fallbackSource={flight?.source}
          fetchPriority={'high'}
          loading={'eager'}
          sizes={'(width < 640px) 160px, 200px'}
        />
      </PageFlight>
    </div>
  )
}
