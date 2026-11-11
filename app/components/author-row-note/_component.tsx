import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * A word after the name in an `AuthorRowText`: *vy* on one's own row, or the
 * author's role (24j, 28f).
 */
export const AuthorRowNote = ({ children }: Props) => (
  <span className={styles.note}>{children}</span>
)
