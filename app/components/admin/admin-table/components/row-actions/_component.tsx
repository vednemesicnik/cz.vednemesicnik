import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The row's primary action and „⋯“ side by side (22a). A phone has room for
 * one „⋯“ only, so it leaves them for a `TableRowMenu phoneOnly` (22g).
 */
export const TableRowActions = ({ children }: Props) => (
  <span className={styles.actions}>{children}</span>
)
