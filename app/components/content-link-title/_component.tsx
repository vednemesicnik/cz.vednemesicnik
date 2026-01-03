import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export function ContentLinkTitle({ children }: Props) {
  return <h2 className={styles.title}>{children}</h2>
}
