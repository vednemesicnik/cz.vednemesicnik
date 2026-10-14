import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The filter bar and a selection bar in one cell (design 22c, cioukqn6): on a
 * wide screen the cell keeps the taller of the two, so checking a row never
 * moves the table; on a phone they stack.
 *
 * @returns The cell
 */
export const FilterCell = ({ children, className }: Props) => (
  <div className={clsx(styles.filterCell, className)}>{children}</div>
)
