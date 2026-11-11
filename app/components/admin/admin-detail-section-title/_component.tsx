import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The heading of an `AdminDetailSection`, e.g. „Údaje“.
 */
export const AdminDetailSectionTitle = ({ children }: Props) => (
  <h2 className={styles.title}>{children}</h2>
)
