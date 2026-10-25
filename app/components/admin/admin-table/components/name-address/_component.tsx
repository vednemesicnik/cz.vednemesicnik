import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The record's address under its name: a slug, a PDF file name (25a, 26a).
 * A phone leaves it out (design 32, k7d1vqm1).
 */
export const TableNameAddress = ({ children }: Props) => (
  <span className={styles.address}>{children}</span>
)
