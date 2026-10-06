import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  level?: 2 | 3
}

export function ContentLinkTitle({ children, level = 2 }: Props) {
  const ElementTag = `h${level}` as const

  return <ElementTag className={styles.title}>{children}</ElementTag>
}
