import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The one sentence in place of an empty section's rows (design 21c): the
 * Coordinator would not tell an empty queue from one that failed to load.
 */
export const DashboardSectionEmpty = ({ children }: Props) => (
  <p className={styles.empty}>{children}</p>
)
