import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * One type's line in *K publikaci* (design 21a): how many wait for their
 * order and since when, then the way to them. Its parts are the sentence and
 * the links; the line lays them out.
 */
export const DashboardApprovedLine = ({ children }: Props) => (
  <div className={styles.line}>{children}</div>
)
