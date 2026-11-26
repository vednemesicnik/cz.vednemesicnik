import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The value of an `AdminDetailItem`: a name, a date, a list of links.
 */
export const AdminDetailItemValue = ({ children, className }: Props) => (
  <dd className={clsx(styles.value, className)}>{children}</dd>
)
