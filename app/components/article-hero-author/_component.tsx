import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * One author in `ArticleHeroAuthors`.
 *
 * @param props.children - The author's name.
 */
export const ArticleHeroAuthor = ({ children }: Props) => (
  <li className={styles.author}>
    <p className={styles.name}>{children}</p>
  </li>
)
