import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A second line under the name that a phone keeps, such as a user's e-mail
 * (28d): the folded row's second line (design 32f).
 */
export const TableNameNote = ({ children }: Props) => (
  <span className={styles.note}>{children}</span>
)
