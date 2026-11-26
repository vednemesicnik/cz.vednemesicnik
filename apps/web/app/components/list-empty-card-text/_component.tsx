import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The sentence under an empty list's title (design 22e).
 *
 * @returns The sentence
 */
export const ListEmptyCardText = ({ children, className }: Props) => (
  <p className={clsx(styles.listEmptyCardText, className)}>{children}</p>
)
