import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The article's title in an `ArticleHero` (10a).
 */
export const ArticleHeroTitle = ({ children, className }: Props) => (
  <h2 className={clsx(styles.title, className)} data-article-hero-title={''}>
    {children}
  </h2>
)
