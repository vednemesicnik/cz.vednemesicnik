import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const AdminModalActions = ({ children }: Props) => {
  return <div className={styles.actions}>{children}</div>
}
