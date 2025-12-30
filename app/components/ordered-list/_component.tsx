import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type ArticleOrderedListProps = {
  children: ReactNode
}

export function OrderedList({ children }: ArticleOrderedListProps) {
  return <ol className={styles.list}>{children}</ol>
}
