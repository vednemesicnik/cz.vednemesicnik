import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const AdminModalContent = ({ children }: Props) => {
  return <div className={styles.content}>{children}</div>
}
