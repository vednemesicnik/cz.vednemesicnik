import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The second line under the name that a phone leaves out (design 32,
 * k7d1vqm1): the record's address, a slug or a PDF file name (25a, 26a), or a
 * line the folded row's details repeat, such as an episode's platforms (27b,
 * 32d).
 */
export const TableNameAddress = ({ children }: Props) => (
  <span className={styles.address}>{children}</span>
)
