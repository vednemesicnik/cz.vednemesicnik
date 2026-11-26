import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A word after the name in an `AuthorRowText`: *vy* on one's own row, or the
 * author's role (24j, 28f).
 */
export const AuthorRowNote = ({ children, className }: Props) => (
  <span className={clsx(styles.note, className)}>{children}</span>
)
