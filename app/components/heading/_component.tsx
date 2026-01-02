import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  level: 2 | 3
  className?: string
}

export function Heading({ children, level, className }: Props) {
  const ElementTag = `h${level}` as const

  return (
    <ElementTag
      className={clsx(
        styles.heading,
        level === 2 && styles.heading2,
        level === 3 && styles.heading3,
        className,
      )}
    >
      {children}
    </ElementTag>
  )
}
