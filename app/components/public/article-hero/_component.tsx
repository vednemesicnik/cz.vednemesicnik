import { Image } from '~/components/image'
import { Link } from '~/components/link'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'

import styles from './_styles.module.css'

type Author = {
  name: string
}

type Props = {
  title: string
  to: string
  authors: Author[]
  publishDate: Date | null
  imageSrc?: string
  imageAlt?: string
}

export const ArticleHero = ({
  title,
  to,
  authors,
  publishDate,
  imageSrc,
  imageAlt,
}: Props) => {
  return (
    <header className={styles.container}>
      {imageSrc && (
        <figure className={styles.figure}>
          <Image
            alt={imageAlt}
            className={styles.image}
            height={529}
            src={imageSrc}
            width={940}
          />
        </figure>
      )}
      <div className={styles.heading}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.meta}>
          <ul className={styles.authors}>
            {authors.map((author) => (
              <li key={author.name} className={styles.author}>
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
