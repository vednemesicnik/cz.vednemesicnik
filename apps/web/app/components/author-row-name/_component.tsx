import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The author's name in an `AuthorRowText`.
 */
export const AuthorRowName = ({ children, className }: Props) => (
  <span className={clsx(styles.name, className)}>{children}</span>
)
