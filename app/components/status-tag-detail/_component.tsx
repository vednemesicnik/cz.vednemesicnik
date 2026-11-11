import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * One fact under a `StatusTag`, never an instruction (22b), e.g. „od 25. 9.
 * 2026“.
 */
export const StatusTagDetail = ({ children }: Props) => (
  <span className={styles.detail} data-status-tag-detail={''}>
    {children}
  </span>
)
