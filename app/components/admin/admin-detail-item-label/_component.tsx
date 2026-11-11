import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The name of an `AdminDetailItem`, in the name column while the section is
 * at least 440 px wide, above the value otherwise (bbih22nt).
 */
export const AdminDetailItemLabel = ({ children }: Props) => (
  <dt className={styles.label}>{children}</dt>
)
