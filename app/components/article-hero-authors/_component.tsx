import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The article's authors in an `ArticleHero`, an `ArticleHeroAuthor` each,
 * separated by commas (10a).
 */
export const ArticleHeroAuthors = ({ children, className }: Props) => (
  <ul className={clsx(styles.authors, className)}>{children}</ul>
)
