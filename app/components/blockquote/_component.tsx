import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type ArticleBlockquoteProps = {
  children: ReactNode
}

export function Blockquote({ children }: ArticleBlockquoteProps) {
  return <blockquote className={styles.blockquote}>{children}</blockquote>
}
