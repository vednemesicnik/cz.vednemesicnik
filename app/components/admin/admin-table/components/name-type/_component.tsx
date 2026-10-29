import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The type of what a row names, in small print over the name, where one table
 * holds several types of content (design 21c). Only a folded row shows it: a
 * wider table gives the type a column of its own.
 */
export const TableNameType = ({ children }: Props) => (
  <span className={styles.type}>{children}</span>
)
