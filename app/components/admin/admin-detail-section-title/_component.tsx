import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The heading of an `AdminDetailSection`, e.g. „Údaje“.
 */
export const AdminDetailSectionTitle = ({ children, className }: Props) => (
  <h2 className={clsx(styles.title, className)}>{children}</h2>
)
