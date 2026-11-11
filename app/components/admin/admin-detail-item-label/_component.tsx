import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The name of an `AdminDetailItem`, in the name column while the section is
 * at least 440 px wide, above the value otherwise (bbih22nt).
 */
export const AdminDetailItemLabel = ({ children, className }: Props) => (
  <dt className={clsx(styles.label, className)}>{children}</dt>
)
