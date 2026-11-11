import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The bulk actions of an `AdminSelectionBar` valid for every selected row,
 * outline `sm` buttons (22c).
 */
export const AdminSelectionBarActions = ({ children, className }: Props) => (
  <span className={clsx(styles.actions, className)}>{children}</span>
)
