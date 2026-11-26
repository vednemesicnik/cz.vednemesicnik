import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The filter buttons of a filter bar, with Zrušit filtry at their end. On a
 * wide screen they wrap with the search; on a phone they are a row that
 * scrolls sideways (22g).
 *
 * @returns The filters
 */
export const FilterBarFilters = ({ children, className }: Props) => (
  <div className={clsx(styles.filterBarFilters, className)}>{children}</div>
)
