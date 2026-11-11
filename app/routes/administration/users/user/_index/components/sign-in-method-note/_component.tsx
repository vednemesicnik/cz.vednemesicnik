import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  className?: string
  children: ReactNode
}

/** A `SignInMethod`'s note under its state, in small type (28e). */
export const SignInMethodNote = ({ className, children }: Props) => (
  <span className={clsx(styles.note, className)}>{children}</span>
)
