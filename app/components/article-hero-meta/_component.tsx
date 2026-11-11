import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The line under the title of an `ArticleHero`: the `ArticleHeroAuthors`, then
 * the date (10a).
 */
export const ArticleHeroMeta = ({ children, className }: Props) => (
  <div className={clsx(styles.meta, className)}>{children}</div>
)
