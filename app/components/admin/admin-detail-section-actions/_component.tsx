import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * Buttons for the whole `AdminDetailSection`, e.g. „Upravit profil“, in its
 * `AdminDetailSectionHead`.
 */
export const AdminDetailSectionActions = ({ children }: Props) => (
  <div className={styles.actions}>{children}</div>
)
