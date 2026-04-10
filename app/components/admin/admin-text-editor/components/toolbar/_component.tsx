import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const Toolbar = ({ children }: Props) => (
  <div className={styles.toolbar}>{children}</div>
)
