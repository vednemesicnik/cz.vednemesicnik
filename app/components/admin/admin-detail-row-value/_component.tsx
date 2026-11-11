import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The value of an `AdminDetailRow` or a `ListDetailRow`: a status, a note, a
 * list.
 */
export const AdminDetailRowValue = ({ children }: Props) => (
  <div className={styles.value}>{children}</div>
)
