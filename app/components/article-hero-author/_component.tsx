import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One author in `ArticleHeroAuthors`.
 *
 * @param props.children - The author's name.
 */
export const ArticleHeroAuthor = ({ children, className }: Props) => (
  <li className={clsx(styles.author, className)}>
    <p className={styles.name}>{children}</p>
  </li>
)
