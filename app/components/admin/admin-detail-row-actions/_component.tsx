import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Buttons on the right of an `AdminDetailRow`, after its value. Without them
 * the row has no actions column.
 */
export const AdminDetailRowActions = ({ children, className }: Props) => (
  <div
    className={clsx(styles.actions, className)}
    data-admin-detail-row-actions={''}
  >
    {children}
  </div>
)
