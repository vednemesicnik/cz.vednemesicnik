import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const AdminTabs = ({ children }: Props) => {
  return <nav className={styles.tabs}>{children}</nav>
}
