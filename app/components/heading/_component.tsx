import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type ArticleHeadingProps = {
  children: ReactNode
  level: 1 | 2 | 3
}

export function Heading({ children, level }: ArticleHeadingProps) {
  const Tag = `h${level}` as const

  return (
    <Tag
      className={clsx(
        styles.heading,
        level === 1 && styles.heading1,
        level === 2 && styles.heading2,
        level === 3 && styles.heading3,
      )}
    >
      {children}
    </Tag>
  )
}
