import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A line under a section's rows that explains the last of them (design 21b):
 * why published content leaves *Odeslané*.
 */
export const DashboardSectionNote = ({ children }: Props) => (
  <p className={styles.note}>{children}</p>
)
