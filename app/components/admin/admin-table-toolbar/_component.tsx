import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const AdminTableToolbar = ({ children }: Props) => {
  return <search className={styles.toolbar}>{children}</search>
}
