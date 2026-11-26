import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The last sign-in attempts of an account, newest first (design 29a, 28e),
 * one `SignInAttemptsItem` each.
 *
 * @param props.children - The `SignInAttemptsItem`s, newest first
 * @returns The ordered list
 */
export const SignInAttempts = ({ children, className }: Props) => {
  return <ol className={clsx(styles.list, className)}>{children}</ol>
}
