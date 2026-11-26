import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { Image } from '~/components/image'
import { PageFlight } from '~/components/page-flight'
import { usePageFlight } from '~/hooks/use-page-flight'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  image: ImageSources
  children?: ReactNode
  className?: string
  imageClassName?: string
  flightName?: string
}

/**
 * The article's main image above its text, cropped to the page's fixed height
 * (design 12a), with its caption.
 *
 * @param props.children - The caption, a `FeaturedImageCaption`.
 * @param props.imageClassName - Styles the image frame, e.g. a ratio instead of
 *   the fixed height where the column is narrower.
 * @param props.flightName - Its view transition name, such as
 *   `article-image-<id>`: a list's image with the same name flies here, and the
 *   image shows that file until its own loads (design 18a, 18b).
 */
export const FeaturedImage = ({
  alt,
  image,
  children,
  className,
  imageClassName,
  flightName,
}: Props) => {
  const flight = usePageFlight(flightName ?? '')

  return (
    <figure className={clsx(styles.container, className)}>
      <PageFlight name={flightName}>
        <Image
          {...image}
          alt={alt}
          className={clsx(styles.image, imageClassName)}
          fallbackSource={flight?.source}
          fetchPriority={'high'}
          loading={'eager'}
          sizes={'(min-width: 60rem) 940px, 100vw'}
        />
      </PageFlight>
      {children}
    </figure>
  )
}
