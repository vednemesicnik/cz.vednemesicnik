import { BaseLink } from '~/components/base-link'
import { Image } from '~/components/image'
import type { FormattedDate } from '~/utils/format-date'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Author = {
  name: string
}

type Props = {
  title: string
  to: string
  authors: Author[]
  publishDate: FormattedDate
  image?: ImageSources
  imageAlt?: string
}

export const ArticleHero = ({
  title,
  to,
  authors,
  publishDate,
  image,
  imageAlt,
}: Props) => {
  return (
    <BaseLink className={styles.link} to={to}>
      <article className={styles.container}>
        {image?.src ? (
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
        ) : (
          <div aria-hidden className={styles.imageFallback} />
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
            <p className={styles.date}>
              {publishDate.iso ? (
                <time dateTime={publishDate.iso}>{publishDate.formatted}</time>
              ) : (
                publishDate.formatted
              )}
            </p>
          </div>
          <span className={styles.cta}>Přečíst článek →</span>
        </div>
      </article>
    </BaseLink>
  )
}
