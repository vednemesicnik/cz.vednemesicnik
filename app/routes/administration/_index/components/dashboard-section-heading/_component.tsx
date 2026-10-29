import { type ReactNode, use } from 'react'

import { DashboardSectionContext } from '../dashboard-section/dashboard-section-context'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** How many wait, beside the heading (21a); the list's pill, summed. */
  count?: number
}

/**
 * A dashboard section's heading (design 21a): the section's name, and how
 * many wait in it where that matters.
 */
export const DashboardSectionHeading = ({ children, count }: Props) => (
  <h2 className={styles.heading} id={use(DashboardSectionContext)}>
    {children}
    {count !== undefined && <span className={styles.count}>{count}</span>}
  </h2>
)
