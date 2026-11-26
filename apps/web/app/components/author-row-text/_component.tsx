import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The name of an `AuthorRow` and its notes, wrapping as one: on a narrow row
 * the note goes under the name, and the name breaks inside a word only when
 * it fits nowhere (28f).
 */
export const AuthorRowText = ({ children, className }: Props) => (
  <span className={clsx(styles.text, className)}>{children}</span>
)
