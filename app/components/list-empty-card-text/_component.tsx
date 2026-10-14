import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The sentence under an empty list's title (design 22e).
 *
 * @returns The sentence
 */
export const ListEmptyCardText = ({ children }: Props) => (
  <p className={styles.listEmptyCardText}>{children}</p>
)
