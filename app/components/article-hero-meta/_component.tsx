import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The line under the title of an `ArticleHero`: the `ArticleHeroAuthors`, then
 * the date (10a).
 */
export const ArticleHeroMeta = ({ children }: Props) => (
  <div className={styles.meta}>{children}</div>
)
