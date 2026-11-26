import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The head of an `AdminDetailSection` with actions (bbih22nt): the
 * `AdminDetailSectionTitle` on the left, the `AdminDetailSectionActions` on
 * its right. A title without actions stands on its own.
 */
export const AdminDetailSectionHead = ({ children, className }: Props) => (
  <div className={clsx(styles.head, className)}>{children}</div>
)
