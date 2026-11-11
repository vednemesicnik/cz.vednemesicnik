import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The bulk actions of an `AdminSelectionBar` valid for every selected row,
 * outline `sm` buttons (22c).
 */
export const AdminSelectionBarActions = ({ children }: Props) => (
  <span className={styles.actions}>{children}</span>
)
