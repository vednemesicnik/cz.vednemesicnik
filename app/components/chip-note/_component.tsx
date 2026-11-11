import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A word after the `ChipLabel`, e.g. *archivovaný*.
 */
export const ChipNote = ({ children }: Props) => (
  <span className={styles.note}>{children}</span>
)
