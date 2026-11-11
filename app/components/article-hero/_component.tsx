import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'
import { LinkArrow } from '~/components/link-arrow'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  image?: ImageSources
  imageAlt?: string
  isPreview?: boolean
}

/**
 * The home page's main article (design 10a).
 *
 * @param props.children - The `ArticleHeroTitle`, then the `ArticleHeroMeta`
 *   with the `ArticleHeroAuthors` and the date, a `ContentLinkPublishDate`.
 * @param props.isPreview - Outlined, for an article the reader doesn't see (10d).
 */
export const ArticleHero = ({
  children,
  to,
  image,
  imageAlt,
  isPreview,
}: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={clsx(styles.container, isPreview && styles.preview)}>
        {/* No image, no image area: the same as the article page (design 0q3rezo1). */}
        {image?.src && (
          <figure className={styles.figure}>
            <Image
              {...image}
              alt={imageAlt}
              className={styles.image}
              fetchPriority={'high'}
              loading={'eager'}
              sizes={'(min-width: 60rem) 940px, 100vw'}
            />
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
