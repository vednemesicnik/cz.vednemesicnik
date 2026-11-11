import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Stands in an `AdminSelectionBar` in place of the actions when none applies
 * to the whole selection, e.g. „Pro tento výběr není společná akce.“ (22c).
 */
export const AdminSelectionBarMessage = ({ children, className }: Props) => (
  <span className={clsx(styles.message, className)}>{children}</span>
)
