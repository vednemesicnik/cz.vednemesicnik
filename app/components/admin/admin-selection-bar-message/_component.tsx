import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * Stands in an `AdminSelectionBar` in place of the actions when none applies
 * to the whole selection, e.g. „Pro tento výběr není společná akce.“ (22c).
 */
export const AdminSelectionBarMessage = ({ children }: Props) => (
  <span className={styles.message}>{children}</span>
)
