import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'
import { LinkArrow } from '~/components/link-arrow'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Author = {
  name: string
}

type Props = {
  children: ReactNode
  title: string
  to: string
  authors: Author[]
  image?: ImageSources
  imageAlt?: string
  isPreview?: boolean
}

/**
 * The home page's main article (design 10a).
 *
 * @param props.children - The date line after the authors, a
 *   `ContentLinkPublishDate`.
 * @param props.isPreview - Outlined, for an article the reader doesn't see (10d).
 */
export const ArticleHero = ({
  children,
  title,
  to,
  authors,
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
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.meta}>
            <ul className={styles.authors}>
              {authors.map((author) => (
                <li className={styles.author} key={author.name}>
                  <p className={styles.authorName}>{author.name}</p>
                </li>
              ))}
            </ul>
            {children}
          </div>
          <span className={styles.cta}>
            Přečíst článek
            <LinkArrow />
          </span>
        </div>
      </article>
    </BaseLink>
  )
}
