import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * A sign-in method's value in the user detail (design 28e): its state, and
 * under it the note in small type when there is one.
 *
 * @param props.children - `SignInMethodStatus`, then an optional
 *   `SignInMethodNote`.
 */
export const SignInMethod = ({ className, children }: Props) => (
  <span className={clsx(styles.method, className)}>{children}</span>
)
