import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The author's name in an `AuthorRowText`.
 */
export const AuthorRowName = ({ children }: Props) => (
  <span className={styles.name}>{children}</span>
)
