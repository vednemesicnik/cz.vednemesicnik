import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Buttons for the whole `AdminDetailSection`, e.g. „Upravit profil“, in its
 * `AdminDetailSectionHead`.
 */
export const AdminDetailSectionActions = ({ children, className }: Props) => (
  <div className={clsx(styles.actions, className)}>{children}</div>
)
