import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const AdminTableToolbar = ({ children }: Props) => {
  return <div className={styles.toolbar}>{children}</div>
}
