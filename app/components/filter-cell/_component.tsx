import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The filter bar and a selection bar in one cell (design 22c, cioukqn6): on a
 * wide screen the cell keeps the taller of the two, so checking a row never
 * moves the table; on a phone they stack.
 *
 * @returns The cell
 */
export const FilterCell = ({ children }: Props) => (
  <div className={styles.filterCell}>{children}</div>
)
