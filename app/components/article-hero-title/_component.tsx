import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The article's title in an `ArticleHero` (10a).
 */
export const ArticleHeroTitle = ({ children }: Props) => (
  <h2 className={styles.title} data-article-hero-title={''}>
    {children}
  </h2>
)
