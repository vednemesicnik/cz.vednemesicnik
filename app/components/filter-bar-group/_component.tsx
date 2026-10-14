import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The search and the filters of a filter bar, wrapping as one group; on a
 * phone the search above the row of filters (22g).
 *
 * @returns The group
 */
export const FilterBarGroup = ({ children, className }: Props) => (
  <div className={clsx(styles.filterBarGroup, className)}>{children}</div>
)
