import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * How a `SignInAttemptsItem` signed in, which may wrap, with a
 * `SignInAttemptsDetail` under it where there is one.
 *
 * @param props.children - The method's label, e.g. „Passkey“, and its detail
 * @returns The method's cell
 */
export const SignInAttemptsMethod = ({ children, className }: Props) => {
  return <span className={clsx(styles.method, className)}>{children}</span>
}
