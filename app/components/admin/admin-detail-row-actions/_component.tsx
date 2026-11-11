import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * Buttons on the right of an `AdminDetailRow`, after its value. Without them
 * the row has no actions column.
 */
export const AdminDetailRowActions = ({ children }: Props) => (
  <div className={styles.actions} data-admin-detail-row-actions={''}>
    {children}
  </div>
)
