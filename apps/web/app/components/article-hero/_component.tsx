import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'
import { LinkArrow } from '~/components/link-arrow'
import { PageFlight } from '~/components/page-flight'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  image?: ImageSources
  imageAlt?: string
  isPreview?: boolean
  flightName?: string
}

/**
 * The home page's main article (design 10a).
 *
 * @param props.children - The `ArticleHeroTitle`, then the `ArticleHeroMeta`
 *   with the `ArticleHeroAuthors` and the date, a `ContentLinkPublishDate`.
 * @param props.isPreview - Outlined, for an article the reader doesn't see (10d).
 * @param props.flightName - The view transition name of the article page's main
 *   image, such as `article-image-<id>`: the image slides there (design 18b).
 */
export const ArticleHero = ({
  children,
  to,
  image,
  imageAlt,
  isPreview,
  flightName,
}: Props) => {
  const kind = flightName === undefined ? undefined : 'article-hero'

  return (
    <BaseLink className={styles.link} to={to}>
      <article className={clsx(styles.container, isPreview && styles.preview)}>
        {/* No image, no image area: the same as the article page (design 0q3rezo1). */}
        {image?.src && (
          <figure
            className={styles.figure}
            data-page-flight={flightName}
            data-page-flight-kind={kind}
          >
            <PageFlight name={flightName}>
              <Image
                {...image}
                alt={imageAlt}
                className={styles.image}
                fetchPriority={'high'}
                loading={'eager'}
                sizes={'(min-width: 60rem) 940px, 100vw'}
              />
            </PageFlight>
          </figure>
        )}
        <div className={styles.heading}>
          {children}
          <span className={styles.cta}>
            Přečíst článek
            <LinkArrow />
          </span>
        </div>
      </article>
    </BaseLink>
  )
}
