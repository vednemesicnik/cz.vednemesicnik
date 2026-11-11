import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The article's authors in an `ArticleHero`, an `ArticleHeroAuthor` each,
 * separated by commas (10a).
 */
export const ArticleHeroAuthors = ({ children }: Props) => (
  <ul className={styles.authors}>{children}</ul>
)
