import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The search and the filters of a filter bar, wrapping as one group; on a
 * phone the search above the row of filters (22g).
 *
 * @returns The group
 */
export const FilterBarGroup = ({ children }: Props) => (
  <div className={styles.filterBarGroup}>{children}</div>
)
