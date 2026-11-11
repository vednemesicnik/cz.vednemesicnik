import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The head of an `AdminDetailSection` with actions (bbih22nt): the
 * `AdminDetailSectionTitle` on the left, the `AdminDetailSectionActions` on
 * its right. A title without actions stands on its own.
 */
export const AdminDetailSectionHead = ({ children }: Props) => (
  <div className={styles.head}>{children}</div>
)
