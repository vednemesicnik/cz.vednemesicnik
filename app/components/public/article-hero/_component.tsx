import { Image } from '~/components/image'
import { Link } from '~/components/link'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Author = {
  name: string
}

type Props = {
  title: string
  to: string
  authors: Author[]
  publishDate: Date | null
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
    <header className={styles.container}>
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
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.meta}>
          <ul className={styles.authors}>
            {authors.map((author) => (
              <li className={styles.author} key={author.name}>
                <p className={styles.authorName}>{author.name}</p>
              </li>
            ))}
          </ul>
          <p className={styles.date}>{getFormattedPublishDate(publishDate)}</p>
        </div>
        <Link className={styles.cta} to={to}>
          Přečíst článek →
        </Link>
      </div>
    </header>
  )
}
