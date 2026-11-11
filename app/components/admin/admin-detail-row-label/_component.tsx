import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The name in the name column of an `AdminDetailRow` or a `ListDetailRow`; it
 * stands above the value while the section is narrower than 440 px.
 */
export const AdminDetailRowLabel = ({ children }: Props) => (
  <div className={styles.label}>{children}</div>
)
