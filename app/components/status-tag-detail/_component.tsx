import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * One fact under a `StatusTag`, never an instruction (22b), e.g. „od 25. 9.
 * 2026“.
 */
export const StatusTagDetail = ({ children, className }: Props) => (
  <span className={clsx(styles.detail, className)} data-status-tag-detail={''}>
    {children}
  </span>
)
