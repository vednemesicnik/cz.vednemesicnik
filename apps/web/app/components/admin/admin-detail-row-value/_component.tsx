import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The value of an `AdminDetailRow` or a `ListDetailRow`: a status, a note, a
 * list.
 */
export const AdminDetailRowValue = ({ children, className }: Props) => (
  <div className={clsx(styles.value, className)}>{children}</div>
)
