import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The title of an empty list's card (design 22e).
 *
 * @returns The title
 */
export const ListEmptyCardTitle = ({ children }: Props) => (
  <p className={styles.listEmptyCardTitle}>{children}</p>
)
