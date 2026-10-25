import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  phoneOnly?: boolean
}

/**
 * The row's „⋯“, an `ActionMenu`. Below 768 px its 30 px trigger gets a
 * finger's 44 px target (22g).
 *
 * @param props.phoneOnly - The menu a phone shows in place of
 *   `TableRowActions`, with the row's primary action first (design 32).
 */
export const TableRowMenu = ({ children, phoneOnly = false }: Props) => (
  <span className={clsx(styles.menu, phoneOnly && styles.phoneOnly)}>
    {children}
  </span>
)
