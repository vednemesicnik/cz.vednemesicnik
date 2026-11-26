import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/** One line of a `TableDetailsCell` (design 32). */
export const TableDetailsLine = ({ children }: Props) => (
  <span className={styles.line}>{children}</span>
)
