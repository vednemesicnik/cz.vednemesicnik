import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A name and its value in an `AdminDetailList` (design bbih22nt).
 *
 * @param props.children - An `AdminDetailItemLabel` and an
 *   `AdminDetailItemValue`.
 */
export const AdminDetailItem = ({ children, className }: Props) => {
  return <div className={clsx(styles.item, className)}>{children}</div>
}
